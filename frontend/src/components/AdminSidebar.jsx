import api from "../api/axios";
import { LayoutDashboard, FileUp, ClipboardList, Users, Settings, LogOut, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AdminSidebar = ({ setUser, isOpen, onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post("/api/auth/logout", {}, { withCredentials: true });
            console.log("Logout API success");
        } catch (err) {
            console.error("Logout API failed", err);
        } finally {
            if (setUser) setUser(null);
            localStorage.removeItem('token');
            navigate("/");
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: Sparkles, label: "Create Exam", path: "/admin/create-exam" },
        { icon: FileUp, label: "Upload Paper", path: "/admin/upload-paper" },
        { icon: Users, label: "Students", path: "/admin/students" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed md:sticky top-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col h-screen transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                }`}>
                <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#3b6a9a] rounded flex items-center justify-center">
                                <span className="text-white font-black italic">N</span>
                            </div>
                            <span className="text-lg font-black text-gray-900 tracking-tight">Admin Portal</span>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600 transition-colors">
                            <LogOut className="rotate-180" size={20} />
                        </button>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition-all ${isActive
                                        ? "bg-blue-50 text-[#3b6a9a]"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <Icon size={20} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-red-400 hover:text-red-600 hover:bg-red-50 transition-all w-full"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
