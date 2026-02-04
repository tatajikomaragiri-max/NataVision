import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { User, Mail, Calendar, Search } from "lucide-react";

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get("/api/admin/students");
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to fetch students");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="max-w-md">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Student Directory</h1>
                    <p className="text-gray-400 text-xs font-bold">Manage and view all registered students.</p>
                </div>

                <div className="relative w-full md:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3b6a9a] transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[#3b6a9a] transition-all outline-none font-bold text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[800px] md:min-w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                                    <th className="hidden sm:table-cell px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                                    <th className="px-6 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((s) => (
                                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group text-xs">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#3b6a9a] font-black group-hover:scale-110 transition-transform text-[10px]">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 truncate max-w-[120px]">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5 truncate max-w-[150px]">
                                                <Mail size={10} className="text-[#3b6a9a]" /> {s.email}
                                            </span>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-3">
                                            <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                                                <Calendar size={10} className="text-[#3b6a9a]" /> {new Date(s.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded">Active</span>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStudents.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-12 text-center text-gray-400 font-bold text-sm">
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStudents;
