import { useState } from "react";
import { signup } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const navigate = useNavigate();

    const handleSignup = async () => {
        const success = await signup(email, password, passwordConfirm);
        if (success) {
            alert("Registered successfully!");
            navigate("/login");
        } else {
            alert("Signup failed.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-md p-6 rounded w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Sign Up</h2>
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
                <input
                    type="password"
                    className="w-full border p-2 mb-3 rounded"
                    placeholder="Confirm Password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                />
                <button
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    onClick={handleSignup}
                >
                    Register
                </button>
                <p className="text-sm mt-4 text-center">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-600 hover:underline">Login</a>
                </p>
            </div>
        </div>
    );
}