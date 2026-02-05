import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Compass } from "lucide-react";

const Register = ({ user, setUser }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate("/admin");
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Basic validation
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/api/auth/register", form);
            setUser(res.data.user);
            navigate("/");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <div className="w-full max-w-[360px]">
                <header className="flex items-center justify-between mb-4 px-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-900" />
                    </button>
                    <Link to="/" className="flex items-center">
                        <span className="text-[10px] font-black tracking-[0.2em] text-gray-900 uppercase ml-2">
                            NATA VISION
                        </span>
                    </Link>
                    <div className="w-8"></div> {/* Spacer for symmetry */}
                </header>

                <div className="px-4">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight mb-1 text-center">
                        Build Your Future
                    </h1>
                    <p className="text-gray-400 text-[10px] md:text-xs mb-6 font-bold text-center leading-relaxed">
                        Create an account to start your NATA journey.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
                        {error && (
                            <div className="p-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl border border-red-100 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                className="w-full px-3 py-2 rounded-xl border-2 border-gray-50 focus:border-blue-100 focus:bg-blue-50/10 outline-none transition-all placeholder:text-gray-300 font-bold text-xs"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                required
                                autoComplete="new-name" // Trick to sometimes bypass aggressive autofill
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                className="w-full px-3 py-2 rounded-xl border-2 border-gray-50 focus:border-blue-100 focus:bg-blue-50/10 outline-none transition-all placeholder:text-gray-300 font-bold text-xs"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                                autoComplete="new-email"
                            />
                        </div>

                        <div className="space-y-1 relative">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Create a password"
                                className="w-full px-3 py-2 rounded-xl border-2 border-gray-50 focus:border-blue-100 focus:bg-blue-50/10 outline-none transition-all placeholder:text-gray-300 font-bold text-xs"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                                autoComplete="new-password"
                            />
                            <p className="text-[9px] text-gray-400 font-bold ml-1">
                                Min. 8 chars
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-xs ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#3b6a9a] hover:bg-[#2a4d72]"
                                }`}
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center space-y-2">
                        <p className="text-gray-400 text-[10px] font-bold">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#3b6a9a] hover:underline ml-1 transition-colors">
                                Log In
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center">
                        <div className="w-12 h-[1px] bg-gray-50 mb-2"></div>
                    </div>
                </div>
            </div>

            <footer className="mt-8 pb-4 text-center px-4 max-w-xs">
                <p className="text-[9px] font-bold tracking-[0.2em] text-gray-300 uppercase leading-relaxed">
                    BY CREATING AN ACCOUNT, YOU AGREE TO OUR<br />
                    <Link to="/terms" className="underline hover:text-gray-400 transition-colors">TERMS OF SERVICE</Link> AND <Link to="/privacy" className="underline hover:text-gray-400 transition-colors">PRIVACY POLICY</Link>
                </p>
            </footer>
        </div>
    );
};

export default Register;
