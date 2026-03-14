import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DirecaoDashboard from "./pages/DirecaoDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import AlunoDashboard from "./pages/AlunoDashboard";

class AppErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", minHeight: "100vh",
                    background: "#f5f8f5", fontFamily: "'DM Sans', sans-serif", gap: 16,
                }}>
                    <p style={{ fontSize: 15, color: "#3a4a40", margin: 0 }}>
                        Algo deu errado ao carregar a página.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: "#0d1f18", color: "#fff", border: "none",
                            padding: "10px 24px", fontFamily: "inherit",
                            fontSize: 12, letterSpacing: "0.08em",
                            textTransform: "uppercase", cursor: "pointer",
                        }}>
                        Recarregar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function PrivateRoute({ children, role }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    if (!token) return <Navigate to="/" />;
    const allowed = Array.isArray(role) ? role : [role];
    if (role && !allowed.includes(userRole)) return <Navigate to="/" />;
    return children;
}

function App() {
    return (
        <AppErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/direcao" element={
                        <PrivateRoute role={["DIRECAO", "COORDENACAO"]}>
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
        </AppErrorBoundary>
    );
}

export default App;