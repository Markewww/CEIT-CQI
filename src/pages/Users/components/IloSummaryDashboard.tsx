import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface SummaryRow {
    co_name: string;
    ilo_name: string;
    attainment_score: number;
    attainment_target: number;
    remarks: "ATTAINED" | "NOT ATTAINED";
}

interface IloSummaryDashboardProps {
    scheduleId: string;
    period: "midterms" | "finals";
}

const IloSummaryDashboard: React.FC<IloSummaryDashboardProps> = ({ scheduleId, period }) => {
    const [rows, setSummaryRows] = useState<SummaryRow[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [syncingKey, setSyncingKey] = useState<string | null>(null);

    const loadIloSummary = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`http://localhost/cqi/api/faculty/period_summary.php?schedule_id=${scheduleId}&period=${period}`);
            const out = await res.json();
            if (out.status === "success") {
                setSummaryRows(out.summary_data || []);
            }
        } catch (e) {
            console.error("Failed to load aggregated LO indicators summary:", e);
        } finally {
            setIsLoading(false);
        }
    }, [scheduleId, period]);

    useEffect(() => {
        loadIloSummary();
    }, [loadIloSummary]);

    const handleCoInputChange = (iloName: string, inputValue: string) => {
        // STRIct frontend REGEX: Strips out everything except raw digits (0-9) immediately [INDEX: 1]
        const numbersOnly = inputValue.replace(/[^0-9]/g, "");
        setSummaryRows(prev => prev.map(row => 
            row.ilo_name === iloName ? { ...row, co_name: numbersOnly } : row
        ));
    };

    const handleCoBlur = async (iloName: string, finalValue: string) => {
        setSyncingKey(iloName);
        try {
            await fetch("http://localhost/cqi/api/faculty/period_summary.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule_id: scheduleId,
                    period,
                    ilo_name: iloName,
                    co_name: finalValue.trim()
                })
            });
        } catch (err) {
            console.error("Failed writing Course Outcome digit cell to storage:", err);
        } finally {
            setSyncingKey(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-xs font-bold text-slate-400 font-montserrat animate-pulse">Aggregating mean learning outcome ratios...</div>;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in text-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 font-montserrat uppercase tracking-wider select-none px-1">
                <span>Learning Outcomes Summary Grid</span>
                {syncingKey && <span className="text-primary font-black animate-pulse text-[10px]">Syncing ILO {syncingKey} to CO...</span>}
            </div>

            {rows.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                    No active ILO keys configured inside your Class Record. Please map item codes first to compile averages sheets.
                </div>
            ) : (
                <div className="w-full bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse select-none">
                            <thead>
                                <tr className="bg-white border-b-2 border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider font-montserrat">
                                    <th className="p-3.5 border-r border-slate-100 text-center">COURSE OUTCOME</th>
                                    <th className="p-3.5 border-r border-slate-100 text-center">INTENDED LEARNING OUTCOME</th>
                                    <th className="p-3.5 border-r border-slate-100 text-center">ATTAINMENT SCORE</th>
                                    <th className="p-3.5 border-r border-slate-100 text-center">TARGET PERCENTAGE</th>
                                    <th className="p-3.5 text-center pr-6">REMARKS STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                                {rows.map((row) => {
                                    const isAttained = row.remarks === "ATTAINED";
                                    return (
                                        <tr key={row.ilo_name} className="hover:bg-slate-50/30 transition-colors">
                                            
                                            {/* COLUMN 1: COURSE OUTCOME # — Restricted strictly to numeric values [INDEX: 0.1.8] */}
                                            <td className="p-1 bg-yellow-100/70 border-r border-slate-200/80 text-center focus-within:bg-yellow-200/60 transition-colors">
                                                <div className="flex items-center justify-center gap-1 text-slate-800 font-extrabold">
                                                    <input 
                                                        type="text"
                                                        inputMode="numeric" // Forces numeric keypads on mobile screens
                                                        value={row.co_name}
                                                        placeholder="..."
                                                        onChange={(e) => handleCoInputChange(row.ilo_name, e.target.value)}
                                                        onBlur={(e) => handleCoBlur(row.ilo_name, e.target.value)}
                                                        className="w-12 bg-transparent text-left font-black focus:outline-none py-1 border-b border-transparent focus:border-slate-400"
                                                    />
                                                </div>
                                            </td>

                                            {/* COLUMN 2: THE INTENDED LEARNING OUTCOME # [INDEX: 0.1.8] */}
                                            <td className="p-4 border-r border-slate-100 font-extrabold text-slate-700 font-montserrat bg-slate-50/10 text-center">
                                                ILO {row.ilo_name}
                                            </td>

                                            {/* COLUMN 3: CALCULATED ATTAINMENT EXAM AVERAGE [INDEX: 0.1.8] */}
                                            <td className={`p-4 border-r border-slate-100 text-center font-mono font-black text-sm ${isAttained ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {Math.round(row.attainment_score)}%
                                            </td>

                                            {/* COLUMN 4: CONSTANT TARGET RATIO REPOSITORY VALUES [INDEX: 0.1.8] */}
                                            <td className="p-4 border-r border-slate-100 text-center font-mono text-slate-400 font-semibold">
                                                {Math.round(row.attainment_target)}%
                                            </td>

                                            {/* COLUMN 5: PERFORMANCE COMPLIANCE STATE BADGES [INDEX: 0.1.8] */}
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

export default IloSummaryDashboard;

