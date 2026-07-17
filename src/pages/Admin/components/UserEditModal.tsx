import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface SystemUser {
    id: number;
    employee_id: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    full_name: string;
    initials: string;
    email: string;
    contact_number: string;
    department_id: number;
    program_id: number | null;
    role: 'Admin' | 'Faculty' | 'Chairperson' | 'Department Head' | 'Dean';
    status: 'Pending' | 'Approved' | 'Rejected';
    is_active: number;
}

interface ProgramOption {
    id: number;
    code: string;
    name: string;
}

interface UserEditModalProps {
    user: SystemUser | null;
    onClose: () => void;
    onUserUpdated: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onUserUpdated }) => {
    // 1. Core Controlled Form State
    const [formData, setFormData] = useState({
        id: 0,
        employee_id: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        email: "",
        contact_number: "",
        password: "",
        department_id: 0,
        program_id: null as number | null,
        role: "Faculty" as SystemUser['role'],
        status: "Pending" as SystemUser['status'],
        is_active: 1
    });

    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [isLoadingPrograms, setIsLoadingPrograms] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 2. Fetch Programs based on Selected Department ID
    const fetchProgramsForDepartment = useCallback(async (deptId: number) => {
        if (!deptId || deptId === 0) {
            setPrograms([]);
            return;
        }
        try {
            setIsLoadingPrograms(true);
            const res = await fetch(`${API_ENDPOINTS.CASCADING_OPTIONS}?department_id=${deptId}`);
            const result = await res.json();
            if (result.status === "success") {
                setPrograms(result.programs || []);
            }
        } catch (err) {
            console.error("Failed loading cascading track selections:", err);
        } finally {
            setIsLoadingPrograms(false);
        }
    }, []);

    // 3. EFFECT BLOCK A: Populate initial user fields when modal target changes
    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                setFormData({
                    id: user.id,
                    employee_id: user.employee_id,
                    first_name: user.first_name,
                    middle_name: user.middle_name,
                    last_name: user.last_name,
                    suffix: user.suffix,
                    email: user.email || "",
                    contact_number: user.contact_number,
                    password: "", 
                    department_id: user.department_id,
                    program_id: user.program_id ? Number(user.program_id) : null, // Numerical casting
                    role: user.role,
                    status: user.status,
                    is_active: user.is_active,
                });
                setMessage(null);
                fetchProgramsForDepartment(user.department_id);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [user, fetchProgramsForDepartment]);
    // Place this inside UserEditModal.tsx right before your return statement:
    useEffect(() => {
        if (user && programs.length > 0) {
            const targetProgramId = user.program_id ? Number(user.program_id) : null;
            const programExists = programs.some(p => p.id === targetProgramId);

            if (programExists) {
                const timerGuard = setTimeout(() => {
                    setFormData(prev => ({ ...prev, program_id: targetProgramId }));
                }, 0);
                return () => clearTimeout(timerGuard);
            }

        }
    }, [programs, user]); // ◄ Fires instantly the moment the database programs arrive!

    // 5. Form Input Change Handler
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: name === 'department_id' || name === 'program_id' 
                    ? (value === "" || value === "0" ? null : Number(value)) 
                    : value
            };

            // If department selection changes, drop old program and fire cascading refresh
            if (name === "department_id") {
                updated.program_id = null;
                fetchProgramsForDepartment(Number(value));
            }

            return updated;
        });

        if (message) setMessage(null);
    };

    // 6. Submit Changes to PHP Backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);
        try {
            const response = await fetch(`${API_ENDPOINTS.ADMIN_UPDATE_USER}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (result.status === "success") {
                setMessage({ type: 'success', text: result.message || "Account profile changes recorded successfully." });
                setTimeout(() => {
                    onUserUpdated();
                    onClose();
                }, 1200);
            } else {
                setMessage({ type: 'error', text: result.message || "Failed to update profile changes." });
            }
        } catch (err) {
            const errorInstance = err as Error;
            console.error("Error during user update:", errorInstance);
            setMessage({ type: 'error', text: "Connection error to endpoint server configuration." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col transform scale-up-in">
                
                {/* Modal Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-montserrat">Edit System User Matrix</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Modify database attributes, program clearances, or leadership roles.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Scrollable Form Body Container */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    
                    {/* Identity Metadata Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</label>
                            <input
                                type="text"
                                name="employee_id"
                                value={formData.employee_id}
                                disabled
                                className="w-full text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none cursor-not-allowed select-none"
                            />
                        </div>
                    </div>

                    {/* Legal Full Name Input Fields Area */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Middle Name</label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suffix</label>
                            <input
                                type="text"
                                name="suffix"
                                value={formData.suffix}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                                placeholder="e.g. Jr., III"
                            />
                        </div>
                    </div>

                    {/* Communication Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                            <input
                                type="text"
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Dynamic Cascading Dropdown Grid (Department and Program) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                            <select
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                                required
                            >
                                <option value={0} disabled hidden>Select Department</option>
                                <option value={1}>DIT (Information Technology)</option>
                                <option value={2}>DCEA (Civil Engineering & Architecture)</option>
                                <option value={3}>DAE (Agricultural Engineering)</option>
                                <option value={4}>DEE (Electronics Engineering)</option>
                                <option value={5}>DIET (Industrial Engineering & Technology)</option>
                            </select>
                        </div>

                        {/* CASCADING PROGRAM SELECTOR LAYOUT ELEMENT BOX */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                <span>Assigned Program Track</span>
                                {isLoadingPrograms && <span className="text-primary font-black animate-pulse text-[10px] lowercase">Syncing list...</span>}
                            </label>
                            <select
                                name="program_id"
                                value={formData.program_id || 0}
                                onChange={handleChange}
                                disabled={programs.length === 0}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                            >
                                <option value={0}>Not Applicable / None</option>
                                {programs.map(prog => (
                                    <option key={prog.id} value={prog.id}>
                                        {prog.code} — {prog.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Role & System Level Approvals Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Faculty">Faculty</option>
                                <option value="Chairperson">Chairperson</option>
                                <option value="Department Head">Department Head</option>
                                <option value="Dean">Dean</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {/* Change Password Block */}
                    <div className="flex flex-col gap-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Change Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors mt-1"
                        />
                        <span className="text-[10px] text-slate-400 font-medium mt-1">Leave field blank or empty to keep current password unchanged.</span>
                    </div>

                    {/* Account Activation Switch */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">Account Authorization Status</span>
                            <span className="text-[11px] text-slate-400">Toggle whether to activate this account block.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active === 1}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>

                    {/* Trigger Response Message Notification Blocks */}
                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium border animate-fade-in ${
                            message.type === 'success' 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Bottom Modal Actions Toolbar row */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
