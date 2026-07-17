import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('Admin' | 'Faculty' | 'Program Head' | 'Department Chairperson' | 'College Dean')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user } = useAuth(); 
    const location = useLocation();

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const isAuthenticated = user !== null && token !== null;

    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // FIXED: Removed the generic "as any" cast to satisfy strict type assertions [INDEX: 0.1.107]
    if (allowedRoles) {
        const hasAccessClearance = allowedRoles.some(
            role => role.toLocaleLowerCase() === user.role.toLowerCase()
        );

        if (!hasAccessClearance) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
