import { useEffect, useState } from "react";

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        fetch("/api/auth/me", {
            credentials: "include",
        })
            .then((res) => setIsAuthenticated(res.ok))
            .catch(() => setIsAuthenticated(false));
    }, []);

    return { isAuthenticated };
}