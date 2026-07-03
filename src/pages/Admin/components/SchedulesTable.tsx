import React, { useState } from "react";

interface ScheduleData {
    id: number;
    schedule_id: string;
    course_id: number;
    course_code: string;
    course_description: string;
    program_id: number;
    program_code: string;
    user_id: number;
    employee_id: string;
    instructor_name: string;
    academic_year: string;
    semester: string;
    year_level: number;
    section: string;
    is_active: number;
}

interface SchedulesTableProps {
    schedules: ScheduleData[];
    isLoading: boolean;
    error: string | null;
    onEditClick: (schedule: ScheduleData) => void;
}

const SchedulesTable: React.FC<SchedulesTableProps> = ({ schedules, isLoading, error, onEditClick }) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10;

    // Dropdown filter state parameters [INDEX: 0.1.38]
    const [semesterFilter, setSemesterFilter] = useState<string>("All");
    const [yearFilter, setYearFilter] = useState<string>("All");
    const [programFilter, setProgramFilter] = useState<string>("All");

    // Dynamically extract all unique program codes available in the current dataset
    const uniquePrograms = Array.from(
        new Set(schedules.map((sched) => sched.program_code))
    ).sort();

    // Multi-layered chained filtering matrix loop [INDEX: 0.1.34]
    const filteredSchedules = schedules.filter((sched) => {
        // 1. Keyword search match block including Schedule ID lookups [INDEX: 0.1.34]
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ? true : (
            sched.schedule_id.toLowerCase().includes(query) || // Enables direct typing searches for numeric manual entry keys
            sched.course_code.toLowerCase().includes(query) ||
            sched.course_description.toLowerCase().includes(query) ||
            sched.instructor_name.toLowerCase().includes(query) ||
            sched.employee_id.toLowerCase().includes(query) ||
            sched.program_code.toLowerCase().includes(query) ||
            `${sched.program_code} ${sched.year_level}-${sched.section}`.toLowerCase().includes(query)
        );

        // 2. Semester selector filter [INDEX: 0.1.38]
        const matchesSemester = semesterFilter === "All" || sched.semester === semesterFilter;

        // 3. Year Level selector filter [INDEX: 0.1.38]
        const matchesYear = yearFilter === "All" || sched.year_level.toString() === yearFilter;

        // 4. Program selector filter [INDEX: 0.1.38]
        const matchesProgram = programFilter === "All" || sched.program_code === programFilter;

        return matchesSearch && matchesSemester && matchesYear && matchesProgram;
    });

    // Compute boundary pagination parameters [INDEX: 0.1.34, 0.1.35]
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredSchedules.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);

    // Reset pagination to Page 1 when any filter dropdown value adjusts
    const handleFilterAdjustment = (filterSetter: (val: string) => void, value: string) => {
        filterSetter(value);
        setCurrentPage(1);
    };

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">
            
            {/* Advanced Filters Dashboard Control Toolbar Panel Deck [INDEX: 0.1.35] */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex flex-col gap-3">
                
                {/* Row 1: Text Search Field [INDEX: 0.1.35] */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by schedule id, instructor, course code, program, or section (e.g., 202522511)..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200/80 rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-primary placeholder:text-bg-disabled"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold font-montserrat"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Row 2: Relational Selector Dropdowns Dropdown Matrix Grid [INDEX: 0.1.38] */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Program Filter [INDEX: 0.1.38] */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Program</label>
                        <select
                            value={programFilter}
                            onChange={(e) => handleFilterAdjustment(setProgramFilter, e.target.value)}
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary cursor-pointer transition-colors"
                        >
                            <option value="All">All Programs</option>
                            {uniquePrograms.map((prog) => (
                                <option key={prog} value={prog}>{prog}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Level Filter [INDEX: 0.1.38] */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Year Level</label>
                        <select
                            value={yearFilter}
                            onChange={(e) => handleFilterAdjustment(setYearFilter, e.target.value)}
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary cursor-pointer transition-colors"
                        >
                            <option value="All">All Years</option>
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>
                    </div>

                    {/* Semester Filter [INDEX: 0.1.38] */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Semester</label>
                        <select
                            value={semesterFilter}
                            onChange={(e) => handleFilterAdjustment(setSemesterFilter, e.target.value)}
                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary cursor-pointer transition-colors"
                        >
                            <option value="All">All Semesters</option>
                            <option value="First Semester">First Semester</option>
                            <option value="Second Semester">Second Semester</option>
                            <option value="Summer/Midyear">Summer / Midyear</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Header Status Bar [INDEX: 0.1.35] */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Schedule Registry Matrix</span>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {isLoading ? "..." : `${filteredSchedules.length} Blocks`}
                </span>
            </div>

            {isLoading && <div className="p-8 text-center text-sm text-slate-400 animate-pulse font-montserrat">Loading schedule matrices...</div>}
            {error && <div className="p-8 text-center text-sm font-semibold text-rose-500 bg-rose-50/30">⚠️ Error: {error}</div>}
            {!isLoading && !error && filteredSchedules.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400">No matching schedules found matching filters.</div>
            )}

            {/* List Display Output Loop [INDEX: 0.1.35] */}
            {!isLoading && !error && filteredSchedules.length > 0 && (
                <>
                    <div className="divide-y divide-slate-100 min-h-100">
                        {currentRows.map((sched) => (
                            <div key={sched.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    
                                                                        {/* Class Group Identifier Section Bubble [INDEX: 0.1.36] */}
                                    <div className="w-24 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 flex flex-col items-center justify-center font-montserrat shrink-0 p-1">
                                        <span className="text-xs font-black tracking-tight">{sched.program_code}</span>
                                        <span className="text-[11px] font-bold text-primary">{sched.year_level}-{sched.section}</span>
                                    </div>

                                    {/* Course & Instructor Structural Info */}
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">
                                            <span className="text-primary font-black uppercase mr-1.5">[{sched.course_code}]</span>
                                            {sched.course_description}
                                        </h4>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                            Instructor: {sched.instructor_name} <span className="text-slate-300">|</span> <span className="text-slate-400 font-medium font-mono text-[11px]">ID: {sched.employee_id}</span>
                                        </p>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-400 font-medium">
                                            <div className="flex items-center gap-1">
                                                <span>A.Y. {sched.academic_year}</span>
                                                <span>•</span>
                                                <span>{sched.semester}</span>
                                            </div>
                                            {/* Visual Badge Anchor for your manual tracking code */}
                                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono font-bold text-[9px] border border-slate-200/40 w-fit">
                                                Sched ID: {sched.schedule_id}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Lifecycle parameters validation blocks */}
                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        sched.is_active === 1 ? "bg-emerald-50 text-emerald-600 border border-emerald-200/40" : "bg-slate-100 text-slate-400 border border-slate-200"
                                    }`}>
                                        {sched.is_active === 1 ? "Active" : "Archived"}
                                    </span>
                                    <button
                                        onClick={() => onEditClick(sched)}
                                        className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                                    >
                                        Configure
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Action Controller Deck */}
                    {totalPages > 1 && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                            <div>Showing <span className="font-bold text-slate-700">{indexOfFirstRow + 1}</span> to <span className="font-bold text-slate-700">{Math.min(indexOfLastRow, filteredSchedules.length)}</span> of <span className="font-bold text-slate-700">{filteredSchedules.length}</span> entries</div>
                            <div className="flex items-center gap-1.5 select-none">
                                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 font-bold font-xs">« First</button>
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40">Prev</button>
                                <div className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary font-bold">Page {currentPage} of {totalPages}</div>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40">Next</button>
                                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 font-bold font-xs">Last »</button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SchedulesTable;
