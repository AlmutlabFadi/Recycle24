# RELEASE_GATES

## الهدف
هذا الملف يحدد الحد الأدنى الإلزامي قبل اعتبار الفرع أو الإصدار صالحا للدمج أو النشر.

---

## GATE 1 — Build Integrity
يجب أن ينجح:

- `npm run build`

الفشل هنا = رفض مباشر.

---

## GATE 2 — Auth / Policy Integrity
يجب التحقق من الآتي في المسارات الحساسة:

1. لا يوجد bootstrap داخل runtime path
2. لا يوجد endpoint إداري بلا permission gate
3. لا يوجد رجوع إلى role string كبديل عن permission system في admin APIs

أمثلة تحقق:
- grep على `bootstrapAccessControl`
- grep على `requirePermission`
- grep على patterns الشاذة

---

## GATE 3 — Database Discipline
قبل الدمج لأي تعديل يمس Prisma أو endpoints كبيرة:

1. Prisma generate ناجح
2. لا توجد queries واضحة عديمة الانضباط
3. counts تستخدم count/aggregate لا تحميل سجلات كاملة
4. أي pagination مطلوبة لا تترك مفتوحة بلا حدود في المسارات الكبيرة

---

## GATE 4 — Technical Debt Visibility
إذا تم قبول compromise مؤقت يجب أن يسجل في:
- `TECH_DEBT_REGISTER.md`

أي debt غير مسجل = debt مخفي = مرفوض.

---

## GATE 5 — Scope Control
يجب أن يكون التغيير:
- معروف الحدود
- قابلا للشرح
- قابلا للتراجع

أي change-set ضبابي أو مشتت = لا يمر.

---

## GATE 6 — Security Baseline
أي تغيير أمني أو إداري يجب أن يثبت:
- عدم كسر build
- عدم إزالة enforcement
- عدم توسيع access بدون مبرر

---

## GATE 7 — Manual Review Questions
قبل الدمج يجب الإجابة:

1. ما الذي تغير
2. لماذا تغير
3. ما المخاطر
4. ما الذي تم اختباره
5. هل يوجد debt جديد
6. هل يوجد rollback واضح

إذا لم توجد هذه الإجابات فالإصدار غير جاهز.

---

## GATE 8 — Known Non-Blocking Issues
الأخطاء غير الحرجة المسموح بمرورها مؤقتا يجب أن تكون:
- مفهومة
- محصورة
- غير ماسة للأمن أو سلامة البيانات
- ومسجلة صراحة في debt register

---

## قرار الدمج
يمنع الدمج أو النشر إذا فشل أي Gate من:
- Build Integrity
- Auth / Policy Integrity
- Security Baseline
