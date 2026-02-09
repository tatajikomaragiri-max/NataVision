import React from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const Navbar = ({ user, setUser }) => {
    const logout = async () => {
        try {
            await api.post(
                "/api/auth/logout",
                {},
                { withCredentials: true }
            );
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
        } catch (err) {
            console.error(err);
        }
    };
    // ... rest of file implicitly kept by replace_file_content rules? No, I must provide full content or use correct Start/End.
    // Wait, replace_file_content replaces the chunk. I should target specific lines.


    return (
        <div className="fixed top-2 md:top-6 left-0 right-0 z-50 px-3 md:px-6">
            <nav className="bg-white/70 backdrop-blur-xl max-w-5xl mx-auto flex items-center justify-between px-4 md:px-6 py-2 md:py-2.5 rounded-2xl md:rounded-[2rem] border border-white/40 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.05)]">
                <Link to="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
                    <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-[#3b6a9a] to-[#5a9ad4] rounded-lg md:rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3">
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <span className="text-base md:text-lg font-black text-gray-900 tracking-tight">NATA<span className="text-[#3b6a9a]">Vision</span></span>
                </Link>

                <div className="flex items-center gap-2 md:gap-6">
                    {user ? (
                        <div className="flex items-center gap-3 md:gap-5">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Welcome back</span>
                                <span className="text-sm font-black text-gray-900 lowercase">{user.name}</span>
                            </div>

                            {user.role === 'admin' && (
                                <Link to="/admin" className="text-[10px] font-black text-[#3b6a9a] uppercase tracking-widest border-b-2 border-transparent hover:border-[#3b6a9a] transition-all">
                                    Admin
                                </Link>
                            )}

                            <button
                                onClick={logout}
                                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                                title="Logout"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 md:gap-2">
                            <Link to="/login" className="px-2 md:px-4 py-2 text-[10px] font-black text-gray-600 hover:text-gray-900 transition-colors uppercase tracking-widest">
                                Login
                            </Link>
                            <Link to="/login?role=admin" className="px-1.5 md:px-4 py-2 text-[10px] font-black text-[#3b6a9a] hover:text-[#2a4d72] transition-colors uppercase tracking-widest border-l border-gray-100">
                                Admin
                            </Link>
                            <Link
                                to="/register"
                                className="bg-[#3b6a9a] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-[#2a4d72] hover:-translate-y-0.5 transition-all active:scale-95 ml-1 md:ml-2"
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Navbar;

