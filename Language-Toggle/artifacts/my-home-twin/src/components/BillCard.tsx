import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { Receipt, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function BillCard() {
  const { t } = useLanguage();
  const { bill, devices } = useHome();
  const [showDetails, setShowDetails] = useState(false);

  if (!bill) return null;

  const isHigh = bill.estimatedBill > 300;
  const deviceTypes = devices.map(d => d.type);
  const hasHeater = deviceTypes.includes("heater");
  const hasAc = deviceTypes.includes("ac");
  const hasWasher = deviceTypes.includes("washingMachine");

  return (
    <div className="rounded-2xl p-5 bg-white/3 border border-white/8 relative overflow-hidden h-full flex flex-col">
      <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl transition-all duration-700 ${isHigh ? "bg-red-500/15" : "bg-cyan-500/12"}`} />

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">{t("فاتورتي", "My Bill")}</h3>
            <p className="text-white/40 text-xs">{t("هذا الشهر", "This month")}</p>
          </div>
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white mb-1">
            {bill.estimatedBill}
            <span className="text-sm text-white/50 font-normal mr-1">{t("₪", "NIS")}</span>
          </div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isHigh ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
            {isHigh ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isHigh ? t("أعلى من المعدل", "Above average") : t("ضمن المعدل", "Within range")}
          </div>
        </div>

        <div className="bg-slate-900/40 rounded-xl p-3 mb-3 border border-white/5">
          <p className="text-white/40 text-xs mb-1">{t("أكثر شيء مؤثر", "Biggest impact")}</p>
          <p className="text-white text-sm font-medium">{t(bill.mainReasonAr, bill.mainReasonEn)}</p>
        </div>

        <div className="bg-cyan-500/8 rounded-xl p-3 mb-3 border border-cyan-500/15">
          <p className="text-cyan-300/60 text-xs mb-0.5">{t("نصيحة اليوم", "Today's Tip")}</p>
          <p className="text-cyan-200 text-xs leading-relaxed">{t(bill.tipAr, bill.tipEn)}</p>
        </div>

        <button
          onClick={() => setShowDetails(s => !s)}
          className="flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors py-1"
        >
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showDetails ? t("إخفاء التفاصيل", "Hide details") : t("عرض تفاصيل مبسطة", "View simple details")}
        </button>

        {showDetails && (
          <div className="mt-2 space-y-1.5 text-xs">
            {hasHeater && (
              <div className="flex justify-between px-2 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15">
                <span className="text-red-300">{t("السخان", "Heater")}</span>
                <span className="text-red-400 font-medium">+30 ₪</span>
              </div>
            )}
            {hasAc && (
              <div className="flex justify-between px-2 py-1.5 rounded-lg bg-red-500/8 border border-red-500/15">
                <span className="text-red-300">{t("المكيف", "AC")}</span>
                <span className="text-red-400 font-medium">+45 ₪</span>
              </div>
            )}
            {hasWasher && (
              <div className="flex justify-between px-2 py-1.5 rounded-lg bg-amber-500/8 border border-amber-500/15">
                <span className="text-amber-300">{t("الغسالة", "Washer")}</span>
                <span className="text-amber-400 font-medium">+20 ₪</span>
              </div>
            )}
            <div className="flex justify-between px-2 py-1.5 rounded-lg bg-white/4 border border-white/8">
              <span className="text-white/50">{t("الإضاءة", "Lighting")}</span>
              <span className="text-white/40 font-medium">{t("منخفض", "Low")}</span>
            </div>
            <p className="text-white/25 text-center italic pt-1">{t(bill.noteAr, bill.noteEn)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
