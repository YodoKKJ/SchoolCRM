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
function fmtCpfCnpj(doc, tipo) {
  if (!doc) return "—";
  const d = String(doc).replace(/\D/g, "");
  if (tipo === "JURIDICA" && d.length === 14) {
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  if (d.length === 11) {
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return doc;
}
function fmtPhone(p) {
  if (!p) return "—";
  const d = String(p).replace(/\D/g, "");
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return p;
}

export default function Pessoas() {
  const [loading, setLoading] = useState(true);
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS"); // TODOS | FISICA | JURIDICA
  const [filtroAtivo, setFiltroAtivo] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(null); // { mode: "new" } | { mode: "edit", p } | { mode: "del", p }
  const [drawer, setDrawer] = useState(null); // pessoa selecionada

  const load = () => {
    setLoading(true);
    setErro("");
    api
      .get("/fin/pessoas")
      .then((r) => setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => setErro("Não foi possível carregar as pessoas."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter((p) => {
      if (filtroTipo !== "TODOS" && p.tipoPessoa !== filtroTipo) return false;
      if (filtroAtivo && p.ativo === false) return false;
      if (!q) return true;
      const hay = `${p.nome || ""} ${p.cpf || ""} ${p.cnpj || ""} ${p.email || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [lista, busca, filtroTipo, filtroAtivo]);

  const counts = useMemo(() => {
    const fisica = lista.filter((p) => p.tipoPessoa === "FISICA").length;
    const juridica = lista.filter((p) => p.tipoPessoa === "JURIDICA").length;
    return { total: lista.length, fisica, juridica };
  }, [lista]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Financeiro · Cadastro</div>
          <h1 className="page-title">Pessoas</h1>
          <div className="page-subtitle">
            {loading
              ? "carregando…"
              : `${counts.total} pessoas — ${counts.fisica} físicas, ${counts.juridica} jurídicas`}
          </div>
        </div>
        <div className="row">
          <button className="btn accent" type="button" onClick={() => setModal({ mode: "new" })}>
            <Icon name="plus" /> Nova pessoa
          </button>
        </div>
      </div>

      {erro && (
        <div className="card mb-4" style={{ borderColor: "var(--bad)" }}>
          <div style={{ color: "var(--bad)", fontSize: 13 }}>{erro}</div>
        </div>
      )}

      <div className="filter-row">
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
              placeholder="Buscar por nome, CPF, CNPJ ou e-mail…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {[
            { id: "TODOS", label: "Todos" },
            { id: "FISICA", label: "Pessoa física" },
            { id: "JURIDICA", label: "Pessoa jurídica" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${filtroTipo === t.id ? "active" : ""}`}
              onClick={() => setFiltroTipo(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="row" style={{ gap: 6, fontSize: 12, color: "var(--ink-2)" }}>
          <input
            type="checkbox"
            checked={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.checked)}
          />
          Apenas ativos
        </label>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Nome</th>
              <th style={{ width: 90 }}>Tipo</th>
              <th style={{ width: 160 }}>Documento</th>
              <th style={{ width: 200 }}>E-mail</th>
              <th style={{ width: 140 }}>Telefone</th>
              <th style={{ width: 80 }}>Status</th>
              <th style={{ width: 110, textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
                  {busca || filtroTipo !== "TODOS"
                    ? "Nenhuma pessoa bate com os filtros."
                    : "Nenhuma pessoa cadastrada."}
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="row-link" onClick={() => setDrawer(p)}>
                <td>
                  <span className={`avatar ${avatarColor(p.id)}`}>{iniciais(p.nome)}</span>
                </td>
                <td>
                  <span className="strong">{p.nome}</span>
                  {p.cidade && (
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      {p.cidade}
                      {p.estado ? ` / ${p.estado}` : ""}
                    </div>
                  )}
                </td>
                <td>
                  <span className="pill" style={{ fontSize: 10 }}>
                    {p.tipoPessoa === "JURIDICA" ? "PJ" : "PF"}
                  </span>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {fmtCpfCnpj(p.tipoPessoa === "JURIDICA" ? p.cnpj : p.cpf, p.tipoPessoa)}
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.email || "—"}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtPhone(p.telefone)}</td>
                <td>
                  {p.ativo === false ? (
                    <span className="pill" style={{ background: "var(--bad)", color: "#fff", fontSize: 10 }}>
                      INATIVO
                    </span>
                  ) : (
                    <span className="pill" style={{ background: "var(--ok)", color: "#fff", fontSize: 10 }}>
                      ATIVO
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn sm" type="button" onClick={() => setModal({ mode: "edit", p })}>
                    <Icon name="edit" size={11} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && <PessoaDrawer pessoa={drawer} onClose={() => setDrawer(null)} onChanged={load} />}

      {modal?.mode === "new" && (
        <PessoaModal
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      {modal?.mode === "edit" && (
        <PessoaModal
          pessoa={modal.p}
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

// ────────────────────────────────────────────────────────────────────────────────
// Drawer — visualização da pessoa, com os alunos vinculados (se for responsável)
// ────────────────────────────────────────────────────────────────────────────────

function PessoaDrawer({ pessoa, onClose, onChanged }) {
  const [vinculos, setVinculos] = useState(null); // alunos sob responsabilidade desta pessoa
  const [erro, setErro] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Para descobrir quais alunos esta pessoa é responsável precisamos varrer.
  // Backend só expõe /aluno/{alunoId} → recolhemos no painel "Vínculos" via endpoint genérico.
  // Como não há endpoint reverso, deixamos vazio + dica.
  // (Se um dia o backend expor /fin/responsaveis/pessoa/{pessoaId} — só preencher aqui.)
  useEffect(() => {
    setVinculos([]);
  }, [pessoa.id]);

  const toggleStatus = async () => {
    setErro("");
    try {
      await api.patch(`/fin/pessoas/${pessoa.id}/status`);
      onChanged();
      onClose();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao atualizar status.");
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="row" style={{ gap: 12, alignItems: "center" }}>
            <span className={`avatar lg ${avatarColor(pessoa.id)}`}>{iniciais(pessoa.nome)}</span>
            <div>
              <div className="card-eyebrow">{pessoa.tipoPessoa === "JURIDICA" ? "Pessoa jurídica" : "Pessoa física"}</div>
              <div className="modal-title">{pessoa.nome}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                {fmtCpfCnpj(pessoa.tipoPessoa === "JURIDICA" ? pessoa.cnpj : pessoa.cpf, pessoa.tipoPessoa)}
              </div>
            </div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="drawer-body">
          <FichaSec titulo="Contato">
            <FichaRow label="E-mail" value={pessoa.email || "—"} />
            <FichaRow label="Telefone" value={fmtPhone(pessoa.telefone)} />
          </FichaSec>

          <FichaSec titulo="Endereço">
            <FichaRow label="Logradouro" value={pessoa.endereco || "—"} />
            <FichaRow label="CEP" value={pessoa.cep || "—"} />
            <FichaRow label="Cidade / UF" value={[pessoa.cidade, pessoa.estado].filter(Boolean).join(" / ") || "—"} />
          </FichaSec>

          {pessoa.observacoes && (
            <FichaSec titulo="Observações">
              <div style={{ fontSize: 12, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>
                {pessoa.observacoes}
              </div>
            </FichaSec>
          )}

          {pessoa.usuarioId && (
            <FichaSec titulo="Vínculo de sistema">
              <FichaRow label="Login" value={pessoa.usuarioLogin || "—"} />
              <FichaRow label="Papel" value={pessoa.usuarioRole || "—"} />
            </FichaSec>
          )}

          {vinculos && vinculos.length > 0 && (
            <FichaSec titulo="Alunos sob responsabilidade">
              {vinculos.map((v) => (
                <div key={v.id} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 13 }}>{v.alunoNome}</span>
                  <span className="pill" style={{ fontSize: 10 }}>{v.tipo}</span>
                </div>
              ))}
            </FichaSec>
          )}
        </div>

        <div className="drawer-footer">
          {erro && <div style={{ color: "var(--bad)", fontSize: 12, marginBottom: 8 }}>{erro}</div>}
          <div className="row" style={{ justifyContent: "space-between" }}>
            <button
              className="btn"
              type="button"
              onClick={toggleStatus}
              style={{
                color: pessoa.ativo === false ? "var(--ok)" : "var(--bad)",
              }}
            >
              {pessoa.ativo === false ? "Ativar" : "Desativar"}
            </button>
            <button className="btn" type="button" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function FichaSec({ titulo, children }) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div className="card-eyebrow" style={{ marginBottom: 6 }}>{titulo}</div>
      <div className="card" style={{ padding: 12 }}>{children}</div>
    </section>
  );
}

function FichaRow({ label, value }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
      <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{label}</span>
      <span style={{ color: "var(--ink)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Modal de criar/editar
// ────────────────────────────────────────────────────────────────────────────────

function PessoaModal({ pessoa, onClose, onSaved }) {
  const isEdit = !!pessoa;
  const [form, setForm] = useState({
    tipoPessoa: pessoa?.tipoPessoa || "FISICA",
    nome: pessoa?.nome || "",
    cpf: pessoa?.cpf || "",
    cnpj: pessoa?.cnpj || "",
    email: pessoa?.email || "",
    telefone: pessoa?.telefone || "",
    endereco: pessoa?.endereco || "",
    cep: pessoa?.cep || "",
    cidade: pessoa?.cidade || "",
    estado: pessoa?.estado || "",
    observacoes: pessoa?.observacoes || "",
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErro("");
    if (!form.nome.trim()) {
      setErro("Informe o nome.");
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, nome: form.nome.trim() };
      if (form.tipoPessoa === "FISICA") body.cnpj = null;
      else body.cpf = null;
      if (isEdit) await api.put(`/fin/pessoas/${pessoa.id}`, body);
      else await api.post("/fin/pessoas", body);
      onSaved();
    } catch (err) {
      setErro(typeof err.response?.data === "string" ? err.response.data : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} style={{ width: 640 }}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{isEdit ? "Editar pessoa" : "Nova pessoa"}</div>
            <div className="modal-title">{isEdit ? pessoa.nome : "Cadastrar nova pessoa"}</div>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>

        <div className="modal-body" style={{ display: "grid", gap: 12 }}>
          <div className="row" style={{ gap: 8 }}>
            {[
              { id: "FISICA", label: "Pessoa física" },
              { id: "JURIDICA", label: "Pessoa jurídica" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip ${form.tipoPessoa === t.id ? "active" : ""}`}
                onClick={() => set("tipoPessoa", t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="field">
            <label>Nome {form.tipoPessoa === "JURIDICA" ? "/ Razão social" : "completo"}</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
              autoFocus
            />
          </div>

          <div className="row" style={{ gap: 12 }}>
            {form.tipoPessoa === "FISICA" ? (
              <div className="field" style={{ flex: 1 }}>
                <label>CPF</label>
                <input
                  className="input"
                  value={form.cpf}
                  onChange={(e) => set("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            ) : (
              <div className="field" style={{ flex: 1 }}>
                <label>CNPJ</label>
                <input
                  className="input"
                  value={form.cnpj}
                  onChange={(e) => set("cnpj", e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            )}
            <div className="field" style={{ flex: 1 }}>
              <label>Telefone</label>
              <input
                className="input"
                value={form.telefone}
                onChange={(e) => set("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="field">
            <label>E-mail</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 2 }}>
              <label>Endereço</label>
              <input
                className="input"
                value={form.endereco}
                onChange={(e) => set("endereco", e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>CEP</label>
              <input
                className="input"
                value={form.cep}
                onChange={(e) => set("cep", e.target.value)}
              />
            </div>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <div className="field" style={{ flex: 2 }}>
              <label>Cidade</label>
              <input
                className="input"
                value={form.cidade}
                onChange={(e) => set("cidade", e.target.value)}
              />
            </div>
            <div className="field" style={{ width: 80 }}>
              <label>UF</label>
              <input
                className="input"
                value={form.estado}
                onChange={(e) => set("estado", e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
              />
            </div>
          </div>

          <div className="field">
            <label>Observações</label>
            <textarea
              className="input"
              rows={3}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </div>

          {erro && <div style={{ color: "var(--bad)", fontSize: 12 }}>{erro}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn accent" type="submit" disabled={saving}>
            {saving ? "salvando…" : isEdit ? "Salvar alterações" : "Criar pessoa"}
          </button>
        </div>
      </form>
    </div>
  );
}
