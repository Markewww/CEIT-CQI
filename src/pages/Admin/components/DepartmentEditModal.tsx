import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface DepartmentData {
    id: number;
    code: string;
    name: string;
}

interface DepartmentEditModalProps {
    department: DepartmentData | null;
    onClose: () => void;
    onDepartmentUpdated: () => void;
}

const DepartmentEditModal: React.FC<DepartmentEditModalProps> = ({ department, onClose, onDepartmentUpdated }) => {
    const [formData, setFormData] = useState({
        id: 0,
        code: "",
        name: ""
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Populate the form fields when the department prop opens or updates
    useEffect(() => {
        if (department) {
            const timerGuard = setTimeout(() => {
                setFormData({
                    id: department.id,
                    code: department.code || "",
                    name: department.name || ""
                });
            setMessage(null);
        }, 0);
            return () => clearTimeout(timerGuard);
        }
    }, [department]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (message) setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim() || !formData.name.trim()) {
            setMessage({ type: 'error', text: "All fields are required." });
            return;
        }
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(API_ENDPOINTS.ADMIN_UPDATE_DEPARTMENT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.status === "success") {
                setMessage({ type: 'success', text: "Department updated successfully." });
                setTimeout(() => {
                    onDepartmentUpdated();
                    onClose();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: result.message || "Failed to update department records." });
            }
        } catch (err) {
            const errorInstance = err as Error;
            console.error("Error updating department:", errorInstance);
            setMessage({ type: 'error', text: "Connection error to endpoint server configuration." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!department) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col transform scale-up-in">
                
                {/* Modal Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-montserrat">Configure Department Branch</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Modify database keys, academic descriptions, or institutional module parameters.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
                </div>

                {/* Form Body Container */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    
                    {/* Department Code Configuration Input */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department Code</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            maxLength={10}
                            placeholder="e.g., DIT"
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors uppercase"
                            required
                        />
                        <span className="text-[10px] text-slate-400 font-medium">Keep this short and uppercase to preserve layout grid integrity.</span>
                    </div>

                    {/* Department Name Input Field */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Department Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={150}
                            placeholder="e.g., Department of Information Technology"
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                    </div>

                    {/* Status Alert Messages Banner Area */}
                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium border ${
                            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form Controls Action Triggers Buttons Section */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DepartmentEditModal;
