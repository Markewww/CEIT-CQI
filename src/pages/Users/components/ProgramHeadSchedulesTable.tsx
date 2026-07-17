import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Clock, ExternalLink, ChevronLeft, ChevronRight, Search, Hash } from "lucide-react";

interface MonitoredClass {
    id: number;
    schedule_code: string; // The semantic unique alphanumeric string descriptor text
    course_code: string;
    course_name: string;
    section: string;
    year_level: number;
    students_count: number; // Accurately reflects row counts joined from database [INDEX: 0.1.84]
    faculty_name: string;
    faculty_email: string;
    midterms_status: "Completed" | "In Progress" | "Pending"; // Evaluates dynamic configuration status entries [INDEX: 0.1.84]
    finals_status: "Completed" | "In Progress" | "Pending";
}

interface ProgramHeadSchedulesTableProps {
    classes: MonitoredClass[];
    onAuditClick: (scheduleCode: string) => void;
}

const ProgramHeadSchedulesTable: React.FC<ProgramHeadSchedulesTableProps> = ({ classes, onAuditClick }) => {
    // SEARCH SEARCH AND FILTER STATE MACHINE [INDEX: 0.1.90]
    const [searchQuery, setSearchQuery] = useState<string>("");
    
    // PAGINATION LAYOUT STATES [INDEX: 0.1.85]
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 5;

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
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-1 rounded-md text-[10px] font-bold border border-rose-100 uppercase tracking-wider">
                <AlertCircle className="w-3 h-3 text-rose-500" /> Lacking
            </span>
        );
    };

    // MULTI-COLUMN REAL-TIME COMPLIANCE INTERCEPTION SEARCH ENGINE [INDEX: 0.1.90]
    const filteredRows = classes.filter((cls) => {
        const query = searchQuery.toLowerCase().trim();
        if (query === "") return true;
        return (
            cls.schedule_code.toLowerCase().includes(query) ||
            cls.faculty_name.toLowerCase().includes(query) ||
            cls.course_code.toLowerCase().includes(query) ||
            cls.course_name.toLowerCase().includes(query)
        );
    });

    // CLIENT PAGINATION CALCULATION LOGIC BLOCKS BOUND TO FILTERED SUBSETS [INDEX: 0.1.86]
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className="space-y-4">
            
            {/* REAL-TIME DYNAMIC LOOKUP FILTERS SEARCH BAR BAR CONTAINER [INDEX: 0.1.90] */}
            <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 select-none group focus-within:border-primary transition-all">
                <Search className="w-4 h-4 text-slate-400 group-focus-within:text-primary" />
                <input
                    type="text"
                    placeholder="Search by Instructor, Code, or Schedule ID..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} // Reset pagination tracking index on filter key toggle
                    className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
            </div>

            {/* DYNAMIC WORKSPACE COMPLIANCE GRID SHEET [INDEX: 0.1.86] */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200 select-none text-[10px] font-black text-slate-400 uppercase tracking-wider font-montserrat">
                                <th className="p-4 w-32">Schedule Code</th>
                                <th className="p-4">Year and Section</th>
                                <th className="p-4">Course Descriptor</th>
                                <th className="p-4">Assigned Instructor</th>
                                <th className="p-4 text-center">Midterm</th>
                                <th className="p-4 text-center">Finals</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                            {currentRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 font-bold font-mono">
                                        No schedules found matching your current tracking query filters.
                                    </td>
                                </tr>
                            ) : (
                                currentRows.map((cls) => (
                                    <tr key={cls.id} className="hover:bg-slate-50/30 transition-colors group/row">
                                        
                                        {/* INJECTED SYSTEM ID LABELS FIELD [INDEX: 0.1.90] */}
                                        <td className="p-4 select-none">
                                            <span className="inline-flex items-center gap-0.5 bg-slate-900 text-white font-mono text-[9px] font-black px-2 py-0.5 rounded shadow-sm">
                                                <Hash className="w-2.5 h-3" /> {cls.schedule_code}
                                            </span>
                                        </td>

                                        <td className="p-4 select-none">
                                            <span className="bg-slate-100 font-bold px-2 py-0.5 rounded text-[10px] text-slate-600">
                                                Year {cls.year_level} — Sec {cls.section}
                                            </span>
                                        </td>
                                        <td className="p-4 max-w-60">
                                            <div className="font-bold text-slate-900 font-montserrat truncate group-hover/row:text-primary transition-colors">
                                                {cls.course_name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                <span className="font-mono text-slate-500 font-bold">{cls.course_code}</span>
                                                <span>•</span>
                                                <span className="text-slate-500 font-black">{cls.students_count} Enrolled Students</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-800 font-bold">{cls.faculty_name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium font-mono truncate max-w-160px">{cls.faculty_email}</div>
                                        </td>
                                        <td className="p-4 text-center">{renderStatusBadge(cls.midterms_status)}</td>
                                        <td className="p-4 text-center">{renderStatusBadge(cls.finals_status)}</td>
                                        <td className="p-4 text-right pr-4">
                                            <button
                                                type="button"
                                                onClick={() => onAuditClick(cls.schedule_code)}
                                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-primary hover:text-white border border-slate-200 hover:border-primary text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
                                            >
                                                Audit View <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ROBUST PAGINATION BAR CONTROL LAYOUT BUTTONS BLOCK [INDEX: 0.1.88] */}
            {totalPages > 1 && (
                <div className="w-full bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between text-xs font-bold font-montserrat uppercase select-none">
                    <div className="text-slate-400 font-medium lowercase">
                                                Showing <span className="font-black text-slate-700">{indexOfFirstRow + 1}</span> to <span className="font-black text-slate-700">{Math.min(indexOfLastRow, filteredRows.length)}</span> of <span className="font-black text-slate-700">{filteredRows.length}</span> results
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                            <button
                                type="button"
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
                                    currentPage === pageNum 
                                        ? "bg-primary border-primary text-white font-black" 
                                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                {pageNum}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgramHeadSchedulesTable;