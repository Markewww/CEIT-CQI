import React from "react";
import { useAuth } from "@/context/AuthContext";
// Import your existing header layout subcomponent cleanly
import Header from "@/components/Header"; 

const UsersDashboard: React.FC = () => {
    // Extract the live authenticated user's state profile attributes from context
    const { user } = useAuth();
    
    // Fallback primitives to keep layout metrics completely safe if context is loading
    const instructorName = user?.first_name ? `${user.first_name} ${user.last_name}` : "Faculty Member";
    const userRole = user?.role || "Faculty";
    const assignedDept = user?.department_code || "CEIT";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
            {/* Functional Sticky Global Top Navigation Toolbar Header banner */}
            <Header />

            {/* Core Body Container Workspace Area */}
            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 animate-fade-in">
                
                {/* Section 1: Welcome Greeting Billboard Banner */}
                <div className="w-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat">
                            Welcome Back, <span className="text-primary">{instructorName}</span>!
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">
                            Access evaluation parameters, complete CQI assessments, and monitor target achievement thresholds.
                        </p>
                    </div>
                    
                    {/* Context metadata department pill badge */}
                    <div className="flex flex-col gap-1 items-start sm:items-end shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Scope</span>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-amber-500/10 text-amber-600 font-extrabold px-2.5 py-1 rounded-lg border border-amber-500/20 font-montserrat uppercase tracking-wide">
                                {userRole}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary font-black px-2.5 py-1 rounded-lg border border-primary/20 font-montserrat uppercase">
                                {assignedDept}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Faculty Tasks Analytics Dashboard Grid Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Block A: Assigned Classes Tracker Shortcut Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-all cursor-pointer">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center text-sm font-black font-montserrat mb-4">
                                CL
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 font-montserrat uppercase tracking-wide">My Class Loads</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                View your active assigned section blocks, schedule timelines, and mapped course registries.
                            </p>
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-5 flex justify-between items-center text-xs font-bold text-primary group-hover:underline">
                            <span>Manage Schedules</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Block B: CQI Evaluations Matrix Input Shortcut Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-all cursor-pointer">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-sm font-black font-montserrat mb-4">
                                CQ
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 font-montserrat uppercase tracking-wide">Course Attainment Matrices</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                Input direct student raw item scores and map core threshold target distributions across active exams.
                            </p>
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-5 flex justify-between items-center text-xs font-bold text-emerald-600 group-hover:underline">
                            <span>Input Metrics</span>
                            <span>→</span>
                        </div>
                    </div>

                    {/* Block C: Historic Analytics and Outcome Reports Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-all cursor-pointer">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-sm font-black font-montserrat mb-4">
                                RP
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 font-montserrat uppercase tracking-wide">Performance Summary Reports</h3>
                            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                                Generate and print structured curriculum compliance sheets required for academic auditing.
                            </p>
                        </div>
                        <div className="border-t border-slate-100 pt-3 mt-5 flex justify-between items-center text-xs font-bold text-amber-600 group-hover:underline">
                            <span>Review Insights</span>
                            <span>→</span>
                        </div>
                    </div>

                </div>

                {/* Section 3: Dynamic Workspace Content Main Canvas */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm min-h-75 flex flex-col items-center justify-center border-dashed text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-sm mb-3">
                        🗂️
                    </div>
                    <span className="text-slate-500 font-bold text-sm font-montserrat">Active Term Evaluation Context Canvas</span>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                        This sub-workspace container updates state elements to show your student mark entry cards based on which tile metric is selected above.
                    </p>
                </div>

            </main>
        </div>
    );
};

export default UsersDashboard;
