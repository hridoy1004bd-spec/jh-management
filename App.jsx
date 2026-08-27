import React, {
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";

import {
  LogOut,
  Calendar,
  User,
  Wallet,
  CreditCard,
  Landmark,
  Truck,
  Bike,
  StickyNote,
  Receipt,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Lock,
  ChevronRight,
  Package,
  PackageX,
  AlertTriangle,
  Plus,
  Trash2,
  CalendarClock,
  ClipboardList,
  Download,
  Printer,
  Cake,
  Copy,
  Check,
  Banknote,
  Phone,
  Building2,
  Mail,
  KeyRound,
  Bell,
  Users,
  RotateCcw,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
  "https://htecpuzjheipbyeqwqhh.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodGVjcHV6amhlaXBieWVxd3FxaGgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NzM3NjkzNCwiZXhwIjoyMTAyOTUyOTM0fQ.j2gyht9oXE7d7_Az7xWh7d17_gKta2gbxQixCOc89A4";

/* =========================================================
   SUPABASE HELPERS
========================================================= */

async function supaRest(
  path,
  {
    method = "GET",
    body,
    accessToken,
    prefer,
  } = {}
) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${
      accessToken || SUPABASE_ANON_KEY
    }`,
    "Content-Type": "application/json",
  };

  if (prefer) {
    headers.Prefer = prefer;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      method,
      headers,
      body: body
        ? JSON.stringify(body)
        : undefined,
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      error.message ||
        error.msg ||
        `Request failed (${response.status})`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function supaRpc(
  functionName,
  params = {},
  accessToken
) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/${functionName}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${
          accessToken || SUPABASE_ANON_KEY
        }`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      error.message ||
        error.msg ||
        `RPC failed (${response.status})`
    );
  }

  return response.json();
}

/* =========================================================
   AUTH
========================================================= */

async function authSignUp(email, password) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/signup`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.msg ||
        data.error_description ||
        "Sign up failed"
    );
  }

  return data;
}

async function authSignIn(email, password) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.msg ||
        data.error_description ||
        "Login failed"
    );
  }

  return data;
}

/* =========================================================
   THEME
========================================================= */

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

/* =========================================================
   PAYMENT METHODS
========================================================= */

const PAYMENT_METHODS = [
  {
    id: "bkash",
    name: "bKash",
    number: "01880176772",
  },
  {
    id: "nagad",
    name: "Nagad",
    number: "01856191004",
  },
  {
    id: "rocket",
    name: "Rocket",
    number: "",
  },
];

/* =========================================================
   TRANSLATIONS
========================================================= */

const STR = {
  bn: {
    appName: "জে এইচ ম্যানেজমেন্ট",
    tagline: "মাল্টি-বিজনেস ম্যানেজমেন্ট প্ল্যাটফর্ম",

    pinLogin: "PIN দিয়ে লগইন",
    companyLogin: "কোম্পানি Login / Sign up",

    enterPin: "PIN দিন",
    login: "Login",
    wrongPin: "ভুল PIN, আবার চেষ্টা করুন",

    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    companyName: "কোম্পানির নাম",
    whatsapp: "WhatsApp নম্বর",

    storePin: "Store PIN",
    godownPin: "Godown PIN",

    signUp: "নতুন কোম্পানি তৈরি করুন",
    haveAccount: "আগে থেকেই একাউন্ট আছে? Login করুন",
    noAccount: "একাউন্ট নেই? Sign up করুন",

    back: "ফিরে যান",
    logout: "Logout",

    loading: "লোড হচ্ছে...",
    saving: "সেভ হচ্ছে...",
    submit: "Submit",

    savedOk: "সফলভাবে সেভ হয়েছে",
    savedFail: "সমস্যা হয়েছে",

    tabEntry: "বিক্রয় এন্ট্রি",
    tabInventory: "ইনভেন্টরি",
    tabDashboard: "Dashboard",
    tabPayment: "সাবস্ক্রিপশন",
    tabPending: "অপেক্ষারত অনুমতি",
    tabNotices: "নোটিশ",

    name: "নাম",
    date: "তারিখ",

    open: "OPEN",
    cash: "CASH",
    mada: "MADA",
    visa: "VISA",
    master: "MASTER",
    hangar: "HANGAR",
    jahez: "JAHEZ",

    systemSales: "System Sales",
    actualSales: "ACTUAL SALES",
    shortPlus: "SHORT/PLUS",
    expense: "EXPENSE",
    note: "NOTE",

    recentEntries: "সাম্প্রতিক এন্ট্রি",
    noEntries: "কোনো এন্ট্রি নেই",

    productName: "পণ্যের নাম",
    quantity: "পরিমাণ",
    unit: "একক",
    costTotal: "মোট টাকা",
    expiryDate: "মেয়াদ শেষের তারিখ",

    addProduct: "পণ্য/মুভমেন্ট যোগ করুন",

    movementType: "ধরন",
    purchase: "কেনা",
    transfer: "Transfer",
    ret: "Return",
    wastage: "Wastage",
    sale: "Sale",

    toLocation: "কোথায় পাঠানো হচ্ছে",
    currentStock: "বর্তমান স্টক",
    noStock: "কোনো স্টক নেই",

    pendingApprovals: "আপনার অনুমোদনের অপেক্ষায়",
    accept: "গ্রহণ করুন",
    reject: "বাতিল করুন",

    noPending: "কোনো অপেক্ষারত অনুরোধ নেই",
    from: "থেকে",
    qty: "পরিমাণ",

    subscriptionTitle: "সাবস্ক্রিপশন / পেমেন্ট",
    trialStatus: "ট্রায়াল চলছে",
    activeStatus: "সক্রিয়",
    pendingPayment: "পেমেন্ট বাকি",
    blockedStatus: "বন্ধ আছে",

    dueDate: "পরবর্তী পেমেন্টের তারিখ",
    daysLeft: "দিন বাকি",

    sendMoneyTo: "এই নম্বরে টাকা পাঠান",
    copyNumber: "কপি করুন",
    copied: "কপি হয়েছে",

    comingSoon: "শীঘ্রই আসছে",
    bankTitle: "ব্যাংক অ্যাকাউন্ট",
    bankComingSoon: "শীঘ্রই যোগ হবে",

    addStore: "নতুন Store যোগ করুন",
    newStoreName: "নতুন Store-এর নাম",
    newStorePin: "নতুন PIN",

    contactUs: "সমস্যা হলে যোগাযোগ করুন",

    noticesTitle: "নোটিশ",
    noNotices: "কোনো নোটিশ নেই",

    postNotice: "নোটিশ পাঠান",
    noticeTitleField: "শিরোনাম",
    noticeMsg: "বার্তা",

    allCompanies: "সব কোম্পানি",
    stockReport: "স্টক রিপোর্ট",
    salesReport: "বিক্রয় রিপোর্ট",
    godownReport: "গোডাউনের হিসাব",
    cakeReport: "কেক হিসাব",
    totalValue: "মোট মূল্য",

    company: "কোম্পানি",
    store: "Store",
    godown: "Godown",
    role: "ভূমিকা",
  },

  en: {
    appName: "J H Management",
    tagline: "Multi-business Management Platform",

    pinLogin: "PIN Login",
    companyLogin: "Company Login / Sign up",

    enterPin: "Enter PIN",
    login: "Login",
    wrongPin: "Wrong PIN, try again",

    email: "Email",
    password: "Password",
    companyName: "Company Name",
    whatsapp: "WhatsApp Number",

    storePin: "Store PIN",
    godownPin: "Godown PIN",

    signUp: "Create New Company",
    haveAccount: "Already have an account? Login",
    noAccount: "No account? Sign up",

    back: "Back",
    logout: "Logout",

    loading: "Loading...",
    saving: "Saving...",
    submit: "Submit",

    savedOk: "Saved successfully",
    savedFail: "Error",

    tabEntry: "Sales Entry",
    tabInventory: "Inventory",
    tabDashboard: "Dashboard",
    tabPayment: "Subscription",
    tabPending: "Pending Approvals",
    tabNotices: "Notices",

    name: "Name",
    date: "Date",

    open: "OPEN",
    cash: "CASH",
    mada: "MADA",
    visa: "VISA",
    master: "MASTER",
    hangar: "HANGAR",
    jahez: "JAHEZ",

    systemSales: "System Sales",
    actualSales: "ACTUAL SALES",
    shortPlus: "SHORT/PLUS",
    expense: "EXPENSE",
    note: "NOTE",

    recentEntries: "Recent Entries",
    noEntries: "No entries yet",

    productName: "Product Name",
    quantity: "Quantity",
    unit: "Unit",
    costTotal: "Total Cost",
    expiryDate: "Expiry Date",

    addProduct: "Add Product/Movement",

    movementType: "Type",
    purchase: "Purchase",
    transfer: "Transfer",
    ret: "Return",
    wastage: "Wastage",
    sale: "Sale",

    toLocation: "Send to",
    currentStock: "Current Stock",
    noStock: "No stock",

    pendingApprovals: "Waiting for your approval",
    accept: "Accept",
    reject: "Reject",

    noPending: "No pending requests",
    from: "From",
    qty: "Quantity",

    subscriptionTitle: "Subscription / Payment",
    trialStatus: "Trial active",
    activeStatus: "Active",
    pendingPayment: "Payment due",
    blockedStatus: "Blocked",

    dueDate: "Next due date",
    daysLeft: "days left",

    sendMoneyTo: "Send money to this number",
    copyNumber: "Copy",
    copied: "Copied",

    comingSoon: "Coming soon",
    bankTitle: "Bank Account",
    bankComingSoon: "Coming soon",

    addStore: "Add new Store",
    newStoreName: "New Store name",
    newStorePin: "New PIN",

    contactUs: "Contact us for issues",

    noticesTitle: "Notices",
    noNotices: "No notices",

    postNotice: "Post a notice",
    noticeTitleField: "Title",
    noticeMsg: "Message",

    allCompanies: "All Companies",
    stockReport: "Stock Report",
    salesReport: "Sales Report",
    godownReport: "Godown Report",
    cakeReport: "Cake Report",
    totalValue: "Total Value",

    company: "Company",
    store: "Store",
    godown: "Godown",
    role: "Role",
  },

  ar: {
    appName: "جي إتش للإدارة",
    tagline: "منصة إدارة الأعمال متعددة الشركات",

    pinLogin: "الدخول برمز PIN",
    companyLogin: "دخول / تسجيل الشركة",

    enterPin: "أدخل الرمز",
    login: "دخول",
    wrongPin: "رمز خاطئ",

    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    companyName: "اسم الشركة",
    whatsapp: "رقم واتساب",

    storePin: "رمز المتجر",
    godownPin: "رمز المستودع",

    signUp: "تسجيل شركة جديدة",
    haveAccount: "لديك حساب؟ دخول",
    noAccount: "لا يوجد حساب؟ سجل",

    back: "رجوع",
    logout: "خروج",

    loading: "جارٍ التحميل...",
    saving: "جارٍ الحفظ...",
    submit: "إرسال",

    savedOk: "تم الحفظ",
    savedFail: "خطأ",

    tabEntry: "إدخال المبيعات",
    tabInventory: "المخزون",
    tabDashboard: "لوحة التحكم",
    tabPayment: "الاشتراك",
    tabPending: "بانتظار الموافقة",
    tabNotices: "الإشعارات",

    name: "الاسم",
    date: "التاريخ",

    open: "الافتتاح",
    cash: "نقداً",
    mada: "مدى",
    visa: "فيزا",
    master: "ماستركارد",
    hangar: "هنقر",
    jahez: "جاهز",

    systemSales: "مبيعات النظام",
    actualSales: "المبيعات الفعلية",
    shortPlus: "عجز/زيادة",
    expense: "المصروفات",
    note: "ملاحظة",

    recentEntries: "الإدخالات الأخيرة",
    noEntries: "لا توجد إدخالات",

    productName: "اسم المنتج",
    quantity: "الكمية",
    unit: "الوحدة",
    costTotal: "التكلفة الإجمالية",
    expiryDate: "تاريخ الصلاحية",

    addProduct: "إضافة حركة",

    movementType: "النوع",
    purchase: "شراء",
    transfer: "تحويل",
    ret: "مرتجع",
    wastage: "هدر",
    sale: "بيع",

    toLocation: "أرسل إلى",
    currentStock: "المخزون الحالي",
    noStock: "لا يوجد مخزون",

    pendingApprovals: "بانتظار موافقتك",
    accept: "قبول",
    reject: "رفض",

    noPending: "لا توجد طلبات",
    from: "من",
    qty: "الكمية",

    subscriptionTitle: "الاشتراك / الدفع",
    trialStatus: "تجربة مجانية",
    activeStatus: "نشط",
    pendingPayment: "الدفع مستحق",
    blockedStatus: "محظور",

    dueDate: "تاريخ الاستحقاق",
    daysLeft: "أيام متبقية",

    sendMoneyTo: "أرسل إلى هذا الرقم",
    copyNumber: "نسخ",
    copied: "تم النسخ",

    comingSoon: "قريباً",
    bankTitle: "حساب بنكي",
    bankComingSoon: "قريباً",

    addStore: "إضافة متجر جديد",
    newStoreName: "اسم المتجر",
    newStorePin: "رمز جديد",

    contactUs: "تواصل معنا",

    noticesTitle: "الإشعارات",
    noNotices: "لا إشعارات",

    postNotice: "نشر إشعار",
    noticeTitleField: "العنوان",
    noticeMsg: "الرسالة",

    allCompanies: "كل الشركات",
    stockReport: "تقرير المخزون",
    salesReport: "تقرير المبيعات",
    godownReport: "تقرير المستودع",
    cakeReport: "تقرير الكيك",
    totalValue: "القيمة الإجمالية",

    company: "الشركة",
    store: "متجر",
    godown: "مستودع",
    role: "الدور",
  },
};

/* =========================================================
   LANGUAGE CONTEXT
========================================================= */

const LangContext = createContext(null);

function useLang() {
  return useContext(LangContext);
}

function LangSwitcher({ compact = false }) {
  const { lang, setLang } = useLang();

  const options = [
    { key: "bn", label: "বাং" },
    { key: "en", label: "EN" },
    { key: "ar", label: "AR" },
  ];

  return (
    <div
      className="flex items-center gap-1 rounded-full p-1"
      style={{
        background: compact
          ? "rgba(255,255,255,0.12)"
          : "#EEF0F3",
      }}
    >
      {options.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setLang(item.key)}
          className="px-2.5 py-1 rounded-full text-[11px] font-bold"
          style={{
            background:
              lang === item.key
                ? GOLD
                : "transparent",
            color:
              lang === item.key
                ? NAVY
                : compact
                ? "#FFFFFF"
                : MUTED,
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* =========================================================
   GLOBAL STYLE
========================================================= */

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Tajawal:wght@500;700;800&display=swap');

      .jh-font-display {
        font-family: 'Sora', 'Tajawal', sans-serif;
      }

      .jh-font-body {
        font-family: 'Inter', 'Tajawal', sans-serif;
      }

      .jh-input:focus {
        outline: 2px solid ${GOLD};
        outline-offset: 1px;
      }

      .jh-btn:focus-visible {
        outline: 2px solid ${GOLD};
        outline-offset: 2px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
      }

      button {
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: .65;
      }
    `}</style>
  );
}

/* =========================================================
   BASIC COMPONENTS
========================================================= */

function LogoBadge({ size = 36 }) {
  return (
    <div
      className="jh-font-display flex items-center justify-center rounded-full font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: GOLD,
        color: NAVY,
        fontSize: size * 0.4,
        border: `2px solid ${GOLD}`,
      }}
    >
      JH
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="jh-font-body flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: MUTED }}
      >
        {Icon && <Icon size={13} />}
        {label}
      </label>

      {children}
    </div>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className={`jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm ${
        props.className || ""
      }`}
      style={{
        borderColor: "#D9DCE3",
        color: NAVY,
        ...(props.style || {}),
      }}
    />
  );
}

function NumInput({
  value,
  onChange,
  placeholder = "0.00",
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="0.01"
      className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm"
      style={{
        borderColor: "#D9DCE3",
        color: NAVY,
      }}
      placeholder={placeholder}
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
    />
  );
}

function num(value) {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function fmt(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "-";
  }

  return Number(value).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function todayISO() {
  const date = new Date();
  const offset =
    date.getTimezoneOffset();

  return new Date(
    date.getTime() -
      offset * 60000
  )
    .toISOString()
    .slice(0, 10);
}

function daysUntil(dateStr) {
  if (!dateStr) {
    return null;
  }

  return Math.round(
    (new Date(dateStr) -
      new Date(todayISO())) /
      86400000
  );
}

function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

/* =========================================================
   ENTRY GATE
========================================================= */

function EntryGate({
  onPinMode,
  onCompanyMode,
}) {
  const { t } = useLang();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: NAVY }}
    >
      <GlobalStyle />

      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <LangSwitcher compact />
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <LogoBadge size={80} />
          </div>

          <h1 className="jh-font-display text-2xl font-bold text-white">
            {t.appName}
          </h1>

          <p
            className="jh-font-body text-sm mt-1 text-center"
            style={{ color: "#9AA5BD" }}
          >
            {t.tagline}
          </p>
        </div>

        <div
          className="rounded-2xl p-6 flex flex-col gap-3"
          style={{ background: CARD }}
        >
          <button
            type="button"
            onClick={onPinMode}
            className="jh-btn jh-font-body w-full rounded-lg py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2"
            style={{
              background: NAVY_SOFT,
            }}
          >
            <KeyRound size={16} />
            {t.pinLogin}
          </button>

          <button
            type="button"
            onClick={onCompanyMode}
            className="jh-btn jh-font-body w-full rounded-lg py-3.5 text-sm font-bold flex items-center justify-center gap-2 border"
            style={{
              borderColor: GOLD,
              color: NAVY,
            }}
          >
            <Building2 size={16} />
            {t.companyLogin}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PIN LOGIN
========================================================= */

function PinLoginScreen({
  onLoggedIn,
  onBack,
}) {
  const { t } = useLang();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!pin.trim()) {
      setError(t.enterPin);
      return;
    }

    setBusy(true);
    setError("");

    try {
      const rows = await supaRpc(
        "verify_location_pin",
        {
          p_pin: pin.trim(),
        }
      );

      if (
        !rows ||
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        setError(t.wrongPin);
        return;
      }

      onLoggedIn({
        pin: pin.trim(),
        ...rows[0],
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: NAVY }}
    >
      <GlobalStyle />

      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <LangSwitcher compact />
        </div>

        <div className="flex flex-col items-center mb-8">
          <LogoBadge size={64} />
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: CARD }}
        >
          <Field
            icon={Lock}
            label={t.enterPin}
          >
            <input
              type="password"
              inputMode="numeric"
              className="jh-input jh-font-body w-full rounded-lg border px-3 py-2.5 text-sm mt-1 tracking-widest"
              style={{
                borderColor: error
                  ? DANGER
                  : "#D9DCE3",
                color: NAVY,
              }}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submit();
                }
              }}
            />
          </Field>

          {error && (
            <div
              className="flex items-center gap-1.5 mt-3 text-xs"
              style={{ color: DANGER }}
            >
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="jh-btn jh-font-body w-full mt-5 rounded-lg py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-1.5"
            style={{
              background: NAVY_SOFT,
            }}
          >
            {busy ? t.loading : t.login}
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            onClick={onBack}
            className="jh-btn w-full mt-3 text-xs font-semibold"
            style={{ color: MUTED }}
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   COMPANY AUTH
========================================================= */

function CompanyAuthScreen({
  onLoggedIn,
  onBack,
}) {
  const { t } = useLang();

  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [companyName, setCompanyName] =
    useState("");

  const [whatsapp, setWhatsapp] =
    useState("");

  const [storePin, setStorePin] =
    useState("");

  const [godownPin, setGodownPin] =
    useState("");

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  async function doLogin() {
    if (!email || !password) {
      setError(
        `${t.email} / ${t.password}`
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const session =
        await authSignIn(
          email.trim(),
          password
        );

      const profiles =
        await supaRest(
          `profiles?id=eq.${session.user.id}&select=*`,
          {
            accessToken:
              session.access_token,
          }
        );

      onLoggedIn({
        accessToken:
          session.access_token,
        user: session.user,
        profile:
          profiles &&
          profiles[0],
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function doSignup() {
    if (
      !companyName.trim() ||
      !storePin.trim() ||
      !godownPin.trim()
    ) {
      setError(
        `${t.companyName}, ${t.storePin}, ${t.godownPin}`
      );
      return;
    }

    if (!email || !password) {
      setError(
        `${t.email} / ${t.password}`
      );
      return;
    }

    setBusy(true);
    setError("");

    try {
      const session =
        await authSignUp(
          email.trim(),
          password
        );

      const token =
        session.access_token;

      if (!token) {
        setError(
          "Sign up successful. Email confirm করে Login করুন."
        );

        setMode("login");
        return;
      }

      await supaRpc(
        "bootstrap_company",
        {
          p_company_name:
            companyName.trim(),
          p_whatsapp:
            whatsapp.trim(),
          p_store_pin:
            storePin.trim(),
          p_godown_pin:
            godownPin.trim(),
        },
        token
      );

      const profiles =
        await supaRest(
          `profiles?id=eq.${session.user.id}&select=*`,
          {
            accessToken: token,
          }
        );

      onLoggedIn({
        accessToken: token,
        user: session.user,
        profile:
          profiles &&
          profiles[0],
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: NAVY }}
    >
      <GlobalStyle />

      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <LangSwitcher compact />
        </div>

        <div className="flex flex-col items-center mb-6">
          <LogoBadge size={64} />
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: CARD }}
        >
          <div className="flex flex-col gap-3">
            <Field
              icon={Mail}
              label={t.email}
            >
              <TextInput
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </Field>

            <Field
              icon={Lock}
              label={t.password}
            >
              <TextInput
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
              />
            </Field>

            {mode === "signup" && (
              <>
                <Field
                  icon={Building2}
                  label={t.companyName}
                >
                  <TextInput
                    value={companyName}
                    onChange={(e) =>
                      setCompanyName(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  icon={Phone}
                  label={t.whatsapp}
                >
                  <TextInput
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  icon={KeyRound}
                  label={t.storePin}
                >
                  <TextInput
                    value={storePin}
                    onChange={(e) =>
                      setStorePin(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  icon={KeyRound}
                  label={t.godownPin}
                >
                  <TextInput
                    value={godownPin}
                    onChange={(e) =>
                      setGodownPin(
                        e.target.value
                      )
                    }
                  />
                </Field>
              </>
            )}
          </div>

          {error && (
            <div
              className="flex items-start gap-1.5 mt-3 text-xs"
              style={{ color: DANGER }}
            >
              <AlertCircle
                size={13}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={
              mode === "login"
                ? doLogin
                : doSignup
            }
            disabled={busy}
            className="jh-btn jh-font-body w-full mt-5 rounded-lg py-2.5 text-sm font-semibold text-white"
            style={{
              background: NAVY_SOFT,
            }}
          >
            {busy
              ? t.loading
              : mode === "login"
              ? t.login
              : t.signUp}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(
                mode === "login"
                  ? "signup"
                  : "login"
              );
              setError("");
            }}
            className="jh-btn w-full mt-3 text-xs font-semibold underline"
            style={{ color: NAVY }}
          >
            {mode === "login"
              ? t.noAccount
              : t.haveAccount}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="jh-btn w-full mt-2 text-xs font-semibold"
            style={{ color: MUTED }}
          >
            {t.back}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SALES ENTRY PANEL
========================================================= */

function SalesEntryPanel({ pin }) {
  const { t } = useLang();

  const blank = {
    name: "",
    date: todayISO(),
    open: "",
    cash: "",
    mada: "",
    visa: "",
    master: "",
    hangar: "",
    jahez: "",
    systemSales: "",
    expense: "",
    note: "",
  };

  const [form, setForm] =
    useState(blank);

  const [entries, setEntries] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [msg, setMsg] =
    useState("");

  function setF(key) {
    return (value) => {
      setForm((old) => ({
        ...old,
        [key]: value,
      }));
    };
  }

  async function load() {
    setLoading(true);

    try {
      const data =
        await supaRpc(
          "get_sales_entries",
          {
            p_pin: pin,
          }
        );

      setEntries(
        safeArray(data)
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const actualSales =
    num(form.cash) +
    num(form.mada) +
    num(form.visa) +
    num(form.master);

  const shortPlus =
    form.systemSales === ""
      ? null
      : actualSales -
        num(form.systemSales);

  async function submit() {
    setSaving(true);
    setMsg("");

    try {
      await supaRpc(
        "submit_sales_entry",
        {
          p_pin: pin,
          p_date: form.date,
          p_name: form.name,
          p_open: num(form.open),
          p_cash: num(form.cash),
          p_mada: num(form.mada),
          p_visa: num(form.visa),
          p_master: num(form.master),
          p_hangar: num(form.hangar),
          p_jahez: num(form.jahez),
          p_system_sales:
            num(form.systemSales),
          p_expense: num(form.expense),
          p_note: form.note,
          p_photo: "",
        }
      );

      setMsg(
        `✅ ${t.savedOk}`
      );

      setForm({
        ...blank,
        name: form.name,
      });

      await load();
    } catch (error) {
      setMsg(
        `❌ ${t.savedFail}: ${error.message}`
      );
    } finally {
      setSaving(false);
    }

    setTimeout(() => {
      setMsg("");
    }, 5000);
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{ background: CARD }}
      >
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field
            icon={User}
            label={t.name}
          >
            <TextInput
              value={form.name}
              onChange={(e) =>
                setF("name")(
                  e.target.value
                )
              }
            />
          </Field>

          <Field
            icon={Calendar}
            label={t.date}
          >
            <TextInput
              type="date"
              value={form.date}
              onChange={(e) =>
                setF("date")(
                  e.target.value
                )
              }
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field
            icon={Wallet}
            label={t.open}
          >
            <NumInput
              value={form.open}
              onChange={setF("open")}
            />
          </Field>

          <Field
            icon={Wallet}
            label={t.cash}
          >
            <NumInput
              value={form.cash}
              onChange={setF("cash")}
            />
          </Field>

          <Field
            icon={CreditCard}
            label={t.mada}
          >
            <NumInput
              value={form.mada}
              onChange={setF("mada")}
            />
          </Field>

          <Field
            icon={CreditCard}
            label={t.visa}
          >
            <NumInput
              value={form.visa}
              onChange={setF("visa")}
            />
          </Field>

          <Field
            icon={Landmark}
            label={t.master}
          >
            <NumInput
              value={form.master}
              onChange={setF("master")}
            />
          </Field>

          <Field
            icon={Truck}
            label={t.hangar}
          >
            <NumInput
              value={form.hangar}
              onChange={setF("hangar")}
            />
          </Field>

          <Field
            icon={Bike}
            label={t.jahez}
          >
            <NumInput
              value={form.jahez}
              onChange={setF("jahez")}
            />
          </Field>

          <Field
            icon={Landmark}
            label={t.systemSales}
          >
            <NumInput
              value={form.systemSales}
              onChange={setF(
                "systemSales"
              )}
            />
          </Field>
        </div>

        <div
          className="grid grid-cols-2 gap-3 mb-3 rounded-xl p-3"
          style={{ background: BG }}
        >
          <div>
            <div
              className="text-xs font-semibold"
              style={{ color: MUTED }}
            >
              {t.actualSales}
            </div>

            <div
              className="jh-font-display text-lg font-bold"
              style={{ color: NAVY }}
            >
              {fmt(actualSales)}
            </div>
          </div>

          <div>
            <div
              className="text-xs font-semibold"
              style={{ color: MUTED }}
            >
              {t.shortPlus}
            </div>

            <div
              className="jh-font-display text-lg font-bold"
              style={{
                color:
                  shortPlus === null
                    ? MUTED
                    : shortPlus < 0
                    ? DANGER
                    : SUCCESS,
              }}
            >
              {shortPlus === null
                ? "-"
                : fmt(shortPlus)}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Field
            icon={Receipt}
            label={t.expense}
          >
            <NumInput
              value={form.expense}
              onChange={setF("expense")}
            />
          </Field>
        </div>

        <Field
          icon={StickyNote}
          label={t.note}
        >
          <textarea
            className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: "#D9DCE3",
              color: NAVY,
            }}
            rows={3}
            value={form.note}
            onChange={(e) =>
              setF("note")(
                e.target.value
              )
            }
          />
        </Field>

        {msg && (
          <div
            className="mt-3 text-sm font-medium"
            style={{
              color: msg.startsWith("✅")
                ? SUCCESS
                : DANGER,
            }}
          >
            {msg}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="jh-btn jh-font-body w-full mt-4 rounded-lg py-3 text-sm font-bold text-white flex items-center justify-center gap-2"
          style={{
            background: NAVY_SOFT,
          }}
        >
          {saving ? (
            <>
              <RotateCcw
                size={16}
                className="animate-spin"
              />
              {t.saving}
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              {t.submit}
            </>
          )}
        </button>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: CARD }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="jh-font-display font-bold"
            style={{ color: NAVY }}
          >
            {t.recentEntries}
          </h2>

          <button
            type="button"
            onClick={load}
            className="text-xs font-semibold"
            style={{ color: NAVY_SOFT }}
          >
            <RotateCcw
              size={14}
              className="inline mr-1"
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div
            className="text-sm py-5 text-center"
            style={{ color: MUTED }}
          >
            {t.loading}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="text-sm py-5 text-center"
            style={{ color: MUTED }}
          >
            {t.noEntries}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 10).map(
              (item, index) => (
                <div
                  key={
                    item.id || index
                  }
                  className="rounded-xl p-3 border"
                  style={{
                    borderColor:
                      "#E4E6EB",
                  }}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div
                        className="font-semibold text-sm"
                        style={{
                          color: NAVY,
                        }}
                      >
                        {item.name ||
                          "-"}
                      </div>

                      <div
                        className="text-xs mt-1"
                        style={{
                          color: MUTED,
                        }}
                      >
                        {item.date ||
                          item.created_at ||
                          "-"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className="font-bold"
                        style={{
                          color:
                            SUCCESS,
                        }}
                      >
                        {fmt(
                          item.actual_sales ??
                            item.actualSales ??
                            (
                              num(
                                item.cash
                              ) +
                              num(
                                item.mada
                              ) +
                              num(
                                item.visa
                              ) +
                              num(
                                item.master
                              )
                            )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INVENTORY PANEL
========================================================= */

function InventoryPanel({
  pin,
  locationId,
  isStore,
}) {
  const { t } = useLang();

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [form, setForm] =
    useState({
      productName: "",
      quantity: "",
      unit: "pcs",
      costTotal: "",
      expiryDate: "",
      movementType: "purchase",
      toLocation: "",
    });

  function setF(key) {
    return (value) => {
      setForm((old) => ({
        ...old,
        [key]: value,
      }));
    };
  }

  async function load() {
    setLoading(true);

    try {
      let result = [];

      try {
        result =
          await supaRpc(
            "get_inventory",
            {
              p_pin: pin,
            }
          );
      } catch {
        result = [];
      }

      setItems(
        safeArray(result)
      );
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitMovement() {
    if (
      !form.productName.trim() ||
      !form.quantity
    ) {
      setMessage(
        `❌ ${t.productName} / ${t.quantity}`
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await supaRpc(
        "submit_inventory_movement",
        {
          p_pin: pin,
          p_location_id:
            locationId,
          p_product_name:
            form.productName.trim(),
          p_quantity:
            num(form.quantity),
          p_unit: form.unit,
          p_cost_total:
            num(form.costTotal),
          p_expiry_date:
            form.expiryDate || null,
          p_movement_type:
            form.movementType,
          p_to_location:
            form.toLocation || null,
        }
      );

      setMessage(
        `✅ ${t.savedOk}`
      );

      setForm({
        productName: "",
        quantity: "",
        unit: "pcs",
        costTotal: "",
        expiryDate: "",
        movementType: "purchase",
        toLocation: "",
      });

      setShowForm(false);

      await load();
    } catch (error) {
      setMessage(
        `❌ ${error.message}`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{ background: CARD }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              className="jh-font-display text-lg font-bold"
              style={{ color: NAVY }}
            >
              {t.currentStock}
            </h2>

            <p
              className="text-xs mt-1"
              style={{ color: MUTED }}
            >
              {isStore
                ? t.store
                : t.godown}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowForm(
                !showForm
              )
            }
            className="rounded-lg px-3 py-2 text-xs font-bold text-white flex items-center gap-1.5"
            style={{
              background: NAVY_SOFT,
            }}
          >
            <Plus size={15} />
            {t.addProduct}
          </button>
        </div>

        {showForm && (
          <div
            className="mt-5 rounded-xl p-4"
            style={{ background: BG }}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field
                icon={Package}
                label={t.productName}
              >
                <TextInput
                  value={
                    form.productName
                  }
                  onChange={(e) =>
                    setF(
                      "productName"
                    )(
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                icon={Package}
                label={t.quantity}
              >
                <NumInput
                  value={
                    form.quantity
                  }
                  onChange={setF(
                    "quantity"
                  )}
                />
              </Field>

              <Field
                label={t.unit}
              >
                <TextInput
                  value={form.unit}
                  onChange={(e) =>
                    setF("unit")(
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                icon={Wallet}
                label={t.costTotal}
              >
                <NumInput
                  value={
                    form.costTotal
                  }
                  onChange={setF(
                    "costTotal"
                  )}
                />
              </Field>

              <Field
                icon={CalendarClock}
                label={t.expiryDate}
              >
                <TextInput
                  type="date"
                  value={
                    form.expiryDate
                  }
                  onChange={(e) =>
                    setF(
                      "expiryDate"
                    )(
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field
                icon={RotateCcw}
                label={t.movementType}
              >
                <select
                  className="jh-input jh-font-body w-full rounded-lg border px-3 py-2 text-sm bg-white"
                  style={{
                    borderColor:
                      "#D9DCE3",
                    color: NAVY,
                  }}
                  value={
                    form.movementType
                  }
                  onChange={(e) =>
                    setF(
                      "movementType"
                    )(
                      e.target.value
                    )
                  }
                >
                  <option value="purchase">
                    {t.purchase}
                  </option>
                  <option value="transfer">
                    {t.transfer}
                  </option>
                  <option value="ret">
                    {t.ret}
                  </option>
                  <option value="wastage">
                    {t.wastage}
                  </option>
                  <option value="sale">
                    {t.sale}
                  </option>
                </select>
              </Field>
            </div>

            {form.movementType ===
              "transfer" && (
              <div className="mt-3">
                <Field
                  icon={Truck}
                  label={t.toLocation}
                >
                  <TextInput
                    value={
                      form.toLocation
                    }
                    onChange={(e) =>
                      setF(
                        "toLocation"
                      )(
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>
            )}

            {message && (
              <div
                className="mt-3 text-sm font-medium"
                style={{
                  color:
                    message.startsWith(
                      "✅"
                    )
                      ? SUCCESS
                      : DANGER,
                }}
              >
                {message}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={submitMovement}
                disabled={saving}
                className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white"
                style={{
                  background:
                    NAVY_SOFT,
                }}
              >
                {saving
                  ? t.saving
                  : t.submit}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="px-4 rounded-lg border text-sm font-semibold"
                style={{
                  borderColor:
                    "#D9DCE3",
                  color: MUTED,
                  background:
                    CARD,
                }}
              >
                {t.back}
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: CARD }}
      >
        {loading ? (
          <div
            className="text-sm text-center py-8"
            style={{ color: MUTED }}
          >
            {t.loading}
          </div>
        ) : items.length === 0 ? (
          <div
            className="flex flex-col items-center py-8"
            style={{ color: MUTED }}
          >
            <PackageX size={32} />
            <div className="text-sm mt-2">
              {t.noStock}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(
              (item, index) => {
                const quantity =
                  num(
                    item.quantity ??
                      item.stock ??
                      item.current_stock
                  );

                const expiry =
                  item.expiry_date;

                const days =
                  expiry
                    ? daysUntil(
                        expiry
                      )
                    : null;

                return (
                  <div
                    key={
                      item.id ||
                      index
                    }
                    className="rounded-xl border p-3"
                    style={{
                      borderColor:
                        "#E4E6EB",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            background:
                              GOLD_SOFT,
                            color: NAVY,
                          }}
                        >
                          <Package
                            size={19}
                          />
                        </div>

                        <div>
                          <div
                            className="font-bold text-sm"
                            style={{
                              color:
                                NAVY,
                            }}
                          >
                            {item.product_name ||
                              item.name ||
                              "-"}
                          </div>

                          <div
                            className="text-xs mt-1"
                            style={{
                              color:
                                MUTED,
                            }}
                          >
                            {quantity}{" "}
                            {item.unit ||
                              "pcs"}
                          </div>
                        </div>
                      </div>

                      {days !== null && (
                        <div
                          className="text-right text-xs font-semibold"
                          style={{
                            color:
                              days <=
                              7
                                ? DANGER
                                : MUTED,
                          }}
                        >
                          <CalendarClock
                            size={14}
                            className="inline mr-1"
                          />
                          {days < 0
                            ? "Expired"
                            : `${days} days`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PENDING APPROVALS
========================================================= */

function PendingApprovalsPanel({ pin }) {
  const { t } = useLang();

  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busyId, setBusyId] =
    useState(null);

  const [error, setError] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      let result = [];

      try {
        result =
          await supaRpc(
            "get_pending_approvals",
            {
              p_pin: pin,
            }
          );
      } catch {
        result = [];
      }

      setItems(
        safeArray(result)
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function action(
    item,
    accepted
  ) {
    setBusyId(
      item.id ||
        item.request_id
    );

    try {
      await supaRpc(
        "process_inventory_approval",
        {
          p_pin: pin,
          p_request_id:
            item.id ||
            item.request_id,
          p_accepted:
            accepted,
        }
      );

      await load();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: CARD }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="jh-font-display font-bold"
          style={{ color: NAVY }}
        >
          {t.pendingApprovals}
        </h2>

        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold"
          style={{ color: NAVY_SOFT }}
        >
          <RotateCcw
            size={14}
            className="inline mr-1"
          />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm mb-3"
          style={{
            background:
              "#FDECEC",
            color: DANGER,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="text-sm text-center py-8"
          style={{ color: MUTED }}
        >
          {t.loading}
        </div>
      ) : items.length === 0 ? (
        <div
          className="text-sm text-center py-8"
          style={{ color: MUTED }}
        >
          <Bell
            size={28}
            className="mx-auto mb-2"
          />
          {t.noPending}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(
            (item, index) => {
              const id =
                item.id ||
                item.request_id ||
                index;

              const busy =
                busyId === id;

              return (
                <div
                  key={id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor:
                      "#E4E6EB",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className="font-bold text-sm"
                        style={{
                          color:
                            NAVY,
                        }}
                      >
                        {item.product_name ||
                          item.name ||
                          "Inventory Request"}
                      </div>

                      <div
                        className="text-xs mt-1"
                        style={{
                          color:
                            MUTED,
                        }}
                      >
                        {t.from}:{" "}
                        {item.from_location ||
                          item.source ||
                          "-"}
                      </div>

                      <div
                        className="text-xs mt-1"
                        style={{
                          color:
                            MUTED,
                        }}
                      >
                        {t.qty}:{" "}
                        {item.quantity ||
                          item.qty ||
                          0}
                      </div>
                    </div>

                    <AlertTriangle
                      size={19}
                      style={{
                        color:
                          WARNING,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        action(
                          item,
                          true
                        )
                      }
                      className="rounded-lg py-2 text-xs font-bold text-white"
                      style={{
                        background:
                          SUCCESS,
                      }}
                    >
                      {busy
                        ? "..."
                        : t.accept}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        action(
                          item,
                          false
                        )
                      }
                      className="rounded-lg py-2 text-xs font-bold text-white"
                      style={{
                        background:
                          DANGER,
                      }}
                    >
                      {busy
                        ? "..."
                        : t.reject}
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUBSCRIPTION PANEL
========================================================= */

function SubscriptionPanel() {
  const { t } = useLang();

  const [copied, setCopied] =
    useState("");

  async function copyNumber(number) {
    if (!number) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        number
      );

      setCopied(number);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch {
      setCopied("");
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5"
        style={{
          background: CARD,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background:
                GOLD_SOFT,
              color: NAVY,
            }}
          >
            <CreditCard size={23} />
          </div>

          <div>
            <h2
              className="jh-font-display font-bold"
              style={{
                color: NAVY,
              }}
            >
              {t.subscriptionTitle}
            </h2>

            <div
              className="text-xs mt-1"
              style={{
                color: SUCCESS,
              }}
            >
              {t.activeStatus}
            </div>
          </div>
        </div>

        <div
          className="mt-5 rounded-xl p-4"
          style={{
            background: BG,
          }}
        >
          <div
            className="text-xs font-semibold"
            style={{
              color: MUTED,
            }}
          >
            {t.dueDate}
          </div>

          <div
            className="jh-font-display text-lg font-bold mt-1"
            style={{
              color: NAVY,
            }}
          >
            —
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{
          background: CARD,
        }}
      >
        <h3
          className="jh-font-display font-bold mb-4"
          style={{
            color: NAVY,
          }}
        >
          {t.sendMoneyTo}
        </h3>

        <div className="space-y-3">
          {PAYMENT_METHODS.map(
            (method) => (
              <div
                key={method.id}
                className="rounded-xl border p-4"
                style={{
                  borderColor:
                    "#E4E6EB",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background:
                          GOLD_SOFT,
                        color:
                          NAVY,
                      }}
                    >
                      <Banknote
                        size={18}
                      />
                    </div>

                    <div>
                      <div
                        className="font-bold text-sm"
                        style={{
                          color:
                            NAVY,
                        }}
                      >
                        {method.name}
                      </div>

                      <div
                        className="text-sm mt-1"
                        style={{
                          color:
                            MUTED,
                        }}
                      >
                        {method.number ||
                          t.comingSoon}
                      </div>
                    </div>
                  </div>

                  {method.number && (
                    <button
                      type="button"
                      onClick={() =>
                        copyNumber(
                          method.number
                        )
                      }
                      className="rounded-lg px-3 py-2 text-xs font-bold"
                      style={{
                        background:
                          GOLD_SOFT,
                        color:
                          NAVY,
                      }}
                    >
                      {copied ===
                      method.number ? (
                        <>
                          <Check
                            size={14}
                            className="inline mr-1"
                          />
                          {t.copied}
                        </>
                      ) : (
                        <>
                          <Copy
                            size={14}
                            className="inline mr-1"
                          />
                          {t.copyNumber}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{
          background: CARD,
        }}
      >
        <div className="flex items-center gap-3">
          <Landmark
            size={22}
            style={{
              color: NAVY,
            }}
          />

          <div>
            <div
              className="font-bold"
              style={{
                color: NAVY,
              }}
            >
              {t.bankTitle}
            </div>

            <div
              className="text-xs mt-1"
              style={{
                color: MUTED,
              }}
            >
              {t.bankComingSoon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   LOCATION SCREEN
========================================================= */

function LocationScreen({
  session,
  onLogout,
}) {
  const { t, lang } =
    useLang();

  const isStore =
    session.location_type ===
    "store";

  const [tab, setTab] =
    useState(
      isStore
        ? "entry"
        : "inventory"
    );

  return (
    <div
      className="min-h-screen jh-font-body"
      dir={
        lang === "ar"
          ? "rtl"
          : "ltr"
      }
      style={{
        background: BG,
      }}
    >
      <GlobalStyle />

      <div
        className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between gap-3"
        style={{
          background: NAVY,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoBadge size={36} />

          <div className="min-w-0">
            <div
              className="jh-font-display text-white text-base font-bold leading-tight truncate"
            >
              {session.location_name ||
                "JH Management"}
            </div>

            <div
              className="text-xs"
              style={{
                color:
                  "#9AA5BD",
              }}
            >
              {isStore
                ? t.store
                : t.godown}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LangSwitcher compact />

          <button
            type="button"
            onClick={onLogout}
            className="jh-btn flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
            style={{
              color: "white",
              background:
                "rgba(255,255,255,0.12)",
            }}
          >
            <LogOut size={13} />
            {t.logout}
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-4 max-w-2xl mx-auto flex-wrap">
        {isStore && (
          <button
            type="button"
            onClick={() =>
              setTab("entry")
            }
            className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
            style={{
              background:
                tab === "entry"
                  ? NAVY_SOFT
                  : CARD,
              color:
                tab === "entry"
                  ? "white"
                  : NAVY,
            }}
          >
            <ClipboardList
              size={13}
            />
            {t.tabEntry}
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            setTab("inventory")
          }
          className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{
            background:
              tab === "inventory"
                ? NAVY_SOFT
                : CARD,
            color:
              tab === "inventory"
                ? "white"
                : NAVY,
          }}
        >
          <Package size={13} />
          {t.tabInventory}
        </button>

        <button
          type="button"
          onClick={() =>
            setTab("pending")
          }
          className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
          style={{
            background:
              tab === "pending"
                ? NAVY_SOFT
                : CARD,
            color:
              tab === "pending"
                ? "white"
                : NAVY,
          }}
        >
          <Bell size={13} />
          {t.tabPending}
        </button>

        {isStore && (
          <button
            type="button"
            onClick={() =>
              setTab("payment")
            }
            className="jh-btn text-xs px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5"
            style={{
              background:
                tab === "payment"
                  ? NAVY_SOFT
                  : CARD,
              color:
                tab === "payment"
                  ? "white"
                  : NAVY,
            }}
          >
            <CreditCard
              size={13}
            />
            {t.tabPayment}
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-20">
        {tab === "entry" &&
          isStore && (
            <SalesEntryPanel
              pin={session.pin}
            />
          )}

        {tab === "inventory" && (
          <InventoryPanel
            pin={session.pin}
            locationId={
              session.location_id
            }
            isStore={isStore}
          />
        )}

        {tab === "pending" && (
          <PendingApprovalsPanel
            pin={session.pin}
          />
        )}

        {tab === "payment" &&
          isStore && (
            <SubscriptionPanel />
          )}
      </div>
    </div>
  );
}

/* =========================================================
   COMPANY DASHBOARD
========================================================= */

function CompanyDashboard({
  session,
  onLogout,
}) {
  const { t, lang } =
    useLang();

  const [tab, setTab] =
    useState("dashboard");

  const profile =
    session.profile || {};

  const companyName =
    profile.company_name ||
    profile.company ||
    "JH Management";

  const [stores, setStores] =
    useState([]);

  const [loadingStores, setLoadingStores] =
    useState(false);

  const [newStoreName, setNewStoreName] =
    useState("");

  const [newStorePin, setNewStorePin] =
    useState("");

  const [storeMessage, setStoreMessage] =
    useState("");

  async function loadStores() {
    setLoadingStores(true);

    try {
      const companyId =
        profile.company_id;

      if (!companyId) {
        setStores([]);
        return;
      }

      const data =
        await supaRest(
          `locations?company_id=eq.${companyId}&select=*&order=created_at.desc`,
          {
            accessToken:
              session.accessToken,
          }
        );

      setStores(
        safeArray(data)
      );
    } catch (error) {
      console.error(error);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  }

  useEffect(() => {
    loadStores();
  }, []);

  async function addStore() {
    if (
      !newStoreName.trim() ||
      !newStorePin.trim()
    ) {
      setStoreMessage(
        "Store name এবং PIN দিন"
      );
      return;
    }

    setStoreMessage("");

    try {
      await supaRpc(
        "create_store",
        {
          p_company_id:
            profile.company_id,
          p_name:
            newStoreName.trim(),
          p_pin:
            newStorePin.trim(),
        },
        session.accessToken
      );

      setNewStoreName("");
      setNewStorePin("");

      setStoreMessage(
        `✅ ${t.savedOk}`
      );

      await loadStores();
    } catch (error) {
      setStoreMessage(
        `❌ ${error.message}`
      );
    }
  }

  return (
    <div
      className="min-h-screen jh-font-body"
      dir={
        lang === "ar"
          ? "rtl"
          : "ltr"
      }
      style={{
        background: BG,
      }}
    >
      <GlobalStyle />

      <div
        className="sticky top-0 z-20 px-4 py-4 flex items-center justify-between gap-3"
        style={{
          background: NAVY,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoBadge size={38} />

          <div className="min-w-0">
            <div
              className="jh-font-display text-white font-bold truncate"
            >
              {companyName}
            </div>

            <div
              className="text-xs"
              style={{
                color:
                  "#9AA5BD",
              }}
            >
              Company Admin
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LangSwitcher compact />

          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-white flex items-center gap-1"
            style={{
              background:
                "rgba(255,255,255,.12)",
            }}
          >
            <LogOut size={13} />
            {t.logout}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            [
              "dashboard",
              t.tabDashboard,
              TrendingUp,
            ],
            [
              "stores",
              t.store,
              Users,
            ],
            [
              "payment",
              t.tabPayment,
              CreditCard,
            ],
          ].map(
            (item) => {
              const Icon =
                item[2];

              return (
                <button
                  type="button"
                  key={item[0]}
                  onClick={() =>
                    setTab(
                      item[0]
                    )
                  }
                  className="rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  style={{
                    background:
                      tab === item[0]
                        ? NAVY_SOFT
                        : CARD,
                    color:
                      tab === item[0]
                        ? "white"
                        : NAVY,
                  }}
                >
                  <Icon size={14} />
                  {item[1]}
                </button>
              );
            }
          )}
        </div>

        {tab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <DashboardCard
                icon={Building2}
                title={t.company}
                value={companyName}
              />

              <DashboardCard
                icon={Users}
                title={t.store}
                value={stores.length}
              />

              <DashboardCard
                icon={Package}
                title={t.stockReport}
                value="—"
              />

              <DashboardCard
                icon={Receipt}
                title={t.salesReport}
                value="—"
              />
            </div>

            <div
              className="rounded-2xl p-5"
              style={{
                background: CARD,
              }}
            >
              <h2
                className="jh-font-display font-bold mb-4"
                style={{
                  color: NAVY,
                }}
              >
                {t.allCompanies}
              </h2>

              <div
                className="h-48 flex items-center justify-center rounded-xl"
                style={{
                  background: BG,
                }}
              >
                <div
                  className="text-sm"
                  style={{
                    color: MUTED,
                  }}
                >
                  Dashboard data এখানে দেখাবে
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "stores" && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5"
              style={{
                background: CARD,
              }}
            >
              <h2
                className="jh-font-display font-bold mb-4"
                style={{
                  color: NAVY,
                }}
              >
                {t.addStore}
              </h2>

              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  icon={Building2}
                  label={t.newStoreName}
                >
                  <TextInput
                    value={
                      newStoreName
                    }
                    onChange={(e) =>
                      setNewStoreName(
                        e.target.value
                      )
                    }
                  />
                </Field>

                <Field
                  icon={KeyRound}
                  label={t.newStorePin}
                >
                  <TextInput
                    value={
                      newStorePin
                    }
                    onChange={(e) =>
                      setNewStorePin(
                        e.target.value
                      )
                    }
                  />
                </Field>
              </div>

              {storeMessage && (
                <div
                  className="mt-3 text-sm"
                  style={{
                    color:
                      storeMessage.startsWith(
                        "✅"
                      )
                        ? SUCCESS
                        : DANGER,
                  }}
                >
                  {storeMessage}
                </div>
              )}

              <button
                type="button"
                onClick={addStore}
                className="mt-4 rounded-lg px-4 py-2.5 text-sm font-bold text-white"
                style={{
                  background:
                    NAVY_SOFT,
                }}
              >
                <Plus
                  size={15}
                  className="inline mr-1"
                />
                {t.addStore}
              </button>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{
                background: CARD,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="jh-font-display font-bold"
                  style={{
                    color: NAVY,
                  }}
                >
                  {t.store}
                </h2>

                <button
                  type="button"
                  onClick={loadStores}
                  className="text-xs font-semibold"
                  style={{
                    color:
                      NAVY_SOFT,
                  }}
                >
                  Refresh
                </button>
              </div>

              {loadingStores ? (
                <div
                  className="text-center py-6 text-sm"
                  style={{
                    color: MUTED,
                  }}
                >
                  {t.loading}
                </div>
              ) : stores.length ===
                0 ? (
                <div
                  className="text-center py-6 text-sm"
                  style={{
                    color: MUTED,
                  }}
                >
                  {t.noEntries}
                </div>
              ) : (
                <div className="space-y-2">
                  {stores.map(
                    (
                      store,
                      index
                    ) => (
                      <div
                        key={
                          store.id ||
                          index
                        }
                        className="border rounded-xl p-4 flex items-center justify-between"
                        style={{
                          borderColor:
                            "#E4E6EB",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              background:
                                GOLD_SOFT,
                              color:
                                NAVY,
                            }}
                          >
                            <Building2
                              size={18}
                            />
                          </div>

                          <div>
                            <div
                              className="font-bold text-sm"
                              style={{
                                color:
                                  NAVY,
                              }}
                            >
                              {store.name ||
                                store.location_name ||
                                "-"}
                            </div>

                            <div
                              className="text-xs mt-1"
                              style={{
                                color:
                                  MUTED,
                              }}
                            >
                              {store.location_type ||
                                t.store}
                            </div>
                          </div>
                        </div>

                        <CheckCircle2
                          size={18}
                          style={{
                            color:
                              SUCCESS,
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "payment" && (
          <SubscriptionPanel />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: CARD,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
        style={{
          background:
            GOLD_SOFT,
          color: NAVY,
        }}
      >
        <Icon size={18} />
      </div>

      <div
        className="text-xs font-semibold"
        style={{
          color: MUTED,
        }}
      >
        {title}
      </div>

      <div
        className="jh-font-display text-sm font-bold mt-1 truncate"
        style={{
          color: NAVY,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [lang, setLang] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            "jh_lang"
          ) || "bn"
        );
      } catch {
        return "bn";
      }
    });

  const [screen, setScreen] =
    useState("gate");

  const [session, setSession] =
    useState(null);

  const t =
    STR[lang] || STR.bn;

  useEffect(() => {
    try {
      localStorage.setItem(
        "jh_lang",
        lang
      );
    } catch {
      // ignore
    }
  }, [lang]);

  function logout() {
    setSession(null);
    setScreen("gate");
  }

  const languageValue =
    useMemo(
      () => ({
        lang,
        setLang,
        t,
      }),
      [lang, t]
    );

  return (
    <LangContext.Provider
      value={languageValue}
    >
      {screen === "gate" && (
        <EntryGate
          onPinMode={() =>
            setScreen("pin")
          }
          onCompanyMode={() =>
            setScreen("company")
          }
        />
      )}

      {screen === "pin" && (
        <PinLoginScreen
          onBack={() =>
            setScreen("gate")
          }
          onLoggedIn={(data) => {
            setSession(data);
            setScreen(
              "location"
            );
          }}
        />
      )}

      {screen === "company" && (
        <CompanyAuthScreen
          onBack={() =>
            setScreen("gate")
          }
          onLoggedIn={(data) => {
            setSession(data);
            setScreen(
              "companyDashboard"
            );
          }}
        />
      )}

      {screen === "location" &&
        session && (
          <LocationScreen
            session={session}
            onLogout={logout}
          />
        )}

      {screen ===
        "companyDashboard" &&
        session && (
          <CompanyDashboard
            session={session}
            onLogout={logout}
          />
        )}
    </LangContext.Provider>
  );
}
