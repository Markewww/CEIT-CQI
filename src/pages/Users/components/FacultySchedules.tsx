import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface ScheduleData {
    id: number;
    schedule_id: string;
    course_code: string;
    course_description: string;
    program_code: string;
    academic_year: string;
    semester: string;
    year_level: number;
    section: string;
}

interface FacultySchedulesProps {
    employeeId: string;
    onClassClick: (scheduleId: string) => void; // ◄ ADDED THIS CLOSURE PROP ACTION ROUTE
}

const FacultySchedules: React.FC<FacultySchedulesProps> = ({ employeeId, onClassClick }) => {
    const [myClasses, setMyClassLoads] = useState<ScheduleData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchMyLoads = useCallback(async () => {
        console.log("FacultySchedules mounted. Fetching data for employee ID parameter:", employeeId);
        
        if (!employeeId || employeeId.trim() === "") {
            setError("Missing active instructor session identifier code.");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`${API_ENDPOINTS.FACULTY_MY_SCHEDULES}?employee_id=${encodeURIComponent(employeeId)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP network error code status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log("Relational database payload received from my_schedules.php:", result);
            
            if (result.status === "success") {
                setMyClassLoads(result.data);
            } else {
                setError(result.message || "Failed to extract your scheduling metrics.");
            }
        } catch (err) {
            const error = err as Error;
            console.error("Error fetching faculty schedules:", err);
            setError(error.message || "Connection failure to server endpoints.");
        } finally {
            setIsLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMyLoads();
        }, 1000); // Delay of 1 second

        return () => clearTimeout(timer); // Cleanup the timer on unmount
    }, [fetchMyLoads]);

    const filteredLoads = myClasses.filter(c => 
        c.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.course_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.program_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            {/* Search filter deck element */}
            <div className="w-full max-w-md relative">
                <input
                    type="text"
                    placeholder="Search your assigned classes by code or track description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200/80 rounded-lg p-2.5 focus:outline-none focus:border-primary placeholder:text-bg-disabled"
                />
            </div>

            {isLoading && (
                <div className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse font-montserrat">
                    Querying your localized class registries...
                </div>
            )}
            
            {error && (
                <div className="p-4 text-center text-xs font-bold text-rose-500 bg-rose-50/50 rounded-lg border border-rose-100">
                    ⚠️ Error: {error}
                </div>
            )}
            
            {!isLoading && !error && filteredLoads.length === 0 && (
                <div className="p-12 text-center text-xs font-medium text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                    No active class blocks registered or matching your search matrix parameters.
                </div>
            )}

            {!isLoading && !error && filteredLoads.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredLoads.map((sched) => (
                        <div key={sched.id} className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all group">
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-primary/10 text-primary font-black px-2 py-0.5 rounded font-montserrat uppercase">
                                            {sched.program_code}
                                        </span>
                                        <span className="text-xs font-extrabold text-slate-700 font-montserrat">
                                            Year {sched.year_level} — Section {sched.section}
                                        </span>
                                    </div>
                                    <span className="text-[12px] text-slate-400 font-mono font-bold uppercase">
                                        Schedule ID: {sched.schedule_id}
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-slate-900 mt-3 font-montserrat group-hover:text-primary transition-colors">
                                    <span className="mr-1.5 text-primary">[{sched.course_code}]</span>
                                    {sched.course_description}
                                </h4>
                            </div>
                            <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>A.Y. {sched.academic_year} ● {sched.semester}</span>
                                <span 
                                    onClick={() => onClassClick(sched.schedule_id)} // ◄ BIND EVENT ACTION TRIGGER HERE
                                    className="text-primary cursor-pointer font-extrabold tracking-normal normal-case hover:underline"
                                >
                                    Open CQI Analysis Matrix →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultySchedules;
