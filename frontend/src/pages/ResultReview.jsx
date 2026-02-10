import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios"
import { ChevronLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const ResultReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const res = await api.get(`/api/admin/results/${id}/review`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch review data:", err);
                setError(err.response?.data?.message || err.message || "Failed to load review");
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#3b6a9a]">Loading Review...</div>;
    if (error) return <div className="p-10 text-center"><div className="font-black text-red-600 mb-2">Error Loading Review</div><div className="text-sm text-gray-600">{error}</div></div>;
    if (!data) return <div className="p-10 text-center font-black">Review Not Available</div>;

    const { questions, answers } = data;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24">
            <header className="px-6 py-10 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 hover:bg-gray-50 rounded-2xl transition-all"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 leading-tight">Review Answers</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{data.exam_title}</p>
                    </div>
                </div>
            </header>

            <div className="p-6 max-w-2xl mx-auto space-y-8">
                {questions.map((q, qidx) => {
                    const userAnswer = answers[qidx];
                    const isCorrect = userAnswer === q.correct_index;

                    return (
                        <div key={q.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${qidx * 100}ms` }}>
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {qidx + 1}</span>
                                    {isCorrect ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black">
                                            <CheckCircle size={14} /> CORRECT
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black">
                                            <XCircle size={14} /> INCORRECT
                                        </div>
                                    )}
                                </div>

                                <h2 className="text-lg font-bold text-gray-900 mb-6 leading-tight">{q.question_text}</h2>

                                {q.image_url && (
                                    <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 border border-gray-100">
                                        <img src={q.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {q.options.map((option, oidx) => {
                                        const isUserSelected = userAnswer === oidx;
                                        const isCorrectOption = q.correct_index === oidx;

                                        let borderClass = "border-gray-100";
                                        let bgClass = "bg-white";
                                        let tag = null;

                                        if (isCorrectOption) {
                                            borderClass = "border-green-500";
                                            bgClass = "bg-green-50/30";
                                            tag = <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-green-100 shadow-sm">Correct Answer</span>;
                                        } else if (isUserSelected && !isCorrect) {
                                            borderClass = "border-red-500";
                                            bgClass = "bg-red-50/30";
                                            tag = <span className="text-[10px] font-black text-red-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-red-100 shadow-sm">Your Answer</span>;
                                        }

                                        return (
                                            <div key={oidx} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${borderClass} ${bgClass} ${isUserSelected || isCorrectOption ? "shadow-sm" : ""}`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isCorrectOption ? "bg-green-500 text-white" :
                                                        (isUserSelected ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400")
                                                        }`}>
                                                        {String.fromCharCode(65 + oidx)}
                                                    </span>
                                                    <span className={`text-base font-bold ${isUserSelected || isCorrectOption ? "text-gray-900" : "text-gray-500"}`}>
                                                        {option}
                                                    </span>
                                                </div>
                                                {tag}
                                            </div>
                                        );
                                    })}
                                </div>

                                {!isCorrect && (
                                    <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl flex gap-3">
                                        <AlertCircle className="text-[#3b6a9a] shrink-0" size={18} />
                                        <p className="text-xs font-bold text-blue-900/60 leading-relaxed italic">
                                            Tip: Architecture often focuses on the intersection of form and function. Re-read the section on spatial reasoning.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
                <button
                    onClick={() => navigate("/")}
                    className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all"
                >
                    Finish Review
                </button>
            </div>
        </div>
    );
};

export default ResultReview;
