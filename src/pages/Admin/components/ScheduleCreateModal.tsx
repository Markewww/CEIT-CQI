import React, { useState, useEffect, useRef } from "react";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface LookupItem {
    id: number;
    code?: string;
    name?: string;
    full_name?: string; // For users endpoint
    description?: string; // For courses endpoint
}

interface ScheduleCreateModalProps {
    onClose: () => void;
    onScheduleCreated: () => void;
}

const ScheduleCreateModal: React.FC<ScheduleCreateModalProps> = ({ onClose, onScheduleCreated }) => {
    const [formData, setFormData] = useState({
        schedule_id: "",
        course_id: "",
        program_id: "",
        user_id: "",
        academic_year: "",
        semester: "",
        year_level: "",
        section: ""
    });

    // Dropdown options lookup caches [INDEX: 0.1.39]
    const [courses, setCourses] = useState<LookupItem[]>([]);
    const [programs, setPrograms] = useState<LookupItem[]>([]);
    const [instructors, setInstructors] = useState<LookupItem[]>([]);
    
    // Autocomplete system state management parameters
    const [instructorSearch, setInstructorSearch] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const [isLoadingLookups, setIsLoadingLookups] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 1. RELATIONAL FETCH: Query catalog records on mount to populate form selections [INDEX: 0.1.39]
    useEffect(() => {
        const fetchAllLookups = async () => {
            try {
                const [resCourses, resPrograms, resUsers] = await Promise.all([
                    fetch(`${API_ENDPOINTS.ADMIN_COURSES}`).then(r => r.json()),
                    fetch(`${API_ENDPOINTS.ADMIN_PROGRAMS}`).then(r => r.json()),
                    fetch(`${API_ENDPOINTS.ADMIN_USERS}`).then(r => r.json())
                ]);

                if (resCourses.status === "success") setCourses(resCourses.data);
                if (resPrograms.status === "success") setPrograms(resPrograms.data);
                if (resUsers.status === "success") setInstructors(resUsers.data);
            } catch (err) {
                console.error("Failed to load schema foreign dropdown lookups:", err);
            } finally {
                setIsLoadingLookups(false);
            }
        };
        fetchAllLookups();
    }, []);

    // Dismiss suggestions dropdown if the admin clicks completely away from the component
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (message) setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !formData.schedule_id.trim() ||
            !formData.course_id || !formData.program_id || !formData.user_id ||
            !formData.academic_year || !formData.semester || !formData.year_level || !formData.section.trim()
        ) {
            setMessage({ type: 'error', text: "All fields are required to process registry entry." });
            return;
        }
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(API_ENDPOINTS.ADMIN_CREATE_SCHEDULE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedule_id: formData.schedule_id.trim(),
                    course_id: Number(formData.course_id),
                    program_id: Number(formData.program_id),
                    user_id: Number(formData.user_id),
                    academic_year: formData.academic_year,
                    semester: formData.semester,
                    year_level: Number(formData.year_level),
                    section: formData.section.trim()
                })
            });

            const result = await response.json();
            if (result.status === "success") {
                setMessage({ type: 'success', text: "New class schedule generated successfully!" });
                setTimeout(() => {
                    onScheduleCreated();
                    onClose();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: result.message || "Failed to create schedule block entry." });
            }
        } catch (err) {
            const errorInstance = err as Error;
            console.error("Error creating schedule:", errorInstance);
            setMessage({ type: 'error', text: "Connection error to endpoint server configuration." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter instructor suggestion metrics locally based on text context query parameters
    const filteredInstructors = instructors.filter(u => 
        (u.full_name || "").toLowerCase().includes(instructorSearch.toLowerCase())
    );

    // Auto-generate Academic Year options based on current date [INDEX: 0.1.41]
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => {
        const start = currentYear - 1 + i;
        return `${start}-${start + 1}`;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col transform scale-up-in">
                
                {/* Modal Header [INDEX: 0.1.41] */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-montserrat">Create Class Schedule</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Generate a new curriculum lecture block configuration entry for examination tracking.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
                </div>

                {/* Main Form Body Wrap [INDEX: 0.1.42] */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Row 0: Unique Class Reference Schedule ID */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Schedule ID</label>
                        <input
                            type="text"
                            name="schedule_id"
                            value={formData.schedule_id}
                            onChange={handleChange}
                            placeholder="e.g., 202522511"
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors placeholder:text-bg-disabled"
                            required
                        />
                        <span className="text-[10px] text-slate-400 font-medium">Input your formal internal course section registration index number string.</span>
                    </div>

                    {/* Row 1: Course Allocation [INDEX: 0.1.42] */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Subject Course</label>
                        <select name="course_id" value={formData.course_id} onChange={handleChange} disabled={isLoadingLookups} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                            <option value="" disabled hidden>
                                {isLoadingLookups ? "Loading catalog items..." : "Select Course Catalog Item"}
                            </option>
                            {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] — {c.description}</option>)}
                        </select>
                    </div>

                    {/* Row 2: Instructor Autocomplete Selection Search Field */}
                    <div className="flex flex-col gap-1 relative" ref={suggestionRef}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Faculty Professor</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={isLoadingLookups ? "Loading instructor records..." : "Type professor name to search..."}
                                value={instructorSearch}
                                disabled={isLoadingLookups}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setInstructorSearch(e.target.value);
                                    setShowSuggestions(true);
                                    // Reset backend identifier to validate input constraints
                                    setFormData(prev => ({ ...prev, user_id: "" }));
                                }}
                                className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors"
                                required
                            />
                            {instructorSearch && (
                                <button
                                    type="button"
                                    onClick={() => { setInstructorSearch(""); setFormData(prev => ({ ...prev, user_id: "" })); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                                                {/* Floating Suggestions Dropdown Menu Drawer */}
                        {showSuggestions && instructorSearch.trim() !== "" && !isLoadingLookups && (
                            <div className="absolute top-full left-0 w-full bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50 mt-1 divide-y divide-slate-50">
                                {filteredInstructors.length > 0 ? (
                                    filteredInstructors.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                setInstructorSearch(u.full_name || "");
                                                setFormData(prev => ({ ...prev, user_id: u.id.toString() }));
                                                setShowSuggestions(false);
                                                if (message) setMessage(null);
                                            }}
                                            className="p-2.5 text-xs font-semibold text-slate-700 hover:bg-primary/5 hover:text-primary cursor-pointer transition-colors"
                                        >
                                            {u.full_name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-2.5 text-xs text-slate-400 font-medium italic text-center">
                                        No matching instructors found.
                                    </div>
                                )}
                            </div>
                        )}
                        <input type="hidden" name="user_id" value={formData.user_id} required />
                    </div>

                    {/* Row 3: Class Placements (Program, Year Level, Section Grid) [INDEX: 0.1.43] */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Degree Curricula</label>
                            <select name="program_id" value={formData.program_id} onChange={handleChange} disabled={isLoadingLookups} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                                <option value="" disabled hidden>
                                    {isLoadingLookups ? "Loading tracks..." : "Select Program"}
                                </option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year Level</label>
                            <select name="year_level" value={formData.year_level} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                                <option value="" disabled hidden>Select Year</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Section</label>
                            <input type="text" name="section" value={formData.section} onChange={handleChange} maxLength={10} placeholder="e.g., A" className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors uppercase placeholder:text-bg-disabled" required />
                        </div>
                    </div>

                    {/* Row 4: Academic Boundary Terms Layout [INDEX: 0.1.44] */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Academic Year</label>
                            <select name="academic_year" value={formData.academic_year} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                                <option value="" disabled hidden>Select Year Term</option>
                                {yearOptions.map(y => <option key={y} value={y}>A.Y. {y}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Semester Scope</label>
                            <select name="semester" value={formData.semester} onChange={handleChange} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                                <option value="" disabled hidden>Select Term</option>
                                <option value="First Semester">First Semester</option>
                                <option value="Second Semester">Second Semester</option>
                                <option value="Summer/Midyear">Summer / Midyear</option>
                            </select>
                        </div>
                    </div>

                    {/* Feedback Alert Block [INDEX: 0.1.44] */}
                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium border ${
                            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form Buttons Footer Controls [INDEX: 0.1.45] */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting || isLoadingLookups || !formData.user_id} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed">
                            {isSubmitting ? "Registering..." : "Register Schedule"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleCreateModal;
