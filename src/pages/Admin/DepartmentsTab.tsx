const DepartmentsTab = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Departments</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure and monitor official academic branches within the College of Engineering and Information Technology.</p>
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all">
                    + Add Department
                </button>
            </div>

            {/* CEIT Departments List Layout Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs bg-primary/10 text-primary font-black px-2 py-0.5 rounded font-montserrat">DIT</span>
                            <span className="text-xs text-slate-400 font-medium">ID: 1</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-3 font-montserrat">Department of Information Technology</h4>
                        <p className="text-xs text-slate-500 mt-1">Handles computational studies, automation, analytics, and framework networking architectures.</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center text-xs text-slate-400 font-semibold">
                        <span>4 Faculty Members</span>
                        <span className="text-primary hover:underline cursor-pointer">Configure Branch →</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:border-primary/30 transition-all">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs bg-primary/10 text-primary font-black px-2 py-0.5 rounded font-montserrat">DCEA</span>
                            <span className="text-xs text-slate-400 font-medium">ID: 2</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-3 font-montserrat">Department of Civil Engineering & Architecture</h4>
                        <p className="text-xs text-slate-500 mt-1">Manages physical structure designs, material analytics, and engineering dynamics modules.</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center text-xs text-slate-400 font-semibold">
                        <span>3 Faculty Members</span>
                        <span className="text-primary hover:underline cursor-pointer">Configure Branch →</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartmentsTab;
