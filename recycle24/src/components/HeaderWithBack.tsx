"use client";

import { useRouter } from "next/navigation";

interface HeaderWithBackProps {
    title: string;
    onBack?: () => void;
    action?: React.ReactNode;
}

export default function HeaderWithBack({ title, onBack, action }: HeaderWithBackProps) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

return (
        <header className="flex items-center justify-between px-4 py-3 sticky top-0 z-50 bg-[#101922] border-b border-[#1c2630] shadow-sm transition-colors duration-300">
            <button
                onClick={handleBack}
                className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full hover:bg-[#1c2630] active:scale-95 transition-all text-white"
                aria-label="Go back"
            >
                <span className="material-symbols-outlined !text-[24px]">arrow_forward</span>
            </button>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-center flex-1 pl-8 text-white">
                {title}
            </h1>
            {action && <div className="-ml-2">{action}</div>}
        </header>
    );
}
