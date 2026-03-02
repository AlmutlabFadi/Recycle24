import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                { error: "معرف المستخدم مطلوب" },
                { status: 400 }
            );
        }

        // Check Trader
        const trader = await db.trader.findUnique({
            where: { userId },
            include: {
                documents: true,
            },
        });

        if (trader) {
            return NextResponse.json({
                success: true,
                trader,
                verificationStatus: trader.verificationStatus,
            });
        }

        // Check Driver
        const driver = await db.driver.findUnique({
            where: { userId },
            include: {
                documents: true,
                vehicles: true
            },
        });

        if (driver) {
            return NextResponse.json({
                success: true,
                trader: {
                    ...driver,
                    isDriver: true
                },
                verificationStatus: (driver as any).status || (driver as any).verificationStatus || "PENDING",
            });
        }

        // Also check if user is a standard CLIENT with an active verification process if needed
        // For now, return NOT_STARTED if neither found
        return NextResponse.json({
            success: true,
            trader: null,
            verificationStatus: "NOT_STARTED",
        });
    } catch (error) {
        console.error("Get verification error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب بيانات التوثيق" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            userId, 
            businessName, 
            licenseNumber, 
            location, 
            licensePlate, 
            vehicleType, 
            vehicleColor, 
            governorate,
            // New trader fields
            taxNumber,
            registrationNumber,
            issueDate,
            expiryDate,
            chamberRegistrationNumber,
            chamberSerialNumber,
            chamberMembershipYear,
            // Personal fields
            fatherName,
            motherName,
            dateOfBirth
        } = body;

        const finalBusinessName = businessName || (vehicleType ? `مركبة: ${vehicleType} - ${vehicleColor}` : null);
        const finalLicenseNumber = licenseNumber || licensePlate;
        const finalLocation = location || governorate;

        if (!userId || !finalBusinessName) {
            return NextResponse.json(
                { error: "جميع الحقول الأساسية مطلوبة" },
                { status: 400 }
            );
        }

        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, isVerified: true, userType: true, role: true, name: true, phone: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: "هذا الحساب لم يعد موجوداً في قاعدة البيانات. الرجاء تسجيل الخروج من النظام ثم تسجيل الدخول مرة أخرى." },
                { status: 404 }
            );
        }

        // Check for duplicate submissions - prevent re-submission if already pending/under_review/approved
        const existingTrader = await db.trader.findUnique({ where: { userId } });
        const existingDriver = await db.driver.findUnique({ where: { userId } });
        
        if (existingTrader) {
            const currentStatus = existingTrader.verificationStatus;
            if (currentStatus === "PENDING" || currentStatus === "UNDER_REVIEW") {
                return NextResponse.json(
                    { error: "لديك طلب توثيق قيد المعالجة بالفعل. يرجى انتظار نتيجة المراجعة.", alreadySubmitted: true },
                    { status: 409 }
                );
            }
            if (currentStatus === "APPROVED") {
                return NextResponse.json(
                    { error: "حسابك موثق بالفعل!", alreadyVerified: true },
                    { status: 409 }
                );
            }
            // REJECTED status: allow re-submission (will update existing record below)
        }
        
        if (existingDriver) {
            const currentStatus = (existingDriver as any).status;
            if (currentStatus === "PENDING" || currentStatus === "UNDER_REVIEW") {
                return NextResponse.json(
                    { error: "لديك طلب توثيق قيد المعالجة بالفعل. يرجى انتظار نتيجة المراجعة.", alreadySubmitted: true },
                    { status: 409 }
                );
            }
            if (currentStatus === "VERIFIED" || currentStatus === "APPROVED") {
                return NextResponse.json(
                    { error: "حسابك موثق بالفعل!", alreadyVerified: true },
                    { status: 409 }
                );
            }
        }

        const effectiveType = body.userType || user.userType || user.role;
        const isDriver = effectiveType === "DRIVER";
        const isTrader = effectiveType === "TRADER";

        let resultData;

        if (isDriver) {
            // Handle Driver Verification
            const driverData = {
                fullName: body.name || user.name || "سائق جديد",
                phone: user.phone || body.phone || "0000000000",
                city: governorate || location || null,
                status: "PENDING" as any,
            };

            const existingDriver = await db.driver.findUnique({ where: { userId } });
            
            if (existingDriver) {
                resultData = await db.driver.update({
                    where: { userId },
                    data: driverData,
                });
            } else {
                resultData = await db.driver.create({
                    data: {
                        userId,
                        ...driverData,
                    },
                });
            }

            // Also handle vehicle if provided
            if (licensePlate || vehicleType) {
                const existingVehicle = await db.vehicle.findFirst({ where: { driverId: resultData.id } });
                const vehiclePayload = {
                    plateNumber: licensePlate || "---",
                    make: vehicleType || null,
                    color: vehicleColor || null,
                };
                if (existingVehicle) {
                    await db.vehicle.update({ where: { id: existingVehicle.id }, data: vehiclePayload });
                } else {
                    await db.vehicle.create({ data: { driverId: resultData.id, ...vehiclePayload } });
                }
            }
        } else {
            // Default to Trader or Handle as Trader for common business fields
            const traderData = {
                businessName: finalBusinessName,
                licenseNumber: finalLicenseNumber,
                location: finalLocation,
                taxNumber: taxNumber || undefined,
                registrationNumber: registrationNumber || undefined,
                governorate: governorate || (location && !isTrader ? location : undefined),
                issueDate: issueDate ? new Date(issueDate) : undefined,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
                chamberRegistrationNumber: chamberRegistrationNumber || undefined,
                chamberSerialNumber: chamberSerialNumber || undefined,
                chamberMembershipYear: chamberMembershipYear ? parseInt(chamberMembershipYear) : undefined,
                fatherName: fatherName || undefined,
                motherName: motherName || undefined,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                verificationStatus: "PENDING",
                rejectionReason: null,
                missingDocuments: [],
            };

            const existingTrader = await db.trader.findUnique({ where: { userId } });

            if (existingTrader) {
                resultData = await db.trader.update({
                    where: { userId },
                    data: traderData,
                });
            } else {
                resultData = await db.trader.create({
                    data: {
                        userId,
                        ...traderData,
                    },
                });
            }
        }

            await db.user.update({
                where: { id: userId },
                data: { status: "PENDING" },
            });

        return NextResponse.json({
            success: true,
            trader: isDriver ? null : resultData,
            driver: isDriver ? resultData : null,
            message: "تم إرسال طلب التوثيق بنجاح، سيتم مراجعته خلال 24-48 ساعة",
        });
    } catch (error) {
        console.error("Create verification error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء إرسال طلب التوثيق", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { traderId, documentType, fileUrl } = body;

        if (!traderId || !documentType || !fileUrl) {
            return NextResponse.json(
                { error: "جميع الحقول مطلوبة" },
                { status: 400 }
            );
        }

        const document = await db.traderDocument.create({
            data: {
                traderId,
                type: documentType,
                fileUrl,
                status: "PENDING",
            },
        });

        return NextResponse.json({
            success: true,
            document,
            message: "تم رفع المستند بنجاح",
        });
    } catch (error) {
        console.error("Upload document error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء رفع المستند" },
            { status: 500 }
        );
    }
}
