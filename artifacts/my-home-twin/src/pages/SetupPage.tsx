import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Wind, Archive, RefreshCw, Tv, Sun, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type HomeTypeValue = "apartment" | "house";
type FamilySizeValue = "small" | "medium" | "large";
type BillLevelValue = "low" | "medium" | "high";

export default function SetupPage() {
  const { t, isRtl } = useLanguage();
  const { setup, devices, refreshHome } = useHome();
  const [, setLocation] = useLocation();

  const isEdit = Boolean(setup);
  const [step, setStep] = useState(1);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState(0);
  const [error, setError] = useState("");

  const [homeType, setHomeType] = useState<HomeTypeValue | "">("");
  const [totalRooms, setTotalRooms] = useState<number | null>(null);
  const [family, setFamily] = useState<FamilySizeValue | "">("");
  const [appliances, setAppliances] = useState<string[]>([]);
  const [hasBattery, setHasBattery] = useState<boolean | null>(null);
  const [batteryCapacity, setBatteryCapacity] = useState<number | null>(null);
  const [customCapacity, setCustomCapacity] = useState("");
  const [billLevel, setBillLevel] = useState<BillLevelValue | "">("");
  const [hasSolar, setHasSolar] = useState<boolean>(false);

  useEffect(() => {
    if (!setup) return;
    setHomeType((setup.home_type === "house" ? "house" : "apartment") as HomeTypeValue);
    setTotalRooms(Number(setup.room_count || 5));
    setFamily((setup.family_size === "small" || setup.family_size === "large" ? setup.family_size : "medium") as FamilySizeValue);
    setBillLevel((setup.bill_level === "low" || setup.bill_level === "high" ? setup.bill_level : "medium") as BillLevelValue);
    setHasBattery(Boolean(setup.has_battery));
    setBatteryCapacity(setup.battery_capacity ?? null);
    setHasSolar(Boolean(setup.has_solar));
    const existingTypes = Array.from(new Set(devices.map(d => d.type))).filter(type => ["heater", "ac", "fridge", "washingMachine", "tv", "outdoorLight"].includes(type));
    setAppliances(existingTypes);
  }, [setup, devices]);

  const toggleAppliance = (app: string) => setAppliances(prev => prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]);

  const canGoNext = () => {
    if (step === 1) return !!homeType;
    if (step === 2) return totalRooms !== null;
    if (step === 3) return !!family;
    if (step === 4) return true;
    if (step === 5) {
      if (hasBattery === null) return false;
      if (hasBattery === false) return true;
      if (batteryCapacity !== null) return true;
      const custom = parseFloat(customCapacity);
      return !isNaN(custom) && custom > 0;
    }
    if (step === 6) return !!billLevel;
    if (step === 7) return true;
    return false;
  };

  const handleComplete = async (confirmedRemove = false) => {
    setError("");
    const capacity = batteryCapacity ?? (customCapacity ? parseFloat(customCapacity) : null);
    if (setup && totalRooms !== null && totalRooms < Number(setup.room_count || 0) && !confirmedRemove) {
      const ok = window.confirm(t(
        "تقليل عدد الغرف سيحذف الغرف الزائدة وأجهزتها. هل تريد المتابعة؟",
        "Reducing rooms will delete extra rooms and their devices. Continue?"
      ));
      if (!ok) return;
      confirmedRemove = true;
    }

    setIsBuilding(true);
    [700, 1400, 2100, 2800].forEach((delay, i) => setTimeout(() => setBuildStep(i + 1), delay));
    try {
      await api.setupHome({
        homeType: homeType || "apartment",
        roomCount: totalRooms ?? 5,
        familySize: family || "medium",
        billLevel: billLevel || "medium",
        hasBattery: hasBattery ?? false,
        batteryCapacity: (hasBattery && capacity) ? capacity : null,
        selectedDevices: appliances,
        confirmRemoveRooms: confirmedRemove,
        hasSolar,
      });
      await refreshHome();
      setTimeout(() => setLocation("/home"), 3300);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("حدث خطأ، حاول مجدداً", "An error occurred, please try again");
      if (message.includes("تقليل عدد الغرف") || message.includes("Reducing rooms")) {
        const ok = window.confirm(message);
        if (ok) {
          setIsBuilding(false);
          setBuildStep(0);
          await handleComplete(true);
          return;
        }
      }
      setError(message);
      setIsBuilding(false);
      setBuildStep(0);
    }
  };

  const buildStepsText = isEdit ? [
    { ar: "جاري حفظ التعديلات...", en: "Saving changes..." },
    { ar: "ترتيب الغرف...", en: "Organizing rooms..." },
    { ar: "تحديث الأجهزة...", en: "Updating devices..." },
    { ar: "تحديث البطارية والفاتورة...", en: "Updating battery and bill..." },
    { ar: "تم حفظ التعديلات!", en: "Changes saved!" },
  ] : [
    { ar: "جاري بناء منزلك...", en: "Building your home..." },
    { ar: "إضافة الغرف...", en: "Adding rooms..." },
    { ar: "إضافة الأجهزة...", en: "Adding appliances..." },
    { ar: "إضافة البطارية...", en: "Adding battery..." },
    { ar: "تم إنشاء منزلك الرقمي!", en: "Your digital home is ready!" },
  ];

  if (isBuilding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
        <div className="relative z-10 text-center">
          <motion.div className="w-28 h-28 mx-auto mb-10" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,229,255,0.5)]">
              <path d="M20,90 L20,50 L60,15 L100,50 L100,90 Z" fill="rgba(10,22,55,0.9)" stroke="#00e5ff" strokeWidth="2" />
              <path d="M15,52 L60,12 L105,52" fill="none" stroke="#00e5ff" strokeWidth="2.5" />
            </svg>
          </motion.div>
          <div className="space-y-4">
            {buildStepsText.map((s, i) => (
              <motion.div key={i} animate={{ opacity: buildStep >= i ? 1 : 0.25 }} className={`flex items-center justify-center gap-3 text-base font-medium ${buildStep >= i ? "text-cyan-300" : "text-white/20"}`}>
                {buildStep > i ? <Check className="w-5 h-5 text-emerald-400" /> : <span className="w-4 h-4 rounded-full border border-cyan-400/50" />}
                {t(s.ar, s.en)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const optionClass = (selected: boolean) => `w-full p-4 rounded-2xl border text-center font-semibold cursor-pointer transition-all duration-200 ${selected ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.2)]" : "bg-white/4 border-white/10 text-white/80 hover:bg-white/8 hover:border-white/20"}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-white mb-2">{isEdit ? t("تعديل بيانات المنزل", "Edit Home Details") : t("خلينا نبني منزلك", "Let's build your home")}</h1>
          <p className="text-white/45 text-sm">{t("أجب على الأسئلة بسرعة، ويمكنك تعديل الأجهزة لاحقاً من الخريطة.", "Answer quickly, and you can edit devices later from the map.")}</p>
        </div>
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm"><span className="text-white/50">{t("الخطوة " + step + " من 7", "Step " + step + " of 7")}</span><span className="text-cyan-400">{Math.round((step/7)*100)}%</span></div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden"><motion.div className="h-full bg-cyan-400" animate={{ width: `${(step/7)*100}%` }} /></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: isRtl ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRtl ? 20 : -20 }} className="rounded-3xl p-8 bg-white/4 border border-white/10 backdrop-blur-sm">
            {step === 1 && <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{t("ما نوع منزلك؟", "What type of home?")}</h2>
              {[{ value: "apartment", ar: "شقة", en: "Apartment" }, { value: "house", ar: "دار", en: "House" }].map(opt => <button key={opt.value} onClick={() => setHomeType(opt.value as HomeTypeValue)} className={optionClass(homeType === opt.value)}>{t(opt.ar, opt.en)}</button>)}
            </div>}

            {step === 2 && <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{t("كم غرفة عندك؟", "How many rooms do you have?")}</h2>
              <p className="text-amber-300/90 text-sm leading-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">{t("ملاحظة: اكتب عدد الغرف كاملًا شامل الصالون والمطبخ والحمام. النظام يفرض وجود صالون + مطبخ + حمام، والباقي غرف نوم.", "Note: choose the full room count including living room, kitchen, and bathroom. The system assumes living room + kitchen + bathroom, and the rest are bedrooms.")}</p>
              <div className="grid grid-cols-3 gap-3">{[4,5,6,7,8].map(n => <button key={n} onClick={() => setTotalRooms(n)} className={optionClass(totalRooms === n)}>{n}</button>)}</div>
            </div>}

            {step === 3 && <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{t("كم عدد أفراد العائلة؟", "How many family members?")}</h2>
              {[{ value:"small", ar:"1–2 أفراد", en:"1–2 members" }, { value:"medium", ar:"3–4 أفراد", en:"3–4 members" }, { value:"large", ar:"5 أفراد فأكثر", en:"5+ members" }].map(opt => <button key={opt.value} onClick={() => setFamily(opt.value as FamilySizeValue)} className={optionClass(family === opt.value)}>{t(opt.ar, opt.en)}</button>)}
            </div>}

            {step === 4 && <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{t("اختر الأجهزة في بيتك", "Select appliances")}</h2>
              <p className="text-white/40 text-sm">{t("هذه اقتراحات أولية، وبعدها تستطيع إضافة وحذف الأجهزة لكل غرفة.", "These are initial suggestions; later you can add/delete devices in each room.")}</p>
              <div className="grid grid-cols-2 gap-3">{[
                { id:"heater", ar:"سخان", en:"Heater", Icon:Flame }, { id:"ac", ar:"مكيف", en:"AC", Icon:Wind }, { id:"fridge", ar:"ثلاجة", en:"Fridge", Icon:Archive }, { id:"washingMachine", ar:"غسالة", en:"Washer", Icon:RefreshCw }, { id:"tv", ar:"تلفزيون", en:"TV", Icon:Tv }, { id:"outdoorLight", ar:"إنارة خارجية", en:"Outdoor Light", Icon:Sun }
              ].map(app => { const selected=appliances.includes(app.id); return <button key={app.id} onClick={() => toggleAppliance(app.id)} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${selected ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-white/4 border-white/10 text-white/70 hover:bg-white/8"}`}><app.Icon className="w-5 h-5"/><span className="text-sm font-medium">{t(app.ar, app.en)}</span>{selected && <Check className="w-4 h-4"/>}</button> })}</div>
            </div>}

            {step === 5 && <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">{t("هل لديك بطارية تخزين؟", "Do you have a storage battery?")}</h2>
              <div className="grid grid-cols-2 gap-4"><button onClick={() => setHasBattery(true)} className={optionClass(hasBattery === true)}>{t("نعم", "Yes")}</button><button onClick={() => {setHasBattery(false); setBatteryCapacity(null); setCustomCapacity("");}} className={optionClass(hasBattery === false)}>{t("لا", "No")}</button></div>
              {hasBattery && <div className="space-y-3 pt-2"><p className="text-white/70 text-sm">{t("ما سعة البطارية؟", "Battery capacity?")}</p><div className="grid grid-cols-3 gap-3">{[2,5,10].map(cap => <button key={cap} onClick={() => {setBatteryCapacity(cap); setCustomCapacity("");}} className={optionClass(batteryCapacity === cap)}>{cap} kWh</button>)}</div><input type="number" min="1" step="0.5" placeholder={t("سعة مخصصة (kWh)", "Custom capacity (kWh)")} value={batteryCapacity !== null ? "" : customCapacity} onChange={e => {setCustomCapacity(e.target.value); setBatteryCapacity(null);}} className="w-full bg-slate-900/60 border border-white/10 text-white h-11 rounded-xl px-3 focus:outline-none focus:border-cyan-400 text-sm" /></div>}
            </div>}

            {step === 6 && <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">{t("كيف تصف فاتورتك الشهرية؟", "How would you describe your monthly bill?")}</h2>
              {[{ value:"low", ar:"منخفضة", en:"Low", hint:"~120 ₪" }, { value:"medium", ar:"متوسطة", en:"Medium", hint:"~250 ₪" }, { value:"high", ar:"مرتفعة", en:"High", hint:"~420 ₪" }].map(opt => <button key={opt.value} onClick={() => setBillLevel(opt.value as BillLevelValue)} className={`w-full p-4 rounded-2xl border flex items-center justify-between ${billLevel === opt.value ? "bg-cyan-500/20 border-cyan-400 text-cyan-300" : "bg-white/4 border-white/10 text-white/80 hover:bg-white/8"}`}><span className="font-semibold">{t(opt.ar, opt.en)}</span><span className="text-sm opacity-60">{opt.hint}</span></button>)}
              {error && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>}
            </div>}

            {step === 7 && <div className="space-y-5">
              <h2 className="text-xl font-bold text-white">{t("هل لديك خلايا شمسية؟", "Do you have solar panels?")}</h2>
              <p className="text-white/40 text-sm">{t("إذا كانت إجابتك بنعم، ستتمكن من بيع الطاقة الفائضة للبلدية.", "If yes, you will be able to sell surplus energy to the municipality.")}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setHasSolar(true)} className={optionClass(hasSolar === true)}>{t("نعم", "Yes")}</button>
                <button onClick={() => setHasSolar(false)} className={optionClass(hasSolar === false)}>{t("لا", "No")}</button>
              </div>
              {error && <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center">{error}</div>}
            </div>}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : setLocation(isEdit ? "/home" : "/")} className="flex items-center gap-2 px-5 h-11 rounded-xl border border-white/10 text-white/60 hover:bg-white/6">
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}{t("رجوع", "Back")}
          </button>
          {step < 7 ? <button disabled={!canGoNext()} onClick={() => setStep(step + 1)} className="flex items-center gap-2 px-6 h-11 rounded-xl bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold">{t("التالي", "Next")}{isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</button> : <button disabled={!canGoNext()} onClick={() => handleComplete(false)} className="px-6 h-11 rounded-xl bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold">{isEdit ? t("حفظ التعديلات", "Save Changes") : t("ابنِ منزلي الرقمي", "Build My Digital Home")}</button>}
        </div>
      </div>
    </div>
  );
}
