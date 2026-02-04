import React, { useState } from "react";
import api from "../api/axios"
import { Upload, CheckCircle2, AlertCircle, Clock, Key, FileText } from "lucide-react";

const UploadPaper = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [answerKey, setAnswerKey] = useState("");

    const handleExtractQuestions = async () => {
        if (!file) {
            setStatus({ type: "error", message: "Please select a PDF file first" });
            return;
        }

        const formData = new FormData();
        formData.append("paper", file);
        formData.append("answerKey", answerKey);

        try {
            setLoading(true);
            setStatus({ type: "info", message: "AI is analyzing your PDF... This may take a moment." });

            const res = await api.post("/api/admin/extract-pdf", formData);

            if (res.data.questionCount > 0) {
                setStatus({
                    type: "success",
                    message: `Success! Extracted and stored ${res.data.questionCount} questions in the question bank.`
                });
            } else {
                setStatus({
                    type: "error",
                    message: "No questions could be extracted from this PDF. Please try a clearer PDF."
                });
            }

            // Reset
            setFile(null);
            setAnswerKey("");
        } catch (err) {
            setStatus({
                type: "error",
                message: err.response?.data?.message || err.message || "Extraction failed. Please try a clearer PDF."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-6 md:pb-10 px-4">
            <header className="mb-4 text-center">
                <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Upload Question Papers</h1>
                <p className="text-gray-400 text-xs font-bold">Extract questions from PDFs into your bank</p>
            </header>

            {status && (
                <div className={`mb-6 p-5 rounded-2xl border-2 flex items-center gap-3 transition-all ${status.type === "success" ? "bg-green-50 border-green-100 text-green-700" :
                    status.type === "info" ? "bg-blue-50 border-blue-100 text-blue-700" :
                        "bg-red-50 border-red-100 text-red-700"
                    }`}>
                    {status.type === "success" ? <CheckCircle2 size={20} /> : status.type === "info" ? <Clock size={20} /> : <AlertCircle size={20} />}
                    <div className="flex-1">
                        <span className="font-black text-sm block">{status.message}</span>
                    </div>
                    <button onClick={() => setStatus(null)} className="hover:opacity-50 font-black text-sm">Close</button>
                </div>
            )}

            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-4">
                <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 flex items-center gap-2">
                        <FileText size={12} className="text-[#3b6a9a]" /> Question Paper (PDF)
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`px-6 py-4 rounded-xl border-2 border-dashed flex items-center gap-3 transition-all ${file ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-200 text-gray-400"
                            }`}>
                            <Upload size={18} />
                            <span className="font-bold text-sm truncate">{file ? file.name : "Select PDF"}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 ml-1 flex items-center gap-2">
                        <Key size={12} className="text-[#3b6a9a]" /> Answer Key (Optional)
                    </label>
                    <textarea
                        value={answerKey}
                        onChange={(e) => setAnswerKey(e.target.value)}
                        placeholder="Q1: B&#10;Q2: A..."
                        className="w-full h-32 px-4 py-3 rounded-lg bg-gray-50 border-2 border-transparent focus:border-[#3b6a9a] focus:bg-white transition-all font-mono text-xs outline-none resize-none"
                    />
                </div>

                <button
                    onClick={handleExtractQuestions}
                    disabled={loading || !file}
                    className="w-full py-3 rounded-lg bg-[#3b6a9a] text-white font-black text-sm hover:bg-[#2a4d72] shadow-lg shadow-blue-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Upload size={16} /> {loading ? "Extracting..." : "Extract & Store Questions"}
                </button>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 text-center font-bold">
                        Questions will be stored in your question bank. Use "Create Exam" to generate exams from stored questions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadPaper;
