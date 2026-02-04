import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { Sparkles, CheckCircle2, AlertCircle, Clock, Hash, FileText } from "lucide-react";

const CreateExam = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("180");
    const [questionCount, setQuestionCount] = useState("50");
    const [availableQuestions, setAvailableQuestions] = useState(0);

    useEffect(() => {
        fetchQuestionCount();
    }, []);

    const fetchQuestionCount = async () => {
        try {
            const res = await api.get("/api/admin/stats");
            setAvailableQuestions(res.data.questions);
        } catch (err) {
            console.error("Failed to fetch question count");
        }
    };

    const handleCreateExam = async () => {
        if (!title) {
            setStatus({ type: "error", message: "Please enter an exam title" });
            return;
        }

        const qCount = parseInt(questionCount);
        if (qCount <= 0 || qCount > availableQuestions) {
            setStatus({
                type: "error",
                message: `Please enter a valid question count (1-${availableQuestions})`
            });
            return;
        }

        try {
            setLoading(true);
            setStatus({ type: "info", message: "Creating exam with random questions..." });

            await api.post("/api/admin/generate-exam", {
                title,
                duration: parseInt(duration),
                questionCount: qCount,
                category: null // Can be extended later for category filtering
            });

            setStatus({
                type: "success",
                message: `Success! Exam "${title}" created with ${qCount} random questions.`
            });

            // Reset
            setTitle("");
            setQuestionCount("50");
            fetchQuestionCount(); // Refresh count
        } catch (err) {
            setStatus({
                type: "error",
                message: err.response?.data?.message || "Failed to create exam"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-6 md:pb-10 px-4">
            <header className="mb-4 text-center">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Create New Exam</h1>
                <p className="text-gray-400 text-xs font-bold">Generate exams from your question bank</p>
            </header>

            {status && (
                <div className={`mb-6 p-5 rounded-2xl border-2 flex items-center gap-3 transition-all ${status.type === "success" ? "bg-green-50 border-green-100 text-green-700" :
                    status.type === "info" ? "bg-blue-50 border-blue-100 text-blue-700" :
                        "bg-red-50 border-red-100 text-red-700"
                    }`}>
                    {status.type === "success" ? <CheckCircle2 size={20} /> :
                        status.type === "info" ? <Clock size={20} /> :
                            <AlertCircle size={20} />}
                    <div className="flex-1">
                        <span className="font-black text-sm block">{status.message}</span>
                    </div>
                    <button onClick={() => setStatus(null)} className="hover:opacity-50 font-black text-sm">Close</button>
                </div>
            )}

            <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-lg shadow-gray-200/50 space-y-4">
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Hash className="text-[#3b6a9a]" size={16} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Questions</span>
                    </div>
                    <span className="text-lg font-black text-[#3b6a9a]">{availableQuestions}</span>
                </div>

                <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1 flex items-center gap-2">
                        <FileText size={12} className="text-[#3b6a9a]" /> Exam Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. NATA Final Mock 2025"
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border-2 border-transparent focus:border-[#3b6a9a] focus:bg-white transition-all font-bold text-sm outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                            Duration (Min)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border-2 border-transparent focus:border-[#3b6a9a] focus:bg-white transition-all font-black text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">
                            Questions
                        </label>
                        <input
                            type="number"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(e.target.value)}
                            max={availableQuestions}
                            min="1"
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border-2 border-transparent focus:border-[#3b6a9a] focus:bg-white transition-all font-black text-sm outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={handleCreateExam}
                    disabled={loading || !title || availableQuestions === 0}
                    className="w-full py-3 rounded-lg bg-[#3b6a9a] text-white font-black text-sm hover:bg-[#2a4d72] shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Sparkles size={16} /> {loading ? "Creating..." : "Create Exam"}
                </button>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center font-bold">
                        Questions will be randomly selected from your question bank
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CreateExam;
