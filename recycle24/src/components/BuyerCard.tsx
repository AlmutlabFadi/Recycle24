import Image from "next/image";
import { TitleBadge } from "./TitleFormatter";
import { Gender } from "@/lib/title-system";
import { useEffect, useState } from "react";

interface BuyerCardProps {
    name: string;
    imageUrl: string;
    materials: string[];
    distance: string;
    price: string;
    badge?: string;
    actionIcon?: string;
    titleId?: string;
    gender?: Gender;
    showTitleBadge?: boolean;
    isLoading?: boolean;
    error?: Error;
}

export default function BuyerCard({
    name,
    imageUrl,
    materials,
    distance,
    price,
    badge,
    actionIcon = "call",
    titleId,
    gender = "male",
    showTitleBadge = false,
    isLoading = false,
    error,
}: BuyerCardProps) {
    const [isEmpty, setIsEmpty] = useState(materials.length === 0);

    useEffect(() => {
        setIsEmpty(materials.length === 0);
    }, [materials]);

    if (error) {
        return (
            <div className="flex items-center p-3 rounded-xl bg-surface-highlight border border-slate-700 shadow-sm">
                <p>حدث خطأ أثناء تحميل البيانات: {error.message}</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center p-3 rounded-xl bg-surface-highlight border border-slate-700 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="flex items-center p-3 rounded-xl bg-surface-highlight border border-slate-700 shadow-sm">
                <p className="text-center text-slate-400">لا توجد بيانات</p>
            </div>
        );
    }

    return (
        <div className="flex items-center p-3 rounded-xl bg-surface-highlight border border-slate-700 shadow-sm">
            {/* Buyer Image */}
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative">
                <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="56px"
                    key="buyer-image"
                />
            </div>

            {/* Info */}
            <div className="flex-1 mr-3 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1 flex-wrap">
                        {showTitleBadge && titleId && (
                            <TitleBadge titleId={titleId} gender={gender} size="sm" key="title-badge" />
                        )}
                        <h3 className="font-bold text-white truncate" aria-label="اسم البائع">
                            {name}
                        </h3>
                    </div>
                    {badge && (
                        <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded ml-1 whitespace-nowrap" key="badge">
                            {badge}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">يشتري: {materials.join(", ")}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined !text-[12px]" aria-label="المسافة">
                            near_me
                        </span>
                        {distance}
                    </span>
                    <span className="text-xs font-bold text-primary font-english dir-ltr">
                        {price}
                    </span>
                </div>
            </div>

            {/* Action Button */}
            <button className="size-10 rounded-full bg-slate-700 text-primary flex items-center justify-center shrink-0 hover:bg-primary hover:text-white transition" aria-label={`اتصل بـ ${name}`} key="action-button">
                <span className="material-symbols-outlined !text-[20px]" aria-hidden>
                    {actionIcon}
                </span>
            </button>
        </div>
    );
}