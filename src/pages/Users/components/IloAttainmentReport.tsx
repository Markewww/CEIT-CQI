import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { APIconfig } from "@/config/apiConfig";

interface IloItemRow {
    ilo_name: string;
    item_number: number;
    num_passed: number;
    total_students: number;
    attainment_score: number;
    attainment_target: number;
    remarks: "ATTAINED" | "NOT ATTAINED";
    action_plan: string;
}

interface IloAttainmentReportProps {
    scheduleId: string;
    period: "midterms" | "finals";
}

const IloAttainmentReport: React.FC<IloAttainmentReportProps> = ({ scheduleId, period }) => {
    const [report, setReport] = useState<IloItemRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [syncingRow, setSyncingRow] = useState<number | null>(null);

    const loadIloReportMetrics = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${APIconfig}/faculty/ilo_analysis.php?schedule_id=${scheduleId}&period=${period}`);
            const out = await res.json();
            if (out.status === "success") {
                setReport(out.report_data || []);
            }
        } catch (e) {
            console.error("Failed to load automated LO report matrix:", e);
        } finally {
            setIsLoading(false);
        }
    }, [scheduleId, period]);

    useEffect(() => {
        loadIloReportMetrics();
    }, [loadIloReportMetrics]);

    // Triggers an update to the database automatically when focus leaves a cell
    const handleCellBlur = async (itemNumber: number, field: "ilo_name" | "action_plan", updatedValue: string) => {
        setSyncingRow(itemNumber);
        try {
            await fetch(`${APIconfig}/faculty/ilo_analysis.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule_id: scheduleId,
                    period,
                    item_number: itemNumber,
                    [field]: updatedValue.trim()
                })
            });
            // Silently update local grid metrics array mapping reference properties
            setReport(prev => prev.map(row => 
                row.item_number === itemNumber ? { ...row, [field]: updatedValue } : row
            ));
        } catch (err) {
            console.error("Failing synchronizing spreadsheet inputs changes:", err);
        } finally {
            setSyncingRow(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 font-montserrat animate-pulse">Assembling per-item learning outcome analysis matrices...</div>;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in text-slate-800">
            {/* Header tracking info banner indicator row */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-montserrat uppercase tracking-wider select-none px-1">
                <span>Learning Outcomes Attainment Report Summary</span>
                {syncingRow && <span className="text-primary font-black animate-pulse text-[10px]">Saving changes to cell item {syncingRow}...</span>}
            </div>

            {/* EXCEL SHEET GRID INTERFACE MODEL LAYOUT MATCHING YOUR DESIGN IMAGE CELL FOR CELL */}
            <div className="w-full bg-white rounded-xl border border-emerald-600/20 shadow-md overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse select-none">
                        <thead>
                            <tr className="bg-white border-b-2 border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider font-montserrat">
                                <th className="p-3.5 border-r border-slate-100 w-24 text-center">ILO</th>
                                <th className="p-3.5 border-r border-slate-100 w-24 text-center">ITEM NUMBER</th>
                                <th className="p-3.5 border-r border-slate-100 text-center">NUMBER OF PASSED</th>
                                <th className="p-3.5 border-r border-slate-100 text-center">NUMBER OF STUDENTS</th>
                                <th className="p-3.5 border-r border-slate-100 text-center">ATTAINMENT SCORE</th>
                                <th className="p-3.5 border-r border-slate-100 text-center">ATTAINMENT TARGET</th>
                                <th className="p-3.5 border-r border-slate-100 text-center">REMARKS</th>
                                <th className="p-3.5 min-w-70">ACTION PLAN</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                            {report.map((row) => {
                                const isAttained = row.remarks === "ATTAINED";
                                return (
                                    <tr key={row.item_number} className="hover:bg-slate-50/40 transition-colors">
                                        
                                        {/* COLUMN 1: ILO INPUT FIELD — Content editable as text input row box */}
                                        <td className="p-1 bg-yellow-100/70 border-r border-slate-200/80 text-center text-slate-900 focus-within:bg-yellow-200/60 transition-colors">
                                            <input 
                                                type="text"
                                                defaultValue={row.ilo_name}
                                                placeholder="..."
                                                onBlur={(e) => handleCellBlur(row.item_number, "ilo_name", e.target.value)}
                                                className="w-full bg-transparent text-center font-extrabold focus:outline-none p-2 border-b border-transparent focus:border-slate-400 text-slate-800 uppercase"
                                            />
                                        </td>

                                        {/* COLUMN 2: ITEM NUMBER INDICATOR */}
                                        <td className="p-3.5 border-r border-slate-100 text-center font-mono font-medium text-slate-500 bg-slate-50/20">
                                            {row.item_number}
                                        </td>

                                        {/* COLUMN 3: AUTOMATED PASSED STUDENTS COUNTER */}
                                        <td className="p-3.5 border-r border-slate-100 text-center text-slate-700 font-semibold">
                                            {row.num_passed}
                                        </td>

                                        {/* COLUMN 4: AUTOMATED TOTAL STUDENTS IN REGISTERED ROSTER */}
                                        <td className="p-3.5 border-r border-slate-100 text-center text-slate-400 font-medium">
                                            {row.total_students}
                                        </td>

                                        {/* COLUMN 5: CALCULATED SCORE PERCENTAGE */}
                                        <td className={`p-3.5 border-r border-slate-100 text-center font-mono font-black text-sm ${isAttained ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {Math.round(row.attainment_score)}%
                                        </td>

                                        {/* COLUMN 6: TARGET PERCENTAGE CONSTANT SYSTEM THRESHOLD VALUE */}
                                        <td className="p-3.5 border-r border-slate-100 text-center font-mono text-slate-400 font-semibold">
                                            {Math.round(row.attainment_target)}%
                                        </td>

                                        {/* COLUMN 7: THE ATTAINMENT REMARK MATRIX BADGE */}
                                        <td className="p-3.5 border-r border-slate-100 text-center font-montserrat uppercase font-black tracking-tight text-[11px]">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
                                                isAttained 
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200/40" 
                                                    : "bg-rose-50 text-rose-600 border-rose-200/40"
                                            }`}>
                                                {isAttained ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {row.remarks}
                                            </span>
                                        </td>

                                        {/* COLUMN 8: ACTION PLAN INPUT — Empty default content editable cell row */}
                                        <td className="p-1 bg-yellow-100/70 focus-within:bg-yellow-100/20 transition-colors">
                                            <input 
                                                type="text" 
                                                defaultValue={row.action_plan}
                                                placeholder="Enter corrective action details..."
                                                onBlur={(e) => handleCellBlur(row.item_number, "action_plan", e.target.value)}
                                                className="w-full bg-transparent text-xs font-semibold p-2.5 focus:outline-none border-b border-transparent focus:border-slate-400 transition-colors placeholder:text-slate-300 placeholder:font-normal"
                                            />
                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IloAttainmentReport;
