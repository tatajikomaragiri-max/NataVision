import React, { useState, useEffect } from "react";
import api from "../api/axios"
import { Users, FileText, ClipboardList, TrendingUp, Plus, Layout, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalStudents: 0, totalQuestions: 0, totalExams: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/api/admin/stats");
                setStats(res.data);
            } catch (err) {
                console.error("Failed to fetch stats");
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: "Total Students", value: stats.students || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/students" },
        { label: "Question Bank", value: stats.questions || 0, icon: FileText, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/upload-paper" },
        { label: "Active Exams", value: stats.exams || 0, icon: ClipboardList, color: "text-green-600", bg: "bg-green-50", link: "/admin/exams" },
        { label: "Growth", value: "+12%", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", link: "/admin" },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Command Center</h1>
                    <p className="text-gray-400 text-xs font-bold">Monitor platform growth and activities.</p>
                </div>

                <div className="flex gap-4">
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {cards.map((stat, index) => (
                    <Link
                        key={index}
                        to={stat.link}
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={16} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-gray-900">{stat.value}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm h-64 flex items-center justify-center">
                    <div className="text-center">
                        <TrendingUp size={48} className="text-blue-100 mb-4 mx-auto" />
                        <p className="text-gray-400 font-bold italic">Analytics visualization coming in v2.0</p>
                    </div>
                </div>

                <div className="bg-[#1e293b] p-8 rounded-[3rem] text-white shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black mb-4">Quick Actions</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-sm font-bold opacity-70 hover:opacity-100 cursor-pointer transition-all">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div> Notify all students
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold opacity-70 hover:opacity-100 cursor-pointer transition-all">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div> Export results CSV
                            </li>
                            <li className="flex items-center gap-3 text-sm font-bold opacity-70 hover:opacity-100 cursor-pointer transition-all">
                                <div className="w-2 h-2 rounded-full bg-purple-400"></div> Database maintainance
                            </li>
                        </ul>
                    </div>
                    <div className="pt-6 border-t border-white/10 mt-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">System Status: Stable</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
