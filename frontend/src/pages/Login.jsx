import React, { useState } from "react";
import api from "../api/axios"
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Compass, Eye, EyeOff, Pencil, UserCog } from "lucide-react";

const Login = ({ setUser }) => {
    const [searchParams] = useSearchParams();
    const isAdmin = searchParams.get("role") === "admin";

    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/api/auth/login", form);

            // Check if login is via Admin Mode but account is not an admin
            if (isAdmin && res.data.user.role !== 'admin') {
                setError("Access denied: This login is for administrators only.");
                // Immediately clear the cookie set by backend
                await api.post("/api/auth/logout", {}, { withCredentials: true });
                return;
            }

            setUser(res.data.user);
            if (res.data.user.role === 'admin') {
                navigate("/admin");
            } else {
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Invalid email or password");
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <Link to="/" className="mb-4 flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-gray-900 uppercase">NATA Vision</span>
                <Compass className="w-3 h-3 text-gray-900" />
            </Link>

            <div className="w-full max-w-[360px] bg-white rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex justify-center mb-4">
                    <div className="bg-[#eff6ff] p-2 rounded-xl">
                        {isAdmin ? (
                            <UserCog className="w-5 h-5 text-[#3b6a9a]" />
                        ) : (
                            <Pencil className="w-5 h-5 text-[#3b82f6]" />
                        )}
                    </div>
                </div>

                <div className="text-center mb-5">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-1">
                        {isAdmin ? (
                            <>Welcome back,<br />Admin.</>
                        ) : (
                            <>Welcome back,<br />future architect.</>
                        )}
                    </h1>
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold">
                        {isAdmin ? "Log in to access your dashboard" : "Log in to continue your preparation"}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {error && (
                        <div className="p-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl text-center border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-gray-300 font-bold text-xs"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="relative space-y-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-gray-300 font-bold text-xs"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        <div className="flex justify-end pr-1">
                            <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-[#3b82f6] hover:text-[#2563eb] transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#3b6a9a] text-white font-black py-3 rounded-xl shadow-lg shadow-blue-900/10 text-xs hover:bg-[#2a4d72] transition-colors"
                    >
                        Login
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t border-gray-50 text-center space-y-2">
                    <p className="text-gray-400 text-[10px] font-bold">
                        {isAdmin ? (
                            <>
                                Not an admin?{" "}
                                <Link to="/login" className="text-[#3b6a9a] hover:underline ml-1 transition-colors">
                                    Student Login
                                </Link>
                            </>
                        ) : (
                            <>
                                Don't have an account?{" "}
                                <Link to="/register" className="text-[#3b6a9a] hover:underline ml-1 transition-colors">
                                    Register
                                </Link>
                            </>
                        )}
                    </p>
                    <Link to="/" className="inline-block mt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>

            <footer className="mt-6 text-center max-w-xs">
                <p className="text-[9px] font-bold tracking-[0.2em] text-gray-300 uppercase leading-relaxed">
                    BY CONTINUING, YOU AGREE TO OUR TERMS OF SERVICE
                </p>
            </footer>
        </div>
    );
};

export default Login;
