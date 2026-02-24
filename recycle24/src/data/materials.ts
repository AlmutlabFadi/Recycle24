// قائمة المواد الكاملة - 47 نوع مصنفة حسب الفئات

export interface Material {
    id: string;
    name: string;
    category: string;
    icon: string;
    image?: string;
    unit: 'kg' | 'ton' | 'piece';
    basePrice?: number;
}

export const materialCategories = {
    iron: "حديد",
    copper: "نحاس",
    aluminum: "ألمنيوم",
    lead: "رصاص",
    zinc: "زنك",
    aluminum_alloy: "سبائك ألمنيوم",
    stainless: "فولاذ مقاوم للصدأ",
    batteries: "بطاريات",
    electronics: "إلكترونيات",
    motors: "محركات كهربائية",
    plastic: "بلاستيك",
    tires: "إطارات",
    paper: "ورق وكرتون",
    environment: "بيئة",
    other: "أخرى"
};

export const allMaterials: Material[] = [
    // حديد (3 أنواع)
    { id: "iron_mixed", name: "حديد مخلط", category: "iron", icon: "construction", unit: "kg", basePrice: 3200 },
    { id: "iron_industrial", name: "حديد سماكات صناعي", category: "iron", icon: "precision_manufacturing", unit: "kg", basePrice: 3500 },
    { id: "iron_fant", name: "فنط", category: "iron", icon: "category", unit: "kg", basePrice: 3800 },

    // نحاس (7 أنواع)
    { id: "copper_red_bright", name: "نحاس أحمر لامع", category: "copper", icon: "circles", unit: "kg", basePrice: 28500 },
    { id: "copper_red_mixed", name: "نحاس أحمر مخلط", category: "copper", icon: "sync_alt", unit: "kg", basePrice: 25000 },
    { id: "copper_yellow", name: "نحاس أصفر", category: "copper", icon: "brightness_7", unit: "kg", basePrice: 18000 },
    { id: "copper_yellow_alloy", name: "سبائك نحاس أصفر", category: "copper", icon: "view_module", unit: "kg", basePrice: 19500 },
    { id: "copper_inshara", name: "إنشارة نحاس", category: "copper", icon: "electrical_services", unit: "kg", basePrice: 22000 },
    { id: "copper_radiator", name: "مبرد نحاس", category: "copper", icon: "ac_unit", unit: "kg", basePrice: 24000 },
    { id: "copper_aluminum_radiator", name: "مبرد ألمنيوم ونحاس", category: "copper", icon: "device_thermostat", unit: "kg", basePrice: 15000 },

    // ألمنيوم (11 نوع)
    { id: "aluminum_carter", name: "ألمنيوم كرتير سيارات", category: "aluminum", icon: "directions_car", unit: "kg", basePrice: 8500 },
    { id: "aluminum_window_colored", name: "ألمنيوم شبابيك ملون خالي من الحديد", category: "aluminum", icon: "window", unit: "kg", basePrice: 7200 },
    { id: "aluminum_window_white", name: "ألمنيوم شبابيك أبيض خالي من الحديد", category: "aluminum", icon: "web_asset", unit: "kg", basePrice: 7500 },
    { id: "aluminum_rim", name: "جنط ألمنيوم", category: "aluminum", icon: "album", unit: "kg", basePrice: 6800 },
    { id: "aluminum_inshara", name: "إنشارة ألمنيوم", category: "aluminum", icon: "cable", unit: "kg", basePrice: 7800 },
    { id: "aluminum_radiator", name: "مبرد ألمنيوم", category: "aluminum", icon: "mode_fan", unit: "kg", basePrice: 6500 },
    { id: "aluminum_alloy_ingots", name: "سبائك ألمنيوم", category: "aluminum_alloy", icon: "view_in_ar", unit: "kg", basePrice: 8000 },

    // رصاص (2 نوع)
    { id: "lead", name: "رصاص", category: "lead", icon: "science", unit: "kg", basePrice: 4500 },
    { id: "lead_ingots", name: "سبائك رصاص", category: "lead", icon: "inventory", unit: "kg", basePrice: 5000 },

    // زنك (2 نوع)
    { id: "zinc", name: "زنك", category: "zinc", icon: "layers", unit: "kg", basePrice: 3800 },
    { id: "zinc_ingots", name: "سبائك زنك", category: "zinc", icon: "dashboard", unit: "kg", basePrice: 4200 },

    // فولاذ مقاوم للصدأ (4 أنواع)
    { id: "stainless_304", name: "فولاذ مقاوم للصدأ 304", category: "stainless", icon: "shield", unit: "kg", basePrice: 12000 },
    { id: "stainless_316", name: "فولاذ مقاوم للصدأ 316", category: "stainless", icon: "verified", unit: "kg", basePrice: 15000 },
    { id: "stainless_201_202", name: "فولاذ مقاوم للصدأ 201/202", category: "stainless", icon: "security", unit: "kg", basePrice: 9500 },
    { id: "stainless_430", name: "فولاذ مقاوم للصدأ 430", category: "stainless", icon: "gpp_good", unit: "kg", basePrice: 8500 },

    // بطاريات (2 نوع)
    { id: "battery_dry", name: "بطاريات جافة", category: "batteries", icon: "battery_full", unit: "kg", basePrice: 2500 },
    { id: "battery_wet_empty", name: "بطاريات سائل مفرغة من الماء", category: "batteries", icon: "battery_charging_full", unit: "kg", basePrice: 3200 },

    // إلكترونيات (4 أنواع)
    { id: "pcb", name: "لوحات إلكترونية", category: "electronics", icon: "memory", unit: "kg", basePrice: 18000 },
    { id: "ram", name: "رامات", category: "electronics", icon: "sd_card", unit: "kg", basePrice: 22000 },
    { id: "motherboard", name: "مذر بورد", category: "electronics", icon: "developer_board", unit: "kg", basePrice: 20000 },

    // محركات (3 أنواع)
    { id: "electric_motors", name: "محركات كهربائية", category: "motors", icon: "settings", unit: "kg", basePrice: 5500 },
    { id: "delmo", name: "ديلمو", category: "motors", icon: "power", unit: "kg", basePrice: 6000 },
    { id: "marsh", name: "مرش", category: "motors", icon: "bolt", unit: "kg", basePrice: 5800 },

    // بلاستيك (3 أنواع)
    { id: "nylon_transparent", name: "أكياس نايلون شفاف", category: "plastic", icon: "shopping_bag", unit: "kg", basePrice: 800 },
    { id: "plastic_general", name: "بلاستيك", category: "plastic", icon: "inventory_2", unit: "kg", basePrice: 900 },

    // إطارات (1 نوع)
    { id: "tires_no_wire", name: "إطارات سيارات خالية من سلك الحديد", category: "tires", icon: "trip_origin", unit: "kg", basePrice: 600 },

    // ورق وكرتون (3 أنواع)
    { id: "cardboard_mixed", name: "كرتون مخلط", category: "paper", icon: "deployed_code", unit: "kg", basePrice: 500 },
    { id: "cardboard_cut", name: "كرتون مقص", category: "paper", icon: "content_cut", unit: "kg", basePrice: 600 },
    { id: "white_paper", name: "ورق أبيض", category: "paper", icon: "description", unit: "kg", basePrice: 700 },

    // بيئة (1 نوع)
    { id: "environment_bags", name: "أشطمانات البيئة", category: "environment", icon: "eco", unit: "kg", basePrice: 400 },
];

// Helper functions
export function getMaterialsByCategory(category: string): Material[] {
    return allMaterials.filter(m => m.category === category);
}

export function getMaterialById(id: string): Material | undefined {
    return allMaterials.find(m => m.id === id);
}

export function getAllCategories(): string[] {
    return Array.from(new Set(allMaterials.map(m => m.category)));
}
