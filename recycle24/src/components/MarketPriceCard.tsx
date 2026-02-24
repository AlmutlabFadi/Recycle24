interface MarketPriceCardProps {
    icon: string;
    iconBg?: string;
    iconColor?: string;
    label: string;
    price: string;
    unit: string;
    change: string;
    changeType: "up" | "down" | "neutral";
}

export default function MarketPriceCard({
    icon,
    iconBg = "bg-slate-700/50",
    iconColor = "text-slate-300",
    label,
    price,
    unit,
    change,
    changeType,
}: MarketPriceCardProps) {
    const changeColor =
        changeType === "up"
            ? "text-green-500 bg-green-500/10"
            : changeType === "down"
                ? "text-red-500 bg-red-500/10"
                : "text-slate-400 bg-slate-700/50";

    const changeIcon =
        changeType === "up"
            ? "trending_up"
            : changeType === "down"
                ? "trending_down"
                : "remove";

    return (
        <div className="snap-center flex min-w-[200px] flex-col justify-between rounded-xl p-4 bg-surface-highlight border border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${iconBg}`}>
                    <span className={`material-symbols-outlined ${iconColor}`}>
                        {icon}
                    </span>
                </div>
                <span
                    className={`text-xs font-bold ${changeColor} px-2 py-1 rounded-full flex items-center dir-ltr`}
                >
                    {change}{" "}
                    <span className="material-symbols-outlined !text-[14px] ml-0.5">
                        {changeIcon}
                    </span>
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-400">{label}</p>
                <p className="text-xl font-bold text-white font-english mt-1">
                    {price}
                    <span className="text-sm font-normal text-slate-500 ml-1">
                        {unit}
                    </span>
                </p>
            </div>
        </div>
    );
}
