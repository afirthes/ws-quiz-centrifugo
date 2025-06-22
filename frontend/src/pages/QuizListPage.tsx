import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import { useCentrifugoStore } from "../store/useCentrifugoStore";

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();
  const setCurrentQuiz = useCentrifugoStore((s) => s.setCurrentQuiz);
  const setQuizzesInStore = useCentrifugoStore((s) => s.setQuizzes);

  useEffect(() => {
    fetch("/api/quiz/list")
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(data);
        setQuizzesInStore(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
      <Navbar userEmail="" />

      <main className="flex-grow flex flex-col items-center justify-center gap-10 p-4">
        <div className="bg-white shadow-md rounded p-6 w-full max-w-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Доступные квизы</h2>
          <ul className="space-y-4">
            {quizzes.map((quiz: any) => (
              <li key={quiz.id} className="border p-4 rounded flex justify-between items-center">
                <span className="text-gray-800 font-medium">{quiz.name}</span>
                <button
                  onClick={() => {
                    setCurrentQuiz(quiz.id);
                    navigate("/quiz");
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Начать
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}