import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import cvsuLogo from "@/assets/cvsu-logo.png";

const Header = () => {
    const { user, logoutContext } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        logoutContext();
        navigate("/", { replace: true });
    };

    return (
        <header className="w-full bg-primary text-white px-6 py-4 flex items-center justify-between shadow-sm select-none">
            <div className="flex items-center gap-3">
                <img 
                    src={cvsuLogo} 
                    alt="CvSU Logo" 
                    className="w-12 h-12 object-contain drop-shadow-sm"
                />
                <div>
                    <h1 className="text-sm font-black tracking-wider font-montserrat uppercase leading-tight">
                        Continuous Quality Improvement
                    </h1>
                    <p className="text-xs text-slate-200 mt-0.5 font-medium tracking-wide">
                        College of Engineering and Information Technology
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold leading-tight">
                        {user?.first_name} {user?.last_name}
                    </p>
                    <span className="text-xs bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-montserrat">
                        {user?.role}
                    </span>
                </div>
                <button 
                    onClick={handleLogout}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;
