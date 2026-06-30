import React, { useState } from "react";

interface CourseData {
    id: number;
    code: string;
    description: string;
}

interface CoursesTableProps {
    courses: CourseData[];
    isLoading: boolean;
    error: string | null;
    onEditClick: (course: CourseData) => void;
}

const CoursesTable: React.FC<CoursesTableProps> = ({ courses, isLoading, error, onEditClick }) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10;

    // Filter courses locally based on search keywords
    const filteredCourses = courses.filter((course) => {
        const query = searchQuery.toLowerCase().trim();
        return query === "" ? true : (
            course.code.toLowerCase().includes(query) ||
            course.description.toLowerCase().includes(query)
        );
    });

    // Compute boundary pagination parameters
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredCourses.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredCourses.length / rowsPerPage);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">
            
            {/* Search Bar Toolbar Control Deck */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by course code or description..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200/80 rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Header Content Counter Status Bar Summary */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Master Course Registries</span>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {isLoading ? "..." : `${courses.length} Courses`}
                </span>
            </div>

            {/* Conditional Views Layout Stack */}
            {isLoading && (
                <div className="p-8 text-center text-sm font-medium text-slate-400 font-montserrat animate-pulse">
                    Querying master course records...
                </div>
            )}

            {error && (
                <div className="p-8 text-center text-sm font-semibold text-rose-500 bg-rose-50/30">
                    ⚠️ Error: {error}
                </div>
            )}

            {!isLoading && !error && filteredCourses.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-slate-400">
                    No courses found matching your search.
                </div>
            )}

            {/* Table Main Grid Rendering Container Loop */}
            {!isLoading && !error && filteredCourses.length > 0 && (
                <>
                    <div className="divide-y divide-slate-100 min-h-100">
                        {currentRows.map((course) => (
                            <div key={course.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    {/* Course Code Identifier Tag */}
                                    <div className="w-24 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-black text-xs font-montserrat tracking-tight shrink-0 px-2 text-center uppercase">
                                        {course.code}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{course.description}</h4>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">
                                            System Registry Entry ID: {course.id}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Edit Operation Trigger Control Row Button */}
                                <button
                                    onClick={() => onEditClick(course)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all shrink-0 ml-4"
                                >
                                    Configure
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Footer Actions Navigation Deck */}
                    {totalPages > 1 && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                            <div>
                                Showing <span className="font-bold text-slate-700">{indexOfFirstRow + 1}</span> to{" "}
                                <span className="font-bold text-slate-700">{Math.min(indexOfLastRow, filteredCourses.length)}</span> of{" "}
                                <span className="font-bold text-slate-700">{filteredCourses.length}</span> entries
                            </div>

                            <div className="flex items-center gap-1.5 select-none">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                                >
                                    « First
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Prev
                                </button>
                                <div className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary font-bold">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                                >
                                    Last »
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CoursesTable;
