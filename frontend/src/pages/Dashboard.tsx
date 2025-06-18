import { signout } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const success = await signout();
        if (success) {
            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Welcome to Dashboard</h1>
                <p className="mb-6 text-gray-700">You are logged in.</p>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}