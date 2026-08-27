# JH Management — Supabase Upgrade: পূর্ণ পরিকল্পনা (২২ দফা)

## ০. প্রথম ধাপ — Schema Export (কোনো কোড লেখার আগে বাধ্যতামূলক)

আমি এই এনভায়রনমেন্ট থেকে সরাসরি আপনার Supabase প্রজেক্টে কানেক্ট করতে পারি না (নেটওয়ার্ক অ্যাক্সেস নেই)। তাই নিচের ৩টা query আপনার Supabase Dashboard → **SQL Editor**-এ একে একে চালিয়ে রেজাল্ট কপি করে আমাকে পাঠান (CSV/JSON/টেবিল যেভাবেই হোক, শুধু ফলাফলটা দরকার — কোনো destructive কিছু এখানে নেই, শুধু `SELECT`)।

**(A) সব টেবিলের কলাম স্ট্রাকচার:**
```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

**(B) সব ফাংশনের সম্পূর্ণ সংজ্ঞা (body সহ):**
```sql
select p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on p.pronamespace = n.oid
where n.nspname = 'public'
order by p.proname;
```

**(C) সব RLS policy:**
```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

**(D) Storage buckets (যদি থাকে):**
```sql
select id, name, public from storage.buckets;
```

এই চারটা ছাড়া আমি নিরাপদে migration SQL লিখতে পারব না — কারণ existing function-এর ভেতরের লজিক না জেনে নতুন কিছু জোড়া লাগাতে গেলে conflict/override হয়ে existing data বা logic নষ্ট হওয়ার ঝুঁকি থাকে। এটা পাওয়ার পর আমি সব migration **শুধু additive** (নতুন কলাম/টেবিল/ফাংশন/bucket — কখনো `DROP`/destructive না) আকারে লিখব, এবং কোনটা আগে/পরে রান করতে হবে তার ক্রম সহ দেব।

---

## সামগ্রিক কাঠামো — ২২ দফা → ৯টা ধাপে বিভক্ত

| ধাপ | কভার করে | নির্ভরতা |
|---|---|---|
| **Phase 1 — Storage & Auth Foundation** | (§7,17,20) নতুন Admin account (Supabase Auth), Storage buckets (product-photo, cash-memo, payment-screenshot), bucket-level RLS | Schema export |
| **Phase 2 — Product & Purchase System** | (§6) Product photo, Cash memo photo, expiry ফিল্ড | Phase 1 |
| **Phase 3 — Central Godown Transfer Workflow** | (§4,14) Pending→Accept/Reject, stock শুধু accept হলে update, negative stock guard | Schema export |
| **Phase 4 — Payment System** | (§8,9,10) amount=0 হলে payment তৈরি না হওয়া, pending→approve/reject, idempotent approval, WhatsApp payment screen (01856191004) | Phase 2 |
| **Phase 5 — Expiry Management** | (§11) Dashboard alert, Expired Products section | Phase 2 |
| **Phase 6 — Cake মডিউল সম্পূর্ণ করা** | (§13) cake_products/cake_entries ব্যবহার করে পুরো cake flow | Phase 1 |
| **Phase 7 — Dashboard + Sidebar + Mobile UI** | (§2,3,18,21) "আজকের এন্ট্রি", drawer menu, professional layout | সব Phase-এর সাথে সমান্তরালে করা যায় |
| **Phase 8 — Admin Control Center** | (§15) Companies/Stores/Godown/Payments/Subscriptions/Products/Sales/Expiry/Transfer — এক জায়গায় | Phase 3,4,5,6 |
| **Phase 9 — Language System + Security Audit + Final QA** | (§12,16,19,22) পূর্ণ i18n, company isolation যাচাই, ২২ দফার টেস্ট চেকলিস্ট | সব শেষে |

---

## Phase বিস্তারিত

### Phase 1 — Storage & Auth Foundation
- Supabase Storage-এ ৩টা **private** bucket তৈরি: `product-photos`, `cash-memos`, `payment-screenshots`
- RLS: প্রতিটা object-এর path-এ `company_id` prefix থাকবে, policy চেক করবে `auth.uid()`-এর company_id path-এর সাথে মেলে কিনা (super_admin ছাড়া)
- আপনার ইমেইল (`p03305483@gmail.com`) দিয়ে নতুন company_admin/super_admin — এটা **Supabase Auth signup API দিয়েই হবে**, password কোডে বসাব না; আমি শুধু সাইন-আপ ফর্ম/স্ক্রিপ্ট দেব, পাসওয়ার্ড আপনি নিজে টাইপ করবেন
- Deliverable: migration SQL (bucket + policy) + auth setup instructions

### Phase 2 — Product & Purchase System
- Product entry ফর্মে যোগ: photo upload, cash memo photo upload, expiry date (ইতিমধ্যে আংশিক আছে কিনা schema export দেখে বলব)
- `products`/সম্পর্কিত টেবিলে নতুন কলাম (additive: `photo_url`, `cash_memo_url`) — যদি না থাকে
- Product list card-এ thumbnail, detail view-এ বড় ছবি

### Phase 3 — Central Godown Transfer Workflow
- বর্তমানে `submit_stock_movement` / `respond_stock_movement` / `get_pending_movements` আছে — এগুলোর ভেতরের লজিক (accept করলেই stock বসে কিনা) schema export থেকে যাচাই করব
- দরকার হলে function আপডেট (নতুন version, পুরনোটা replace না করে পাশাপাশি সেফটি-চেক)
- Negative stock guard, pending অবস্থায় stock touch না হওয়া নিশ্চিত করা

### Phase 4 — Payment System
- Logic (আপনার §8 অনুযায়ী): amount খালি/０ হলে payment row তৈরিই হবে না; amount দিলে `status='pending'`, admin approve করলেই company balance-এ যোগ
- Idempotency: `approved_at`/`approved_by` না থাকলে approve করা যায়, একবার approve হলে বাটন disable/status lock
- Payment স্ক্রিন: bKash/Nagad/Rocket তালিকা + WhatsApp বাটন → `https://wa.me/8801856191004`
- Reject reason ফিল্ড

### Phase 5 — Expiry Management
- Dashboard-এর উপরে alert card (Expired / আজ / ৭ দিনে)
- Expired Products আলাদা section, প্রতি প্রোডাক্টে ছবি+quantity+store+কতদিন expired

### Phase 6 — Cake মডিউল
- বর্তমান কোডে Cake tab আছে কিনা schema/App.jsx-এ যাচাই করে সম্পূর্ণ করব: Add/Transfer/Return/Wastage/Sale/Expiry/History — সব `cake_products`/`cake_entries` দিয়ে

### Phase 7 — Dashboard + Sidebar + Mobile
- বাম পাশে drawer/sidebar (mobile-এ hamburger): Dashboard, Stores, Central Godown, Products, Stock, Stock Transfer, Expired Products, Cake, Sales, Payments, Notices, Reports, Subscription, Admin Control, Settings
- Dashboard টপে "আজকের এন্ট্রি": আজ কয়টা product/movement/sale, কত টাকা pending/approved, expiry alert

### Phase 8 — Admin Control Center
- এক জায়গায় সব: Companies, Stores, Central Godown stock, Payments (pending/approved/rejected), Subscriptions (trial/active/expired/blocked), Products, Sales, Expiry, Transfer history

### Phase 9 — ভাষা + সিকিউরিটি + QA
- Hard-coded টেক্সট কমিয়ে একটা কেন্দ্রীয় translation object; `localStorage`-এ ভাষা সংরক্ষণ
- Company isolation পুনরায় verify (RLS + client কোড দুই জায়গাতেই)
- আপনার ১২-দফা টেস্ট চেকলিস্ট (§22) পুরোপুরি রান করে রিপোর্ট

---

## প্রতিটা Phase-এর ডেলিভারি ফরম্যাট (আপনার §22 অনুযায়ী)
প্রতিটা Phase শেষে পাবেন:
- **A.** Updated project files (zip)
- **B.** নতুন SQL migration ফাইল (শুধু additive, ক্রমানুসারে নম্বর করা: `001_...sql`, `002_...sql`)
- **C.** কোন কোন file পরিবর্তন হয়েছে তার তালিকা
- **D.** কোন SQL আগে/পরে রান করতে হবে
- **E.** কোনো existing function/table ছোঁয়া লাগলে সেটা স্পষ্টভাবে আলাদা করে জানানো

---

## আপডেট — আপনার দ্বিতীয় (বিস্তারিত) প্রম্পট থেকে যোগ হলো
আপনার দ্বিতীয় প্রম্পটে আগেরটার চেয়ে আরও স্পষ্ট কিছু নিয়ম দিয়েছেন — সেগুলো প্ল্যানে যোগ করে দিলাম:

**Role স্পষ্টীকরণ (৩ স্তর, আগে যা ছিল তার চেয়ে বিস্তারিত):**
- **Super Admin** — সব company/store/godown/cost/payment/report দেখতে ও approve করতে পারবে
- **Company Admin / Supervisor** — শুধু নিজের company-এর Godown+Store, transfer পাঠানো/approve করা, product/payment manage
- **Store** — শুধু নিজের stock; Godown থেকে request/receive করতে পারবে, কিন্তু Godown-এর পূর্ণ stock বা অন্য Store দেখতে পারবে না

**Stock movement rules (Phase 3-এ এই টেবিল অনুযায়ী ফাংশন লজিক মেলাব):**
| Movement | প্রভাব |
|---|---|
| Purchase/Receive (Godown) | Godown stock + quantity |
| Godown → Store (accepted) | Godown − qty, Store + qty |
| Store → Godown return | Store − qty, Godown + qty |
| Wastage | সংশ্লিষ্ট stock − qty |
| Sale | Store stock − qty |
| Rejected transfer | stock অপরিবর্তিত |

Duplicate movement যেন দুইবার apply না হয় (idempotency) — Phase 3-এর মূল ফোকাস।

**Expiry status — ৩ স্তরের নির্দিষ্ট রং/লেবেল যোগ হলো:**
🔴 EXPIRED (আজকের আগে) → 🟠 EXPIRING SOON (warning period-এর মধ্যে) → 🟢 SAFE — Dashboard ও Stock page দুই জায়গাতেই এই ক্রমে (EXPIRED সবার উপরে) দেখাবে।

**Product/Purchase entry-তে চূড়ান্ত ফিল্ড লিস্ট (Phase 2):**
`product_name, unit, quantity, amount(optional), supplier, purchase_date, expiry_date(optional), note, product_photo(optional), cash_memo_photo(required if amount>0)`

**সম্ভাব্য নতুন কলাম (schema export দেখার পর নিশ্চিত করব, আগে থেকে থাকলে duplicate করব না):**
`product_photo, invoice_photo, supplier, purchase_date, expiry_date, payment_status, payment_amount, approved_by, approved_at, rejection_reason`

**Final delivery report (Phase শেষে যা জানাব — এবার ১২ দফা আকারে):**
1. কোন existing feature already working
2. কোন feature missing ছিল
3. কোন bug পেয়েছি
4. কোন database change দরকার
5. কোন SQL migration তৈরি করেছি
6. কোন frontend file পরিবর্তন করেছি
7. Supabase Storage লাগবে কি না
8. RLS/security কীভাবে ঠিক করেছি
9. Cake page কীভাবে চালু করেছি
10. Language system কীভাবে ঠিক করেছি
11. Payment approval flow কীভাবে কাজ করবে
12. Godown → Store flow কীভাবে কাজ করবে

এই বিস্তারিত প্রম্পটে নতুন কোনো ZIP বা schema export attach হয়নি — নিচের অংশ এখনও অপরিবর্তিত (এখনও দরকার)।

## ✅ Phase 1 — ডেলিভার করা হলো (SQL export ছাড়াই, ঝুঁকিহীন অংশটুকু)

**A. যা আছে:** `migrations/001_phase1_storage_buckets.sql`
- ৩টা bucket তৈরি করে: `product-photos`, `cash-memos`, `payment-screenshots` (সব private)
- RLS policy — আপনার আগে থেকে থাকা `my_role()` ও `my_company_id()` ফাংশন ব্যবহার করে, তাই কোনো টেবিলের গঠন অনুমান করতে হয়নি
- সম্পূর্ণ idempotent — দ্বিতীয়বার চালালেও ভাঙবে না, `DROP TABLE`/`DROP SCHEMA` কোথাও নেই

**B. কীভাবে চালাবেন:**
1. Supabase SQL Editor-এ `001_phase1_storage_buckets.sql`-এর পুরো কনটেন্ট পেস্ট করে Run করুন
2. Error এলে সম্পূর্ণ error message আমাকে পাঠান — সেই এক জায়গা ঠিক করে দেব (বাকি অংশ ইতিমধ্যে apply হয়ে যাবে)
3. Success হলে Storage → Buckets-এ গিয়ে ৩টা bucket দেখতে পাবেন

**C. নতুন Admin Account (p03305483@gmail.com) — কোনো নতুন SQL লাগছে না:**
আপনার existing কোডে `bootstrap_company` RPC + `CompanyAuthScreen` ইতিমধ্যে ঠিক এই কাজটার জন্যই বানানো আছে। তাই নতুন কিছু না বানিয়ে existing flow ব্যবহার করাই সবচেয়ে নিরাপদ:
1. অ্যাপ খুলুন → Company sign-up স্ক্রিনে যান
2. Email: `p03305483@gmail.com`, নিজের একটা পাসওয়ার্ড দিন (কোথাও লেখা/সংরক্ষণ করব না)
3. Company name, WhatsApp, Store PIN, Godown PIN দিয়ে সাবমিট করুন — এটা `bootstrap_company` RPC কল করবে এবং automatically profile/company তৈরি করে দেবে
4. এই account-টাকে `super_admin` করতে চাইলে (শুধু company_admin না) সেটার জন্য আপনার `profiles` টেবিলের role আপডেট করতে একটা ছোট SQL লাগবে — কিন্তু এই টেবিলের exact কলাম না জেনে সেটা লেখা ঝুঁকিপূর্ণ। এই একটা statement-এর জন্যই শুধু Query (A)-এর ফলাফল (বা শুধু `profiles` টেবিলের কলাম লিস্ট) পাঠালেই যথেষ্ট।

## এখন যা লাগবে আপনার কাছ থেকে
উপরের **০ নম্বর ধাপের** (A)(B)(C)(D) — এই ৪টা SQL query আপনার Supabase SQL Editor-এ চালিয়ে ফলাফল (স্ক্রিনশট/টেক্সট/CSV, যেকোনোভাবে) পাঠান। এটা পাওয়ার সাথে সাথেই আমি আসল কোড/migration লেখা শুরু করব — এখন পর্যন্ত এখনো সেটা পাইনি, তাই এখনো কোনো destructive/uncertain change করিনি।
