import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { Link } from "react-router-dom";
import { Clock, ClipboardList, ChevronRight, TrendingUp, TrendingDown, Layout } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import AdminLayout from "../components/AdminLayout";
import AdminDashboard from "./AdminDashboard";

const LandingView = () => (
    <div className="bg-white min-h-screen flex items-center justify-center p-6 relative pt-24 md:pt-6">
        <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                        NATA<span className="text-[#3b6a9a]">Vision</span>
                    </h1>
                    <p className="text-lg md:text-xl font-bold text-gray-400 leading-relaxed max-w-sm md:max-w-none">
                        Master architecture entrance exams with expert-designed mock tests.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4">
                    <Link
                        to="/register"
                        className="flex-1 md:flex-none text-center px-6 md:px-8 py-3 md:py-3.5 bg-[#3b6a9a] text-white rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-[#2a4d72] transition-all active:scale-95"
                    >
                        Get Started
                    </Link>
                    <Link
                        to="/login"
                        className="flex-1 md:flex-none text-center px-6 md:px-8 py-3 md:py-3.5 bg-gray-50 text-gray-600 rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 border border-gray-100"
                    >
                        Sign In
                    </Link>
                </div>

                <div className="pt-6 md:pt-8 border-t border-gray-50 grid grid-cols-3 gap-2 md:gap-4">
                    {[
                        { label: "Tests", val: "50+" },
                        { label: "Questions", val: "5000+" },
                        { label: "Exams", val: "NATA 2025" }
                    ].map((s, i) => (
                        <div key={i}>
                            <p className="text-base md:text-lg font-black text-gray-900 leading-none">{s.val}</p>
                            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative mt-8 md:mt-0">
                <div className="aspect-[4/5] md:aspect-[4/5] bg-gray-50 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm transition-transform hover:scale-[1.02] duration-500">
                    <img
                        src="/hero_image_1770041022516.png"
                        alt="NATA Architecture"
                        className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
                    />
                </div>
                {/* Subtle detail */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 md:w-32 md:h-32 bg-blue-50 rounded-full mix-blend-multiply filter blur-2xl opacity-70"></div>
            </div>
        </div>
    </div>
);

const DashboardView = ({ user }) => {
    const [availableTests, setAvailableTests] = useState([]);
    const [recentResults, setRecentResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsRes, resultsRes] = await Promise.all([
                    api.get("/api/admin/published-exams"),
                    api.get("/api/admin/my-results")
                ]);
                setAvailableTests(examsRes.data);
                setRecentResults(resultsRes.data.slice(0, 3).map(r => ({
                    title: r.exam_title,
                    score: `${r.score}/${r.total_marks}`,
                    trend: `${Math.round((r.score / r.total_marks) * 100)}%`,
                    positive: (r.score / r.total_marks) > 0.5
                })));
            } catch (err) {
                console.error("Failed to fetch dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="bg-[#fcfdfe] min-h-screen pb-20 relative pt-4 md:pt-6">
            <div className="px-5 mb-4 max-w-6xl mx-auto relative z-10">
                <div className="mb-2">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                        Hello, <span className="text-[#3b6a9a]">{user?.name?.split(' ')[0] || "Architect"}</span> 👋
                    </h1>
                    <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">Ready to design your future?</p>
                </div>

                <div className="flex items-end justify-between mb-6">
                    <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Your Progress</p>
                        <h3 className="text-2xl font-black text-gray-900 leading-none">Continue Journey</h3>
                    </div>
                    <Link to="/tests" className="px-4 py-2 bg-white rounded-lg text-[10px] font-black text-[#3b6a9a] border border-gray-100 shadow-sm hover:shadow-md transition-all uppercase tracking-widest">View All</Link>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                    {recentResults.map((result, idx) => (
                        <div key={idx} className="min-w-[180px] bg-white/60 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white flex flex-col gap-2.5 hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate leading-none">{result.title}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-gray-900 tracking-tight">{result.score.split('/')[0]}</span>
                                <span className="text-xs font-black text-gray-300">/{result.score.split('/')[1]}</span>
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg w-fit ${result.positive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                                }`}>
                                {result.positive ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                                {result.trend}
                            </div>
                        </div>
                    ))}
                    {recentResults.length === 0 && !loading && (
                        <div className="w-full py-8 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ready to start your first test?</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 max-w-6xl mx-auto relative z-10">
                <div className="mb-6 space-y-0.5">
                    <p className="text-[9px] font-black text-[#3b6a9a] uppercase tracking-[0.2em] leading-none">Available Exams</p>
                    <h3 className="text-2xl font-black text-gray-900">Mock Exam Center</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    {availableTests.map((test) => (
                        <div key={test.id} className="bg-white rounded-2xl overflow-hidden shadow-[0_20px_40px_-12px_rgba(0,0,0,0.03)] border border-gray-50 group transition-all hover:shadow-[0_40px_80px_-24px_rgba(59,106,154,0.12)] hover:-translate-y-2">
                            <div className="h-36 relative bg-gray-100 overflow-hidden">
                                <img
                                    src={test.image_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"}
                                    alt={test.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-60"></div>
                                <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-white">
                                    <span className="text-[8px] font-black text-[#3b6a9a] uppercase tracking-widest">{test.category || "EXAM"}</span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="text-lg font-black text-gray-900 mb-3 line-clamp-1">{test.title}</h4>
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100/50">
                                            <Clock size={12} className="text-[#3b6a9a]" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{test.duration_minutes} MIN</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100/50">
                                            <ClipboardList size={12} className="text-purple-600" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{test.question_ids.length} QUES</span>
                                    </div>
                                </div>
                                <Link
                                    to={`/test/${test.id}`}
                                    className="w-full py-3 rounded-xl flex items-center justify-center font-black text-base transition-all active:scale-95 bg-[#3b6a9a] text-white shadow-lg shadow-blue-500/10 hover:bg-[#2a4d72] hover:shadow-blue-500/20"
                                >
                                    Start Test
                                </Link>
                            </div>
                        </div>
                    ))}
                    {availableTests.length === 0 && !loading && (
                        <div className="col-span-full text-center py-12 bg-white/30 backdrop-blur-sm rounded-2xl border border-white border-dashed">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No tests available at the moment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Home = ({ user, setUser }) => {
    if (user?.role === 'admin') {
        return (
            <AdminLayout user={user} setUser={setUser}>
                <AdminDashboard />
            </AdminLayout>
        );
    }
    return user ? <DashboardView user={user} /> : <LandingView />;
};

export default Home;

