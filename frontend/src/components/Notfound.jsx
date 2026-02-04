import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

const NotFound = () => {
    return (
        <div className="h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-blue-100 shadow-xl shadow-blue-900/5 animate-pulse">
                <Compass className="w-10 h-10 text-[#3b6a9a]" />
            </div>
            <h1 className="text-8xl font-black text-gray-900 mb-4 tracking-tighter">404</h1>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Lost in Space (Reasoning)?</h2>
            <p className="text-gray-400 font-medium max-w-sm mb-10 leading-relaxed text-sm">
                The section you're looking for doesn't exist in our current blueprints. Let's get you back to the corridor.
            </p>
            <Link
                to="/"
                className="px-10 py-4 bg-[#3b6a9a] text-white rounded-2xl font-black shadow-lg shadow-blue-900/10 hover:bg-[#2a4d72] transition-all active:scale-95"
            >
                Return to Dashboard
            </Link>
        </div>
    );
};

export default NotFound;