import React, { useState, useEffect } from "react";
// Import the separated layout template view cleanly from your components directory
import UsersTable from "./components/UsersTable";
// 1. IMPORT MODAL: Bring in the new user creation component
import UserCreateModal from "./components/UserCreateModal";

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
    role: 'Admin' | 'Faculty' | 'Chairperson' | 'Department Head' | 'Dean';
    status: 'Pending' | 'Approved' | 'Rejected';
    is_active: number;
}

const AccountsTab: React.FC = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // 2. STATE MANAGER: Track whether the registration modal sheet is open or shut
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    // 1. CLEAR AND VISIBLE FUNCTION SCOPE DEFINITION
    const fetchAccounts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("http://localhost/cqi/api/admin/users.php");
            
            if (!response.ok) {
                throw new Error(`HTTP network error code: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.status === "success") {
                setUsers(result.data);
            } else {
                setError(result.message || "Failed to load database registries.");
            }
        } catch (err: any) {
            setError(err.message || "Unable to reach database connection link.");
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Initial Mount Trigger
    useEffect(() => {
        fetchAccounts();
    }, []);

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            {/* Header Action Section Bar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 font-montserrat">Manage Accounts</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Audit system registration access, add administrative handles, or modify active faculty access controls.</p>
                </div>
                {/* 3. EVENT BINDING: Set state to true when clicked to make the modal load */}
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm cursor-pointer transition-all"
                >
                    + Add New User
                </button>
            </div>

            {/* 3. PROP ASSIGNMENT - Accessible scope reference safely achieved */}
            <UsersTable 
                users={users} 
                isLoading={isLoading} 
                error={error} 
                onUserUpdated={fetchAccounts} 
            />

            {/* 4. CONDITIONAL MODAL MOUNTING: Mount overlay block structure only when state trigger flags are true */}
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
