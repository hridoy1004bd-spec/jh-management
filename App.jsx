import React, { useState, useEffect, useMemo, createContext, useContext } from "react";
import {
  LogOut, Calendar, User, Wallet, CreditCard, Landmark, Truck, Bike, Camera,
  StickyNote, Receipt, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
  Lock, ChevronRight, Package, PackageX, AlertTriangle, Plus, Trash2,
  CalendarClock, ClipboardList, LayoutGrid, Download, Printer, Cake, Copy,
  Check, Banknote, Phone, Building2, Mail, KeyRound, Bell, Users, RotateCcw,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

/* ============================== SUPABASE CONFIG ============================ */
const SUPABASE_URL = "https://htecpuzjheipbyeqwqhh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZWNwdXpqaGVpcGJ5ZXF3cWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNzY5MzQsImV4cCI6MjEwMjk1MjkzNH0.j2gyht9oXE7d7_Az7xWh7d17_gKta2gbxQixCOc89A4";

// Generic REST call (respects RLS; pass accessToken for authenticated admin calls)
async function supaRest(path, { method = "GET", body, accessToken, prefer } = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// RPC call (functions defined in the SQL setup). anon key used unless accessToken given.
async function supaRpc(fn, params = {}, accessToken) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `RPC failed (${res.status})`);
  }
  return res.json();
}

// Supabase Auth (email/password) for company_admin / super_admin
async function authSignUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || "Sign up failed");
  return data; // { access_token, user, ... }
}
async function authSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || "Login failed");
  return data; // { access_token, user, ... }
}

// Upload a photo to Supabase Storage. Path convention: {companyId}/{pin}/{filename}
// This matches the PIN-based upload RLS policy (no auth.uid() available for PIN users).
async function uploadPhoto(bucket, companyId, pin, file) {
  if (!file) return null;
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${companyId}/${pin}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed (${res.status})`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/* ================================= THEME =================================== */
const NAVY = "#16233F";
const NAVY_SOFT = "#1F3864";
const GOLD = "#C7962C";
const GOLD_SOFT = "#F4E7C7";
const BG = "#F5F6F8";
const CARD = "#FFFFFF";
const MUTED = "#6B7280";
const DANGER = "#C0392B";
const SUCCESS = "#1E7B4D";
const WARNING = "#B7791F";
const WARNING_SOFT = "#FBF0DC";

const PAYMENT_METHODS = [
  { id: "bkash", name: "bKash", number: "01880176772", color: "#E2136E" },
  { id: "nagad", name: "Nagad", number: "01856191004", color: "#F6921E" },
  { id: "rocket", name: "Rocket", number: "", color: "#8C3494" },
];
const BANK_ACCOUNTS = [];

function LogoBadge({ size = 36 }) {
  return (
    <div className="jh-font-display flex items-center justify-center rounded-full font-bold shrink-0"
         style={{ width: size, height: size, background: GOLD, color: NAVY, fontSize: size * 0.4, border: `2px solid ${GOLD}` }}>
      JH
    </div>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Tajawal:wght@500;700;800&display=swap');
      .jh-font-display { font-family: 'Sora', 'Tajawal', sans-serif; }
      .jh-font-body { font-family: 'Inter', 'Tajawal', sans-serif; }
      .jh-input:focus { outline: 2px solid ${GOLD}; outline-offset: 1px; }
      .jh-btn:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }
    `}</style>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="jh-font-body flex items-center gap-1.5 text-xs font-semibold" style={{ color: MUTED }}>
        {Icon && <Icon size={13} />} {label}
      </label>
      {children}
    </div>
  );
}
function TextInput(props) {
  return <input {...props} className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3", color: NAVY }} />;
}
function NumInput({ value, onChange, placeholder = "0.00" }) {
  return (
    <input type="number" inputMode="decimal" className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm"
      style={{ borderColor: "#D9DCE3", color: NAVY }} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  );
}
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function fmt(n) {
  if (n === "" || n === null || n === undefined || isNaN(n)) return "-";
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function todayISO() {
  const d = new Date(); const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr) - new Date(todayISO())) / 86400000);
}

/* ============================== TRANSLATIONS =============================== */
const STR = {
  bn: {
    appName: "জে এইচ ম্যানেজমেন্ট", tagline: "মাল্টি-বিজনেস ম্যানেজমেন্ট প্ল্যাটফর্ম",
    pinLogin: "PIN দিয়ে লগইন (Store/Godown)", companyLogin: "কোম্পানি Login / Sign up",
    enterPin: "PIN দিন", login: "Login", wrongPin: "ভুল PIN, আবার চেষ্টা করুন",
    email: "ইমেইল", password: "পাসওয়ার্ড", companyName: "কোম্পানির নাম", whatsapp: "WhatsApp নম্বর",
    storePin: "Store PIN (নিজে ঠিক করুন)", godownPin: "Godown PIN (নিজে ঠিক করুন)",
    signUp: "Sign up (নতুন কোম্পানি)", haveAccount: "আগে থেকেই একাউন্ট আছে? Login করুন",
    noAccount: "একাউন্ট নেই? Sign up করুন", back: "ফিরে যান", logout: "Logout",
    loading: "লোড হচ্ছে...", saving: "সেভ হচ্ছে...", submit: "Submit",
    savedOk: "✅ সফলভাবে সেভ হয়েছে", savedFail: "❌ সমস্যা হয়েছে:",
    tabEntry: "বিক্রয় এন্ট্রি", tabInventory: "ইনভেন্টরি", tabDashboard: "Dashboard",
    tabPayment: "সাবস্ক্রিপশন", tabPending: "অপেক্ষারত অনুমতি", tabNotices: "নোটিশ",
    name: "নাম", date: "তারিখ", open: "OPEN", cash: "CASH", mada: "MADA", visa: "VISA",
    master: "MASTER", hangar: "HANGAR", jahez: "JAHEZ", systemSales: "System Sales",
    actualSales: "ACTUAL SALES", shortPlus: "SHORT/PLUS", expense: "EXPENSE", note: "NOTE",
    recentEntries: "সাম্প্রতিক এন্ট্রি", noEntries: "কোনো এন্ট্রি নেই",
    productName: "পণ্যের নাম", quantity: "পরিমাণ", unit: "একক", costTotal: "মোট টাকা",
    expiryDate: "মেয়াদ শেষের তারিখ", addProduct: "পণ্য/মুভমেন্ট যোগ করুন",
    movementType: "ধরন", purchase: "কেনা (Purchase)", transfer: "Transfer (অন্য জায়গায় পাঠানো)",
    ret: "Return (ফেরত)", wastage: "Wastage (নষ্ট)", sale: "Sale (বিক্রি)",
    toLocation: "কোথায় পাঠানো হচ্ছে", currentStock: "বর্তমান স্টক", noStock: "কোনো স্টক নেই",
    pendingApprovals: "আপনার অনুমোদনের অপেক্ষায়", accept: "✅ গ্রহণ করুন (Yes)", reject: "❌ বাতিল (No)",
    noPending: "কোনো অপেক্ষারত অনুরোধ নেই", from: "থেকে এসেছে", qty: "পরিমাণ",
    subscriptionTitle: "সাবস্ক্রিপশন / পেমেন্ট", trialStatus: "ট্রায়াল চলছে", activeStatus: "সক্রিয়",
    pendingPayment: "পেমেন্ট বাকি", blockedStatus: "বন্ধ আছে", dueDate: "পরবর্তী পেমেন্টের তারিখ",
    daysLeft: "দিন বাকি", sendMoneyTo: "এই নম্বরে টাকা পাঠান", copyNumber: "কপি করুন", copied: "✅ কপি হয়েছে",
    comingSoon: "শীঘ্রই আসছে", bankTitle: "ব্যাংক অ্যাকাউন্ট", bankComingSoon: "শীঘ্রই যোগ হবে",
    addStore: "নতুন Store যোগ করুন", newStoreName: "নতুন Store-এর নাম", newStorePin: "নতুন PIN",
    contactUs: "☎️ সমস্যা হলে যোগাযোগ করুন", noticesTitle: "নোটিশ", noNotices: "কোনো নোটিশ নেই",
    postNotice: "নোটিশ পাঠান (সবাই দেখবে)", noticeTitleField: "শিরোনাম", noticeMsg: "বার্তা",
    allCompanies: "সব কোম্পানি (Super Admin)", stockReport: "স্টক রিপোর্ট", salesReport: "বিক্রয় রিপোর্ট",
    godownReport: "গোডাউনের হিসাব", cakeReport: "কেক হিসাব", totalValue: "মোট মূল্য",
    company: "কোম্পানি", store: "Store", godown: "Godown", role: "ভূমিকা",
    supplier: "সাপ্লায়ার", purchaseDate: "কেনার তারিখ", productPhoto: "পণ্যের ছবি", cashMemo: "ক্যাশ মেমো/ইনভয়েস",
    paymentWillBePending: "টাকা দেওয়া থাকলে পেমেন্ট Admin অনুমোদনের অপেক্ষায় থাকবে",
    pendingPayments: "অপেক্ষারত পেমেন্ট", approve: "✅ অনুমোদন করুন", rejectPayment: "❌ বাতিল করুন",
    noPendingPayments: "কোনো অপেক্ষারত পেমেন্ট নেই", amount: "টাকার পরিমাণ",
    expired: "মেয়াদ শেষ", expiringSoon: "মেয়াদ শীঘ্রই শেষ হবে", safe: "নিরাপদ",
    notEnoughStock: "পর্যাপ্ত স্টক নেই", outOfStock: "স্টক নেই", searchProduct: "পণ্যের নাম লিখে খুঁজুন",
    available: "মজুদ আছে", retToSupplier: "সাপ্লায়ারকে ফেরত (Return)",
  },
  en: {
    appName: "J H Management", tagline: "Multi-business Management Platform",
    pinLogin: "PIN Login (Store/Godown)", companyLogin: "Company Login / Sign up",
    enterPin: "Enter PIN", login: "Login", wrongPin: "Wrong PIN, try again",
    email: "Email", password: "Password", companyName: "Company Name", whatsapp: "WhatsApp Number",
    storePin: "Store PIN (choose your own)", godownPin: "Godown PIN (choose your own)",
    signUp: "Sign up (new company)", haveAccount: "Already have an account? Login",
    noAccount: "No account? Sign up", back: "Back", logout: "Logout",
    loading: "Loading...", saving: "Saving...", submit: "Submit",
    savedOk: "✅ Saved successfully", savedFail: "❌ Error:",
    tabEntry: "Sales Entry", tabInventory: "Inventory", tabDashboard: "Dashboard",
    tabPayment: "Subscription", tabPending: "Pending Approvals", tabNotices: "Notices",
    name: "Name", date: "Date", open: "OPEN", cash: "CASH", mada: "MADA", visa: "VISA",
    master: "MASTER", hangar: "HANGAR", jahez: "JAHEZ", systemSales: "System Sales",
    actualSales: "ACTUAL SALES", shortPlus: "SHORT/PLUS", expense: "EXPENSE", note: "NOTE",
    recentEntries: "Recent Entries", noEntries: "No entries yet",
    productName: "Product Name", quantity: "Quantity", unit: "Unit", costTotal: "Total Cost",
    expiryDate: "Expiry Date", addProduct: "Add Product/Movement",
    movementType: "Type", purchase: "Purchase", transfer: "Transfer (to another location)",
    ret: "Return", wastage: "Wastage", sale: "Sale",
    toLocation: "Send to", currentStock: "Current Stock", noStock: "No stock",
    pendingApprovals: "Waiting for your approval", accept: "✅ Accept (Yes)", reject: "❌ Reject (No)",
    noPending: "No pending requests", from: "From", qty: "Quantity",
    subscriptionTitle: "Subscription / Payment", trialStatus: "Trial active", activeStatus: "Active",
    pendingPayment: "Payment due", blockedStatus: "Blocked", dueDate: "Next due date",
    daysLeft: "days left", sendMoneyTo: "Send money to this number", copyNumber: "Copy", copied: "✅ Copied",
    comingSoon: "Coming soon", bankTitle: "Bank Account", bankComingSoon: "Coming soon",
    addStore: "Add new Store", newStoreName: "New Store name", newStorePin: "New PIN",
    contactUs: "☎️ Contact us for issues", noticesTitle: "Notices", noNotices: "No notices",
    postNotice: "Post a notice (everyone sees)", noticeTitleField: "Title", noticeMsg: "Message",
    allCompanies: "All Companies (Super Admin)", stockReport: "Stock Report", salesReport: "Sales Report",
    godownReport: "Godown Report", cakeReport: "Cake Report", totalValue: "Total Value",
    company: "Company", store: "Store", godown: "Godown", role: "Role",
    supplier: "Supplier", purchaseDate: "Purchase Date", productPhoto: "Product Photo", cashMemo: "Cash Memo / Invoice",
    paymentWillBePending: "If amount is entered, payment will wait for admin approval",
    pendingPayments: "Pending Payments", approve: "✅ Approve", rejectPayment: "❌ Reject",
    noPendingPayments: "No pending payments", amount: "Amount",
    expired: "Expired", expiringSoon: "Expiring Soon", safe: "Safe",
    notEnoughStock: "Not enough stock", outOfStock: "Out of stock", searchProduct: "Type to search product",
    available: "Available", retToSupplier: "Return to Supplier",
  },
  ar: {
    appName: "جي إتش للإدارة", tagline: "منصة إدارة الأعمال متعددة الشركات",
    pinLogin: "الدخول برمز PIN", companyLogin: "دخول / تسجيل الشركة",
    enterPin: "أدخل الرمز", login: "دخول", wrongPin: "رمز خاطئ",
    email: "البريد الإلكتروني", password: "كلمة المرور", companyName: "اسم الشركة", whatsapp: "رقم واتساب",
    storePin: "رمز المتجر", godownPin: "رمز المستودع",
    signUp: "تسجيل شركة جديدة", haveAccount: "لديك حساب؟ دخول",
    noAccount: "لا يوجد حساب؟ سجل", back: "رجوع", logout: "خروج",
    loading: "جارٍ التحميل...", saving: "جارٍ الحفظ...", submit: "إرسال",
    savedOk: "✅ تم الحفظ", savedFail: "❌ خطأ:",
    tabEntry: "إدخال المبيعات", tabInventory: "المخزون", tabDashboard: "لوحة التحكم",
    tabPayment: "الاشتراك", tabPending: "بانتظار الموافقة", tabNotices: "الإشعارات",
    name: "الاسم", date: "التاريخ", open: "الافتتاح", cash: "نقداً", mada: "مدى", visa: "فيزا",
    master: "ماستركارد", hangar: "هنقر", jahez: "جاهز", systemSales: "مبيعات النظام",
    actualSales: "المبيعات الفعلية", shortPlus: "عجز/زيادة", expense: "المصروفات", note: "ملاحظة",
    recentEntries: "الإدخالات الأخيرة", noEntries: "لا توجد إدخالات",
    productName: "اسم المنتج", quantity: "الكمية", unit: "الوحدة", costTotal: "التكلفة الإجمالية",
    expiryDate: "تاريخ الصلاحية", addProduct: "إضافة حركة",
    movementType: "النوع", purchase: "شراء", transfer: "تحويل", ret: "مرتجع", wastage: "هدر", sale: "بيع",
    toLocation: "أرسل إلى", currentStock: "المخزون الحالي", noStock: "لا يوجد مخزون",
    pendingApprovals: "بانتظار موافقتك", accept: "✅ قبول", reject: "❌ رفض",
    noPending: "لا توجد طلبات", from: "من", qty: "الكمية",
    subscriptionTitle: "الاشتراك / الدفع", trialStatus: "تجربة مجانية", activeStatus: "نشط",
    pendingPayment: "الدفع مستحق", blockedStatus: "محظور", dueDate: "تاريخ الاستحقاق",
    daysLeft: "أيام متبقية", sendMoneyTo: "أرسل إلى هذا الرقم", copyNumber: "نسخ", copied: "✅ تم النسخ",
    comingSoon: "قريباً", bankTitle: "حساب بنكي", bankComingSoon: "قريباً",
    addStore: "إضافة متجر جديد", newStoreName: "اسم المتجر", newStorePin: "رمز جديد",
    contactUs: "☎️ تواصل معنا", noticesTitle: "الإشعارات", noNotices: "لا إشعارات",
    postNotice: "نشر إشعار", noticeTitleField: "العنوان", noticeMsg: "الرسالة",
    allCompanies: "كل الشركات", stockReport: "تقرير المخزون", salesReport: "تقرير المبيعات",
    godownReport: "تقرير المستودع", cakeReport: "تقرير الكيك", totalValue: "القيمة الإجمالية",
    company: "الشركة", store: "متجر", godown: "مستودع", role: "الدور",
    supplier: "المورّد", purchaseDate: "تاريخ الشراء", productPhoto: "صورة المنتج", cashMemo: "الفاتورة",
    paymentWillBePending: "إذا تم إدخال مبلغ، سينتظر الدفع موافقة المشرف",
    pendingPayments: "المدفوعات المعلقة", approve: "✅ موافقة", rejectPayment: "❌ رفض",
    noPendingPayments: "لا توجد مدفوعات معلقة", amount: "المبلغ",
    expired: "منتهي الصلاحية", expiringSoon: "قريب الانتهاء", safe: "آمن",
    notEnoughStock: "لا يوجد مخزون كافٍ", outOfStock: "نفذ المخزون", searchProduct: "اكتب للبحث عن المنتج",
    available: "المتوفر", retToSupplier: "إرجاع إلى المورّد",
  },
};
const LangContext = createContext(null);
function useLang() { return useContext(LangContext); }
function LangSwitcher({ compact }) {
  const { lang, setLang } = useLang();
  const opts = [{ k: "bn", l: "বাং" }, { k: "en", l: "EN" }, { k: "ar", l: "AR" }];
  return (
    <div className="flex items-center gap-1 rounded-full p-1" style={{ background: compact ? "rgba(255,255,255,0.12)" : "#EEF0F3" }}>
      {opts.map((o) => (
        <button key={o.k} onClick={() => setLang(o.k)} className="jh-btn text-[11px] font-bold px-2 py-1 rounded-full"
          style={{ background: lang === o.k ? GOLD : "transparent", color: lang === o.k ? NAVY : (compact ? "white" : MUTED) }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ============================== ENTRY GATE =================================== */
function EntryGate({ onPinMode, onCompanyMode }) {
  const { t, lang } = useLang();
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: NAVY }}>
      <GlobalStyle />
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4"><LangSwitcher compact /></div>
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4"><LogoBadge size={80} /></div>
          <h1 className="jh-font-display text-2xl font-bold text-white tracking-tight">{t.appName}</h1>
          <p className="jh-font-body text-sm mt-1" style={{ color: "#9AA5BD" }}>{t.tagline}</p>
        </div>
        <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: CARD }}>
          <button onClick={onPinMode} className="jh-btn jh-font-body w-full rounded-lg py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: NAVY_SOFT }}>
            <KeyRound size={16} /> {t.pinLogin}
          </button>
          <button onClick={onCompanyMode} className="jh-btn jh-font-body w-full rounded-lg py-3.5 text-sm font-bold flex items-center justify-center gap-2 border" style={{ borderColor: GOLD, color: NAVY }}>
            <Building2 size={16} /> {t.companyLogin}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== PIN LOGIN =================================== */
function PinLoginScreen({ onLoggedIn, onBack }) {
  const { t } = useLang();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const rows = await supaRpc("verify_location_pin", { p_pin: pin });
      if (!rows || rows.length === 0) { setError(t.wrongPin); setBusy(false); return; }
      onLoggedIn({ pin, ...rows[0] });
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: NAVY }}>
      <GlobalStyle />
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4"><LangSwitcher compact /></div>
        <div className="flex flex-col items-center mb-8"><LogoBadge size={64} /></div>
        <div className="rounded-2xl p-6" style={{ background: CARD }}>
          <Field icon={Lock} label={t.enterPin}>
            <input type="password" inputMode="numeric" className="jh-input jh-font-body w-full rounded-lg border px-3 py-2.5 text-sm mt-1 tracking-widest"
              style={{ borderColor: error ? DANGER : "#D9DCE3", color: NAVY }} placeholder="••••" value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          {error && <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: DANGER }}><AlertCircle size={13} /> {error}</div>}
          <button onClick={submit} disabled={busy} className="jh-btn jh-font-body w-full mt-5 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT }}>
            {busy ? t.loading : t.login} <ChevronRight size={16} />
          </button>
          <button onClick={onBack} className="jh-btn w-full mt-3 text-xs font-semibold" style={{ color: MUTED }}>{t.back}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== COMPANY AUTH ================================= */
function CompanyAuthScreen({ onLoggedIn, onBack }) {
  const { t } = useLang();
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [storePin, setStorePin] = useState("");
  const [godownPin, setGodownPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    setBusy(true); setError("");
    try {
      const session = await authSignIn(email, password);
      let profiles = await supaRest(`profiles?id=eq.${session.user.id}&select=*`, { accessToken: session.access_token });
      let profile = profiles && profiles[0];
      // If email-confirmation delayed bootstrap_company at signup time, finish it now.
      if ((!profile || !profile.company_id)) {
        const pendingRaw = localStorage.getItem(`jh_pending_signup_${email.trim().toLowerCase()}`);
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          await supaRpc("bootstrap_company", { p_company_name: pending.companyName, p_whatsapp: pending.whatsapp, p_store_pin: pending.storePin, p_godown_pin: pending.godownPin }, session.access_token);
          localStorage.removeItem(`jh_pending_signup_${email.trim().toLowerCase()}`);
          profiles = await supaRest(`profiles?id=eq.${session.user.id}&select=*`, { accessToken: session.access_token });
          profile = profiles && profiles[0];
        }
      }
      onLoggedIn({ accessToken: session.access_token, user: session.user, profile });
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  const doSignup = async () => {
    if (!companyName.trim() || !storePin.trim() || !godownPin.trim()) { setError(t.companyName); return; }
    setBusy(true); setError("");
    try {
      const session = await authSignUp(email, password);
      const token = session.access_token;
      if (!token) {
        // No session yet (email confirmation required) — save the details so
        // doLogin can finish bootstrap_company right after the user confirms and logs in.
        localStorage.setItem(`jh_pending_signup_${email.trim().toLowerCase()}`, JSON.stringify({
          companyName: companyName.trim(), whatsapp, storePin: storePin.trim(), godownPin: godownPin.trim(),
        }));
        setError("Sign up successful — check email to confirm, then Login.");
        setBusy(false); setMode("login");
        return;
      }
      await supaRpc("bootstrap_company", { p_company_name: companyName, p_whatsapp: whatsapp, p_store_pin: storePin, p_godown_pin: godownPin }, token);
      const profiles = await supaRest(`profiles?id=eq.${session.user.id}&select=*`, { accessToken: token });
      onLoggedIn({ accessToken: token, user: session.user, profile: profiles && profiles[0] });
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: NAVY }}>
      <GlobalStyle />
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4"><LangSwitcher compact /></div>
        <div className="flex flex-col items-center mb-6"><LogoBadge size={64} /></div>
        <div className="rounded-2xl p-6" style={{ background: CARD }}>
          <div className="flex flex-col gap-3">
            <Field icon={Mail} label={t.email}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field icon={Lock} label={t.password}><TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>

            {mode === "signup" && (
              <>
                <Field icon={Building2} label={t.companyName}><TextInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></Field>
                <Field icon={Phone} label={t.whatsapp}><TextInput value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
                <Field icon={KeyRound} label={t.storePin}><TextInput value={storePin} onChange={(e) => setStorePin(e.target.value)} /></Field>
                <Field icon={KeyRound} label={t.godownPin}><TextInput value={godownPin} onChange={(e) => setGodownPin(e.target.value)} /></Field>
              </>
            )}
          </div>

          {error && <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: DANGER }}><AlertCircle size={13} /> {error}</div>}

          <button onClick={mode === "login" ? doLogin : doSignup} disabled={busy}
            className="jh-btn jh-font-body w-full mt-5 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT }}>
            {busy ? t.loading : (mode === "login" ? t.login : t.signUp)}
          </button>

          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} className="jh-btn w-full mt-3 text-xs font-semibold underline" style={{ color: NAVY }}>
            {mode === "login" ? t.noAccount : t.haveAccount}
          </button>
          <button onClick={onBack} className="jh-btn w-full mt-2 text-xs font-semibold" style={{ color: MUTED }}>{t.back}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== LOCATION SCREEN (Store / Godown) ============= */
function LocationScreen({ session, onLogout }) {
  const { t, lang } = useLang();
  const isStore = session.location_type === "store";
  const [tab, setTab] = useState(isStore ? "entry" : "inventory");

  return (
    <div className="min-h-screen jh-font-body" dir={lang === "ar" ? "rtl" : "ltr"} style={{ background: BG }}>
      <GlobalStyle />
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: NAVY }}>
        <div className="flex items-center gap-2.5">
          <LogoBadge size={36} />
          <div>
            <div className="jh-font-display text-white text-base font-bold leading-tight">{session.location_name}</div>
            <div className="text-xs" style={{ color: "#9AA5BD" }}>{isStore ? t.store : t.godown}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <button onClick={onLogout} className="jh-btn flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ color: "white", background: "rgba(255,255,255,0.12)" }}>
            <LogOut size={13} /> {t.logout}
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-4 max-w-2xl mx-auto flex-wrap">
        {isStore && (
          <button onClick={() => setTab("entry")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
            style={{ background: tab === "entry" ? NAVY_SOFT : CARD, color: tab === "entry" ? "white" : NAVY }}>
            <ClipboardList size={13} /> {t.tabEntry}
          </button>
        )}
        <button onClick={() => setTab("inventory")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "inventory" ? NAVY_SOFT : CARD, color: tab === "inventory" ? "white" : NAVY }}>
          <Package size={13} /> {t.tabInventory}
        </button>
        <button onClick={() => setTab("cake")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "cake" ? NAVY_SOFT : CARD, color: tab === "cake" ? "white" : NAVY }}>
          <Cake size={13} /> {t.cakeReport}
        </button>
        <button onClick={() => setTab("pending")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "pending" ? NAVY_SOFT : CARD, color: tab === "pending" ? "white" : NAVY }}>
          <Bell size={13} /> {t.tabPending}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {tab === "entry" && isStore && <SalesEntryPanel pin={session.pin} />}
        {tab === "inventory" && <InventoryPanel pin={session.pin} locationId={session.location_id} companyId={session.company_id} isStore={isStore} />}
        {tab === "cake" && <CakePanel pin={session.pin} locationId={session.location_id} companyId={session.company_id} isStore={isStore} />}
        {tab === "pending" && <PendingApprovalsPanel pin={session.pin} />}
      </div>
    </div>
  );
}

/* ---------------------------- Sales Entry Panel ---------------------------- */
function SalesEntryPanel({ pin }) {
  const { t } = useLang();
  const blank = { name: "", date: todayISO(), open: "", cash: "", mada: "", visa: "", master: "", hangar: "", jahez: "", systemSales: "", expense: "", note: "" };
  const [form, setForm] = useState(blank);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const setF = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const load = async () => {
    setLoading(true);
    try { setEntries(await supaRpc("get_sales_entries", { p_pin: pin })); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const actualSales = num(form.cash) + num(form.mada) + num(form.visa) + num(form.master);
  const shortPlus = form.systemSales === "" ? null : actualSales - num(form.systemSales);

  const submit = async () => {
    setSaving(true); setMsg("");
    try {
      await supaRpc("submit_sales_entry", {
        p_pin: pin, p_date: form.date, p_name: form.name,
        p_open: num(form.open), p_cash: num(form.cash), p_mada: num(form.mada), p_visa: num(form.visa), p_master: num(form.master),
        p_hangar: num(form.hangar), p_jahez: num(form.jahez), p_system_sales: num(form.systemSales), p_expense: num(form.expense),
        p_note: form.note, p_photo: "",
      });
      setMsg(t.savedOk);
      setForm({ ...blank, name: form.name });
      load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
    setSaving(false);
    setTimeout(() => setMsg(""), 6000);
  };

  return (
    <div>
      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field icon={User} label={t.name}><TextInput value={form.name} onChange={(e) => setF("name")(e.target.value)} /></Field>
          <Field icon={Calendar} label={t.date}><TextInput type="date" value={form.date} onChange={(e) => setF("date")(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field icon={Wallet} label={t.open}><NumInput value={form.open} onChange={setF("open")} /></Field>
          <Field icon={Wallet} label={t.cash}><NumInput value={form.cash} onChange={setF("cash")} /></Field>
          <Field icon={CreditCard} label={t.mada}><NumInput value={form.mada} onChange={setF("mada")} /></Field>
          <Field icon={CreditCard} label={t.visa}><NumInput value={form.visa} onChange={setF("visa")} /></Field>
          <Field icon={Landmark} label={t.master}><NumInput value={form.master} onChange={setF("master")} /></Field>
          <Field icon={Truck} label={t.hangar}><NumInput value={form.hangar} onChange={setF("hangar")} /></Field>
          <Field icon={Bike} label={t.jahez}><NumInput value={form.jahez} onChange={setF("jahez")} /></Field>
          <Field icon={Landmark} label={t.systemSales}><NumInput value={form.systemSales} onChange={setF("systemSales")} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3 rounded-xl p-3" style={{ background: BG }}>
          <div>
            <div className="text-xs font-semibold" style={{ color: MUTED }}>{t.actualSales}</div>
            <div className="jh-font-display text-lg font-bold" style={{ color: NAVY }}>{fmt(actualSales)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: MUTED }}>{t.shortPlus}</div>
            <div className="jh-font-display text-lg font-bold" style={{ color: shortPlus == null ? MUTED : shortPlus < 0 ? DANGER : SUCCESS }}>
              {shortPlus == null ? "-" : fmt(shortPlus)}
            </div>
          </div>
        </div>
        <div className="mb-3"><Field icon={Receipt} label={t.expense}><NumInput value={form.expense} onChange={setF("expense")} /></Field></div>
        <Field icon={StickyNote} label={t.note}>
          <textarea className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }} rows={2}
            value={form.note} onChange={(e) => setF("note")(e.target.value)} />
        </Field>
        {msg && <div className="mt-3 text-sm font-medium" style={{ color: msg.startsWith("✅") ? SUCCESS : DANGER }}>{msg}</div>}
        <button onClick={submit} disabled={saving} className="jh-btn jh-font-body w-full mt-4 rounded-lg py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{ background: saving ? "#93A0BD" : NAVY_SOFT }}>
          <CheckCircle2 size={16} /> {saving ? t.saving : t.submit}
        </button>
      </div>

      <div className="rounded-2xl p-5 mt-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.recentEntries}</h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : entries.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ color: MUTED }}>
                  <th className="text-left pb-2 font-semibold">{t.date}</th>
                  <th className="text-left pb-2 font-semibold">{t.name}</th>
                  <th className="text-right pb-2 font-semibold">{t.actualSales}</th>
                  <th className="text-right pb-2 font-semibold">{t.shortPlus}</th>
                </tr></thead>
                <tbody>
                  {entries.slice(0, 10).map((e) => (
                    <tr key={e.id} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                      <td className="py-2" style={{ color: NAVY }}>{e.entry_date}</td>
                      <td className="py-2" style={{ color: NAVY }}>{e.name}</td>
                      <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(e.actual_sales)}</td>
                      <td className="py-2 text-right font-semibold" style={{ color: num(e.short_plus) < 0 ? DANGER : SUCCESS }}>{fmt(e.short_plus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

/* ---------------------------- Inventory Panel ------------------------------- */
function InventoryPanel({ pin, locationId, companyId, isStore }) {
  const { t } = useLang();
  const [stock, setStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("pcs");
  const blank = { productId: "", quantity: "", totalCost: "", movementType: isStore ? "sale" : "purchase", toLocationId: "", expiryDate: "", supplier: "", purchaseDate: todayISO() };
  const [form, setForm] = useState(blank);
  const [productPhotoFile, setProductPhotoFile] = useState(null);
  const [cashMemoFile, setCashMemoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, l] = await Promise.all([
        supaRpc("get_location_stock", { p_pin: pin }),
        supaRpc("get_products_for_pin", { p_pin: pin }),
        supaRpc("get_locations_for_pin", { p_pin: pin }),
      ]);
      setStock(s); setProducts(p); setLocations(l);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNewProduct = async () => {
    if (!newProductName.trim()) return;
    setMsg("");
    try {
      const id = await supaRpc("ensure_product", { p_pin: pin, p_name: newProductName.trim(), p_unit: newProductUnit });
      setNewProductName("");
      await load();
      setForm((f) => ({ ...f, productId: id }));
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  const isPurchase = form.movementType === "purchase";
  const isReturnToSupplier = !isStore && form.movementType === "ret";
  const needsTarget = form.movementType === "transfer" || (isStore && form.movementType === "ret");
  const availableQty = stock.find((s) => s.product_id === form.productId)?.quantity ?? 0;
  const needsStockCheck = ["sale", "wastage", "transfer", "ret"].includes(form.movementType);

  const submit = async () => {
    setMsg("");
    if (!form.productId) { setMsg(t.productName); return; }
    if (num(form.quantity) <= 0) { setMsg(t.quantity); return; }
    if (needsTarget && !form.toLocationId) { setMsg(t.toLocation); return; }
    if (needsStockCheck && num(form.quantity) > Math.max(availableQty, 0)) { setMsg(t.notEnoughStock); return; }
    setUploading(true);
    try {
      let productPhotoUrl = null;
      let cashMemoUrl = null;
      if (isPurchase || isReturnToSupplier) {
        if (productPhotoFile) productPhotoUrl = await uploadPhoto("product-photos", companyId, pin, productPhotoFile);
        if (cashMemoFile) cashMemoUrl = await uploadPhoto("invoice-photos", companyId, pin, cashMemoFile);
      }

      await supaRpc("submit_stock_movement", {
        p_pin: pin,
        p_from_location: locationId,
        p_to_location: needsTarget ? form.toLocationId : null,
        p_product_id: form.productId,
        p_quantity: num(form.quantity),
        p_total_cost: num(form.totalCost),
        p_expiry_date: form.expiryDate || null,
        p_movement_type: form.movementType === "ret" ? "return" : form.movementType,
        p_receipt_url: cashMemoUrl,
        p_supplier: (isPurchase || isReturnToSupplier) ? (form.supplier || null) : null,
        p_purchase_date: (isPurchase || isReturnToSupplier) ? (form.purchaseDate || null) : null,
        p_product_photo_url: productPhotoUrl,
      });
      setMsg(t.savedOk);
      setForm(blank);
      setProductPhotoFile(null);
      setCashMemoFile(null);
      load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
    setUploading(false);
    setTimeout(() => setMsg(""), 6000);
  };

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-3" style={{ color: NAVY }}>
          <Package size={16} /> {t.currentStock}
        </h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : stock.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noStock}</div>
          : (
            <div className="flex flex-col gap-2">
              {stock.map((s) => (
                <div key={s.product_id} className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: BG }}>
                  <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{s.product_name}</div>
                  <div className="text-xs font-semibold" style={{ color: s.quantity <= 0 ? DANGER : MUTED }}>
                    {s.quantity <= 0 ? t.outOfStock : `${fmt(s.quantity)} ${s.unit}`}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>+ {t.productName}</h2>
        <div className="grid grid-cols-2 gap-3">
          <TextInput value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder={t.productName} />
          <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
            value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)}>
            <option value="pcs">pcs</option><option value="kg">kg</option><option value="g">g</option>
            <option value="l">liter</option><option value="box">box</option>
          </select>
        </div>
        <button onClick={addNewProduct} className="jh-btn jh-font-body w-full mt-3 rounded-lg py-2 text-xs font-bold" style={{ background: BG, color: NAVY }}>
          <Plus size={13} className="inline mr-1" /> {t.addProduct}
        </button>
      </div>

      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.addProduct}</h2>
        <div className="mb-3">
          <Field label={t.productName}>
            <input list="product-list-inv" className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
              placeholder={t.searchProduct}
              value={products.find((p) => p.id === form.productId)?.name || ""}
              onChange={(e) => {
                const match = products.find((p) => p.name === e.target.value);
                setForm((f) => ({ ...f, productId: match ? match.id : "" }));
              }} />
            <datalist id="product-list-inv">
              {products.map((p) => <option key={p.id} value={p.name} />)}
            </datalist>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t.movementType}>
            <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
              value={form.movementType} onChange={(e) => setForm((f) => ({ ...f, movementType: e.target.value }))}>
              {isStore ? (
                <>
                  <option value="sale">{t.sale}</option>
                  <option value="transfer">{t.transfer}</option>
                  <option value="ret">{t.ret}</option>
                  <option value="wastage">{t.wastage}</option>
                </>
              ) : (
                <>
                  <option value="purchase">{t.purchase}</option>
                  <option value="transfer">{t.transfer}</option>
                  <option value="ret">{t.retToSupplier}</option>
                  <option value="wastage">{t.wastage}</option>
                </>
              )}
            </select>
          </Field>
          <Field label={t.quantity}>
            <NumInput value={form.quantity} onChange={(v) => setForm((f) => ({ ...f, quantity: v }))} />
            {needsStockCheck && form.productId && (
              <div className="text-xs mt-1" style={{ color: availableQty <= 0 ? DANGER : MUTED }}>
                {t.available}: {Math.max(availableQty, 0)}
              </div>
            )}
          </Field>
        </div>
        {!isStore && (isPurchase || isReturnToSupplier) && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label={t.costTotal}><NumInput value={form.totalCost} onChange={(v) => setForm((f) => ({ ...f, totalCost: v }))} /></Field>
              <Field label={t.supplier}><TextInput value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} /></Field>
            </div>
            <div className="mb-3"><Field icon={CalendarClock} label={t.purchaseDate}><TextInput type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} /></Field></div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field icon={Camera} label={t.productPhoto}>
                <input type="file" accept="image/*" capture="environment" className="jh-input jh-font-body w-full rounded-lg border px-2 py-2 text-xs" style={{ borderColor: "#D9DCE3" }}
                  onChange={(e) => setProductPhotoFile(e.target.files?.[0] || null)} />
              </Field>
              <Field icon={Receipt} label={t.cashMemo}>
                <input type="file" accept="image/*" capture="environment" className="jh-input jh-font-body w-full rounded-lg border px-2 py-2 text-xs" style={{ borderColor: "#D9DCE3" }}
                  onChange={(e) => setCashMemoFile(e.target.files?.[0] || null)} />
              </Field>
            </div>
            {num(form.totalCost) > 0 && (
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold" style={{ color: WARNING }}>
                <AlertTriangle size={13} /> {t.paymentWillBePending}
              </div>
            )}
          </>
        )}
        {needsTarget && (
          <div className="mb-3">
            <Field icon={KeyRound} label={t.toLocation}>
              <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
                value={form.toLocationId} onChange={(e) => setForm((f) => ({ ...f, toLocationId: e.target.value }))}>
                <option value="">—</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          </div>
        )}
        <div className="mb-3"><Field icon={CalendarClock} label={t.expiryDate}><TextInput type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></Field></div>
        {msg && <div className="text-sm font-medium mb-3" style={{ color: msg.startsWith("✅") ? SUCCESS : DANGER }}>{msg}</div>}
        <button onClick={submit} disabled={uploading} className="jh-btn jh-font-body w-full rounded-lg py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT, opacity: uploading ? 0.7 : 1 }}>
          <Plus size={15} /> {uploading ? t.saving : t.addProduct}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Cake Panel ------------------------------------ */
function CakePanel({ pin, locationId, companyId, isStore }) {
  const { t } = useLang();
  const [stock, setStock] = useState([]);
  const [cakeProducts, setCakeProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newCakeName, setNewCakeName] = useState("");
  const blank = { cakeProductId: "", quantity: "", entryType: isStore ? "sale" : "total", toLocationId: "", expiryDate: "", note: "" };
  const [form, setForm] = useState(blank);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, l] = await Promise.all([
        supaRpc("get_location_cake_stock", { p_pin: pin }),
        supaRpc("get_cake_products_for_pin", { p_pin: pin }),
        supaRpc("get_locations_for_pin", { p_pin: pin }),
      ]);
      setStock(s); setCakeProducts(p); setLocations(l);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addNewCake = async () => {
    if (!newCakeName.trim()) return;
    setMsg("");
    try {
      const id = await supaRpc("ensure_cake_product", { p_pin: pin, p_name: newCakeName.trim() });
      setNewCakeName("");
      await load();
      setForm((f) => ({ ...f, cakeProductId: id }));
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  const needsTarget = form.entryType === "transferOut" || form.entryType === "ret";
  const availableQty = stock.find((s) => s.cake_product_id === form.cakeProductId)?.quantity ?? 0;
  const needsStockCheck = ["sale", "wastage", "transferOut", "ret"].includes(form.entryType);

  const submit = async () => {
    setMsg("");
    if (!form.cakeProductId) { setMsg(t.productName); return; }
    if (num(form.quantity) <= 0) { setMsg(t.quantity); return; }
    if (needsTarget && !form.toLocationId) { setMsg(t.toLocation); return; }
    if (needsStockCheck && num(form.quantity) > Math.max(availableQty, 0)) { setMsg(t.notEnoughStock); return; }
    setUploading(true);
    try {
      let photoUrl = null;
      if (photoFile) photoUrl = await uploadPhoto("product-photos", companyId, pin, photoFile);

      await supaRpc("submit_cake_entry", {
        p_pin: pin,
        p_from_location: locationId,
        p_to_location: needsTarget ? form.toLocationId : null,
        p_cake_product_id: form.cakeProductId,
        p_quantity: num(form.quantity),
        p_expiry_date: form.expiryDate || null,
        p_entry_type: form.entryType === "ret" ? "return" : form.entryType,
        p_photo_url: photoUrl,
        p_note: form.note || null,
      });
      setMsg(t.savedOk);
      setForm(blank);
      setPhotoFile(null);
      load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
    setUploading(false);
    setTimeout(() => setMsg(""), 6000);
  };

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-3" style={{ color: NAVY }}>
          <Cake size={16} /> {t.currentStock}
        </h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : stock.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noStock}</div>
          : (
            <div className="flex flex-col gap-2">
              {stock.map((s) => (
                <div key={s.cake_product_id} className="rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: BG }}>
                  <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{s.cake_product_name}</div>
                  <div className="text-xs font-semibold" style={{ color: s.quantity <= 0 ? DANGER : MUTED }}>
                    {s.quantity <= 0 ? t.outOfStock : fmt(s.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>+ {t.productName}</h2>
        <div className="flex gap-3">
          <TextInput value={newCakeName} onChange={(e) => setNewCakeName(e.target.value)} placeholder={t.productName} />
        </div>
        <button onClick={addNewCake} className="jh-btn jh-font-body w-full mt-3 rounded-lg py-2 text-xs font-bold" style={{ background: BG, color: NAVY }}>
          <Plus size={13} className="inline mr-1" /> {t.addProduct}
        </button>
      </div>

      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.addProduct}</h2>
        <div className="mb-3">
          <Field label={t.productName}>
            <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
              value={form.cakeProductId} onChange={(e) => setForm((f) => ({ ...f, cakeProductId: e.target.value }))}>
              <option value="">—</option>
              {cakeProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t.movementType}>
            <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
              value={form.entryType} onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}>
              {isStore ? (
                <>
                  <option value="sale">{t.sale}</option>
                  <option value="transferOut">{t.transfer}</option>
                  <option value="ret">{t.ret}</option>
                  <option value="wastage">{t.wastage}</option>
                </>
              ) : (
                <>
                  <option value="total">{t.purchase}</option>
                  <option value="transferOut">{t.transfer}</option>
                  <option value="wastage">{t.wastage}</option>
                </>
              )}
            </select>
          </Field>
          <Field label={t.quantity}>
            <NumInput value={form.quantity} onChange={(v) => setForm((f) => ({ ...f, quantity: v }))} />
            {needsStockCheck && form.cakeProductId && (
              <div className="text-xs mt-1" style={{ color: availableQty <= 0 ? DANGER : MUTED }}>
                {t.available}: {Math.max(availableQty, 0)}
              </div>
            )}
          </Field>
        </div>
        {needsTarget && (
          <div className="mb-3">
            <Field icon={KeyRound} label={t.toLocation}>
              <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }}
                value={form.toLocationId} onChange={(e) => setForm((f) => ({ ...f, toLocationId: e.target.value }))}>
                <option value="">—</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
          </div>
        )}
        <div className="mb-3"><Field icon={CalendarClock} label={t.expiryDate}><TextInput type="date" value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} /></Field></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field icon={Camera} label={t.productPhoto}>
            <input type="file" accept="image/*" capture="environment" className="jh-input jh-font-body w-full rounded-lg border px-2 py-2 text-xs" style={{ borderColor: "#D9DCE3" }}
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          </Field>
          <Field label={t.note}><TextInput value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} /></Field>
        </div>
        {msg && <div className="text-sm font-medium mb-3" style={{ color: msg.startsWith("✅") ? SUCCESS : DANGER }}>{msg}</div>}
        <button onClick={submit} disabled={uploading} className="jh-btn jh-font-body w-full rounded-lg py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT, opacity: uploading ? 0.7 : 1 }}>
          <Plus size={15} /> {uploading ? t.saving : t.addProduct}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Pending Approvals Panel ----------------------- */
function PendingApprovalsPanel({ pin }) {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [cakeRows, setCakeRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [m, c] = await Promise.all([
        supaRpc("get_pending_movements", { p_pin: pin }),
        supaRpc("get_pending_cake_entries", { p_pin: pin }),
      ]);
      setRows(m); setCakeRows(c);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id, accept) => {
    try {
      await supaRpc("respond_stock_movement", { p_movement_id: id, p_pin: pin, p_accept: accept });
      load();
    } catch (e) { setMsg(e.message); }
  };

  const respondCake = async (id, accept) => {
    try {
      await supaRpc("respond_cake_entry", { p_entry_id: id, p_pin: pin, p_accept: accept });
      load();
    } catch (e) { setMsg(e.message); }
  };

  const totalCount = rows.length + cakeRows.length;

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD }}>
      <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-3" style={{ color: NAVY }}>
        <Bell size={16} /> {t.pendingApprovals}
      </h2>
      {msg && <div className="text-sm mb-3" style={{ color: DANGER }}>{msg}</div>}
      {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
        : totalCount === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noPending}</div>
        : (
          <div className="flex flex-col gap-3">
            {rows.map((m) => (
              <div key={m.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                <div className="text-xs font-semibold mb-1" style={{ color: MUTED }}>{m.movement_type} · {t.qty}: {fmt(m.quantity)}</div>
                <div className="text-xs mb-3" style={{ color: MUTED }}>{m.created_at?.slice(0, 10)}</div>
                <div className="flex gap-2">
                  <button onClick={() => respond(m.id, true)} className="jh-btn flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: "#E4F2EA", color: SUCCESS }}>{t.accept}</button>
                  <button onClick={() => respond(m.id, false)} className="jh-btn flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: "#FBE7E4", color: DANGER }}>{t.reject}</button>
                </div>
              </div>
            ))}
            {cakeRows.map((m) => (
              <div key={m.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                <div className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: MUTED }}><Cake size={12} /> {m.entry_type} · {t.qty}: {fmt(m.quantity)}</div>
                <div className="text-xs mb-3" style={{ color: MUTED }}>{m.created_at?.slice(0, 10)}</div>
                <div className="flex gap-2">
                  <button onClick={() => respondCake(m.id, true)} className="jh-btn flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: "#E4F2EA", color: SUCCESS }}>{t.accept}</button>
                  <button onClick={() => respondCake(m.id, false)} className="jh-btn flex-1 rounded-lg py-2 text-xs font-bold" style={{ background: "#FBE7E4", color: DANGER }}>{t.reject}</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

/* ============================== ADMIN SCREEN ================================ */
function AdminScreen({ session, onLogout }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("dashboard");
  const isSuperAdmin = session.profile?.role === "super_admin";
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(session.profile?.company_id || null);

  useEffect(() => {
    if (isSuperAdmin) {
      supaRpc("get_all_companies", {}, session.accessToken).then(setCompanies).catch(console.error);
    }
  }, [isSuperAdmin]);

  return (
    <div className="min-h-screen jh-font-body" dir={lang === "ar" ? "rtl" : "ltr"} style={{ background: BG }}>
      <GlobalStyle />
      <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between" style={{ background: NAVY }}>
        <div className="flex items-center gap-2.5">
          <LogoBadge size={36} />
          <div>
            <div className="jh-font-display text-white text-base font-bold leading-tight">{t.tabDashboard}</div>
            <div className="text-xs" style={{ color: "#9AA5BD" }}>{isSuperAdmin ? t.allCompanies : t.company}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitcher compact />
          <button onClick={onLogout} className="jh-btn flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ color: "white", background: "rgba(255,255,255,0.12)" }}>
            <LogOut size={13} /> {t.logout}
          </button>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="px-4 pt-4 max-w-4xl mx-auto">
          <select className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3", background: CARD }}
            value={activeCompanyId || ""} onChange={(e) => setActiveCompanyId(e.target.value)}>
            <option value="">{t.allCompanies}</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex gap-2 px-4 pt-4 max-w-4xl mx-auto flex-wrap">
        <button onClick={() => setTab("dashboard")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "dashboard" ? NAVY_SOFT : CARD, color: tab === "dashboard" ? "white" : NAVY }}><LayoutGrid size={13} /> {t.tabDashboard}</button>
        <button onClick={() => setTab("payment")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "payment" ? NAVY_SOFT : CARD, color: tab === "payment" ? "white" : NAVY }}><Banknote size={13} /> {t.tabPayment}</button>
        <button onClick={() => setTab("notices")} className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{ background: tab === "notices" ? NAVY_SOFT : CARD, color: tab === "notices" ? "white" : NAVY }}><Bell size={13} /> {t.tabNotices}</button>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {tab === "dashboard" && <AdminDashboardTab session={session} companyId={isSuperAdmin ? activeCompanyId : session.profile?.company_id} isSuperAdmin={isSuperAdmin} />}
        {tab === "payment" && <SubscriptionTab session={session} companyId={session.profile?.company_id} />}
        {tab === "notices" && <NoticesTab session={session} isSuperAdmin={isSuperAdmin} />}
      </div>
    </div>
  );
}

/* ---------------------------- Admin Dashboard Tab --------------------------- */
function AdminDashboardTab({ session, companyId }) {
  const { t } = useLang();
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStoreId, setActiveStoreId] = useState(null);

  const load = async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [locs, mv, sl] = await Promise.all([
        supaRest(`locations?company_id=eq.${companyId}&select=*`, { accessToken: session.accessToken }),
        supaRest(`stock_movements?company_id=eq.${companyId}&select=*,products(name)&deleted_at=is.null&order=created_at.desc&limit=50`, { accessToken: session.accessToken }),
        supaRest(`sales_entries?company_id=eq.${companyId}&select=*&order=entry_date.desc`, { accessToken: session.accessToken }),
      ]);
      setLocations(locs); setMovements(mv); setSales(sl);
      const stores = locs.filter((l) => l.type === "store");
      if (stores.length > 0) setActiveStoreId((prev) => prev || stores[0].id);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);

  const stores = locations.filter((l) => l.type === "store");
  const thisMonth = todayISO().slice(0, 7);
  const storeSales = sales.filter((s) => s.store_id === activeStoreId);
  const monthSales = storeSales.filter((s) => s.entry_date?.slice(0, 7) === thisMonth);

  const monthTotals = monthSales.reduce((a, s) => {
    a.cash += num(s.cash); a.mada += num(s.mada); a.visa += num(s.visa); a.master += num(s.master);
    a.hangar += num(s.hangar); a.jahez += num(s.jahez); a.actual += num(s.actual_sales);
    a.system += num(s.system_sales); a.expense += num(s.expense);
    return a;
  }, { cash: 0, mada: 0, visa: 0, master: 0, hangar: 0, jahez: 0, actual: 0, system: 0, expense: 0 });

  const totalSales = sales.reduce((a, s) => a + num(s.actual_sales), 0);
  const godownValue = movements.filter((m) => m.movement_type === "purchase").reduce((a, m) => a + num(m.total_cost), 0);

  if (!companyId) return <div className="text-sm p-6 text-center" style={{ color: MUTED }}>{t.company}</div>;
  if (loading) return <div className="text-sm p-6 text-center" style={{ color: MUTED }}>{t.loading}</div>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3.5" style={{ background: CARD }}>
          <div className="text-xs" style={{ color: MUTED }}>{t.salesReport} ({t.company})</div>
          <div className="jh-font-display text-xl font-bold mt-0.5" style={{ color: NAVY }}>{fmt(totalSales)}</div>
        </div>
        <div className="rounded-xl p-3.5" style={{ background: GOLD_SOFT }}>
          <div className="text-xs" style={{ color: "#8A6A17" }}>{t.godownReport}</div>
          <div className="jh-font-display text-xl font-bold mt-0.5" style={{ color: "#6B4F0E" }}>{fmt(godownValue)}</div>
        </div>
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.salesReport} — {t.store}</h2>
        <div className="flex gap-2 mb-4 flex-wrap">
          {stores.map((s) => (
            <button key={s.id} onClick={() => setActiveStoreId(s.id)} className="jh-btn text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: activeStoreId === s.id ? NAVY_SOFT : BG, color: activeStoreId === s.id ? "white" : NAVY }}>
              {s.name}
            </button>
          ))}
        </div>

        <div className="rounded-xl p-4 mb-4" style={{ background: BG }}>
          <div className="text-xs font-semibold mb-2" style={{ color: MUTED }}>{thisMonth} — মাসিক যোগফল</div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>CASH: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.cash)}</span></div>
            <div>MADA: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.mada)}</span></div>
            <div>VISA: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.visa)}</span></div>
            <div>MASTER: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.master)}</span></div>
            <div>HANGAR: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.hangar)}</span></div>
            <div>JAHEZ: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.jahez)}</span></div>
            <div>{t.actualSales}: <span className="font-bold" style={{ color: SUCCESS }}>{fmt(monthTotals.actual)}</span></div>
            <div>System: <span className="font-bold" style={{ color: NAVY }}>{fmt(monthTotals.system)}</span></div>
            <div>{t.expense}: <span className="font-bold" style={{ color: WARNING }}>{fmt(monthTotals.expense)}</span></div>
          </div>
        </div>

        {storeSales.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: MUTED }}>
                <th className="text-left pb-2 font-semibold">{t.date}</th>
                <th className="text-left pb-2 font-semibold">{t.name}</th>
                <th className="text-right pb-2 font-semibold">CASH</th>
                <th className="text-right pb-2 font-semibold">MADA</th>
                <th className="text-right pb-2 font-semibold">VISA</th>
                <th className="text-right pb-2 font-semibold">MASTER</th>
                <th className="text-right pb-2 font-semibold">{t.actualSales}</th>
                <th className="text-right pb-2 font-semibold">{t.shortPlus}</th>
              </tr></thead>
              <tbody>
                {storeSales.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                    <td className="py-2" style={{ color: NAVY }}>{s.entry_date}</td>
                    <td className="py-2" style={{ color: NAVY }}>{s.name}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.cash)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.mada)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.visa)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.master)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(s.actual_sales)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: num(s.short_plus) < 0 ? DANGER : SUCCESS }}>{fmt(s.short_plus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.store} / {t.godown}</h2>
        <div className="flex flex-wrap gap-2">
          {locations.map((l) => (
            <div key={l.id} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: BG, color: NAVY }}>
              {l.name} ({l.type})
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.stockReport}</h2>
        {movements.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr style={{ color: MUTED }}>
                <th className="text-left pb-2 font-semibold">{t.productName}</th>
                <th className="text-left pb-2 font-semibold">{t.movementType}</th>
                <th className="text-right pb-2 font-semibold">{t.qty}</th>
                <th className="text-right pb-2 font-semibold">{t.costTotal}</th>
              </tr></thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-t" style={{ borderColor: "#EEF0F3" }}>
                    <td className="py-2" style={{ color: NAVY }}>{m.products?.name}</td>
                    <td className="py-2" style={{ color: NAVY }}>{m.movement_type} ({m.status})</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(m.quantity)}</td>
                    <td className="py-2 text-right" style={{ color: NAVY }}>{fmt(m.total_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- Subscription Tab ------------------------------ */
function SubscriptionTab({ session, companyId }) {
  const { t } = useLang();
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStorePin, setNewStorePin] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try { setSubs(await supaRest(`subscriptions?company_id=eq.${companyId}&select=*,locations(name)`, { accessToken: session.accessToken })); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [companyId]);

  const copy = async (id, number) => {
    try { await navigator.clipboard.writeText(number); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch (e) {}
  };

  const addStore = async () => {
    if (!newStoreName.trim() || !newStorePin.trim()) return;
    setMsg("");
    try {
      await supaRpc("add_location", { p_type: "store", p_name: newStoreName.trim(), p_pin: newStorePin.trim() }, session.accessToken);
      setNewStoreName(""); setNewStorePin("");
      load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  const statusLabel = (s) => ({ trial: t.trialStatus, active: t.activeStatus, pending_payment: t.pendingPayment, expired: t.pendingPayment, blocked: t.blockedStatus }[s] || s);
  const statusColor = (s) => ({ trial: WARNING, active: SUCCESS, pending_payment: DANGER, expired: DANGER, blocked: DANGER }[s] || MUTED);

  return (
    <div>
      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.subscriptionTitle}</h2>
        {loading ? <div className="text-sm" style={{ color: MUTED }}>{t.loading}</div>
          : subs.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noEntries}</div>
          : (
            <div className="flex flex-col gap-2.5">
              {subs.map((s) => {
                const d = s.next_due_date ? daysUntil(s.next_due_date) : null;
                return (
                  <div key={s.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                    <div className="flex items-center justify-between">
                      <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{s.locations?.name}</div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${statusColor(s.status)}18`, color: statusColor(s.status) }}>{statusLabel(s.status)}</span>
                    </div>
                    {s.next_due_date && (
                      <div className="text-xs mt-1" style={{ color: MUTED }}>{t.dueDate}: {s.next_due_date} {d != null && d >= 0 ? `(${d} ${t.daysLeft})` : ""}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.addStore}</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label={t.newStoreName}><TextInput value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} /></Field>
          <Field label={t.newStorePin}><TextInput value={newStorePin} onChange={(e) => setNewStorePin(e.target.value)} /></Field>
        </div>
        {msg && <div className="text-sm mb-3" style={{ color: DANGER }}>{msg}</div>}
        <button onClick={addStore} className="jh-btn jh-font-body w-full rounded-lg py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5" style={{ background: NAVY_SOFT }}>
          <Plus size={15} /> {t.addStore}
        </button>
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold flex items-center gap-1.5 mb-1" style={{ color: NAVY }}><Banknote size={16} /> {t.subscriptionTitle}</h2>
        <div className="flex flex-col gap-3 mt-3">
          {PAYMENT_METHODS.map((m) => (
            <div key={m.id} className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: BG, borderLeft: `4px solid ${m.color}` }}>
              <div>
                <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{m.name}</div>
                {m.number ? <div className="jh-font-display text-base font-bold mt-0.5" style={{ color: m.color }}>{m.number}</div>
                  : <div className="text-xs mt-1 font-semibold" style={{ color: MUTED }}>{t.comingSoon}</div>}
              </div>
              {m.number && (
                <button onClick={() => copy(m.id, m.number)} className="jh-btn shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: copiedId === m.id ? "#E4F2EA" : CARD, color: copiedId === m.id ? SUCCESS : NAVY, border: "1px solid #D9DCE3" }}>
                  {copiedId === m.id ? <Check size={13} /> : <Copy size={13} />} {copiedId === m.id ? t.copied : t.copyNumber}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Notices Tab ------------------------------------ */
function NoticesTab({ session, isSuperAdmin }) {
  const { t } = useLang();
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try { setNotices(await supaRest(`notices?is_active=eq.true&select=*&order=created_at.desc`, { accessToken: session.accessToken })); }
    catch (e) { console.error(e); }
  };
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!title.trim() || !message.trim()) return;
    setMsg("");
    try {
      await supaRest("notices", { method: "POST", accessToken: session.accessToken, body: { title, message, company_id: null }, prefer: "return=minimal" });
      setTitle(""); setMessage(""); load();
    } catch (e) { setMsg(`${t.savedFail} ${e.message}`); }
  };

  return (
    <div>
      {isSuperAdmin && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: CARD }}>
          <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.postNotice}</h2>
          <div className="flex flex-col gap-3">
            <Field label={t.noticeTitleField}><TextInput value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label={t.noticeMsg}>
              <textarea className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#D9DCE3" }} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </Field>
          </div>
          {msg && <div className="text-sm mt-2" style={{ color: DANGER }}>{msg}</div>}
          <button onClick={post} className="jh-btn jh-font-body w-full mt-3 rounded-lg py-2.5 text-sm font-bold text-white" style={{ background: NAVY_SOFT }}>{t.submit}</button>
        </div>
      )}
      <div className="rounded-2xl p-5" style={{ background: CARD }}>
        <h2 className="jh-font-display text-sm font-bold mb-3" style={{ color: NAVY }}>{t.noticesTitle}</h2>
        {notices.length === 0 ? <div className="text-sm" style={{ color: MUTED }}>{t.noNotices}</div> : (
          <div className="flex flex-col gap-3">
            {notices.map((n) => (
              <div key={n.id} className="rounded-xl p-3.5" style={{ background: BG }}>
                <div className="jh-font-display text-sm font-bold" style={{ color: NAVY }}>{n.title}</div>
                <div className="text-xs mt-1" style={{ color: MUTED }}>{n.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================================== APP ==================================== */
export default function App() {
  const [lang, setLang] = useState("bn");
  const [mode, setMode] = useState("gate"); // gate | pin-login | company-auth
  const [locationSession, setLocationSession] = useState(null);
  const [adminSession, setAdminSession] = useState(null);
  const t = STR[lang];

  let content;
  if (locationSession) {
    content = <LocationScreen session={locationSession} onLogout={() => setLocationSession(null)} />;
  } else if (adminSession) {
    content = <AdminScreen session={adminSession} onLogout={() => setAdminSession(null)} />;
  } else if (mode === "pin-login") {
    content = <PinLoginScreen onLoggedIn={setLocationSession} onBack={() => setMode("gate")} />;
  } else if (mode === "company-auth") {
    content = <CompanyAuthScreen onLoggedIn={setAdminSession} onBack={() => setMode("gate")} />;
  } else {
    content = <EntryGate onPinMode={() => setMode("pin-login")} onCompanyMode={() => setMode("company-auth")} />;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{content}</LangContext.Provider>;
}
