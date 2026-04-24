// Boletins - gerar e enviar via WhatsApp
const BOL_ALUNOS_SEL = [
  { id: 1, nome: 'Bruno Badeschi', rm: '2026.0001', c: 'c1', turma: '3ª Série EM — A' },
  { id: 2, nome: 'Felipe Pardolfo', rm: '2026.0002', c: 'c2', turma: '3ª Série EM — A' },
  { id: 3, nome: 'Helena Martins', rm: '2026.0003', c: 'c3', turma: '3ª Série EM — A' },
  { id: 4, nome: 'Lucas Teodoro', rm: '2026.0004', c: 'c4', turma: '3ª Série EM — A' },
  { id: 5, nome: 'Mariana Coelho', rm: '2026.0005', c: 'c5', turma: '2ª Série EM — B' },
  { id: 6, nome: 'Pedro Altavilla', rm: '2026.0006', c: 'c6', turma: '2ª Série EM — A' },
  { id: 7, nome: 'Sofia Monteiro', rm: '2026.0007', c: 'c7', turma: '1ª Série EM — A' },
  { id: 8, nome: 'Victor Vilanova', rm: '2026.0008', c: 'c8', turma: '3ª Série EM — A' },
];

const BOL_TURMAS_SEL = [
  '1ª Série EM — A', '1ª Série EM — B',
  '2ª Série EM — A', '2ª Série EM — B',
  '3ª Série EM — A', '3ª Série EM — B',
  '9º Ano EF — A', '9º Ano EF — B',
];

const Boletins = () => {
  const [modoLote, setModoLote] = React.useState(false);
  const [alunoId, setAlunoId] = React.useState('');
  const [turmaId, setTurmaId] = React.useState('');
  const [bimestre, setBimestre] = React.useState('2');
  const [wppTurma, setWppTurma] = React.useState('');
  const [wppBim, setWppBim] = React.useState('2');
  const [wppMsg, setWppMsg] = React.useState('Boletim escolar de *{nome}* — {bimestre}');

  const [alunoModal, setAlunoModal] = React.useState(false);
  const [turmaModal, setTurmaModal] = React.useState(null); // 'gerar' | 'wpp'

  const alunoSel = BOL_ALUNOS_SEL.find(a => String(a.id) === alunoId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Boletins</div>
          <h1 className="page-title">Gerar e enviar boletins</h1>
          <div className="page-subtitle">Emita boletim individual ou em lote · envie aos responsáveis via WhatsApp</div>
        </div>
      </div>

      {/* GERAR BOLETIM */}
      <div className="card" style={{ padding: 0, marginBottom: 20, overflow: 'hidden' }}>
        <div className="section-head">
          <div>
            <div className="t">Gerar boletim</div>
            <div className="s">PDF gerado pelo servidor · baixado automaticamente</div>
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--bg-2)', borderRadius: 6, padding: 3, border: '1px solid var(--line)' }}>
            <button className="btn sm" onClick={()=>setModoLote(false)} style={{ background: !modoLote ? 'var(--panel)' : 'transparent', border: 0, boxShadow: !modoLote ? 'var(--shadow)' : 'none' }}>Individual</button>
            <button className="btn sm" onClick={()=>setModoLote(true)} style={{ background: modoLote ? 'var(--panel)' : 'transparent', border: 0, boxShadow: modoLote ? 'var(--shadow)' : 'none' }}>Turma inteira</button>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          {modoLote ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'end' }}>
              <FieldB label="Turma">
                <button className="input" onClick={()=>setTurmaModal('gerar')} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)' }}>
                  <span style={{ color: turmaId ? 'var(--ink)' : 'var(--ink-4)' }}>{turmaId || 'Selecionar turma…'}</span>
                  <Icon name="chev" size={12}/>
                </button>
              </FieldB>
              <FieldB label="Bimestre">
                <select className="select" value={bimestre} onChange={e=>setBimestre(e.target.value)}>
                  <option value="0">Anual (todos)</option>
                  <option value="1">1º bimestre</option>
                  <option value="2">2º bimestre</option>
                  <option value="3">3º bimestre</option>
                  <option value="4">4º bimestre</option>
                </select>
              </FieldB>
              <button className="btn accent" disabled={!turmaId} style={{ height: 38 }}><Icon name="download"/>Baixar ZIP</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto auto', gap: 14, alignItems: 'end' }}>
              <FieldB label="Aluno">
                <button className="input" onClick={()=>setAlunoModal(true)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)' }}>
                  {alunoSel ? (
                    <span className="row" style={{ gap: 8 }}>
                      <span className={`avatar sm ${alunoSel.c}`}>{alunoSel.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                      <span>{alunoSel.nome}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>RM {alunoSel.rm}</span>
                    </span>
                  ) : <span style={{ color: 'var(--ink-4)' }}>Selecionar aluno…</span>}
                  <Icon name="chev" size={12}/>
                </button>
              </FieldB>
              <FieldB label="Turma">
                <button className="input" onClick={()=>setTurmaModal('gerar')} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)' }}>
                  <span style={{ color: turmaId ? 'var(--ink)' : 'var(--ink-4)' }}>{turmaId || (alunoSel?.turma || 'Selecionar turma…')}</span>
                  <Icon name="chev" size={12}/>
                </button>
              </FieldB>
              <FieldB label="Bimestre">
                <select className="select" value={bimestre} onChange={e=>setBimestre(e.target.value)} style={{ minWidth: 140 }}>
                  <option value="0">Anual</option>
                  <option value="1">1º bim</option>
                  <option value="2">2º bim</option>
                  <option value="3">3º bim</option>
                  <option value="4">4º bim</option>
                </select>
              </FieldB>
              <button className="btn accent" disabled={!alunoId} style={{ height: 38 }}><Icon name="download"/>Baixar PDF</button>
            </div>
          )}
          <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="info" size={13}/>
            {modoLote ? 'Gera um .zip com o boletim PDF de cada aluno da turma.' : 'O PDF será gerado pelo servidor e baixado automaticamente.'}
          </div>
        </div>
      </div>

      {/* ENVIAR WHATSAPP */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="section-head">
          <div>
            <div className="t">Enviar boletins via WhatsApp</div>
            <div className="s">Envia o PDF do boletim para o aluno e responsáveis cadastrados</div>
          </div>
          <span className="chip"><span style={{ width: 6, height: 6, borderRadius: 3, background: '#25D366' }}/>WhatsApp conectado</span>
        </div>
        <div style={{ padding: 22 }}>
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <FieldB label="Turma">
              <button className="input" onClick={()=>setTurmaModal('wpp')} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)' }}>
                <span style={{ color: wppTurma ? 'var(--ink)' : 'var(--ink-4)' }}>{wppTurma || 'Selecionar turma…'}</span>
                <Icon name="chev" size={12}/>
              </button>
            </FieldB>
            <FieldB label="Bimestre">
              <select className="select" value={wppBim} onChange={e=>setWppBim(e.target.value)}>
                <option value="0">Anual (todos)</option>
                <option value="1">1º bimestre</option>
                <option value="2">2º bimestre</option>
                <option value="3">3º bimestre</option>
                <option value="4">4º bimestre</option>
              </select>
            </FieldB>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>Mensagem</label>
            <textarea className="input" rows={2} value={wppMsg} onChange={e=>setWppMsg(e.target.value)} placeholder="Boletim escolar de *{nome}* — {bimestre}"/>
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
              Variáveis: <span style={{ color: 'var(--accent-ink)' }}>{'{nome}'}</span> · <span style={{ color: 'var(--accent-ink)' }}>{'{bimestre}'}</span> · <span style={{ color: 'var(--accent-ink)' }}>{'{turma}'}</span> · <span style={{ color: 'var(--accent-ink)' }}>{'{escola}'}</span>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="info" size={13}/>
              Serão enviadas mensagens para <span className="strong" style={{ color: 'var(--ink)' }}>{wppTurma ? '~28 responsáveis' : '0 responsáveis'}</span>.
            </div>
            <button className="btn accent" disabled={!wppTurma} style={{ background: '#25D366', borderColor: '#25D366' }}>
              <Icon name="whatsapp"/>Enviar via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {alunoModal && (
        <AlunoSelectModal
          current={alunoId}
          onPick={(a)=>{ setAlunoId(String(a.id)); setTurmaId(a.turma); setAlunoModal(false); }}
          onClose={()=>setAlunoModal(false)}/>
      )}
      {turmaModal && (
        <TurmaSelectModalB
          current={turmaModal === 'gerar' ? turmaId : wppTurma}
          onPick={(t)=>{
            if (turmaModal === 'gerar') setTurmaId(t);
            else setWppTurma(t);
            setTurmaModal(null);
          }}
          onClose={()=>setTurmaModal(null)}/>
      )}
    </div>
  );
};

const FieldB = ({ label, children }) => (
  <div>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const AlunoSelectModal = ({ current, onPick, onClose }) => {
  const [busca, setBusca] = React.useState('');
  const filt = BOL_ALUNOS_SEL.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()) || a.rm.includes(busca));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 600 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Selecionar aluno</div>
            <div className="modal-title">Escolha o aluno</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{BOL_ALUNOS_SEL.length} alunos matriculados</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', position: 'relative' }}>
            <input className="input" placeholder="Buscar por nome ou RM…" value={busca} onChange={e=>setBusca(e.target.value)} style={{ paddingLeft: 32 }} autoFocus/>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {filt.map((a, i) => {
              const ativa = String(a.id) === current;
              return (
                <button key={a.id} onClick={()=>onPick(a)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', border: 0, background: ativa ? 'var(--accent-soft)' : 'transparent', borderBottom: i < filt.length-1 ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span className={`avatar sm ${a.c}`}>{a.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: ativa ? 500 : 400, color: ativa ? 'var(--accent-ink)' : 'var(--ink)' }}>{a.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>RM {a.rm} · {a.turma}</div>
                  </div>
                  {ativa && <Icon name="check" size={14} style={{ color: 'var(--accent-ink)' }}/>}
                </button>
              );
            })}
            {filt.length === 0 && (
              <div className="empty" style={{ margin: 20 }}>
                <div className="t">Nenhum aluno encontrado</div>
                <div className="s">refine a busca</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TurmaSelectModalB = ({ current, onPick, onClose }) => {
  const [busca, setBusca] = React.useState('');
  const filt = BOL_TURMAS_SEL.filter(t => t.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Selecionar turma</div>
            <div className="modal-title">Escolha a turma</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', position: 'relative' }}>
            <input className="input" placeholder="Buscar turma…" value={busca} onChange={e=>setBusca(e.target.value)} style={{ paddingLeft: 32 }} autoFocus/>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {filt.map((t, i) => {
              const ativa = t === current;
              return (
                <button key={t} onClick={()=>onPick(t)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px', border: 0, background: ativa ? 'var(--accent-soft)' : 'transparent', borderBottom: i < filt.length-1 ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <Icon name="users" size={14} style={{ color: 'var(--ink-3)' }}/>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: ativa ? 500 : 400, color: ativa ? 'var(--accent-ink)' : 'var(--ink)' }}>{t}</div>
                  {ativa && <Icon name="check" size={14} style={{ color: 'var(--accent-ink)' }}/>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Boletins });
