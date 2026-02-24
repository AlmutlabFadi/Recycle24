import http from 'http';

const BASE_URL = 'http://localhost:3000';

const routes = [
    { path: '/', expectedText: 'أسعار السوق العالمية' },
    { path: '/verification', expectedText: 'تحقق التاجر' },
    { path: '/verification/identity', expectedText: 'الهوية الشخصية' },
    { path: '/verification/license', expectedText: 'رخصة العمل' },
    { path: '/verification/location', expectedText: 'تأكيد الموقع' },
    { path: '/verification/success', expectedText: 'تم إرسال الطلب بنجاح' },
    { path: '/ai-assistant', expectedText: 'المساعد الذكي' },
    { path: '/academy', expectedText: 'أكاديمية ريسايكل' },
    { path: '/safety', expectedText: 'مركز السلامة والتوعية' },
    { path: '/help', expectedText: 'مركز المساعدة' },
    { path: '/rewards', expectedText: 'نقاط ريسايكل' },
    { path: '/rewards/leaderboard', expectedText: 'لوحة المتصدرين' },
    { path: '/auctions/create', expectedText: 'إنشاء مزاد جديد' },
    { path: '/auctions/402/results', expectedText: 'نتائج المزاد' },
    { path: '/deals/DEAL-7782/contract', expectedText: 'توثيق العقد' },
    { path: '/market/alerts', expectedText: 'تنبيهات الأسعار' },
    { path: '/market/calendar', expectedText: 'المفكرة الاقتصادية' },
    { path: '/verification/status', expectedText: 'حالة التوثيق' },
    { path: '/auctions/upcoming', expectedText: 'المزادات القادمة' },
    { path: '/dashboard', expectedText: 'لوحة التحكم' },
    { path: '/pricing', expectedText: 'قوائم الأسعار' },
    { path: '/stolen-reports', expectedText: 'الإبلاغ عن المفقودات' },
    { path: '/stolen-reports/new', expectedText: 'إبلاغ عن سرقة' },
    { path: '/buyer/pricing-dashboard', expectedText: 'لوحة التحكم بالأسعار' },
    { path: '/buyer/market-analytics', expectedText: 'تحليلات السوق والتسعير' },
    { path: '/buyer/material-variants', expectedText: 'إدارة أصناف المواد' },
];

function checkRoute(route) {
    return new Promise((resolve) => {
        http.get(`${BASE_URL}${route.path}`, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200 && data.includes(route.expectedText)) {
                    console.log(`✅ [PASS] ${route.path} (Status: 200)`);
                    resolve(true);
                } else {
                    console.error(`❌ [FAIL] ${route.path}`);
                    if (res.statusCode !== 200) {
                        console.error(`   Status Code: ${res.statusCode}`);
                    }
                    if (!data.includes(route.expectedText)) {
                        console.error(`   Content Mismatch: Expected "${route.expectedText}"`);
                        console.error(`   Preview: ${data.substring(0, 100)}...`);
                    }
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.error(`❌ [FAIL] ${route.path} (Error: ${err.message})`);
            resolve(false);
        });
    });
}

async function run() {
    console.log('🚀 Starting Deep Verification (Native HTTP)...\n');
    let passed = 0;

    for (const route of routes) {
        const success = await checkRoute(route);
        if (success) passed++;
    }

    console.log('\n----------------------------------------');
    console.log(`📊 Result: ${passed}/${routes.length} Routes Verified`);

    if (passed === routes.length) {
        console.log('✨ All systems operational.');
        process.exit(0);
    } else {
        console.error('⚠️ Verification Failed');
        process.exit(1);
    }
}

run();
