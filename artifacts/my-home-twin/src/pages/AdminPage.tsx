import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { api, type ApiUser, type AdminUserDetail, type Complaint, type AdminInvoiceRow } from "@/lib/api";
import { Shield, Users, MapPin, ChevronRight, X, Home, Battery, Zap, LogOut, RefreshCw, MessageSquare, Send, Wallet } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useToast } from "@/hooks/use-toast";

type AdminTab = "citizens" | "complaints" | "billing";

export default function AdminPage() {
  const { t } = useLanguage();
  const { user, logout } = useHome();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [tab, setTab] = useState<AdminTab>("citizens");
  const [stats, setStats] = useState<{ totalCitizens: number; byArea: { area: string; count: number }[] } | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [reply, setReply] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMain, setLoadingMain] = useState(true);
  const [adminInvoices, setAdminInvoices] = useState<AdminInvoiceRow[]>([]);

  const loadAdmin = async () => {
    setLoadingMain(true);
    try {
      const [s, u, c, b] = await Promise.all([
        api.adminStats(), api.adminUsers(), api.adminComplaints(), api.adminBilling()
      ]);
      setStats(s);
      setUsers(u.users);
      setComplaints(c.complaints);
      setAdminInvoices(b.invoices);
    } finally {
      setLoadingMain(false);
    }
  };

  useEffect(() => { void loadAdmin(); }, []);

  const viewUser = async (id: number) => {
    setLoadingDetail(true);
    try { setSelectedUser(await api.adminUserDetail(id)); } finally { setLoadingDetail(false); }
  };

  const handleReply = async () => {
    if (!selectedComplaint || !reply.trim()) return;
    try {
      await api.adminReplyComplaint(selectedComplaint.id, reply.trim());
      setReply("");
      setSelectedComplaint(null);
      await loadAdmin();
      toast({ title: t("تم إرسال الرد للمستخدم", "Reply sent to user") });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : t("تعذر إرسال الرد", "Could not send reply"), variant: "destructive" });
    }
  };

  const handleLogout = () => { logout(); setLocation("/"); };
  const modeLabel = (mode: string) => ({ normal: t("عادي", "Normal"), saving: t("توفير", "Saving"), night: t("ليل", "Night"), outage: t("انقطاع", "Outage") }[mode] || mode);
  const statusLabel = (status: string) => status === "replied" ? t("تم الرد", "Replied") : status === "closed" ? t("مغلقة", "Closed") : t("قيد المراجعة", "Under review");

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a0e20] to-[#0d1535]" />
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"><Shield className="w-5 h-5 text-violet-400" /></div><div><p className="text-white font-bold text-sm">{t("لوحة المشرف", "Admin Dashboard")}</p><p className="text-white/40 text-xs">{t(`مرحباً ${user?.name}`, `Welcome ${user?.name}`)}</p></div></div>
        <div className="flex items-center gap-3"><LanguageToggle /><button onClick={handleLogout} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-sm px-3 py-2 rounded-xl hover:bg-white/6"><LogOut className="w-4 h-4" />{t("خروج", "Logout")}</button></div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6"><h1 className="text-2xl font-bold text-white mb-1">{t("لوحة مشرف منصة الخليل", "Hebron Platform Admin")}</h1><p className="text-white/40 text-sm">{t("عرض بيانات المواطنين والشكاوى والرد عليها", "View citizen data, complaints, and replies")}</p></div>
        <div className="flex gap-2 mb-8 flex-wrap">
          <button onClick={() => setTab("citizens")} className={`px-4 h-10 rounded-xl border text-sm font-semibold ${tab === "citizens" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/25" : "bg-white/4 text-white/45 border-white/10"}`}><Users className="w-4 h-4 inline mx-1" />{t("المواطنين", "Citizens")}</button>
          <button onClick={() => setTab("complaints")} className={`px-4 h-10 rounded-xl border text-sm font-semibold ${tab === "complaints" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/25" : "bg-white/4 text-white/45 border-white/10"}`}><MessageSquare className="w-4 h-4 inline mx-1" />{t("الشكاوى", "Complaints")} <span className="text-xs opacity-70">({complaints.filter(c => c.status === "open").length})</span></button>
          <button onClick={() => setTab("billing")} className={`px-4 h-10 rounded-xl border text-sm font-semibold ${tab === "billing" ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/25" : "bg-white/4 text-white/45 border-white/10"}`}><Wallet className="w-4 h-4 inline mx-1" />{t("الفواتير", "Billing")}</button>
        </div>

        {loadingMain ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div> : tab === "billing" ? (
          <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="font-semibold text-white">{t("جميع الفواتير والمدفوعات", "All Invoices & Payments")}</h2>
              <button onClick={loadAdmin} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80"><RefreshCw className="w-4 h-4" /></button>
            </div>
            {adminInvoices.length === 0 ? (
              <div className="py-10 text-center text-white/30 text-sm">{t("لا توجد فواتير بعد", "No invoices yet")}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/8">{[t("المستخدم","User"), t("المنطقة","Area"), t("الشهر","Month"), t("المبلغ","Amount"), t("النوع","Type"), t("الحالة","Status"), t("الرصيد","Balance")].map(h => <th key={h} className="px-4 py-3 text-white/40 font-medium text-start">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {adminInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/3">
                        <td className="px-4 py-3 text-white">{inv.user_name}</td>
                        <td className="px-4 py-3 text-white/60">{inv.user_area}</td>
                        <td className="px-4 py-3 text-white/60">{inv.month}</td>
                        <td className="px-4 py-3 text-white font-semibold">{inv.amount.toFixed(0)} ₪</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${inv.type === "current" ? "text-cyan-300 bg-cyan-500/10 border-cyan-500/25" : "text-violet-300 bg-violet-500/10 border-violet-500/25"}`}>{inv.type === "current" ? t("حالية","Current") : t("سابقة","Previous")}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full border ${inv.status === "paid" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" : "text-amber-300 bg-amber-500/10 border-amber-500/25"}`}>{inv.status === "paid" ? t("مدفوعة","Paid") : t("غير مدفوعة","Unpaid")}</span></td>
                        <td className="px-4 py-3 text-white/60">{Number(inv.wallet_balance).toFixed(0)} ₪</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : tab === "citizens" ? <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="p-5 rounded-2xl bg-white/4 border border-white/8"><Users className="w-6 h-6 text-cyan-400 mb-3" /><p className="text-3xl font-bold text-white mb-1">{stats?.totalCitizens ?? 0}</p><p className="text-white/50 text-sm">{t("إجمالي المواطنين", "Total Citizens")}</p></motion.div>{stats?.byArea.slice(0, 3).map(a => <motion.div key={a.area} className="p-5 rounded-2xl bg-white/4 border border-white/8"><MapPin className="w-5 h-5 text-violet-400 mb-3" /><p className="text-2xl font-bold text-white mb-1">{a.count}</p><p className="text-white/50 text-sm truncate">{a.area}</p></motion.div>)}</div>
          <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden mb-8"><div className="px-5 py-4 border-b border-white/8 flex items-center justify-between"><h2 className="font-semibold text-white">{t("قائمة المواطنين المسجلين", "Registered Citizens")}</h2><button onClick={loadAdmin} className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80"><RefreshCw className="w-4 h-4" /></button></div>{users.length === 0 ? <div className="py-10 text-center text-white/30 text-sm">{t("لا يوجد مواطنون مسجلون بعد", "No citizens registered yet")}</div> : <div className="divide-y divide-white/5">{users.map(u => <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 group"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">{u.name.charAt(0)}</div><div><p className="text-white font-medium text-sm">{u.name}</p><p className="text-white/40 text-xs">{u.area}</p></div></div><button onClick={() => viewUser(u.id)} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-all">{t("تفاصيل", "Details")}<ChevronRight className="w-3 h-3" /></button></div>)}</div>}</div>
        </> : <div className="space-y-3">{complaints.length === 0 ? <div className="p-10 rounded-3xl bg-white/4 border border-white/10 text-center text-white/35">{t("لا توجد شكاوى", "No complaints")}</div> : complaints.map(c => <div key={c.id} className="p-4 rounded-2xl bg-white/4 border border-white/10"><div className="flex items-start justify-between gap-3 mb-2"><div><h3 className="text-white font-semibold">{c.title}</h3><p className="text-white/35 text-xs">{c.user_name} · {c.user_area}</p></div><span className={`text-xs px-2 py-1 rounded-full border ${c.status === "replied" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25" : "text-amber-300 bg-amber-500/10 border-amber-500/25"}`}>{statusLabel(c.status)}</span></div><p className="text-white/60 text-sm leading-6 mb-3">{c.message}</p>{c.reply && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-3"><p className="text-emerald-300 text-xs font-bold mb-1">{t("الرد", "Reply")}</p><p className="text-white/80 text-sm">{c.reply}</p></div>}<button onClick={() => { setSelectedComplaint(c); setReply(c.reply || ""); }} className="h-9 px-4 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 text-sm font-semibold">{c.reply ? t("تعديل الرد", "Edit Reply") : t("رد", "Reply")}</button></div>)}</div>}
      </main>

      <AnimatePresence>{(selectedUser || loadingDetail) && <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"spring",damping:30}} className="fixed top-0 right-0 bottom-0 w-full md:w-[440px] bg-[#0a1020] border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-y-auto"><div className="flex items-center justify-between px-6 py-5 border-b border-white/8 sticky top-0 bg-[#0a1020] z-10"><h3 className="font-bold text-white">{t("تفاصيل المواطن", "Citizen Details")}</h3><button onClick={() => setSelectedUser(null)} className="p-2 rounded-xl hover:bg-white/8 text-white/50"><X className="w-5 h-5" /></button></div>{loadingDetail ? <div className="flex-1 flex items-center justify-center"><div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div> : selectedUser && <div className="p-6 space-y-6"><div className="p-4 rounded-2xl bg-white/4 border border-white/8"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">{selectedUser.user.name.charAt(0)}</div><div><p className="text-white font-semibold">{selectedUser.user.name}</p><p className="text-white/50 text-sm">{selectedUser.user.area}</p></div></div>{selectedUser.setup && <div className="grid grid-cols-2 gap-2 text-xs">{[{label:t("نوع المنزل","Home Type"), val:selectedUser.setup.home_type},{label:t("عدد الغرف","Rooms"), val:selectedUser.setup.room_count},{label:t("أفراد العائلة","Family"), val:selectedUser.setup.family_size},{label:t("مستوى الفاتورة","Bill Level"), val:selectedUser.setup.bill_level}].map(item => <div key={item.label} className="p-2 rounded-lg bg-white/4"><p className="text-white/40 mb-0.5">{item.label}</p><p className="text-white font-medium">{item.val}</p></div>)}</div>}</div><div className="flex items-center gap-3 p-4 rounded-2xl bg-white/4 border border-white/8"><Zap className="w-5 h-5 text-amber-400" /><div><p className="text-white/50 text-xs">{t("الوضع الحالي", "Current Mode")}</p><p className="text-white font-semibold">{modeLabel(selectedUser.mode?.active_mode || "normal")}</p></div></div>{selectedUser.battery?.hasBattery && <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/15"><Battery className="w-5 h-5 text-emerald-400" /><div><p className="text-white/50 text-xs">{t("البطارية", "Battery")}</p><p className="text-white font-semibold">{selectedUser.battery.capacity} kWh — {selectedUser.battery.runtimeHours} {t("ساعات", "hours")}</p></div></div>}{selectedUser.bill && <div className="p-4 rounded-2xl bg-white/4 border border-white/8"><p className="text-white/50 text-xs mb-2">{t("الفاتورة المتوقعة", "Expected Bill")}</p><p className="text-2xl font-bold text-cyan-400">{selectedUser.bill.estimatedBill} ₪</p><p className="text-white/50 text-xs mt-1">{t(selectedUser.bill.mainReasonAr, selectedUser.bill.mainReasonEn)}</p></div>}<div className="p-4 rounded-2xl bg-white/4 border border-white/8"><p className="text-white/50 text-xs mb-3 flex items-center gap-1.5"><Home className="w-3.5 h-3.5" />{t("الغرف والأجهزة", "Rooms & Devices")}</p><div className="space-y-2">{selectedUser.rooms.map(room => { const roomDevices = selectedUser.devices.filter(d => d.room_id === room.id); return <div key={room.id} className="p-3 rounded-xl bg-white/4"><p className="text-white text-sm font-medium mb-2">{t(room.name_ar, room.name_en)}</p><div className="flex flex-wrap gap-1.5">{roomDevices.map(d => <span key={d.id} className={`text-xs px-2 py-0.5 rounded-full border ${d.is_on ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-300" : "bg-white/4 border-white/10 text-white/40"}`}>{t(d.name_ar, d.name_en)}</span>)}</div></div>; })}</div></div>{selectedUser.activityLogs.length > 0 && <div className="p-4 rounded-2xl bg-white/4 border border-white/8"><p className="text-white/50 text-xs mb-3">{t("آخر الأنشطة", "Recent Activity")}</p><div className="space-y-2">{selectedUser.activityLogs.slice(0,8).map(log => <div key={log.id} className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 mt-1.5" /><p className="text-white/60 text-xs">{t(log.message_ar, log.message_en)}</p></div>)}</div></div>}</div>}</motion.div>}</AnimatePresence>

      <AnimatePresence>{selectedComplaint && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-lg rounded-3xl bg-[#0a1020] border border-white/10 p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-white font-bold">{t("الرد على الشكوى", "Reply to Complaint")}</h3><button onClick={() => setSelectedComplaint(null)} className="text-white/50"><X className="w-5 h-5" /></button></div><p className="text-white/70 text-sm mb-3">{selectedComplaint.title}</p><textarea value={reply} onChange={e => setReply(e.target.value)} className="w-full min-h-32 rounded-xl bg-slate-950/60 border border-white/10 p-3 text-white focus:outline-none focus:border-cyan-400" placeholder={t("اكتب الرد هنا...", "Write reply here...")} /><button onClick={handleReply} disabled={!reply.trim()} className="mt-4 w-full h-11 rounded-xl bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold flex items-center justify-center gap-2"><Send className="w-4 h-4" />{t("إرسال الرد", "Send Reply")}</button></div></motion.div>}</AnimatePresence>
    </div>
  );
}
