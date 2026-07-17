import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { ArrowLeft, Trash2, PlusCircle, FileSpreadsheet } from "lucide-react";

interface OutcomeOption {
    id: number;
    so_letter: string;
    so_value: string;
}

interface CoOption {
    co_id: string;
}

interface MappingRow {
    id: number;
    co_id: string;
    performance_indicator: string;
    so_letter: string;
    so_value: string;
    attainment_score: number;
}

interface ProgramHeadAuditWorkspaceProps {
    scheduleId: string;
    onBack: () => void;
}

const ProgramHeadAuditWorkspace: React.FC<ProgramHeadAuditWorkspaceProps> = ({ scheduleId, onBack }) => {
    const [rows, setRows] = useState<MappingRow[]>([]);
    const [soOptions, setSoOptions] = useState<OutcomeOption[]>([]);
    const [coOptions, setCoOptions] = useState<CoOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSaving] = useState<boolean>(false);

    // Form submission tracking fields states [INDEX: 0.1.89]
    const [selectedCo, setSelectedCo] = useState<string>("");
    const [piText, setPiText] = useState<string>("");
    const [selectedSo, setSelectedSo] = useState<string>("");

    const loadWorkspaceSummarySheet = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_ENDPOINTS.PROGRAM_HEAD_SO_PI}?schedule_id=${scheduleId}`);
            const result = await res.json();
            if (result.status === "success") {
                setRows(result.data || []);
                setSoOptions(result.available_outcomes || []);
                setCoOptions(result.available_course_outcomes || []);
            }
        } catch (err) {
            console.error("Failed loading unified outcome configurations matrices:", err);
        } finally {
            setIsLoading(false);
        }
    }, [scheduleId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadWorkspaceSummarySheet();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadWorkspaceSummarySheet]);

    const handleCreateRowEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCo || !piText.trim() || !selectedSo) {
            alert("Please fill up all mapping settings fields before adding.");
            return;
        }

        // Validate that PI strictly matches a number with up to 2 decimal places [INDEX: 0.1.100]
        const decimalRegex = /^\d+(\.\d{1,2})?$/;
        if (!decimalRegex.test(piText.trim())) {
            alert("Performance Indicator must be a valid number containing up to two decimal places (e.g. 1.25 or 2).");
            return;
        }

        try {
            setIsSaving(true);
            const res = await fetch(API_ENDPOINTS.PROGRAM_HEAD_SO_PI, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // FIXED: Removed manual attainment_score payload submission [INDEX: 0.1.100]
                body: JSON.stringify({
                    schedule_id: scheduleId,
                    co_id: selectedCo,
                    performance_indicator: parseFloat(piText.trim()).toFixed(2), // Formats precisely to 2 decimals
                    so_id: Number(selectedSo)
                })
            });
            const out = await res.json();
            if (out.status === "success") {
                setPiText("");
                loadWorkspaceSummarySheet();
            } else {
                alert(out.message);
            }
        } catch {
            alert("Server connection dropout sending mapping row.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRowRecord = async (rowId: number) => {
        if (!window.confirm("Are you sure you want to remove this CO-SO mapping record?")) return;
        try {
            const res = await fetch(API_ENDPOINTS.PROGRAM_HEAD_SO_PI, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: rowId })
            });
            const out = await res.json();
            if (out.status === "success") {
                loadWorkspaceSummarySheet();
            }
        } catch (err) {
            console.error("Removal failure processing tracking keys:", err);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
            {/* Header Toolbar Title Area Row [INDEX: 0.1.92] */}
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5 select-none">
                <button 
                    onClick={onBack}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <div>
                    <h2 className="text-xl font-black text-slate-900 font-montserrat tracking-tight flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-primary" /> CO-SO Attainment Mapping Matrix
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Central configuration grid mapping Course Outcomes onto targeted Program Student Performance Indicators.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="w-full py-20 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Loading core matrix sheets...</span>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. MASTER SUMMARY MATRIX DATA GRID TABLE LAYOUT VIEW [INDEX: 0.1.93] */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 select-none text-[10px] font-black text-slate-400 uppercase tracking-wider font-montserrat">
                                        <th className="p-4 w-44">Course Outcome (CO)</th>
                                        <th className="p-4 w-32 text-center">Mapped SO</th>
                                        <th className="p-4">Performance Indicator (PI)</th>
                                        <th className="p-4 w-40 text-center">Attainment Score</th>
                                        <th className="p-4 w-20 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-semibold text-slate-600">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-400 font-bold font-mono select-none">
                                                No course outcomes mapped inside this configuration catalog block yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/20 group border-b border-slate-100 last:border-0">
                                                <td className="p-4 font-bold text-slate-900 truncate max-w-44 select-none">
                                                    CO {row.co_id}
                                                </td>
                                                <td className="p-4 text-center select-none">
                                                    <span className="font-mono font-black bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded" title={row.so_value}>
                                                        SO {row.so_letter}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono font-black text-primary text-xs tracking-wide">
                                                    {parseFloat(row.performance_indicator).toFixed(2)}
                                                </td>
                                                <td className="p-4 text-center font-mono font-black text-sm text-slate-800 select-none">
                                                    {Math.round(row.attainment_score)}%
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteRowRecord(row.id)}
                                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                                        title="Delete mapping row entry"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. CREATION CONTROL ENTRY FORM ROW CONTAINER PANEL [INDEX: 0.1.95] */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm select-none">
                        <h4 className="text-xs font-black text-slate-900 font-montserrat uppercase tracking-wider mb-4 flex items-center gap-1">
                            <PlusCircle className="w-4 h-4 text-primary" /> Map New Mapping Entry Row
                        </h4>
                        <form onSubmit={handleCreateRowEntry} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            {/* FIELD A: CO ID SELECTION SELECT BOX [INDEX: 0.1.96] */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-montserrat">Select CO Source</label>
                                <select
                                    value={selectedCo}
                                    onChange={(e) => setSelectedCo(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg p-2 h-9 focus:border-primary text-slate-600 font-semibold cursor-pointer outline-none text-xs"
                                >
                                    <option value="">-- Choose CO --</option>
                                    {coOptions.map((co, idx) => (
                                        <option key={idx} value={co.co_id}>{co.co_id}</option>
                                    ))}
                                </select>
                            </div>

                            {/* FIELD B: SO SELECT DROPDOWN [INDEX: 0.1.97] */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-montserrat">Target SO Letter</label>
                                <select
                                    value={selectedSo}
                                    onChange={(e) => setSelectedSo(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-lg p-2 h-9 outline-none focus:border-primary text-slate-600 font-semibold cursor-pointer text-xs"
                                >
                                    <option value="">-- Choose SO --</option>
                                    {soOptions.map(so => (
                                        <option key={so.id} value={so.id}>SO {so.so_letter} ({so.so_value.slice(0, 20)}...)</option>
                                    ))}
                                </select>
                            </div>

                            {/* FIELD C: PERFORMANCE INDICATOR VALUE NUMBER TEXTBOX [INDEX: 0.1.97] */}
                            <div className="flex flex-col gap-1 w-full">
                                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-montserrat">PI Value (e.g. 1.15)</label>
                                <input
                                    type="text"
                                    placeholder="1.00"
                                    value={piText}
                                    onChange={(e) => setPiText(e.target.value.replace(/[^0-9.]/g, ""))}
                                    className="bg-white border border-slate-200 text-xs font-mono font-bold rounded-lg px-3 h-9 outline-none focus:border-primary text-slate-700"
                                />
                            </div>

                            {/* SUBMIT BUTTON TRIGGER ACTIONS BUTTON [INDEX: 0.1.99] */}
                            <div className="w-full">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold h-9 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    Append Record Row
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgramHeadAuditWorkspace;

