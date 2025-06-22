import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import PrivateRoutes from "./component/PrivateRoutes.tsx"
import CentrifugoConnectPage from "./pages/ParticipantPage.tsx";
import QuizListPage from "./pages/QuizListPage.tsx";
import QuizPage from "./pages/QuizPage.tsx";
import QuizQuestion from "./pages/QuizQuestion.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/p" element={<CentrifugoConnectPage />} />

        <Route element={<PrivateRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/list" element={<QuizListPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/question" element={<QuizQuestion />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
