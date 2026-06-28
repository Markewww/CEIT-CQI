import React from "react";
import TargetAttainmentForm from "./components/TargetAttainmentForm";
// Import the newly created Academic Term configuration component
import ActiveTermForm from "./components/ActiveTermForm";

interface OverviewTabProps {
    user: {
        department_code?: string;
        first_name?: string;
    } | null;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ user }) => {
    const activeDept = user?.department_code || "CEIT";
    const userName = user?.first_name || "Admin";

    return (
        <div className="flex flex-col gap-6 animate-fade-in w-full">
            {/* Panel Actions Subheader Banner */}
            <div className="w-full bg-white p-6 md:p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat">
                        Master Administration Console
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage university accounts, configure institutional modules, and audit evaluation metrics.
                    </p>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                    Scope: <span className="text-primary font-extrabold">{activeDept}</span>
                </div>
            </div>

            {/* Dashboard Layout Grid Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Configuration Sidebar Stack Column */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <TargetAttainmentForm activeDept={activeDept} userName={userName} />
                    <ActiveTermForm userName={userName} />
                </div>

                {/* Main Dashboard Workspace Canvas Area */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2 flex flex-col items-center justify-center min-h-125 border-dashed">
                    <span className="text-slate-400 font-medium text-sm font-montserrat">Additional Dashboard Content Canvas</span>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">Place your analytical graphics, logs, or evaluation tracking frameworks within this layout matrix.</p>
                </div>

            </div>
        </div>
    );
};

export default OverviewTab;
