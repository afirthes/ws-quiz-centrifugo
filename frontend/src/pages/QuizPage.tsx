import {useParams} from "react-router-dom";
import Navbar from "../component/Navbar.tsx";

export default function QuizPage() {
    const {id} = useParams();

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar userEmail={"User"}/>
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-6 rounded shadow text-center">
                    <h1 className="text-2xl font-bold mb-4">Викторина: {id}</h1>
                    <p>Здесь будет содержимое викторины «{id}»</p>
                </div>
            </div>
        </div>
    );
}