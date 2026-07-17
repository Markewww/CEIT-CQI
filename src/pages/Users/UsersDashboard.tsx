import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header"; 
import FacultySchedules from "./components/FacultySchedules";
import ClassWorkspace from "./components/ClassWorkspace";

// IMPORT USER ROLE-BASED COMPONENTS HERE
import ChairpersonDashboard from "./components/ChairpersonDashboard"; // For Chairpersons
import DepartmentHeadDashboard from "./components/DepartmentHeadDashboard"; // For Department Heads

const UsersDashboard: React.FC = () => {
    const { user } = useAuth();
    
    // Sub-tab coordinator tracking parameters state hooks [INDEX: 0.1.34]
    const [activeSubTab, setActiveSubTab] = useState<string>("MySchedules");
    // Corrected Stateful State Declaration Hook [INDEX: 1]
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const instructorName = user?.first_name ? `${user.first_name} ${user.last_name}` : "Faculty Member";
    const userRole = user?.role || "Faculty";
    const assignedDept = user?.department_code || "CEIT";

    // Overwrite this function inside src/pages/Users/UsersDashboard.tsx
    const getCachedEmployeeId = (): string => {
        try {
            // Read string from caches safely [INDEX: 1]
            const cachedUserString = localStorage.getItem("user") || sessionStorage.getItem("user");
            
            if (cachedUserString) {
                const parsedUser = JSON.parse(cachedUserString);
                
                // 1. Check every single possible object casing variation at once
                if (parsedUser.employee_id) return parsedUser.employee_id;
                if (parsedUser.employeeId) return parsedUser.employeeId;
                if (parsedUser.employeeID) return parsedUser.employeeID;
                
                // 2. BACKUP LOOP: Loop through keys to find anything containing 'employee'
                // Useful if the backend maps it dynamically with unique column spaces
                const foundKey = Object.keys(parsedUser).find(key => 
                    key.toLowerCase().includes("employee")
                );
                if (foundKey && parsedUser[foundKey]) {
                    return parsedUser[foundKey].toString();
                }
            }
        } catch (e) {
            console.error("Failed to parse raw employee session metadata metrics:", e);
        }
        return "";
    };

    const userEmployeeId = getCachedEmployeeId();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
            <Header />

            <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 animate-fade-in">
                
                {/* Greeting Billboard Banner Row */}
                <div className="w-full bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight font-montserrat">
                            Welcome Back, <span className="text-primary">{instructorName}</span>!
                        </h2>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Monitor teaching assignments, input attainment ratios, and submit continuous quality reports.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-amber-500/10 text-amber-600 font-extrabold px-2.5 py-1 rounded-lg border border-amber-500/20 font-montserrat uppercase tracking-wide">
                            {userRole}
                        </span>
                        <span className="text-xs bg-primary/10 text-primary font-black px-2.5 py-1 rounded-lg border border-primary/20 font-montserrat uppercase">
                            {assignedDept}
                        </span>
                    </div>
                </div>

                {/* DYNAMIC ROLE-BASED NAVIGATION TAB LINKS BLOCK BAR */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                    <button
                        onClick={() => { setActiveSubTab("MySchedules"); setSelectedClassId(null); }} // Reset selection view on tab click [INDEX: 1]
                        className={`text-xs font-bold font-montserrat uppercase px-4 py-2 border-b-2 transition-all cursor-pointer ${
                            activeSubTab === "MySchedules"
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-400 hover:text-slate-700"
                        }`}
                    >
                        My Class Load Schedules
                    </button>
                    
                    {/* 2. CHAIRPERSON SWITCH GATE LINK: Conditionally inject tracking tools tab [INDEX: 0.1.92] */}
                    {(userRole === "Chairperson") && (
                        <button
                            type="button"
                            onClick={() => { setActiveSubTab("ChairpersonTools"); setSelectedClassId(null); }} // Reset selection view on tab click [INDEX: 1]
                            className={`text-xs font-bold font-montserrat uppercase px-4 py-2 border-b-2 transition-all cursor-pointer ${
                                activeSubTab === "ChairpersonTools"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-slate-400 hover:text-slate-700"
                            }`}
                            >
                            Chairperson Tracking Matrix
                            </button>   
                    )}

                    {/* 3. DEPARTMENT HEAD SWITCH GATE LINK: Conditionally inject department head tab [INDEX: 0.1.93] */}
                    {(userRole === "Department Head") && (
                        <button
                            type="button"
                            onClick={() => { setActiveSubTab("DepartmentHeadTools"); setSelectedClassId(null); }} // Reset selection view on tab click [INDEX: 1]
                            className={`text-xs font-bold font-montserrat uppercase px-4 py-2 border-b-2 transition-all cursor-pointer ${
                                activeSubTab === "DepartmentHeadTools"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-slate-400 hover:text-slate-700"
                            }`}
                        >
                            Department Head Monitoring
                        </button>
                    )}

                    {/* Upcoming structural conditional check rendering nodes will be attached here */}
                    {/* e.g., userRole === 'Department Chair' && <button>... Chair Tools ...</button> */}
                </div>

                {/* RENDERING CANVAS PORT CONTAINER AREA */}
                <div className="w-full min-h-100">
                    {activeSubTab === "MySchedules" && (
                        /* 2. CONDITIONAL WORKSPACE TOGGLING MULTIPLEX SHIFT BLOCK [INDEX: 1] */
                        selectedClassId ? (
                            <ClassWorkspace 
                                scheduleId={selectedClassId} 
                                onBack={() => setSelectedClassId(null)} 
                            />
                        ) : (
                            <FacultySchedules 
                                employeeId={userEmployeeId} 
                                onClassClick={(id) => setSelectedClassId(id)} 
                            />
                        )
                    )}

                    {/* Placeholder areas for other role scopes will expand right here later */}
                    {activeSubTab === "ChairpersonTools" && (
                        <ChairpersonDashboard 
                        />
                    )}
                    {activeSubTab === "DepartmentHeadTools" && (
                        <DepartmentHeadDashboard />
                    )}
                </div>

            </main>
        </div>
    );
};

export default UsersDashboard;
