import { Mic, Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Record" },
    { path: "/library", label: "Library" },
    { path: "/chat", label: "Chat" },
    { path: "/reports", label: "Reports" },
    { path: "/analytics", label: "Analytics" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Study Pro</h1>
            <p className="text-xs text-gray-500">AI-powered lectures</p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className="text-gray-700 hover:text-blue-600 font-medium text-sm transition"
            >
              {label}
            </Link>
          ))}
          <Link
            to="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-700 hover:text-blue-600"
          >
            <Settings className="w-5 h-5" />
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
        <nav className="md:hidden bg-gray-50 border-t border-gray-200 px-4 py-3 space-y-2">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
            >
              {label}
            </Link>
          ))}
          <Link
            to="/settings"
            onClick={() => setMenuOpen(false)}
            className="block px-3 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium"
          >
            Settings
          </Link>
        </nav>
      )}
    </header>
  );
}