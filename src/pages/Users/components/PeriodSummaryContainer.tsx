import React, { useState } from "react";
import IloSummaryDashboard from "./IloSummaryDashboard";
import CoSummaryDashboard from "./CoSummaryDashboard";
import ActionPlanSummaryDashboard from "./ActionPlanSummaryDashboard";

interface PeriodSummaryContainerProps {
    scheduleId: string;
    period: "midterms" | "finals";
}

const PeriodSummaryContainer: React.FC<PeriodSummaryContainerProps> = ({ scheduleId, period }) => {
    // Sub-navigation state block managing internal sub-tab indices [INDEX: 0.1.34]
    const [summaryTab, setSummaryTab] = useState<"ilo" | "co" | "action">("ilo");

    return (
        <div className="w-full flex flex-col gap-5 animate-fade-in">
            {/* Inline Dashboard Tabs Selector Bar [INDEX: 0.1.34] */}
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-1.5 select-none">
                {[
                    { id: "ilo", name: "Learning Outcome Summary" },
                    { id: "co", name: "Course Outcome Summary" },
                    { id: "action", name: "Action Plan Summary" }
                ].map(sub => (
                    <button
                        key={sub.id}
                        onClick={() => setSummaryTab(sub.id as any)}
                        className={`text-[10px] font-bold font-montserrat uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            summaryTab === sub.id
                                ? "bg-slate-800 border-slate-800 text-white shadow-sm font-extrabold"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        {sub.name}
                    </button>
                ))}
            </div>

            {/* Display Canvas Port */}
            <div className="w-full">
                {summaryTab === "ilo" && (
                    <IloSummaryDashboard 
                        scheduleId={scheduleId} 
                        period={period} />
                )}

                {summaryTab === "co" && (
                    <CoSummaryDashboard 
                        scheduleId={scheduleId} 
                        period={period} />
                )}

                {summaryTab === "action" && (
                    <ActionPlanSummaryDashboard 
                        scheduleId={scheduleId} 
                        period={period} />
                )}
            </div>
        </div>
    );
};

export default PeriodSummaryContainer;
