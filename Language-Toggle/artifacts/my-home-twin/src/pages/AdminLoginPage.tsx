import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/LanguageToggle";
import { api } from "@/lib/api";
import { Shield, Zap, HardHat, Users, ArrowRight } from "lucide-react";

// Change this URL to the real Energy Engineer portal when ready.
const ENERGY_ENGINEER_PORTAL_URL = "https://www.google.com";

type LoginType = "platformAdmin" | "energyEngineer" | null;

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const { login } = useHome();
  const [, setLocation] = useLocation();

  const [loginType, setLoginType] = useState<LoginType>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (loginType === "energyEngineer") {
        if (name.trim() === "admin" && password.trim() === "admin") {
          window.location.href = ENERGY_ENGINEER_PORTAL_URL;
          return;
        }
        setError(t("بيانات مهندس الطاقة غير صحيحة", "Energy engineer credentials are incorrect"));
        return;
      }

      const { token, user } = await api.login(name.trim(), password.trim());
      if (user.role !== "admin") {
        setError(t("هذا الحساب ليس مشرفاً", "This account is not an admin"));
        return;
      }
      login(token, user);
      setLocation("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("حدث خطأ", "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  const title = loginType === "energyEngineer" ? t("دخول مهندس الطاقة", "Energy Engineer Login") : t("دخول مشرف المنصة", "Platform Admin Login");
  const description = loginType === "energyEngineer" ? t("أدخل admin / admin للتحويل إلى بوابة مهندس الطاقة.", "Enter admin / admin to redirect to the Energy Engineer portal.") : t("دخول لوحة مشرف المواطنين الحالية.", "Login to the existing citizen platform admin panel.");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a0e20] to-[#0d1535]" />
      <div className="absolute top-0 w-full p-5 z-50 flex justify-between items-center">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm">
          <Zap className="w-4 h-4 text-cyan-400" />
          {t("منصة الخليل", "Hebron Platform")}
        </button>
        <LanguageToggle />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{t("بوابة الدخول", "Access Portal")}</h1>
          <p className="text-white/45 text-sm">{t("اختر نوع الدخول المطلوب", "Choose the access type")}</p>
        </div>

        {!loginType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button onClick={() => setLoginType("platformAdmin")} className="group p-7 rounded-3xl bg-white/4 border border-violet-500/20 hover:border-violet-400/60 hover:bg-violet-500/10 transition-all text-start">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center mb-5"><Users className="w-7 h-7 text-violet-300" /></div>
              <h2 className="text-xl font-bold text-white mb-2">{t("مشرف منصة المواطنين", "Citizen Platform Admin")}</h2>
              <p className="text-white/45 text-sm leading-6 mb-4">{t("دخول لوحة المشرف لعرض المواطنين والشكاوى والرد عليها.", "Open the admin dashboard to view citizens and complaints.")}</p>
              <span className="inline-flex items-center gap-2 text-violet-300 text-sm font-semibold">{t("دخول", "Login")}<ArrowRight className="w-4 h-4 rtl:rotate-180" /></span>
            </button>

            <button onClick={() => setLoginType("energyEngineer")} className="group p-7 rounded-3xl bg-white/4 border border-cyan-500/20 hover:border-cyan-400/60 hover:bg-cyan-500/10 transition-all text-start">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center mb-5"><HardHat className="w-7 h-7 text-cyan-300" /></div>
              <h2 className="text-xl font-bold text-white mb-2">{t("أنا مهندس طاقة", "I am an Energy Engineer")}</h2>
              <p className="text-white/45 text-sm leading-6 mb-4">{t("دخول خاص يحوّلك إلى بوابة مهندس الطاقة الخارجية.", "Special login that redirects to the external energy engineer portal.")}</p>
              <span className="inline-flex items-center gap-2 text-cyan-300 text-sm font-semibold">{t("متابعة", "Continue")}<ArrowRight className="w-4 h-4 rtl:rotate-180" /></span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
              <div className={`inline-flex w-14 h-14 rounded-2xl ${loginType === "energyEngineer" ? "bg-cyan-500/15 border-cyan-500/25" : "bg-violet-500/15 border-violet-500/25"} border items-center justify-center mb-4`}>
                {loginType === "energyEngineer" ? <HardHat className="w-7 h-7 text-cyan-400" /> : <Shield className="w-7 h-7 text-violet-400" />}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
              <p className="text-white/40 text-sm leading-6">{description}</p>
            </div>

            <form onSubmit={handleSubmit} className="rounded-3xl p-7 space-y-5 bg-white/4 border border-white/10 backdrop-blur-sm">
              {error && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>}
              <div className="space-y-2"><Label className="text-white/70 text-sm">{t("اسم المستخدم", "Username")}</Label><Input required value={name} onChange={e => setName(e.target.value)} className="bg-slate-900/60 border-white/10 text-white h-11 rounded-xl" placeholder="admin" /></div>
              <div className="space-y-2"><Label className="text-white/70 text-sm">{t("كلمة المرور", "Password")}</Label><Input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="bg-slate-900/60 border-white/10 text-white h-11 rounded-xl" placeholder="••••••••" /></div>
              <button disabled={loading} className={`w-full h-11 rounded-xl ${loginType === "energyEngineer" ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950" : "bg-violet-600 hover:bg-violet-500 text-white"} disabled:opacity-60 font-bold transition-all`}>{loading ? "..." : t("دخول", "Login")}</button>
              <button type="button" onClick={() => { setLoginType(null); setError(""); setName(""); setPassword(""); }} className="w-full text-white/45 hover:text-white/80 text-sm">{t("رجوع لاختيار نوع الدخول", "Back to access type")}</button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
