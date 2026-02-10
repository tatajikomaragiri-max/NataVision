import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Plus, Shuffle, Calendar, Clock, CheckCircle, Trash2, Eye, EyeOff } from "lucide-react";

const AdminExams = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenModal, setShowGenModal] = useState(false);
    const [formData, setFormData] = useState({ title: "", questionCount: 125, duration: 180 });

    const fetchExams = async () => {
        try {
            const res = await api.get("/api/admin/exams");
            setExams(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const handleGenerate = async (e) => {
        e.preventDefault();
        try {
            await api.post("/api/admin/generate-exam", formData);
            setShowGenModal(false);
            fetchExams();
        } catch (err) {
            alert(err.response?.data?.message || "Generation failed");
        }
    };

    const handleTogglePublish = async (id) => {
        try {
            await api.patch(`/api/admin/exams/${id}/toggle-publish`);
            fetchExams();
        } catch (err) {
            alert("Failed to toggle publish status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this exam?")) {
            try {
                await api.delete(`/api/admin/exams/${id}`);
                fetchExams();
            } catch (err) {
                alert("Failed to delete exam");
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="max-w-md">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Manage Exams</h1>
                    <p className="text-gray-400 text-xs font-bold">Generate and publish jumbled mock tests.</p>
                </div>
                <button
                    onClick={() => setShowGenModal(true)}
                    className="w-full md:w-auto px-6 py-4 bg-[#3b6a9a] text-white rounded-2xl font-black shadow-lg hover:bg-[#2a4d72] flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Plus size={20} /> Create New Exam
                </button>
            </div>

            <div className="grid gap-3">
                {exams.map((exam) => (
                    <div key={exam.id} className="bg-white p-4 md:p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                <Shuffle className="text-[#3b6a9a] w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg md:text-xl font-black text-gray-900 mb-1 md:mb-2 truncate">{exam.title}</h3>
                                <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-gray-400">
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {exam.duration_minutes} min</span>
                                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(exam.created_at).toLocaleDateString()}</span>
                                    {exam.paper_url ? (
                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">Paper Mode</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-blue-50 text-[#3b6a9a] rounded-full">{exam.question_ids?.length || 0} Questions</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50 md:border-0 md:pt-0">
                            <button
                                onClick={() => handleTogglePublish(exam.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${exam.is_published
                                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                    }`}
                            >
                                {exam.is_published ? <CheckCircle size={14} /> : <EyeOff size={14} />}
                                {exam.is_published ? "Published" : "Draft"}
                            </button>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleDelete(exam.id)}
                                    className="flex-1 md:flex-none px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-black text-xs transition-colors border border-transparent hover:border-red-100"
                                >
                                    Delete
                                </button>
                                <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b6a9a] text-white rounded-lg font-black text-xs hover:bg-[#2a4d72] shadow-sm transition-all">
                                    Go Live
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {exams.length === 0 && !loading && (
                    <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100"> {/* Reduced py and rounded */}
                        <p className="text-gray-400 font-bold text-sm">No exams generated yet.</p> {/* Reduced text size */}
                    </div>
                )}
            </div>

            {showGenModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl md:rounded-[2rem] p-6 md:p-8 shadow-2xl">
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4 md:mb-6 text-center md:text-left">Generate Automatic Exam</h2>
                        <form onSubmit={handleGenerate} className="space-y-4 md:space-y-6">
                            <div>
                                <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Exam Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 md:p-4 rounded-xl border-2 border-gray-50 focus:border-blue-100 outline-none font-bold text-sm"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. NATA Full Mock Test 6"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Questions</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 md:p-4 rounded-xl border-2 border-gray-50 focus:border-blue-100 outline-none font-bold text-sm"
                                        value={formData.questionCount}
                                        onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Duration (Min)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 md:p-4 rounded-xl border-2 border-gray-50 focus:border-blue-100 outline-none font-bold text-sm"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowGenModal(false)}
                                    className="order-2 sm:order-1 flex-1 py-3 md:py-4 bg-gray-50 rounded-2xl font-black text-gray-400 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="order-1 sm:order-2 flex-[2] py-3 md:py-4 bg-[#3b6a9a] text-white rounded-2xl font-black shadow-lg hover:bg-[#2a4d72]"
                                >
                                    Shuffle & Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExams;
