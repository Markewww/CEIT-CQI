import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { ShieldAlert, RefreshCw, GraduationCap, Calendar } from "lucide-react";
import ProgramHeadSchedulesTable from "./ProgramHeadSchedulesTable";
import ProgramHeadOutcomesPanel from "./ProgramHeadOutcomesPanel"; // ◄ IMPORT YOUR NEW DATA MANAGEMENT SUBPANEL
import ProgramHeadAuditWorkspace from "./ProgramHeadAuditWorkspace";

interface MonitoredClass {
    id: number;
    schedule_code: string;
    course_code: string;
    course_name: string;
    section: string;
    year_level: number;
    students_count: number;
    faculty_name: string;
    faculty_email: string;
    midterms_status: "Completed" | "In Progress" | "Pending";
    finals_status: "Completed" | "In Progress" | "Pending";
}

interface StudentOutcome {
    id: number;
    so_letter: string;
    so_value: string;
}

interface MetaPayload {
    academicYear: string;
    semester: string;
    programTitle: string;
    programCode: string;
}

const ProgramHeadDashboard: React.FC = () => {
    const [classes, setClasses] = useState<MonitoredClass[]>([]);
    const [outcomes, setOutcomes] = useState<StudentOutcome[]>([]);
    const [meta, setMeta] = useState<MetaPayload>({ academicYear: "", semester: "", programTitle: "", programCode: "" });
    const [activeTab, setActiveTab] = useState<"schedules" | "outcomes">("schedules");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

    const loadProgramRegistryData = async () => {
        try {
            setIsLoading(true);
            const activeUserStr = localStorage.getItem("user");
            if (!activeUserStr) return;
            const user = JSON.parse(activeUserStr);

            const res = await fetch(`${API_ENDPOINTS.PROGRAM_HEAD_MONITOR}?user_id=${user.id}`);
            const result = await res.json();
            if (result.status === "success") {
                setClasses(result.data || []);
                setMeta({
                    academicYear: result.academic_year || "—",
                    semester: result.semester || "—",
                    programTitle: result.program_title || "Degree Program",
                    programCode: result.program_code || "N/A"
                });
            }
            
            // Load Outcomes Data
            const resSo = await fetch(`${API_ENDPOINTS.PROGRAM_HEAD_SO}?user_id=${user.id}`);
            const resultSo = await resSo.json();
            if (resultSo.status === "success") {
                setOutcomes(resultSo.data || []);
            }
        } catch (err) {
            console.error("Dashboard data collection dropout:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadProgramRegistryData();
        }, 500); // Delay to ensure user data is loaded

        return () => clearTimeout(timer);
    }, []);


    if (selectedScheduleId !== null) {
        return (
            <ProgramHeadAuditWorkspace 
                scheduleId={selectedScheduleId} 
                onBack={() => {
                    setSelectedScheduleId(null);
                    loadProgramRegistryData();
                }} 
            /> 
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
            {/* TOP METADATA BRAND BAR CHIPS */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/60 pb-5 select-none">
                <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 bg-slate-900 text-white text-[10px] font-bold font-montserrat uppercase px-2 py-0.5 rounded">
                            <GraduationCap className="w-3 h-3" /> {meta.programCode} Track
                        </span>
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-bold font-montserrat uppercase px-2 py-0.5 rounded border border-primary/20">
                            <Calendar className="w-3 h-3" /> A.Y. {meta.academicYear}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-bold font-montserrat uppercase px-2 py-0.5 rounded border border-slate-200">
                            {meta.semester}
                        </span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 font-montserrat tracking-tight">
                        Program Monitoring Framework — <span className="text-primary">{meta.programTitle}</span>
                    </h2>
                </div>
                <button
                    onClick={loadProgramRegistryData}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 self-start lg:self-auto"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Metric Logs
                </button>
            </div>

            {/* TAB LINKS BAR TOGGLES CHANGER PANEL */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-1 select-none text-xs font-bold uppercase tracking-wider font-montserrat">
                <button 
                    type="button"
                    onClick={() => setActiveTab("schedules")}
                    className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${activeTab === "schedules" ? "border-primary text-primary font-black" : "border-transparent text-slate-400"}`}
                >
                    Faculty Class Loads Summary
                </button>
                <button 
                    type="button"
                    onClick={() => setActiveTab("outcomes")}
                    className={`px-4 py-2 border-b-2 transition-all cursor-pointer ${activeTab === "outcomes" ? "border-primary text-primary font-black" : "border-transparent text-slate-400"}`}
                >
                    Student Outcomes (SO) Settings
                </button>
            </div>

            {isLoading ? (
                <div className="w-full py-20 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Assembling layout logs...</span>
                </div>
            ) : activeTab === "schedules" ? (
                classes.length === 0 ? (
                    <div className="w-full py-16 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none bg-slate-50/50">
                        <ShieldAlert className="w-10 h-10 text-slate-300 mb-2" />
                        <h4 className="text-sm font-bold text-slate-700">No active class loads captured.</h4>
                    </div>
                ) : (
                    <ProgramHeadSchedulesTable classes={classes} onAuditClick={(id) => setSelectedScheduleId(id)} />
                )
            ) : (
                <ProgramHeadOutcomesPanel 
                    outcomes={outcomes} 
                    onRefreshNeeded={loadProgramRegistryData} 
                />
            )}
        </div>
    );
};

export default ProgramHeadDashboard;
