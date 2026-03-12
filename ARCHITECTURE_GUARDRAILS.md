# ARCHITECTURE_GUARDRAILS

## الهدف
هذا الملف يحدد القيود المعمارية الإلزامية التي لا يجوز كسرها أثناء تطوير المشروع.

---

## 1. مبادئ أساسية

1. لا يجوز إدخال منطق أعمال ثقيل داخل `route.ts`.
2. لا يجوز جعل الصفحة أو الواجهة هي طبقة الحماية الوحيدة.
3. لا يجوز إدخال bootstrap / seed / initialization داخل runtime path للطلبات.
4. لا يجوز الاعتماد على مصدرين مختلفين للحقيقة لنفس المجال.
5. لا يجوز دمج refactor كبير مع feature جديد في نفس التغيير.
6. لا يجوز إدخال nested project أو مجلد مشروع داخل مشروع.
7. لا يجوز استخدام أي bypass أمني مؤقت بدون تسجيله في `TECH_DEBT_REGISTER.md`.

---

## 2. قواعد الطبقات

### Route Layer
المسموح:
- parsing
- validation الخفيف
- auth gate
- استدعاء service
- return response

الممنوع:
- business logic معقد
- أكثر من استعلامات DB متناثرة بلا تنظيم
- orchestration طويل داخل route
- حسابات ثقيلة داخل route

### Service Layer
المسؤوليات:
- business rules
- orchestration
- permission-aware decisions
- transaction coordination

### Data / Repository Layer
المسؤوليات:
- Prisma access
- query shaping
- select/include discipline
- pagination
- aggregates

---

## 3. قواعد الأمن والصلاحيات

1. أي endpoint إداري يجب أن يمر عبر `requirePermission(...)`.
2. أي حماية صفحة لا تكفي وحدها لحماية API.
3. الصلاحيات الدقيقة تبنى على permissions وليس على role string فقط.
4. JWT/session تستخدم كطبقة cache للصلاحيات لا كذريعة لتجاوز policy discipline.
5. أي endpoint حساس يجب أن يعيد:
   - 401 عند غياب الجلسة
   - 403 عند غياب الصلاحية أو عدم الأهلية

---

## 4. قواعد قاعدة البيانات

1. لا تستخدم `findMany` ثم `array.length` بدل `count`.
2. لا تحمل سجلات كاملة للحصول على counts.
3. لا تستخدم `include` واسع بدون حاجة واضحة.
4. استخدم `select` الصريح كلما أمكن.
5. أي endpoint list يجب أن يفكر في pagination مبكرا.
6. أي filter / sort متكرر على جدول كبير يجب أن يراجع index corresponding.
7. أي عملية مالية أو حساسة متعددة الخطوات يجب أن تكون transaction-safe.

---

## 5. قواعد الأداء

1. أي endpoint إداري أو مالي أو تشغيلي حرج يجب أن يكون قابلا للقياس.
2. ممنوع إضافة caching قبل فهم invalidation.
3. ممنوع تحسين شكلي في الواجهة لإخفاء بطء حقيقي في backend.
4. أي query ثقيلة متكررة يجب إما:
   - تبسيطها
   - تجميعها
   - أو نقلها إلى snapshot / precompute عند الحاجة

---

## 6. قواعد الملفات والبنية

البنية المفضلة:

- `src/app/...` للواجهات وroutes
- `src/lib/...` للأدوات المشتركة
- `src/server/services/...` لمنطق الأعمال
- `src/server/repositories/...` أو `src/server/data/...` للوصول إلى البيانات

إذا لم توجد هذه الطبقات بعد يجب التوجه إليها تدريجيا في أي refactor لاحق.

---

## 7. قواعد التغييرات

أي تغيير جديد يجب أن يجيب على الأسئلة التالية قبل اعتماده:

1. ما المشكلة المدفوعة التي يحلها
2. ما الطبقة الصحيحة لهذا التغيير
3. هل يضيف مصدر حقيقة جديدا
4. هل يضيف technical debt
5. هل يوسع سطح الهجوم
6. هل يمكن قياس أثره
7. هل يمكن rollback له

إذا لم تكن الإجابة واضحة فالتغيير غير ناضج.

---

## 8. حالات الرفض المباشر

يرفض أي PR أو تعديل إذا كان:
- يكسر build
- يضيف منطقا ثقيلا داخل route
- يعيد bootstrap إلى runtime
- يتجاوز permission enforcement
- يضيف nested project
- يستخدم any في طبقة حساسة بدون مبرر موثق
- يضيف endpoint إداري بلا auth/policy واضحة
