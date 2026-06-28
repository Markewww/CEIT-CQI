import React, { useState } from "react";
// Import your new separated edit modal component
import UserEditModal from "./UserEditModal";

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

interface UsersTableProps {
    users: SystemUser[];
    isLoading: boolean;
    error: string | null;
    onUserUpdated: () => void; // Triggered to refresh parent data on successful database changes
}

const UsersTable: React.FC<UsersTableProps> = ({ users, isLoading, error, onUserUpdated }) => {
    // Pagination tracking state setup
    const [currentPage, setCurrentPage] = useState<number>(1);
    const rowsPerPage = 10;

    // Modal view tracking states
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
    const [userToApprove, setUserToApprove] = useState<SystemUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // Calculate structural boundary pagination indexes
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = users.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(users.length / rowsPerPage);

    // UI badge mapping utilities
    const getRoleBadgeStyle = (role: string) => {
        if (role === 'Admin') return "bg-primary text-white";
        return "bg-slate-100 text-slate-600";
    };

    const getStatusBadgeStyle = (status: string, isActive: number) => {
        if (isActive === 0) return "text-slate-400 bg-slate-100 border border-slate-200";
        if (status === 'Approved') return "text-emerald-600 bg-emerald-50 border border-emerald-200/60";
        if (status === 'Pending') return "text-amber-600 bg-amber-50 border border-amber-200/60";
        return "text-rose-600 bg-rose-50 border border-rose-200/60";
    };

    // Quick inline shortcut trigger routine for approval buttons
    const handleConfirmApprove = async () => {
        if (!userToApprove) return;
        setIsSubmitting(true);
        setActionError(null);

        try {
            const response = await fetch("http://localhost/cqi/api/admin/approve_user.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userToApprove.id })
            });

            const result = await response.json();
            if (result.status === "success") {
                setUserToApprove(null); // Close confirmation prompt
                onUserUpdated();        // Tell parent view matrix to reload DB rows
            } else {
                setActionError(result.message || "Failed to update user profile registration state.");
            }
        } catch (err) {
            setActionError("Network endpoint connection failure.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative">
            {/* Header Status Bar Summary */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered System Users</span>
                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                    {isLoading ? "..." : `${users.length} Accounts`}
                </span>
            </div>

            {/* Conditional Loading State View */}
            {isLoading && (
                <div className="p-8 text-center text-sm font-medium text-slate-400 font-montserrat animate-pulse">
                    Querying database records...
                </div>
            )}

            {/* Conditional Error Connection Frame */}
            {error && (
                <div className="p-8 text-center text-sm font-semibold text-rose-500 bg-rose-50/30">
                    ⚠️ Error: {error}
                </div>
            )}

            {/* Empty Array Result Fallback Screen */}
            {!isLoading && !error && users.length === 0 && (
                <div className="p-8 text-center text-sm font-medium text-slate-400">
                    No registered users found in the system database.
                </div>
            )}

            {/* Main Interactive Table Rendering Loop */}
            {!isLoading && !error && users.length > 0 && (
                <>
                    <div className="divide-y divide-slate-100 min-h-100">
                        {currentRows.map((account) => (
                            <div key={account.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                                {/* Clicking the profile block triggers the new editable modal popup sheet */}
                                <div 
                                    onClick={() => setSelectedUser(account)}
                                    className="flex items-center gap-3 cursor-pointer group select-none"
                                >
                                    {/* Profile Circle Avatar initials */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 ${
                                        account.role === 'Admin' 
                                            ? 'bg-primary/10 text-primary' 
                                            : account.role === 'Chairperson' || account.role === 'Dean'
                                                ? 'bg-blue-500/10 text-blue-700' 
                                                : 'bg-amber-500/10 text-amber-700'
                                    }`}>
                                        {account.initials}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors underline-offset-2 group-hover:underline">
                                            {account.full_name}
                                        </h4>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {account.email} <span className="text-slate-300">|</span> ID: {account.employee_id}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Inline quick approve shortcut button */}
                                    {account.status === 'Pending' && account.is_active !== 0 && (
                                        <button 
                                            onClick={() => setUserToApprove(account)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-sm transition-all"
                                        >
                                            Approve
                                        </button>
                                    )}

                                    {/* Level Authorization Badge */}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-montserrat ${getRoleBadgeStyle(account.role)}`}>
                                        {account.role}
                                    </span>
                                    {/* Verification State Marker */}
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusBadgeStyle(account.status, account.is_active)}`}>
                                        {account.is_active === 0 ? "Inactive" : account.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Action Controller Footer Bar */}
                    {totalPages > 1 && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                            <div>
                                Showing <span className="font-bold text-slate-700">{indexOfFirstRow + 1}</span> to{" "}
                                <span className="font-bold text-slate-700">{Math.min(indexOfLastRow, users.length)}</span> of{" "}
                                <span className="font-bold text-slate-700">{users.length}</span> entries
                            </div>

                            <div className="flex items-center gap-1.5 select-none">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                                >
                                    « First
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Prev
                                </button>
                                <div className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary font-bold">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-bold"
                                >
                                    Last »
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* INTEGRATED REUSABLE EDIT OR VIEW PROFILE MODAL OVERLAY COMPONENT */}
            {selectedUser && (
                <UserEditModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUserUpdated={onUserUpdated}
                />
            )}

            {/* CONFIRMATION PROMPT BOX FOR QUICK INLINE ADMINISTRATIVE APPROVALS */}
            {userToApprove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-scale-up">
                        <h3 className="text-base font-bold text-slate-900 font-montserrat flex items-center gap-2">
                            ⚠️ Confirm User Activation
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Are you sure you want to approve the registration profile for <strong>{userToApprove.full_name}</strong>? This instantly provides them access to institutional modules matching the <strong>{userToApprove.role}</strong> tier.
                        </p>

                        {actionError && (
                            <div className="mt-3 p-2 rounded bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-semibold">
                                {actionError}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setUserToApprove(null)}
                                disabled={isSubmitting}
                                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs px-3 py-2 rounded-lg disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmApprove}
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                                {isSubmitting ? "Processing..." : "Yes, Approve"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersTable;
