import React from "react";
import { Home, ClipboardList, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: ClipboardList, label: "Tests", path: "/tests" },
        { icon: BarChart3, label: "Analytics", path: "/analytics" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-white/50 px-6 py-2 pb-6 flex items-center justify-between z-50 rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className="flex flex-col items-center gap-0.5 group"
                    >
                        <div className={`p-1 rounded-lg transition-all ${isActive
                            ? "text-[#3b6a9a]"
                            : "text-gray-400 group-hover:text-gray-600"
                            }`}>
                            <Icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
                        </div>
                        <span className={`text-[9px] font-bold ${isActive ? "text-[#3b6a9a]" : "text-gray-400"
                            }`}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default BottomNav;
