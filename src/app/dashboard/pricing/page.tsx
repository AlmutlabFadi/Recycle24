"use client";

import { useState } from "react";
import Link from "next/link";
import { allMaterials, materialCategories, Material } from "@/data/materials";
import BottomNavigation from "@/components/BottomNavigation";

// Initial mock data
const INITIAL_PRICES: Record<string, number> = {};
const INITIAL_CURRENCIES: Record<string, string> = {};
const INITIAL_ENABLED: string[] = ["copper_red_bright", "iron_mixed", "aluminum_window_white"];

allMaterials.forEach(m => {
    if (INITIAL_ENABLED.includes(m.id)) {
        INITIAL_PRICES[m.id] = m.basePrice || 0;
        INITIAL_CURRENCIES[m.id] = "SYP";
    }
});

export default function PricingControlPanel() {
    // State management
    const [prices, setPrices] = useState<Record<string, number>>(INITIAL_PRICES);
    const [currencies, setCurrencies] = useState<Record<string, string>>(INITIAL_CURRENCIES);
    const [enabledMaterials, setEnabledMaterials] = useState<Set<string>>(new Set(INITIAL_ENABLED));
    const [customImages, setCustomImages] = useState<Record<string, string>>({});
    const [materialsList, setMaterialsList] = useState<Material[]>(allMaterials);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [showToast, setShowToast] = useState(false);

    // New Item State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ name: "", category: "other", price: "", currency: "SYP" });

    // Handle Save Custom Prices
    const handleSave = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Toggle Material Visibility
    const toggleMaterial = (id: string) => {
        const newEnabled = new Set(enabledMaterials);
        if (newEnabled.has(id)) {
            newEnabled.delete(id);
        } else {
            newEnabled.add(id);
            // Initialize price and currency if not set
            if (!prices[id]) {
                const material = materialsList.find(m => m.id === id);
                setPrices(prev => ({ ...prev, [id]: material?.basePrice || 0 }));
                setCurrencies(prev => ({ ...prev, [id]: "SYP" }));
            }
        }
        setEnabledMaterials(newEnabled);
    };

    // Update Price
    const updatePrice = (id: string, value: string) => {
        const cleanValue = value.replace(/[^0-9]/g, "");
        const numValue = parseInt(cleanValue, 10);
        setPrices(prev => ({ ...prev, [id]: isNaN(numValue) ? 0 : numValue }));
    };

    // Update Currency
    const updateCurrency = (id: string, currency: string) => {
        setCurrencies(prev => ({ ...prev, [id]: currency }));
    };

    // Simulate Image Upload
    const handleImageUpload = (id: string) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const url = URL.createObjectURL(file);
                setCustomImages(prev => ({ ...prev, [id]: url }));
            }
        };
        input.click();
    };

    // Delete Custom Image
    const handleDeleteImage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering upload
        const newImages = { ...customImages };
        delete newImages[id];
        setCustomImages(newImages);
    };

    // Add New Material
    const handleAddNewItem = () => {
        if (!newItem.name || !newItem.price) return;

        const newId = `custom_${Date.now()}`;
        const newMaterial: Material = {
            id: newId,
            name: newItem.name,
            category: newItem.category,
            icon: "inventory_2", // Default icon
            unit: "kg",
            basePrice: parseInt(newItem.price)
        };

        setMaterialsList([newMaterial, ...materialsList]);
        setPrices(prev => ({ ...prev, [newId]: newMaterial.basePrice || 0 }));
        setCurrencies(prev => ({ ...prev, [newId]: newItem.currency }));
        setEnabledMaterials(prev => new Set(prev).add(newId));
        setIsAddModalOpen(false);
        setNewItem({ name: "", category: "other", price: "", currency: "SYP" });
    };

    // Filter Materials
    const filteredMaterials = materialsList.filter(material => {
        const matchesSearch = material.name.includes(searchQuery);
        const matchesCategory = selectedCategory === "all" || material.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <>
            <header className="sticky top-0 z-40 bg-bg-dark/90 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="flex items-center justify-center size-10 rounded-full hover:bg-surface-highlight transition">
                            <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                        </Link>
                        <h1 className="text-lg font-bold text-white">لوحة تسعير المواد</h1>
                    </div>
                    <button 
                        onClick={handleSave}
                        className="text-sm font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary/20 transition"
                    >
                        حفظ التغييرات
                    </button>
                </div>
            </header>

            <main className="flex-1 pb-24 p-4 relative">
                
                {/* Search & Filter */}
                <div className="sticky top-[73px] z-30 bg-bg-dark pt-2 pb-4 space-y-3">
                    <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500">search</span>
                        <input
                            type="text"
                            placeholder="بحث عن مادة..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 bg-surface-highlight border border-slate-700 rounded-xl pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${selectedCategory === "all"
                                ? "bg-primary text-white"
                                : "bg-surface-highlight text-slate-400 hover:text-white"
                                }`}
                        >
                            الكل
                        </button>
                        {Object.entries(materialCategories).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${selectedCategory === key
                                    ? "bg-primary text-white"
                                    : "bg-surface-highlight text-slate-400 hover:text-white"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add New Item Button (Static Top Position) */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full mb-4 bg-surface-highlight border-2 border-dashed border-slate-700 hover:border-primary hover:bg-primary/5 text-slate-400 hover:text-primary rounded-2xl p-4 flex items-center justify-center gap-2 transition group"
                >
                    <div className="size-8 rounded-full bg-slate-800 group-hover:bg-primary/20 flex items-center justify-center transition">
                        <span className="material-symbols-outlined !text-[20px]">add</span>
                    </div>
                    <span className="font-bold">إضافة مادة جديدة للقائمة</span>
                </button>

                {/* Materials List */}
                <div className="space-y-3">
                    {filteredMaterials.map((material) => {
                        const isEnabled = enabledMaterials.has(material.id);
                        const hasCustomImage = !!customImages[material.id];

                        return (
                            <div
                                key={material.id}
                                className={`relative p-4 rounded-2xl border transition ${isEnabled
                                    ? "bg-surface-highlight border-primary/30"
                                    : "bg-surface-dark border-slate-800 opacity-60"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Icon / Image */}
                                        <div
                                            onClick={() => isEnabled && !hasCustomImage && handleImageUpload(material.id)}
                                            className={`size-14 rounded-xl flex items-center justify-center transition overflow-hidden relative group cursor-pointer ${isEnabled ? "bg-primary/20 border border-primary/20" : "bg-slate-800"
                                                }`}
                                        >
                                            {hasCustomImage ? (
                                                <div className="relative w-full h-full group">
                                                    <img src={customImages[material.id]} alt={material.name} className="w-full h-full object-cover" />
                                                    {/* Delete Image Overlay */}
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                        <button 
                                                            onClick={(e) => handleDeleteImage(material.id, e)}
                                                            className="size-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition"
                                                            title="حذف الصورة"
                                                        >
                                                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className={`material-symbols-outlined !text-[28px] ${isEnabled ? "text-primary" : "text-slate-600"}`}>
                                                    {material.icon}
                                                </span>
                                            )}
                                            
                                            {/* Upload Overlay Hint (Only if no image) */}
                                            {isEnabled && !hasCustomImage && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                    <span className="material-symbols-outlined text-white !text-[20px]">add_a_photo</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className={`font-bold text-base transition ${isEnabled ? "text-white" : "text-slate-500"}`}>
                                                {material.name}
                                            </h3>
                                            <p className="text-xs text-slate-500">{materialCategories[material.category as keyof typeof materialCategories]}</p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <button
                                        onClick={() => toggleMaterial(material.id)}
                                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${isEnabled ? "bg-primary justify-start" : "bg-slate-700 justify-end"
                                            }`}
                                    >
                                        <div className="size-6 bg-white rounded-full shadow-md" />
                                    </button>
                                </div>

                                {/* Price Input */}
                                {isEnabled && (
                                    <div className="animate-fadeIn">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-xs font-bold text-slate-400">
                                                سعر الشراء (لكل {material.unit === "ton" ? "طن" : "كغ"})
                                            </label>
                                            <div className="flex bg-bg-dark rounded-lg overflow-hidden border border-slate-700">
                                                <button 
                                                    onClick={() => updateCurrency(material.id, "SYP")} 
                                                    className={`px-3 py-1 text-[11px] font-bold transition font-english ${currencies[material.id] === "SYP" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
                                                >
                                                    SYP
                                                </button>
                                                <button 
                                                    onClick={() => updateCurrency(material.id, "USD")} 
                                                    className={`px-3 py-1 text-[11px] font-bold transition font-english ${currencies[material.id] === "USD" ? "bg-primary text-white" : "text-slate-400 hover:text-white"}`}
                                                >
                                                    $
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                dir="ltr"
                                                value={prices[material.id]?.toLocaleString() || ""}
                                                onChange={(e) => updatePrice(material.id, e.target.value)}
                                                className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white font-bold font-english text-left focus:outline-none focus:border-primary transition"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleImageUpload(material.id)}
                                                    className="size-8 rounded-lg bg-surface-highlight hover:bg-slate-700 flex items-center justify-center text-slate-400 transition"
                                                    title="رفع/تغيير الصورة"
                                                >
                                                    <span className="material-symbols-outlined !text-[18px]">add_photo_alternate</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add New Item Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-surface-highlight border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">إضافة مادة جديدة</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">اسم المادة</label>
                                    <input 
                                        type="text" 
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                                        className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:border-primary"
                                        placeholder="مثلاً: بلاستيك زراعي"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">الفئة</label>
                                    <select 
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                                        className="w-full h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:border-primary appearance-none"
                                    >
                                        {Object.entries(materialCategories).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">سعر الشراء المبدئي والعملة</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                                            className="flex-1 h-12 bg-bg-dark border border-slate-700 rounded-xl px-4 text-white font-english focus:outline-none focus:border-primary"
                                            placeholder="0"
                                        />
                                        <select 
                                            value={newItem.currency}
                                            onChange={(e) => setNewItem({...newItem, currency: e.target.value})}
                                            className="w-24 h-12 bg-bg-dark border border-slate-700 rounded-xl px-2 text-white font-bold font-english focus:outline-none focus:border-primary appearance-none text-center"
                                        >
                                            <option value="SYP">SYP</option>
                                            <option value="USD">$</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={handleAddNewItem}
                                    className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
                                >
                                    إضافة
                                </button>
                                <button 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 h-12 bg-transparent border border-slate-600 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Custom Toast Notification */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce-short">
                    <div className="bg-success text-white px-6 py-3 rounded-xl shadow-xl shadow-success/20 flex items-center gap-3 font-bold border border-success/50">
                        <span className="material-symbols-outlined">check_circle</span>
                        تم حفظ التقسيمات وأسعار المواد بنجاح!
                    </div>
                </div>
            )}

            <BottomNavigation />
        </>
    );
}
