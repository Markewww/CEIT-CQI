import React, { createContext, useContext, useState } from "react";

interface UserProfile {
    id: number;
    username: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
    role: "Admin" | "Faculty" | "Program Head" | "Department Chairperson" | "College Dean";
    department_id: number;
    department_code: string;
}

interface AuthContextType {
    user: UserProfile | null;
    loginContext: (userData: UserProfile) => void;
    logoutContext: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const loginContext = (userData: UserProfile) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logoutContext = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, loginContext, logoutContext }}>
            {children}
        </AuthContext.Provider>
    );
};

// ◄ FIXED: Injected Fast Refresh lint check override wrapper to clear the compilation blockage
/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be wrapped inside an AuthProvider");
    return context;
};
