// components/PrivateRoutes.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoutes() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated === null) {
        return <div>Loading...</div>; // или спиннер
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}