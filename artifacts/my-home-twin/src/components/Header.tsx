import { Link, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHome } from "@/contexts/HomeContext";
import { LanguageToggle } from "./LanguageToggle";
import { Zap, Battery, Edit3, LogOut, Home, MessageSquare, Wallet } from "lucide-react";

export function Header() {
  const { t } = useLanguage();
  const { user, logout } = useHome();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const navLinks = [
    { path: "/home", ar: "منزلي", en: "My Home", Icon: Home },
    { path: "/bills", ar: "الفواتير", en: "Bills", Icon: Wallet },
    { path: "/bill", ar: "الفاتورة المتوقعة والبطارية", en: "Estimated Bill & Battery", Icon: Battery },
    { path: "/complaints", ar: "الشكاوى", en: "Complaints", Icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/8 bg-slate-950/70 backdrop-blur-lg">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="hidden sm:block">
            <span className="text-white font-bold text-sm">{t("منزلي الرقمي", "My Digital Home")}</span>
            <span className="text-white/30 text-xs mx-2">·</span>
            <span className="text-white/40 text-xs">{user.name}</span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.path} href={link.path}>
              <a className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                location === link.path ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}>
                <link.Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t(link.ar, link.en)}</span>
              </a>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            data-testid="button-edit-home"
            onClick={() => setLocation("/setup")}
            className="hidden lg:flex items-center gap-1.5 text-xs text-white/35 hover:text-white/65 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-white/5"
            title={t("تعديل بيانات المنزل بدون حذف الأجهزة إلا عند تقليل عدد الغرف", "Edit home details without deleting devices unless rooms are reduced")}
          >
            <Edit3 className="w-3 h-3" />
            {t("تعديل المنزل", "Edit Home")}
          </button>
          <LanguageToggle />
          <button
            data-testid="button-logout"
            onClick={() => { logout(); setLocation("/"); }}
            className="p-1.5 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
            title={t("خروج", "Logout")}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
