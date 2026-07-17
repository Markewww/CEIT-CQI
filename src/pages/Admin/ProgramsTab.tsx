import React, { useState, useEffect, useCallback } from "react";
// Import your modular table subcomponent
import ProgramsTable from "./components/ProgramsTable";
// IMPORT MODALS: Bring in both creation and modification modules cleanly
import ProgramCreateModal from "./components/ProgramCreateModal";
import ProgramEditModal from "./components/ProgramEditModal";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface ProgramData {
    id: number;
    code: string;
    name: string;
    department_id: number;
    department_code: string;
}

const ProgramsTab: React.FC = () => {
    const [programs, setPrograms] = useState<ProgramData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Modal view visibility toggle trackers
    const [editingProgram, setEditingProgram] = useState<ProgramData | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    // Relational network query to fetch programs combined with their parent departments
    const fetchPrograms = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(API_ENDPOINTS.ADMIN_PROGRAMS);
            
            if (!response.ok) {
                throw new Error(`HTTP network error code: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === "success") {
                setPrograms(result.data);
            } else {
                setError(result.message || "Failed to load degree program records.");
            }
        } catch (err) {
            const errorInstance = err as Error;
            setError(errorInstance.message || "Unable to reach database connection endpoint.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load curriculum data tables upon initial mounting
    useEffect(() => {
        const timerGuard = setTimeout(() => {
            fetchPrograms();
        }, 0);

        return () => clearTimeout(timerGuard);
    }, [fetchPrograms]);

    // Handle editing interaction triggers on table row clicks
    const handleEditClick = (program: ProgramData) => {
        setEditingProgram(program);
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Module Toolbar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Programs</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure and audit formal college degree tracks, major specs, and curriculum structural lines.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                    + Add Program
                </button>
            </div>

            {/* Central Data Matrix Table Element */}
            <ProgramsTable 
                programs={programs} 
                isLoading={isLoading} 
                error={error} 
                onEditClick={handleEditClick}
            />

            {/* Injected Program Modification Modal */}
            {editingProgram && (
                <ProgramEditModal
                    program={editingProgram}
                    onClose={() => setEditingProgram(null)}
                    onProgramUpdated={fetchPrograms}
                />
            )} 

            {/* Injected Program Registration Modal */}
            {showCreateModal && (
                <ProgramCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onProgramCreated={fetchPrograms}
                />
            )} 
        </div>
    );
};

export default ProgramsTab;
