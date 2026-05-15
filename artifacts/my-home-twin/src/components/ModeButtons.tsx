import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { api, type ApiDevice } from "@/lib/api";
import { Zap, Leaf, Moon, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const MODES = [
  {
    id: "normal" as const,
    icon: Zap,
    ar: "الوضع العادي",
    en: "Normal Mode",
    descAr: "يرجع البيت للوضع الطبيعي",
    descEn: "Restores normal home mode",
    toastAr: "الوضع العادي نشط. يمكنك التحكم بالأجهزة من الغرف.",
    toastEn: "Normal mode is active. Control devices from the rooms.",
    color: "cyan",
    ring: "rgba(0,229,255,0.35)",
    activeBg: "bg-cyan-950/60",
    activeBorder: "border-cyan-400/70",
    activeText: "text-cyan-300",
    activeDesc: "text-cyan-400/70",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15",
  },
  {
    id: "saving" as const,
    icon: Leaf,
    ar: "وضع التوفير",
    en: "Saving Mode",
    descAr: "يطفي المكيف والسخان والغسالة",
    descEn: "Turns off AC, heater, and washer",
    toastAr: "وضع التوفير: تم إطفاء المكيف والسخان والغسالة",
    toastEn: "Saving mode: AC, heater and washer turned off",
    color: "emerald",
    ring: "rgba(16,185,129,0.35)",
    activeBg: "bg-emerald-950/60",
    activeBorder: "border-emerald-400/70",
    activeText: "text-emerald-300",
    activeDesc: "text-emerald-400/70",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15",
  },
  {
    id: "night" as const,
    icon: Moon,
    ar: "وضع الليل",
    en: "Night Mode",
    descAr: "يشغل إضاءة أساسية ويطفي غير الضروري",
    descEn: "Turns on basic lights, turns off unnecessary devices",
    toastAr: "وضع الليل: تم تشغيل الإضاءة الأساسية",
    toastEn: "Night mode: basic lights are on",
    color: "blue",
    ring: "rgba(59,130,246,0.35)",
    activeBg: "bg-blue-950/60",
    activeBorder: "border-blue-400/70",
    activeText: "text-blue-300",
    activeDesc: "text-blue-400/70",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15",
  },
  {
    id: "outage" as const,
    icon: AlertTriangle,
    ar: "انقطاع الكهرباء",
    en: "Power Outage",
    descAr: "يشغل الأساسيات على البطارية فقط",
    descEn: "Runs essentials on battery only",
    toastAr: "انقطاع كهرباء: البطارية تشغّل الأساسيات فقط",
    toastEn: "Outage: battery powering essentials only",
    color: "amber",
    ring: "rgba(245,158,11,0.35)",
    activeBg: "bg-amber-950/60",
    activeBorder: "border-amber-400/70",
    activeText: "text-amber-300",
    activeDesc: "text-amber-400/70",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15",
  },
];

export function ModeButtons() {
  const { t } = useLanguage();
  const { mode, setMode, setDevices, refreshHome } = useHome();
  const { toast } = useToast();

  const handleMode = async (m: typeof MODES[number]) => {
    if (mode === m.id) return;
    try {
      const result = await api.setMode(m.id);
      setMode(m.id);
      if (result.devices) setDevices(result.devices as ApiDevice[]);
      // Refresh full home to get updated bill/logs
      await refreshHome();
      toast({ title: t(m.toastAr, m.toastEn), duration: 3500 });
    } catch {
      toast({ title: t("حدث خطأ", "Error occurred"), variant: "destructive", duration: 2000 });
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-2 py-3">
      {MODES.map((m) => {
        const isActive = mode === m.id;
        const Icon = m.icon;
        return (
          <motion.button
            key={m.id}
            data-testid={`button-mode-${m.id}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleMode(m)}
            className={`flex flex-col items-start gap-2 p-4 rounded-2xl border text-start transition-all duration-300 ${
              isActive
                ? `${m.activeBg} ${m.activeBorder} shadow-lg`
                : "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
            }`}
            style={isActive ? { boxShadow: `0 0 22px ${m.ring}` } : {}}
          >
            {/* Icon + status dot */}
            <div className="flex items-center justify-between w-full">
              <div className={`p-2 rounded-xl ${isActive ? m.iconBg : "bg-white/6"}`}>
                <Icon className={`w-4 h-4 ${isActive ? m.iconColor : "text-white/50"} ${isActive ? "animate-pulse" : ""}`} />
              </div>
              {isActive && (
                <div className={`w-2 h-2 rounded-full ${
                  m.id === "normal" ? "bg-cyan-400" :
                  m.id === "saving" ? "bg-emerald-400" :
                  m.id === "night" ? "bg-blue-400" : "bg-amber-400"
                } animate-pulse`} />
              )}
            </div>

            {/* Title */}
            <p className={`text-sm font-bold leading-tight ${isActive ? m.activeText : "text-white/70"}`}>
              {t(m.ar, m.en)}
            </p>

            {/* Description */}
            <p className={`text-xs leading-snug ${isActive ? m.activeDesc : "text-white/30"}`}>
              {t(m.descAr, m.descEn)}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
