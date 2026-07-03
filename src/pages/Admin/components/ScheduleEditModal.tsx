import React, { useState, useEffect, useRef } from "react";
import { APIconfig } from "@/config/apiConfig";

interface ScheduleData {
    id: number;
    schedule_id: string;
    course_id: number;
    course_code: string;
    course_description: string;
    program_id: number;
    program_code: string;
    user_id: number;
    employee_id: string;
    instructor_name: string;
    academic_year: string;
    semester: string;
    year_level: number;
    section: string;
    is_active: number;
}

interface LookupItem {
    id: number;
    code?: string;
    name?: string;
    full_name?: string; // For users endpoint
    description?: string; // For courses endpoint
}

interface ScheduleEditModalProps {
    schedule: ScheduleData | null;
    onClose: () => void;
    onScheduleUpdated: () => void;
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({ schedule, onClose, onScheduleUpdated }) => {
    const [formData, setFormData] = useState({
        id: 0,
        schedule_id: "",
        course_id: "",
        program_id: "",
        user_id: "",
        academic_year: "",
        semester: "",
        year_level: "",
        section: "",
        is_active: 1
    });

    // Lookup caches for foreign selectors
    const [courses, setCourses] = useState<LookupItem[]>([]);
    const [programs, setPrograms] = useState<LookupItem[]>([]);
    const [instructors, setInstructors] = useState<LookupItem[]>([]);
    
    // Auto-complete suggestion system state management
    const [instructorSearch, setInstructorSearch] = useState<string>("");
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    const [isLoadingLookups, setIsLoadingLookups] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // 1. DYNAMIC LOOKUP FETCH: Load relational catalog lists on mount [INDEX: 0.1.27]
    useEffect(() => {
        const fetchAllLookups = async () => {
            try {
                const [resCourses, resPrograms, resUsers] = await Promise.all([
                    fetch(`${APIconfig}/admin/courses.php`).then(r => r.json()),
                    fetch(`${APIconfig}/admin/programs.php`).then(r => r.json()),
                    fetch(`${APIconfig}/admin/users.php`).then(r => r.json())
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

    // 2. FORM INITIALIZATION: Sync fields with current schedule state properties [INDEX: 0.1.27]
    useEffect(() => {
        if (schedule) {
            setFormData({
                id: schedule.id,
                schedule_id: schedule.schedule_id || "",
                course_id: schedule.course_id.toString(),
                program_id: schedule.program_id.toString(),
                user_id: schedule.user_id.toString(),
                academic_year: schedule.academic_year,
                semester: schedule.semester,
                year_level: schedule.year_level.toString(),
                section: schedule.section,
                is_active: schedule.is_active
            });
            // Synchronize the text display field with the current instructor's name on mount
            setInstructorSearch(schedule.instructor_name || "");
            setMessage(null);
        }
    }, [schedule]);

    // Dismiss suggestions list panel automatically if clicking outside the element container
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
            setMessage({ type: 'error', text: "All fields are required to process changes." });
            return;
        }
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(`${APIconfig}/admin/update_schedule.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: formData.id,
                    schedule_id: formData.schedule_id.trim(),
                    course_id: Number(formData.course_id),
                    program_id: Number(formData.program_id),
                    user_id: Number(formData.user_id),
                    academic_year: formData.academic_year,
                    semester: formData.semester,
                    year_level: Number(formData.year_level),
                    section: formData.section.trim(),
                    is_active: formData.is_active
                })
            });

            const result = await response.json();
            if (result.status === "success") {
                setMessage({ type: 'success', text: "Schedule reassigned successfully." });
                setTimeout(() => {
                    onScheduleUpdated();
                    onClose();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: result.message || "Failed to update schedule metrics." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Connection error to endpoint server configuration." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter instructor suggestion array listing locally based on user keyboard input values
    const filteredInstructors = instructors.filter(u => 
        (u.full_name || "").toLowerCase().includes(instructorSearch.toLowerCase())
    );

    // Auto-generate Academic Year bounds options based on the current calendar date [INDEX: 0.1.29]
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 4 }, (_, i) => {
        const start = currentYear - 2 + i;
        return `${start}-${start + 1}`;
    });

    if (!schedule) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col transform scale-up-in">
                
                {/* Modal Header [INDEX: 0.1.29] */}
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 font-montserrat">Configure Block Schedule</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Reassign academic blocks, alter instructional handles, or change semester scope mapping.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">✕</button>
                </div>

                {/* Main Form Body Wrap [INDEX: 0.1.30] */}
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
                            className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors"
                            required
                        />
                        <span className="text-[10px] text-slate-400 font-medium">Modify your university reference format registration key if reassignment is needed.</span>
                    </div>

                    {/* Row 1: Course Allocation [INDEX: 0.1.30] */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Subject Course</label>
                        <select name="course_id" value={formData.course_id} onChange={handleChange} disabled={isLoadingLookups} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                            <option value="" disabled hidden>Select Course Catalog Item</option>
                            {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] — {c.description}</option>)}
                        </select>
                    </div>

                                        {/* Row 2: Instructor Autocomplete Selection Search Field */}
                    <div className="flex flex-col gap-1 relative" ref={suggestionRef}>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Faculty Professor</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={isLoadingLookups ? "Loading instructor registries..." : "Type professor name to search..."}
                                value={instructorSearch}
                                disabled={isLoadingLookups}
                                onFocus={() => setShowSuggestions(true)}
                                onChange={(e) => {
                                    setInstructorSearch(e.target.value);
                                    setShowSuggestions(true);
                                    // Reset user ID if typing to force selection validation
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

                        {/* Suggestions Dropdown Card Container overlay block panel */}
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

                    {/* Row 3: Class Placements (Program, Year Level, Section Grid) [INDEX: 0.1.30] */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Degree Curricula</label>
                            <select name="program_id" value={formData.program_id} onChange={handleChange} disabled={isLoadingLookups} className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors cursor-pointer" required>
                                <option value="" disabled hidden>Select Program</option>
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
                            <input type="text" name="section" value={formData.section} onChange={handleChange} maxLength={10} placeholder="e.g., A" className="w-full text-sm font-medium text-slate-800 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-primary transition-colors uppercase" required />
                        </div>
                    </div>

                    {/* Row 4: Academic Boundary Terms Layout [INDEX: 0.1.31] */}
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

                    {/* Row 5: Active Archetype Toggle switch wrapper layout [INDEX: 0.1.32] */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">Schedule Active Lifecycle</span>
                            <span className="text-[11px] text-slate-400">Archived items disappear from current evaluation lists.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formData.is_active === 1}
                                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>

                                        {/* Feedback Alert Block [INDEX: 0.1.33] */}
                    {message && (
                        <div className={`p-3 rounded-lg text-xs font-medium border ${
                            message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form Buttons Footer Controls [INDEX: 0.1.33] */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-4 py-2 rounded-lg disabled:opacity-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting || isLoadingLookups || !formData.user_id} className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2 rounded-lg shadow-sm disabled:opacity-50 transition-all">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleEditModal;
