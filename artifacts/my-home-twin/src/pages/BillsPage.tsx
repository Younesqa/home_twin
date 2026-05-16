import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { api, type BillingSummary, type Invoice } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Receipt, Clock, Plus, CreditCard, X, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BillsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);

  const loadSummary = async () => {
    try {
      const data = await api.getBillingSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load billing summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSummary(); }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || !cardholderName || !cardNumber || !expiry || !cvv) return;
    setTopUpLoading(true);
    try {
      const data = await api.topUpWallet({ amount: Number(topUpAmount), cardholderName, cardNumber, expiry, cvv });
      setSummary(data);
      setShowTopUp(false);
      setTopUpAmount(""); setCardholderName(""); setCardNumber(""); setExpiry(""); setCvv("");
      toast({ title: t("تم إضافة الرصيد بنجاح", "Balance added successfully") });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : t("فشل في إضافة الرصيد", "Failed to add balance"), variant: "destructive" });
    } finally {
      setTopUpLoading(false);
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!summary) return;
    if (summary.wallet.balance < invoice.amount) {
      toast({ title: t("الرصيد غير كافٍ لدفع الفاتورة", "Insufficient balance to pay the bill"), variant: "destructive" });
      return;
    }
    setPayingInvoice(true);
    try {
      const data = await api.payInvoice(invoice.id);
      setSummary(data);
      toast({ title: t("تم دفع الفاتورة بنجاح", "Bill paid successfully") });
    } catch (err: unknown) {
      toast({ title: err instanceof Error ? err.message : t("فشل في دفع الفاتورة", "Failed to pay bill"), variant: "destructive" });
    } finally {
      setPayingInvoice(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const statusLabel = (status: string) =>
    status === "paid" ? t("مدفوعة", "Paid") : t("مستحقة", "Due");

  const txLabel = (type: string) => {
    if (type === "topup") return t("إضافة رصيد", "Wallet Top-up");
    if (type === "solar_sale") return t("بيع طاقة شمسية للبلدية", "Solar Energy Sale");
    return t("دفع فاتورة", "Bill Payment");
  };

  const txIsCredit = (type: string) => type === "topup" || type === "solar_sale";

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">{t("الفواتير", "Bills")}</h1>
            <p className="text-white/40 text-sm">{t("محفظتك، فواتيرك، وسجل المدفوعات", "Your wallet, bills, and payment history")}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Wallet Card */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-3xl bg-white/4 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">{t("رصيدك داخل التطبيق", "App Wallet Balance")}</h2>
                    <p className="text-white/40 text-xs">{t("محفظة التطبيق التجريبية", "Demo app wallet")}</p>
                  </div>
                </div>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-white mb-1">
                    {summary.wallet.balance.toFixed(2)}
                    <span className="text-lg text-white/40 font-normal mx-1">₪</span>
                  </div>
                  <p className="text-white/35 text-xs">{t("الرصيد الحالي", "Current balance")}</p>
                </div>
                <button
                  onClick={() => setShowTopUp(true)}
                  className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <Plus className="w-4 h-4" />
                  {t("إضافة رصيد", "Add Balance")}
                </button>
              </motion.div>

              {/* Current Invoice Card */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="p-6 rounded-3xl bg-white/4 border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">{t("الفاتورة الحالية", "Current Bill")}</h2>
                    <p className="text-white/40 text-xs">{summary.currentInvoice ? summary.currentInvoice.month : t("لا يوجد", "None")}</p>
                  </div>
                </div>

                {summary.currentInvoice ? (
                  <>
                    <div className="text-center mb-5">
                      <div className="text-5xl font-bold text-white mb-2">
                        {summary.currentInvoice.amount.toFixed(0)}
                        <span className="text-lg text-white/40 font-normal mx-1">₪</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${
                        summary.currentInvoice.status === "paid"
                          ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/25"
                          : "text-amber-300 bg-amber-500/10 border-amber-500/25"
                      }`}>
                        {t("الحالة:", "Status:")} {statusLabel(summary.currentInvoice.status)}
                      </span>
                    </div>
                    {summary.currentInvoice.status === "paid" ? (
                      <div className="space-y-2">
                        <p className="text-center text-emerald-400/80 text-xs">{t("تم دفع فاتورة هذا الشهر بنجاح", "This month bill has been paid successfully")}</p>
                        <div className="w-full h-11 rounded-2xl bg-white/5 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {t("تم الدفع", "Paid")}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePayInvoice(summary.currentInvoice!)}
                        disabled={payingInvoice}
                        className="w-full h-11 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        {payingInvoice && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                        {t("دفع الفاتورة", "Pay Bill")}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-white/30 text-sm">
                    {t("لا توجد فاتورة حالية. أكمل إعداد المنزل أولاً.", "No current bill. Complete home setup first.")}
                  </div>
                )}
              </motion.div>

              {/* Previous Bills */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="p-6 rounded-3xl bg-white/4 border border-white/10">
                <h2 className="text-white font-bold text-sm mb-5 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-violet-400" />
                  {t("الفواتير السابقة", "Previous Bills")}
                </h2>
                {summary.previousInvoices.length === 0 ? (
                  <div className="py-6 text-center text-white/30 text-sm">{t("لا توجد فواتير سابقة", "No previous bills")}</div>
                ) : (
                  <div className="space-y-3">
                    {summary.previousInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                        <div>
                          <p className="text-white text-sm font-medium">{inv.month}</p>
                          {inv.paid_at && <p className="text-white/35 text-xs">{formatDate(inv.paid_at)}</p>}
                        </div>
                        <div className="text-end">
                          <p className="text-white font-semibold text-sm">{inv.amount.toFixed(0)} ₪</p>
                          <span className={`text-xs font-medium ${inv.status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>
                            {statusLabel(inv.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Payment History */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="p-6 rounded-3xl bg-white/4 border border-white/10">
                <h2 className="text-white font-bold text-sm mb-5 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {t("سجل المدفوعات", "Payment History")}
                </h2>
                {summary.transactions.length === 0 ? (
                  <div className="py-6 text-center text-white/30 text-sm">{t("لا توجد معاملات بعد", "No transactions yet")}</div>
                ) : (
                  <div className="space-y-3">
                    {summary.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${txIsCredit(tx.type) ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                            {txIsCredit(tx.type) ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{txLabel(tx.type)}</p>
                            <p className="text-white/35 text-xs">{formatDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <p className={`font-semibold text-sm ${txIsCredit(tx.type) ? "text-emerald-400" : "text-red-400"}`}>
                          {txIsCredit(tx.type) ? "+" : "-"}{tx.amount.toFixed(2)} ₪
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

            </div>
          ) : (
            <div className="py-20 text-center text-white/30">{t("تعذر تحميل بيانات الفواتير", "Could not load billing data")}</div>
          )}
        </main>
      </div>

      {/* Add Balance Modal */}
      <AnimatePresence>
        {showTopUp && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#0a1020] border border-white/10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-white font-bold">{t("إضافة رصيد", "Add Balance")}</h2>
                </div>
                <button onClick={() => setShowTopUp(false)} className="p-2 rounded-xl hover:bg-white/8 text-white/50">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2 mb-5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200/80 text-xs leading-5">
                  {t(
                    "هذه عملية تجريبية لأغراض المشروع فقط. لا تستخدم بطاقة حقيقية.",
                    "This is a demo payment for the project only. Do not use a real card."
                  )}
                </p>
              </div>

              <form onSubmit={handleTopUp} autoComplete="off" className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs">{t("المبلغ (شيكل)", "Amount (NIS)")}</Label>
                  <Input
                    required type="number" min="1" value={topUpAmount}
                    onChange={e => setTopUpAmount(e.target.value)}
                    autoComplete="off"
                    className="bg-slate-900/60 border-white/10 text-white h-10 rounded-xl"
                    placeholder="100"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs">{t("اسم صاحب البطاقة", "Cardholder Name")}</Label>
                  <Input
                    required value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                    autoComplete="off"
                    className="bg-slate-900/60 border-white/10 text-white h-10 rounded-xl"
                    placeholder={t("الاسم الكامل", "Full name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs">{t("رقم البطاقة", "Card Number")}</Label>
                  <Input
                    required value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    autoComplete="off"
                    maxLength={19}
                    className="bg-slate-900/60 border-white/10 text-white h-10 rounded-xl tracking-widest"
                    placeholder="•••• •••• •••• ••••"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-xs">{t("تاريخ الانتهاء", "Expiry Date")}</Label>
                    <Input
                      required value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      autoComplete="off"
                      maxLength={5}
                      className="bg-slate-900/60 border-white/10 text-white h-10 rounded-xl"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/70 text-xs">CVV</Label>
                    <Input
                      required type="password" value={cvv}
                      onChange={e => setCvv(e.target.value)}
                      autoComplete="new-password"
                      maxLength={4}
                      className="bg-slate-900/60 border-white/10 text-white h-10 rounded-xl"
                      placeholder="•••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={topUpLoading}
                  className="w-full h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {topUpLoading && <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />}
                  {t("إضافة الرصيد", "Add Balance")}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
