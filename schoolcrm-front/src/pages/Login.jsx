import { useState } from "react";
import axios from "axios";

export default function Login() {
    const [login, setLogin] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErro("");
        setLoading(true);

        try {
            const response = await axios.post("http://localhost:8080/auth/login", {
                login,
                senha,
            });

            const { token, role, nome } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("nome", nome);

            if (role === "DIRECAO") window.location.href = "/direcao";
            else if (role === "PROFESSOR") window.location.href = "/professor";
            else if (role === "ALUNO") window.location.href = "/aluno";
        } catch (err) {
            setErro("Login ou senha incorretos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#3b1a08] flex items-center justify-center p-4">

            {/* Mobile: card simples */}
            <div className="w-full max-w-sm md:hidden bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-500 text-white text-xl w-10 h-10 rounded-lg flex items-center justify-center mb-4">✳</div>
                    <h1 className="text-2xl font-bold text-gray-900">Bem-vindo</h1>
                    <p className="text-gray-400 text-sm mt-1 text-center">Faça login para acessar o sistema</p>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Login</label>
                        <input
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="seu.login"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400 transition"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 mb-1 block">Senha</label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="••••••••••"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400 transition"
                        />
                    </div>
                    {erro && <p className="text-red-500 text-xs">{erro}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition text-sm mt-2"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
            </div>

            {/* Desktop: dois painéis */}
            <div className="hidden md:flex bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">

                {/* Lado esquerdo */}
                <div className="w-1/2 bg-black rounded-xl m-3 flex items-end p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-600 via-orange-400 to-transparent opacity-60" />
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black to-transparent" />
                    <p className="relative text-white text-2xl font-bold leading-snug z-10">
                        Sistema de Gestão <br /> Escolar
                    </p>
                </div>

                {/* Lado direito */}
                <div className="w-1/2 p-10 flex flex-col justify-center">
                    <div className="bg-orange-500 text-white text-xl w-10 h-10 rounded-lg flex items-center justify-center mb-4">✳</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h1>
                    <p className="text-gray-400 text-sm mb-8">Faça login para acessar o sistema</p>

                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Login</label>
                            <input
                                type="text"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                placeholder="seu.login"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400 transition"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Senha</label>
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                placeholder="••••••••••"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-orange-400 transition"
                            />
                        </div>
                        {erro && <p className="text-red-500 text-xs">{erro}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition text-sm"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}