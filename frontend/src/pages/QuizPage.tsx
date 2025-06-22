import { useEffect, useState } from "react";
import { useCentrifugoStore } from "../store/useCentrifugoStore";
import Navbar from "../component/Navbar"
import { useNavigate } from "react-router-dom";

export default function QuizPage() {
    const currentQuizId = useCentrifugoStore((s) => s.currentQuiz);
    const connect = useCentrifugoStore((s) => s.connect);
    const userId = useCentrifugoStore((s) => s.currentUser);
    const setCurrentQuestion = useCentrifugoStore((s) => s.setCurrentQuestion);

    const [copied, setCopied] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Called 2")
        if (currentQuizId && userId) {
            connect(userId, `quiz#${currentQuizId}`);
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
                        <button
                            onClick={() => {
                                const quizzes = useCentrifugoStore.getState().quizzes;
                                const quiz = quizzes?.find(q => q.id === currentQuizId);
                                console.log(quiz)
                                console.log(quizzes)
                                if (quiz && quiz.questions.length > 0) {
                                    setCurrentQuestion(quiz.questions[0]);
                                    navigate("/question");
                                } else {
                                    console.log(quiz)
                                }
                            }}
                            className="mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Начать викторину
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}