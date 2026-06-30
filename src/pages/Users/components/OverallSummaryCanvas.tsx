import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface OverallRow {
    co_name: string;
    attainment_score: number;
    attainment_target: number;
    remarks: "ATTAINED" | "NOT ATTAINED";
}

interface OverallSummaryCanvasProps {
    scheduleId: string;
}

const OverallSummaryCanvas: React.FC<OverallSummaryCanvasProps> = ({ scheduleId }) => {
    const [rows, setRows] = useState<OverallRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const loadOverallSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`http://localhost/cqi/api/faculty/overall_summary.php?schedule_id=${scheduleId}`);
            const out = await res.json();
            if (out.status === "success") {
                setRows(out.summary_data || []);
            }
        } catch (e) {
            console.error("Failed loading overall summary matrix sheet:", e);
        } finally {
            setIsLoading(false);
        }
    }, [scheduleId]);

    useEffect(() => {
        loadOverallSummary();
    }, [loadOverallSummary]);

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 font-montserrat animate-pulse">Aggregating cross-period compliance data metrics...</div>;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in text-slate-800">
            <div className="text-xs font-bold text-slate-400 font-montserrat uppercase tracking-wider select-none px-1">
                <span>Overall Summary Sheet Matrix</span>
            </div>

            {rows.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                    No active Course Outcomes found. Ensure you have mapped CO numbers inside your period summaries to compute metrics.
                </div>
            ) : (
                <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse select-none">
                            <thead>
                                <tr className="bg-white border-b-2 border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider font-montserrat">
                                    <th className="p-4 border-r border-slate-100 w-56 pl-6">COURSE OUTCOME</th>
                                    <th className="p-4 border-r border-slate-100 text-center">ATTAINMENT SCORE</th>
                                    <th className="p-4 border-r border-slate-100 text-center">ATTAINMENT TARGET</th>
                                    <th className="p-4 text-center pr-6">REMARKS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                                {rows.map((row) => {
                                    const isAttained = row.remarks === "ATTAINED";
                                    return (
                                        <tr key={row.co_name} className="hover:bg-slate-50/30 transition-colors">
                                            
                                            {/* COLUMN 1: COURSE OUTCOME IDENTIFIER WITH ACCENT YELLOW HIGHLIGHT [INDEX: 1] */}
                                            <td className="p-4 pl-6 border-r border-slate-200/80 font-black text-slate-900 font-montserrat">
                                                CO {row.co_name}
                                            </td>

                                            {/* COLUMN 2: COMBINED MULTI-PERIOD AVERAGE SCORE PERFORMANCE MEAN [INDEX: 1] */}
                                            <td className={`p-4 border-r border-slate-100 text-center font-mono font-black text-sm ${isAttained ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {Math.round(row.attainment_score)}%
                                            </td>

                                            {/* COLUMN 3: CONSTANT REFERENCE Target THRESHOLD LEVEL */}
                                            <td className="p-4 border-r border-slate-100 text-center font-mono text-slate-400 font-semibold">
                                                {Math.round(row.attainment_target)}%
                                            </td>

                                            {/* COLUMN 4: PERFORMANCE METRIC BADGE STATUS */}
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

export default OverallSummaryCanvas;
