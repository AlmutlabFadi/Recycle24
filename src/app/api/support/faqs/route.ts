import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const search = searchParams.get("search");

        const where: any = {
            center: "SUPPORT",
            status: "PUBLISHED"
        };

        if (category && category !== "all") {
            where.tags = {
                has: category
            };
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } }
            ];
        }

        const faqs = await db.knowledgeItem.findMany({
            where,
            orderBy: { priority: "desc" },
        });

        // Fallback or Initial Data if empty
        if (faqs.length === 0 && !search && (!category || category === "all")) {
             // If no FAQs in DB, return standard ones for UX
             return NextResponse.json({
                success: true,
                faqs: [
                    {
                        id: "faq_1",
                        title: "كيف أبيع خردة عبر المنصة؟",
                        content: "اختر 'بيع' من القائمة السفلية، ثم اتبع الخطوات: اختر المادة، حدد الوزن، اختر المحافظة، وقارن بين المشترين."
                    },
                    {
                        id: "faq_2",
                        title: "ما هي طرق الدفع المتاحة؟",
                        content: "نحن ندعم الدفع عبر المحفظة الإلكترونية، التحويل البنكي، أو الدفع النقدي عند الاستلام."
                    },
                    {
                        id: "faq_3",
                        title: "كيف أحصل على شارة التاجر الموثق؟",
                        content: "قم بتوثيق حسابك عبر إرسال صور الهوية الشخصية والسجل التجاري من خلال قسم 'التحقق'."
                    }
                ]
            });
        }

        return NextResponse.json({
            success: true,
            faqs: faqs.map(f => ({
                id: f.id,
                title: f.title,
                content: f.content || f.summary,
                tags: f.tags
            })),
        });
    } catch (error) {
        console.error("Get FAQs error:", error);
        return NextResponse.json(
            { error: "حدث خطأ أثناء جلب الأسئلة الشائعة" },
            { status: 500 }
        );
    }
}
