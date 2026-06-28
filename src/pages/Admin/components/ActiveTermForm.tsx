import React, { useState, useEffect } from "react";

interface ActiveTermFormProps {
    userName: string;
}

const ActiveTermForm: React.FC<ActiveTermFormProps> = ({ userName }) => {
    const [academicYear, setAcademicYear] = useState<string>("");
    const [semester, setSemester] = useState<string>("");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load active settings when the component mounts
    useEffect(() => {
        const fetchActiveTerm = async () => {
            try {
                const response = await fetch("http://localhost/cqi/api/admin/active_term.php");
                const data = await response.json();
                if (data.status === "success" && data.data) {
                    setAcademicYear(data.data.academic_year || "");
                    setSemester(data.data.semester || "");
                }
            } catch (error) {
                console.error("Failed to load active term configurations:", error);
            }
        };
        fetchActiveTerm();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!academicYear || !semester) {
            setMessage({ type: 'error', text: 'Please fill out all configuration fields.' });
            return;
        }
        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch("http://localhost/cqi/api/admin/active_term.php", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    academic_year: academicYear,
                    semester: semester,
                    updated_by_user: userName
                })
            });
            const data = await response.json();
            if (data.status === "success") {
                setMessage({ type: 'success', text: 'Active term configuration updated successfully.' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save configuration settings.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Server connection failure.' });
        } finally {
            setIsSaving(false);
        }
    };

    // Dynamically generate academic year options list (Current year up to 3 years ahead)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => {
        const start = currentYear - 1 + i;
        const end = start + 1;
        return `${start}-${end}`;
    });

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-fit">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-montserrat">Active Term Setup</h3>
                <p className="text-xs text-slate-500 mt-0.5">Configure the active system-wide academic year and term parameters.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Academic Year Selection Field */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Year</label>
                    <select
                        name="academic_year"
                        value={academicYear}
                        onChange={(e) => { setAcademicYear(e.target.value); if (message) setMessage(null); }}
                        className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors"
                    >
                        <option value="" disabled hidden>Select Active Academic Year</option>
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>A.Y. {year}</option>
                        ))}
                    </select>
                </div>

                {/* Semester Selection Field */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Semester</label>
                    <select
                        name="semester"
                        value={semester}
                        onChange={(e) => { setSemester(e.target.value); if (message) setMessage(null); }}
                        className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors"
                    >
                        <option value="" disabled hidden>Select Active Semester</option>
                        <option value="First Semester">First Semester</option>
                        <option value="Second Semester">Second Semester</option>
                        <option value="Summer/Midyear">Summer / Midyear</option>
                    </select>
                </div>

                {/* Feedback Alerts Notifications Box */}
                {message && (
                    <div className={`p-3 rounded-lg text-xs font-medium border ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Submit Configuration Control Trigger Button */}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {isSaving ? "Saving Configuration..." : "Save Academic Term"}
                </button>
            </form>
        </div>
    );
};

export default ActiveTermForm;
