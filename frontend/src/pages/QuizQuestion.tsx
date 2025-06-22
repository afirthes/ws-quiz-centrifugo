import { useEffect, useRef } from "react";
import { useCentrifugoStore } from "../store/useCentrifugoStore";
import Navbar from "../component/Navbar"

export default function QuizQuestion() {
    const currentQuestion = useCentrifugoStore(state => state.currentQuestion);
    const usersAnswered = useCentrifugoStore(state => state.usersAnswered);
    const userId = useCentrifugoStore.getState().currentUser;
    const centrifuge = useCentrifugoStore.getState().connection?.centrifuge;
    const channel = useCentrifugoStore.getState().connection?.channel;
    const nextQuestion = useCentrifugoStore(state => state.nextQuestion);

    const questionSent = useRef(false);
    useEffect(() => {
        if (!questionSent.current && currentQuestion && centrifuge && channel) {
            const { correct, ...questionToSend } = currentQuestion as any;
            centrifuge.publish(channel, {
                action: "NEXT_QUESTION",
                data: questionToSend,
            });
            questionSent.current = true;
        }
    }, [currentQuestion, centrifuge, channel]);

    const handleAnswer = async (answerIndex: number) => {
        if (centrifuge && channel && userId) {
            try {
                await centrifuge.publish(channel, {
                    action: "ANSWER",
                    user: userId,
                    answer: answerIndex,
                });
                console.log("Answer sent:", answerIndex);
            } catch (error) {
                console.error("Failed to send answer:", error);
            }
        }
    };

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
                {!currentQuestion && (
                    <div className="w-full max-w-xl bg-white shadow-md rounded p-6 text-center text-gray-700">
                        <h2 className="text-xl font-semibold">Вопросов больше нет</h2>
                    </div>
                )}
                {currentQuestion && (
                    <div className="w-full max-w-xl bg-white shadow-md rounded p-6 text-gray-900">
                        <h2 className="text-xl font-bold mb-4">{currentQuestion.q}</h2>
                        <ul className="space-y-2 mb-6">
                            {currentQuestion.a.map((answer, idx) => (
                                <li
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className="cursor-pointer px-4 py-2 border rounded hover:bg-blue-100 transition"
                                >
                                    {answer}
                                </li>
                            ))}
                        </ul>

                        {usersAnswered.length > 0 && (
                            <div className="pt-4 border-t">
                                <h3 className="text-lg font-semibold mb-2">Ответившие участники:</h3>
                                <ul className="space-y-1">
                                    {usersAnswered.map((user, idx) => (
                                        <li key={idx}>{user}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                {currentQuestion && (
                    <button
                        onClick={nextQuestion}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                        Следующий вопрос
                    </button>
                )}
            </main>
        </div>
    );
}