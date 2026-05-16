import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { useToast } from "@/hooks/use-toast";
import { api, type SolarSummary } from "@/lib/api";
import { motion } from "framer-motion";
import { Sun, Zap, Wallet, TrendingUp, AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function SolarPage() {
  const { t } = useLanguage();
  const { setup } = useHome();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [summary, setSummary] = useState<SolarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellAmount, setSellAmount] = useState("");
  const [selling, setSelling] = useState(false);

  const hasSolar = setup?.has_solar === 1;

  const loadSummary = async () => {
    try {
      const data = await api.getSolarSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load solar summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
    const interval = setInterval(() => { void loadSummary(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    const kwh = parseFloat(sellAmount);
    if (!kwh || kwh <= 0) return;
    setSelling(true);
    try {
      const data = await api.sellSolarEnergy(kwh);
      setSummary(data);
      setSellAmount("");
      toast({ title: t("تم بيع الطاقة وإضافة الرصيد للمحفظة", "Energy sold and balance added to wallet") });
    } catch (err: unknown) {
      toast({
        title: err instanceof Error ? err.message : t("فشل في بيع الطاقة", "Failed to sell energy"),
        variant: "destructive",
      });
    } finally {
      setSelling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">{t("الطاقة الشمسية", "Solar Energy")}</h1>
            <p className="text-white/40 text-sm">{t("بيع الطاقة الشمسية الفائضة للبلدية", "Sell surplus solar energy to the municipality")}</p>
          </div>

          {!hasSolar ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center mt-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Sun className="w-10 h-10 text-amber-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-3">{t("لا توجد خلايا شمسية", "No Solar Panels")}</h2>
              <p className="text-white/50 text-sm leading-6 mb-6">
                {t(
                  "هذه الصفحة متاحة فقط للمستخدمين الذين لديهم خلايا شمسية. يمكنك تفعيلها من تعديل إعدادات المنزل.",
                  "This page is only available for users who have solar panels. You can enable it from home settings."
                )}
              </p>
              <button
                onClick={() => setLocation("/setup")}
                className="flex items-center gap-2 mx-auto px-5 h-11 rounded-xl border border-white/15 text-white/60 hover:bg-white/5 hover:text-white/80 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("تعديل إعدادات المنزل", "Edit home settings")}
              </button>
            </motion.div>
          ) : loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : summary?.hasSolar ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="p-5 rounded-3xl bg-white/4 border border-amber-500/20">
                  <Sun className="w-5 h-5 text-amber-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{summary.availableKwh?.toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">kWh</p>
                  <p className="text-white/60 text-sm mt-2">{t("الطاقة المتاحة", "Available Energy")}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-3xl bg-white/4 border border-white/10">
                  <TrendingUp className="w-5 h-5 text-cyan-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{summary.ratePerKwh?.toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">{t("شيكل / kWh", "NIS / kWh")}</p>
                  <p className="text-white/60 text-sm mt-2">{t("سعر البيع للبلدية", "Municipality Rate")}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-3xl bg-white/4 border border-emerald-500/20">
                  <Zap className="w-5 h-5 text-emerald-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{summary.estimatedValue?.toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">₪</p>
                  <p className="text-white/60 text-sm mt-2">{t("القيمة التقريبية", "Estimated Value")}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-5 rounded-3xl bg-white/4 border border-white/10">
                  <Wallet className="w-5 h-5 text-violet-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{summary.walletBalance?.toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">₪</p>
                  <p className="text-white/60 text-sm mt-2">{t("رصيد المحفظة", "Wallet Balance")}</p>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-3xl bg-white/4 border border-amber-500/20">
                <h2 className="text-white font-bold mb-5">{t("بيع الطاقة للبلدية", "Sell Energy to Municipality")}</h2>
                <form onSubmit={handleSell} className="flex items-end gap-4 flex-wrap">
                  <div className="flex-1 min-w-[180px] space-y-1.5">
                    <label className="text-white/60 text-xs">{t("كم kWh تريد بيعها؟", "How many kWh to sell?")}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={summary.availableKwh}
                      value={sellAmount}
                      onChange={e => setSellAmount(e.target.value)}
                      required
                      className="w-full bg-slate-900/60 border border-white/10 text-white h-11 rounded-xl px-3 focus:outline-none focus:border-amber-400 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={selling || !sellAmount}
                    className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-900 font-bold text-sm flex items-center gap-2 transition-all"
                  >
                    {selling && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                    {t("بيع", "Sell")}
                  </button>
                </form>
                {sellAmount && parseFloat(sellAmount) > 0 && (
                  <p className="text-amber-300/80 text-xs mt-3">
                    {t(
                      "ستحصل على: " + (parseFloat(sellAmount) * (summary.ratePerKwh ?? 0.6)).toFixed(3) + " شيكل",
                      "You will earn: " + (parseFloat(sellAmount) * (summary.ratePerKwh ?? 0.6)).toFixed(3) + " NIS"
                    )}
                  </p>
                )}
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="p-4 rounded-2xl bg-white/3 border border-white/8 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-white/35 text-xs leading-5">
                  {t(
                    "هذه محاكاة تعليمية. يتم احتساب إنتاج الطاقة الشمسية بشكل افتراضي داخل التطبيق. معدل الإنتاج: 0.05 kWh في الدقيقة. سعر البيع للبلدية: 0.60 شيكل/kWh.",
                    "This is an educational simulation. Solar energy production is calculated virtually inside the app. Generation rate: 0.05 kWh/minute. Municipality buying rate: 0.60 NIS/kWh."
                  )}
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="py-20 text-center text-white/30">
              {t("تعذر تحميل بيانات الطاقة الشمسية", "Could not load solar data")}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
