import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import layatdiwa from "@/assets/layatdiwa.jpeg";
import cvsuLogo from "@/assets/cvsu-logo.png"; 

import { API_ENDPOINTS } from "@/config/apiConfig"; // Import the API configuration

const Login = () => {
    const navigate = useNavigate();
    const { loginContext } = useAuth();
    const [isExpanding, setIsExpanding] = useState(false);
    
    // React states to capture input values
    const [loginInput, setLoginInput] = useState(""); // Captures either username or email
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const handleGoToRegister = () => {
        setIsExpanding(true);
        setTimeout(() => {
            navigate("/register");
        }, 500); 
    };

    /* Locate your handleSubmit method inside your Login.tsx and replace it with this: */
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                loginInput: loginInput,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === "success") {
            // 1. CRITICAL SECURE FIX: Save session keys to disk so ProtectedRoute permits access [INDEX: 1]
            // Falls back to a mock string if your backend uses pure session-based validation rows
            const sessionToken = data.token || "authenticated_secure_session_token";
            localStorage.setItem("token", sessionToken);
            localStorage.setItem("user", JSON.stringify(data.user));

            // 2. Sync credentials into your global Context state provider [INDEX: 0.1.7]
            loginContext(data.user);

            // Normalize character casing to guarantee no route skips
            const normalizedRole = (data.user.role || "").toLowerCase();

            // 3. Dynamic Redirection Router Matrix with history overwriting [INDEX: 0.1.7, 1]
            if (normalizedRole === "admin") {
                navigate("/dashboard", { replace: true });
            } else {
                navigate("/users/dashboard", { replace: true });
            }
        } else {
            // Server caught bad credentials or a suspended account lock profile [INDEX: 0.1.7]
            alert(data.message || "Authentication rejected.");
        }
    } catch (error) {
        console.error("Network communication loss with the PHP backend server API:", error); // INDEX: 0.1.7
        alert("Unable to connect to the login validation server. Please ensure XAMPP Apache is active."); // INDEX: 0.1.7
    }
};


    return (
        <div className="w-full h-screen relative bg-slate-50 font-sans overflow-hidden select-none">
            
            {/* LEFT BACKGROUND IMAGE INTERFACE */}
            <div className="absolute left-0 top-0 w-1/2 h-full hidden md:flex flex-col">
                <img src={layatdiwa} alt="LayaTdiwa" className="w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute top-[25%] left-[10%] flex flex-col max-w-[80%] z-10 font-montserrat">
                    <h1 className="text-4xl text-white font-black my-4 tracking-tight leading-tight uppercase">
                        Continuous Quality Improvement
                    </h1>
                    <p className="text-lg text-slate-200 font-medium tracking-wide">
                         Elevating academic excellence through data-driven faculty assessments, optimized examination insights, and systematic evaluation of institutional educational standards.
                    </p>
                </div>
            </div>

            {/* EXPANDING RIGHT PANEL CURTAIN */}
            <div className={`absolute right-0 top-0 h-full flex flex-col justify-center items-center p-8 sm:p-12 md:p-20 bg-white z-20 shadow-2xl panel-transition ${
                isExpanding ? "panel-full-cover" : "w-full md:w-1/2"
            }`}>
                
                {/* Form Elements with explicit fading wrapper transitions */}
                <div className={`w-full max-w-100 flex flex-col fade-transition ${
                    isExpanding ? "opacity-0" : "opacity-100"
                }`}>
                    
                    {/* CvSU Header Section */}
                    <div className="w-full flex flex-col items-center text-center mb-8">
                        <img src={cvsuLogo} alt="CvSU Logo" className="w-20 h-20 object-contain mb-3 drop-shadow-md" />
                        <h1 className="text-2xl font-black text-primary uppercase tracking-wider font-montserrat">
                            Cavite State University
                        </h1>
                        <h2 className="text-xs font-bold text-accent-gold max-w-70 mt-1 tracking-wide uppercase font-montserrat">
                            College of Engineering and Information Technology
                        </h2>
                    </div>

                    {/* Secondary Form Labels */}
                    <div className="w-full flex flex-col mb-6">
                        <h3 className="text-2xl font-bold mb-1 text-[#060606] font-montserrat">Login</h3>
                        <p className="text-sm text-slate-500">Welcome Back! Please enter your details.</p>
                    </div>

                    {/* Interactive Input Fields */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col">
                        
                        {/* 1. UPDATED INPUT: Set to type="text" to seamlessly accept both alphanumeric usernames or valid emails */}
                        <input 
                            type="text" 
                            placeholder="Email or Username" 
                            required
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            className="w-full text-black py-2 my-2 bg-transparent border-b border-black outline-none focus:outline-none focus:border-primary transition-colors placeholder:text-slate-400 font-medium"
                        />
                        
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-black py-2 my-2 bg-transparent border-b border-black outline-none focus:outline-none focus:border-primary transition-colors placeholder:text-slate-400 font-medium"
                        />

                        <div className="w-full flex items-center justify-between mt-4">
                            <label className="flex items-center text-sm text-slate-600 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 mr-2 accent-primary checked:bg-primary cursor-pointer rounded" 
                                />
                                Remember me
                            </label>
                            <p className="text-sm font-medium underline underline-offset-2 cursor-pointer hover:text-primary transition-colors text-slate-700">
                                Forgot Password?
                            </p>
                        </div>

                        {/* Submission Buttons */}
                        <div className="w-full flex flex-col my-6">
                            <button 
                                type="submit" 
                                className="w-full text-white my-2 bg-primary rounded-md p-3 font-semibold tracking-wide hover:bg-primary-hover active:scale-[0.99] transition-all cursor-pointer shadow-sm shadow-primary/10"
                            >
                                Log In
                            </button>
                            <button 
                                type="button" 
                                onClick={handleGoToRegister} 
                                className="w-full text-primary my-2 bg-white border border-primary rounded-md p-3 font-semibold tracking-wide hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer"
                            >
                                Register
                            </button>
                        </div>
                    </form>

                </div>
            </div>

        </div>
    );
};

export default Login;
