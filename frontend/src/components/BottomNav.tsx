import { Home, Library, MessageSquare, BarChart3, Settings, TrendingUp } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Record", icon: Home },
    { path: "/library", label: "Library", icon: Library },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/analytics", label: "Stats", icon: TrendingUp },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] md:hidden z-50">
      <div className="flex items-center justify-around h-20">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-300 ${
              isActive(path)
                ? "text-gray-900 scale-110"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(path) ? 'fill-gray-900/10' : ''}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive(path) ? 'opacity-100' : 'opacity-60'}`}>
              {label}
            </span>
            {isActive(path) && (
              <div className="absolute top-0 w-8 h-1 bg-gray-900 rounded-b-full shadow-sm" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
