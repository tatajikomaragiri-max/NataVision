import React, { useState, useEffect } from "react";
import { Compass, Clock, ChevronLeft, ChevronRight, Check, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios"

const MockTest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [exam, setExam] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const isPaperMode = exam?.paper_url;

    useEffect(() => {
        const loadExam = async () => {
            try {
                const res = await api.get(`/api/admin/exams/${id}/questions`);
                setExam(res.data.exam);
                setQuestions(res.data.questions);
                setUserAnswers(new Array(res.data.questions.length).fill(null));
                setTimeLeft((res.data.exam.duration_minutes || 60) * 60);
            } catch (err) {
                console.error("Failed to load exam");
            } finally {
                setLoading(false);
            }
        };
        loadExam();
    }, [id]);

    useEffect(() => {
        if (loading || submitting || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, submitting, timeLeft]);

    useEffect(() => {
        if (timeLeft <= 0 && !loading && !submitting) {
            console.log("Time up! Auto-submitting...");
            if (isPaperMode) {
                navigate("/");
            } else if (questions.length > 0) {
                handleSubmit();
            }
        }
    }, [timeLeft, loading, submitting, isPaperMode, questions.length, navigate]);

    const handleSubmit = async (finalAnswers = userAnswers) => {
        try {
            setSubmitting(true);
            const res = await api.post("/api/admin/submit-exam", {
                examId: id,
                answers: finalAnswers
            });
            navigate(`/results/${res.data.id}`);
        } catch (err) {
            alert("Failed to submit exam: " + (err.response?.data?.message || "Unknown error"));
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleNext = async () => {
        const updatedAnswers = [...userAnswers];
        updatedAnswers[currentIdx] = selectedOption;
        setUserAnswers(updatedAnswers);

        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedOption(updatedAnswers[currentIdx + 1] ?? null);
        } else {
            handleSubmit(updatedAnswers);
        }
    };

    const handleBack = () => {
        if (currentIdx > 0) {
            const updatedAnswers = [...userAnswers];
            updatedAnswers[currentIdx] = selectedOption;
            setUserAnswers(updatedAnswers);
            setCurrentIdx(prev => prev - 1);
            setSelectedOption(updatedAnswers[currentIdx - 1] ?? null);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-[#3b6a9a] bg-[#f8fafc]">Initializing Premium Exam...</div>;

    const currentQuestion = questions[currentIdx];
    const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

    if (isPaperMode && (!questions || questions.length === 0)) {
        return (
            <div className="h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
                <header className="px-6 py-3 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <FileText className="w-4 h-4 text-[#3b6a9a]" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">PAPER MODE</p>
                            <h2 className="text-sm font-black text-gray-900 leading-none truncate max-w-[200px]">{exam.title}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <Clock className="w-3.5 h-3.5 text-[#3b6a9a]" />
                            <span className="font-black text-base font-mono text-gray-900 tracking-tighter">{formatTime(timeLeft)}</span>
                        </div>
                        <button
                            onClick={() => { if (window.confirm("Exit test?")) navigate("/") }}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all active:scale-95"
                        >
                            Quit
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden p-8">
                    <div className="h-full max-w-5xl mx-auto bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100">
                        {exam.paper_url.toLowerCase().endsWith(".pdf") ? (
                            <iframe
                                src={`/uploads/${exam.paper_url}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Exam Paper"
                            />
                        ) : (
                            <div className="w-full h-full overflow-auto p-4 flex justify-center">
                                <img
                                    src={`/uploads/${exam.paper_url}`}
                                    alt="Exam Paper"
                                    className="max-w-full h-auto shadow-lg rounded-[2rem]"
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f8fafc] flex flex-col overflow-hidden select-none">
            {/* Compact Header */}
            <header className="px-6 py-3 flex items-center justify-between bg-white border-b border-gray-100 z-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <FileText className="w-4 h-4 text-[#3b6a9a]" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 leading-none truncate max-w-[200px]">{exam.title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                        <Clock className="w-3.5 h-3.5 text-[#3b6a9a]" />
                        <span className="font-black text-sm font-mono text-gray-900">{formatTime(timeLeft)}</span>
                    </div>
                    <button
                        onClick={() => { if (window.confirm("Exit test? Progress will be lost.")) navigate("/") }}
                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                        Quit
                    </button>
                </div>
            </header>

            {/* Main Test Area - Non Scrolling */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 pb-12 relative">
                <div className="w-full max-w-xl">
                    {/* Progress Bar - Compact */}
                    <div className="mb-6">
                        <div className="h-1 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div
                                className="h-full bg-[#3b6a9a] transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Compact Question Card - Fixed Height with Internal Scroll */}
                    <div className="bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col max-h-[calc(100vh-180px)] overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                            <div className="mb-5">
                                <span className="inline-block px-3 py-1 bg-blue-50 text-[80%] font-black text-[#3b6a9a] rounded-full uppercase tracking-widest border border-blue-50 mb-3">
                                    Q{currentIdx + 1} / {questions.length}
                                </span>
                                <h1 className="text-xl font-bold text-gray-900 leading-snug">
                                    {currentQuestion?.question_text || currentQuestion?.text}
                                </h1>
                            </div>

                            {currentQuestion?.image_url && (
                                <div className="mb-6 rounded-xl overflow-hidden border border-gray-50">
                                    <img
                                        src={currentQuestion.image_url.startsWith('http') ? currentQuestion.image_url : `/uploads/${currentQuestion.image_url}`}
                                        alt="Question Context"
                                        className="w-full h-auto object-contain max-h-[220px] bg-gray-50"
                                    />
                                </div>
                            )}

                            <div className="grid gap-2.5 pb-2">
                                {currentQuestion?.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedOption(idx)}
                                        className={`group w-full p-3.5 text-left rounded-xl border transition-all flex items-center justify-between ${selectedOption === idx
                                            ? "bg-blue-50/30 border-[#3b6a9a]"
                                            : "bg-white border-gray-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded flex items-center justify-center font-black text-[10px] border transition-all ${selectedOption === idx
                                                ? "bg-[#3b6a9a] border-[#3b6a9a] text-white"
                                                : "bg-gray-50 border-gray-100 text-gray-400 font-mono"
                                                }`}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={`text-[15px] font-bold ${selectedOption === idx ? "text-[#3b6a9a]" : "text-gray-700"}`}>
                                                {option}
                                            </span>
                                        </div>
                                        {selectedOption === idx && <Check className="w-3.5 h-3.5 text-[#3b6a9a]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-white">
                            <button
                                onClick={handleBack}
                                disabled={currentIdx === 0}
                                className={`flex items-center gap-1.5 px-3 py-2 font-black text-[10px] uppercase tracking-widest transition-all ${currentIdx === 0 ? "opacity-0 invisible" : "text-gray-400 hover:text-gray-900"
                                    }`}
                            >
                                <ChevronLeft size={14} /> Previous
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#3b6a9a] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a4d72] shadow-lg shadow-blue-500/10 active:scale-95"
                            >
                                {currentIdx === questions.length - 1 ? "Submit Paper" : "Save & Next"}
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MockTest;
