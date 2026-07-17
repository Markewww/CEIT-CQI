import React, { useState, useEffect, useCallback } from "react";
import { ArrowLeft, FileSpreadsheet, Plus, Trash2, ChevronRight, FileText, Target, BarChart3, Users } from "lucide-react";
import * as XLSX from "xlsx";
import TestAnalysisGrid from "./TestAnalysisGrid";
import IloAttainmentReport from "./IloAttainmentReport"; 
import PeriodSummaryContainer from "./PeriodSummaryContainer";
import OverallSummaryCanvas from "./OverallSummaryCanvas";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface ClassInfo {
    schedule_id: string;
    course_code: string;
    course_description: string;
    program_code: string;
    academic_year: string;
    semester: string;
    year_level: number;
    section: string;
}

interface Student {
    student_id: string;
    full_name: string;
}

interface ClassWorkspaceProps {
    scheduleId: string;
    onBack: () => void;
}

interface ExcelRowData {
    [index: number]: string | number | undefined;
}

const ClassWorkspace: React.FC<ClassWorkspaceProps> = ({ scheduleId, onBack }) => {
    const [info, setClassInfo] = useState<ClassInfo | null>(null);
    const [roster, setRoster] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Overlay form managers
    const [manualForm, setManualForm] = useState({ student_id: "", full_name: "" });
    const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Advanced Navigation Architecture States
    const [activeMainTab, setActiveMainTab] = useState<"roster" | "midterms" | "finals" | "summary">("roster");
    const [activeSubTab, setActiveSubTab] = useState<"record" | "lo" | "summary">("record");

    const loadClassDetails = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_ENDPOINTS.FACULTY_CLASS_DETAILS}?schedule_id=${encodeURIComponent(scheduleId)}`);
            const result = await response.json();
            if (result.status === "success") {
                setClassInfo(result.class_info);
                setRoster(result.students);
            } else { 
                setError(result.message); 
            }
        } catch { 
            setError("Connection to server timed out."); 
        } finally { 
            setIsLoading(false); 
        }
    }, [scheduleId]);

    useEffect(() => { 
        const timer = setTimeout(() => {
            loadClassDetails();
        }, 1000); // Delay of 1 second

        return () => clearTimeout(timer); // Cleanup the timer on unmount
        // loadClassDetails(); 
    }, [loadClassDetails]);

    const sendBatchToDatabase = async (batch: Student[]) => {
        try {
            const res = await fetch(`${API_ENDPOINTS.FACULTY_MANAGE_ROSTER}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_batch: true, schedule_id: scheduleId, students: batch })
            });
            const out = await res.json();
            alert(out.message);
            loadClassDetails();
        } catch { 
            alert("Failed to execute batch import processing."); 
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
        const reader = new FileReader();

        if (isExcel) {
            reader.onload = async (evt) => {
                try {
                    const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: "array" });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rawRows: ExcelRowData[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    const studentsBatch = rawRows.slice(1).map(row => ({
                        student_id: row[2]?.toString().trim() || "",
                        full_name: row[1]?.toString().trim() || ""
                    })).filter(s => s.student_id && s.full_name);

                    await sendBatchToDatabase(studentsBatch);
                } catch { 
                    alert("Failed parsing Excel data columns configuration."); 
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            reader.onload = async (evt) => {
                const text = evt.target?.result as string;
                const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
                
                const studentsBatch = lines.slice(1).map(line => {
                    const cols = line.split(",");
                    return {
                        student_id: cols[2]?.trim() || "",
                        full_name: cols[1]?.trim() ? cols[1].replace(/["']/g, "") : ""
                    };
                }).filter(s => s.student_id && s.full_name);

                await sendBatchToDatabase(studentsBatch);
            };
            reader.readAsText(file);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (roster.some(s => s.student_id.toLowerCase() === manualForm.student_id.trim().toLowerCase())) {
            setActionMessage("⚠️ Local Lock: This Student ID is already enrolled.");
            return;
        }
        try {
            const res = await fetch(`${API_ENDPOINTS.FACULTY_MANAGE_ROSTER}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule_id: scheduleId, student_id: manualForm.student_id.trim(), full_name: manualForm.full_name.trim() })
            });
            const out = await res.json();
            if (out.status === "success") {
                setManualForm({ student_id: "", full_name: "" });
                setActionMessage("Student added cleanly!");
                loadClassDetails();
                setTimeout(() => setActionMessage(null), 2000);
            } else { 
                setActionMessage(`⚠️ ${out.message}`); 
            }
        } catch { 
            setActionMessage("⚠️ Connection error."); 
        }
    };

    const handleDeleteStudent = async (studentId: string, studentName: string) => {
        const confirmDelete = window.confirm(`Are you sure you want to remove ${studentName} (${studentId}) from this class roster?`);
        if (!confirmDelete) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.FACULTY_DELETE_STUDENT}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule_id: scheduleId, student_id: studentId })
            });
            const out = await res.json();
            if (out.status === "success") {
                setActionMessage("Student ejected cleanly!");
                loadClassDetails();
                setTimeout(() => setActionMessage(null), 2000);
            } else {
                alert(`⚠️ Error: ${out.message}`);
            }
        } catch {
            alert("⚠️ Connection failure during deletion pipeline execution.");
        }
    };

    const filteredRoster = roster.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.includes(searchTerm)
    );

    const getSubTabName = () => {
        if (activeSubTab === "record") return activeMainTab === "midterms" ? "Midterm Class Record" : "Final Class Record";
        if (activeSubTab === "lo") return activeMainTab === "midterms" ? "Midterm Learning Outcome" : "Final Learning Outcome";
        return activeMainTab === "midterms" ? "Overall Midterm Summary" : "Overall Final Summary";
    };

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 font-montserrat animate-pulse">Loading class load dashboard...</div>;
    if (error) return <div className="p-4 text-center text-xs font-bold text-rose-500 bg-rose-50 rounded-xl">⚠️ {error} <button onClick={onBack} className="underline text-primary ml-2">Back</button></div>;
    if (!info) return null;

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in text-slate-800">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between">
                <button onClick={onBack} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <label className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer select-none flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Import CSV / Excel
                        <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <button onClick={() => setShowAddMenu(!showAddMenu)} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Add Student
                    </button>
                </div>
            </div>

            {/* Breadcrumb Trail Component Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200/60 shadow-sm text-xs font-semibold tracking-wide">
                <button onClick={onBack} className="text-slate-400 hover:text-primary transition-colors">Class Loads</button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <button onClick={() => setActiveMainTab("roster")} className={`${activeMainTab === "roster" ? "text-primary font-bold" : "text-slate-500 hover:text-primary transition-colors"}`}>
                    {info.course_code} ({info.program_code} {info.year_level}-{info.section})
                </button>
                {activeMainTab !== "roster" && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span className="text-slate-400 capitalize">{activeMainTab}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span className="text-primary font-bold">{getSubTabName()}</span>
                    </>
                )}
            </div>

            {/* Banner Module */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary/10 text-primary font-black px-2 py-0.5 rounded font-montserrat">{info.program_code}</span>
                        <span className="text-xs font-black text-slate-800 font-montserrat">Year {info.year_level} — Section {info.section}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1.5 font-montserrat">
                        <span className="text-primary mr-1">[{info.course_code}]</span>{info.course_description}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">A.Y. {info.academic_year} ● {info.semester}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/40 font-mono font-bold text-[10px] text-slate-400 px-3 py-1.5 rounded-lg text-left shrink-0">
                    CLASS ID: <span className="text-primary font-black">{info.schedule_id}</span>
                </div>
            </div>

            {/* MAIN WORKSPACE SECTION TABS SELECTOR PANEL BANK */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-1 overflow-x-auto select-none">
                {[
                    { id: "roster", name: "Student Roster", icon: <Users className="w-3.5 h-3.5" /> },
                    { id: "midterms", name: "Midterm Period", icon: <BarChart3 className="w-3.5 h-3.5" /> },
                    { id: "finals", name: "Final Period", icon: <BarChart3 className="w-3.5 h-3.5" /> },
                    { id: "summary", name: "Overall Summary", icon: <Target className="w-3.5 h-3.5" /> }
                ].map((tab: { id: string; name: string; icon: React.ReactNode }) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => { setActiveMainTab(tab.id as "roster" | "midterms" | "finals" | "summary"); setActiveSubTab("record"); }}
                        className={`text-xs font-bold font-montserrat uppercase px-4 py-2 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                            activeMainTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-700"
                        }`}
                    >
                        {tab.icon}
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* BREADCRUMB & NESTED SUB-TAB PANEL MANAGER DECK */}
            {(activeMainTab === "midterms" || activeMainTab === "finals") && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/60 p-3 rounded-xl animate-fade-in select-none">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 font-montserrat uppercase tracking-wide">
                        <span className="text-slate-500">Evaluation</span>
                        <span>/</span>
                        <span className="text-primary font-black">{activeMainTab}</span>
                        <span>/</span>
                        <span className="text-slate-700 font-extrabold bg-slate-200/60 px-1.5 py-0.5 rounded">
                            {activeSubTab === "record" ? "Class Record" : activeSubTab === "lo" ? "Learning Outcomes" : "Summary"}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {[
                            { id: "record", name: "Class Record", icon: <FileText className="w-3 h-3" /> },
                            { id: "lo", name: "Learning Outcomes", icon: <Target className="w-3 h-3" /> },
                            { id: "summary", name: "Period Summary", icon: <BarChart3 className="w-3 h-3" /> }
                        ].map((sub: { id: string; name: string; icon: React.ReactNode }) => (
                            <button
                                key={sub.id}
                                type="button"
                                onClick={() => setActiveSubTab(sub.id as "record" | "lo" | "summary")}
                                className={`text-[10px] font-bold font-montserrat uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                    activeSubTab === sub.id
                                        ? "bg-white border-slate-300 text-primary shadow-sm font-black"
                                        : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                            >
                                {sub.icon}
                                {sub.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* CORE VIEWPORT CANVAS CONTAINER AREA */}
            <div className="w-full min-h-75">
                
                {/* MODE A: STUDENT ROSTER INTERFACE VIEW CANVAS */}
                {activeMainTab === "roster" && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                        {showAddMenu && (
                            <form onSubmit={handleManualSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 items-end animate-fade-in">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student ID / Number</label>
                                    <input type="text" placeholder="e.g., 2023-10042" value={manualForm.student_id} onChange={e => setManualForm(prev => ({...prev, student_id: e.target.value}))} className="bg-white border border-slate-200 text-xs font-medium rounded-lg p-2 focus:outline-none focus:border-primary uppercase" required />
                                </div>
                                <div className="flex flex-col gap-1 md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Full Name</label>
                                    <input type="text" placeholder="Last Name, First Name" value={manualForm.full_name} onChange={e => setManualForm(prev => ({...prev, full_name: e.target.value}))} className="bg-white border border-slate-200 text-xs font-medium rounded-lg p-2 focus:outline-none focus:border-primary" required />
                                </div>
                                <div className="md:col-span-3 flex items-center justify-between mt-1">
                                    <span className="text-xs font-bold text-primary font-mono">{actionMessage}</span>
                                    <button type="submit" className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer">Save Student</button>
                                </div>
                            </form>
                        )}

                        <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <input type="text" placeholder="Search student ID or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-sm text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary" />
                                <span className="text-xs font-bold text-slate-400 font-montserrat uppercase tracking-wider">{filteredRoster.length} Enrolled</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider font-montserrat">
                                            <th className="p-3">Student ID / Number</th>
                                            <th className="p-3">Student Full Name</th>
                                            <th className="p-3 text-right pr-6">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                                        {filteredRoster.map(s => (
                                            <tr key={s.student_id} className="hover:bg-slate-50/20 transition-colors group/row">
                                                <td className="p-3 font-mono font-bold text-primary">{s.student_id}</td>
                                                <td className="p-3 font-bold text-slate-900">{s.full_name}</td>
                                                <td className="p-3 text-right pr-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteStudent(s.student_id, s.full_name)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer opacity-40 group-hover/row:opacity-100"
                                                        title="Remove student from class"
                                                    >
                                                        <Trash2 className="w-4 h-4 inline-block" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODE B: TERM PERIOD ROUTER (MIDTERMS / FINALS MATRICES) */}
                {(activeMainTab === "midterms" || activeMainTab === "finals") && (
                    <div className="w-full animate-fade-in">
                        {activeSubTab === "record" && (
                            <TestAnalysisGrid 
                                scheduleId={scheduleId} 
                                period={activeMainTab} 
                                students={roster} 
                            />
                        )}

                        {activeSubTab === "lo" && (
                            <IloAttainmentReport 
                                scheduleId={scheduleId} 
                                period={activeMainTab} />
                        )}

                        {activeSubTab === "summary" && (
                            <PeriodSummaryContainer 
                                scheduleId={scheduleId} 
                                period={activeMainTab} />
                        )}
                    </div>
                )}

                {/* MODE C: OVERALL SUMMARY INTERFACE DASHBOARD SHEET */}
                {activeMainTab === "summary" && (
                   <OverallSummaryCanvas scheduleId={scheduleId} />
                )}

            </div>
        </div>
    );
};

export default ClassWorkspace;
