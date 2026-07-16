import React, { useState, useEffect } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig"; // Import the API configuration

interface RegisterFormProps {
    onBackToLogin: () => void;
    onSubmitSuccess: () => void;
}

interface ProgramOption {
    id: number;
    code: string;
    name: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin, onSubmitSuccess }) => {
    const [employeeId, setEmployeeId] = useState("");
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [lastName, setLastName] = useState("");
    const [suffix, setSuffix] = useState("");
    const [department, setDepartment] = useState("");
    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // NEW STATES: Capture user role choices and dynamic program lists [INDEX: 1]
    const [role, setRole] = useState("Faculty");
    const [programId, setProgramId] = useState("0");
    const [programs, setPrograms] = useState<ProgramOption[]>([]);
    const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

    // Validation state checks [INDEX: 0.1.11]
    const hasMinMax = password.length >= 8 && password.length <= 50;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    // Map your plain text department codes down into their exact relational numeric IDs [INDEX: 1]
    const getDepartmentIdByCode = (code: string): number => {
        if (code === "DIT") return 1;
        if (code === "DCEA") return 2;
        if (code === "DAE") return 3;
        if (code === "DEE") return 4;
        if (code === "DIET") return 5;
        return 0;
    };

    // Dynamic Cascading Async Loader Effect [INDEX: 1]
    useEffect(() => {
        const deptId = getDepartmentIdByCode(department);
        if (deptId === 0) {
            setTimeout(() => {
                setPrograms([]);
                setProgramId("0");
            }, 0);
            return;
        }

        const fetchPrograms = async () => {
            try {
                setIsLoadingPrograms(true);
                const res = await fetch(`${API_ENDPOINTS.CASCADING_OPTIONS}?department_id=${deptId}`);
                const result = await res.json();
                if (result.status === "success") {
                    setPrograms(result.programs || []);
                }
            } catch (err) {
                console.error("Failed fetching cascading programs:", err);
            } finally {
                setIsLoadingPrograms(false);
            }
        };

        fetchPrograms();
    }, [department]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Assemble registration payload matching your new register.php fields [INDEX: 1]
        const registrationPayload = {
            employee_id: employeeId,
            username: email.split('@')[0], // Generate default username from email string prefix
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            suffix: suffix,
            department: department, // 'DIT', 'DCEA', etc.
            program_id: programId === "0" ? null : Number(programId), // Numerical casting
            role: role,
            email: email,
            contact_number: contactNumber,
            password: password,
            confirm_password: confirmPassword
        };

        try {
            const response = await fetch(API_ENDPOINTS.REGISTER, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registrationPayload)
            });
            const data = await response.json();
            if (data.status === "success") {
                alert(data.message);
                onSubmitSuccess();
            } else {
                alert(data.message || "Registration failed. Please check your input and try again.");
            }
        } catch (error) {
            console.error("Network communication loss with the PHP backend server API:", error);
            alert("Unable to connect to the registration server. Please ensure XAMPP Apache is active.");
        }
    };

    return (
        <form onSubmit={handleFormSubmit} className="w-full flex flex-col gap-5">
            {/* ROW 0: EMPLOYEE ID FIELD [INDEX: 0.1.12] */}
            <div className="flex flex-col">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Employee ID</label>
                <input
                    type="text"
                    placeholder="2026-1234"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400 font-medium"
                />
            </div>

            {/* Row 1: First Name & Middle Name [INDEX: 0.1.12] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">First Name</label>
                    <input
                        type="text"
                        placeholder="Juan"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Middle Name</label>
                    <input
                        type="text"
                        placeholder="Santos"
                        value={middleName}
                        onChange={(e) => setMiddleName(e.target.value)}
                        className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Row 2: Last Name & Suffix [INDEX: 0.1.13] */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div className="sm:col-span-3 flex flex-col">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Last Name</label>
                    <input
                        type="text"
                        placeholder="Dela Cruz"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                    />
                </div>
                <div className="sm:col-span-1 flex flex-col">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Suffix</label>
                    <input
                        type="text"
                        placeholder="Jr. / Sr."
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Row 3: Department Selection dropdown menu [INDEX: 0.1.14] */}
            <div className="flex flex-col">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Department</label>
                <select
                    required
                    value={department}
                    onChange={(e) => {
                        setDepartment(e.target.value);
                        e.target.className = "w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base";
                    }}
                    className="w-full text-slate-400 py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base cursor-pointer"
                >
                    <option value="" disabled hidden className="text-slate-400">Select your CEIT Department</option>
                    <option value="DIT" className="text-black">Department of Information Technology (DIT)</option>
                    <option value="DCEA" className="text-black">Department of Civil and Engineering Architecture (DCEA)</option>
                    <option value="DAE" className="text-black">Department of Agricultural Engineering (DAE)</option>
                    <option value="DEE" className="text-black">Department of Electronics Engineering (DEE)</option>
                    <option value="DIET" className="text-black">Department of Industrial Engineering and Technology (DIET)</option>
                </select>
            </div>

            {/* NEW ROW: Dynamic Cascading Program Dropdown Menu Element Box [INDEX: 1] */}
            <div className="flex flex-col">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider flex items-center justify-between">
                    <span>Assigned Program Track</span>
                    {isLoadingPrograms && <span className="text-primary font-black animate-pulse text-[10px] lowercase">Syncing...</span>}
                </label>
                <select
                    value={programId}
                    disabled={programs.length === 0}
                    onChange={(e) => setProgramId(e.target.value)}
                    className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base cursor-pointer disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                    <option value="0">Not Applicable / None</option>
                    {programs.map(prog => (
                        <option key={prog.id} value={prog.id} className="text-black">
                            {prog.code} — {prog.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* NEW ROW: Structural System Role Selection dropdown menu [INDEX: 1] */}
            <div className="flex flex-col">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Requested System Role</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base cursor-pointer"
                >
                    <option value="Faculty" className="text-black">Faculty Member</option>
                    <option value="Chairperson" className="text-black">Program Chairperson</option>
                    <option value="Department Head" className="text-black">Department Head</option>
                    <option value="Dean" className="text-black">College Dean</option>
                </select>
            </div>

            {/* Row 4: Email Address & Contact Number [INDEX: 0.1.15] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Email Address</label>
                    <input
                        type="email"
                        placeholder="juan.delacruz@cvsu.edu.ph"
                        required
                        pattern="[a-zA-Z0-9._%+-]+@cvsu\.edu\.ph$"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Contact Number</label>
                    <input
                        type="tel"
                        placeholder="09123456789"
                        required
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        pattern="[0-9]{11}"
                        className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Row 5: Password & Confirm Password [INDEX: 0.1.15] */}
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            maxLength={50}
                            className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            maxLength={50}
                            className="w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Password Complexity Requirements Legend Box [INDEX: 0.1.16] */}
                <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-1.5 transition-all select-none">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password Requirements</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${hasMinMax ? "text-primary font-bold" : "text-slate-400"}`}>
                            <span>{hasMinMax ? "✓" : "•"}</span> 8 - 50 characters long
                        </div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${hasUppercase ? "text-primary font-bold" : "text-slate-400"}`}>
                            <span>{hasUppercase ? "✓" : "•"}</span> At least one capital letter
                        </div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${hasLowercase ? "text-primary font-bold" : "text-slate-400"}`}>
                            <span>{hasLowercase ? "✓" : "•"}</span> At least one small letter
                        </div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${hasNumber ? "text-primary font-bold" : "text-slate-400"}`}>
                            <span>{hasNumber ? "✓" : "•"}</span> At least one number
                        </div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${hasSymbol ? "text-primary font-bold" : "text-slate-400"}`}>
                            <span>{hasSymbol ? "✓" : "•"}</span> At least one special symbol
                        </div>
                        {confirmPassword.length > 0 && (
                            <div className={`text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${passwordsMatch ? "text-primary font-bold" : "text-rose-500 font-bold"}`}>
                                <span>{passwordsMatch ? "✓" : "✕"}</span>
                                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Form Controls Buttons [INDEX: 0.1.17] */}
            <div className="w-full flex flex-col sm:flex-row gap-4 mt-6">
                <button
                    type="button"
                    onClick={onBackToLogin}
                    className="w-full sm:w-1/2 order-2 sm:order-1 text-primary bg-white border-2 border-primary rounded-lg py-3 text-center font-bold hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
                >
                    Back to Login
                </button>
                <button
                    type="submit"
                    disabled={!(hasMinMax && hasUppercase && hasLowercase && hasNumber && hasSymbol && passwordsMatch)}
                    className="w-full sm:w-1/2 order-1 sm:order-2 text-white bg-primary rounded-lg py-3 text-center font-bold hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                    Register Account
                </button>
            </div>
        </form>
    );
};

export default RegisterForm;
