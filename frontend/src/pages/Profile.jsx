import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { User, Mail, Shield, LogOut, ChevronRight, Settings, Bell, X, CheckCircle2 } from "lucide-react";

const Profile = ({ user, setUser }) => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);
            const res = await api.get("/api/admin/notifications");
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications");
        } finally {
            setLoadingNotifications(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.patch(`/api/admin/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error("Failed to mark as read");
        }
    };

    const handleLogout = async () => {
        try {
            await api.post("/api/auth/logout");
            setUser(null);
            window.location.href = "/";
        } catch (err) {
            console.error("Logout failed");
        }
    };

    if (!user) return null;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center select-none overflow-hidden relative">
            <div className="w-full max-w-sm flex flex-col items-center">
                {/* Minimized Header */}
                <div className="relative mb-8 text-center">
                    <div className="w-20 h-20 bg-blue-50/50 rounded-3xl flex items-center justify-center mb-4 border border-blue-100 shadow-sm mx-auto">
                        <User className="w-8 h-8 text-[#3b6a9a]" />
                    </div>
                    <h1 className="text-xl font-black text-gray-900 mb-0.5">{user.name}</h1>
                    <p className="text-gray-400 text-[11px] font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider">
                        <Mail size={10} /> {user.email}
                    </p>
                    <div className="mt-3 px-3 py-1 bg-gray-50 border border-gray-100 rounded-full text-[8px] font-black text-gray-400 uppercase tracking-widest inline-block">
                        {user.role} ACCOUNT
                    </div>
                </div>

                {/* Profile Actions */}
                <div className="w-full px-6 space-y-2.5">


                    <button
                        onClick={() => setShowNotifications(true)}
                        className="w-full bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between active:scale-95 transition-all relative"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Bell className="w-4 h-4 text-purple-500" />
                            </div>
                            <span className="font-bold text-[13px] text-gray-700">Notifications</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                                    {unreadCount}
                                </span>
                            )}
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                    </button>



                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex items-center justify-between active:scale-95 transition-all mt-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-red-500 shadow-sm">
                                <LogOut size={16} />
                            </div>
                            <span className="font-black text-[11px] text-red-600 uppercase tracking-widest">Logout Session</span>
                        </div>
                        <ChevronRight size={16} className="text-red-300" />
                    </button>
                </div>

                <div className="mt-12 text-center opacity-30">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">NATA PRACTICE PORTAL v1.0</p>
                </div>
            </div>

            {/* Notification Drawer Modal */}
            {showNotifications && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm h-[80vh] sm:h-auto sm:max-h-[500px] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Inbox</h3>
                                <p className="text-[10px] font-bold text-gray-400">{unreadCount} unread messages</p>
                            </div>
                            <button
                                onClick={() => setShowNotifications(false)}
                                className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                            {loadingNotifications ? (
                                <div className="h-40 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-center p-6 text-gray-300">
                                    <Bell size={32} className="mb-2 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.is_read ? 'bg-gray-50/50 border-gray-100' : 'bg-blue-50/30 border-blue-100 shadow-sm'}`}
                                        onClick={() => !n.is_read && markAsRead(n.id)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-[13px] font-bold ${n.is_read ? 'text-gray-600' : 'text-[#3b6a9a]'}`}>{n.title}</h4>
                                            {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shadow-sm shadow-blue-500/50"></div>}
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-2">{n.message}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-wider">
                                                {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                            {n.is_read && <CheckCircle2 size={12} className="text-green-500/50" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
