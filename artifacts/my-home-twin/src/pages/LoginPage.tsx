import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageToggle } from "@/components/LanguageToggle";
import { api } from "@/lib/api";
import { Zap, LogIn } from "lucide-react";

export default function LoginPage() {
  const { t } = useLanguage();
  const { login, refreshHome } = useHome();
  const [, setLocation] = useLocation();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login(name.trim(), password.trim());
      login(token, user);

      if (user.role === "admin") {
        setLocation("/admin");
        return;
      }

      // Load home data before routing so ProtectedRoute sees correct setup state
      const homeData = await refreshHome();
      if (homeData?.setup) {
        setLocation("/home");
      } else {
        setLocation("/setup");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("حدث خطأ", "An error occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="absolute top-0 w-full p-5 z-50 flex justify-between items-center">
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm">
          <Zap className="w-4 h-4 text-cyan-400" />
          {t("منصة الخليل", "Hebron Platform")}
        </button>
        <LanguageToggle />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 items-center justify-center mb-4">
            <LogIn className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t("تسجيل الدخول", "Login")}</h1>
          <p className="text-white/50 text-sm">{t("ادخل إلى منزلك الرقمي", "Access your digital home")}</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl p-8 space-y-5 bg-white/4 border border-white/10 backdrop-blur-sm">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white/70 text-sm">{t("الاسم", "Name")}</Label>
            <Input
              required
              data-testid="input-name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-slate-900/60 border-white/10 text-white h-12 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder={t("اسمك", "Your name")}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/70 text-sm">{t("كلمة المرور", "Password")}</Label>
            <Input
              type="password"
              required
              data-testid="input-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-slate-900/60 border-white/10 text-white h-12 rounded-xl focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            data-testid="button-login-submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-900 font-bold text-base transition-all duration-200 shadow-[0_0_20px_rgba(0,229,255,0.25)] flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              : t("دخول", "Login")}
          </button>

          <div className="text-center pt-2 border-t border-white/8">
            <button type="button" onClick={() => setLocation("/register")} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              {t("ليس لديك حساب؟ إنشاء حساب", "No account? Create one")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
