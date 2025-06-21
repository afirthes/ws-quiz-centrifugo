import { useState } from "react";
import { useCentrifugoStore } from "../store/useCentrifugoStore";

export default function CentrifugoConnectPage() {
    const connect = useCentrifugoStore((s) => s.connect);
    const disconnect = useCentrifugoStore((s) => s.disconnect);

    const [userId, setUserId] = useState("");
    const [channel, setChannel] = useState("");
    const [connectionId, setConnectionId] = useState("");
    const [quizQuestion, setQuizQuestion] = useState<{ q: string; a: string[] } | null>(null);

    // ✅ Подписка напрямую на статус по connectionId
    const status = useCentrifugoStore((state) =>
        connectionId ? state.connections[connectionId]?.status ?? "disconnected" : "disconnected"
    );

    const handleConnect = async () => {
        if (!userId || !channel) return;

        const id = `${userId}::${channel}`;
        setConnectionId(id);

        await connect(id, userId, channel);

        const conn = useCentrifugoStore.getState().connections[id];
        if (conn) {
          conn.subscription.on('publication', (ctx) => {
            if (ctx.data?.action === "NEXT_QUESTION") {
              setQuizQuestion(ctx.data.data);
            }
          });
        }
    };

    const handleDisconnect = () => {
        if (!connectionId) return;

        disconnect(connectionId);
        setConnectionId("");
    };

    const handleStartQuiz = () => {
      if (!connectionId) return;

      const centrifuge = useCentrifugoStore.getState().connections[connectionId]?.centrifuge;
      const channelName = useCentrifugoStore.getState().connections[connectionId]?.channel;

      if (!centrifuge || !channelName) return;

      centrifuge.publish(channelName, {
        action: "NEXT_QUESTION",
        data: {
          q: "Столица Великобритании",
          a: ["Washington", "London", "Moscow"],
        },
      });
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Centrifugo Подключение
                </h1>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Имя пользователя</label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="user123"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Канал</label>
                        <input
                            type="text"
                            value={channel}
                            onChange={(e) => setChannel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="chat#general"
                        />
                    </div>

                    <div className="text-center">
            <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    status === "connected"
                        ? "bg-green-100 text-green-700"
                        : status === "connecting"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                }`}
            >
              Статус: {status}
            </span>
                    </div>

                    <div className="flex gap-4 justify-center pt-2">
                        <button
                            onClick={handleConnect}
                            disabled={!userId || !channel || status !== "disconnected"}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                        >
                            Подключиться
                        </button>
                        <button
                            onClick={handleDisconnect}
                            disabled={status === "disconnected"}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                        >
                            Отключиться
                        </button>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleStartQuiz}
                        disabled={status !== "connected"}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                      >
                        Начать викторину
                      </button>
                    </div>
                    {quizQuestion && (
                      <div className="pt-6 border-t mt-4">
                        <h2 className="text-xl font-bold mb-2">{quizQuestion.q}</h2>
                        <ul className="space-y-2">
                          {quizQuestion.a.map((answer, index) => (
                            <li
                              key={index}
                              onClick={async () => {
                                if (!connectionId) return;
                                const centrifuge = useCentrifugoStore.getState().connections[connectionId]?.centrifuge;
                                const channelName = useCentrifugoStore.getState().connections[connectionId]?.channel;
                                if (!centrifuge || !channelName) return;
                                await centrifuge.publish(channelName, {
                                  action: "ANSWER",
                                  user: userId,
                                  answer: index,
                                });
                              }}
                              className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-blue-100 cursor-pointer transition"
                            >
                              {answer}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
}