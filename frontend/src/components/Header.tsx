import { Mic, Menu, X, Settings as SettingsIcon, LayoutDashboard, BarChart3, Library as LibraryIcon, Home } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Study Pro</h1>
            <p className="text-xs text-gray-500">AI-powered lectures</p>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" label="Record" />
          <NavLink to="/library" label="Library" />
          <NavLink to="/analytics" label="Analytics" />
          <NavLink to="/reports" label="Reports" />
          <Link 
            to="/settings" 
            className="p-2.5 bg-gray-50 text-gray-900 border border-gray-100 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {menuOpen ? (
            <X className="w-6 h-6 text-gray-700" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-100 p-4 space-y-2">
          <MobileNavLink to="/" label="Record" icon={Home} onClick={() => setMenuOpen(false)} />
          <MobileNavLink to="/library" label="Library" icon={LibraryIcon} onClick={() => setMenuOpen(false)} />
          <MobileNavLink to="/analytics" label="Analytics" icon={LayoutDashboard} onClick={() => setMenuOpen(false)} />
          <MobileNavLink to="/reports" label="Reports" icon={BarChart3} onClick={() => setMenuOpen(false)} />
          <MobileNavLink to="/settings" label="Settings" icon={SettingsIcon} onClick={() => setMenuOpen(false)} />
        </nav>
      )}
    </header>
  );
}

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`text-sm font-bold tracking-tight transition-colors ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ to, label, icon: Icon, onClick }: any) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-bold tracking-tight">{label}</span>
    </Link>
  );
}
