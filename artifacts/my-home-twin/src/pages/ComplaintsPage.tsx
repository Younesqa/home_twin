import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { api, type Complaint } from "@/lib/api";
import { MessageSquare, Send, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ComplaintsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getMyComplaints();
      setComplaints(data.complaints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      await api.submitComplaint(title.trim(), message.trim());
      setTitle("");
      setMessage("");
      await load();
      toast({ title: t("تم إرسال الشكوى للمشرف", "Complaint sent to admin") });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : t("تعذر إرسال الشكوى", "Could not submit complaint"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (status: string) => status === "replied" ? t("تم الرد", "Replied") : status === "closed" ? t("مغلقة", "Closed") : t("قيد المراجعة", "Under review");

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="max-w-5xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-cyan-400" />{t("الشكاوى", "Complaints")}</h1>
            <p className="text-white/45 text-sm">{t("أرسل شكوى للمشرف وتابع حالة الرد عليها.", "Send a complaint to the admin and track the reply status.")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={submit} className="p-6 rounded-3xl bg-white/4 border border-white/10 space-y-4 h-fit">
              <h2 className="font-bold text-white text-lg">{t("تقديم شكوى", "Submit Complaint")}</h2>
              <div className="space-y-2"><label className="text-white/60 text-sm">{t("عنوان الشكوى", "Complaint title")}</label><input value={title} onChange={e => setTitle(e.target.value)} className="w-full h-11 rounded-xl bg-slate-950/60 border border-white/10 px-3 text-white focus:outline-none focus:border-cyan-400" placeholder={t("مثال: مشكلة في البطارية", "Example: Battery issue")} /></div>
              <div className="space-y-2"><label className="text-white/60 text-sm">{t("تفاصيل الشكوى", "Complaint details")}</label><textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full min-h-36 rounded-xl bg-slate-950/60 border border-white/10 px-3 py-3 text-white focus:outline-none focus:border-cyan-400" placeholder={t("اكتب تفاصيل المشكلة هنا...", "Write the issue details here...")} /></div>
              <button disabled={submitting || !title.trim() || !message.trim()} className="w-full h-11 rounded-xl bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold flex items-center justify-center gap-2"><Send className="w-4 h-4" />{submitting ? t("جاري الإرسال...", "Sending...") : t("إرسال الشكوى", "Send Complaint")}</button>
            </form>

            <section className="space-y-3">
              <h2 className="font-bold text-white text-lg">{t("شكاواي", "My Complaints")}</h2>
              {loading ? <div className="py-10 text-center text-white/40">{t("جاري التحميل...", "Loading...")}</div> : complaints.length === 0 ? <div className="p-8 rounded-3xl bg-white/4 border border-white/10 text-center text-white/35">{t("لا توجد شكاوى بعد", "No complaints yet")}</div> : complaints.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-white/4 border border-white/10">
                  <div className="flex items-start justify-between gap-3 mb-2"><h3 className="text-white font-semibold">{c.title}</h3><span className={`text-xs px-2 py-1 rounded-full border flex items-center gap-1 ${c.status === "replied" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" : "text-amber-300 bg-amber-500/10 border-amber-500/25"}`}>{c.status === "replied" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{statusLabel(c.status)}</span></div>
                  <p className="text-white/60 text-sm leading-6">{c.message}</p>
                  {c.reply && <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><p className="text-emerald-300 text-xs font-bold mb-1">{t("رد المشرف", "Admin Reply")}</p><p className="text-white/80 text-sm leading-6">{c.reply}</p></div>}
                </div>
              ))}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
