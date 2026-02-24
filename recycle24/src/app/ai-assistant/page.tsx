"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { allMaterials, materialCategories, Material } from "@/data/materials";

// --- Mock Data & Types ---

type UserType = "merchant" | "user";

interface UserContext {
    name: string;
    type: UserType;
    companyName?: string;
    city: string;
}

// Simulated Logged In User
const CURRENT_USER: UserContext = {
    name: "أحمد محمد",
    type: "merchant",
    companyName: "شركة الوفاء للمعادن",
    city: "دمشق"
};

interface Message {
    id: string;
    type: "text" | "prices" | "auction_list" | "merchant_card" | "price_deal" | "danger_alert" | "image_analysis";
    sender: "bot" | "user";
    content?: string;
    timestamp: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    image?: string; // For user uploaded images
}

const MOCK_AUCTIONS = [
    { id: 1, title: "مزاد كابلات نحاسية", location: "المنطقة الصناعية - دمشق", status: "مفتوح", timeLeft: "يومين" },
    { id: 2, title: "سكراب حديد تسليح", location: "ريف دمشق - عدرا", status: "مفتوح", timeLeft: "5 ساعات" },
    { id: 3, title: "بطاريات تالفة", location: "حلب - الشيخ نجار", status: "قريب", timeLeft: "يبدأ غداً" },
    { id: 4, title: "ألمنيوم خام", location: "حمص - المدينة الصناعية", status: "مفتوح", timeLeft: "3 أيام" },
    { id: 5, title: "معدات ثقيلة", location: "اللاذقية", status: "قريب", timeLeft: "قريباً" },
];

const MOCK_MERCHANTS = [
    { id: 101, name: "مؤسسة البركة", location: "دمشق - القدم", rating: 4.8, distance: "2.5 كم" },
    { id: 102, name: "شركة النور للمعادن", location: "ريف دمشق - صحنايا", rating: 4.5, distance: "15 كم" },
    { id: 103, name: "تجار حلب المتحدون", location: "حلب", rating: 4.9, distance: "350 كم" },
];

// 1. COMPREHENSIVE PRICE LIST FOR ALL MATERIALS
// Generate mock prices for all materials in the system
const FULL_MOCK_PRICES: Record<string, { price: number; merchantId: number; city: string }[]> = {};

allMaterials.forEach(mat => {
    // Generate 3 mock prices for each material
    const base = mat.basePrice || 1000;
    FULL_MOCK_PRICES[mat.id] = [
        { price: base + 500, merchantId: 101, city: "دمشق" },
        { price: base + 200, merchantId: 102, city: "ريف دمشق" },
        { price: base + 800, merchantId: 103, city: "حلب" }
    ];
});

// 2. GENERAL KNOWLEDGE BASE
const KNOWLEDGE_BASE = [
    {
        keywords: ["مشروع", "منصة", "تطبيق", "ما هو", "عن ماذا"],
        response: "منصة **Metalix24** هي أول منصة رقمية متكاملة لتجارة وإعادة تدوير الخردة في المنطقة. نهدف لربط التجار بالأفراد والشركات، توفير أسعار لحظية، وضمان صفقات آمنة وموثقة."
    },
    {
        keywords: ["تدريب", "أكاديمية", "دورة", "تعليم", "شهادة"],
        response: "أكاديمية **Metalix24** تقدم دورات تخصصية في:\n- 🎓 تصنيف المعادن وفحص جودتها.\n- 💼 إدارة المزادات والتسعير.\n- 🛡️ إجراءات السلامة في التعامل مع الخردة.\nيمكنك زيارة قسم 'أكاديمية التدريب' في ملفك الشخصي للتسجيل."
    },
    {
        keywords: ["سلامة", "وقاية", "خطر", "تحذير", "إرشادات"],
        response: "⚠️ **إرشادات السلامة العامة:**\n1. ارتدِ دائماً قفازات واقية وأحذية سلامة.\n2. تأكد من خلو الخردة من المواد الكيميائية أو المتفجرة.\n3. لا تقم بحرق الكابلات أو البطاريات.\n4. في حال الشك بأي جسم غريب، ابتعد فوراً واستخدم زر **'الإبلاغ الفوري'**."
    },
    {
        keywords: ["بورصة", "سوق", "أسهم", "تداول", "عالمي"],
        response: "📊 **مؤشرات السوق العالمية (مباشر):**\n- 🟢 النحاس (LME): $9,500/طن (+1.2%)\n- 🔴 الألمنيوم: $2,400/طن (-0.5%)\n- 🟢 الحديد الخام: $120/طن (+0.8%)\nالأسعار المحلية تتأثر بهذه المؤشرات، لذا ننصحك بمتابعة التحديثات اليومية."
    },
    {
        keywords: ["عملة", "صرف", "دولار", "يورو", "تحويل"],
        response: "💱 **أسعار الصرف التقريبية (لأغراض التسعير):**\n- 🇺🇸 1 دولار = 14,500 ل.س\n- 🇪🇺 1 يورو = 15,800 ل.س\nيرجى الانتباه أن هذه الأسعار استرشادية وقد تختلف عن السوق الموازي."
    }
];

// Dangerous keywords mapping
const DANGER_KEYWORDS = [
    "مخلفات حرب", "قذيفة", "لغم", "متفجرات", "رصاصة", "صاروخ", "عبوة",
    "كيميائي", "مشع", "نووي", "سام", "برميل غريب", "اسطوانة غاز مجهولة",
    "war remnants", "explosive", "mine", "shell", "bomb", "chemical", "radioactive"
];

// --- NLP Helper Functions ---

function cleanText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, "") // Remove special chars
        .replace(/\s+/g, " ") // Collapse spaces
        .replace(/ال(\S+)/g, "$1") // Remove definite article "ال" lightly (naive)
        .replace(/ة\b/g, "ه") // Normalize Taa Marbuta
        .trim();
}

function findMaterialMatch(text: string): Material | null {
    const cleanedInput = cleanText(text);

    // 1. Direct match with ID or Name
    const match = allMaterials.find(m =>
        cleanedInput.includes(cleanText(m.name)) ||
        cleanText(m.name).includes(cleanedInput)
    );
    if (match) return match;

    // 2. Category Match
    const categoryEntry = Object.entries(materialCategories).find(([, label]) =>
        cleanedInput.includes(cleanText(label))
    );

    if (categoryEntry) {
        // Return the first material of this category as a representative, or a generic placeholder
        return allMaterials.find(m => m.category === categoryEntry[0]) || null;
    }

    return null;
}

// --- UI Components ---

const ScrollableContainer = ({ children }: { children: React.ReactNode }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 200;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="relative group/scroll px-1">
            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-700 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 opacity-0 group-hover/scroll:opacity-100 transition-opacity disabled:opacity-0"
            >
                <span className="material-symbols-outlined !text-[20px]">chevron_right</span>
            </button>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-2 px-1 no-scrollbar scroll-smooth snap-x"
            >
                {children}
            </div>

            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-700 p-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
            >
                <span className="material-symbols-outlined !text-[20px]">chevron_left</span>
            </button>
        </div>
    );
};

export default function AIAssistantPage() {
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [dangerMode, setDangerMode] = useState(false);

    // Initial Greeting using User Name
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            type: "text",
            sender: "bot",
            content: `مرحباً بك يا ${CURRENT_USER.type === 'merchant' ? `السيد ${CURRENT_USER.name} من ${CURRENT_USER.companyName}` : CURRENT_USER.name} 👋. أنا مساعدك الذكي في Metalix24.
أنا هنا للإجابة عن **كل شيء**!
جرب سؤالي عن:
• 💰 أسعار أي نوع خردة (محركات، كرتون، نحاس...)
• 📈 البورصة وأسعار العملات
• 🛡️ السلامة وإجراءات الخطر
• 🎓 التدريب والأكاديمية`,
            timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        },
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        processUserMessage(inputValue);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simulate image upload message
        const imageUrl = URL.createObjectURL(file);
        const userMsg: Message = {
            id: Date.now().toString(),
            type: "text",
            sender: "user",
            content: "تم رفع صورة...",
            image: imageUrl,
            timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate Image Analysis
        setTimeout(() => {
            setIsTyping(false);

            // Randomly decide if safe or dangerous for demo purposes (or based on file name if possible)
            const isDifferent = file.name.includes("danger") || Math.random() > 0.8;

            if (isDifferent) {
                setDangerMode(true);
                const botMsg: Message = {
                    id: Date.now().toString(),
                    type: "danger_alert",
                    sender: "bot",
                    content: "تحذير: تم اكتشاف جسم مشبوه في الصورة!",
                    timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
                };
                setMessages(prev => [...prev, botMsg]);
            } else {
                const botMsg: Message = {
                    id: Date.now().toString(),
                    type: "image_analysis",
                    sender: "bot",
                    content: "يبدو أن الصورة تحتوي على **نحاس أحمر مخلط**. هل تريد معرفة أفضل سعر له؟",
                    data: {
                        topMatch: "نحاس أحمر مخلط",
                        confidence: "94%",
                        suggestedAction: "check_price"
                    },
                    timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
                };
                setMessages(prev => [...prev, botMsg]);

                // Follow up with price offer
                setTimeout(() => {
                    const priceMsg: Message = {
                        id: (Date.now() + 100).toString(),
                        type: "price_deal",
                        sender: "bot",
                        data: {
                            material: "نحاس",
                            price: 25000,
                            city: "دمشق",
                            merchant: MOCK_MERCHANTS[0]
                        },
                        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
                    };
                    setMessages(prev => [...prev, priceMsg]);
                }, 1000);
            }
        }, 2000);
    };

    const processUserMessage = (text: string) => {
        const newUserMessage: Message = {
            id: Date.now().toString(),
            type: "text",
            sender: "user",
            content: text,
            timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setInputValue("");
        setIsTyping(true);

        const lowerInput = text.toLowerCase();
        const cleanedInput = cleanText(text);

        // --- 1. CRITICAL SAFETY CHECK ---
        const isDangerous = DANGER_KEYWORDS.some(keyword => lowerInput.includes(keyword));

        setTimeout(() => {
            setIsTyping(false);
            const botResponses: Message[] = [];
            const timestamp = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

            if (isDangerous) {
                setDangerMode(true);
                botResponses.push({
                    id: Date.now().toString(),
                    type: "danger_alert",
                    sender: "bot",
                    content: "⚠️ **تحذير أمني عاجل!**\n\nتم رصد كلمات تشير إلى مواد خطرة أو مخلفات حرب. يرجى توخي الحذر الشديد.",
                    timestamp
                });
            } else {
                // Determine Intent Prioritized

                // A. KNOWLEDGE BASE CHECK (Questions about Project, Stock, Training)
                let kbMatch = null;
                for (const kb of KNOWLEDGE_BASE) {
                    if (kb.keywords.some(k => cleanedInput.includes(k))) {
                        kbMatch = kb.response;
                        break;
                    }
                }

                if (kbMatch) {
                    botResponses.push({
                        id: Date.now().toString(),
                        type: "text",
                        sender: "bot",
                        content: kbMatch,
                        timestamp
                    });
                }

                // B. MATERIAL PRICE CHECK
                else if (cleanedInput.includes("سعر") || cleanedInput.includes("بكم") || cleanedInput.includes("اسعار")) {
                    const foundMaterial = findMaterialMatch(text);

                    if (foundMaterial) {
                        const priceKey = foundMaterial.id;
                        const priceList = FULL_MOCK_PRICES[priceKey];

                        if (priceList) {
                            // Find best price logic
                            let targetCity = "";
                            if (cleanedInput.includes("دمشق")) targetCity = "دمشق";
                            else if (cleanedInput.includes("حلب")) targetCity = "حلب";

                            let bestDeal: { price: number; merchantId: number; city: string } | undefined;
                            if (targetCity) {
                                const filtered = priceList.filter(p => p.city.includes(targetCity));
                                bestDeal = filtered.length > 0 
                                    ? filtered.reduce((max, p) => p.price > max.price ? p : max, filtered[0])
                                    : undefined;
                            } else {
                                bestDeal = priceList.reduce((max, p) => p.price > max.price ? p : max, priceList[0]);
                            }

                            if (bestDeal && bestDeal.price > 0) {
                                const merchant = MOCK_MERCHANTS.find(m => m.id === bestDeal.merchantId);
                                botResponses.push({
                                    id: Date.now().toString(),
                                    type: "price_deal",
                                    sender: "bot",
                                    data: {
                                        material: foundMaterial.name,
                                        price: bestDeal.price,
                                        city: bestDeal.city,
                                        merchant
                                    },
                                    timestamp
                                });
                            }
                        }
                    } else {
                        botResponses.push({
                            id: Date.now().toString(),
                            type: "text",
                            sender: "bot",
                            content: "يرجى تحديد نوع المادة بدقة أكثر. هل تقصد (حديد، نحاس، بطاريات، كرتون، محركات...)؟",
                            timestamp
                        });
                    }
                }

                // C. AUCTIONS
                else if (cleanedInput.includes("مزاد")) {
                    const isNearby = cleanedInput.includes("قريب");
                    const filteredAuctions = isNearby
                        ? MOCK_AUCTIONS.filter(a => a.location.includes(CURRENT_USER.city))
                        : MOCK_AUCTIONS;

                    botResponses.push({
                        id: Date.now().toString(),
                        type: "text",
                        sender: "bot",
                        content: `إليك ${isNearby ? 'المزادات القريبة منك' : 'أحدث المزادات المفتوحة'} التي وجدتها:`,
                        timestamp
                    });

                    botResponses.push({
                        id: (Date.now() + 1).toString(),
                        type: "auction_list",
                        sender: "bot",
                        data: filteredAuctions,
                        timestamp
                    });
                }

                // D. MERCHANTS
                else if (cleanedInput.includes("تاجر") || cleanedInput.includes("تجار")) {
                    const nearest = MOCK_MERCHANTS[0];
                    botResponses.push({
                        id: Date.now().toString(),
                        type: "text",
                        sender: "bot",
                        content: "وجدت لك أقرب تاجر موثوق في منطقتك:",
                        timestamp
                    });
                    botResponses.push({
                        id: (Date.now() + 1).toString(),
                        type: "merchant_card",
                        sender: "bot",
                        data: nearest,
                        timestamp
                    });
                }

                // E. GREETINGS (Low priority)
                else if (cleanedInput.includes("مرحبا") || cleanedInput.includes("هلا") || cleanedInput.includes("السلام")) {
                    botResponses.push({
                        id: Date.now().toString(),
                        type: "text",
                        sender: "bot",
                        content: `أهلاً بك! جاهز للإجابة عن أسعار الخردة، البورصة، السلامة، وكل ما يخص المنصة.`,
                        timestamp
                    });
                }

                // F. FALLBACK
                else {
                    botResponses.push({
                        id: Date.now().toString(),
                        type: "text",
                        sender: "bot",
                        content: "لم أفهم تماماً. يمكنك سؤالي عن:\n- 💰 سعر [اسم المادة]\n- 📊 أسعار البورصة والعملات\n- 🎓 دورات التدريب\n- 🛡️ إجراءات السلامة",
                        timestamp
                    });
                }
            }

            setMessages((prev) => [...prev, ...botResponses]);

        }, 1200);
    };

    const handleQuickAction = (action: string) => {
        setInputValue(action);
        if (action.includes("سعر") || action.includes("مزاد") || action.includes("تاجر")) {
            processUserMessage(action);
        }
    };

    return (
        <div className={`flex flex-col h-screen max-w-md mx-auto overflow-hidden font-display transition-colors duration-500 ${dangerMode ? 'bg-red-950' : 'bg-bg-light dark:bg-bg-dark'}`}>

            {/* Danger Overlay / Header */}
            {dangerMode && (
                <div className="bg-red-600 text-white p-4 animate-pulse flex items-center justify-between z-50 shadow-2xl">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined !text-[32px] animate-bounce">warning</span>
                        <div>
                            <h2 className="font-bold text-lg leading-tight">وضع الطوارئ مفعل</h2>
                            <p className="text-xs text-red-100">تم رصد تهديد محتمل</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            // In real app: Open camera/dial 112
                            alert("جاري الاتصال بفرق الهندسة العسكرية...");
                        }}
                        className="bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-50"
                    >
                        إبلاغ فوري
                    </button>
                    <button onClick={() => setDangerMode(false)} className="absolute top-2 left-2 opacity-50 hover:opacity-100">
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>
            )}

            {/* Top App Bar (Hidden in Danger Mode usually, but keeping adapted) */}
            <header className={`flex items-center justify-between px-4 py-3 border-b shadow-sm shrink-0 z-10 transition-colors ${dangerMode ? 'bg-red-900 border-red-800' : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className={`flex items-center justify-center p-2 rounded-full transition ${dangerMode ? 'text-red-200 hover:bg-red-800' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'}`}
                    >
                        <span className="material-symbols-outlined !text-[24px]">arrow_forward</span>
                    </button>
                    <div className="relative">
                        <div className={`size-10 rounded-full p-0.5 ${dangerMode ? 'bg-red-500 animate-ping' : 'bg-gradient-to-br from-primary to-blue-600'}`}>
                            <div className={`w-full h-full rounded-full flex items-center justify-center ${dangerMode ? 'bg-red-900' : 'bg-surface-dark'}`}>
                                <span className={`material-symbols-outlined !text-[24px] ${dangerMode ? 'text-white' : 'text-primary'}`}>
                                    {dangerMode ? 'gpp_bad' : 'smart_toy'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className={`text-base font-bold leading-tight ${dangerMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                            {dangerMode ? 'تحذير السلامة' : 'المساعد الذكي'}
                        </h1>
                        <p className={`text-xs font-medium ${dangerMode ? 'text-red-300' : 'text-primary'}`}>
                            {dangerMode ? '⚠️ منطقة خطر' : 'متصل الآن'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xs font-bold transition-colors"
                >
                    إنهاء
                </button>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">
                {/* Timestamp */}
                <div className="flex justify-center my-2">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${dangerMode ? 'text-red-200 bg-red-900 border-red-800' : 'text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
                        اليوم {new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-end gap-2 max-w-[95%] group ${msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"}`}
                    >
                        {/* Avatar */}
                        <div className={`size-8 shrink-0 mb-1 rounded-full flex items-center justify-center overflow-hidden border ${dangerMode && msg.sender === 'bot' ? 'bg-red-700 border-red-500' : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                            {msg.sender === 'bot' ? (
                                <span className={`material-symbols-outlined !text-[18px] ${dangerMode ? 'text-white' : 'text-primary'}`}>
                                    {msg.type === 'danger_alert' ? 'warning' : 'smart_toy'}
                                </span>
                            ) : (
                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 !text-[18px]">person</span>
                            )}
                        </div>

                        <div className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : "items-start"} w-full min-w-0`}>

                            {/* Text Message */}
                            {msg.type === "text" && (
                                <div className={`px-4 py-3 rounded-2xl shadow-sm border ${msg.sender === "user"
                                    ? "bg-primary text-white rounded-tl-sm border-primary"
                                    : dangerMode
                                        ? "bg-red-800 text-white border-red-700"
                                        : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tr-sm border-slate-200 dark:border-slate-700 font-medium"
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    {msg.image && (
                                        <div className="mt-2 rounded-lg overflow-hidden border border-white/20">
                                            <img src={msg.image} alt="User Upload" className="w-full h-auto object-cover max-h-48" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DANGER ALERT CARD */}
                            {msg.type === "danger_alert" && (
                                <div className="w-full bg-red-600 text-white rounded-xl border-2 border-red-400 shadow-xl p-5 animate-pulse-slow relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <span className="material-symbols-outlined !text-[120px] text-black">gpp_bad</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-white text-red-600 p-2 rounded-full animate-bounce">
                                                <span className="material-symbols-outlined !text-[24px]">warning</span>
                                            </div>
                                            <h3 className="font-black text-xl">تحذير: خطر شديد!</h3>
                                        </div>
                                        <p className="text-sm font-bold mb-4 leading-relaxed">
                                            الجسم الذي تحاول التعامل معه قد يكون من <u>مخلفات الحرب</u> أو <u>مواد كيميائية خطرة</u>.
                                        </p>
                                        <div className="bg-red-800/50 rounded-lg p-3 mb-4 border border-red-400/30">
                                            <p className="font-bold text-xs mb-2">تعليمات السلامة الفورية:</p>
                                            <ul className="list-disc list-inside text-xs space-y-1">
                                                <li>لا تلمس الجسم أو تحركه نهائياً.</li>
                                                <li>ابتعد عن المكان لمسافة لا تقل عن 50 متر.</li>
                                                <li>حذر الأشخاص المحيطين بك.</li>
                                                <li>قم بالإبلاغ فوراً.</li>
                                            </ul>
                                        </div>
                                        <button className="w-full bg-white text-red-700 font-extrabold py-3 rounded-lg hover:bg-red-50 transition shadow-lg flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">camera_alt</span>
                                            فتح الكاميرا للإبلاغ
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Image Analysis Result */}
                            {msg.type === "image_analysis" && msg.data && (
                                <div className="w-64 bg-slate-800 text-white rounded-xl border border-slate-600 shadow-md p-4">
                                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">image_search</span>
                                        تحليل الصورة
                                    </h4>
                                    <div className="bg-white/5 rounded-lg p-3 mb-3 border border-white/10">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-slate-300">النتيجة:</span>
                                            <span className="text-sm font-bold text-white">{msg.data.topMatch}</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: msg.data.confidence }}></div>
                                        </div>
                                        <p className="text-[10px] text-right mt-1 text-green-400">دقة {msg.data.confidence}</p>
                                    </div>
                                    <p className="text-xs text-slate-300 mb-0">{msg.content}</p>
                                </div>
                            )}


                            {/* Price Deal Card (High Contrast) */}
                            {msg.type === "price_deal" && msg.data && (
                                <div className="w-64 bg-slate-900 rounded-xl border border-slate-700 shadow-lg p-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <span className="material-symbols-outlined !text-[100px] text-white">sell</span>
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                أفضل سعر
                                            </span>
                                            <span className="text-xs text-slate-300 font-bold">{msg.data.city}</span>
                                        </div>
                                        <div className="text-center mb-4 bg-slate-800 rounded-lg p-3 border border-slate-700">
                                            <p className="text-slate-400 text-xs mb-1 font-bold">سعر {msg.data.material} اليوم</p>
                                            <h2 className="text-3xl font-black text-white font-english tracking-tight">
                                                {msg.data.price.toLocaleString()} <span className="text-sm text-primary font-bold">ل.س</span>
                                            </h2>
                                        </div>

                                        {/* Linked Merchant */}
                                        {msg.data.merchant && (
                                            <div className="bg-slate-800 rounded-lg p-3 flex items-center justify-between mb-3 border border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold border border-slate-600">
                                                        {msg.data.merchant.name[0]}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs text-white font-bold line-clamp-1">{msg.data.merchant.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">التاجر المعتمد</p>
                                                    </div>
                                                </div>
                                                <Link href={`/chat/${msg.data.merchant.id}`} className="text-primary hover:text-white transition">
                                                    <span className="material-symbols-outlined !text-[22px]">chat</span>
                                                </Link>
                                            </div>
                                        )}
                                        <button className="w-full py-3 bg-primary rounded-lg text-white text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                            تثبيت السعر وحجز صفقة
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Merchant Card */}
                            {msg.type === "merchant_card" && msg.data && (
                                <div className="w-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                            <span className="material-symbols-outlined">store</span>
                                        </div>
                                        <div>
                                            <h4 className="text-slate-900 dark:text-white font-bold text-sm">{msg.data.name}</h4>
                                            <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                                <span className="material-symbols-outlined !text-[16px] filled">star</span>
                                                {msg.data.rating}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined !text-[16px]">location_on</span>
                                            {msg.data.distance}
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                            <span className="material-symbols-outlined !text-[16px] filled">verified</span>
                                            موثق
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link href={`/profile/${msg.data.id}`} className="block text-center py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600">
                                            الملف الشخصي
                                        </Link>
                                        <Link href={`tel:${msg.data.phone || '0900000000'}`} className="block text-center py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm">
                                            تواصل
                                        </Link>
                                    </div>
                                </div>
                            )}


                            {/* Auction List (Horizontal Scroll with Arrows) */}
                            {msg.type === "auction_list" && msg.data && (
                                <div className="w-full max-w-full">
                                    <ScrollableContainer>
                                        {msg.data && Array.isArray(msg.data) && msg.data.map((auction: { id: number; status: string; timeLeft: string; title: string; location: string }) => (
                                            <div key={auction.id} className="min-w-[220px] snap-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                                                        {auction.status}
                                                    </div>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{auction.timeLeft}</span>
                                                </div>
                                                <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1 leading-snug">{auction.title}</h4>
                                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-4">
                                                    <span className="material-symbols-outlined !text-[16px]">location_on</span>
                                                    {auction.location}
                                                </div>
                                                <Link
                                                    href={`/auctions/${auction.id}`}
                                                    className="block w-full text-center py-2.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
                                                >
                                                    عرض التفاصيل
                                                </Link>
                                            </div>
                                        ))}
                                    </ScrollableContainer>
                                </div>
                            )}

                            <span className={`text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ${msg.sender === 'user' ? 'mr-1' : 'ml-1'}`}>
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex items-end gap-2 self-start max-w-[85%]">
                        <div className="size-8 shrink-0 mb-1 rounded-full flex items-center justify-center overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                            <span className="material-symbols-outlined text-primary !text-[18px]">smart_toy</span>
                        </div>
                        <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-2xl rounded-tr-sm shadow-sm border border-slate-200 dark:border-slate-700 flex gap-1">
                            <div className="size-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="size-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                            <div className="size-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Bottom Action Area */}
            <div className={`border-t z-20 pb-safe shadow-xl transition-colors ${dangerMode ? 'bg-red-900 border-red-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-slate-200 dark:shadow-none'}`}>
                {/* Quick Action Chips with Scroll Arrows */}
                <div className="py-3">
                    <ScrollableContainer>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-full transition-colors group shrink-0 ${dangerMode ? 'bg-red-800 border-red-500 text-white' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100'}`}
                        >
                            <span className="material-symbols-outlined !text-[20px]">add_a_photo</span>
                            <span className="text-xs font-bold">رفع صورة</span>
                        </button>
                        <button
                            onClick={() => handleQuickAction("ما هو سعر النحاس اليوم؟")}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors group shrink-0"
                        >
                            <span className="material-symbols-outlined text-primary !text-[20px] group-hover:scale-110 transition-transform">currency_exchange</span>
                            <span className="text-xs font-bold text-primary">سعر النحاس</span>
                        </button>
                        <button
                            onClick={() => handleQuickAction("ما هي المزادات المفتوحة؟")}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors text-slate-700 dark:text-slate-300 shrink-0 font-bold"
                        >
                            <span className="material-symbols-outlined !text-[20px]">gavel</span>
                            <span className="text-xs">مزادات مفتوحة</span>
                        </button>
                        <button
                            onClick={() => handleQuickAction("أين أقرب تاجر؟")}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors text-slate-700 dark:text-slate-300 shrink-0 font-bold"
                        >
                            <span className="material-symbols-outlined !text-[20px]">store</span>
                            <span className="text-xs">أقرب تاجر</span>
                        </button>
                    </ScrollableContainer>
                </div>

                {/* Input Field */}
                <div className="px-4 pb-4 pt-1">
                    <div className={`flex items-end gap-2 p-2 rounded-3xl border transition-all ${dangerMode ? 'bg-red-800 border-red-500' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-within:border-primary/50'}`}>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center justify-center size-10 rounded-full transition-colors shrink-0 ${dangerMode ? 'text-red-200 hover:bg-red-700' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-primary'}`}
                        >
                            <span className="material-symbols-outlined !text-[24px]">photo_camera</span>
                        </button>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className={`flex-1 bg-transparent border-0 focus:ring-0 text-sm font-bold placeholder-slate-500 py-3 px-0 resize-none max-h-24 overflow-y-auto leading-relaxed ${dangerMode ? 'text-white placeholder-red-300' : 'text-slate-900 dark:text-white'}`}
                            placeholder={dangerMode ? "صف حالة الخطر..." : "اسأل المساعد الذكي..."}
                            rows={1}
                        />
                        <div className="flex items-center gap-1 shrink-0 pb-1">
                            <button className={`flex items-center justify-center size-9 rounded-full transition-colors ${dangerMode ? 'text-red-200 hover:bg-red-700' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                <span className="material-symbols-outlined !text-[20px]">mic</span>
                            </button>
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className={`flex items-center justify-center size-9 text-white rounded-full shadow-md hover:shadow-lg transition-all transform active:scale-95 ${dangerMode ? 'bg-red-600 hover:bg-red-500' : 'bg-primary hover:bg-blue-600'} ${!inputValue.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span className="material-symbols-outlined !text-[20px] rtl:-scale-x-100">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
