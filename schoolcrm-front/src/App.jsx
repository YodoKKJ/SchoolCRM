import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DirecaoDashboard from "./pages/DirecaoDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import AlunoDashboard from "./pages/AlunoDashboard";

function PrivateRoute({ children, role }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    if (!token) return <Navigate to="/" />;
    if (role && userRole !== role) return <Navigate to="/" />;
    return children;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/direcao" element={
                    <PrivateRoute role="DIRECAO">
                        <DirecaoDashboard />
                    </PrivateRoute>
                } />
                <Route path="/professor" element={
                    <PrivateRoute role="PROFESSOR">
                        <ProfessorDashboard />
                    </PrivateRoute>
                } />
                <Route path="/aluno" element={
                    <PrivateRoute role="ALUNO">
                        <AlunoDashboard />
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;