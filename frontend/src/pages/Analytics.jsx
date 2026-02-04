import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { BarChart2, TrendingUp, Award, Calendar } from "lucide-react";

const Analytics = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get("/api/admin/my-results");
                setResults(res.data);
            } catch (err) {
                console.error("Failed to fetch results");
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const averageAccuracy = results.length > 0
        ? Math.round(results.reduce((acc, r) => acc + (r.score / r.total_marks), 0) / results.length * 100)
        : 0;

    return (
        <div className="min-h-screen bg-[#fcfdfe] pb-20">
            <header className="px-6 py-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-900 mb-1">My Performance</h1>
                <p className="text-gray-400 text-sm font-bold">In-depth analysis of your mock test journey.</p>
            </header>

            <div className="p-6">
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-blue-50 w-fit rounded-lg mb-2">
                            <TrendingUp className="text-[#3b6a9a] w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Rank</span>
                        <div className="text-xl font-black text-[#3b6a9a]">Student</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-green-50 w-fit rounded-lg mb-2">
                            <Award className="text-green-600 w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avg. Accuracy</span>
                        <div className="text-xl font-black text-gray-900">{averageAccuracy}%</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                    <h2 className="text-base font-black text-gray-900 mb-5 flex items-center gap-2">
                        <BarChart2 className="text-[#3b6a9a]" size={18} /> Exam History
                    </h2>

                    <div className="space-y-4">
                        {results.map((r) => (
                            <div key={r.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-black text-gray-300 group-hover:bg-blue-50 group-hover:text-[#3b6a9a] transition-all">
                                        {r.exam_title.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-gray-900">{r.exam_title}</div>
                                        <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                            <Calendar size={10} /> {new Date(r.completed_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-gray-900">{r.score}/{r.total_marks}</div>
                                    <div className={`text-[9px] font-bold ${(r.score / r.total_marks) > 0.5 ? "text-green-500" : "text-red-500"
                                        }`}>
                                        {Math.round((r.score / r.total_marks) * 100)}% Match
                                    </div>
                                </div>
                            </div>
                        ))}
                        {results.length === 0 && !loading && (
                            <div className="text-center py-8">
                                <p className="text-gray-400 text-sm font-bold">Take your first test to see analytics!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
