import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

const ANO_ATUAL = new Date().getFullYear();
const AVATAR_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

function turmaInitial(t) {
  return (t?.nome || "?").trim()[0]?.toUpperCase() || "?";
}
function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}
function iniciais(nome = "") {
  const parts = nome.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "—";
}

export default function Turmas() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [lista, setLista] = useState([]);
  const [series, setSeries] = useState([]);
  const [filtroSerie, setFiltroSerie] = useState("todas");
  const [filtroAno, setFiltroAno] = useState(ANO_ATUAL);
  const [view, setView] = useState("grid");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    setErro("");
    Promise.all([
      api.get("/turmas").then((r) => r.data).catch(() => []),
      api.get("/turmas/series").then((r) => r.data).catch(() => []),
    ])
      .then(([ts, ss]) => {
        setLista(Array.isArray(ts) ? ts : []);
        setSeries(Array.isArray(ss) ? ss : []);
      })
      .catch(() => setErro("Não foi possível carregar turmas."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(lista.map((t) => t.anoLetivo).filter(Boolean));
    anos.add(ANO_ATUAL);
    return [...anos].sort((a, b) => b - a);
  }, [lista]);

  const filtered = useMemo(() => {
    return lista.filter((t) => {
      if (filtroAno !== "todos" && Number(t.anoLetivo) !== Number(filtroAno)) return false;
      if (filtroSerie !== "todas" && String(t.serie?.id) !== String(filtroSerie)) return false;
      return true;
    });
  }, [lista, filtroAno, filtroSerie]);

  if (detail) {
    return (
      <TurmaDetalhe
        turma={detail}
        onBack={() => {
          setDetail(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Turmas</div>
          <h1 className="page-title">Turmas do ano letivo</h1>
          <div className="page-subtitle">
            {loading ? "carregando…" : `${filtered.length} turma${filtered.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> Nova turma
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
        <button
          className={`chip-btn ${filtroSerie === "todas" ? "on" : ""}`}
          type="button"
          onClick={() => setFiltroSerie("todas")}
        >
          Todas as séries
        </button>
        {series.map((s) => (
          <button
            key={s.id}
            className={`chip-btn ${String(filtroSerie) === String(s.id) ? "on" : ""}`}
            type="button"
            onClick={() => setFiltroSerie(s.id)}
          >
            {s.nome}
          </button>
        ))}
        <div style={{ width: 16 }} />
        <select
          className="select"
          style={{ width: "auto", maxWidth: 180 }}
          value={filtroAno}
          onChange={(e) => setFiltroAno(e.target.value)}
        >
          <option value="todos">Todos os anos</option>
          {anosDisponiveis.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div style={{ marginLeft: "auto" }} className="row">
          <button
            className="icon-btn"
            type="button"
            title="Grid"
            onClick={() => setView("grid")}
            style={{ background: view === "grid" ? "var(--bg-2)" : "transparent" }}
          >
            <Icon name="chart" />
          </button>
          <button
            className="icon-btn"
            type="button"
            title="Lista"
            onClick={() => setView("list")}
            style={{ background: view === "list" ? "var(--bg-2)" : "transparent" }}
          >
            <Icon name="clipboard" />
          </button>
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="empty">
          <div className="t">Nenhuma turma encontrada</div>
          <div className="s">AJUSTE OS FILTROS OU CRIE UMA NOVA</div>
        </div>
      ) : view === "grid" ? (
        <div className="grid g-4">
          {filtered.map((t) => (
            <TurmaCard
              key={t.id}
              t={t}
              onView={() => setDetail(t)}
              onEdit={() => setModal({ mode: "edit", turma: t })}
            />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Turma</th>
                <th>Série</th>
                <th>Ano letivo</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setDetail(t)}>
                  <td>
                    <span className="row">
                      <span className={`avatar sm ${avatarColor(t.id)}`}>{turmaInitial(t)}</span>
                      <span className="strong">{t.nome}</span>
                    </span>
                  </td>
                  <td>{t.serie?.nome || "—"}</td>
                  <td className="num">{t.anoLetivo || "—"}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => setModal({ mode: "edit", turma: t })}
                      title="Editar"
                    >
                      <Icon name="edit" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <TurmaFormModal
          mode={modal.mode}
          turma={modal.turma}
          series={series}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TurmaCard({ t, onView, onEdit }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          className={`avatar ${avatarColor(t.id)}`}
          style={{ width: 36, height: 36, fontSize: 13 }}
        >
          {turmaInitial(t)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{t.nome}</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              color: "var(--ink-3)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            {t.serie?.nome || "sem série"} · {t.anoLetivo || "—"}
          </div>
        </div>
      </div>
      <div style={{ padding: 14, display: "flex", gap: 6 }}>
        <button className="btn sm" type="button" style={{ flex: 1 }} onClick={onView}>
          <Icon name="chart" size={11} /> Ver turma
        </button>
        <button className="btn sm" type="button" onClick={onEdit} title="Editar">
          <Icon name="edit" />
        </button>
      </div>
    </div>
  );
}

function TurmaFormModal({ mode, turma, series, onClose, onSaved }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    nome: turma?.nome || "",
    serieId: turma?.serie?.id || "",
    anoLetivo: turma?.anoLetivo || ANO_ATUAL,
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [delOpen, setDelOpen] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!form.nome.trim()) return setErro("Informe o nome.");
    if (!form.serieId) return setErro("Selecione a série.");
    if (!form.anoLetivo) return setErro("Informe o ano letivo.");
    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        serieId: Number(form.serieId),
        anoLetivo: Number(form.anoLetivo),
      };
      if (isEdit) await api.put(`/turmas/${turma.id}`, payload);
      else await api.post("/turmas", payload);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    setErro("");
    setSaving(true);
    try {
      await api.delete(`/turmas/${turma.id}`);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao excluir.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{isEdit ? "Editar turma" : "Nova turma"}</div>
            <div className="modal-title">
              {isEdit ? turma.nome : "Cadastrar nova turma"}
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div style={{ gridColumn: "span 2" }}>
              <div className="field">
                <label>Nome da turma</label>
                <input
                  className="input"
                  placeholder="Ex: 3º A"
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="field">
              <label>Série</label>
              <select
                className="select"
                value={form.serieId}
                onChange={(e) => set("serieId", e.target.value)}
              >
                <option value="">Selecionar…</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Ano letivo</label>
              <input
                type="number"
                className="input"
                value={form.anoLetivo}
                onChange={(e) => set("anoLetivo", e.target.value)}
              />
            </div>
          </div>
          {erro && <div style={{ marginTop: 4, color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>
        <div className="modal-footer">
          {isEdit && (
            <button
              className="btn"
              type="button"
              style={{ marginRight: "auto", color: "var(--bad)", borderColor: "var(--bad)" }}
              onClick={() => setDelOpen(true)}
            >
              <Icon name="x" size={11} /> Excluir turma
            </button>
          )}
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : isEdit ? "Salvar alterações" : "Criar turma"}
          </button>
        </div>
        {delOpen && (
          <div
            className="modal-overlay"
            onClick={() => setDelOpen(false)}
            style={{ zIndex: 300 }}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 420 }}>
              <div className="modal-header">
                <div>
                  <div className="card-eyebrow">Excluir turma</div>
                  <div className="modal-title">Tem certeza?</div>
                </div>
                <button className="icon-btn" type="button" onClick={() => setDelOpen(false)}>
                  <Icon name="x" />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
                  Excluir <strong>{turma.nome}</strong> remove também todos os vínculos de
                  alunos e professores. Ação irreversível.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn" type="button" onClick={() => setDelOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={excluir}
                  disabled={saving}
                  style={{ background: "var(--bad)", borderColor: "var(--bad)", color: "#fff" }}
                >
                  {saving ? "excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function TurmaDetalhe({ turma, onBack }) {
  const [alunos, setAlunos] = useState([]);
  const [profs, setProfs] = useState([]);
  const [allUsuarios, setAllUsuarios] = useState([]);
  const [allMaterias, setAllMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");
  const [buscaProf, setBuscaProf] = useState("");
  const [alunoSel, setAlunoSel] = useState("");
  const [profSel, setProfSel] = useState("");
  const [materiaSel, setMateriaSel] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setErro("");
    Promise.all([
      api.get(`/vinculos/aluno-turma/turma/${turma.id}`).then((r) => r.data).catch(() => []),
      api.get(`/vinculos/professor-turma-materia/turma/${turma.id}`).then((r) => r.data).catch(() => []),
      api.get("/usuarios").then((r) => r.data).catch(() => []),
      api.get("/materias").then((r) => r.data).catch(() => []),
    ])
      .then(([a, p, u, m]) => {
        setAlunos(Array.isArray(a) ? a : []);
        setProfs(Array.isArray(p) ? p : []);
        setAllUsuarios(Array.isArray(u) ? u : []);
        setAllMaterias(Array.isArray(m) ? m : []);
      })
      .catch(() => setErro("Erro ao carregar detalhes da turma."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [turma.id]);

  const alunosDisponiveis = useMemo(() => {
    const vinculados = new Set(alunos.map((a) => a.aluno?.id));
    return allUsuarios.filter((u) => u.role === "ALUNO" && !vinculados.has(u.id));
  }, [allUsuarios, alunos]);

  const professoresDisponiveis = useMemo(
    () => allUsuarios.filter((u) => u.role === "PROFESSOR"),
    [allUsuarios]
  );

  const alunosFiltered = useMemo(() => {
    const q = buscaAluno.trim().toLowerCase();
    if (!q) return alunos;
    return alunos.filter((a) => (a.aluno?.nome || "").toLowerCase().includes(q));
  }, [alunos, buscaAluno]);

  const profsFiltered = useMemo(() => {
    const q = buscaProf.trim().toLowerCase();
    if (!q) return profs;
    return profs.filter((p) =>
      [p.professor?.nome, p.materia?.nome].some((s) => (s || "").toLowerCase().includes(q))
    );
  }, [profs, buscaProf]);

  const addAluno = async () => {
    if (!alunoSel) return;
    setBusy(true);
    try {
      await api.post("/vinculos/aluno-turma", { alunoId: alunoSel, turmaId: String(turma.id) });
      setAlunoSel("");
      load();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao vincular aluno.");
    } finally {
      setBusy(false);
    }
  };

  const removeAluno = async (alunoId) => {
    setBusy(true);
    try {
      await api.delete("/vinculos/aluno-turma", {
        data: { alunoId: String(alunoId), turmaId: String(turma.id) },
      });
      load();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao remover aluno.");
    } finally {
      setBusy(false);
    }
  };

  const addProf = async () => {
    if (!profSel || !materiaSel) return;
    setBusy(true);
    try {
      await api.post("/vinculos/professor-turma-materia", {
        professorId: profSel,
        turmaId: String(turma.id),
        materiaId: materiaSel,
      });
      setProfSel("");
      setMateriaSel("");
      load();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao vincular professor.");
    } finally {
      setBusy(false);
    }
  };

  const removeProf = async (professorId, materiaId) => {
    setBusy(true);
    try {
      await api.delete("/vinculos/professor-turma-materia", {
        data: {
          professorId: String(professorId),
          turmaId: String(turma.id),
          materiaId: String(materiaId),
        },
      });
      load();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao remover.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        <button className="btn sm" type="button" onClick={onBack}>
          ← Voltar
        </button>
      </div>
      <div className="page-header">
        <div className="row" style={{ gap: 16, alignItems: "center" }}>
          <span
            className={`avatar ${avatarColor(turma.id)}`}
            style={{ width: 52, height: 52, fontSize: 18 }}
          >
            {turmaInitial(turma)}
          </span>
          <div>
            <div className="page-eyebrow">Acadêmico · Turmas · Detalhe</div>
            <h1 className="page-title">{turma.nome}</h1>
            <div className="page-subtitle">
              {turma.serie?.nome || "sem série"} · ano letivo {turma.anoLetivo || "—"}
            </div>
          </div>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="grid g-4 mb-4">
        <div className="card kpi">
          <div className="label">Alunos matriculados</div>
          <div className="value">{loading ? "…" : alunos.length}</div>
          <div className="delta">no ano letivo</div>
        </div>
        <div className="card kpi">
          <div className="label">Vínculos professor-matéria</div>
          <div className="value">{loading ? "…" : profs.length}</div>
          <div className="delta">aulas atribuídas</div>
        </div>
        <div className="card kpi">
          <div className="label">Matérias distintas</div>
          <div className="value">
            {loading ? "…" : new Set(profs.map((p) => p.materia?.id).filter(Boolean)).size}
          </div>
          <div className="delta">grade ativa</div>
        </div>
        <div className="card kpi">
          <div className="label">Professores distintos</div>
          <div className="value">
            {loading ? "…" : new Set(profs.map((p) => p.professor?.id).filter(Boolean)).size}
          </div>
          <div className="delta">titulares</div>
        </div>
      </div>

      <div className="grid g-2">
        {/* Alunos */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="section-head">
            <div>
              <div className="t">Alunos</div>
              <div className="s">
                {alunos.length} matriculado{alunos.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 8,
            }}
          >
            <input
              className="input"
              placeholder="Buscar matriculado…"
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
            />
            <select className="select" value={alunoSel} onChange={(e) => setAlunoSel(e.target.value)}>
              <option value="">Adicionar aluno…</option>
              {alunosDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
            <button className="btn accent" type="button" onClick={addAluno} disabled={busy || !alunoSel}>
              <Icon name="plus" /> Add
            </button>
          </div>
          <div>
            {alunosFiltered.length === 0 && !loading && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
                Nenhum aluno matriculado.
              </div>
            )}
            {alunosFiltered.map((a, i) => (
              <div
                key={a.aluno?.id ?? i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderBottom: i < alunosFiltered.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <span className={`avatar sm ${avatarColor(a.aluno?.id)}`}>
                  {iniciais(a.aluno?.nome)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {a.aluno?.nome || "—"}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--ink-3)",
                      marginTop: 1,
                    }}
                  >
                    ID {a.aluno?.id}
                  </div>
                </div>
                <button
                  className="btn sm"
                  type="button"
                  onClick={() => removeAluno(a.aluno?.id)}
                  disabled={busy}
                  style={{ color: "var(--bad)" }}
                >
                  <Icon name="x" size={11} /> Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Professores */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="section-head">
            <div>
              <div className="t">Professores</div>
              <div className="s">
                {profs.length} vínculo{profs.length !== 1 ? "s" : ""} professor-matéria
              </div>
            </div>
          </div>
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 8,
            }}
          >
            <select className="select" value={profSel} onChange={(e) => setProfSel(e.target.value)}>
              <option value="">Professor…</option>
              {professoresDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
            <select
              className="select"
              value={materiaSel}
              onChange={(e) => setMateriaSel(e.target.value)}
            >
              <option value="">Matéria…</option>
              {allMaterias.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
            <button
              className="btn accent"
              type="button"
              onClick={addProf}
              disabled={busy || !profSel || !materiaSel}
            >
              <Icon name="plus" /> Add
            </button>
          </div>
          <div style={{ padding: 14, borderBottom: "1px solid var(--line)" }}>
            <input
              className="input"
              placeholder="Buscar professor ou matéria…"
              value={buscaProf}
              onChange={(e) => setBuscaProf(e.target.value)}
            />
          </div>
          <div>
            {profsFiltered.length === 0 && !loading && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 12 }}>
                Nenhum professor vinculado.
              </div>
            )}
            {profsFiltered.map((p, i) => {
              const v = visual(p.materia?.nome || "");
              return (
                <div
                  key={`${p.professor?.id}-${p.materia?.id}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 16px",
                    borderBottom: i < profsFiltered.length - 1 ? "1px solid var(--line)" : "none",
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 4,
                      background: v.cor,
                      color: "white",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {v.sigla}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                      {p.professor?.nome || "—"}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--ink-3)",
                        marginTop: 1,
                      }}
                    >
                      {p.materia?.nome || "—"}
                    </div>
                  </div>
                  <button
                    className="btn sm"
                    type="button"
                    onClick={() => removeProf(p.professor?.id, p.materia?.id)}
                    disabled={busy}
                    style={{ color: "var(--bad)" }}
                  >
                    <Icon name="x" size={11} /> Remover
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
