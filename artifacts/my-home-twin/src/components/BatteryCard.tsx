import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { BatteryCharging, BatteryWarning, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export function BatteryCard() {
  const { t } = useLanguage();
  const { battery, mode } = useHome();
  const [, setLocation] = useLocation();

  const isOutage = mode === "outage";

  if (!battery.hasBattery) {
    return (
      <div className="rounded-2xl p-5 bg-white/3 border border-white/8 flex flex-col items-center justify-center gap-3 h-full min-h-[160px]">
        <BatteryCharging className="w-8 h-8 text-white/20" />
        <p className="text-white/40 text-sm text-center">{t("لا توجد بطارية", "No battery added")}</p>
        <button
          onClick={() => setLocation("/setup")}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("إضافة بطارية", "Add battery")}
        </button>
      </div>
    );
  }

  const fillPercent = isOutage ? 72 : 92;

  return (
    <div className="rounded-2xl p-5 bg-white/3 border border-white/8 relative overflow-hidden h-full">
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-all duration-1000 ${isOutage ? "bg-amber-500/20" : "bg-emerald-500/15"}`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">{t("بطاريتي", "My Battery")}</h3>
            <p className="text-white/40 text-xs">{battery.capacity} kWh</p>
          </div>
          <div className={`p-2 rounded-xl ${isOutage ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
            {isOutage
              ? <BatteryWarning className="w-5 h-5 animate-pulse" />
              : <BatteryCharging className="w-5 h-5" />
            }
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {/* Battery visual */}
          <div className="relative w-10 h-20 rounded-lg border-2 border-slate-600 bg-slate-900/60 p-0.5 flex-shrink-0">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-slate-600 rounded-t-sm" />
            <motion.div
              className={`absolute bottom-0.5 left-0.5 right-0.5 rounded-md ${isOutage ? "bg-gradient-to-t from-amber-600 to-amber-400" : "bg-gradient-to-t from-emerald-600 to-emerald-400"}`}
              initial={{ height: "10%" }}
              animate={{ height: `${fillPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ boxShadow: isOutage ? "0 0 12px rgba(245,158,11,0.5)" : "0 0 12px rgba(16,185,129,0.5)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs z-10">
              {fillPercent}%
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            <div>
              <p className="text-white/40 text-xs">{t("الحالة", "Status")}</p>
              <p className={`font-semibold text-sm ${isOutage ? "text-amber-400" : "text-emerald-400"}`}>
                {isOutage ? t("قيد الاستخدام", "In Use") : t("جاهزة", "Ready")}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">{t("تكفي تقريباً", "Lasts approx.")}</p>
              <p className="text-white font-semibold text-sm">
                {battery.runtimeHours} {t("ساعات", "hours")}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/8 text-xs text-white/35 text-center">
          {t("أفضل استخدام: وقت الانقطاع أو الليل", "Best use: outage or night time")}
        </div>
      </div>
    </div>
  );
}
