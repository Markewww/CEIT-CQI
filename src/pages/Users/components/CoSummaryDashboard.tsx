import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { APIconfig } from "@/config/apiConfig";

interface CoSummaryRow {
    co_name: string;
    attainment_score: number;
    attainment_target: number;
    remarks: "ATTAINED" | "NOT ATTAINED";
}

interface CoSummaryDashboardProps {
    scheduleId: string;
    period: "midterms" | "finals";
}

const CoSummaryDashboard: React.FC<CoSummaryDashboardProps> = ({ scheduleId, period }) => {
    const [rows, setSummaryRows] = useState<CoSummaryRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadCoSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            // Appends action=co_summary to request the compiled group calculations [INDEX: 0.1.5]
            const res = await fetch(`${APIconfig}/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}&action=co_summary`);
            const out = await res.json();
            if (out.status === "success") {
                setSummaryRows(out.summary_data || []);
            }
        } catch (e) {
            console.error("Failed to load aggregated CO summaries:", e);
        } finally {
            setIsLoading(false);
        }
    }, [scheduleId, period]);

    useEffect(() => {
        loadCoSummary();
    }, [loadCoSummary]);

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 font-montserrat animate-pulse">Aggregating mean course outcome ratios...</div>;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in text-slate-800">
            <div className="text-xs font-bold text-slate-400 font-montserrat uppercase tracking-wider select-none px-1">
                <span>Course Outcomes (CO) Aggregated Summary Sheet</span>
            </div>

            {rows.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                    No matching Course Outcome links found. Please map numbers inside the Learning Outcome Summary tab first to process metrics.
                </div>
            ) : (
                <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse select-none">
                            <thead>
                                <tr className="bg-white border-b-2 border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider font-montserrat">
                                    <th className="p-4 border-r border-slate-100 w-44 pl-6">COURSE OUTCOME</th>
                                    <th className="p-4 border-r border-slate-100 text-center">AVERAGE ATTAINMENT SCORE</th>
                                    <th className="p-4 border-r border-slate-100 text-center">TARGET PERCENTAGE</th>
                                    <th className="p-4 text-center pr-6">STATUS REMARKS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                                {rows.map((row) => {
                                    const isAttained = row.remarks === "ATTAINED";
                                    return (
                                        <tr key={row.co_name} className="hover:bg-slate-50/30 transition-colors">
                                            
                                            {/* COLUMN 1: THE COURSE OUTCOME IDENTITY BADGE WITH ACCENT YELLOW CELL HIGHLIGHT [INDEX: 0.1.4] */}
                                            <td className="p-4 pl-6 border-r border-slate-200/80 font-extrabold text-slate-900 font-montserrat">
                                                CO {row.co_name}
                                            </td>

                                            {/* COLUMN 2: CALCULATED MEAN AVERAGE ACROSS ALL MATCHING ILO SCORES [INDEX: 0.1.4] */}
                                            <td className={`p-4 border-r border-slate-100 text-center font-mono font-black text-sm ${isAttained ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {Math.round(row.attainment_score)}%
                                            </td>

                                            {/* COLUMN 3: CONSTANT SYSTEM THRESHOLD LEVEL REFERENCE */}
                                            <td className="p-4 border-r border-slate-100 text-center font-mono text-slate-400 font-semibold">
                                                {Math.round(row.attainment_target)}%
                                            </td>

                                            {/* COLUMN 4: PERFORMANCE METRIC STATUS BADGE */}
                                            <td className="p-4 text-center pr-6">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black tracking-wide border uppercase ${
                                                    isAttained 
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200/30" 
                                                        : "bg-rose-50 text-rose-500 border-rose-200/30"
                                                }`}>
                                                    {isAttained ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                                    {row.remarks}
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoSummaryDashboard;
