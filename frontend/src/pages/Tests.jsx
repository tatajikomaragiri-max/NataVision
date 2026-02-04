import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { Link } from "react-router-dom";
import { Search, Clock, ClipboardList, Filter } from "lucide-react";

const Tests = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get("/api/admin/published-exams");
                setExams(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const filteredExams = exams.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#fcfdfe] pb-20">
            <header className="px-6 py-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-black text-gray-900 mb-4">Exam Library</h1>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search for mock tests..."
                        className="w-full pl-10 pr-10 py-2.5 bg-[#f1f5f9] rounded-xl border-none outline-none font-bold text-sm text-gray-600 focus:ring-2 ring-blue-100 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                        <Filter className="w-3.5 h-3.5 text-[#3b6a9a]" />
                    </button>
                </div>
            </header>

            <div className="p-6">
                <div className="grid gap-4">
                    {filteredExams.map((test) => (
                        <div key={test.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group transition-all hover:shadow-xl">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="text-lg font-black text-gray-900 leading-tight flex-1">{test.title}</h4>
                                    <span className="bg-blue-50 text-[#3b6a9a] text-[9px] font-black px-2.5 py-1 rounded-lg">Mock Test</span>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 mb-5">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} className="text-[#3b6a9a]" />
                                        {test.duration_minutes} min
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ClipboardList size={14} className="text-[#3b6a9a]" />
                                        {test.question_ids.length} Questions
                                    </div>
                                </div>
                                <Link
                                    to={`/test/${test.id}`}
                                    className="w-full py-3 rounded-xl flex items-center justify-center font-black text-base transition-all active:scale-[0.98] bg-[#3b6a9a] text-white shadow-lg hover:bg-[#2a4d72]"
                                >
                                    Attempt Now
                                </Link>
                            </div>
                        </div>
                    ))}
                    {filteredExams.length === 0 && !loading && (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                            <p className="text-gray-400 text-sm font-bold">No tests found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tests;
