export interface DemoUser {
    id: string;
    phone: string | null;
    email: string | null;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    titleId: string;
    gender: string;
    userType: string;
    status: string;
    role: string;
}

const DEMO_USERS: Record<string, DemoUser> = {
    "test@test.com": {
        id: "demo_trader_1",
        phone: null,
        email: "test@test.com",
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.qJJB.4PvLlKmJLtK8m",
        name: "أحمد محمد الخالد",
        firstName: "أحمد",
        lastName: "الخالد",
        titleId: "eng",
        gender: "male",
        userType: "TRADER",
        status: "ACTIVE",
        role: "TRADER"
    },
    "buyer@test.com": {
        id: "demo_buyer_1",
        phone: null,
        email: "buyer@test.com",
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.qJJB.4PvLlKmJLtK8m",
        name: "محمد العلي",
        firstName: "محمد",
        lastName: "العلي",
        titleId: "dr",
        gender: "male",
        userType: "BUYER",
        status: "ACTIVE",
        role: "BUYER"
    }
};

const DEMO_AUCTIONS = [
    {
        id: "auction_1",
        sellerId: "demo_trader_1",
        title: "طن حديد HMS - درجة أولى",
        category: "IRON",
        weight: 1000,
        weightUnit: "KG",
        location: "حلب - منطقة الشيخ نجار",
        startingBid: 15000000,
        buyNowPrice: 20000000,
        duration: 4,
        status: "LIVE",
        startedAt: new Date(),
        endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        createdAt: new Date(),
    },
    {
        id: "auction_2",
        sellerId: "demo_trader_1",
        title: "نحاس أسلاك نظيف - 500 كغ",
        category: "COPPER",
        weight: 500,
        weightUnit: "KG",
        location: "دمشق - منطقة البحصة",
        startingBid: 8500000,
        buyNowPrice: null,
        duration: 6,
        status: "LIVE",
        startedAt: new Date(),
        endsAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        createdAt: new Date(),
    },
    {
        id: "auction_3",
        sellerId: "demo_trader_1",
        title: "ألمنيوم قطع نظيفة - 800 كغ",
        category: "ALUMINUM",
        weight: 800,
        weightUnit: "KG",
        location: "حمص - المنطقة الصناعية",
        startingBid: 10000000,
        buyNowPrice: null,
        duration: 24,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        createdAt: new Date(),
    }
];

const DEMO_WALLETS: Record<string, { balanceSYP: number; balanceUSD: number }> = {
    "demo_trader_1": { balanceSYP: 8300000, balanceUSD: 0 },
    "demo_buyer_1": { balanceSYP: 50000000, balanceUSD: 0 }
};

export const isDemoMode = process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL;

const runtimeDemoUsers: Record<string, DemoUser> = {};

export function findDemoUser(identifier?: string | null): DemoUser | undefined {
    if (!identifier) return undefined;
    return runtimeDemoUsers[identifier] || DEMO_USERS[identifier];
}

export function registerDemoUser(user: DemoUser): void {
    if (user.email) runtimeDemoUsers[user.email] = user;
    if (user.phone) runtimeDemoUsers[user.phone] = user;
}

export { DEMO_USERS, DEMO_AUCTIONS, DEMO_WALLETS };
