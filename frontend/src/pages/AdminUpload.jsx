import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { Upload, CheckCircle2, AlertCircle, Plus, Sparkles, Clock, ArrowLeft, Code2, Key } from "lucide-react";

const AdminUpload = ({ mode: initialMode }) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [duration, setDuration] = useState("180");
    const [answerKey, setAnswerKey] = useState("");

    useEffect(() => {
        setStatus(null);
        setFile(null);
        setTitle("");
        setAnswerKey("");
    }, [initialMode]);

    const handleFileUpload = async (e) => {
        if (e) e.preventDefault();
        if (!file || !title) {
            setStatus({ type: "error", message: "Please enter a title and select a file first." });
            return;
        }

        const formData = new FormData();
        formData.append("paper", file);
        formData.append("title", title);
        formData.append("duration", duration);

        try {
            setLoading(true);
            await api.post("/api/admin/upload-paper", formData);
            setStatus({ type: "success", message: "Single Sheet Exam created successfully!" });
            setFile(null);
            setTitle("");
        } catch (err) {
            setStatus({ type: "error", message: err.response?.data?.message || "Upload failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleAIExtraction = async () => {
        if (!file || !title) {
            setStatus({ type: "error", message: "Please enter a title and select a PDF first" });
            return;
        }
        const formData = new FormData();
        formData.append("paper", file);
        formData.append("answerKey", answerKey);
        formData.append("title", title);
        formData.append("duration", duration);

        try {
            setLoading(true);
            setStatus({ type: "info", message: "AI is analyzing your PDF... This may take a moment." });

            const res = await api.post("/api/admin/extract-pdf", formData);

            if (res.data.questionCount === 0) {
                throw new Error("No questions could be extracted from this PDF.");
            }

            setStatus({
                type: "success",
                message: res.data.message
            });

            // Reset
            setFile(null);
            setTitle("");
            setAnswerKey("");
        } catch (err) {
            setStatus({
                type: "error",
                message: err.response?.data?.message || err.message || "Automation failed. Please try a clearer PDF."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-6 md:pb-10 px-4">
            <header className="mb-4 md:mb-6 text-center">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Create New Exam</h1>
                <p className="text-gray-400 text-xs font-bold">Upload PDF and paste Answer Key to go live.</p>
            </header>

            {status && (
                <div className={`mb-6 p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${status.type === "success" ? "bg-green-50 border-green-100 text-green-700" :
                    status.type === "info" ? "bg-blue-50 border-blue-100 text-blue-700" :
                        "bg-red-50 border-red-100 text-red-700"
                    }`}>
                    {status.type === "success" ? <CheckCircle2 size={18} /> : status.type === "info" ? <Clock size={18} /> : <AlertCircle size={18} />}
                    <div className="flex-1">
                        <span className="font-black text-sm block">{status.message}</span>
                    </div>
                    <button onClick={() => setStatus(null)} className="hover:opacity-50 font-black text-xs">Close</button>
                </div>
            )
            }

            <div className="space-y-8">
                <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-4">
                    <div className="space-y-3 md:space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Exam Title</label>
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
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Duration (Min)</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border-2 border-transparent focus:border-[#3b6a9a] focus:bg-white transition-all font-black text-sm outline-none"
                                />
                            </div>
                            <div className="relative group">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Paper (PDF)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`px-4 py-2.5 rounded-lg border-2 border-dashed flex items-center gap-2 transition-all ${file ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-200 text-gray-400"
                                        }`}>
                                        <Upload size={14} />
                                        <span className="font-bold text-xs truncate">{file ? file.name : "Select PDF"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1 flex items-center gap-2">
                                <Key size={12} className="text-[#3b6a9a]" /> Answer Key
                            </label>
                            <textarea
                                value={answerKey}
                                onChange={(e) => setAnswerKey(e.target.value)}
                                placeholder="Q1: B, Q2: A..."
                                className="w-full h-32 px-4 py-3 rounded-lg bg-gray-50 border-2 border-transparent focus:border-[#3b6a9a] focus:bg-white transition-all font-mono text-xs outline-none resize-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAIExtraction}
                        disabled={loading || !file || !title}
                        className="w-full py-3.5 rounded-xl bg-[#3b6a9a] text-white font-black text-sm hover:bg-[#2a4d72] shadow-xl shadow-blue-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Sparkles size={20} /> {loading ? "Creating..." : "Extract & Create Exam"}
                    </button>

                    {initialMode === 'upload' && (
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={handleFileUpload}
                                disabled={loading || !file || !title}
                                className="w-full py-4 text-[#3b6a9a] font-bold hover:underline transition-all"
                            >
                                Or Upload as Single Sheet Paper (No extraction)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default AdminUpload;
