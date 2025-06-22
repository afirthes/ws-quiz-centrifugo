import { useState } from "react";
import { useCentrifugoStore } from "../store/useCentrifugoStore";
import { signin } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("a@a.a");
    const [password, setPassword] = useState("123123");
    const navigate = useNavigate();
    const setCurrentUser = useCentrifugoStore((state) => state.setCurrentUser);

    const handleLogin = async () => {
        const success = await signin(email, password);
        if (success) {
            setCurrentUser(email);
            navigate("/list");
        } else {
            alert("Login failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-md p-6 rounded w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Login</h2>
                <input
                    type="email"
                    className="w-full border p-2 mb-3 rounded"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    className="w-full border p-2 mb-3 rounded"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    className="w-full bg-blue-600 text-white py-2 rounded"
                    onClick={handleLogin}
                >
                    Sign In
                </button>
                <p className="text-sm mt-4 text-center">
                    Don't have an account?{" "}
                    <a href="/signup" className="text-blue-600 hover:underline">Sign up</a>
                </p>
            </div>
        </div>
    );
}