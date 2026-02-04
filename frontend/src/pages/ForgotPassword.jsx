import React, { useState } from "react";
import api from "../api/axios"
import { useNavigate, Link } from "react-router-dom";
import { Key, Mail, ShieldCheck, ArrowRight, ChevronLeft } from "lucide-react";

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/api/auth/forgot-password", { email });
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/api/auth/verify-otp", { email, otp });
            setMessage(""); // Clear previous success message
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/api/auth/reset-password", { email, otp, newPassword });
            setMessage(res.data.message);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <Link to="/login" className="mb-8 flex items-center gap-2 text-gray-400">
                <ChevronLeft size={18} />
                <span className="text-sm font-bold">Back to Login</span>
            </Link>

            <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xl shadow-blue-900/5">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-50 p-4 rounded-2xl">
                        {step === 1 && <Mail className="w-8 h-8 text-[#3b6a9a]" />}
                        {step === 2 && <ShieldCheck className="w-8 h-8 text-[#3b6a9a]" />}
                        {step === 3 && <Key className="w-8 h-8 text-[#3b6a9a]" />}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-gray-900 mb-2">
                        {step === 1 && "Forgot Password?"}
                        {step === 2 && "Verify OTP"}
                        {step === 3 && "Secure Account"}
                    </h1>
                    <p className="text-gray-400 text-sm font-bold leading-relaxed">
                        {step === 1 && "Enter your email to receive a 6-digit security code."}
                        {step === 2 && `We've sent a code to ${email}. Please check your inbox.`}
                        {step === 3 && "Almost done! Set your new master password below."}
                    </p>
                </div>

                {message && !error && (
                    <div className="mb-6 p-4 bg-green-50 text-green-600 text-xs font-bold rounded-2xl border border-green-100 text-center">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 text-center">
                        {error}
                    </div>
                )}

                {/* STEP 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Account Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/30 focus:border-[#3b6a9a] focus:bg-white outline-none transition-all font-bold text-gray-900"
                                placeholder="name@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#3b6a9a] text-white py-4.5 rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? "Sending..." : "Send Security Code"}
                            <ArrowRight size={20} />
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP Input */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">6-Digit Code</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/30 focus:border-[#3b6a9a] focus:bg-white outline-none transition-all font-black text-2xl text-center tracking-[0.5em] text-[#3b6a9a]"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#3b6a9a] text-white py-4.5 rounded-2xl font-black text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? "Verifying..." : "Verify Code"}
                            <ShieldCheck size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-xs font-bold text-gray-400"
                        >
                            Wrong email? Go back
                        </button>
                    </form>
                )}

                {/* STEP 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/30 focus:border-[#3b6a9a] focus:bg-white outline-none transition-all font-bold text-gray-900"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white py-4.5 rounded-2xl font-black text-lg shadow-lg disabled:opacity-50"
                        >
                            {loading ? "Resetting..." : "Confirm New Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
