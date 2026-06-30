import React, { useState } from "react";

interface DepartmentData {
    id: number;
    code: string; // Synced with database field configuration
    name: string; // Synced with database field configuration
    user_count: number;
}

interface DepartmentsTableProps {
    departments: DepartmentData[];
    isLoading: boolean;
    error: string | null;
    onEditClick: (dept: DepartmentData) => void;
}

const DepartmentsTable: React.FC<DepartmentsTableProps> = ({ departments, isLoading, error, onEditClick }) => {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10;

    // Filter departments based on search parameters using synchronized fields
    const filteredDepartments = departments.filter((dept) => {
        const query = searchQuery.toLowerCase().trim();
        return query === "" ? true : (
            dept.code.toLowerCase().includes(query) ||
            dept.name.toLowerCase().includes(query)
        );
    });

    // Compute boundary pagination parameters
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredDepartments.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredDepartments.length / rowsPerPage);

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
                        placeholder="Search by department code or name..."
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
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEIT Institutional Branches</span>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {isLoading ? "..." : `${departments.length} Branches`}
                </span>
            </div>

            {/* Conditional Views Layout Stack */}
            {isLoading && (
                <div className="p-8 text-center text-sm font-medium text-slate-400 font-montserrat animate-pulse">
                    Querying department records...
                </div>
            )}

            {error && (
                <div className="p-8 text-center text-sm font-semibold text-rose-500 bg-rose-50/30">
                    ⚠️ Error: {error}
                </div>
            )}

            {!isLoading && !error && filteredDepartments.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-slate-400">
                    No departments found matching your search.
                </div>
            )}

            {/* Table Main Grid Rendering Container Loop */}
            {!isLoading && !error && filteredDepartments.length > 0 && (
                <>
                    <div className="divide-y divide-slate-100 min-h-75">
                        {currentRows.map((dept) => (
                            <div key={dept.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                <div className="flex items-center gap-4">
                                    {/* Icon Badge Graphic Display utilizing synchronized code data binding */}
                                    <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center font-black text-xs font-montserrat tracking-wider shrink-0">
                                        {dept.code}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            {dept.user_count} Registered System Accounts
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Edit Operation Trigger Control Row Button */}
                                <button
                                    onClick={() => onEditClick(dept)}
                                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
                                >
                                    Configure
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Footer Actions navigation Deck */}
                    {totalPages > 1 && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                            <div>
                                Showing <span className="font-bold text-slate-700">{indexOfFirstRow + 1}</span> to{" "}
                                <span className="font-bold text-slate-700">{Math.min(indexOfLastRow, filteredDepartments.length)}</span> of{" "}
                                <span className="font-bold text-slate-700">{filteredDepartments.length}</span> entries
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

export default DepartmentsTable;
