import { Header } from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { CheckCircle2, XCircle, Zap, Battery } from "lucide-react";

export default function BillPage() {
  const { t } = useLanguage();
  const { bill, battery, devices } = useHome();

  const deviceTypes = devices.map(d => d.type);

  const applianceCosts = [
    { type: "heater", ar: "السخان الكهربائي", en: "Electric Heater", cost: "~ 1 ₪/hr", color: "text-red-400" },
    { type: "ac", ar: "المكيف", en: "Air Conditioner", cost: "~ 1.5 ₪/hr", color: "text-red-400" },
    { type: "washingMachine", ar: "الغسالة", en: "Washing Machine", cost: "~ 2 ₪/cycle", color: "text-amber-400" },
    { type: "tv", ar: "التلفزيون", en: "Television", cost: "~ 0.25 ₪/hr", color: "text-emerald-400" },
    { type: "fridge", ar: "الثلاجة", en: "Refrigerator", cost: "~ 0.5 ₪/hr", color: "text-cyan-400" },
    { type: "light", ar: "الإضاءة", en: "Lighting", cost: t("تكلفة منخفضة", "Low cost"), color: "text-blue-400" },
  ];

  const poweredByBattery = [
    { ar: "الإضاءة الأساسية", en: "Basic Lighting" },
    { ar: "الثلاجة", en: "Refrigerator" },
    { ar: "الواي فاي", en: "WiFi Router" },
    { ar: "شحن الهاتف", en: "Phone Charging" },
  ];

  const notForBattery = [
    { ar: "السخان الكهربائي", en: "Electric Heater" },
    { ar: "المكيف", en: "Air Conditioner" },
    { ar: "الغسالة", en: "Washing Machine" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050d1f] via-[#0a1628] to-[#0d1e3f]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1">
        <Header />

        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-1">{t("الفاتورة والبطارية", "Bill & Battery")}</h1>
          <p className="text-white/40 text-sm mb-8">{t("ملخص مبسط لاستهلاك منزلك", "Simplified summary of your home consumption")}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill Section */}
            <section className="space-y-5">
              <div className="p-6 rounded-3xl bg-white/4 border border-white/10">
                <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  {t("ملخص الفاتورة", "Bill Summary")}
                </h2>

                {bill ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-5xl font-bold text-white mb-1">
                        {bill.estimatedBill}
                        <span className="text-lg text-white/40 font-normal mr-1">₪</span>
                      </div>
                      <p className="text-white/40 text-sm">{t("فاتورتك المتوقعة هذا الشهر", "Expected bill this month")}</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/4 border border-white/8">
                        <p className="text-white/40 text-xs mb-1">{t("السبب الرئيسي", "Main Reason")}</p>
                        <p className="text-white text-sm font-medium">{t(bill.mainReasonAr, bill.mainReasonEn)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/15">
                        <p className="text-cyan-300/60 text-xs mb-1">{t("نصيحة التوفير", "Saving Tip")}</p>
                        <p className="text-cyan-200 text-sm">{t(bill.tipAr, bill.tipEn)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-white/30 text-sm">
                    {t("لا توجد بيانات بعد", "No data yet")}
                  </div>
                )}
              </div>

              {/* Appliance costs */}
              <div className="p-5 rounded-3xl bg-white/4 border border-white/10">
                <h3 className="text-sm font-bold text-white mb-4">{t("تكلفة الأجهزة التقريبية", "Appliance Cost Estimates")}</h3>
                <div className="space-y-2">
                  {applianceCosts
                    .filter(a => a.type === "light" || a.type === "fridge" || deviceTypes.includes(a.type))
                    .map(item => (
                      <div key={item.type} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-white/5">
                        <span className="text-white/80 text-sm">{t(item.ar, item.en)}</span>
                        <span className={`text-sm font-medium ${item.color}`}>{item.cost}</span>
                      </div>
                    ))
                  }
                </div>
                <p className="text-white/25 text-xs mt-4 italic text-center">
                  {bill ? t(bill.noteAr, bill.noteEn) : t("هذه أرقام توضيحية مبسطة وليست فاتورة حقيقية.", "Simplified estimates, not a real bill.")}
                </p>
              </div>
            </section>

            {/* Battery Section */}
            <section className="space-y-5">
              <div className="p-6 rounded-3xl bg-white/4 border border-white/10">
                <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                  <Battery className="w-4 h-4 text-emerald-400" />
                  {t("دليل البطارية وقت الانقطاع", "Battery Guide During Outage")}
                </h2>

                {battery.hasBattery ? (
                  <>
                    <div className="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                          <Battery className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-emerald-300 font-semibold">{battery.capacity} kWh</p>
                          <p className="text-emerald-200/60 text-xs">
                            {t(`تكفي تقريباً ${battery.runtimeHours} ساعات للأشياء الأساسية`, `Lasts approx. ${battery.runtimeHours} hours for essentials`)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {t("تشغّل على البطارية", "Powered by battery")}
                        </h3>
                        <div className="space-y-1.5">
                          {poweredByBattery.map(item => (
                            <div key={item.ar} className="flex items-center gap-2 text-sm text-white/70">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                              {t(item.ar, item.en)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-400" />
                          {t("لا يفضل على البطارية", "Avoid on battery")}
                        </h3>
                        <div className="space-y-1.5">
                          {notForBattery.map(item => (
                            <div key={item.ar} className="flex items-center gap-2 text-sm text-white/60">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              {t(item.ar, item.en)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <Battery className="w-10 h-10 text-white/15 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">{t("لم تقم بإضافة بطارية في إعداد المنزل.", "No battery added in home setup.")}</p>
                    <p className="text-white/25 text-xs mt-1">{t("يمكنك إعادة بناء المنزل لإضافتها.", "Rebuild your home to add one.")}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
