import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

export function AssistantPanel() {
  const { t, language } = useLanguage();
  const { bill, battery, devices, mode, setup } = useHome();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ id: 'welcome', role: 'assistant', content: t("اسألني عن فاتورتك، بطاريتك، أو ماذا تشغل وقت الانقطاع.", "Ask me about your bill, battery, or what to run during an outage.") }]);
  }, [language]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const hasType = (type: string) => devices.some(d => d.type === type);
  const essentials = devices.filter(d => d.is_essential).map(d => t(d.name_ar, d.name_en));
  const heavy = devices.filter(d => d.is_heavy).map(d => t(d.name_ar, d.name_en));

  const quickQuestions = [
    { ar: "كم فاتورتي المتوقعة؟", en: "What is my estimated bill?" },
    { ar: "قديش بتقعد البطارية؟", en: "How long does my battery last?" },
    { ar: "شو أشغل وقت الانقطاع؟", en: "What can I run during outage?" },
    { ar: "كيف أدفع الفاتورة؟", en: "How do I pay my bill?" },
    { ar: "كيف أوفر؟", en: "How can I save?" },
  ];

  const getResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("فاتورة") || lower.includes("bill") || lower.includes("مأثر") || lower.includes("affect")) {
      if (!bill) return t("لم يتم حساب الفاتورة بعد. أكمل إعداد المنزل أولاً.", "The bill is not calculated yet. Complete home setup first.");
      return t(
        `فاتورتك المتوقعة تقريباً ${bill.estimatedBill} شيكل. أكثر شيء مؤثر حالياً: ${bill.mainReasonAr}. ${bill.noteAr}`,
        `Your estimated bill is about ${bill.estimatedBill} NIS. Main reason: ${bill.mainReasonEn}. ${bill.noteEn}`
      );
    }
    if (lower.includes("بطارية") || lower.includes("battery")) {
      if (!battery.hasBattery) return t("لا توجد بطارية مسجلة في منزلك حالياً. يمكنك تعديل المنزل وإضافة بطارية لاحقاً.", "No battery is registered for your home yet. You can edit the home and add one later.");
      return t(
        `بطاريتك سعتها ${battery.capacity} kWh وتكفي تقريباً ${battery.runtimeHours} ساعات للأشياء الأساسية مثل الإضاءة والثلاجة والواي فاي.`,
        `Your battery capacity is ${battery.capacity} kWh and lasts about ${battery.runtimeHours} hours for essentials like lights, fridge, and Wi-Fi.`
      );
    }
    if (lower.includes("شمس") || lower.includes("شمسي") || lower.includes("solar")) {
      if (!setup?.has_solar) return t("لا توجد خلايا شمسية مسجلة. يمكنك تعديل إعدادات المنزل لتفعيل ميزة الطاقة الشمسية.", "No solar panels registered. You can edit your home settings to enable solar energy.");
      return t("لديك خلايا شمسية مسجلة. يمكنك زيارة صفحة الطاقة الشمسية لبيع الفائض للبلدية وإضافة الرصيد لمحفظتك.", "You have solar panels registered. Visit the Solar Energy page to sell surplus to the municipality and add funds to your wallet.");
    }
    if (lower.includes("انقطاع") || lower.includes("outage") || lower.includes("كهرباء")) {
      const list = essentials.length ? essentials.slice(0, 5).join("، ") : t("الإضاءة والثلاجة والواي فاي", "lights, fridge, and Wi-Fi");
      return t(
        `وقت الانقطاع شغّل الأساسيات فقط: ${list}. لا يفضل تشغيل الأجهزة الثقيلة مثل ${heavy.length ? heavy.slice(0, 3).join("، ") : "السخان والمكيف"}.`,
        `During outage, run essentials only: ${list}. Avoid heavy devices like ${heavy.length ? heavy.slice(0, 3).join(", ") : "heater and AC"}.`
      );
    }
    if (lower.includes("توفير") || lower.includes("save") || lower.includes("saving") || lower.includes("أوفر")) {
      return t(
        `لتقليل الفاتورة، فعّل وضع التوفير لأنه يطفئ الأجهزة الثقيلة${heavy.length ? ` مثل ${heavy.slice(0, 3).join("، ")}` : ""}. ويمكنك أيضاً إطفاء الأجهزة من خريطة البيت مباشرة.`,
        `To reduce the bill, enable Saving Mode because it turns off heavy devices${heavy.length ? ` like ${heavy.slice(0, 3).join(", ")}` : ""}. You can also turn devices off directly from the home map.`
      );
    }
    if (lower.includes("سخان") || lower.includes("heater")) {
      return hasType("heater") ? t("عندك سخان مسجل، وهو من أكثر الأجهزة تأثيراً على الفاتورة. حاول تشغيله عند الحاجة فقط.", "You have a heater registered, and it can strongly affect the bill. Use it only when needed.") : t("لا يوجد سخان مسجل في أجهزتك حالياً.", "No heater is registered in your devices currently.");
    }
    if (lower.includes("مكيف") || lower.includes("ac")) {
      return hasType("ac") ? t("عندك مكيف مسجل، ولا يفضل تشغيله على البطارية لفترة طويلة لأنه يستهلك الطاقة بسرعة.", "You have an AC registered. It is not recommended on battery for long periods because it drains energy quickly.") : t("لا يوجد مكيف مسجل في أجهزتك حالياً.", "No AC is registered in your devices currently.");
    }
    if (lower.includes("وضع") || lower.includes("mode")) {
      return t(`الوضع الحالي هو: ${mode}. يمكنك تغييره من أزرار الأوضاع أسفل خريطة المنزل.`, `Current mode is: ${mode}. You can change it from the mode buttons below the home map.`);
    }
    if (lower.includes("دفع") || lower.includes("رصيد") || lower.includes("فواتير") || lower.includes("فاتورة حالية") || lower.includes("فواتير سابقة") ||
        lower.includes("pay") || lower.includes("balance") || lower.includes("bills") || lower.includes("current bill") || lower.includes("previous bills")) {
      return t(
        "يمكنك دفع الفاتورة من صفحة الفواتير. أضف رصيداً إلى محفظتك داخل التطبيق ثم اضغط دفع الفاتورة.",
        "You can pay from the Bills page. Add balance to your app wallet, then click Pay Bill."
      );
    }
    return t("أستطيع مساعدتك في الفاتورة، البطارية، الطاقة الشمسية، التوفير، الانقطاع، أو الفواتير والدفع. التحكم بالأجهزة يكون من خريطة البيت فقط.", "I can help with bill, battery, solar energy, saving, outage, or billing questions. Device control is only from the home map.");
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setTimeout(() => {
      const response = getResponse(text);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response }]);
    }, 450);
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 h-[600px] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-slate-900/30">
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400"><Bot className="w-6 h-6" /></div>
        <div><h2 className="text-lg font-bold text-white glow-text">{t("مساعد منزلك", "Home Assistant")}</h2><div className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{t("متصل", "Online")}</div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>{messages.map(msg => <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}</div><div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-tr-none rtl:rounded-tl-none rtl:rounded-tr-2xl' : 'bg-slate-800 text-white/90 rounded-tl-none rtl:rounded-tr-none rtl:rounded-tl-2xl border border-white/5'}`}>{msg.content}</div></motion.div>)}</AnimatePresence><div ref={messagesEndRef} />
      </div>
      <div className="p-3 bg-slate-900/40 border-t border-white/10">
        {messages.length < 3 && <div className="flex flex-wrap gap-2 mb-3">{quickQuestions.map((q, i) => <button key={i} onClick={() => handleSend(t(q.ar, q.en))} className="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-100 px-3 py-1.5 rounded-full border border-cyan-500/20">{t(q.ar, q.en)}</button>)}</div>}
        <div className="relative"><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(input)} placeholder={t("اكتب سؤالك هنا...", "Type your question here...")} className="w-full bg-slate-950/50 border border-white/10 rounded-full px-4 py-3 pr-12 rtl:pl-12 rtl:pr-4 text-white text-sm focus:outline-none focus:border-cyan-500/50" /><button onClick={() => handleSend(input)} className="absolute right-2 rtl:left-2 rtl:right-auto top-1.5 bottom-1.5 w-10 flex items-center justify-center rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900"><Send className="w-4 h-4 rtl:-scale-x-100" /></button></div>
      </div>
    </div>
  );
}
