// Horários - grade semanal com drag-feel
const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const PERIODOS = [
  { i: 1, ini: '07:30', fim: '08:20' },
  { i: 2, ini: '08:20', fim: '09:10' },
  { i: 3, ini: '09:30', fim: '10:20' },
  { i: 4, ini: '10:20', fim: '11:10' },
  { i: 5, ini: '11:10', fim: '12:00' },
];

const GRADE = {
  // [dia][periodo] => materia sigla
  0: ['MAT','MAT','POR','POR','HIS'],
  1: ['FIS','QUI','BIO','MAT','EDF'],
  2: ['POR','POR','GEO','ING','MAT'],
  3: ['QUI','FIS','FIL','SOC','ART'],
  4: ['BIO','BIO','MAT','POR','HIS'],
};
const CORES = { POR:'#C04A3A', MAT:'#3F6FB0', HIS:'#B5832A', GEO:'#2F7F5E', CIE:'#6A4FA6', BIO:'#4FAE85', QUI:'#2C7787', FIS:'#A8473A', ING:'#9C5580', ESP:'#C08A2E', EDF:'#52626F', ART:'#D78A7E', FIL:'#6A4FA6', SOC:'#3F6FB0' };
const NOMES = { POR:'Português', MAT:'Matemática', HIS:'História', GEO:'Geografia', CIE:'Ciências', BIO:'Biologia', QUI:'Química', FIS:'Física', ING:'Inglês', ESP:'Espanhol', EDF:'Ed. Física', ART:'Artes', FIL:'Filosofia', SOC:'Sociologia' };
const PROFS = { POR:'H. Castro', MAT:'P. Xavier', HIS:'M. Lopes', GEO:'D. Prado', BIO:'R. Torres', QUI:'C. Mendes', FIS:'B. Martins', ING:'V. Lima', EDF:'B. Souza', ART:'P. Ribeiro', FIL:'V. Lima', SOC:'M. Lopes' };

const Horarios = () => {
  const [modo, setModo] = React.useState('visualizar');
  const [turma, setTurma] = React.useState('3ª Série EM — A');
  const [slotModal, setSlotModal] = React.useState(null);
  const [turmaModal, setTurmaModal] = React.useState(false);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Horários</div>
          <h1 className="page-title">Grade semanal</h1>
          <div className="page-subtitle">Turma · {turma} · 25 períodos/semana · última alteração há 3 dias</div>
        </div>
        <div className="row">
          <div style={{ display: 'inline-flex', background: 'var(--bg-2)', borderRadius: 6, padding: 3, border: '1px solid var(--line)' }}>
            <button className="btn sm" style={{ background: modo === 'visualizar' ? 'var(--panel)' : 'transparent', border: 0, boxShadow: modo === 'visualizar' ? 'var(--shadow)' : 'none' }} onClick={() => setModo('visualizar')}>Visualizar</button>
            <button className="btn sm" style={{ background: modo === 'editar' ? 'var(--panel)' : 'transparent', border: 0, boxShadow: modo === 'editar' ? 'var(--shadow)' : 'none' }} onClick={() => setModo('editar')}>Editar</button>
          </div>
          <button className="btn"><Icon name="print"/>Imprimir</button>
          <button className="btn accent"><Icon name="save"/>Salvar grade</button>
        </div>
      </div>

      <div className="row" style={{ gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, maxWidth: 320 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>Selecionar turma</label>
          <button className="input" onClick={()=>setTurmaModal(true)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--panel)' }}>
            <span>{turma}</span>
            <Icon name="chev" size={12}/>
          </button>
        </div>
        <div style={{ flex: 1, maxWidth: 260 }}>
          <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>Semana</label>
          <select className="select">
            <option>Semana base (recorrente)</option>
            <option>13 — 17 abril 2026</option>
            <option>20 — 24 abril 2026</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 6 }}>Conflitos</div>
          <div style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--ok-soft)', color: 'var(--ok)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="check"/>Sem sobreposições — grade validada
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', borderBottom: '1px solid var(--line)', background: 'var(--panel-2)' }}>
          <div style={{ padding: 14, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Horário</div>
          {DIAS.map(d => (
            <div key={d} style={{ padding: 14, fontSize: 12.5, fontWeight: 500, borderLeft: '1px solid var(--line)' }}>{d}</div>
          ))}
        </div>
        {PERIODOS.map((p, pi) => (
          <div key={p.i} style={{ display: 'grid', gridTemplateColumns: '110px repeat(5, 1fr)', borderBottom: pi < 4 ? '1px solid var(--line)' : 'none', minHeight: 90 }}>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--line)', background: 'var(--panel-2)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{`0${p.i}º`}</div>
              <div className="num" style={{ fontSize: 13, color: 'var(--ink)', marginTop: 2 }}>{p.ini}</div>
              <div className="num" style={{ fontSize: 10.5, color: 'var(--ink-4)' }}>{p.fim}</div>
            </div>
            {DIAS.map((d, di) => {
              const sig = GRADE[di][pi];
              return (
                <div key={di} style={{ padding: 8, borderLeft: di > 0 ? '1px solid var(--line)' : 'none' }} onClick={()=>modo==='editar' && setSlotModal({ dia: DIAS[di], periodo: p, sig })}>
                  <SlotCard sig={sig} edit={modo === 'editar'}/>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {modo === 'editar' && (
        <div className="mt-6">
          <div className="card-eyebrow" style={{ marginBottom: 10 }}>Biblioteca de matérias — arraste para a grade</div>
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(NOMES).map(k => (
              <div key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 6px', background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, cursor: 'grab' }}>
                <span style={{ width: 22, height: 22, borderRadius: 4, background: CORES[k], color: 'white', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 12 }}>{NOMES[k]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {slotModal && <SlotModal {...slotModal} turma={turma} onClose={()=>setSlotModal(null)}/>}
      {turmaModal && <TurmaSelectModal current={turma} onPick={(t)=>{setTurma(t); setTurmaModal(false);}} onClose={()=>setTurmaModal(false)}/>}
    </div>
  );
};

const TURMAS_LIST = [
  { nome: '6º Ano EF — A', turno: 'Manhã', alunos: 28, c: 'c1' },
  { nome: '6º Ano EF — B', turno: 'Manhã', alunos: 26, c: 'c1' },
  { nome: '7º Ano EF — A', turno: 'Manhã', alunos: 30, c: 'c2' },
  { nome: '8º Ano EF — A', turno: 'Manhã', alunos: 29, c: 'c2' },
  { nome: '9º Ano EF — A', turno: 'Tarde', alunos: 27, c: 'c3' },
  { nome: '9º Ano EF — B', turno: 'Tarde', alunos: 25, c: 'c3' },
  { nome: '1ª Série EM — A', turno: 'Manhã', alunos: 31, c: 'c4' },
  { nome: '1ª Série EM — B', turno: 'Manhã', alunos: 30, c: 'c4' },
  { nome: '2ª Série EM — A', turno: 'Manhã', alunos: 28, c: 'c5' },
  { nome: '2ª Série EM — B', turno: 'Manhã', alunos: 26, c: 'c5' },
  { nome: '3ª Série EM — A', turno: 'Manhã', alunos: 32, c: 'c6' },
  { nome: '3ª Série EM — B', turno: 'Manhã', alunos: 29, c: 'c6' },
];

const TurmaSelectModal = ({ current, onPick, onClose }) => {
  const [busca, setBusca] = React.useState('');
  const [turno, setTurno] = React.useState('todos');
  const filt = TURMAS_LIST.filter(t => {
    if (busca && !t.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    if (turno !== 'todos' && t.turno.toLowerCase() !== turno) return false;
    return true;
  });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 600 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Selecionar turma</div>
            <div className="modal-title">Escolha a turma</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{TURMAS_LIST.length} turmas ativas · ano letivo 2026</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input className="input" placeholder="Buscar turma…" value={busca} onChange={e=>setBusca(e.target.value)} style={{ paddingLeft: 32 }} autoFocus/>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
            </div>
            <div className="row" style={{ gap: 4 }}>
              <button className={`chip-btn ${turno === 'todos' ? 'on' : ''}`} onClick={()=>setTurno('todos')}>Todos</button>
              <button className={`chip-btn ${turno === 'manhã' ? 'on' : ''}`} onClick={()=>setTurno('manhã')}>Manhã</button>
              <button className={`chip-btn ${turno === 'tarde' ? 'on' : ''}`} onClick={()=>setTurno('tarde')}>Tarde</button>
            </div>
          </div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filt.map((t, i) => {
              const ativa = current === t.nome;
              return (
                <button key={t.nome} onClick={()=>onPick(t.nome)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', border: 0, background: ativa ? 'var(--accent-soft)' : 'transparent', borderBottom: i < filt.length-1 ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span className={`avatar sm ${t.c}`}>{t.nome[0]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: ativa ? 500 : 400, color: ativa ? 'var(--accent-ink)' : 'var(--ink)' }}>{t.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{t.turno} · {t.alunos} alunos</div>
                  </div>
                  {ativa && <Icon name="check" size={14} style={{ color: 'var(--accent-ink)' }}/>}
                </button>
              );
            })}
            {filt.length === 0 && (
              <div className="empty" style={{ margin: 20 }}>
                <div className="t">Nenhuma turma encontrada</div>
                <div className="s">ajuste os filtros ou a busca</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SlotModal = ({ dia, periodo, sig, turma, onClose }) => {
  const [form, setForm] = React.useState({
    materia: sig ? NOMES[sig] : '', prof: sig ? PROFS[sig] : '',
    sala: 'Sala 204', recorrente: true,
  });
  const upd = (k,v) => setForm({ ...form, [k]: v });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{sig ? 'Editar aula' : 'Nova aula'}</div>
            <div className="modal-title">{dia} · {periodo.ini}—{periodo.fim}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{turma} · {periodo.i}º período</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <FieldH label="Matéria" span={2}>
              <select className="select" value={form.materia} onChange={e=>upd('materia', e.target.value)}>
                <option value="">Selecionar matéria…</option>
                {Object.keys(NOMES).map(k => <option key={k}>{NOMES[k]}</option>)}
              </select>
            </FieldH>
            <FieldH label="Professor" span={2}>
              <select className="select" value={form.prof} onChange={e=>upd('prof', e.target.value)}>
                <option value="">Selecionar professor…</option>
                <option>H. Castro</option><option>P. Xavier</option><option>M. Lopes</option>
                <option>D. Prado</option><option>R. Torres</option><option>C. Mendes</option>
                <option>B. Martins</option><option>V. Lima</option>
              </select>
            </FieldH>
            <FieldH label="Sala"><input className="input" value={form.sala} onChange={e=>upd('sala', e.target.value)}/></FieldH>
            <FieldH label="Recorrência">
              <div className="row" style={{ gap: 6 }}>
                <button onClick={()=>upd('recorrente', true)} className={`chip-btn ${form.recorrente ? 'on' : ''}`}>Toda semana</button>
                <button onClick={()=>upd('recorrente', false)} className={`chip-btn ${!form.recorrente ? 'on' : ''}`}>Só esta</button>
              </div>
            </FieldH>
            <FieldH label="Conflitos" span={2}>
              <div style={{ padding: '9px 12px', border: '1px solid var(--line)', borderRadius: 6, background: 'var(--ok-soft)', color: 'var(--ok)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="check" size={13}/>Nenhum conflito com este professor/sala
              </div>
            </FieldH>
          </div>
        </div>
        <div className="modal-footer">
          {sig && <button className="btn" style={{ marginRight: 'auto', color: 'var(--bad)', borderColor: 'var(--bad-soft)' }} onClick={onClose}><Icon name="x" size={11}/>Remover aula</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn accent" onClick={onClose}><Icon name="check"/>{sig ? 'Salvar aula' : 'Adicionar aula'}</button>
        </div>
      </div>
    </div>
  );
};

const FieldH = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const SlotCard = ({ sig, edit }) => {
  if (!sig) return (
    <div style={{ height: '100%', minHeight: 74, border: '1px dashed var(--line-2)', borderRadius: 4, display: 'grid', placeItems: 'center', color: 'var(--ink-4)', fontSize: 11 }}>+</div>
  );
  const cor = CORES[sig];
  return (
    <div style={{ height: '100%', minHeight: 74, borderRadius: 4, background: 'var(--panel)', border: '1px solid var(--line)', borderLeft: `3px solid ${cor}`, padding: '8px 10px', display: 'flex', flexDirection: 'column', cursor: edit ? 'grab' : 'default' }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--ink)' }}>{NOMES[sig]}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>{PROFS[sig] || '—'}</div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-4)' }}>Sala 204</span>
      </div>
    </div>
  );
};

Object.assign(window, { Horarios });
