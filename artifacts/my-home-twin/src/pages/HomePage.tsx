import { useState } from "react";
import { Header } from "@/components/Header";
import { HouseMap } from "@/components/HouseMap";
import { RoomPanel } from "@/components/RoomPanel";
import { ModeButtons } from "@/components/ModeButtons";
import { BatteryCard } from "@/components/BatteryCard";
import { BillCard } from "@/components/BillCard";
import { AssistantPanel } from "@/components/AssistantPanel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, ChevronDown } from "lucide-react";

export default function HomePage() {
  const { t } = useLanguage();
  const { mode, activityLogs } = useHome();
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const handleRoomClick = (id: number) => setActiveRoomId(prev => prev === id ? null : id);
  const [showAssistant, setShowAssistant] = useState(false);

  const isOutage = mode === "outage";
  const isSaving = mode === "saving";
  const isNight = mode === "night";

  return (
    <div
      className="min-h-screen flex flex-col relative transition-all duration-1000"
      style={{ background: isOutage ? "rgb(5, 8, 18)" : isNight ? "rgb(4, 8, 20)" : "rgb(5, 13, 31)" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[120px] transition-all duration-1000"
          style={{
            background: isOutage
              ? "rgba(245,158,11,0.06)"
              : isSaving
              ? "rgba(16,185,129,0.06)"
              : "rgba(0,229,255,0.06)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        {/* Outage/Mode banner */}
        <AnimatePresence>
          {isOutage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-4 mt-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-wrap gap-4 items-center justify-between"
            >
              <p className="font-bold text-amber-200 text-sm">
                {t("انقطاع كهرباء: البطارية تشغّل الأساسيات فقط", "Power Outage: Battery powering essentials only")}
              </p>
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-300">
                  <span className="font-semibold block">{t("يعمل:", "ON:")}</span>
                  {t("إضاءة، ثلاجة، واي فاي، شحن هاتف", "Lights, fridge, WiFi, charging")}
                </span>
                <span className="text-red-300">
                  <span className="font-semibold block">{t("مطفأ:", "OFF:")}</span>
                  {t("سخان، مكيف، غسالة", "Heater, AC, washer")}
                </span>
              </div>
            </motion.div>
          )}
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-500/12 border border-emerald-500/30"
            >
              <p className="font-semibold text-emerald-300 text-sm">
                {t("وضع التوفير: تم إطفاء الأجهزة الثقيلة تلقائياً", "Saving Mode: Heavy devices turned off automatically")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 px-4 py-4 flex flex-col">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-white mb-0.5">{t("منزلي الرقمي", "My Digital Home")}</h1>
            <p className="text-white/40 text-sm">{t("تحكم ببيتك من الخريطة مباشرة", "Control your home directly from the map")}</p>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Assistant (desktop) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
              <AssistantPanel />
            </div>

            {/* Center: House Map + Modes */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              <div className="flex-1 rounded-3xl bg-white/3 border border-white/8 overflow-hidden" style={{ minHeight: 340 }}>
                <HouseMap
                  activeRoomId={activeRoomId}
                  onRoomClick={handleRoomClick}
                />
              </div>
              <ModeButtons />

              {/* Activity Log */}
              {activityLogs.length > 0 && (
                <div className="rounded-2xl bg-white/3 border border-white/8 p-4">
                  <h3 className="text-xs font-semibold text-white/50 mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {t("آخر التغييرات", "Recent Changes")}
                  </h3>
                  <div className="space-y-1.5">
                    {activityLogs.slice(0, 5).map((log, i) => (
                      <div key={log.id ?? i} className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 mt-1 flex-shrink-0" />
                        <span className="text-white/55 leading-relaxed">{t(log.message_ar, log.message_en)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Battery + Bill */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <BatteryCard />
              <BillCard />
            </div>

            {/* Mobile: Assistant toggle */}
            <div className="lg:hidden col-span-1">
              <button
                onClick={() => setShowAssistant(s => !s)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/4 border border-white/10 text-white/60 text-sm hover:bg-white/8 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {t("مساعد منزلك", "Home Assistant")}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAssistant ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showAssistant && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    <AssistantPanel />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* Room panel */}
      <RoomPanel
        roomId={activeRoomId}
        onClose={() => setActiveRoomId(null)}
      />
    </div>
  );
}
