import { useEffect, useMemo, useState } from "react";
import api from "../api";

const ANO_LETIVO = new Date().getFullYear();

function fmtNumber(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("pt-BR").format(n);
}

export default function Inicio() {
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const escolaNome = typeof window !== "undefined" ? localStorage.getItem("escolaNome") || "Escola" : "Escola";

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [stats, setStats] = useState({
    alunos: null,
    professores: null,
    turmas: null,
    materias: null,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErro("");

    Promise.all([
      api.get("/usuarios").then((r) => r.data).catch(() => []),
      api.get("/turmas").then((r) => r.data).catch(() => []),
      api.get("/materias").then((r) => r.data).catch(() => []),
      api
        .get(`/vinculos/aluno-turma/ocupados-no-ano/${ANO_LETIVO}`)
        .then((r) => r.data)
        .catch(() => []),
    ])
      .then(([usuarios, turmas, materias, ocupados]) => {
        if (!alive) return;
        const lista = Array.isArray(usuarios) ? usuarios : [];
        const tDoAno = (Array.isArray(turmas) ? turmas : []).filter(
          (x) => x.anoLetivo === ANO_LETIVO
        );
        setStats({
          alunos: Array.isArray(ocupados) ? ocupados.length : 0,
          professores: lista.filter((x) => x.role === "PROFESSOR").length,
          turmas: tDoAno.length,
          materias: Array.isArray(materias) ? materias.length : 0,
        });
      })
      .catch(() => {
        if (!alive) return;
        setErro("Não foi possível carregar os indicadores.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const kpis = useMemo(
    () => [
      { label: "Alunos ativos", value: stats.alunos, hint: `ano letivo ${ANO_LETIVO}` },
      { label: "Professores", value: stats.professores, hint: "cadastrados" },
      { label: "Turmas", value: stats.turmas, hint: `ano ${ANO_LETIVO}` },
      { label: "Matérias", value: stats.materias, hint: "no catálogo" },
    ],
    [stats]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Visão geral</div>
          <h1 className="page-title">Início</h1>
          <div className="page-subtitle">
            {escolaNome} · {ANO_LETIVO}
          </div>
        </div>
        <div className="row">
          <button className="btn" type="button">
            Exportar
          </button>
          <button className="btn primary" type="button">
            Nova ação
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="grid g-4 mb-4">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <div className="label">{k.label}</div>
            <div className="value">{loading ? "…" : fmtNumber(k.value)}</div>
            <div className="delta">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-eyebrow">Atalhos</div>
              <div className="card-title">Ações rápidas</div>
            </div>
          </div>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="btn sm" type="button">Nova turma</button>
            <button className="btn sm" type="button">Lançar notas</button>
            <button className="btn sm" type="button">Registrar falta</button>
            <button className="btn sm" type="button">Gerar boletim</button>
            {role === "DIRECAO" || role === "MASTER" ? (
              <button className="btn sm" type="button">Novo contrato</button>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-eyebrow">Status</div>
              <div className="card-title">Protótipo ativo</div>
            </div>
            <span className="pill pill--ok">
              <span className="dot" /> online
            </span>
          </div>
          <p style={{ color: "var(--ink-2)", fontSize: 13, margin: 0 }}>
            Dados reais vindos dos endpoints {" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              /usuarios
            </code>
            ,{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              /turmas
            </code>
            ,{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              /materias
            </code>{" "}
            e{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              /vinculos/aluno-turma
            </code>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
