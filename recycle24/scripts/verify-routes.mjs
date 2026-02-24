import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

const routes = [
    { path: '/', expectedText: 'أسعار السوق العالمية' },
    { path: '/verification', expectedText: 'لماذا يجب أن توثق حسابك؟' },
    { path: '/verification/identity', expectedText: 'الهوية الشخصية' },
    { path: '/verification/license', expectedText: 'رخصة العمل' },
    { path: '/verification/location', expectedText: 'تأكيد الموقع' },
    { path: '/verification/success', expectedText: 'تم الإرسال بنجاح' },
    { path: '/ai-assistant', expectedText: 'المساعد الذكي' },
    { path: '/academy', expectedText: 'أكاديمية ريسايكل' },
    { path: '/safety', expectedText: 'مركز السلامة والتوعية' },
    { path: '/help', expectedText: 'مركز المساعدة' },
    { path: '/rewards', expectedText: 'نقاط ريسايكل' },
    { path: '/rewards/leaderboard', expectedText: 'لوحة المتصدرين' },
];

async function verifyRoutes() {
    console.log('🚀 Starting Deep Verification...\n');
    let passed = 0;
    let failed = 0;

    for (const route of routes) {
        try {
            const response = await fetch(`${BASE_URL}${route.path}`);
            const text = await response.text();

            if (response.status === 200) {
                if (text.includes(route.expectedText)) {
                    console.log(`✅ [PASS] ${route.path} (Status: 200, Content Verified)`);
                    passed++;
                } else {
                    console.error(`❌ [FAIL] ${route.path} (Status: 200, Content Mismatch)`);
                    console.error(`   Expected to find: "${route.expectedText}"`);
                    failed++;
                }
            } else {
                console.error(`❌ [FAIL] ${route.path} (Status: ${response.status})`);
                failed++;
            }
        } catch (error) {
            console.error(`❌ [FAIL] ${route.path} (Connection Error)`);
            console.error(`   ${error.message}`);
            failed++;
        }
    }

    console.log('\n----------------------------------------');
    console.log(`📊 Verification Complete: ${passed}/${routes.length} Passed`);

    if (failed > 0) {
        console.error('⚠️  Some checks failed. Please review the logs above.');
        process.exit(1);
    } else {
        console.log('✨ All systems operational.');
        process.exit(0);
    }
}

verifyRoutes();
