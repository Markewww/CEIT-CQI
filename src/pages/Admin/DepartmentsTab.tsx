import React, { useState, useEffect, useCallback } from "react";
import DepartmentsTable from "./components/DepartmentsTable";
import DepartmentEditModal from "./components/DepartmentEditModal";
// 1. IMPORT MODAL: Load the creation overlay view component
import DepartmentCreateModal from "./components/DepartmentCreateModal";
import { APIconfig } from "@/config/apiConfig";

interface DepartmentData {
    id: number;
    code: string;
    name: string;
    user_count: number;
}

const DepartmentsTab: React.FC = () => {
    const [departments, setDepartments] = useState<DepartmentData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [editingDept, setEditingDept] = useState<DepartmentData | null>(null);
    // 2. STATE MANAGER: Track whether creation window layout is open or shut
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    const fetchDepartments = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`${APIconfig}/admin/departments.php`);
            
            if (!response.ok) {
                throw new Error(`HTTP network error code: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === "success") {
                setDepartments(result.data);
            } else {
                setError(result.message || "Failed to load database department records.");
            }
        } catch (err: any) {
            setError(err.message || "Unable to reach database connection link.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const handleEditClick = (dept: DepartmentData) => {
        setEditingDept(dept);
    };

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Content Management Module Toolbar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Departments</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Configure and monitor official academic branches within the College of Engineering and Information Technology.</p>
                </div>
                {/* 3. EVENT BINDING: Set open boolean parameter flags on-click layout triggers */}
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                    + Add Department
                </button>
            </div>

            {/* Separated Modular Data Table Canvas Container View Injected */}
            <DepartmentsTable 
                departments={departments} 
                isLoading={isLoading} 
                error={error} 
                onEditClick={handleEditClick}
            />

            {/* Edit Department Modal Mounting Logic */}
            {editingDept && (
                <DepartmentEditModal
                    department={editingDept}
                    onClose={() => setEditingDept(null)}
                    onDepartmentUpdated={fetchDepartments}
                />
            )}

            {/* 4. CONDITIONAL CREATION MODAL MOUNTING: Mount overlay block layout on demand */}
            {showCreateModal && (
                <DepartmentCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onDepartmentCreated={fetchDepartments}
                />
            )}
        </div>
    );
};

export default DepartmentsTab;
