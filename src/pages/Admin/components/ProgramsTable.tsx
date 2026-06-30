import React, { useState } from "react";

interface ProgramData {
    id: number;
    code: string;
    name: string;
    department_id: number;
    department_code: string; // From SQL JOIN statement
}

interface ProgramsTableProps {
    programs: ProgramData[];
    isLoading: boolean;
    error: string | null;
    onEditClick: (program: ProgramData) => void;
}

const ProgramsTable: React.FC<ProgramsTableProps> = ({ programs, isLoading, error, onEditClick }) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10;

    // Filter degree programs based on input keywords
    const filteredPrograms = programs.filter((prog) => {
        const query = searchQuery.toLowerCase().trim();
        return query === "" ? true : (
            prog.code.toLowerCase().includes(query) ||
            prog.name.toLowerCase().includes(query) ||
            prog.department_code.toLowerCase().includes(query)
        );
    });

    // Compute boundary pagination parameters
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredPrograms.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredPrograms.length / rowsPerPage);

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
                        placeholder="Search by degree code, title, or department..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200/80 rounded-lg pl-3 pr-8 py-2.5 focus:outline-none focus:border-primary transition-colors placeholder:text-slate-400"
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEIT Curriculum Matrix</span>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {isLoading ? "..." : `${programs.length} Programs`}
                </span>
            </div>

            {/* Conditional Views Layout Stack */}
            {isLoading && (
                <div className="p-8 text-center text-sm font-medium text-slate-400 font-montserrat animate-pulse">
                    Querying degree program records...
                </div>
            )}

            {error && (
                <div className="p-8 text-center text-sm font-semibold text-rose-500 bg-rose-50/30">
                    ⚠️ Error: {error}
                </div>
            )}

            {!isLoading && !error && filteredPrograms.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-slate-400">
                    No programs found matching your criteria.
                </div>
            )}

            {/* Table Main Grid Rendering Container Loop */}
            {!isLoading && !error && filteredPrograms.length > 0 && (
                <>
                    <div className="divide-y divide-slate-100 min-h-100">
                        {currentRows.map((prog) => (
                            <div key={prog.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    {/* Academic Identifier Badge */}
                                    <div className="w-20 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-black text-xs font-montserrat tracking-tight shrink-0 px-2 text-center truncate">
                                        {prog.code}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="text-sm font-bold text-slate-900 truncate pr-4">{prog.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded font-montserrat uppercase tracking-wider">
                                                {prog.department_code}
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                Dept ID: {prog.department_id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Edit Operation Trigger Control Row Button */}
                                <button
                                    onClick={() => onEditClick(prog)}
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
                                <span className="font-bold text-slate-700">{Math.min(indexOfLastRow, filteredPrograms.length)}</span> of{" "}
                                <span className="font-bold text-slate-700">{filteredPrograms.length}</span> entries
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

export default ProgramsTable;
