import { useEffect, useState } from "react";
import { useCentrifugoStore } from "../store/useCentrifugoStore";
import Navbar from "../component/Navbar"

export default function QuizPage() {
    const currentQuizId = useCentrifugoStore((s) => s.currentQuiz);
    const connect = useCentrifugoStore((s) => s.connect);
    const getStatus = useCentrifugoStore((s) => s.getStatus);
    const userId = useCentrifugoStore((s) => s.currentUser);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        console.log("Called 2")
        if (currentQuizId && userId) {
            connect(currentQuizId, userId, `quiz#${currentQuizId}`);
        }
    }, [currentQuizId, userId]);

    const status = useCentrifugoStore((s) =>
        currentQuizId && userId ? s.getStatus(currentQuizId) : undefined
    );

    const connectedUsers = useCentrifugoStore((s) => s.connectedUsers);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col relative">
            <Navbar userEmail="" />

            {status && (
                <div className="flex justify-end pr-6 pt-2 w-full">
                        <span
                            className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
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
            )}

            <main className="flex-grow flex flex-col items-center justify-center gap-10 p-4">
                {currentQuizId && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-700 font-mono">{`quiz#${currentQuizId}`}</span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`quiz#${currentQuizId}`);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 1500);
                            }}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            {copied ? "Скопировано!" : "Копировать"}
                        </button>
                    </div>
                )}
                {currentQuizId && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Подключённые пользователи:</h3>
                        <ul className="space-y-1">
                            {connectedUsers.map((user, index) => (
                                <li key={index} className="text-gray-800">{user}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </main>
        </div>
    );
}