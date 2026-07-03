import React, { useState, useEffect, useCallback } from "react";
// Import your modular table subcomponent
import CoursesTable from "./components/CoursesTable";
// IMPORT MODALS: Bring in both creation and modification modules cleanly
import CourseCreateModal from "./components/CourseCreateModal";
import CourseEditModal from "./components/CourseEditModal";
import { APIconfig } from "@/config/apiConfig";

interface CourseData {
    id: number;
    code: string;
    description: string;
}

const CoursesTab: React.FC = () => {
    const [courses, setCourses] = useState<CourseData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal visibility toggle state trackers
    const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    // Network request to fetch courses from your single backend PHP file
    const fetchCourses = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`${APIconfig}/admin/courses.php`);
            
            if (!response.ok) {
                throw new Error(`HTTP network error code: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === "success") {
                setCourses(result.data);
            } else {
                setError(result.message || "Failed to load master course records.");
            }
        } catch (err: any) {
            setError(err.message || "Unable to reach database connection endpoint.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load master courses upon initial component assembly
    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Handle modification trigger when configuration button is clicked on any row
    const handleEditClick = (course: CourseData) => {
        setEditingCourse(course);
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Module Toolbar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Courses</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure and audit formal master courses, subject descriptions, and academic registry tags.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                    + Add Course
                </button>
            </div>

            {/* Central Master Data Table Component Injected */}
            <CoursesTable 
                courses={courses} 
                isLoading={isLoading} 
                error={error} 
                onEditClick={handleEditClick}
            />

            {/* Injected Course Modification Modal */}
            {editingCourse && (
                <CourseEditModal
                    course={editingCourse}
                    onClose={() => setEditingCourse(null)}
                    onCourseUpdated={fetchCourses}
                />
            )} 

            {/* Injected Course Registration Modal */}
            {showCreateModal && (
                <CourseCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onCourseCreated={fetchCourses}
                />
            )} 
        </div>
    );
};

export default CoursesTab;
