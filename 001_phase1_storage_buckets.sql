-- ============================================================
-- Phase 1 — Storage Buckets + RLS
-- নিরাপদ/additive: কোনো DROP নেই, existing কিছু ছোঁয়া হয়নি।
-- এই স্ক্রিপ্ট আপনার আগে থেকে থাকা my_role() ও my_company_id()
-- ফাংশন ব্যবহার করে (আপনার তালিকায় দেওয়া ফাংশন) — তাই কোনো
-- টেবিলের কলাম গঠন অনুমান করার দরকার হয়নি।
--
-- চালানোর আগে: my_role() যদি text রিটার্ন করে (যেমন 'super_admin',
-- 'company_admin', 'store', 'godown') এবং my_company_id() যদি uuid
-- রিটার্ন করে — এই দুটো ধরে নিয়ে লেখা হয়েছে। যদি এই দুই ফাংশনের
-- রিটার্ন টাইপ/মান আলাদা হয়, নিচের policy অংশে error আসবে —
-- সেই error message আমাকে পাঠালেই ঠিক করে দেব।
-- ============================================================

-- ---------- 1. Buckets (idempotent — দ্বিতীয়বার চালালেও সমস্যা নেই) ----------
insert into storage.buckets (id, name, public)
values
  ('product-photos', 'product-photos', false),
  ('cash-memos', 'cash-memos', false),
  ('payment-screenshots', 'payment-screenshots', false)
on conflict (id) do nothing;

-- ---------- 2. Upload path convention ----------
-- সব ফাইল এই path pattern-এ আপলোড হবে: {company_id}/{filename}
-- উদাহরণ: 3fae21.../milk_2026-08-27.jpg
-- এটা মেনে ফাইল আপলোড না করলে নিচের RLS policy কাজ করবে না।

-- ---------- 3. RLS policies: product-photos ----------
drop policy if exists "product_photos_select_own_company" on storage.objects;
create policy "product_photos_select_own_company"
on storage.objects for select
using (
  bucket_id = 'product-photos'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

drop policy if exists "product_photos_insert_own_company" on storage.objects;
create policy "product_photos_insert_own_company"
on storage.objects for insert
with check (
  bucket_id = 'product-photos'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

drop policy if exists "product_photos_delete_own_company" on storage.objects;
create policy "product_photos_delete_own_company"
on storage.objects for delete
using (
  bucket_id = 'product-photos'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

-- ---------- 4. RLS policies: cash-memos ----------
drop policy if exists "cash_memos_select_own_company" on storage.objects;
create policy "cash_memos_select_own_company"
on storage.objects for select
using (
  bucket_id = 'cash-memos'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

drop policy if exists "cash_memos_insert_own_company" on storage.objects;
create policy "cash_memos_insert_own_company"
on storage.objects for insert
with check (
  bucket_id = 'cash-memos'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

-- Cash memo সাধারণত delete করা উচিত না (হিসাবের প্রমাণ), তাই delete policy দেওয়া হলো না।
-- দরকার হলে পরে super_admin-only delete policy যোগ করা যাবে।

-- ---------- 5. RLS policies: payment-screenshots ----------
drop policy if exists "payment_ss_select_own_company" on storage.objects;
create policy "payment_ss_select_own_company"
on storage.objects for select
using (
  bucket_id = 'payment-screenshots'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

drop policy if exists "payment_ss_insert_own_company" on storage.objects;
create policy "payment_ss_insert_own_company"
on storage.objects for insert
with check (
  bucket_id = 'payment-screenshots'
  and (
    my_role() = 'super_admin'
    or (storage.foldername(name))[1] = my_company_id()::text
  )
);

-- ============================================================
-- এই স্ক্রিপ্ট Supabase SQL Editor-এ চালান। কোনো error এলে
-- error message-টা (পুরো টেক্সট) আমাকে পাঠান, লাইন নম্বর সহ —
-- ওই এক জায়গায় ঠিক করে দেব, বাকি অংশ ইতিমধ্যে চলে যাবে।
-- ============================================================
