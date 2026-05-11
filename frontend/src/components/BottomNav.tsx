import { Home, Library, MessageSquare, BarChart3, Settings, TrendingUp } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useTranslation } from "../lib/i18n";

export function BottomNav() {
  const location = useLocation();
  const { settings } = useSettings();
  const { t } = useTranslation(settings.language);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: t("Record"), icon: Home },
    { path: "/library", label: t("Library"), icon: Library },
    { path: "/reports", label: t("Reports"), icon: BarChart3 },
    { path: "/analytics", label: t("Analytics"), icon: TrendingUp },
    { path: "/settings", label: t("Settings"), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg md:hidden transition-colors duration-300">
      <div className="flex items-center justify-around h-20">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition ${
              isActive(path)
                ? "text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 dark:border-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}