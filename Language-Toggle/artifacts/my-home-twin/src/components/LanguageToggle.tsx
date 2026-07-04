import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center rounded-full bg-slate-900/50 border border-white/10 p-1 backdrop-blur-sm relative" data-testid="button-language-toggle">
      <button
        onClick={() => setLanguage("ar")}
        className={`relative z-10 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
          language === "ar" ? "text-cyan-400" : "text-white/60 hover:text-white"
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`relative z-10 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
          language === "en" ? "text-cyan-400" : "text-white/60 hover:text-white"
        }`}
      >
        English
      </button>

      {/* Animated pill background */}
      <motion.div
        className="absolute top-1 bottom-1 w-[80px] bg-cyan-500/20 border border-cyan-500/50 rounded-full z-0"
        layoutId="active-language"
        initial={false}
        animate={{
          x: language === "ar" ? 0 : "100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          boxShadow: "0 0 10px rgba(0, 229, 255, 0.3)",
        }}
      />
    </div>
  );
}
