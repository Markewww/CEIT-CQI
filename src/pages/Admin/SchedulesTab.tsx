const SchedulesTab = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Class Schedules</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Coordinate and audit scheduled lecture blocks to align examination and item analysis intervals.</p>
                </div>
                <button className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all">
                    + Create Class Schedule
                </button>
            </div>

            {/* Section Schedules Listing Card Block Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-3 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 font-montserrat">BSIT 3-1 ● Web Dev (Lab)</h4>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">First Semester</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                        <p>🗓️ Days: Monday & Wednesday</p>
                        <p>⏰ Time: 01:00 PM - 04:00 PM</p>
                        <p>📍 Room: CEIT Computer Lab 3</p>
                    </div>
                    <div className="border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Assigned Professor: <span className="text-primary font-black">Dr. Juan Dela Cruz</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col gap-3 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900 font-montserrat">BSCS 2-2 ● Data Struct</h4>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">First Semester</span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                        <p>🗓️ Days: Tuesday & Thursday</p>
                        <p>⏰ Time: 09:00 AM - 11:30 AM</p>
                        <p>📍 Room: CEIT Lecture Hall 102</p>
                    </div>
                    <div className="border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Assigned Professor: <span className="text-primary font-black">Prof. Maria Santos</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulesTab;
