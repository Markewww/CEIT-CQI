import React, { createContext, useContext, useState } from "react";

interface UserProfile {
    id: number;
    username: string | null;
    first_name: string;
    last_name: string;
    email: string | null;
    role: "Admin" | "Faculty" | "Chairperson" | "Department Head" | "Dean";
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
        // Automatically recover session context on browser page refresh
        const savedUser = localStorage.getItem("cqi_session_user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const loginContext = (userData: UserProfile) => {
        setUser(userData);
        localStorage.setItem("cqi_session_user", JSON.stringify(userData));
    };

    const logoutContext = () => {
        setUser(null);
        localStorage.removeItem("cqi_session_user");
    };

    return (
        <AuthContext.Provider value={{ user, loginContext, logoutContext }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be wrapped inside an AuthProvider");
    return context;
};
