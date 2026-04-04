import { Component } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Login from "./pages/Login";
import DirecaoDashboard from "./pages/DirecaoDashboard";
import ProfessorDashboard from "./pages/ProfessorDashboard";
import AlunoDashboard from "./pages/AlunoDashboard";
import LandingEscola from "./pages/LandingEscola";
import LandingSkolyo from "./pages/LandingSkolyo";
import MasterLogin from "./pages/MasterLogin";
import MasterDashboard from "./pages/MasterDashboard";

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
    const { slug } = useParams();
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    const storedSlug = localStorage.getItem("escolaSlug");

    if (!token) return <Navigate to={slug ? `/escola/${slug}/login` : "/"} />;
    if (slug && storedSlug && slug !== storedSlug) return <Navigate to={`/escola/${storedSlug}/login`} />;

    const allowed = Array.isArray(role) ? role : [role];
    // MASTER tem acesso a qualquer dashboard de escola (impersonação)
    if (role && !allowed.includes(userRole) && userRole !== "MASTER") return <Navigate to={slug ? `/escola/${slug}/login` : "/"} />;
    return children;
}

function MasterPrivateRoute({ children }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");
    if (!token || userRole !== "MASTER") return <Navigate to="/master/login" />;
    return children;
}

// Wrapper para rotas legadas (sem slug) — redireciona para rota com slug se tiver no localStorage
function LegacyRedirect({ role, children }) {
    const storedSlug = localStorage.getItem("escolaSlug");
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) return <Navigate to="/" />;
    if (storedSlug) {
        const allowed = Array.isArray(role) ? role : [role];
        if (role && !allowed.includes(userRole)) return <Navigate to="/" />;
        // Redireciona para a rota com slug
        const path = userRole === "PROFESSOR" ? "professor" : userRole === "ALUNO" ? "aluno" : "direcao";
        return <Navigate to={`/escola/${storedSlug}/${path}`} />;
    }
    return children;
}

function App() {
    return (
        <AppErrorBoundary>
            <BrowserRouter>
                <Routes>
                    {/* Página inicial — redireciona para login da escola se já tiver slug salvo */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Multi-tenant: rotas com slug */}
                    <Route path="/escola/:slug/login" element={<Login />} />
                    <Route path="/escola/:slug/direcao" element={
                        <PrivateRoute role={["DIRECAO", "COORDENACAO"]}>
                            <DirecaoDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/escola/:slug/professor" element={
                        <PrivateRoute role="PROFESSOR">
                            <ProfessorDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/escola/:slug/aluno" element={
                        <PrivateRoute role="ALUNO">
                            <AlunoDashboard />
                        </PrivateRoute>
                    } />

                    {/* Rotas legadas — redireciona para rota com slug */}
                    <Route path="/direcao" element={
                        <LegacyRedirect role={["DIRECAO", "COORDENACAO"]}>
                            <DirecaoDashboard />
                        </LegacyRedirect>
                    } />
                    <Route path="/professor" element={
                        <LegacyRedirect role="PROFESSOR">
                            <ProfessorDashboard />
                        </LegacyRedirect>
                    } />
                    <Route path="/aluno" element={
                        <LegacyRedirect role="ALUNO">
                            <AlunoDashboard />
                        </LegacyRedirect>
                    } />

                    {/* Master routes */}
                    <Route path="/master/login" element={<MasterLogin />} />
                    <Route path="/master" element={
                        <MasterPrivateRoute>
                            <MasterDashboard />
                        </MasterPrivateRoute>
                    } />

                    {/* Landing pública da escola (com e sem slug) */}
                    <Route path="/escola/:slug" element={<LandingEscola />} />
                    <Route path="/escola" element={<LandingEscola />} />

                    {/* Landing page institucional Skolyo */}
                    <Route path="/landing" element={<LandingSkolyo />} />
                </Routes>
            </BrowserRouter>
        </AppErrorBoundary>
    );
}

function RootRedirect() {
    const storedSlug = localStorage.getItem("escolaSlug");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && storedSlug && role) {
        const path = role === "PROFESSOR" ? "professor" : role === "ALUNO" ? "aluno" : "direcao";
        return <Navigate to={`/escola/${storedSlug}/${path}`} />;
    }
    if (storedSlug) {
        return <Navigate to={`/escola/${storedSlug}/login`} />;
    }
    // Sem slug salvo — mostra landing page institucional
    return <LandingSkolyo />;
}

export default App;
