import { useState } from "react";
import Navbar from "../component/Navbar";
import { useCentrifugoStore } from "../store/useCentrifugoStore"; // путь к zustand хранилищу

const users = [
    { id: "1", email: "alice@example.com" },
    { id: "2", email: "bob@example.com" },
    { id: "3", email: "charlie@example.com" },
];

export default function Dashboard() {
    const connect = useCentrifugoStore((state) => state.connect);
    const disconnect = useCentrifugoStore((state) => state.disconnect);

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleConnect = async (userId: string) => {
        setSelectedUserId(userId);
        await connect(userId, userId, `chat#${userId}`);
    };

    const handleDisconnect = (userId: string) => {
        disconnect(userId);
        if (selectedUserId === userId) setSelectedUserId(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col relative">
            <Navbar userEmail="" />

            <main className="flex-grow flex flex-col items-center justify-center gap-10 p-4">
                <div className="bg-white shadow-md rounded p-6 w-full max-w-lg text-center">
                    <h2 className="text-2xl font-bold mb-4">Список пользователей</h2>
                    <ul className="space-y-4">
                        {users.map((user) => {
                            // 🔄 Прямая подписка на статус через Zustand
                            const status = useCentrifugoStore(
                                (state) => state.connections[user.id]?.status || "disconnected"
                            );

                            return (
                                <li
                                    key={user.id}
                                    className="border p-4 rounded text-left text-gray-800 flex flex-col gap-2"
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{user.email}</span>
                                        <span
                                            className={`px-2 py-1 text-sm rounded-full ${
                                                status === "connected"
                                                    ? "bg-green-100 text-green-800"
                                                    : status === "connecting"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                            }`}
                                        >
                      {status}
                    </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
                                            onClick={() => handleConnect(user.id)}
                                            disabled={status !== "disconnected"}
                                        >
                                            Подключиться
                                        </button>
                                        <button
                                            className="px-4 py-2 rounded bg-red-500 text-white disabled:opacity-50"
                                            onClick={() => handleDisconnect(user.id)}
                                            disabled={status !== "connected"}
                                        >
                                            Отключиться
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </main>
        </div>
    );
}