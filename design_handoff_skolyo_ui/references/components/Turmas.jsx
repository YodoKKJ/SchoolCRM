// Turmas - lista + detalhe + modais
const TURMAS = [
  { id: 1, nome: '6º Ano EF', sala: 'A', turno: 'Manhã', alunos: 28, vagas: 32, prof: 'Paula Ribeiro', c: 'c1' },
  { id: 2, nome: '6º Ano EF', sala: 'B', turno: 'Manhã', alunos: 26, vagas: 32, prof: 'Carlos Mendes', c: 'c1' },
  { id: 3, nome: '7º Ano EF', sala: 'A', turno: 'Manhã', alunos: 30, vagas: 32, prof: 'Julia Fontes', c: 'c2' },
  { id: 4, nome: '8º Ano EF', sala: 'A', turno: 'Manhã', alunos: 29, vagas: 32, prof: 'Rafael Torres', c: 'c2' },
  { id: 5, nome: '9º Ano EF', sala: 'A', turno: 'Tarde', alunos: 27, vagas: 32, prof: 'Bianca Souza', c: 'c3' },
  { id: 6, nome: '9º Ano EF', sala: 'B', turno: 'Tarde', alunos: 25, vagas: 32, prof: 'Lucas Alves', c: 'c3' },
  { id: 7, nome: '1ª Série EM', sala: 'A', turno: 'Manhã', alunos: 31, vagas: 36, prof: 'Mariana Lopes', c: 'c4' },
  { id: 8, nome: '1ª Série EM', sala: 'B', turno: 'Manhã', alunos: 30, vagas: 36, prof: 'Daniel Prado', c: 'c4' },
  { id: 9, nome: '2ª Série EM', sala: 'A', turno: 'Manhã', alunos: 28, vagas: 36, prof: 'Helena Castro', c: 'c5' },
  { id: 10, nome: '2ª Série EM', sala: 'B', turno: 'Manhã', alunos: 26, vagas: 36, prof: 'Pedro Xavier', c: 'c5' },
  { id: 11, nome: '3ª Série EM', sala: 'A', turno: 'Manhã', alunos: 32, vagas: 36, prof: 'Vanessa Lima', c: 'c6' },
  { id: 12, nome: '3ª Série EM', sala: 'B', turno: 'Manhã', alunos: 29, vagas: 36, prof: 'Bruno Martins', c: 'c6' },
];

const ALUNOS_DETAIL = [
  { n: 'Bruno Badeschi', c: 'c1', rm: '2026.0001' },
  { n: 'Victor Vilanova', c: 'c2', rm: '2026.0002' },
  { n: 'Felipe Pardolfo', c: 'c3', rm: '2026.0003' },
  { n: 'Vicente Araújo', c: 'c4', rm: '2026.0004' },
];

const PROFS_DETAIL = [
  { n: 'Rose Mary', m: 'Matemática', sig: 'MAT', cor: '#3F6FB0' },
  { n: 'Renato Lima', m: 'Física', sig: 'FIS', cor: '#A8473A' },
  { n: 'Enok Castro', m: 'Química', sig: 'QUI', cor: '#2C7787' },
  { n: 'Rose Mary', m: 'História', sig: 'HIS', cor: '#B5832A' },
];

const TurmaDetail = ({ turma, onBack }) => {
  const [editOpen, setEditOpen] = React.useState(false);
  const [alunos, setAlunos] = React.useState(ALUNOS_DETAIL);
  const [profs, setProfs] = React.useState(PROFS_DETAIL);
  const [buscaAluno, setBuscaAluno] = React.useState('');
  const [buscaProf, setBuscaProf] = React.useState('');
  const [materiaSel, setMateriaSel] = React.useState('');

  return (
    <div className="page">
      <div className="row" style={{ gap: 10, marginBottom: 10 }}>
        <button className="btn sm" onClick={onBack}><Icon name="chev" size={12} style={{ transform: 'rotate(180deg)' }}/>Voltar</button>
      </div>
      <div className="page-header">
        <div className="row" style={{ gap: 16, alignItems: 'center' }}>
          <span className={`avatar ${turma.c}`} style={{ width: 52, height: 52, fontSize: 18 }}>{turma.sala}</span>
          <div>
            <div className="page-eyebrow">Acadêmico · Turmas · Detalhe</div>
            <h1 className="page-title">{turma.nome} — {turma.sala}</h1>
            <div className="page-subtitle">{turma.turno} · {turma.alunos}/{turma.vagas} alunos · titular {turma.prof}</div>
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setEditOpen(true)}><Icon name="edit"/>Editar turma</button>
        </div>
      </div>

      <div className="grid g-4 mb-4">
        <MetricCard label="Alunos matriculados" value={alunos.length} delta={`${turma.vagas - alunos.length} vagas`}/>
        <MetricCard label="Professores" value={profs.length} delta="matérias vinculadas"/>
        <MetricCard label="Matérias" value={new Set(profs.map(p=>p.m)).size} delta="ativas no ano"/>
        <MetricCard label="Turno" value={turma.turno} delta="07:30 — 12:00"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-head">
            <div>
              <div className="t">Alunos</div>
              <div className="s">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ padding: 14, borderBottom: '1px solid var(--line)', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input className="input" placeholder="Buscar aluno…" value={buscaAluno} onChange={e=>setBuscaAluno(e.target.value)} style={{ paddingLeft: 32 }}/>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
            </div>
            <button className="btn accent"><Icon name="plus"/>Adicionar</button>
          </div>
          <div>
            {alunos.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < alunos.length-1 ? '1px solid var(--line)' : 'none' }}>
                <span className={`avatar sm ${a.c}`}>{a.n.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.n}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>RM {a.rm}</div>
                </div>
                <button className="btn sm" style={{ color: 'var(--bad)', borderColor: 'var(--bad-soft)', background: 'var(--bad-soft)' }} onClick={()=>setAlunos(alunos.filter((_,j)=>j!==i))}>
                  <Icon name="x" size={11}/>Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-head">
            <div>
              <div className="t">Professores</div>
              <div className="s">{profs.length} vínculo{profs.length !== 1 ? 's' : ''} professor-matéria</div>
            </div>
          </div>
          <div style={{ padding: 14, borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <input className="input" placeholder="Buscar professor…" value={buscaProf} onChange={e=>setBuscaProf(e.target.value)} style={{ paddingLeft: 32 }}/>
              <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
            </div>
            <select className="select" value={materiaSel} onChange={e=>setMateriaSel(e.target.value)}>
              <option value="">Selecionar matéria…</option>
              <option>Matemática</option><option>Física</option><option>Química</option>
              <option>Biologia</option><option>Português</option><option>História</option>
              <option>Geografia</option><option>Inglês</option>
            </select>
            <button className="btn accent"><Icon name="plus"/>Adicionar</button>
          </div>
          <div>
            {profs.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < profs.length-1 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 4, background: p.cor, color: 'white', fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600 }}>{p.sig}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.n}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>{p.m}</div>
                </div>
                <button className="btn sm" style={{ color: 'var(--bad)', borderColor: 'var(--bad-soft)', background: 'var(--bad-soft)' }} onClick={()=>setProfs(profs.filter((_,j)=>j!==i))}>
                  <Icon name="x" size={11}/>Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editOpen && <TurmaModal turma={turma} onClose={()=>setEditOpen(false)}/>}
    </div>
  );
};

const Turmas = () => {
  const [view, setView] = React.useState('grid');
  const [filterTurno, setFilterTurno] = React.useState('todos');
  const [filterNivel, setFilterNivel] = React.useState('todos');
  const [modal, setModal] = React.useState(null);
  const [detail, setDetail] = React.useState(null);

  if (detail) return <TurmaDetail turma={detail} onBack={()=>setDetail(null)}/>;

  const filtered = TURMAS.filter(t => {
    if (filterTurno !== 'todos' && t.turno.toLowerCase() !== filterTurno) return false;
    if (filterNivel === 'ef' && !t.nome.includes('EF')) return false;
    if (filterNivel === 'em' && !t.nome.includes('EM')) return false;
    return true;
  });

  const totalAlunos = filtered.reduce((a, t) => a + t.alunos, 0);
  const totalVagas = filtered.reduce((a, t) => a + t.vagas, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Turmas</div>
          <h1 className="page-title">Turmas do ano letivo</h1>
          <div className="page-subtitle">{filtered.length} turmas · {totalAlunos} alunos matriculados · {totalVagas - totalAlunos} vagas disponíveis</div>
        </div>
        <div className="row">
          <button className="btn"><Icon name="download"/>Exportar</button>
          <button className="btn accent" onClick={()=>setModal({ mode: 'new' })}><Icon name="plus"/>Nova turma</button>
        </div>
      </div>

      <div className="grid g-4 mb-4">
        <MetricCard label="Turmas ativas" value={filtered.length} delta="+2 vs 2025"/>
        <MetricCard label="Alunos matriculados" value={totalAlunos} delta="+34 vs 2025" deltaClass="up"/>
        <MetricCard label="Ocupação média" value={`${Math.round(totalAlunos/totalVagas*100)}%`} delta="Saudável" deltaClass="up"/>
        <MetricCard label="Professores titulares" value={12} delta="2 vagas em aberto" deltaClass="down"/>
      </div>

      <div className="filter-row">
        <button className={`chip-btn ${filterNivel === 'todos' ? 'on' : ''}`} onClick={() => setFilterNivel('todos')}>Todos os níveis</button>
        <button className={`chip-btn ${filterNivel === 'ef' ? 'on' : ''}`} onClick={() => setFilterNivel('ef')}>Ensino Fundamental</button>
        <button className={`chip-btn ${filterNivel === 'em' ? 'on' : ''}`} onClick={() => setFilterNivel('em')}>Ensino Médio</button>
        <div style={{ width: 16 }}/>
        <button className={`chip-btn ${filterTurno === 'todos' ? 'on' : ''}`} onClick={() => setFilterTurno('todos')}>Todos os turnos</button>
        <button className={`chip-btn ${filterTurno === 'manhã' ? 'on' : ''}`} onClick={() => setFilterTurno('manhã')}>Manhã</button>
        <button className={`chip-btn ${filterTurno === 'tarde' ? 'on' : ''}`} onClick={() => setFilterTurno('tarde')}>Tarde</button>
        <div style={{ marginLeft: 'auto' }} className="row">
          <button className="icon-btn" onClick={() => setView('grid')} style={{ background: view === 'grid' ? 'var(--bg-2)' : 'transparent' }}><Icon name="grid"/></button>
          <button className="icon-btn" onClick={() => setView('list')} style={{ background: view === 'list' ? 'var(--bg-2)' : 'transparent' }}><Icon name="list"/></button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid g-4">
          {filtered.map(t => <TurmaCard key={t.id} t={t} onView={()=>setDetail(t)} onEdit={()=>setModal({ mode: 'edit', turma: t })}/>)}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead><tr>
              <th>Turma</th><th>Turno</th><th>Professor titular</th>
              <th style={{ textAlign: 'right' }}>Ocupação</th>
              <th style={{ width: 40 }}></th>
            </tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} onClick={()=>setDetail(t)} style={{ cursor: 'pointer' }}>
                  <td><span className="row"><span className={`avatar sm ${t.c}`}>{t.nome[0]}</span><span className="strong">{t.nome} — {t.sala}</span></span></td>
                  <td>{t.turno}</td>
                  <td>{t.prof}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{t.alunos}/{t.vagas}</td>
                  <td onClick={e=>e.stopPropagation()}><button className="icon-btn" onClick={()=>setModal({ mode: 'edit', turma: t })}><Icon name="edit"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <TurmaModal turma={modal.turma} onClose={()=>setModal(null)}/>}
    </div>
  );
};

const MetricCard = ({ label, value, delta, deltaClass = '' }) => (
  <div className="card metric">
    <div className="label">{label}</div>
    <div className="value">{value}</div>
    <div className={`delta ${deltaClass}`}>{delta}</div>
  </div>
);

const TurmaCard = ({ t, onView, onEdit }) => (
  <div className="card" style={{ padding: 0 }}>
    <div style={{ padding: 16, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className={`avatar ${t.c}`} style={{ width: 36, height: 36, fontSize: 13 }}>{t.nome[0]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{t.nome} <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>· {t.sala}</span></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t.turno} · {t.prof}</div>
      </div>
    </div>
    <div style={{ padding: 16 }}>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Ocupação</span>
        <span className="num" style={{ fontSize: 12 }}>{t.alunos}/{t.vagas}</span>
      </div>
      <div className="progress" style={{ marginBottom: 16 }}><span style={{ width: `${t.alunos/t.vagas*100}%` }}/></div>
      <div className="row" style={{ gap: 6 }}>
        <button className="btn sm" style={{ flex: 1 }} onClick={onView}><Icon name="eye"/>Ver turma</button>
        <button className="btn sm" onClick={onEdit}><Icon name="edit"/></button>
      </div>
    </div>
  </div>
);

const TurmaModal = ({ turma, onClose }) => {
  const isEdit = !!turma;
  const [form, setForm] = React.useState({
    nome: turma?.nome || '', sala: turma?.sala || '', nivel: 'EM',
    turno: turma?.turno || 'Manhã', vagas: turma?.vagas || 36,
    prof: turma?.prof || '', ano: '2026', status: 'Ativa',
  });
  const upd = (k, v) => setForm({ ...form, [k]: v });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{isEdit ? 'Editar turma' : 'Nova turma'}</div>
            <div className="modal-title">{isEdit ? `${turma.nome} — ${turma.sala}` : 'Cadastrar nova turma'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <Field2 label="Nome da turma" span={2}><input className="input" placeholder="Ex: 3ª Série EM" value={form.nome} onChange={e=>upd('nome', e.target.value)}/></Field2>
            <Field2 label="Identificador"><input className="input" placeholder="A" value={form.sala} onChange={e=>upd('sala', e.target.value)}/></Field2>
            <Field2 label="Nível"><select className="select" value={form.nivel} onChange={e=>upd('nivel', e.target.value)}><option>EI</option><option>EF</option><option>EM</option></select></Field2>
            <Field2 label="Turno"><select className="select" value={form.turno} onChange={e=>upd('turno', e.target.value)}><option>Manhã</option><option>Tarde</option><option>Noite</option><option>Integral</option></select></Field2>
            <Field2 label="Vagas totais"><input type="number" className="input num" value={form.vagas} onChange={e=>upd('vagas', e.target.value)}/></Field2>
            <Field2 label="Professor titular" span={2}><select className="select" value={form.prof} onChange={e=>upd('prof', e.target.value)}><option value="">Selecionar…</option><option>Paula Ribeiro</option><option>Carlos Mendes</option><option>Vanessa Lima</option><option>Bruno Martins</option></select></Field2>
            <Field2 label="Ano letivo"><select className="select" value={form.ano} onChange={e=>upd('ano', e.target.value)}><option>2026</option><option>2025</option></select></Field2>
            <Field2 label="Status"><select className="select" value={form.status} onChange={e=>upd('status', e.target.value)}><option>Ativa</option><option>Inativa</option><option>Concluída</option></select></Field2>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          {isEdit && <button className="btn" style={{ color: 'var(--bad)', borderColor: 'var(--bad-soft)' }}><Icon name="x" size={11}/>Excluir turma</button>}
          <button className="btn accent" onClick={onClose}><Icon name="check"/>{isEdit ? 'Salvar alterações' : 'Criar turma'}</button>
        </div>
      </div>
    </div>
  );
};

const Field2 = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

Object.assign(window, { Turmas });
