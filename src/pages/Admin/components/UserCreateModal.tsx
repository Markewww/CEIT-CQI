import React, { useState, useEffect } from "react";
import { APIconfig } from "@/config/apiConfig";

interface UserCreateModalProps {
    onClose: () => void;
    onUserCreated: () => void;
}

interface ProgramOption {
    id: number;
    code: string;
    name: string;
}

const UserCreateModal: React.FC<UserCreateModalProps> = ({ onClose, onUserCreated }) => {
    // 1. Initial State Data Model [INDEX: 0.1.19]
    const [formData, setFormData] = useState({
        employee_id: "",
        username: "", // Tracked parameter cell field
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        department: "", // Text code key placeholder e.g. 'DIT'
        program_id: 0,   // ◄ INJECTED PROGRAM ID INT TRACKER [INDEX: 1]
        email: "",
        contact_number: "",
        password: "",
        confirm_password: "",
        role: "Faculty",
        status: "Approved" // Default status for new users automatically approved [INDEX: 0.1.19]
    });

    // Cascading options tracking layers [INDEX: 1]
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [isLoadingPrograms, setIsLoadingPrograms] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Password Complexity Rules Metrics validation tracking [INDEX: 0.1.19]
    const hasMinMax = formData.password.length >= 8 && formData.password.length <= 50;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const passwordsMatch = formData.password === formData.confirm_password && formData.confirm_password.length > 0;
    const isPasswordValid = hasMinMax && hasUppercase && hasLowercase && hasNumber && hasSymbol && passwordsMatch;

    // Map your plain text department codes down into their exact relational numeric IDs [INDEX: 1]
    const getDepartmentIdByCode = (code: string): number => {
        if (code === "DIT") return 1;
        if (code === "DCEA") return 2;
        if (code === "DAE") return 3;
        if (code === "DEE") return 4;
        if (code === "DIET") return 5;
        return 0;
    };

    // 2. Asynchronous Cascading Dropdown Loader Effect [INDEX: 1]
    useEffect(() => {
        const deptId = getDepartmentIdByCode(formData.department);
        if (deptId === 0) {
            setPrograms([]);
            setFormData(prev => ({ ...prev, program_id: 0 }));
            return;
        }

        const fetchPrograms = async () => {
            try {
                setIsLoadingPrograms(true);
                const res = await fetch(`${APIconfig}/helpers/get_cascading_options.php?department_id=${deptId}`);
                const result = await res.json();
                if (result.status === "success") {
                    setPrograms(result.programs || []);
                }
            } catch (err) {
                console.error("Failed fetching cascading programs inside creation dialog:", err);
            } finally {
                setIsLoadingPrograms(false);
            }
        };

        fetchPrograms();
    }, [formData.department]);

    // 3. Form Input State Routing Interceptor [INDEX: 0.1.19]
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === "program_id" ? Number(value) : value 
        }));
        if (message) setMessage(null);
    };

    // 4. Submit New Profile Data Payload to PHP [INDEX: 0.1.19]
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) return;
        setIsSubmitting(true);
        setMessage(null);

        // Assemble registration payload matching your new update parameters [INDEX: 1]
        const submissionPayload = {
            employee_id: formData.employee_id,
            username: formData.username.trim() || formData.email.split('@')[0], // Fallback auto-username prefix
            first_name: formData.first_name,
            middle_name: formData.middle_name,
            last_name: formData.last_name,
            suffix: formData.suffix,
            department: formData.department, // Plain text code mapping
            program_id: formData.program_id === 0 ? null : formData.program_id, // Nullable matching logic [INDEX: 1]
            email: formData.email,
            contact_number: formData.contact_number,
            password: formData.password,
            confirm_password: formData.confirm_password,
            role: formData.role,
            status: "Approved" // Directly approved at creator state endpoint [INDEX: 0.1.19]
        };

        try {
            // FIXED: Rerouted destination target to call your central update pipeline register endpoint via relative proxies [INDEX: 1]
            const response = await fetch(`${APIconfig}/register.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submissionPayload)
            });
            const data = await response.json();
            if (data.status === "success") {
                setMessage({ type: "success", text: "New administrative account registered and approved successfully!" });
                setTimeout(() => {
                    onUserCreated(); // Refresh table view grid entries [INDEX: 0.1.20]
                    onClose(); // Dismiss view [INDEX: 0.1.20]
                }, 1200);
            } else {
                setMessage({ type: "error", text: data.message || "Registration failed." });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Unable to reach database connection endpoint." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform scale-up-in flex flex-col">
                
                {/* Modal Header [INDEX: 0.1.21] */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 select-none">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 font-montserrat">Create New User</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Register account credentials directly into the system database.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
                </div>

                {/* Modal Main Content Form Body [INDEX: 0.1.21] */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
                    
                    {/* Identifier Rows [INDEX: 0.1.21] */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</label>
                            <input
                                type="text"
                                name="employee_id"
                                required
                                placeholder="2026-1234"
                                value={formData.employee_id}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username <span className="text-slate-300 font-normal">(Opt)</span></label>
                            <input
                                type="text"
                                name="username"
                                placeholder="juan_dc"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Account Role Placement</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer"
                            >
                                <option value="Faculty">Faculty</option>
                                <option value="Chairperson">Chairperson</option>
                                <option value="Department Head">Department Head</option>
                                <option value="Dean">Dean</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Name Components Grid [INDEX: 0.1.22] */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                            <input type="text" name="first_name" required placeholder="Juan" value={formData.first_name} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Middle Name</label>
                            <input type="text" name="middle_name" placeholder="Santos" value={formData.middle_name} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                            <input type="text" name="last_name" required placeholder="Dela Cruz" value={formData.last_name} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                    </div>

                    {/* Suffix and Department Controls [INDEX: 0.1.22, 0.1.23] */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suffix</label>
                            <input type="text" name="suffix" placeholder="Jr. / Sr." value={formData.suffix} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        
                        <div className="flex flex-col gap-1 md:col-span-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEIT Assigned Department</label>
                            <select name="department" required value={formData.department} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer">
                                <option value="" disabled hidden>Select your CEIT Department</option>
                                <option value="DIT">Department of Information Technology (DIT)</option>
                                <option value="DCEA">Department of Civil and Engineering Architecture (DCEA)</option>
                                <option value="DAE">Department of Agricultural Engineering (DAE)</option>
                                <option value="DEE">Department of Electronics Engineering (DEE)</option>
                                <option value="DIET">Department of Industrial Engineering and Technology (DIET)</option>
                            </select>
                        </div>
                    </div>

                    {/* NEW ROW: Integrated Cascading Degree Program Track Options dropdown menu [INDEX: 1] */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider flex items-center justify-between select-none">
                            <span>Assigned Program Track</span>
                            {isLoadingPrograms && <span className="text-primary font-black animate-pulse text-[10px] lowercase">Syncing list...</span>}
                        </label>
                        <select
                            name="program_id"
                            value={formData.program_id}
                            disabled={programs.length === 0}
                            onChange={handleChange}
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
                        >
                            <option value={0}>Not Applicable / None</option>
                            {programs.map(prog => (
                                <option key={prog.id} value={prog.id}>
                                    {prog.code} — {prog.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Communications Identifiers [INDEX: 0.1.23] */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <input type="email" name="email" required placeholder="juan.delacruz@cvsu.edu.ph" pattern="[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$" value={formData.email} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                            <input type="tel" name="contact_number" required placeholder="09123456789" pattern="[0-9]{11}" value={formData.contact_number} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                    </div>

                    {/* Security Credentials Password Blocks [INDEX: 0.1.24] */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                            <input type="password" name="password" required placeholder="••••••••" maxLength={50} value={formData.password} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                            <input type="password" name="confirm_password" required placeholder="••••••••" maxLength={50} value={formData.confirm_password} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                    </div>

                    {/* Password Metrics Box System [INDEX: 0.1.24] */}
                    <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 select-none">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password Requirements</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                            <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasMinMax ? "text-primary font-bold" : "text-slate-400"}`}>
                                <span>{hasMinMax ? "✓" : "•"}</span> 8 - 50 characters long
                            </div>
                            <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasUppercase ? "text-primary font-bold" : "text-slate-400"}`}>
                                <span>{hasUppercase ? "✓" : "•"}</span> At least one capital letter
                            </div>
                            <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasLowercase ? "text-primary font-bold" : "text-slate-400"}`}>
                                <span>{hasLowercase ? "✓" : "•"}</span> At least one small letter
                            </div>
                            <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasNumber ? "text-primary font-bold" : "text-slate-400"}`}>
                                <span>{hasNumber ? "✓" : "•"}</span> At least one number
                            </div>
                            <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${hasSymbol ? "text-primary font-bold" : "text-slate-400"}`}>
                                <span>{hasSymbol ? "✓" : "•"}</span> At least one special symbol
                            </div>
                            {formData.confirm_password.length > 0 && (
                                <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors ${passwordsMatch ? "text-primary font-bold" : "text-rose-500 font-bold"}`}>
                                    <span>{passwordsMatch ? "✓" : "✕"}</span>
                                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Notification Framework [INDEX: 0.1.25] */}
                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium border animate-fade-in ${
                            message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form Submission Actions Button Footer Area [INDEX: 0.1.25] */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white z-10 shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose}
                            disabled={isSubmitting} 
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || !isPasswordValid} 
                            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm transition-all disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSubmitting ? "Registering..." : "Register Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCreateModal;
