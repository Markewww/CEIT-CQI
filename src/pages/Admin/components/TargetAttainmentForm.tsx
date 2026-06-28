import React, { useState, useEffect } from "react";

interface TargetAttainmentFormProps {
    activeDept: string;
    userName: string;
}

const TargetAttainmentForm: React.FC<TargetAttainmentFormProps> = ({ activeDept, userName }) => {
    const [attainment, setAttainment] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>("0");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setInputValue(attainment.toString());
    }, [attainment]);

    useEffect(() => {
        const fetchThreshold = async () => {
            try {
                // Hits your single PHP endpoint file directly
                const response = await fetch(`http://localhost/cqi/api/admin/attainment.php?department_code=${activeDept}`);
                const data = await response.json();
                if (data.status === "success") {
                    setAttainment(data.value);
                }
            } catch (error) {
                console.error("Failed to load initial threshold:", error);
            }
        };
        if (activeDept) fetchThreshold();
    }, [activeDept]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAttainment(Number(e.target.value));
        if (message) setMessage(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setInputValue(rawValue);
        if (message) setMessage(null);

        if (rawValue === "") return;
        let numericValue = Number(rawValue);
        if (!isNaN(numericValue)) {
            setAttainment(Math.max(0, Math.min(100, numericValue)));
        }
    };

    const handleInputBlur = () => {
        setInputValue(attainment.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch(`http://localhost/cqi/api/admin/attainment.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    setting_value: attainment.toString(),
                    department_code: activeDept,
                    updated_by_user: userName
                })
            });
            const data = await response.json();
            if (data.status === "success") {
                setMessage({ type: 'success', text: `Configuration saved permanently at ${attainment}%.` });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save changes.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Server connection failure.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-fit">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-montserrat">Target Attainment Setup</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define the base performance metric threshold for institutional audits.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-600">Target Value</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className="w-16 text-center font-bold text-lg text-slate-900 bg-white border border-slate-300 rounded-lg p-1 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>0% (Min)</span>
                        <span>100% (Max)</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={attainment}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    />
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-xs font-medium border ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? "Saving changes..." : "Save Configuration"}
                </button>
            </form>
        </div>
    );
};

export default TargetAttainmentForm;
