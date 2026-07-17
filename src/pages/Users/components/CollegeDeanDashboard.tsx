import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { ShieldAlert, CheckCircle2, AlertCircle, Clock, ExternalLink, RefreshCw, Filter } from "lucide-react";
import ClassWorkspace from "./ClassWorkspace"; // Reuses your main workspace directly! [INDEX: 0.1.94]

interface DeanClass {
    id: number;
    schedule_code: string;
    department_code: string;
    program_code: string;
    course_code: string;
    course_name: string;
    section: string;
    faculty_name: string;
    faculty_email: string;
    midterms_status: "Completed" | "In Progress" | "Pending";
    finals_status: "Completed" | "In Progress" | "Pending";
}

const CollegeDeanDashboard: React.FC = () => {
    const [classes, setClasses] = useState<DeanClass[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [deptFilter, setDeptFilter] = useState<string>("ALL");

    const loadCollegeMasterRegistryData = async () => {
        try {
            setIsLoading(true);
            const activeUserStr = localStorage.getItem("user");
            if (!activeUserStr) return;
            const user = JSON.parse(activeUserStr);

            const res = await fetch(`${API_ENDPOINTS.DEAN_MONITOR}?user_id=${user.id}`);
            const result = await res.json();
            if (result.status === "success") {
                setClasses(result.data || []);
            }
        } catch (err) {
            console.error("Failed synchronization reading college deans master matrix:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCollegeMasterRegistryData();
        }, 500); // Delay to ensure user data is loaded

        return () => clearTimeout(timer);
        // loadCollegeMasterRegistryData();
    }, []);


    const renderStatusBadge = (status: "Completed" | "In Progress" | "Pending") => {
        if (status === "Completed") return (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
            </span>
        );
        if (status === "In Progress") return (
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-100 uppercase tracking-wider animate-pulse">
                <Clock className="w-3 h-3 text-amber-600" /> Drafting
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 px-2 py-1 rounded-md text-[10px] font-bold border border-slate-100 uppercase tracking-wider">
                <AlertCircle className="w-3 h-3 text-slate-300" /> Lacking
            </span>
        );
    };

    // Filter logic routing matching rows based on active department code choice dropdowns [INDEX: 1]
    const filteredClasses = classes.filter(cls => 
        deptFilter === "ALL" || cls.department_code.toUpperCase() === deptFilter.toUpperCase()
    );

    if (selectedScheduleId !== null) {
        return (
            <ClassWorkspace 
                scheduleId={selectedScheduleId} 
                onBack={() => {
                    setSelectedScheduleId(null);
                    loadCollegeMasterRegistryData();
                }} 
            />
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
            {/* Header Title Section Bar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 select-none">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat tracking-tight">College Dean Auditing Matrix</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Master institutional continuous quality improvement tracker overview across all combined CEIT departments.</p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    
                    {/* LIVE DEPARTMENT MATRIX SELECTOR DROPDOWN FILTER TOOLBAR BLOCK */}
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select 
                            value={deptFilter} 
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="text-xs font-bold text-slate-600 bg-transparent outline-none cursor-pointer"
                        >
                            <option value="ALL">All Departments</option>
                            <option value="DIT">DIT (Information Technology)</option>
                            <option value="DCEA">DCEA (Civil & Architecture)</option>
                            <option value="DAE">DAE (Agricultural Engineering)</option>
                            <option value="DEE">DEE (Electronics Engineering)</option>
                            <option value="DIET">DIET (Industrial & Technology)</option>
                        </select>
                    </div>

                    <button
                        onClick={loadCollegeMasterRegistryData}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Sheets
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="w-full py-20 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Compiling college logs...</span>
                </div>
            ) : filteredClasses.length === 0 ? (
                <div className="w-full py-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50">
                    <ShieldAlert className="w-10 h-10 text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No active class loads compiled for this selection filter.</h4>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dept</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course Info</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Midterms</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Finals</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                                {filteredClasses.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="p-4">
                                            <span className="text-xs bg-slate-800 text-white font-mono font-black px-1.5 py-0.5 rounded">{cls.department_code}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs bg-primary/10 text-primary font-black px-2 py-0.5 rounded font-montserrat">{cls.program_code}</span>
                                        </td>
                                        <td className="p-4 max-w-45">
                                            <div className="font-bold text-slate-900 truncate">{cls.course_name}</div>
                                            <div className="text-xs text-slate-400 font-medium mt-0.5">{cls.course_code} • Sec {cls.section}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-800 font-bold text-xs">{cls.faculty_name}</div>
                                        </td>
                                        <td className="p-4 text-center">{renderStatusBadge(cls.midterms_status)}</td>
                                        <td className="p-4 text-center">{renderStatusBadge(cls.finals_status)}</td>
                                        <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedScheduleId(cls.id.toString())}
                                            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer">
                                                Audit View <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CollegeDeanDashboard;