import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Icon from "../Icon";
import { visual } from "../utils/materiaVisual";

const DIAS = [
  { id: "SEG", label: "Segunda" },
  { id: "TER", label: "Terça" },
  { id: "QUA", label: "Quarta" },
  { id: "QUI", label: "Quinta" },
  { id: "SEX", label: "Sexta" },
];

const ORDENS_PADRAO = [1, 2, 3, 4, 5, 6];

export default function Horarios() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [editing, setEditing] = useState(null); // { dia, ordem, h? }

  useEffect(() => {
    api
      .get("/turmas")
      .then((r) => {
        const lista = Array.isArray(r.data) ? r.data : [];
        setTurmas(lista);
        if (lista.length && !turmaId) setTurmaId(lista[0].id);
      })
      .catch(() => setErro("Erro ao carregar turmas."));
  }, []);

  const loadHorarios = (id) => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/horarios/turma/${id}`)
      .then((r) => setHorarios(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Erro ao carregar horários."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (turmaId) loadHorarios(turmaId);
  }, [turmaId]);

  const grid = useMemo(() => {
    const map = {};
    for (const h of horarios) {
      map[`${h.diaSemana}-${h.ordemAula}`] = h;
    }
    return map;
  }, [horarios]);

  // Determina quantas ordens de aula exibir (mínimo 6, ou o máximo encontrado)
  const ordens = useMemo(() => {
    const max = horarios.reduce((m, h) => Math.max(m, h.ordemAula), 0);
    const total = Math.max(6, max);
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [horarios]);

  const turmaAtual = turmas.find((t) => t.id === turmaId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Horários</div>
          <h1 className="page-title">Grade de aulas</h1>
          <div className="page-subtitle">
            {turmaAtual
              ? `${turmaAtual.nome}${turmaAtual.serieNome ? " · " + turmaAtual.serieNome : ""}`
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
          <select
            className="input"
            value={turmaId || ""}
            onChange={(e) => setTurmaId(Number(e.target.value))}
          >
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
                {t.serieNome ? ` · ${t.serieNome}` : ""}
                {t.anoLetivo ? ` (${t.anoLetivo})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 80 }}>Aula</th>
              {DIAS.map((d) => (
                <th key={d.id}>{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  carregando…
                </td>
              </tr>
            )}
            {!loading &&
              ordens.map((ordem) => (
                <tr key={ordem}>
                  <td style={{ verticalAlign: "top" }}>
                    <div className="strong" style={{ fontSize: 13 }}>{ordem}ª</div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                      AULA
                    </div>
                  </td>
                  {DIAS.map((d) => {
                    const h = grid[`${d.id}-${ordem}`];
                    if (!h) {
                      return (
                        <td
                          key={d.id}
                          style={{
                            background: "var(--panel-2)",
                            border: "1px dashed var(--line)",
                            padding: 8,
                            cursor: "pointer",
                            textAlign: "center",
                            color: "var(--ink-3)",
                            fontSize: 11,
                          }}
                          onClick={() => setEditing({ dia: d.id, ordem })}
                        >
                          + adicionar
                        </td>
                      );
                    }
                    const v = visual(h.materiaNome);
                    return (
                      <td
                        key={d.id}
                        style={{ padding: 8, cursor: "pointer" }}
                        onClick={() => setEditing({ dia: d.id, ordem, h })}
                      >
                        <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
                          <span
                            style={{
                              display: "inline-grid",
                              placeItems: "center",
                              minWidth: 32,
                              height: 32,
                              padding: "0 4px",
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
                            <div className="strong" style={{ fontSize: 12, lineHeight: 1.2 }}>
                              {h.materiaNome}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.2 }}>
                              {h.professorNome}
                            </div>
                            {h.horarioInicio && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--ink-3)",
                                  fontFamily: "var(--font-mono)",
                                  marginTop: 2,
                                }}
                              >
                                {h.horarioInicio}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {editing && turmaId && (
        <SlotModal
          turmaId={turmaId}
          dia={editing.dia}
          ordem={editing.ordem}
          horario={editing.h}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            loadHorarios(turmaId);
          }}
        />
      )}
    </div>
  );
}

function SlotModal({ turmaId, dia, ordem, horario, onClose, onSaved }) {
  const [materias, setMaterias] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [materiaId, setMateriaId] = useState(horario?.materiaId || "");
  const [professorId, setProfessorId] = useState(horario?.professorId || "");
  const [horarioInicio, setHorarioInicio] = useState(horario?.horarioInicio || "");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/materias").catch(() => ({ data: [] })),
      api.get("/usuarios").catch(() => ({ data: [] })),
    ]).then(([m, u]) => {
      setMaterias(Array.isArray(m.data) ? m.data : []);
      const profs = (Array.isArray(u.data) ? u.data : []).filter((x) => x.role === "PROFESSOR");
      setProfessores(profs);
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!materiaId || !professorId) {
      setErro("Selecione matéria e professor.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/horarios", {
        turmaId: String(turmaId),
        materiaId: String(materiaId),
        professorId: String(professorId),
        diaSemana: dia,
        ordemAula: String(ordem),
        horarioInicio: horarioInicio || "",
      });
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const remover = async () => {
    if (!horario) return;
    setSaving(true);
    try {
      await api.delete(`/horarios/${horario.id}`);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao remover.");
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 480 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{horario ? "Editar slot" : "Novo slot"}</div>
            <div className="modal-title">
              {DIAS.find((d) => d.id === dia)?.label} · {ordem}ª aula
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="field">
            <label>Matéria</label>
            <select
              className="input"
              value={materiaId}
              onChange={(e) => setMateriaId(e.target.value)}
            >
              <option value="">— selecione —</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Professor</label>
            <select
              className="input"
              value={professorId}
              onChange={(e) => setProfessorId(e.target.value)}
            >
              <option value="">— selecione —</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Horário de início (opcional)</label>
            <input
              className="input"
              type="time"
              value={horarioInicio}
              onChange={(e) => setHorarioInicio(e.target.value)}
            />
          </div>

          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>

        <div className="modal-footer">
          {horario ? (
            <button
              className="btn"
              type="button"
              onClick={remover}
              disabled={saving}
              style={{ color: "var(--bad)" }}
            >
              Remover
            </button>
          ) : (
            <span />
          )}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn accent" type="submit" disabled={saving}>
              {saving ? "salvando…" : "Salvar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
