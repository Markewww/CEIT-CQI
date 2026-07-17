import React, { useState, useEffect } from "react";
import UsersTable from "./components/UsersTable";
import UserCreateModal from "./components/UserCreateModal";
import { API_ENDPOINTS } from "@/config/apiConfig";

interface SystemUser {
    id: number;
    employee_id: string;
    username: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    suffix: string;
    full_name: string;
    initials: string;
    email: string;
    contact_number: string;
    department_id: number;
    program_id: number | null;
    role: 'Admin' | 'Faculty' | 'Program Head' | 'Department Chairperson' | 'College Dean';
    status: 'Pending' | 'Approved' | 'Rejected';
    is_active: number;
    department_code: string;
    program_code: string | null;
}

const AccountsTab: React.FC = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(API_ENDPOINTS.ADMIN_USERS);
            
            if (!response.ok) {
                throw new Error(`HTTP network error code: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === "success") {
                setUsers(result.data);
            } else {
                setError(result.message || "Failed to load database registries.");
            }
        } catch (err) {
            const errorInstance = err as Error;
            setError(errorInstance.message || "Unable to reach database connection link.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timerGuard = setTimeout(() => {
            fetchAccounts();
        }, 0);

        return () => clearTimeout(timerGuard);
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Action Section Bar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Accounts</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Audit system registration access, add administrative handles, or modify active faculty access controls.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                    + Add New User
                </button>
            </div>

            <UsersTable 
                users={users} 
                isLoading={isLoading} 
                error={error} 
                onUserUpdated={fetchAccounts} 
            />

            {showCreateModal && (
                <UserCreateModal 
                    onClose={() => setShowCreateModal(false)} 
                    onUserCreated={fetchAccounts} 
                />
            )}
        </div>
    );
};

export default AccountsTab;
