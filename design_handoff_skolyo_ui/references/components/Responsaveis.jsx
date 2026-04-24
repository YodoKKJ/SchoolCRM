// Responsáveis - vinculação de FinPessoa (responsável financeiro) a alunos
const RESP_PESSOAS = [
  { id: 1, nome: 'Clara Badeschi', cpf: '321.554.890-11', tel: '(11) 98765-1234', email: 'clara.badeschi@email.com', profissao: 'Médica' },
  { id: 2, nome: 'Roberto Badeschi', cpf: '445.887.220-33', tel: '(11) 98012-4455', email: 'roberto.bad@email.com', profissao: 'Engenheiro' },
  { id: 3, nome: 'Sandra Pardolfo', cpf: '112.330.887-22', tel: '(11) 98012-9988', email: 'sandra.p@email.com', profissao: 'Arquiteta' },
  { id: 4, nome: 'Laura Martins', cpf: '778.442.119-55', tel: '(11) 99112-4545', email: 'laura.m@email.com', profissao: 'Advogada' },
  { id: 5, nome: 'Paulo Martins', cpf: '220.556.887-11', tel: '(11) 99112-7070', email: 'paulo.m@email.com', profissao: 'Empresário' },
  { id: 6, nome: 'Beatriz Teodoro', cpf: '887.220.331-22', tel: '(11) 97221-3030', email: 'bia.teodoro@email.com', profissao: 'Professora' },
  { id: 7, nome: 'Patrícia Coelho', cpf: '556.887.220-44', tel: '(11) 98877-5566', email: 'patricia.c@email.com', profissao: 'Dentista' },
  { id: 8, nome: 'Eduardo Coelho', cpf: '443.112.887-55', tel: '(11) 98877-1199', email: 'eduardo.c@email.com', profissao: 'Contador' },
];

const RESP_VINCULOS = {
  1: [
    { id: 101, pessoaId: 1, tipo: 'PRINCIPAL', parentesco: 'MAE' },
    { id: 102, pessoaId: 2, tipo: 'SECUNDARIO', parentesco: 'PAI' },
  ],
  2: [
    { id: 103, pessoaId: 3, tipo: 'PRINCIPAL', parentesco: 'MAE' },
  ],
  3: [
    { id: 104, pessoaId: 4, tipo: 'PRINCIPAL', parentesco: 'MAE' },
    { id: 105, pessoaId: 5, tipo: 'SECUNDARIO', parentesco: 'PAI' },
  ],
  4: [
    { id: 106, pessoaId: 6, tipo: 'PRINCIPAL', parentesco: 'MAE' },
  ],
  5: [
    { id: 107, pessoaId: 7, tipo: 'PRINCIPAL', parentesco: 'MAE' },
    { id: 108, pessoaId: 8, tipo: 'SECUNDARIO', parentesco: 'PAI' },
  ],
};

const RESP_ALUNOS_SEL = [
  { id: 1, nome: 'Bruno Badeschi', rm: '2026.0001', c: 'c1', turma: '3ª Série EM — A' },
  { id: 2, nome: 'Felipe Pardolfo', rm: '2026.0002', c: 'c2', turma: '3ª Série EM — A' },
  { id: 3, nome: 'Helena Martins', rm: '2026.0003', c: 'c3', turma: '3ª Série EM — A' },
  { id: 4, nome: 'Lucas Teodoro', rm: '2026.0004', c: 'c4', turma: '3ª Série EM — A' },
  { id: 5, nome: 'Mariana Coelho', rm: '2025.0087', c: 'c5', turma: '2ª Série EM — B' },
  { id: 6, nome: 'Pedro Altavilla', rm: '2025.0102', c: 'c6', turma: '2ª Série EM — A' },
  { id: 7, nome: 'Sofia Monteiro', rm: '2024.0213', c: 'c7', turma: '1ª Série EM — A' },
  { id: 8, nome: 'Victor Vilanova', rm: '2026.0008', c: 'c8', turma: '3ª Série EM — A' },
];

const PARENTESCOS = {
  PAI: 'Pai', MAE: 'Mãe', AVO: 'Avô(ó)', TIO: 'Tio(a)', RESPONSAVEL: 'Responsável', OUTRO: 'Outro'
};
const TIPO_COLORS = {
  PRINCIPAL: { fg: 'var(--ok)', bg: 'rgba(47, 127, 94, 0.08)', border: 'rgba(47, 127, 94, 0.25)' },
  SECUNDARIO: { fg: '#3F6FB0', bg: 'rgba(63, 111, 176, 0.08)', border: 'rgba(63, 111, 176, 0.25)' },
};

const Responsaveis = () => {
  const [alunoId, setAlunoId] = React.useState(null);
  const [alunoModal, setAlunoModal] = React.useState(false);
  const [vincModal, setVincModal] = React.useState(false);
  const [editVinc, setEditVinc] = React.useState(null);
  const [novaPessoaModal, setNovaPessoaModal] = React.useState(false);
  const [busca, setBusca] = React.useState('');

  const alunoSel = RESP_ALUNOS_SEL.find(a => a.id === alunoId);
  const vincs = alunoId ? (RESP_VINCULOS[alunoId] || []) : [];

  // Sem aluno selecionado: mostra overview com contagens
  const totalComResp = Object.keys(RESP_VINCULOS).length;
  const totalSemResp = RESP_ALUNOS_SEL.length - totalComResp;

  const alunosFilt = RESP_ALUNOS_SEL.filter(a =>
    !busca || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.rm.includes(busca)
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Pessoas · Responsáveis</div>
          <h1 className="page-title">Responsáveis financeiros</h1>
          <div className="page-subtitle">Vincule até 2 responsáveis por aluno · {RESP_PESSOAS.length} pessoas cadastradas · {totalSemResp} aluno(s) sem responsável</div>
        </div>
        <div className="row">
          <button className="btn" onClick={()=>setNovaPessoaModal(true)}><Icon name="plus"/>Nova pessoa</button>
          <button className="btn accent" disabled={!alunoId} onClick={()=>setVincModal(true)}>
            <Icon name="link"/>Vincular responsável
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Lista de alunos */}
        <aside>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="section-head">
              <span className="t">Alunos</span>
              <span className="s">{RESP_ALUNOS_SEL.length}</span>
            </div>
            <div style={{ padding: 10, borderBottom: '1px solid var(--line)', position: 'relative' }}>
              <input className="input" placeholder="Buscar aluno ou RM…" value={busca} onChange={e=>setBusca(e.target.value)} style={{ paddingLeft: 30, fontSize: 12 }}/>
              <Icon name="search" size={12} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
            </div>
            <div style={{ maxHeight: 560, overflowY: 'auto' }}>
              {alunosFilt.map((a, i) => {
                const qRep = (RESP_VINCULOS[a.id] || []).length;
                const ativa = alunoId === a.id;
                return (
                  <button key={a.id} onClick={()=>setAlunoId(a.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: 0, background: ativa ? 'var(--panel-2)' : 'transparent', borderLeft: ativa ? '2px solid var(--accent)' : '2px solid transparent', borderBottom: i < alunosFilt.length-1 ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span className={`avatar sm ${a.c}`}>{a.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{a.nome}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{a.turma}</div>
                    </div>
                    {qRep === 0 ? (
                      <span style={{ fontSize: 10, color: 'var(--warn)', fontFamily: 'var(--font-mono)' }}>sem resp.</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>{qRep}/2</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Detalhe */}
        <div>
          {!alunoSel ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '80px 40px', textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: 30, background: 'var(--panel-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon name="users" size={24} style={{ color: 'var(--ink-4)' }}/>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 6 }}>Selecione um aluno</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 360, margin: '0 auto' }}>
                  Escolha um aluno na lista ao lado para ver e gerenciar seus responsáveis financeiros.
                </div>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', padding: 20, background: 'var(--panel-2)' }}>
                <div className="card-eyebrow" style={{ marginBottom: 10 }}>Panorama</div>
                <div className="grid g-3">
                  <OverviewCard label="Alunos com responsável" value={totalComResp} total={RESP_ALUNOS_SEL.length} tone="ok"/>
                  <OverviewCard label="Sem responsável vinculado" value={totalSemResp} total={RESP_ALUNOS_SEL.length} tone="warn"/>
                  <OverviewCard label="Pessoas cadastradas" value={RESP_PESSOAS.length} tone="default"/>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Cabeçalho do aluno */}
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--line)', background: 'var(--panel-2)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span className={`avatar ${alunoSel.c}`} style={{ width: 52, height: 52, fontSize: 16 }}>{alunoSel.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                  <div style={{ flex: 1 }}>
                    <div className="page-eyebrow" style={{ marginBottom: 2 }}>Aluno</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.1 }}>{alunoSel.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>RM {alunoSel.rm} · {alunoSel.turma}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="page-eyebrow">Responsáveis</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: vincs.length === 0 ? 'var(--warn)' : 'var(--ok)' }}>{vincs.length}<span style={{ fontSize: 16, color: 'var(--ink-4)' }}>/2</span></div>
                  </div>
                </div>

                {vincs.length === 0 ? (
                  <div style={{ padding: '60px 30px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 14 }}>Nenhum responsável vinculado a este aluno.</div>
                    <button className="btn accent" onClick={()=>setVincModal(true)}><Icon name="plus"/>Vincular primeiro responsável</button>
                  </div>
                ) : (
                  <div style={{ padding: 20, display: 'grid', gap: 12 }}>
                    {vincs.map(v => {
                      const p = RESP_PESSOAS.find(x => x.id === v.pessoaId);
                      if (!p) return null;
                      const c = TIPO_COLORS[v.tipo];
                      return (
                        <div key={v.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 16, background: 'var(--panel)' }}>
                          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
                            <span className={`avatar sm c${(p.id % 8) + 1}`} style={{ width: 44, height: 44, fontSize: 13 }}>{p.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                            <div style={{ flex: 1 }}>
                              <div className="row" style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
                                <div className="strong" style={{ fontSize: 14 }}>{p.nome}</div>
                                <span className="chip" style={{ background: c.bg, color: c.fg, borderColor: c.border, fontSize: 10 }}>
                                  <span className="dot" style={{ background: c.fg }}/>{v.tipo === 'PRINCIPAL' ? 'Principal' : 'Secundário'}
                                </span>
                                <span className="chip" style={{ fontSize: 10 }}>{PARENTESCOS[v.parentesco]}</span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11.5, color: 'var(--ink-2)', marginTop: 8 }}>
                                <div className="row" style={{ gap: 6 }}><Icon name="user" size={12} style={{ color: 'var(--ink-4)' }}/><span className="mono" style={{ fontSize: 11 }}>{p.cpf}</span></div>
                                <div className="row" style={{ gap: 6 }}><Icon name="phone" size={12} style={{ color: 'var(--ink-4)' }}/><span className="mono" style={{ fontSize: 11 }}>{p.tel}</span></div>
                                <div className="row" style={{ gap: 6 }}><Icon name="mail" size={12} style={{ color: 'var(--ink-4)' }}/><span style={{ fontSize: 11 }}>{p.email}</span></div>
                                <div className="row" style={{ gap: 6 }}><Icon name="briefcase" size={12} style={{ color: 'var(--ink-4)' }}/><span style={{ fontSize: 11 }}>{p.profissao}</span></div>
                              </div>
                            </div>
                            <div className="row" style={{ gap: 4 }}>
                              <button className="icon-btn sm" title="Editar vínculo" onClick={()=>setEditVinc({ ...v, pessoa: p })}><Icon name="edit" size={13}/></button>
                              <button className="icon-btn sm" title="Remover"><Icon name="x" size={13}/></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {vincs.length < 2 && (
                      <button onClick={()=>setVincModal(true)} style={{ border: '1px dashed var(--line)', borderRadius: 10, padding: '18px', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                        <Icon name="plus" size={14}/>Vincular segundo responsável
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Info lateral */}
              <div className="card" style={{ padding: 18 }}>
                <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                  <Icon name="info" size={14} style={{ color: 'var(--ink-3)', marginTop: 2 }}/>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                    Responsáveis financeiros recebem <span className="strong">boletos</span>, <span className="strong">comunicados</span> e podem emitir <span className="strong">2ª via</span> pelo portal. Máximo de <span className="strong">2 por aluno</span>: um Principal (obrigatório para emissão de contrato) e um Secundário opcional.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {vincModal && <VincularModal alunoSel={alunoSel} vincs={vincs} onClose={()=>setVincModal(false)} onNovaPessoa={()=>{ setVincModal(false); setNovaPessoaModal(true); }}/>}
      {editVinc && <EditarVincModal vinc={editVinc} onClose={()=>setEditVinc(null)}/>}
      {novaPessoaModal && <NovaPessoaModal onClose={()=>setNovaPessoaModal(false)}/>}
    </div>
  );
};

const OverviewCard = ({ label, value, total, tone }) => (
  <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, background: 'var(--panel)' }}>
    <div className="card-eyebrow" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1, color: tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--warn)' : 'var(--ink)' }}>{value}</div>
      {total != null && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>/ {total}</div>}
    </div>
  </div>
);

const VincularModal = ({ alunoSel, vincs, onClose, onNovaPessoa }) => {
  const jaVinculadas = new Set(vincs.map(v => v.pessoaId));
  const [busca, setBusca] = React.useState('');
  const [pessoaSel, setPessoaSel] = React.useState(null);
  const [tipo, setTipo] = React.useState(vincs.length === 0 ? 'PRINCIPAL' : 'SECUNDARIO');
  const [parentesco, setParentesco] = React.useState('MAE');
  const temPrincipal = vincs.some(v => v.tipo === 'PRINCIPAL');

  const filt = RESP_PESSOAS.filter(p => !jaVinculadas.has(p.id) && (
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cpf.includes(busca)
  ));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 680 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Vincular responsável</div>
            <div className="modal-title">{alunoSel?.nome}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{alunoSel?.turma} · {vincs.length}/2 vinculados</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input className="input" placeholder="Buscar pessoa por nome ou CPF…" value={busca} onChange={e=>setBusca(e.target.value)} style={{ paddingLeft: 32 }} autoFocus/>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
            </div>
            <button className="btn" onClick={onNovaPessoa}><Icon name="plus" size={12}/>Nova pessoa</button>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filt.map((p, i) => {
              const ativa = pessoaSel?.id === p.id;
              return (
                <button key={p.id} onClick={()=>setPessoaSel(p)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', border: 0, background: ativa ? 'var(--accent-soft)' : 'transparent', borderBottom: i < filt.length-1 ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span className={`avatar sm c${(p.id % 8) + 1}`}>{p.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: ativa ? 500 : 400, color: ativa ? 'var(--accent-ink)' : 'var(--ink)' }}>{p.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{p.cpf} · {p.tel}</div>
                  </div>
                  {ativa && <Icon name="check" size={14} style={{ color: 'var(--accent-ink)' }}/>}
                </button>
              );
            })}
            {filt.length === 0 && (
              <div className="empty" style={{ margin: 20 }}>
                <div className="t">Nenhuma pessoa encontrada</div>
                <div className="s">crie uma nova em "Nova pessoa"</div>
              </div>
            )}
          </div>
          <div style={{ padding: 22, borderTop: '1px solid var(--line)', background: 'var(--panel-2)' }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>Tipo e parentesco</div>
            <div className="form-grid">
              <FieldL label="Tipo">
                <div className="row" style={{ gap: 4 }}>
                  <button className={`chip-btn ${tipo === 'PRINCIPAL' ? 'on' : ''}`} onClick={()=>setTipo('PRINCIPAL')} disabled={temPrincipal && vincs.length > 0} style={{ flex: 1 }}>Principal</button>
                  <button className={`chip-btn ${tipo === 'SECUNDARIO' ? 'on' : ''}`} onClick={()=>setTipo('SECUNDARIO')} style={{ flex: 1 }}>Secundário</button>
                </div>
              </FieldL>
              <FieldL label="Parentesco">
                <select className="select" value={parentesco} onChange={e=>setParentesco(e.target.value)}>
                  {Object.entries(PARENTESCOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FieldL>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            {pessoaSel ? <>Vinculando <span className="strong" style={{ color: 'var(--ink)' }}>{pessoaSel.nome}</span> como <span className="strong" style={{ color: 'var(--ink)' }}>{tipo === 'PRINCIPAL' ? 'principal' : 'secundário'}</span></> : 'Selecione uma pessoa acima'}
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn accent" disabled={!pessoaSel}><Icon name="link"/>Vincular</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditarVincModal = ({ vinc, onClose }) => {
  const [tipo, setTipo] = React.useState(vinc.tipo);
  const [parentesco, setParentesco] = React.useState(vinc.parentesco);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Editar vínculo</div>
            <div className="modal-title">{vinc.pessoa.nome}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{vinc.pessoa.cpf}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <FieldL label="Tipo">
              <div className="row" style={{ gap: 4 }}>
                <button className={`chip-btn ${tipo === 'PRINCIPAL' ? 'on' : ''}`} onClick={()=>setTipo('PRINCIPAL')} style={{ flex: 1 }}>Principal</button>
                <button className={`chip-btn ${tipo === 'SECUNDARIO' ? 'on' : ''}`} onClick={()=>setTipo('SECUNDARIO')} style={{ flex: 1 }}>Secundário</button>
              </div>
            </FieldL>
            <FieldL label="Parentesco">
              <select className="select" value={parentesco} onChange={e=>setParentesco(e.target.value)}>
                {Object.entries(PARENTESCOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FieldL>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" style={{ color: 'var(--bad)' }}><Icon name="x" size={12}/>Remover vínculo</button>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn accent"><Icon name="check"/>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NovaPessoaModal = ({ onClose }) => {
  const [form, setForm] = React.useState({ nome: '', cpf: '', tel: '', email: '', profissao: '' });
  const upd = (k, v) => setForm(s => ({ ...s, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 580 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Nova pessoa</div>
            <div className="modal-title">Cadastrar responsável</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>pessoa física vinculada ao financeiro</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <FieldL label="Nome completo" span={2}><input className="input" placeholder="Ex: Clara Badeschi" value={form.nome} onChange={e=>upd('nome', e.target.value)}/></FieldL>
            <FieldL label="CPF"><input className="input mono" placeholder="000.000.000-00" value={form.cpf} onChange={e=>upd('cpf', e.target.value)}/></FieldL>
            <FieldL label="Telefone"><input className="input mono" placeholder="(11) 98765-4321" value={form.tel} onChange={e=>upd('tel', e.target.value)}/></FieldL>
            <FieldL label="E-mail" span={2}><input className="input" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e=>upd('email', e.target.value)}/></FieldL>
            <FieldL label="Profissão" span={2}><input className="input" placeholder="Ex: Médica" value={form.profissao} onChange={e=>upd('profissao', e.target.value)}/></FieldL>
          </div>
        </div>
        <div className="modal-footer">
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Após salvar, você poderá vincular esta pessoa a um aluno.</div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn accent"><Icon name="check"/>Criar pessoa</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Responsaveis });
