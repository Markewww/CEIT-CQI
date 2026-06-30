import React, { useState } from "react";
import IloSummaryDashboard from "./IloSummaryDashboard";
import CoSummaryDashboard from "./CoSummaryDashboard";
import ActionPlanSummaryDashboard from "./ActionPlanSummaryDashboard";
import PrintPeriodSummary from "./PrintPeriodSummary"; // ◄ 1. IMPORT DECOUPLED COMPONENT

interface PeriodSummaryContainerProps {
    scheduleId: string;
    period: "midterms" | "finals";
}

const PeriodSummaryContainer: React.FC<PeriodSummaryContainerProps> = ({ scheduleId, period }) => {
    const [summaryTab, setSummaryTab] = useState<"ilo" | "co" | "action">("ilo");
    const [isPreparingPrint, setIsPreparingPrint] = useState<boolean>(false); // ◄ 2. ADD ANIMATION STATE TRACKER

    return (
        <div className="w-full flex flex-col gap-5 animate-fade-in">
            
            {/* 3. REFACTORED: Converted header container to space-between flex layout to push print button to the right */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 select-none w-full gap-4">
                <div className="flex items-center gap-2">
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
                                    ? "bg-primary border-primary text-white shadow-sm font-extrabold"
                                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-800"
                            }`}
                        >
                            {sub.name}
                        </button>
                    ))}
                </div>

                {/* ◄ 4. INJECTED DETACHED PRINT ENFORCEMENT HOOK COMPONENT */}
                <PrintPeriodSummary 
                    scheduleId={scheduleId} 
                    period={period} 
                    isPreparing={isPreparingPrint} 
                    setIsPreparing={setIsPreparingPrint} 
                />
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
