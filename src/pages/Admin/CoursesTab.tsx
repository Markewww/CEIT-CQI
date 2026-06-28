const CoursesTab = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Courses</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Maintain curriculum parameters and subject blueprints across the entire college framework.</p>
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all">
                    + Add New Course
                </button>
            </div>

            {/* Active Subject Registry Table UI */}
            <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Curriculum Course Registry
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900 font-montserrat">ITEC 50</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">DIT</span>
                            </div>
                            <h4 className="text-sm font-medium text-slate-700 mt-0.5">Web Development (React + TypeScript Stack)</h4>
                        </div>
                        <div className="text-xs text-slate-400 font-semibold text-right">
                            <span>3 Units Lecture/Lab</span>
                        </div>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/40 transition-colors">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900 font-montserrat">COEN 10</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">DIT</span>
                            </div>
                            <h4 className="text-sm font-medium text-slate-700 mt-0.5">Introduction to Data Structures and Algorithms</h4>
                        </div>
                        <div className="text-xs text-slate-400 font-semibold text-right">
                            <span>3 Units Lecture</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursesTab;
