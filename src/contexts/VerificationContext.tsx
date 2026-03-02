"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface VerificationData {
    // Personal Info
    firstName: string;
    lastName: string;
    fatherName: string;
    motherName: string;
    dateOfBirth: string;

    // Documents (URLs)
    frontImages: string[];
    backImages: string[];
    traderRegDocs: string[];
    chamberRegDocs: string[];
    licenseImages: string[];
    vehicleRegImages: string[];
    warehouseImage: string | null;

    // Business Info (Trader)
    businessName: string;
    taxId: string;
    registrationNumber: string;
    issueDate: string;
    expiryDate: string;
    chamberRegistrationNumber: string;
    chamberSerialNumber: string;
    chamberMembershipYear: string;

    // Client/Driver Info
    licensePlate: string;
    vehicleType: string;
    vehicleColor: string;
    governorate: string;

    // Location Info
    address: string;
    openTime: string;
    closeTime: string;
}

interface VerificationContextType {
    data: VerificationData;
    updateData: (newData: Partial<VerificationData>) => void;
    submitVerification: (targetRole: string) => Promise<boolean>;
    isSubmitting: boolean;
}

const defaultData: VerificationData = {
    firstName: "",
    lastName: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    frontImages: [],
    backImages: [],
    traderRegDocs: [],
    chamberRegDocs: [],
    licenseImages: [],
    vehicleRegImages: [],
    warehouseImage: null,
    businessName: "",
    taxId: "",
    registrationNumber: "",
    issueDate: "",
    expiryDate: "",
    chamberRegistrationNumber: "",
    chamberSerialNumber: "",
    chamberMembershipYear: new Date().getFullYear().toString(),
    licensePlate: "",
    vehicleType: "",
    vehicleColor: "",
    governorate: "دمشق",
    address: "دمشق، المنطقة الصناعية، شارع 5",
    openTime: "08:00",
    closeTime: "18:00",
};

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export function VerificationProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<VerificationData>(defaultData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const { addToast } = useToast();

    const updateData = useCallback((newData: Partial<VerificationData>) => {
        setData((prev) => {
            // Check if there's actually a change to avoid unnecessary updates
            const hasChange = Object.entries(newData).some(([key, value]) => 
                JSON.stringify(prev[key as keyof VerificationData]) !== JSON.stringify(value)
            );
            if (!hasChange) return prev;
            return { ...prev, ...newData };
        });
    }, []);

    const submitVerification = useCallback(async (targetRole: string) => {
        if (!isAuthenticated || !user) {
            addToast("يجب تسجيل الدخول أولاً", "error");
            return false;
        }

        setIsSubmitting(true);
        try {
            const isTrader = targetRole === "TRADER";
            const isDriver = targetRole === "DRIVER";

            // 1. Submit Main Info
            const response = await fetch("/api/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isTrader ? {
                    userId: user.id,
                    businessName: data.businessName,
                    taxNumber: data.taxId,
                    registrationNumber: data.registrationNumber,
                    governorate: data.governorate,
                    issueDate: data.issueDate,
                    expiryDate: data.expiryDate,
                    chamberRegistrationNumber: data.chamberRegistrationNumber,
                    chamberSerialNumber: data.chamberSerialNumber,
                    chamberMembershipYear: data.chamberMembershipYear,
                    location: data.address,
                    fatherName: data.fatherName,
                    motherName: data.motherName,
                    dateOfBirth: data.dateOfBirth
                } : {
                    userId: user.id,
                    userType: isDriver ? "DRIVER" : undefined,
                    name: `${data.firstName} ${data.lastName}`.trim(),
                    licensePlate: data.licensePlate,
                    vehicleType: data.vehicleType,
                    vehicleColor: data.vehicleColor,
                    governorate: data.governorate,
                    location: data.address,
                    fatherName: data.fatherName,
                    motherName: data.motherName,
                    dateOfBirth: data.dateOfBirth
                }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "فشل إرسال طلب التوثيق");

            const hashString = async (value: string) => {
                const encoder = new TextEncoder();
                const dataBytes = encoder.encode(value);
                const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
                return Array.from(new Uint8Array(hashBuffer))
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");
            };

            if (isDriver) {
                const driverId = result.driver?.id;
                if (!driverId) throw new Error("تعذر إنشاء ملف السائق");

                const uploadDriverDoc = async (type: string, url: string) => {
                    const fileSha256 = await hashString(url);
                    const res = await fetch("/api/driver/documents", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type, fileUrl: url, fileSha256 }),
                    });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error || "تعذر رفع مستند السائق");
                    }
                };

                for (const url of data.frontImages) await uploadDriverDoc("ID_CARD", url);
                for (const url of data.backImages) await uploadDriverDoc("ID_CARD", url);
                for (const url of data.licenseImages) await uploadDriverDoc("LICENSE", url);
                for (const url of data.vehicleRegImages) await uploadDriverDoc("VEHICLE_REG", url);
            } else {
                const traderId = result.trader.id;

                const uploadDoc = async (type: string, url: string) => {
                    await fetch("/api/verification", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ traderId, documentType: type, fileUrl: url }),
                    });
                };

                for (const url of data.frontImages) await uploadDoc("IDENTITY_FRONT", url);
                for (const url of data.backImages) await uploadDoc("IDENTITY_BACK", url);

                if (isTrader) {
                    for (const url of data.traderRegDocs) await uploadDoc("TRADER_REGISTRATION", url);
                    for (const url of data.chamberRegDocs) await uploadDoc("CHAMBER_MEMBERSHIP", url);
                    for (const url of data.licenseImages) await uploadDoc("BUSINESS_LICENSE", url);
                } else {
                    for (const url of data.licenseImages) await uploadDoc("DRIVING_LICENSE", url);
                }

                if (data.warehouseImage) {
                    await uploadDoc("LOCATION_PROOF", data.warehouseImage);
                }
            }

            addToast("تم إرسال طلب التوثيق بنجاح! سيتم مراجعته قريباً", "success");
            return true;
        } catch (error: any) {
            addToast(error.message || "حدث خطأ غير متوقع", "error");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [isAuthenticated, user, data, addToast]);

    return (
        <VerificationContext.Provider value={{ data, updateData, submitVerification, isSubmitting }}>
            {children}
        </VerificationContext.Provider>
    );
}

export function useVerification() {
    const context = useContext(VerificationContext);
    if (!context) {
        throw new Error("useVerification must be used within a VerificationProvider");
    }
    return context;
}
