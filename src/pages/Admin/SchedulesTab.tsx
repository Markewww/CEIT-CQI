import React, { useState, useEffect, useCallback } from "react";
// Import the separated, paginated table subcomponent cleanly from your components folder
import SchedulesTable from "./components/SchedulesTable";
// IMPORT MODALS: Bring in both creation and modification modules cleanly
import ScheduleCreateModal from "./components/ScheduleCreateModal";
import ScheduleEditModal from "./components/ScheduleEditModal";
import { APIconfig } from "@/config/apiConfig";

interface ScheduleData {
    id: number;
    schedule_id: string; // ◄ FIXED: Added to receive unique tracking index properties natively
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

const SchedulesTab: React.FC = () => {
    const [schedules, setSchedules] = useState<ScheduleData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal view tracking toggle states
    const [editingSchedule, setEditingSchedule] = useState<ScheduleData | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    // Relational network query to fetch structured schedule blocks from PHP
    const fetchSchedules = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`${APIconfig}/admin/schedules.php`);
            
            if (!response.ok) {
                throw new Error(`HTTP network error code: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === "success") {
                setSchedules(result.data);
            } else {
                setError(result.message || "Failed to load database class schedules.");
            }
        } catch (err: any) {
            setError(err.message || "Unable to reach database connection endpoint.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch relational database blocks upon component mount
    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // Handle configuration action routes from row buttons
    const handleEditClick = (schedule: ScheduleData) => {
        setEditingSchedule(schedule);
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Module Action Toolbar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Class Schedules</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Coordinate and audit scheduled lecture blocks to align examination and item analysis intervals.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                    + Create Class Schedule
                </button>
            </div>

            {/* Central Data Matrix Table Canvas Container View Injected */}
            <SchedulesTable 
                schedules={schedules} 
                isLoading={isLoading} 
                error={error} 
                onEditClick={handleEditClick}
            />

            {/* Injected Schedule Modification Modal */}
            {editingSchedule && (
                <ScheduleEditModal
                    schedule={editingSchedule}
                    onClose={() => setEditingSchedule(null)}
                    onScheduleUpdated={fetchSchedules}
                />
            )} 

            {/* Injected Schedule Registration Modal */}
            {showCreateModal && (
                <ScheduleCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onScheduleCreated={fetchSchedules}
                />
            )} 
        </div>
    );
};

export default SchedulesTab;
