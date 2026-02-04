import { Bell, User, Shield, Grid } from "lucide-react";
import { Link } from "react-router-dom";

const DashboardHeader = ({ user }) => {
    return (
        <header className="flex items-center justify-between px-6 py-8 bg-transparent relative z-20">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden group">
                    <User className="w-8 h-8 text-gray-400 mt-2 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                        Hello, {user?.name?.split(' ')[0] || "Student"}
                    </h2>
                    <p className="text-[10px] font-black tracking-[0.25em] text-[#3b6a9a] uppercase">
                        NATA ASPIRANT • 2025
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {user?.role === 'admin' && (
                    <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-lg shadow-black/10"
                    >
                        <Shield size={14} className="text-blue-400" />
                        Admin Portal
                    </Link>
                )}
                <button className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                    <Bell className="w-6 h-6 text-gray-600" />
                    <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-[#3b6a9a] rounded-full border-2 border-white"></span>
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
