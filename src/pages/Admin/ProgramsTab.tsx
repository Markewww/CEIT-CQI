const ProgramsTab = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Programs</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Administer specific degree tracks (e.g., BSIT, BSCS) mapped to respective CEIT departments.</p>
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all">
                    + Add New Degree Program
                </button>
            </div>

            {/* Academic Program Directory Matrix Sheet */}
            <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Active College Curricula Tracks
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 font-montserrat">BS in Information Technology (BSIT)</h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Aligned to Department of Information Technology (DIT)</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">4-Year Track</span>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 font-montserrat">BS in Computer Science (BSCS)</h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Aligned to Department of Information Technology (DIT)</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">4-Year Track</span>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 font-montserrat">BS in Civil Engineering (BSCE)</h4>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Aligned to Department of Civil Engineering & Architecture (DCEA)</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">4-Year Track</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramsTab;
