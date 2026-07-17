import React, { useState } from "react";
import { ListPlus, Trash2 } from "lucide-react";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface StudentOutcome {
    id: number;
    so_letter: string;
    so_value: string;
}

interface ProgramHeadOutcomesPanelProps {
    outcomes: StudentOutcome[];
    onRefreshNeeded: () => void;
}

const ProgramHeadOutcomesPanel: React.FC<ProgramHeadOutcomesPanelProps> = ({ outcomes, onRefreshNeeded }) => {
    const [newLetter, setNewLetter] = useState<string>("");
    const [newValue, setNewValue] = useState<string>("");
    const [isSavingOutcome, setIsSavingOutcome] = useState<boolean>(false);

    const handleAddOutcome = async (e: React.FormEvent) => {
        e.preventDefault();
        const letterToken = newLetter.trim().toUpperCase();
        if (!letterToken || !newValue.trim() || letterToken.length !== 1 || !/^[A-Z]$/.test(letterToken)) {
            alert("Please provide a single valid letter identifiers code (A-Z).");
            return;
        }

        try {
            setIsSavingOutcome(true);
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const res = await fetch(API_ENDPOINTS.PROGRAM_HEAD_SO, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, so_letter: letterToken, so_value: newValue.trim() })
            });
            const out = await res.json();
            if (out.status === "success") {
                setNewLetter("");
                setNewValue("");
                onRefreshNeeded();
            } else {
                alert(out.message);
            }
        } catch {
            alert("Server connection fault writing outcomes data.");
        } finally {
            setIsSavingOutcome(false);
        }
    };

    const handleOutcomeBlur = async (letter: string, updatedValue: string) => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            await fetch(API_ENDPOINTS.PROGRAM_HEAD_SO, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, so_letter: letter, so_value: updatedValue.trim() })
            });
        } catch (err) {
            console.error("Failed synchronization inline blur cell writes:", err);
        }
    };

    const handleDeleteOutcome = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this Student Outcome definition block cleanly?")) return;
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const res = await fetch(API_ENDPOINTS.PROGRAM_HEAD_SO, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, id: id })
            });
            const out = await res.json();
            if (out.status === "success") {
                onRefreshNeeded();
            }
        } catch (err) {
            console.error("Removal communication dropouts:", err);
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* ADD NEW STUDENT OUTCOME INLINE ROW SUBMISSION CONTROLLER BOX */}
            <form onSubmit={handleAddOutcome} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3 max-w-2xl select-none">
                <div className="w-full sm:w-24 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-montserrat">SO Letter</label>
                    <input 
                        type="text" 
                        maxLength={1} 
                        placeholder="e.g. A" 
                        value={newLetter}
                        onChange={(e) => setNewLetter(e.target.value.replace(/[^a-zA-Z]/g, ""))}
                        className="bg-white border border-slate-200 text-xs font-bold text-center uppercase rounded-lg p-2 focus:outline-none focus:border-primary w-full h-9"
                    />
                </div>
                <div className="flex-1 flex flex-col gap-1 w-full">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-montserrat">Description Value Specification</label>
                    <input 
                        type="text" 
                        placeholder="An ability to apply knowledge of mathematics, science, and engineering..." 
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="bg-white border border-slate-200 text-xs font-semibold rounded-lg p-2 focus:outline-none focus:border-primary w-full h-9"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isSavingOutcome}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 h-9 rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                    <ListPlus className="w-3.5 h-3.5" /> Append SO
                </button>
            </form>

            {/* INTERACTIVE EDITABLE OUTCOMES SUMMARY ROWS DATA LIST TABLE */}
            {outcomes.length === 0 ? (
                <div className="w-full py-12 text-center text-xs font-bold text-slate-400 font-mono select-none">
                    No student outcomes mapped inside the curriculum track yet.
                </div>
            ) : (
                /* FIXED: Removed max-w-4xl to allow 100% fluid horizontal workspace span layout [INDEX: 0.1.98] */
                <div className="w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <table className="w-full border-collapse text-left table-fixed">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 select-none text-[10px] font-black text-slate-400 uppercase font-montserrat tracking-wider">
                                <th className="p-4 w-24 text-center">Outcome</th>
                                <th className="p-4">Description Text Specification (Click anywhere to rewrite value cells)</th>
                                <th className="p-4 w-20 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-semibold text-slate-700">
                            {outcomes.map((so) => (
                                <tr key={so.id} className="hover:bg-slate-50/10 group border-b border-slate-100 last:border-0">
                                    <td className="p-3 text-center border-r border-slate-100 bg-slate-50/10 select-none vertical-top pt-4">
                                        <span className="font-mono font-black text-sm text-primary bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-md">
                                            SO {so.so_letter}
                                        </span>
                                    </td>
                                    
                                    {/* COLUMN 2 DESCRIPTION TEXT WORKSPACE PORT CANVAS CELL [INDEX: 0.1.98] */}
                                    <td className="p-2 bg-yellow-50/20 group-hover:bg-yellow-50/5 focus-within:bg-white transition-colors">
                                        {/* FIXED: Swapped static inputs layout for dynamic textareas to auto-expand line wraps height natively */}
                                        <textarea
                                            defaultValue={so.so_value}
                                            rows={Math.max(2, Math.ceil(so.so_value.length / 100))} // Dynamically sets rows count based on character payload metrics
                                            onBlur={(e) => handleOutcomeBlur(so.so_letter, e.target.value)}
                                            onInput={(e) => {
                                                // Dynamic auto-grow tracking script handling
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = "auto";
                                                target.style.height = `${target.scrollHeight}px`;
                                            }}
                                            className="w-full bg-transparent text-slate-600 focus:text-slate-900 font-semibold px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-200 rounded-lg font-sans resize-none overflow-hidden leading-relaxed block"
                                            placeholder="Enter outcome parameter specifications details..."
                                        />
                                    </td>
                                    
                                    <td className="p-2 text-center vertical-top pt-3">
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteOutcome(so.id)}
                                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                            title="Delete outcome block definition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProgramHeadOutcomesPanel;
