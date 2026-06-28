import React, { useState } from "react";

interface RegisterFormProps {
    onBackToLogin: () => void;
    onSubmitSuccess: () => void;
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

    // Validation state checks
    const hasMinMax = password.length >= 8 && password.length <= 50;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        onSubmitSuccess();

        const registrationPayload = {
            employee_id: employeeId,
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            suffix: suffix,
            department: department,
            email: email,
            contact_number: contactNumber,
            password: password,
            confirm_password: confirmPassword
        };

        try {
            const response = await fetch("http://localhost/cqi/api/register.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
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
            {/* ROW 0: NEW EMPLOYEE ID FIELD (Placed right before the names) */}
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
            
            {/* Row 1: First Name & Middle Name */}
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

            {/* Row 2: Last Name & Suffix */}
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

            {/* Row 3: Department Selection dropdown menu */}
            <div className="flex flex-col">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-wider">Department</label>
                {/* 
                  Note: HTML <select> elements do not have placeholders. 
                  Using text-slate-400 on the parent select elements handles the initial grey color state beautifully.
                */}
                <select 
                    required
                    value={department}
                    onChange={(e) => {
                        setDepartment(e.target.value);
                        e.target.className = "w-full text-black py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base"; // Remove placeholder color once a selection is made
                    }}
                    className="w-full text-slate-400 py-2 bg-transparent border-b border-slate-300 outline-none focus:outline-none focus:border-primary transition-colors text-base"
                >
                    <option value="" disabled hidden className="text-slate-400">Select your CEIT Department</option>
                    <option value="DIT" className="text-black">Department of Information Technology (DIT)</option>
                    <option value="DCEA" className="text-black">Department of Civil and Engineering Architecture (DCEA)</option>
                    <option value="DAE" className="text-black">Department of Agricultural Engineering (DAE)</option>
                    <option value="DEE" className="text-black">Department of Electronics Engineering (DEE)</option>
                    <option value="DIET" className="text-black">Department of Industrial Engineering and Technology (DIET)</option>
                </select>
            </div>

            {/* Row 4: Email Address & Contact Number */}
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

            {/* Row 5: Password & Confirm Password */}
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

                {/* Password Complexity Requirements Legend Box */}
                <div className="w-full bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-1.5 transition-all">
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
                                <span>{passwordsMatch ? "✓" : "✕"}</span> {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Action Form Controls Buttons */}
            <div className="w-full flex flex-col sm:flex-row gap-4 mt-6">
                <button 
                    type="button" 
                    onClick={onBackToLogin} 
                    className="w-full sm:w-1/2 order-2 sm:order-1 text-primary bg-white border-2 border-primary rounded-lg py-3 text-center font-bold hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer"
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
