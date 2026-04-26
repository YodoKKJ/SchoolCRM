import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const AVATAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "—";
}
function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}

async function downloadFile(path, filename) {
  const token = localStorage.getItem("token");
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Falha no download.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Boletins() {
  const role   = localStorage.getItem("role");
  const isProf = role === "PROFESSOR";

  const [turmas,      setTurmas]      = useState([]);
  const [turmaId,     setTurmaId]     = useState("");
  const [alunos,      setAlunos]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [busca,       setBusca]       = useState("");
  const [erro,        setErro]        = useState("");
  const [downloading, setDownloading] = useState(null); // alunoId

  useEffect(() => {
    const req = isProf
      ? api.get("/vinculos/professor-turma-materia/minhas").then((r) => {
          const vArr = Array.isArray(r.data) ? r.data : [];
          const map = new Map();
          vArr.forEach((v) => {
            const t = v.turma;
            if (t?.id && !map.has(t.id))
              map.set(t.id, { id: t.id, nome: t.nome, serieNome: t.serie?.nome || "" });
          });
          return [...map.values()];
        })
      : api.get("/turmas").then((r) => (Array.isArray(r.data) ? r.data : []));

    req
      .then((lista) => {
        setTurmas(lista);
        if (lista.length && !turmaId) setTurmaId(String(lista[0].id));
      })
      .catch(() => setErro("Erro ao carregar turmas."));
  }, []);

  useEffect(() => {
    if (!turmaId) return;
    setLoading(true);
    api
      .get(`/vinculos/aluno-turma/turma/${turmaId}`)
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : [];
        const lista = raw
          .map((at) => ({
            id: at.aluno?.id || at.alunoId,
            nome: at.aluno?.nome || at.alunoNome,
          }))
          .filter((a) => a.id)
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setAlunos(lista);
      })
      .catch(() => setAlunos([]))
      .finally(() => setLoading(false));
  }, [turmaId]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return alunos;
    return alunos.filter((a) => (a.nome || "").toLowerCase().includes(q));
  }, [alunos, busca]);

  const turmaAtual = turmas.find((t) => String(t.id) === String(turmaId));

  const baixarBoletim = async (aluno) => {
    setDownloading(aluno.id);
    setErro("");
    try {
      await downloadFile(
        `/relatorios/boletim/${aluno.id}/${turmaId}`,
        `boletim_${aluno.nome.replace(/\s+/g, "_")}.pdf`
      );
    } catch {
      setErro("Erro ao baixar boletim.");
    } finally {
      setDownloading(null);
    }
  };

  const baixarRelatorioTurma = async (tipo) => {
    setErro("");
    try {
      await downloadFile(
        `/relatorios/turma/${turmaId}?tipo=${tipo}`,
        `relatorio_${tipo}_${turmaAtual?.nome || "turma"}.pdf`
      );
    } catch {
      setErro("Erro ao baixar relatório.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Boletins</div>
          <h1 className="page-title">Boletins & relatórios</h1>
          <div className="page-subtitle">
            {turmaAtual
              ? `${turmaAtual.nome}${turmaAtual.serieNome ? " · " + turmaAtual.serieNome : ""} — ${alunos.length} alunos`
              : "selecione uma turma"}
          </div>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div className="field" style={{ minWidth: 240 }}>
          <label>Turma</label>
          <select className="input" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {t.serieNome ? ` · ${t.serieNome}` : ""}
                {t.anoLetivo ? ` (${t.anoLetivo})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, maxWidth: 320 }}>
          <div className="search" style={{ width: "100%", minWidth: 0, background: "var(--panel)" }}>
            <Icon name="search" size={13} />
            <input
              style={{
                border: 0,
                outline: 0,
                background: "transparent",
                flex: 1,
                color: "var(--ink)",
                fontFamily: "inherit",
                fontSize: 13,
              }}
              placeholder="Buscar aluno…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {turmaId && (
        <section style={{ marginBottom: 18 }}>
          <div className="card-eyebrow" style={{ marginBottom: 6 }}>
            Relatórios da turma
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn" type="button" onClick={() => baixarRelatorioTurma("medias")}>
              <Icon name="download" size={11} /> Médias por bimestre
            </button>
            <button className="btn" type="button" onClick={() => baixarRelatorioTurma("frequencia")}>
              <Icon name="download" size={11} /> Frequência
            </button>
            <button className="btn" type="button" onClick={() => baixarRelatorioTurma("situacao")}>
              <Icon name="download" size={11} /> Situação final
            </button>
          </div>
        </section>
      )}

      <div className="card-eyebrow" style={{ marginBottom: 6 }}>
        Boletim individual
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Aluno</th>
              <th style={{ width: 160, textAlign: "right" }}>Boletim</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  carregando…
                </td>
              </tr>
            )}
            {!loading && filtrados.length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  {busca ? "Nenhum aluno bate com a busca." : "Nenhum aluno na turma."}
                </td>
              </tr>
            )}
            {filtrados.map((a) => (
              <tr key={a.id}>
                <td>
                  <span className={`avatar ${avatarColor(a.id)}`}>{iniciais(a.nome)}</span>
                </td>
                <td>
                  <span className="strong">{a.nome}</span>
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="btn sm"
                    type="button"
                    onClick={() => baixarBoletim(a)}
                    disabled={downloading === a.id}
                  >
                    <Icon name="download" size={11} />
                    {downloading === a.id ? " gerando…" : " PDF"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
