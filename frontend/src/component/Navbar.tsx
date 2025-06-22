import { signout } from "../auth";
import { useNavigate } from "react-router-dom";
import { useCentrifugoStore } from "../store/useCentrifugoStore";

interface NavbarProps {
    userEmail: string;
}

export default function Navbar({ userEmail }: NavbarProps) {
    const navigate = useNavigate();

    const setCurrentUser = useCentrifugoStore((state) => state.setCurrentUser);

    const handleLogout = async () => {
        const success = await signout();
        if (success) {
            setCurrentUser("");
            navigate("/login");
        }
    };

    return (
        <nav className="bg-white shadow p-4 flex justify-between items-center">
            <div className="text-xl font-semibold">Dashboard</div>
            <div className="flex items-center gap-4">
                <span className="text-gray-700">{userEmail}</span>
                <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}