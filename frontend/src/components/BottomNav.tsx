import { Home, Library, MessageSquare, BarChart3, Settings, TrendingUp } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Record", icon: Home },
    { path: "/library", label: "Library", icon: Library },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/analytics", label: "Analytics", icon: TrendingUp },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-20">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition ${
              isActive(path)
                ? "text-blue-600 border-t-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
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