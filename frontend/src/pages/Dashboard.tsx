import {useState} from "react";
import Navbar from "../component/Navbar";
import {useCentrifugo} from "../hooks/useCentrifugo.ts";
import {useSelector} from "react-redux";
import type {RootState} from "../store";

export default function Dashboard() {
    const [userEmail] = useState<string>("admin@example.com");

    useCentrifugo();
    const status = useSelector((state: RootState) => state.connection.status);

    const users = [
        {id: "1", email: "alice@example.com"},
        {id: "2", email: "bob@example.com"},
        {id: "3", email: "charlie@example.com"},
    ];


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col relative">
            <Navbar userEmail={userEmail}/>

            <div className="flex justify-end pr-6 pt-2">
                <span
                    className={`inline-block px-3 py-1 text-sm font-semibold rounded-full text-blue-300`}
                >
                  {status}
                </span>
            </div>

            <main className="flex-grow flex items-center justify-center">
                <div className="bg-white shadow-md rounded p-6 w-full max-w-lg text-center">
                    <h2 className="text-2xl font-bold mb-4">Список пользователей</h2>
                    <ul className="space-y-2">
                        {users.map((user) => (
                            <li
                                key={user.id}
                                className="border p-2 rounded text-left text-gray-800"
                            >
                                {user.email}
                            </li>
                        ))}
                    </ul>
                </div>
            </main>
        </div>
    );
}