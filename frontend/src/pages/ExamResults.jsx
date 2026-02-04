import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios"
import { Award, Clock, ArrowRight, Home, RefreshCcw, CheckCircle2, XCircle, BarChart3, ChevronLeft } from "lucide-react";

const ExamResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await api.get(`/api/admin/results/${id}`);
                setResult(res.data);
            } catch (err) {
                console.error("Failed to fetch result");
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#3b6a9a]">Calculating Score...</div>;
    if (!result) return <div className="p-10 text-center font-black">Result Not Found</div>;

    const accuracy = Math.round((result.correct_count / (result.correct_count + result.wrong_count)) * 100);

    const stats = [
        { label: "Correct Answers", value: result.correct_count, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
        { label: "Wrong Answers", value: result.wrong_count, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
        { label: "Accuracy", value: `${accuracy}%`, icon: BarChart3, color: "text-blue-500", bg: "bg-blue-50" },
    ];

    return (
        <div className="h-screen bg-white flex flex-col items-center select-none overflow-hidden">
            {/* Compact Header */}
            <header className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm z-50">
                <button
                    onClick={() => navigate("/")}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-900" />
                </button>
                <h2 className="text-base font-black text-gray-900 uppercase tracking-widest">Performance Analysis</h2>
                <div className="w-10"></div>
            </header>

            <main className="w-full max-w-md px-6 flex flex-col items-center justify-center flex-1 py-4 overflow-y-auto no-scrollbar">
                {/* Score Card - Minimized */}
                <div className="w-full bg-blue-50/30 border border-blue-100/50 p-8 rounded-3xl text-center mb-6 relative overflow-hidden">


                    <span className="text-[9px] font-black tracking-[0.2em] text-[#3b6a9a] uppercase mb-4 block">AGGREGATE SCORE</span>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                        <span className="text-7xl font-black text-gray-900 leading-none">{result.score}</span>
                        <span className="text-xl font-bold text-gray-300">/{result.total_marks}</span>
                    </div>

                    <div className="px-4 py-2 bg-white rounded-xl inline-block border border-blue-50">
                        <p className="text-xs font-bold text-gray-900">
                            Exam: <span className="text-[#3b6a9a] font-black uppercase text-[10px]">{result.exam_title}</span>
                        </p>
                    </div>
                </div>

                {/* Stat Grid - Compact & Static */}
                <div className="w-full grid gap-3 mb-6">
                    {stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 ${stat.bg} rounded-lg`}>
                                        <Icon className={`w-4 h-4 ${stat.color}`} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{stat.label}</span>
                                </div>
                                <span className={`text-base font-black ${stat.color}`}>{stat.value}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Motivational Quote - Discrete */}
                <div className="w-full bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-6 text-center">
                    <p className="text-gray-400 text-[11px] font-medium leading-relaxed italic">
                        "Architecture begins where engineering ends." — Your performance shows your potential in the industry.
                    </p>
                </div>

                {/* Final Actions - Compact */}
                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => navigate(`/results/${id}/review`)}
                        className="w-full bg-[#3b6a9a] text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 active:scale-95"
                    >
                        Review
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="w-full bg-gray-50 text-gray-900 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest border border-gray-100 active:scale-95"
                    >
                        Dashboard
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ExamResults;
