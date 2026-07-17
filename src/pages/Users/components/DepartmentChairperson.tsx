import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { ShieldAlert, CheckCircle2, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import ClassWorkspace from "./ClassWorkspace"; // Reuses your main workspace directly! [INDEX: 0.1.94]

interface DeptClass {
    id: number;
    schedule_code: string;
    program_code: string;
    course_code: string;
    course_name: string;
    section: string;
    faculty_name: string;
    faculty_email: string;
    midterms_status: "Completed" | "In Progress" | "Pending";
    finals_status: "Completed" | "In Progress" | "Pending";
}

const DepartmentChairperson: React.FC = () => {
    const [classes, setClasses] = useState<DeptClass[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

    const loadDepartmentRegistryData = async () => {
        try {
            setIsLoading(true);
            const activeUserStr = localStorage.getItem("user");
            if (!activeUserStr) return;
            const user = JSON.parse(activeUserStr);

            const res = await fetch(`${API_ENDPOINTS.DEPARTMENT_CHAIR_MONITOR}?user_id=${user.id}`);
            const result = await res.json();
            if (result.status === "success") {
                setClasses(result.data || []);
            }
        } catch (err) {
            console.error("Failed synchronization reading department monitors:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadDepartmentRegistryData();
        }, 500); // Delay to ensure user data is loaded

        return () => clearTimeout(timer);
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

    if (selectedScheduleId !== null) {
        return (
            <ClassWorkspace 
                scheduleId={selectedScheduleId} 
                onBack={() => {
                    setSelectedScheduleId(null);
                    loadDepartmentRegistryData();
                }} 
            />
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 select-none">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat tracking-tight">Department Head Compliance Matrix</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Audit real-time continuous quality improvement submission metrics across all department programs.</p>
                </div>
                <button
                    onClick={loadDepartmentRegistryData}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 self-start bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Sheets
                </button>
            </div>

            {isLoading ? (
                <div className="w-full py-20 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Syncing monitor database...</span>
                </div>
            ) : classes.length === 0 ? (
                <div className="w-full py-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50">
                    <ShieldAlert className="w-10 h-10 text-slate-300 mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No active departmental class loads compiled.</h4>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program / Track</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course Info</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Faculty</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Midterms</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Finals</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                                {classes.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="p-4">
                                            <span className="text-xs bg-primary/10 text-primary font-black px-2 py-0.5 rounded font-montserrat">{cls.program_code}</span>
                                        </td>
                                        <td className="p-4 max-w-50">
                                            <div className="font-bold text-slate-900 truncate">{cls.course_name}</div>
                                            <div className="text-xs text-slate-400 font-medium mt-0.5">{cls.course_code} • Sec {cls.section}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-800 font-bold text-xs">{cls.faculty_name}</div>
                                            <div className="text-[11px] text-slate-400 font-medium font-mono truncate max-w-37.5">{cls.faculty_email}</div>
                                        </td>
                                        <td className="p-4 text-center">{renderStatusBadge(cls.midterms_status)}</td>
                                        <td className="p-4 text-center">{renderStatusBadge(cls.finals_status)}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedScheduleId(cls.id.toString())}
                                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                            >
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
};

export default DepartmentChairperson;
