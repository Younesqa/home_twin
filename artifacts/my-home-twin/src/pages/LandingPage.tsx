import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Zap, Battery, MapPin, ShieldAlert, User, LogIn, Shield } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function LandingPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const steps = [
    { num: "01", ar: "سجّل أو ادخل لحسابك", en: "Register or login to your account" },
    { num: "02", ar: "أضف غرف بيتك وأجهزتك", en: "Add your rooms and devices" },
    { num: "03", ar: "تحكم من خريطة المنزل", en: "Control from the home map" },
    { num: "04", ar: "افهم فاتورتك وبطاريتك وقت الانقطاع", en: "Understand your bill and battery during outages" },
  ];

  const features = [
    { icon: Zap, ar: "فاتورة مبسطة", en: "Simplified Bill", color: "text-cyan-400", bg: "bg-cyan-500/20" },
    { icon: Battery, ar: "بطارية المنزل", en: "Home Battery", color: "text-emerald-400", bg: "bg-emerald-500/20" },
    { icon: MapPin, ar: "تحكم من الخريطة", en: "Map Control", color: "text-violet-400", bg: "bg-violet-500/20" },
    { icon: ShieldAlert, ar: "وضع الانقطاع", en: "Outage Mode", color: "text-amber-400", bg: "bg-amber-500/20" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-500/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              {t("منصة الخليل للمواطنين", "Hebron Citizen Platform")}
            </p>
            <p className="text-white/40 text-xs">{t("الطاقة والبنية التحتية", "Energy & Infrastructure")}</p>
          </div>
        </div>
        <LanguageToggle />
      </header>

      <main className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 text-sm font-medium">
              {t("منصة الخليل للمواطنين", "Hebron Citizen Platform")}
            </span>
          </motion.div>

          {/* House Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative w-64 h-48 mx-auto mb-10"
          >
            <svg viewBox="0 0 320 240" className="w-full h-full drop-shadow-[0_0_40px_rgba(0,229,255,0.25)]">
              {/* Animated energy ground line */}
              <motion.line x1="0" y1="200" x2="320" y2="200" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.15"
                animate={{ strokeOpacity: [0.05, 0.2, 0.05] }} transition={{ repeat: Infinity, duration: 3 }} />

              {/* House body */}
              <path d="M60,180 L60,105 L160,40 L260,105 L260,180 Z" fill="rgba(10,22,55,0.85)" stroke="#00e5ff" strokeWidth="1.5" strokeOpacity="0.6" />
              {/* Roof */}
              <path d="M50,108 L160,35 L270,108" fill="none" stroke="#00e5ff" strokeWidth="2" strokeOpacity="0.8" />

              {/* Left window - living room */}
              <motion.rect x="80" y="120" width="50" height="40" rx="4" fill="rgba(0,229,255,0.15)" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.5"
                animate={{ fill: ["rgba(0,229,255,0.1)", "rgba(0,229,255,0.25)", "rgba(0,229,255,0.1)"] }}
                transition={{ repeat: Infinity, duration: 2.5 }} />
              {/* Right window - bedroom */}
              <motion.rect x="190" y="120" width="50" height="40" rx="4" fill="rgba(0,229,255,0.15)" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.5"
                animate={{ fill: ["rgba(0,229,255,0.1)", "rgba(0,229,255,0.25)", "rgba(0,229,255,0.1)"] }}
                transition={{ repeat: Infinity, duration: 2.5, delay: 0.8 }} />
              {/* Door */}
              <rect x="135" y="140" width="50" height="40" rx="3" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1" strokeOpacity="0.4" />
              <circle cx="178" cy="161" r="2.5" fill="#00e5ff" fillOpacity="0.6" />

              {/* Battery pod (right) */}
              <motion.rect x="278" y="110" width="20" height="52" rx="6" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1.5"
                animate={{ fill: ["rgba(16,185,129,0.1)", "rgba(16,185,129,0.3)", "rgba(16,185,129,0.1)"] }}
                transition={{ repeat: Infinity, duration: 1.8 }} />
              <rect x="284" y="106" width="8" height="5" rx="2" fill="#10b981" fillOpacity="0.6" />

              {/* Energy line from battery to house */}
              <motion.path d="M278,135 L260,135" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4"
                animate={{ strokeDashoffset: [8, 0] }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} />

              {/* Power line from top */}
              <motion.path d="M160,0 L160,35" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="3 3"
                animate={{ strokeDashoffset: [6, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }} />

              {/* Meter */}
              <rect x="40" y="150" width="16" height="20" rx="3" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth="1" />
            </svg>

            {/* Floating feature tags */}
            {features.map((f, i) => {
              const positions = [
                "-top-4 -left-6",
                "-top-4 -right-6",
                "-bottom-2 -left-8",
                "-bottom-2 -right-8",
              ];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                  className={`absolute ${positions[i]} flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-md bg-slate-900/70 border border-white/10 shadow-xl`}
                >
                  <div className={`w-6 h-6 rounded-lg ${f.bg} flex items-center justify-center flex-shrink-0`}>
                    <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                  </div>
                  <span className="text-white/90 text-xs font-medium whitespace-nowrap">{t(f.ar, f.en)}</span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight max-w-2xl"
          >
            {t("منزلك الرقمي لإدارة الطاقة والبنية التحتية", "Your Digital Home for Energy & Infrastructure")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-white/55 text-base md:text-lg max-w-xl mb-10 leading-relaxed"
          >
            {t(
              "منصة مبسطة تابعة لمنظومة الخليل الذكية، تساعد المواطن على بناء نسخة رقمية من بيته، متابعة الفاتورة، إدارة البطارية، والتحكم بالأجهزة من خريطة المنزل.",
              "A simple citizen platform connected to Hebron's smart digital twin, helping users build a digital version of their home, understand their bill, manage battery storage, and control devices from the home map."
            )}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-5"
          >
            <button
              data-testid="button-register"
              onClick={() => setLocation("/register")}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-base transition-all duration-200 shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)]"
            >
              <User className="w-4 h-4" />
              {t("إنشاء حساب", "Create Account")}
            </button>
            <button
              data-testid="button-login"
              onClick={() => setLocation("/login")}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/8 hover:bg-white/15 text-white font-semibold text-base border border-white/15 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              {t("تسجيل الدخول", "Login")}
            </button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            data-testid="button-admin-login"
            onClick={() => setLocation("/admin-login")}
            className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            {t("دخول المشرف", "Admin Login")}
          </motion.button>
        </section>

        {/* How it works */}
        <section className="px-4 pb-16 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-center text-white/80 font-bold text-lg mb-8">
              {t("كيف تعمل المنصة؟", "How does the platform work?")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/4 border border-white/8 backdrop-blur-sm"
                >
                  <span className="text-cyan-500 font-bold text-lg leading-none flex-shrink-0">{step.num}</span>
                  <p className="text-white/70 text-sm leading-relaxed">{t(step.ar, step.en)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
