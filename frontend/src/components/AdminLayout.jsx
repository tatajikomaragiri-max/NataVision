import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { Menu, X } from "lucide-react";

const AdminLayout = ({ children, user, setUser }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Basic protection: Only admins can see this
    if (!user || user.role !== 'admin') {
        return null; // Let the Sidebar's navigate handle redirection
    }

    return (
        <div className="flex bg-[#f8fafc] min-h-screen relative overflow-hidden">
            {/* Mobile Header Toggle */}
            <div className="md:hidden fixed top-4 right-4 z-50">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-3 bg-white rounded-2xl shadow-lg border border-gray-100 text-gray-600 hover:text-[#3b6a9a] active:scale-95 transition-all"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AdminSidebar setUser={setUser} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 p-4 md:p-10 max-h-screen overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
