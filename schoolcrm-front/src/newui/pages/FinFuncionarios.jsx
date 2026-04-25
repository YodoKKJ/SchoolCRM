import { useEffect, useState } from "react";
import api from "../api";
import Icon from "../Icon";

const fmt = (v) =>
  v == null
    ? "—"
    : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TIPOS_BENEF = [
  "VALE_REFEICAO",
  "VALE_TRANSPORTE",
  "BONUS",
  "HORA_EXTRA",
  "OUTRO",
];

function StatusPill({ ativo }) {
  return (
    <span
      className="pill"
      style={{
        background: ativo ? "var(--ok-bg)" : "var(--bad-bg)",
        color: ativo ? "var(--ok)" : "var(--bad)",
        fontSize: 10,
      }}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

export default function FinFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [beneficios, setBeneficios] = useState({});
  const [modal, setModal] = useState(null); // null | { modo: "criar" | "editar", dados? }
  const [form, setForm] = useState({});
  const [formBenef, setFormBenef] = useState({
    tipo: "VALE_REFEICAO",
    valor: "",
    descricao: "",
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const load = () =>
    api
      .get("/fin/funcionarios")
      .then((r) => setFuncionarios(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});

  const loadBeneficios = (id) =>
    api
      .get(`/fin/funcionarios/${id}/beneficios`)
      .then((r) =>
        setBeneficios((b) => ({
          ...b,
          [id]: Array.isArray(r.data) ? r.data : [],
        }))
      )
      .catch(() => {});

  useEffect(() => {
    load();
    api
      .get("/fin/pessoas", { params: { ativo: true } })
      .then((r) => setPessoas(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const toggleExpand = (id) => {
    setExpandido((e) => {
      const next = e === id ? null : id;
      if (next) loadBeneficios(next);
      return next;
    });
  };

  const ff = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const abrirCriar = () => {
    setForm({ pessoaId: "", cargo: "", salarioBase: "", cargaHoraria: "", dataAdmissao: "" });
    setErro("");
    setModal({ modo: "criar" });
  };

  const abrirEditar = (f) => {
    setForm({
      pessoaId: String(f.pessoaId || ""),
      cargo: f.cargo || "",
      salarioBase: f.salarioBase || "",
      cargaHoraria: f.cargaHoraria || "",
      dataAdmissao: f.dataAdmissao || "",
    });
    setErro("");
    setModal({ modo: "editar", dados: f });
  };

  const salvar = async (e) => {
    e.preventDefault();
    if (!form.pessoaId) { setErro("Selecione uma pessoa."); return; }
    if (!form.cargo) { setErro("Informe o cargo."); return; }
    setSaving(true);
    setErro("");
    try {
      const body = {
        ...form,
        pessoaId: Number(form.pessoaId),
        salarioBase: Number(form.salarioBase),
        cargaHoraria: form.cargaHoraria ? Number(form.cargaHoraria) : null,
      };
      if (modal.modo === "criar") await api.post("/fin/funcionarios", body);
      else await api.put(`/fin/funcionarios/${modal.dados.id}`, body);
      setModal(null);
      load();
    } catch (err) {
      setErro(
        typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (f) => {
    await api.patch(`/fin/funcionarios/${f.id}/status`).catch(() => {});
    load();
  };

  const adicionarBeneficio = async (e, funcId) => {
    e.preventDefault();
    if (Number(formBenef.valor) <= 0) return;
    try {
      await api.post(`/fin/funcionarios/${funcId}/beneficios`, {
        ...formBenef,
        valor: Number(formBenef.valor),
      });
      setFormBenef({ tipo: "VALE_REFEICAO", valor: "", descricao: "" });
      loadBeneficios(funcId);
      load();
    } catch {}
  };

  const toggleBeneficio = async (b, funcId) => {
    await api.patch(`/fin/beneficios/${b.id}/status`).catch(() => {});
    loadBeneficios(funcId);
    load();
  };

  const deletarBeneficio = async (b, funcId) => {
    await api.delete(`/fin/beneficios/${b.id}`).catch(() => {});
    loadBeneficios(funcId);
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro</div>
          <h1 className="page-title">Funcionários</h1>
          <div className="page-subtitle">{funcionarios.length} funcionário(s)</div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={abrirCriar}>
            <Icon name="plus" /> Novo funcionário
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 28 }} />
              <th>Nome</th>
              <th>Cargo</th>
              <th>Salário base</th>
              <th>Total c/ benef.</th>
              <th>C.H.</th>
              <th>Status</th>
              <th style={{ width: 120 }} />
            </tr>
          </thead>
          <tbody>
            {funcionarios.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty" style={{ padding: "32px 0" }}>
                    <div className="t">Nenhum funcionário</div>
                    <div className="s">CLIQUE EM "NOVO FUNCIONÁRIO" PARA COMEÇAR</div>
                  </div>
                </td>
              </tr>
            )}
            {funcionarios.map((f) => (
              <>
                <tr
                  key={f.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleExpand(f.id)}
                >
                  <td style={{ textAlign: "center", color: "var(--ink-3)" }}>
                    <Icon
                      name="chev"
                      size={12}
                      style={{
                        transform: expandido === f.id ? "rotate(90deg)" : "none",
                        transition: ".2s",
                        display: "inline-block",
                      }}
                    />
                  </td>
                  <td className="strong">{f.pessoaNome || "—"}</td>
                  <td>{f.cargo || "—"}</td>
                  <td>{fmt(f.salarioBase)}</td>
                  <td style={{ color: "var(--ok)", fontWeight: 600 }}>
                    {fmt(f.salarioTotal)}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {f.cargaHoraria ? `${f.cargaHoraria}h` : "—"}
                  </td>
                  <td>
                    <StatusPill ativo={f.ativo} />
                  </td>
                  <td
                    onClick={(e) => e.stopPropagation()}
                    style={{ textAlign: "right" }}
                  >
                    <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                      <button
                        className="btn"
                        type="button"
                        style={{ fontSize: 11 }}
                        onClick={() => abrirEditar(f)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn"
                        type="button"
                        style={{
                          fontSize: 11,
                          color: f.ativo ? "var(--bad)" : "var(--ok)",
                        }}
                        onClick={() => toggleAtivo(f)}
                      >
                        {f.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandido === f.id && (
                  <tr key={`benef-${f.id}`}>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <div
                        style={{
                          background: "var(--panel)",
                          padding: "16px 24px",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            marginBottom: 10,
                            color: "var(--ink-2)",
                          }}
                        >
                          Benefícios de {f.pessoaNome}
                        </div>
                        <table className="table" style={{ fontSize: 12, marginBottom: 14 }}>
                          <thead>
                            <tr>
                              <th>Tipo</th>
                              <th>Valor</th>
                              <th>Descrição</th>
                              <th>Status</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {(beneficios[f.id] || []).length === 0 && (
                              <tr>
                                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-3)", padding: 12 }}>
                                  Nenhum benefício
                                </td>
                              </tr>
                            )}
                            {(beneficios[f.id] || []).map((b) => (
                              <tr key={b.id}>
                                <td>{b.tipo?.replace("_", " ")}</td>
                                <td className="strong">{fmt(b.valor)}</td>
                                <td style={{ color: "var(--ink-3)" }}>{b.descricao || "—"}</td>
                                <td>
                                  <StatusPill ativo={b.ativo} />
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <div className="row" style={{ gap: 4, justifyContent: "flex-end" }}>
                                    <button
                                      className="btn"
                                      type="button"
                                      style={{ fontSize: 10, padding: "3px 8px" }}
                                      onClick={() => toggleBeneficio(b, f.id)}
                                    >
                                      {b.ativo ? "Des." : "Ativ."}
                                    </button>
                                    <button
                                      className="btn"
                                      type="button"
                                      style={{ fontSize: 10, padding: "3px 8px", color: "var(--bad)" }}
                                      onClick={() => deletarBeneficio(b, f.id)}
                                    >
                                      Rem.
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Adicionar benefício inline */}
                        <form
                          onSubmit={(e) => adicionarBeneficio(e, f.id)}
                          style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}
                        >
                          <div className="field" style={{ minWidth: 140 }}>
                            <label style={{ fontSize: 10 }}>Tipo</label>
                            <select
                              className="input"
                              value={formBenef.tipo}
                              onChange={(e) =>
                                setFormBenef((b) => ({ ...b, tipo: e.target.value }))
                              }
                            >
                              {TIPOS_BENEF.map((t) => (
                                <option key={t} value={t}>
                                  {t.replace("_", " ")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field" style={{ width: 100 }}>
                            <label style={{ fontSize: 10 }}>Valor (R$)</label>
                            <input
                              className="input"
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              placeholder="0,00"
                              value={formBenef.valor}
                              onChange={(e) =>
                                setFormBenef((b) => ({ ...b, valor: e.target.value }))
                              }
                            />
                          </div>
                          <div className="field" style={{ minWidth: 160 }}>
                            <label style={{ fontSize: 10 }}>Descrição</label>
                            <input
                              className="input"
                              placeholder="Opcional"
                              value={formBenef.descricao}
                              onChange={(e) =>
                                setFormBenef((b) => ({ ...b, descricao: e.target.value }))
                              }
                            />
                          </div>
                          <button
                            className="btn accent"
                            type="submit"
                            style={{ fontSize: 11, padding: "7px 14px" }}
                          >
                            + Adicionar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal criar/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={salvar}
            style={{ width: 460 }}
          >
            <div className="modal-header">
              <div>
                <div className="card-eyebrow">
                  {modal.modo === "criar" ? "Novo funcionário" : "Editar funcionário"}
                </div>
                <div className="modal-title">Dados trabalhistas</div>
              </div>
              <button className="icon-btn" type="button" onClick={() => setModal(null)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 12 }}>
              <div className="field">
                <label>Pessoa *</label>
                <select
                  className="input"
                  value={form.pessoaId}
                  onChange={(e) => ff("pessoaId", e.target.value)}
                  required
                >
                  <option value="">— selecione —</option>
                  {pessoas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                      {p.cpf ? ` (${p.cpf})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cargo *</label>
                <input
                  className="input"
                  value={form.cargo}
                  onChange={(e) => ff("cargo", e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div className="field">
                  <label>Salário base (R$) *</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.salarioBase}
                    onChange={(e) => ff("salarioBase", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Carga horária (h/semana)</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={form.cargaHoraria}
                    onChange={(e) => ff("cargaHoraria", e.target.value)}
                  />
                </div>
              </div>
              <div className="field">
                <label>Data de admissão</label>
                <input
                  className="input"
                  type="date"
                  value={form.dataAdmissao}
                  onChange={(e) => ff("dataAdmissao", e.target.value)}
                />
              </div>
              {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn" type="button" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button className="btn accent" type="submit" disabled={saving}>
                {saving ? "salvando…" : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
