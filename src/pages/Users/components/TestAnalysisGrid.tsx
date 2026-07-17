import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface Student {
    student_id: string;
    full_name: string;
}

interface TestAnalysisGridProps {
    scheduleId: string;
    period: "midterms" | "finals";
    students: Student[];
}

const TestAnalysisGrid: React.FC<TestAnalysisGridProps> = ({ scheduleId, period, students }) => {
    const [totalItems, setTotalItems] = useState<number>(50);
    const [analysisData, setAnalysisData] = useState<Record<string, number[]>>({});
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const loadAnalysisMatrix = useCallback(async () => {
        try {
            const res = await fetch(`${API_ENDPOINTS.FACULTY_TEST_ANALYSIS}?schedule_id=${scheduleId}&period=${period}`);
            const out = await res.json();
            if (out.status === "success") {
                setTotalItems(out.total_items);
                setAnalysisData(out.analysis_data || {});
            }
        } catch (e) {
            console.error("Failed to read analysis sheet matrices:", e);
        }
    }, [scheduleId, period]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadAnalysisMatrix();
        }, 1000); // Delay of 1 second

        return () => clearTimeout(timer); // Cleanup the timer on unmount
    }, [loadAnalysisMatrix]);

    const handleConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totalItems < 1 || totalItems > 300) {
            alert("Items scope limit holds restrictions between 1 and 300.");
            return;
        }
        setIsSaving(true);
        setAlertMessage(null);
        try {
            const res = await fetch(`${API_ENDPOINTS.FACULTY_TEST_ANALYSIS}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    schedule_id: scheduleId.toString(), 
                    period: period, 
                    total_items: totalItems.toString() 
                })
            });
            const out = await res.json();
            if (out.status === "success") {
                setAlertMessage("Grid configuration updated!");
                setTimeout(() => setAlertMessage(null), 2000);
                loadAnalysisMatrix();
            } else {
                setAlertMessage(`⚠️ ${out.message}`);
            }
        } catch {
            setAlertMessage("⚠️ Failed updating server configurations.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCheckboxToggle = async (studentId: string, questionNum: number) => {
        const currentCorrect = analysisData[studentId] || [];
        let updatedCorrect: number[];

        if (currentCorrect.includes(questionNum)) {
            updatedCorrect = currentCorrect.filter(n => n !== questionNum);
        } else {
            updatedCorrect = [...currentCorrect, questionNum].sort((a, b) => a - b);
        }

        // Optimistic UI update to ensure checkboxes flip immediately on click
        setAnalysisData(prev => ({ ...prev, [studentId]: updatedCorrect }));
        setIsSaving(true);

        try {
            const res = await fetch(`${API_ENDPOINTS.FACULTY_TEST_ANALYSIS}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule_id: scheduleId,
                    period,
                    student_id: studentId,
                    corrected_items: updatedCorrect
                })
            });
            const out = await res.json();
            if (out.status !== "success") {
                console.error("Database rejected save:", out.message);
            }
        } catch {
            console.error("Failed writing checkbox data cell state.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in text-slate-800">
            {/* Total Items Management Control Box */}
            <form onSubmit={handleConfigSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3 max-w-md select-none">
                <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Set Total Test Items (1-300)</label>
                    <input 
                        type="number" 
                        min={1} 
                        max={300} 
                        value={totalItems} 
                        onChange={e => setTotalItems(Number(e.target.value))} 
                        className="bg-white border border-slate-200 text-xs font-semibold rounded-lg p-2 focus:outline-none focus:border-primary w-full"
                    />
                </div>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer mt-5 shrink-0 transition-colors">Update Grid</button>
                {alertMessage && <span className="text-[10px] font-bold text-primary font-mono mt-5 shrink-0">{alertMessage}</span>}
            </form>

            {/* SPREADSHEET CARD GRID CONTAINER VIEW PORT */}
            <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-montserrat flex items-center justify-between">
                    <span>Item Response Test Analysis Spreadsheet Matrix</span>
                    {isSaving && <span className="text-primary font-black animate-pulse text-[9px]">Synchronizing Matrix Cells...</span>}
                </div>

                <div className="overflow-x-auto max-w-full">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider font-montserrat">
                                <th className="p-3 w-40 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Student Info</th>
                                <th className="p-3 w-20 text-center border-r border-slate-200 bg-slate-100/50">Score Tally</th>
                                {Array.from({ length: totalItems }, (_, i) => i + 1).map(num => (
                                    <th key={num} className="p-2 w-12 text-center text-[9px] font-mono border-r border-slate-100">Q{num}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                            {students.map(s => {
                                const correctList = analysisData[s.student_id] || [];
                                const totalScore = correctList.length;

                                return (
                                    <tr key={s.student_id} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="p-3 sticky left-0 bg-white z-10 font-bold text-slate-900 border-r border-slate-100 truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                            <p className="truncate">{s.full_name}</p>
                                            <span className="text-[10px] font-mono text-slate-400">{s.student_id}</span>
                                        </td>
                                        <td className="p-3 text-center border-r border-slate-200 bg-slate-50/40 font-mono font-black text-sm text-primary">
                                            {totalScore} <span className="text-[10px] font-normal text-slate-400">/ {totalItems}</span>
                                        </td>
                                        {Array.from({ length: totalItems }, (_, i) => i + 1).map(num => {
                                            const isChecked = correctList.includes(num);
                                            return (
                                                <td key={num} className={`p-1 border-r border-slate-100 text-center transition-colors ${isChecked ? 'bg-emerald-50/20' : ''}`}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleCheckboxToggle(s.student_id, num)}
                                                        className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                                                    />
                                                </td>
                                            );
                                        })}
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

export default TestAnalysisGrid;
