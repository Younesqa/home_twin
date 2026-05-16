import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { useToast } from "@/hooks/use-toast";
import { api, type SolarSummary } from "@/lib/api";
import { motion } from "framer-motion";
import { Sun, TrendingUp, Wallet, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function SolarPage() {
  const { t } = useLanguage();
  const { setup } = useHome();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [summary, setSummary] = useState<SolarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sellAmount, setSellAmount] = useState("");
  const [selling, setSelling] = useState(false);
  const [lastSale, setLastSale] = useState<{ kwh: number; earned: number } | null>(null);

  const hasSolar = setup?.has_solar === 1;

  const loadSummary = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.getSolarSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load solar summary", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSummary();
    const interval = setInterval(() => { void loadSummary(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const availableKwh = summary?.availableKwh ?? 0;
  const sellAmountNum = parseFloat(sellAmount);
  const sellDisabled =
    selling ||
    !sellAmount ||
    isNaN(sellAmountNum) ||
    sellAmountNum <= 0 ||
    sellAmountNum > availableKwh;

  const handleFillAll = () => {
    if (availableKwh > 0) {
      setSellAmount(availableKwh.toFixed(2));
    }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sellDisabled) return;
    setSelling(true);
    setLastSale(null);
    try {
      const data = await api.sellSolarEnergy(sellAmountNum);
      const earned = Math.round(sellAmountNum * (summary?.ratePerKwh ?? 0.6) * 100) / 100;
      setLastSale({ kwh: Math.round(sellAmountNum * 100) / 100, earned });
      setSummary(data);
      setSellAmount("");
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
          <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{t("الطاقة الشمسية", "Solar Energy")}</h1>
              <p className="text-white/40 text-sm">{t("بيع الطاقة الشمسية الفائضة للبلدية", "Sell surplus solar energy to the municipality")}</p>
            </div>
            {hasSolar && !loading && (
              <button
                onClick={() => loadSummary(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 h-9 rounded-xl border border-white/15 text-white/60 hover:bg-white/5 hover:text-white/80 transition-all text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {t("تحديث الإنتاج", "Refresh Production")}
              </button>
            )}
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
                  "هذه الصفحة متاحة فقط للمستخدمين الذين لديهم خلايا شمسية.",
                  "This page is only available for users who have solar panels."
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
              {/* 3 info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="p-5 rounded-3xl bg-white/4 border border-amber-500/20">
                  <Sun className="w-5 h-5 text-amber-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{(summary.availableKwh ?? 0).toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">kWh</p>
                  <p className="text-white/60 text-sm mt-2">{t("الطاقة الشمسية المتاحة", "Available Solar Energy")}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-3xl bg-white/4 border border-white/10">
                  <TrendingUp className="w-5 h-5 text-cyan-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{(summary.ratePerKwh ?? 0.6).toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">{t("شيكل / kWh", "NIS / kWh")}</p>
                  <p className="text-white/60 text-sm mt-2">{t("سعر البيع للبلدية", "Municipality Buying Rate")}</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-3xl bg-white/4 border border-white/10">
                  <Wallet className="w-5 h-5 text-violet-400 mb-3" />
                  <p className="text-2xl font-bold text-white">{(summary.walletBalance ?? 0).toFixed(2)}</p>
                  <p className="text-white/40 text-xs mt-1">₪</p>
                  <p className="text-white/60 text-sm mt-2">{t("رصيد المحفظة", "Wallet Balance")}</p>
                </motion.div>
              </div>

              {/* Sell form */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-6 rounded-3xl bg-white/4 border border-amber-500/20">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="text-white font-bold">{t("بيع الطاقة للبلدية", "Sell Energy to Municipality")}</h2>
                  {availableKwh > 0 && (
                    <button
                      type="button"
                      onClick={handleFillAll}
                      className="px-3 h-8 rounded-xl border border-amber-500/30 text-amber-300/80 hover:bg-amber-500/10 text-xs font-medium transition-all"
                    >
                      {t("بيع كل الطاقة المتاحة", "Sell All Available Energy")}
                    </button>
                  )}
                </div>

                {lastSale && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm"
                  >
                    {t(
                      `تم بيع ${lastSale.kwh.toFixed(2)} kWh وإضافة ${lastSale.earned.toFixed(2)} شيكل إلى رصيدك`,
                      `Sold ${lastSale.kwh.toFixed(2)} kWh and added ${lastSale.earned.toFixed(2)} NIS to your wallet`
                    )}
                  </motion.div>
                )}

                {availableKwh <= 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-white/40 text-sm leading-6">
                      {t(
                        "لا توجد طاقة متاحة للبيع حالياً. اضغط تحديث الإنتاج لاحقاً.",
                        "No solar energy is available to sell right now. Refresh production later."
                      )}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSell} className="flex items-end gap-4 flex-wrap">
                    <div className="flex-1 min-w-[180px] space-y-1.5">
                      <label className="text-white/60 text-xs">{t("كمية الطاقة (kWh)", "Energy Amount (kWh)")}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={sellAmount}
                        onChange={e => { setSellAmount(e.target.value); setLastSale(null); }}
                        className="w-full bg-slate-900/60 border border-white/10 text-white h-11 rounded-xl px-3 focus:outline-none focus:border-amber-400 text-sm"
                        placeholder={t("أدخل كمية الطاقة بالكيلو واط ساعة", "Enter energy amount in kWh")}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={sellDisabled}
                      className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-sm flex items-center gap-2 transition-all"
                    >
                      {selling && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                      {t("بيع", "Sell")}
                    </button>
                  </form>
                )}
              </motion.div>

              {/* Explanation */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="p-4 rounded-2xl bg-white/3 border border-white/8 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-white/35 text-xs leading-5">
                  {t(
                    "هذه محاكاة تعليمية. يتم احتساب إنتاج الطاقة الشمسية افتراضياً داخل التطبيق، ويمكن بيع الطاقة المتاحة للبلدية وإضافة قيمتها إلى رصيدك.",
                    "This is an educational simulation. Solar production is calculated virtually inside the app, and available energy can be sold to the municipality and added to your wallet balance."
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
