import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import {
    LayoutDashboard,
    Users,
    Building2,
    GraduationCap,
    BookOpen,
    CalendarDays,
} from "lucide-react";
import OverviewTab from "./OverviewTab";
import AccountsTab from "./AccountsTab";
import DepartmentsTab from "./DepartmentsTab";
import ProgramsTab from "./ProgramsTab";
import CoursesTab from "./CoursesTab";
import SchedulesTab from "./SchedulesTab";

// Local Union Type defining the primary view categories
type DashboardView = "overview" | "accounts" | "departments" | "programs" | "courses" | "schedules";

const AdminDashboard = () => {
    const { user } = useAuth();
    
    // Core state managers for handling current module and welcome notice frames
    const [currentView, setCurrentView] = useState<DashboardView>("overview");
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);

    // Automatically clear the top login success notification bar after 4 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWelcomeMessage(false);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    // Helper menu map array to loop and generate the secondary navigation panel items smoothly
    const sidebarMenuItems = [
        { id: "overview", label: "Dashboard Summary", icon: LayoutDashboard },
        { id: "accounts", label: "Manage Accounts", icon: Users },
        { id: "departments", label: "Manage Departments", icon: Building2 },
        { id: "programs", label: "Manage Programs", icon: GraduationCap },
        { id: "courses", label: "Manage Courses", icon: BookOpen },
        { id: "schedules", label: "Class Schedules", icon: CalendarDays },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col select-none">
            
            {/* Reusable Institutional Header component */}
            <Header />

            {/* Main Operational Dashboard Row Layout */}
            <div className="flex-1 flex flex-col md:flex-row w-full h-full relative">
                
                {/* 1. LEFT SIDE NAVIGATION DRAWER PANEL */}
                <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 flex flex-col gap-1.5 shrink-0">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 mb-2">
                        System Modules
                    </p>
                    {sidebarMenuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all text-left cursor-pointer border ${
                                currentView === item.id
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "text-slate-600 border-transparent hover:bg-slate-50 hover:text-primary"
                            }`}
                        >
                            {/* FIXED: Invoked item.icon as a valid dynamic Lucide component instance with precise sizing */}
                            <item.icon size={18} className="shrink-0" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </aside>

                {/* 2. RIGHT SIDE CORE SYSTEM INTERFACE VIEW PANEL */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full flex flex-col gap-6">
                    
                    {/* Welcome Notice Alert Banner Container */}
                    {showWelcomeMessage && (
                        <div className="w-full bg-primary/10 border border-primary/20 px-5 py-4 rounded-xl flex items-center justify-between transition-all animate-pulse shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="text-lg">🎉</span>
                                <p className="text-sm font-bold text-primary font-montserrat">
                                    Login Successful! Welcome back to the management panel, {user?.first_name || "Admin"}.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowWelcomeMessage(false)}
                                className="text-primary opacity-60 hover:opacity-100 font-bold text-xs cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    {/* DYNAMIC RENDERING INTERFACE ROUTER BLOCK */}
                    {currentView === "overview" && <OverviewTab user={user} />}

                    {/* VIEW 2: MANAGE ACCOUNTS ACCOUNT UI PANEL */}
                    {currentView === "accounts" && <AccountsTab />}

                    {/* VIEW 3: MANAGE DEPARTMENTS UI PANEL */}
                    {currentView === "departments" && <DepartmentsTab />}

                    {/* VIEW 4: MANAGE PROGRAMS UI PANEL */}
                    {currentView === "programs" && <ProgramsTab />}

                    {/* VIEW 5: MANAGE COURSES (SUBJECTS) PANEL */}
                    {currentView === "courses" && <CoursesTab />}

                    {/* VIEW 6: CLASS SCHEDULE MANAGER PANEL */}
                    {currentView === "schedules" && <SchedulesTab />}

                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;

