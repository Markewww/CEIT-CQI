import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cvsuLogo from "@/assets/cvsu-logo.png"; 
import RegisterForm from "./RegisterForm";

const Register = () => {
    const navigate = useNavigate();
    const [isShrinking, setIsShrinking] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const handleBackToLogin = () => {
        setIsShrinking(true);
        setTimeout(() => {
            navigate("/");
        }, 500);
    };

    return (
        // Root viewport is locked flat to prevent secondary external canvas scroll reflections
        <div className="w-full h-screen relative bg-slate-50 font-sans overflow-hidden select-none flex justify-center items-center">
            <div className={`h-screen flex flex-col justify-start items-center p-8 sm:p-12 md:p-20 py-12 md:py-16 bg-white shadow-2xl absolute right-0 top-0 panel-transition overflow-y-auto ${
                isShrinking ? "w-full md:w-1/2" : "w-full"
            }`}>
                
                {/* Fade container wrapper layout */}
                <div className={`w-full max-w-2xl flex flex-col fade-transition ${
                    !isMounted || isShrinking ? "opacity-0" : "opacity-100"
                }`}>
                    
                    {/* CvSU Header Section */}
                    <div className="w-full flex flex-col items-center text-center mb-10">
                        <img src={cvsuLogo} alt="CvSU Logo" className="w-24 h-24 object-contain mb-4 drop-shadow-md" />
                        <h1 className="text-3xl font-black text-primary uppercase tracking-wider font-montserrat">
                            Cavite State University
                        </h1>
                        <h2 className="text-sm font-bold text-accent-gold mt-1 tracking-wide uppercase font-montserrat">
                            College of Engineering and Information Technology
                        </h2>
                    </div>

                    <div className="w-full flex flex-col mb-8 text-center sm:text-left">
                        <h3 className="text-3xl font-bold mb-1 text-[#060606] font-montserrat">Create Account</h3>
                        <p className="text-base text-slate-500">Join the Continuous Quality Improvement platform.</p>
                    </div>

                    {/* Injecting the isolated Register Form component with proper callback hooks */}
                    {/* Note: Ensure your RegisterForm has className="pb-12" or similar padding inside its parent form tag */}
                    <RegisterForm 
                    onBackToLogin={handleBackToLogin} 
                    onSubmitSuccess={handleBackToLogin} />

                </div>
            </div>

        </div>
    );
};

export default Register;
