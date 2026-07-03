import React, { useState, useEffect } from "react";
import { APIconfig } from "@/config/apiConfig";

interface DepartmentDropdownData {
    id: number;
    code: string;
    name: string;
}

interface ProgramCreateModalProps {
    onClose: () => void;
    onProgramCreated: () => void;
}

const ProgramCreateModal: React.FC<ProgramCreateModalProps> = ({ onClose, onProgramCreated }) => {
    // Form management state variables
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        department_id: ""
    });

    // Department listings tracker states
    const [departments, setDepartments] = useState<DepartmentDropdownData[]>([]);
    const [isFetchingDepts, setIsFetchingDepts] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 1. DYNAMIC FETCH: Pull all active CEIT departments from your database on modal mount
    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const response = await fetch(`${APIconfig}/admin/departments.php`);
                const result = await response.json();
                if (result.status === "success") {
                    setDepartments(result.data);
                } else {
                    console.error("Failed to parse system department parameters.");
                }
            } catch (error) {
                console.error("Network error fetching department selections:", error);
            } finally {
                setIsFetchingDepts(false);
            }
        };
        loadDepartments();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (message) setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim() || !formData.name.trim() || !formData.department_id) {
            setMessage({ type: 'error', text: "All configuration fields are required." });
            return;
        }
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(`${APIconfig}/admin/create_program.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: formData.code.trim(),
                    name: formData.name.trim(),
                    department_id: Number(formData.department_id) // Cast to integer primitive
                })
            });

            const result = await response.json();
            if (result.status === "success") {
                setMessage({ type: 'success', text: "New degree program registered successfully!" });
                setTimeout(() => {
                    onProgramCreated();
                    onClose();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: result.message || "Failed to create curriculum profile." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Connection error to endpoint server configuration." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col transform scale-up-in">
                
                {/* Modal Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-montserrat">Add New Degree Program</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Register an authorized curriculum track and link it directly to its managing department.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
                </div>

                {/* Form Body Container */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    
                    {/* Program Code and Parent Department Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* Program Code */}
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Program Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code}
                                onChange={handleChange}
                                maxLength={15}
                                placeholder="e.g., BSIT"
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors uppercase placeholder:text-bg-disabled"
                                required
                            />
                        </div>

                        {/* DYNAMIC Department Link Dropdown */}
                        <div className="flex flex-col gap-1 md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Managing Department</label>
                            <select
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                required
                                disabled={isFetchingDepts}
                            >
                                <option value="" disabled hidden>
                                    {isFetchingDepts ? "Loading active departments..." : "Select Department Link"}
                                </option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.code} — {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Program Full Title Input Field */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Curriculum Title</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={150}
                            placeholder="e.g., Bachelor of Science in Information Technology"
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled"
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
                            disabled={isSubmitting || isFetchingDepts}
                            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? "Registering..." : "Register Program"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProgramCreateModal;
