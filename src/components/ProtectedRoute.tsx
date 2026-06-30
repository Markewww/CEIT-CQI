import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('Admin' | 'Faculty' | 'Chairperson' | 'Department Head' | 'Dean')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user } = useAuth(); // ◄ FIXED: Removed isLoading parameter reference query
    const location = useLocation();

    // 2. CHECK CACHED INTEGRITY: Check state mapping vectors cleanly [INDEX: 1]
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const isAuthenticated = user !== null && token !== null;

    if (!isAuthenticated) {
        // Force redirect to login layout container view grid canvas
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 3. ROLE ACCESSIBILITY VERIFICATION: Stop unauthorized accounts from crossing boundaries
    if (allowedRoles && user?.role && !allowedRoles.includes(user.role as any)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Pass verification checkpoints safely
    return <>{children}</>;
};

export default ProtectedRoute;
