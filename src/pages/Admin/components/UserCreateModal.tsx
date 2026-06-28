import React, { useState } from "react";

interface UserCreateModalProps {
    onClose: () => void;
    onUserCreated: () => void;
}

const UserCreateModal: React.FC<UserCreateModalProps> = ({ onClose, onUserCreated }) => {
    const [formData, setFormData] = useState({
        employee_id: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        suffix: "",
        department: "",
        email: "",
        contact_number: "",
        password: "",
        confirm_password: "",
        role: "",
        status: "Approved" // Default status for new users
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Password Complexity Rules Metrics tracking validation logic mirrors
    const hasMinMax = formData.password.length >= 8 && formData.password.length <= 50;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const passwordsMatch = formData.password === formData.confirm_password && formData.confirm_password.length > 0;
    const isPasswordValid = hasMinMax && hasUppercase && hasLowercase && hasNumber && hasSymbol && passwordsMatch;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (message) setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPasswordValid) return;
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Reuses your primary system registration API route directly
            const response = await fetch("http://localhost/cqi/api/admin/register.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employee_id: formData.employee_id,
                    first_name: formData.first_name,
                    middle_name: formData.middle_name,
                    last_name: formData.last_name,
                    suffix: formData.suffix,
                    department: formData.department,
                    email: formData.email,
                    contact_number: formData.contact_number,
                    password: formData.password,
                    confirm_password: formData.confirm_password,
                    role: formData.role // Passes the custom role requested by the admin
                })
            });

            const data = await response.json();
            if (data.status === "success") {
                setMessage({ type: "success", text: "New account registered successfully!" });
                setTimeout(() => {
                    onUserCreated(); // Refresh grid registries list array
                    onClose();       // Dismiss modal viewport
                }, 1000);
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
                
                {/* Modal Header */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 font-montserrat">Create New User</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Register account credentials into the central infrastructure core.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
                </div>

                {/* Modal Main Content Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
                    
                    {/* Identifier Rows */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</label>
                            <input
                                type="text"
                                name="employee_id"
                                required
                                placeholder="2026-1234"
                                value={formData.employee_id}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Role Placement</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors "
                            >
                                <option value="Faculty">Faculty</option>
                                <option value="Chairperson">Chairperson</option>
                                <option value="Department Head">Department Head</option>
                                <option value="Dean">Dean</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    {/* Name Components Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                            <input type="text" name="first_name" required placeholder="Juan" value={formData.first_name} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Middle Name</label>
                            <input type="text" name="middle_name" placeholder="Santos" value={formData.middle_name} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                            <input type="text" name="last_name" required placeholder="Dela Cruz" value={formData.last_name} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                    </div>

                                        {/* Suffix and Department Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 md:col-span-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suffix</label>
                            <input type="text" name="suffix" placeholder="Jr. / Sr." value={formData.suffix} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CEIT Assigned Department</label>
                            <select name="department" required value={formData.department} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors">
                                <option value="" disabled hidden>Select your CEIT Department</option>
                                <option value="DIT">Department of Information Technology (DIT)</option>
                                <option value="DCEA">Department of Civil and Engineering Architecture (DCEA)</option>
                                <option value="DAE">Department of Agricultural Engineering (DAE)</option>
                                <option value="DEE">Department of Electronics Engineering (DEE)</option>
                                <option value="DIET">Department of Industrial Engineering and Technology (DIET)</option>
                            </select>
                        </div>
                    </div>

                    {/* Communications Identifiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                            <input type="email" name="email" required placeholder="juan.delacruz@cvsu.edu.ph" pattern="[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$" value={formData.email} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Number</label>
                            <input type="tel" name="contact_number" required placeholder="09123456789" pattern="[0-9]{11}" value={formData.contact_number} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled" />
                        </div>
                    </div>

                    {/* Security Credentials Password Blocks */}
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

                    {/* Password Metrics Box System */}
                    <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5">
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
                                    <span>{passwordsMatch ? "✓" : "✕"}</span> {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Output Notification Framework */}
                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium border ${message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form Submission Actions Button Footer Area */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !isPasswordValid} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm transition-all disabled:bg-slate-300 disabled:cursor-not-allowed">
                            {isSubmitting ? "Registering..." : "Register Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserCreateModal;
