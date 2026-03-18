# Auction Engine Phase 2 — Architecture Baseline
**Project:** Recycle24 / Metalix24  
**Branch:** `feature/auction-engine`  
**Scope:** Real auction domain correction before UI polishing  
**Status:** Approved baseline for implementation  
**Authoring mode:** PowerShell-only execution path

---

## 1) Executive diagnosis

الوضع الحالي في قسم المزادات **غير صالح تجاريًا ولا تشغيليًا** للأسباب التالية:

1. **النظام الحالي يفكر بمنطق “مزاد واحد = سلعة واحدة = فائز واحد”.**
   هذا يهدم فورًا حالات البيع الحقيقية متعددة المواد أو متعددة البنود.

2. **واجهة إنشاء المزاد أغنى من محرك المزاد نفسه.**
   توجد حقول وواجهات وملفات وصور، لكن المحرك المالي، منطق التسعير، التأمين، الفائزين، ونواتج التسوية لا تعكس ذلك.

3. **البيانات المعروضة في لوحة الإدارة وحساب التاجر غير موثوقة.**
   عندما تظهر التواريخ أو الصور أو الملفات أو الأرقام بشكل مكسور، فالمشكلة ليست “واجهة فقط”، بل **انفصال بين نموذج البيانات، الـ API، والـ rendering contracts**.

4. **التأمينات الحالية بدائية وخاطئة.**
   لا يوجد فصل بين:
   - تأمين مشاركة على المزاد كاملًا
   - تأمين لكل بند/مادة
   - تأمين حسب عدد المواد المختارة
   - تأمين حسب قيمة التعرض المالي المحتمل

5. **لا يوجد دعم حقيقي للمزادات متعددة البنود.**
   مثال:
   - 100 طن نحاس أحمر
   - 100 طن نحاس أصفر
   - 100 طن ألمنيوم

   هذه ليست “سلعة واحدة بوزن إجمالي”، بل **3 خطوط مزايدة مستقلة داخل مزاد واحد** أو **3 lot units تحت parent auction**.

6. **لا يوجد دعم مزاد عكسي حقيقي.**
   هذا يمنع استخدام النظام في:
   - إزالة الردميات
   - خدمات الترحيل والنقل
   - عقود البنية التحتية
   - المناقصات الحكومية والخاصة
   - طلبات التنفيذ بأقل سعر وأفضل التزام

---

## 2) القرار المعماري

### القرار النهائي
لن نستمر بمنطق “Auction = one price stream only”.

بدلًا من ذلك سيتم اعتماد:

## **Parent Auction + Auction Lots + Bid Scope**

يعني:

- **Auction** = الحاوية الرئيسية القانونية/التجارية
- **AuctionLot** = بند مستقل داخل المزاد
- **Bid** = مزايدة مرتبطة إما:
  - ببند واحد
  - أو بمجموعة بنود
  - أو بالمزاد كله إذا كان من النوع الأحادي

هذا هو الحد الأدنى الواقعي الذي يسمح للنظام أن يخدم:

- مزادات خردة متعددة المواد
- مزادات حكومية
- مزادات خاصة
- مزادات مباشرة للأعلى سعر
- مزادات عكسية للأقل سعر
- حالات فائز واحد أو عدة فائزين

---

## 3) أنواع المزادات المطلوبة

## 3.1 Auction pricing direction

سنضيف مفهومًا صريحًا:

- `FORWARD` = السعر الأعلى يفوز
- `REVERSE` = السعر الأقل يفوز

### استخدامات FORWARD
- خردة
- مواد
- معدات
- أصول للبيع

### استخدامات REVERSE
- إزالة أنقاض
- نقل
- ترحيل
- تنفيذ أعمال
- مقاولات
- خدمات حكومية وخاصة

---

## 3.2 Auction scope model

### النوع A — Single Lot Auction
مزاد على بند واحد فقط  
فائز واحد فقط

### النوع B — Multi Lot Independent Auction
مزاد رئيسي يحتوي عدة بنود مستقلة  
كل بند له:
- سعر بداية مستقل
- عملة مستقلة إن لزم
- كمية/وحدة مستقلة
- فائز مستقل
- تاريخ/نتيجة مستقلة داخل نفس الحاوية الرئيسية

### النوع C — Multi Lot Selective Participation
المشارك يستطيع اختيار:
- Lot واحد
- أكثر من Lot
- كل الـ Lots

### النوع D — Reverse Service Auction
الجهة المعلنة تطلب تنفيذ خدمة  
المتنافسون يتسابقون إلى **أقل سعر صالح**  
وقد تدخل لاحقًا عناصر تقييم إضافية:
- الجودة
- سرعة التنفيذ
- التقييم الفني
- مدة الإنجاز

لكن في المرحلة الحالية:
- نبدأ بـ **price-first reverse auction**
- ثم نضيف evaluation matrix لاحقًا

---

## 4) نموذج البيانات المطلوب

## 4.1 Auction (parent container)

يبقى جدول `Auction` لكن دوره يصبح:
- الغلاف القانوني
- الهوية العامة
- نوع العملية
- سياسة العملة
- طريقة المشاركة
- مصدر النزاع
- سياسة التأمين
- الحالة العامة

### حقول جديدة/مفاهيم لازمة في Auction
- `auctionMode`
  - `FORWARD`
  - `REVERSE`

- `lotStrategy`
  - `SINGLE`
  - `MULTI_INDEPENDENT`

- `participationMode`
  - `FULL_AUCTION`
  - `SELECTIVE_LOTS`

- `winnerStrategy`
  - `ONE_WINNER`
  - `MULTIPLE_WINNERS`

- `baseCurrency`
  - `SYP`
  - `USD`

- `fxPolicy`
  - `FIXED_AUCTION_CURRENCY_ONLY`
  - لاحقًا يمكن دعم multi-currency quoting لكن ليس الآن

- `jurisdictionType`
  - `PRIVATE_PLATFORM_TERMS`
  - `PRIVATE_CONTRACT`
  - `GOVERNMENT_TENDER_TERMS`

- `disputePolicy`
  - `PLATFORM_MEDIATION`
  - `EXTERNAL_ARBITRATION`
  - `LOCAL_COURT`

- `depositModel`
  - `NONE`
  - `FLAT_AUCTION`
  - `PERCENT_AUCTION`
  - `PER_LOT_FLAT`
  - `PER_LOT_PERCENT`
  - `HYBRID`

---

## 4.2 AuctionLot

جدول جديد أو تفعيل الجدول القائم بشكل صحيح كمحرك فعلي وليس كزينة.

### كل Lot يجب أن يحتوي:
- `id`
- `auctionId`
- `lotNumber`
- `title`
- `materialType`
- `description`
- `quantity`
- `unit`
- `qualityGrade`
- `currency`
- `pricingMode`
  - `TOTAL`
  - `PER_TON`
  - `PER_KG`
  - `PER_UNIT`
  - `SERVICE_TOTAL`

- `direction`
  - `FORWARD`
  - `REVERSE`

- `startingPrice`
- `minimumIncrement`
- `reservePrice` (اختياري)
- `buyNowPrice` (اختياري فقط في forward)
- `depositModelOverride` (اختياري)
- `depositAmountOverride` (اختياري)
- `depositPercentOverride` (اختياري)
- `status`
  - `DRAFT`
  - `OPEN`
  - `CLOSED`
  - `SETTLED`
  - `CANCELLED`

- `winnerId`
- `winningBidId`
- `finalPrice`
- `version`

### لماذا هذا ضروري؟
لأن النحاس الأحمر ليس نفس النحاس الأصفر وليس نفس الألمنيوم.
كل واحد منهم **سوق مختلف + تسعير مختلف + جمهور مختلف + فائز مختلف**.

---

## 4.3 AuctionParticipant

المشارك الآن لا يكفي أن يكون “joined”.
يجب أن نعرف **نطاق مشاركته**.

### إضافات لازمة
- `participationScope`
  - `FULL_AUCTION`
  - `SELECTIVE_LOTS`

- `selectedLotCount`
- `totalCommittedDeposit`
- `baseCurrency`
- `joinedAt`

---

## 4.4 AuctionParticipantLot

جدول ربط حتمي.

### وظيفته
تحديد علاقة المشارك بكل Lot على حدة.

### الحقول
- `id`
- `auctionId`
- `participantId`
- `lotId`
- `isSelected`
- `isApproved`
- `depositRequired`
- `depositHoldId`
- `depositWorkflowStatus`
- `joinedAt`

### هذه الطبقة هي مفتاح الحل
بدون هذا الجدول لا يمكن للنظام أن يعرف:
- من يشارك على أي مادة
- ما هو تأمينه لكل مادة
- من يحق له المزايدة على أي Lot

---

## 4.5 Bid

المزايدة يجب أن ترتبط ببند واضح.

### إضافات لازمة
- `lotId` **إجباري في multi-lot**
- `directionSnapshot`
- `currencySnapshot`
- `pricingModeSnapshot`
- `requestKey` (موجود الآن)
- `isReplay`
- `rankAfterPlacement`

### منطق الفوز
- `FORWARD`: الأعلى يفوز
- `REVERSE`: الأقل يفوز

---

## 4.6 AuctionEventLog

الـ event log يجب أن يصبح أكثر دقة.

### أنواع أحداث لازمة
- `AUCTION_PARTICIPANT_JOINED`
- `AUCTION_PARTICIPANT_LOT_SELECTED`
- `AUCTION_DEPOSIT_HELD`
- `AUCTION_BID_PLACED`
- `AUCTION_LOT_OUTBID`
- `AUCTION_LOT_CLOSED`
- `AUCTION_LOT_WINNER_ASSIGNED`
- `AUCTION_LOSER_DEPOSIT_RELEASED`
- `AUCTION_WINNER_DEPOSIT_HELD`
- `AUCTION_FINANCIALS_CLOSED`
- `AUCTION_WINNER_DISCHARGED`
- `AUCTION_DISPUTE_OPENED`
- `AUCTION_DISPUTE_RESOLVED`

### ملاحظة
يجب أن يحتوي payload على:
- `lotId` عندما يكون الحدث خاصًا ببند
- `requestKey` عندما يكون الحدث خاصًا بمزايدة
- `versionAfterUpdate`

---

## 5) العملة والتسعير

## 5.1 العملة
أنت نبهت لنقطة حاسمة: **المزاد بالليرة السورية أو الدولار**.

القرار:
- كل Auction له `baseCurrency`
- كل Lot يرث العملة من Auction افتراضيًا
- يمكن لاحقًا السماح override على مستوى lot لكن **ليس الآن** إلا إذا كان النظام الحالي يحتاجها بقوة

### المرحلة الحالية
ندعم:
- `SYP`
- `USD`

### ممنوع حاليًا
- المزايدة بعملة والواجهة تعرض بأخرى
- التحويل الفوري أثناء المزاد
- قبول bid بعملة غير عملة الـ lot

---

## 5.2 نماذج التسعير
لكل lot:

- `TOTAL`
- `PER_TON`
- `PER_KG`
- `PER_UNIT`
- `SERVICE_TOTAL`

### أمثلة
#### خردة نحاس أحمر
- `pricingMode = PER_TON`
- `startingPrice = 8500`
- `currency = USD`

#### ألمنيوم خردة
- `pricingMode = PER_TON`
- `startingPrice = 900`
- `currency = USD`

#### إزالة ردم
- `pricingMode = SERVICE_TOTAL`
- `direction = REVERSE`
- `startingPrice = 50000`
- الفائز قد ينتهي إلى `30000`

---

## 6) التأمينات — الحقيقة التشغيلية

الوضع الحالي “تأمين واحد للمزاد” غير كافٍ.

## 6.1 نماذج التأمين المطلوبة

### A. Flat per auction
مبلغ ثابت على كامل المزاد

### B. Percent of auction baseline
نسبة من القيمة الأساسية

### C. Flat per lot
مثال:
- نحاس أحمر: 2000
- نحاس أصفر: 1500
- ألمنيوم: 1000

### D. Percent per lot
نسبة من سعر البداية لكل بند

### E. Hybrid
- تأمين دخول أساسي للمزاد
- + تأمين إضافي لكل lot مشارك فيه

---

## 6.2 القرار المرحلي
للتنفيذ الواقعي السريع:

### سنعتمد في Phase 2:
- `FLAT_AUCTION`
- `PERCENT_AUCTION`
- `PER_LOT_FLAT`
- `PER_LOT_PERCENT`

### منطق الانضمام
عند اختيار المشارك للـ lots:
- يحسب النظام التأمينات المطلوبة بدقة
- ينشئ hold مستقل لكل lot أو hold واحد مجمع مع breakdown واضح
- الأفضل معماريًا: **hold per lot**
لأن:
- release أسهل
- النزاع أسهل
- التفتيش والمراجعة أسهل
- المحاسبة أوضح

### القرار
**نعتمد Hold per selected lot**  
ولا نستخدم hold تجميعي في هذه المرحلة.

---

## 6.3 أثر التأمين على المشاركة
إذا اختار المشارك:
- Lot 1 فقط → يدفع تأمين Lot 1 فقط
- Lot 1 + Lot 3 → يدفع تأمين الاثنين
- كل lots → يدفع مجموع الكل

---

## 7) منطق الفوز في Multi-Lot

## 7.1 الحالة الحالية الخاطئة
النظام يفترض فائزًا واحدًا على المزاد كاملًا.

## 7.2 الحالة الصحيحة
في `MULTI_INDEPENDENT`:
- لكل Lot فائز مستقل
- قد يفوز نفس الشخص بعدة lots
- وقد يفوز 3 أشخاص مختلفين في 3 مواد مختلفة

### مثال
- Lot A — نحاس أحمر → فائز: تاجر 1
- Lot B — نحاس أصفر → فائز: تاجر 2
- Lot C — ألمنيوم → فائز: تاجر 3

هذه ليست edge case.
هذه حالة أساسية يجب أن يبنى عليها النظام.

---

## 8) المزاد العكسي Reverse Auction

## 8.1 التعريف
بدل أن يبدأ السعر منخفضًا ويصعد، يبدأ سقفًا أعلى ثم ينخفض مع العروض.

## 8.2 قاعدة الفوز
**Lowest valid bid wins**

## 8.3 أمثلة مناسبة
- إزالة أنقاض
- ترحيل
- جمع نفايات
- مقاولات خدمية
- خدمات طرق وبنية تحتية
- تنفيذ حكومي/خاص

## 8.4 ما الذي يتغير؟
### Increment policy
في forward:
- العرض يجب أن يكون **أعلى** من الحالي بمقدار أدنى

في reverse:
- العرض يجب أن يكون **أقل** من الحالي بمقدار أدنى

### رسائل النظام
- forward → “تم تجاوزك”
- reverse → “تم تقديم عرض أقل منك”

### العرض الحالي
- forward → highest
- reverse → lowest

---

## 9) المشاكل الظاهرية الحالية في الواجهة

أنت وصفت أعراضًا دقيقة. هذه ليست مشاكل منفصلة، بل ناتجة عن عقود بيانات مكسورة.

## 9.1 الأعراض
- لوحة الإدارة مشوهة
- صور لا تظهر
- ملفات لا تظهر
- تواريخ خاطئة
- أرقام خاطئة
- صفحة التعديل تعيد من الصفر
- صفحة الإنشاء لا تحتفظ بالحالة
- رسائل الإدارة/المعلن لا تدعم مرفقات حقيقية
- المزاد في حساب التاجر لا يعكس الحقيقة

## 9.2 السبب الجذري
1. **عدم وجود DTO/ViewModel ثابت**
2. **عدم توحيد response contracts**
3. **واجهة create/edit تعمل كـ scattered state**
4. **الـ backend يحفظ جزئيًا بينما الواجهة تتوقع كيانًا غنيًا**
5. **AuctionItem و AuctionDocument و AuctionImage غير مدموجة بشكل منضبط في responses**

---

## 10) ما الذي سننفذه الآن وما الذي لن ننفذه الآن

## 10.1 سننفذ الآن
### المرحلة الأولى التنفيذية
1. تثبيت المعمارية على مستوى الوثيقة
2. فحص Prisma schema الفعلي
3. فحص ما الموجود فعليًا من:
   - Auction
   - AuctionItem
   - AuctionDocument
   - AuctionImage
   - AuctionParticipant
   - Bid
4. تصميم gap matrix
5. تنفيذ **Phase 2A**
   - multi-lot domain normalization
   - lot-bound bidding
   - lot selection in join flow
   - per-lot deposit calculation model
   - forward/reverse enum support
   - currency baseline support
6. تحديث unit/integration tests
7. دفع فوري إلى GitHub

## 10.2 لن ننفذ الآن
- scoring matrix للجودة/المدة في reverse auctions
- real-time file upload contracts للمحادثات
- full legal document workflow
- OCR / contract extraction
- FX conversion engine
- advanced procurement evaluation board
- AI dispute engine

---

## 11) ترتيب التنفيذ الحقيقي

## Step 1 — Schema reality audit
نحتاج أولًا معرفة الحقيقة، لا الأوهام:
- ما الموجود فعليًا في `prisma/schema.prisma`
- ما الجداول الجاهزة
- ما العلاقات الناقصة
- ما الذي تم بناؤه شكليًا فقط

## Step 2 — Contract audit
فحص:
- `src/app/api/auctions/route.ts`
- `src/app/api/auctions/[id]/route.ts`
- `src/app/api/auctions/[id]/join/route.ts`
- `src/app/api/auctions/[id]/bid/route.ts`
- الصفحات:
  - create
  - my-auctions
  - admin auctions
  - auction details

## Step 3 — Domain redesign patch
تعديل schema + core auction engine + join flow + bid flow

## Step 4 — UI/DTO repair
إصلاح عرض:
- الصور
- الوثائق
- المواد
- الأسعار
- التاريخ
- الحالات

## Step 5 — Settlement redesign
إغلاق مالي على مستوى lot وليس فقط auction parent

---

## 12) المخرجات المستهدفة بعد Phase 2A

بعد نجاح هذه المرحلة يجب أن يصبح ممكنًا:

### حالة 1
إنشاء مزاد على:
- نحاس أحمر
- نحاس أصفر
- ألمنيوم

وكل مادة لها:
- سعر بداية مستقل
- وحدة تسعير مستقلة
- تأمين مستقل
- مزايدة مستقلة
- فائز مستقل

### حالة 2
المشارك عند الانضمام يختار:
- مادة واحدة
- مادتين
- كل المواد

والتأمين يحسب بدقة بناءً على اختياره.

### حالة 3
المزاد يمكن أن يكون:
- `FORWARD`
- أو `REVERSE`

### حالة 4
العملة تكون صريحة:
- SYP
- USD

### حالة 5
لوحة الإدارة وحساب التاجر يعرضان:
- الصور الصحيحة
- المستندات الصحيحة
- المواد الصحيحة
- البنود الصحيحة
- الأسعار الصحيحة
- الحالة الصحيحة

---

## 13) القرار التنفيذي الآن

**لن نبدأ من الواجهة.**
هذا خطأ.

سنبدأ من:

1. **Prisma schema audit**
2. **Auction domain inventory**
3. **Gap matrix**
4. **ثم schema patch شامل**
5. **ثم engine patch**
6. **ثم API patch**
7. **ثم UI repair**

---

## 14) أول ملفات الفحص الإجباري في المرحلة القادمة

بعد حفظ هذه الوثيقة، العمل التالي يجب أن يكون على هذه الملفات:

1. `.\prisma\schema.prisma`
2. `.\src\core\auction\auction-types.ts`
3. `.\src\core\auction\auction-engine.ts`
4. `.\src\app\api\auctions\route.ts`
5. `.\src\app\api\auctions\[id]\route.ts`
6. `.\src\app\api\auctions\[id]\join\route.ts`
7. `.\src\app\api\auctions\[id]\bid\route.ts`
8. `.\src\lib\auction\settlement.ts`
9. `.\src\app\auctions\create\page.tsx`
10. `.\src\app\auctions\my-auctions\page.tsx`
11. `.\src\app\admin\auctions\page.tsx`
12. `.\src\app\api\admin\auctions\route.ts`
13. `.\src\app\api\admin\auctions\[id]\route.ts`

---

## 15) الصياغة الحاسمة

إذا لم نربط المزايدة بـ `lotId`  
ولم نربط المشاركة بـ `participant-lot selection`  
ولم نحول التسوية إلى lot-aware financial closure  
فكل ما بنيناه حتى الآن يبقى **مسرحية واجهات فوق محرك غير صالح للسوق الحقيقي**.

---

## 16) next action

بعد حفظ الملف، لا تنتقل عشوائيًا.

الخطوة التالية يجب أن تكون **فتح ملف Prisma schema أولًا** ثم نبدأ فحص الحقيقة الفعلية قبل أي تعديل.
