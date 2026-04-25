import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

const TIPOS = [
  { id: "PROVA", label: "Prova", cor: "#3F6FB0" },
  { id: "TRABALHO", label: "Trabalho", cor: "#4FAE85" },
  { id: "SIMULADO", label: "Simulado", cor: "#B5832A" },
  { id: "RECUPERACAO", label: "Recuperação", cor: "#A8473A" },
];
const BIMESTRES = [1, 2, 3, 4];

function tipoLabel(t) {
  return TIPOS.find((x) => x.id === t)?.label || t;
}
function tipoCor(t) {
  return TIPOS.find((x) => x.id === t)?.cor || "var(--ink-3)";
}
function fmtData(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return String(d);
  }
}

export default function Lancamentos() {
  const [turmas, setTurmas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [bimestre, setBimestre] = useState(1);

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null); // { mode: "new" } | { mode: "lancar", a }

  useEffect(() => {
    Promise.all([
      api.get("/turmas").catch(() => ({ data: [] })),
      api.get("/materias").catch(() => ({ data: [] })),
    ]).then(([t, m]) => {
      const ts = Array.isArray(t.data) ? t.data : [];
      setTurmas(ts);
      setMaterias(Array.isArray(m.data) ? m.data : []);
      if (ts.length && !turmaId) setTurmaId(String(ts[0].id));
    });
  }, []);

  const loadAvaliacoes = () => {
    if (!turmaId || !materiaId) {
      setAvaliacoes([]);
      return;
    }
    setLoading(true);
    setErro("");
    api
      .get(`/notas/avaliacoes?turmaId=${turmaId}&materiaId=${materiaId}`)
      .then((r) => setAvaliacoes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar avaliações."))
      .finally(() => setLoading(false));
  };

  const loadAlunos = () => {
    if (!turmaId) return;
    api
      .get(`/vinculos/aluno-turma/turma/${turmaId}`)
      .then((r) => {
        const raw = Array.isArray(r.data) ? r.data : [];
        // Endpoint returns AlunoTurma entities — extract aluno
        const lista = raw
          .map((at) => ({
            id: at.aluno?.id || at.alunoId,
            nome: at.aluno?.nome || at.alunoNome,
          }))
          .filter((a) => a.id)
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        setAlunos(lista);
      })
      .catch(() => setAlunos([]));
  };

  useEffect(() => {
    loadAvaliacoes();
    loadAlunos();
  }, [turmaId, materiaId]);

  const avaliacoesFiltradas = useMemo(() => {
    return avaliacoes.filter((a) => a.bimestre === bimestre);
  }, [avaliacoes, bimestre]);

  const turmaAtual = turmas.find((t) => String(t.id) === String(turmaId));
  const materiaAtual = materias.find((m) => String(m.id) === String(materiaId));
  const v = materiaAtual ? visual(materiaAtual.nome) : null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Lançamentos</div>
          <h1 className="page-title">Avaliações & notas</h1>
          <div className="page-subtitle">
            {turmaAtual && materiaAtual
              ? `${turmaAtual.nome} · ${materiaAtual.nome} · ${bimestre}º bim`
              : "selecione turma e matéria"}
          </div>
        </div>
        <div className="row">
          <button
            className="btn accent"
            type="button"
            disabled={!turmaId || !materiaId}
            onClick={() => setModal({ mode: "new" })}
          >
            <Icon name="plus" /> Nova avaliação
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <div className="field" style={{ minWidth: 200 }}>
          <label>Turma</label>
          <select className="input" value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">— turma —</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {t.serieNome ? ` · ${t.serieNome}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 200 }}>
          <label>Matéria</label>
          <select className="input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            <option value="">— matéria —</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {BIMESTRES.map((b) => (
            <button
              key={b}
              type="button"
              className={`chip ${bimestre === b ? "active" : ""}`}
              onClick={() => setBimestre(b)}
            >
              {b}º bim
            </button>
          ))}
        </div>
      </div>

      {!turmaId || !materiaId ? (
        <div className="empty">
          <div className="t">Selecione turma e matéria</div>
          <div className="s">PARA VER E LANÇAR AVALIAÇÕES</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Tipo</th>
                <th>Descrição</th>
                <th style={{ width: 110 }}>Data</th>
                <th style={{ width: 60 }}>Peso</th>
                <th style={{ width: 100 }}>Notas</th>
                <th style={{ width: 110, textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && avaliacoesFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                    Nenhuma avaliação no {bimestre}º bimestre.
                  </td>
                </tr>
              )}
              {avaliacoesFiltradas.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span
                      className="pill"
                      style={{ background: tipoCor(a.tipo), color: "#fff", fontSize: 10 }}
                    >
                      {tipoLabel(a.tipo)}
                    </span>
                  </td>
                  <td>
                    <span className="strong">{a.descricao || "—"}</span>
                    {v && (
                      <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                        {materiaAtual?.nome}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    {fmtData(a.dataAplicacao)}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{a.peso}</td>
                  <td>
                    <span style={{ fontSize: 12 }}>
                      <strong>{a.notas?.length || 0}</strong>
                      <span style={{ color: "var(--ink-3)" }}> / {alunos.length}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn sm"
                      type="button"
                      onClick={() => setModal({ mode: "lancar", a })}
                    >
                      <Icon name="edit" size={11} /> Lançar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.mode === "new" && (
        <NovaAvaliacaoModal
          turmaId={turmaId}
          materiaId={materiaId}
          bimestre={bimestre}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadAvaliacoes();
          }}
        />
      )}
      {modal?.mode === "lancar" && (
        <LancarNotasModal
          avaliacao={modal.a}
          alunos={alunos}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            loadAvaliacoes();
          }}
        />
      )}
    </div>
  );
}

function NovaAvaliacaoModal({ turmaId, materiaId, bimestre, onClose, onSaved }) {
  const [tipo, setTipo] = useState("PROVA");
  const [descricao, setDescricao] = useState("");
  const [peso, setPeso] = useState("1.0");
  const [dataAplicacao, setDataAplicacao] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const isPesoEditavel = tipo !== "SIMULADO" && tipo !== "RECUPERACAO";

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    setSaving(true);
    try {
      await api.post("/notas/avaliacao", {
        turmaId: String(turmaId),
        materiaId: String(materiaId),
        tipo,
        descricao,
        peso: isPesoEditavel ? peso : "1.0",
        dataAplicacao,
        bimestre: String(bimestre),
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 520 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{bimestre}º bimestre</div>
            <div className="modal-title">Nova avaliação</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>Tipo</div>
            <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip ${tipo === t.id ? "active" : ""}`}
                  onClick={() => setTipo(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Descrição</label>
            <input
              className="input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="ex: P1 — Equações de 1º grau"
              autoFocus
            />
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Data</label>
              <input
                className="input"
                type="date"
                value={dataAplicacao}
                onChange={(e) => setDataAplicacao(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Peso {!isPesoEditavel && "(fixo)"}</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={isPesoEditavel ? peso : "1.0"}
                onChange={(e) => setPeso(e.target.value)}
                disabled={!isPesoEditavel}
              />
            </div>
          </div>

          {tipo === "SIMULADO" && (
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              Simulados são bonificações: nota de 0.0 a 1.0 somada à média.
            </div>
          )}
          {tipo === "RECUPERACAO" && (
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              Recuperação substitui a média do bimestre se for maior.
            </div>
          )}

          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : "Criar avaliação"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LancarNotasModal({ avaliacao, alunos, onClose, onSaved }) {
  const [valores, setValores] = useState({});
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [salvosOk, setSalvosOk] = useState(0);

  useEffect(() => {
    const inicial = {};
    for (const n of avaliacao.notas || []) {
      inicial[n.alunoId] = String(n.valor);
    }
    setValores(inicial);
  }, [avaliacao]);

  const set = (alunoId, v) => setValores((s) => ({ ...s, [alunoId]: v }));

  const lancarTodos = async () => {
    setErro("");
    setSaving(true);
    setSalvosOk(0);
    let ok = 0;
    let fail = 0;
    for (const aluno of alunos) {
      const raw = valores[aluno.id];
      if (raw === undefined || raw === null || String(raw).trim() === "") continue;
      const v = String(raw).replace(",", ".");
      try {
        await api.post("/notas/lancar", {
          avaliacaoId: String(avaliacao.id),
          alunoId: String(aluno.id),
          valor: v,
        });
        ok++;
      } catch (err) {
        fail++;
      }
      setSalvosOk(ok);
    }
    setSaving(false);
    if (fail === 0) {
      onSaved();
    } else {
      setErro(`${ok} lançadas, ${fail} falharam.`);
    }
  };

  const isSimulado = avaliacao.tipo === "SIMULADO";
  const max = isSimulado ? 1 : 10;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 600, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{tipoLabel(avaliacao.tipo)} · {avaliacao.bimestre}º bim</div>
            <div className="modal-title">{avaliacao.descricao || "Lançar notas"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              Notas de 0 a {max}{isSimulado ? " (bonificação)" : ""}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body" style={{ overflow: "auto" }}>
          <table className="table" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Aluno</th>
                <th style={{ width: 120, textAlign: "right" }}>Nota</th>
              </tr>
            </thead>
            <tbody>
              {alunos.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: 30, textAlign: "center", color: "var(--ink-3)" }}>
                    Nenhum aluno vinculado à turma.
                  </td>
                </tr>
              )}
              {alunos.map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}</td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max={max}
                      step="0.1"
                      value={valores[a.id] ?? ""}
                      onChange={(e) => set(a.id, e.target.value)}
                      style={{ width: 80, textAlign: "right" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {erro && <div style={{ marginTop: 12, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Fechar
          </button>
          <button className="btn accent" type="button" onClick={lancarTodos} disabled={saving}>
            {saving ? `salvando ${salvosOk}/${alunos.length}…` : "Lançar notas"}
          </button>
        </div>
      </div>
    </div>
  );
}
