import React, { useState, useEffect, useCallback } from "react";
import { APIconfig } from "@/config/apiConfig";

interface ActionSummaryRow {
    ilo_name: string;
    action_plan_summary: string;
    proposed_timeline: string;
    comment: string;
}

interface ActionPlanSummaryProps {
    scheduleId: string;
    period: "midterms" | "finals";
}

const ActionPlanSummaryDashboard: React.FC<ActionPlanSummaryProps> = ({ scheduleId, period }) => {
    const [rows, setSummaryRows] = useState<ActionSummaryRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [syncingKey, setSyncingKey] = useState<string | null>(null);

    const loadActionSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${APIconfig}/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=action_summary`);
            const out = await res.json();
            if (out.status === "success") {
                setSummaryRows(out.summary_data || []);
            }
        } catch (e) {
            console.error("Failed loading action plans summary indices:", e);
        } finally {
            setIsLoading(false);
        }
    }, [scheduleId, period]);

    useEffect(() => {
        loadActionSummary();
    }, [loadActionSummary]);

    const handleLocalTextChange = (iloName: string, field: "proposed_timeline" | "comment", value: string) => {
        setSummaryRows(prev => prev.map(row => 
            row.ilo_name === iloName ? { ...row, [field]: value } : row
        ));
    };

    const handleCellBlur = async (iloName: string, field: "proposed_timeline" | "comment", value: string) => {
        setSyncingKey(iloName);
        try {
            await fetch(`${APIconfig}/faculty/period_summary.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule_id: scheduleId,
                    period,
                    ilo_name: iloName,
                    [field]: value.trim()
                })
            });
        } catch {
            console.error("Failed compiling text cells save.");
        } finally {
            setSyncingKey(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 font-montserrat animate-pulse">Consolidating period action strategies...</div>;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-montserrat uppercase tracking-wider select-none px-1">
                <span>Action Plan Summary Dashboard</span>
                {syncingKey && <span className="text-primary font-black animate-pulse text-[10px]">Saving item data context...</span>}
            </div>

            {rows.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                    No active action items mapped yet. Complete Action Plan descriptions inside the Learning Outcome tab first to compile rows.
                </div>
            ) : (
                <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse select-none">
                            <thead>
                                <tr className="bg-white border-b-2 border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider font-montserrat">
                                    <th className="p-4 border-r border-slate-100 w-36 text-center">INTENDED LO #</th>
                                    <th className="p-4 border-r border-slate-100 max-w-sm">ACTION PLAN SUMMARY</th>
                                    <th className="p-4 border-r border-slate-100 w-60 text-center">PROPOSED TIMELINE</th>
                                    <th className="p-4">COMMENT REMARKS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                                {rows.map((row) => (
                                    <tr key={row.ilo_name} className="hover:bg-slate-50/20 transition-colors">
                                        
                                        {/* COLUMN 1: INTENDED LEARNING OUTCOME IDENTITY LABEL */}
                                        <td className="p-4 border-r border-slate-100 font-extrabold text-slate-700 font-montserrat bg-slate-50/10 text-center">
                                            ILO {row.ilo_name}
                                        </td>

                                        {/* COLUMN 2: CONSOLIDATED MERGED ACTION PLAN COPIES (READ ONLY STRINGS) */}
                                        <td className="p-4 border-r border-slate-100 font-medium text-slate-500 max-w-sm leading-relaxed whitespace-pre-line">
                                            {row.action_plan_summary}
                                        </td>

                                        {/* COLUMN 3: PROPOSED TIMELINE EDITABLE ROW ACCENT YELLOW HIGHLIGHT [INDEX: 0.1.3] */}
                                        <td className="p-1 bg-yellow-100/70 border-r border-slate-200/80 focus-within:bg-yellow-200/60 transition-colors">
                                            <input 
                                                type="text"
                                                value={row.proposed_timeline}
                                                placeholder="e.g., Week 9 - Week 10"
                                                onChange={e => handleLocalTextChange(row.ilo_name, "proposed_timeline", e.target.value)}
                                                onBlur={e => handleCellBlur(row.ilo_name, "proposed_timeline", e.target.value)}
                                                className="w-full bg-transparent font-bold focus:outline-none p-3 border-b border-transparent focus:border-slate-400 text-slate-800 placeholder:text-slate-300 placeholder:font-normal text-center"
                                            />
                                        </td>

                                        {/* COLUMN 4: COMMENT DIRECTIVE FORM WRAPPER */}
                                        <td className="p-1 focus-within:bg-slate-50/50 transition-colors">
                                            {row.comment}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionPlanSummaryDashboard;
