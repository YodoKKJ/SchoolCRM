// Lançamentos - notas e presença
const ALUNOS_TURMA = [
  { n: 'Bruno Badeschi', c: 'c1', nota: 10, presenca: [true,true,true,true,true] },
  { n: 'Felipe Pardolfo', c: 'c2', nota: 9, presenca: [true,true,false,true,true] },
  { n: 'Helena Martins', c: 'c3', nota: 8.5, presenca: [true,true,true,true,true] },
  { n: 'Lucas Teodoro', c: 'c4', nota: 7.2, presenca: [false,true,true,true,false] },
  { n: 'Mariana Coelho', c: 'c5', nota: 9.5, presenca: [true,true,true,true,true] },
  { n: 'Pedro Altavilla', c: 'c6', nota: 6.8, presenca: [true,false,true,true,true] },
  { n: 'Sofia Monteiro', c: 'c7', nota: 8.9, presenca: [true,true,true,true,true] },
  { n: 'Victor Vilanova', c: 'c8', nota: 9, presenca: [true,true,true,false,true] },
  { n: 'Vicente Araújo', c: 'c1', nota: 8, presenca: [true,false,true,true,true] },
];

const Lancamentos = () => {
  const [tab, setTab] = React.useState('notas');
  const [turma, setTurma] = React.useState('3ª Série EM — A');
  const [materia, setMateria] = React.useState('Química');
  const [aval, setAval] = React.useState('Prova');
  const [bim, setBim] = React.useState(1);
  const [rows, setRows] = React.useState(ALUNOS_TURMA);
  const [avalModal, setAvalModal] = React.useState(null);

  const changeNota = (i, v) => {
    const nv = [...rows]; nv[i] = { ...nv[i], nota: v === '' ? '' : parseFloat(v) }; setRows(nv);
  };

  const media = rows.filter(r => typeof r.nota === 'number').reduce((a,r)=>a+r.nota,0) / rows.length;
  const lançadas = rows.filter(r => typeof r.nota === 'number' && !isNaN(r.nota)).length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Lançamentos</div>
          <h1 className="page-title">Lançar notas e presença</h1>
          <div className="page-subtitle">{turma} · {materia} · {lançadas}/{rows.length} lançadas · média atual {media.toFixed(1)}</div>
        </div>
        <div className="row">
          <button className="btn"><Icon name="download"/>Baixar planilha</button>
          <button className="btn"><Icon name="upload"/>Importar CSV</button>
          <button className="btn accent"><Icon name="save"/>Salvar lançamentos</button>
        </div>
      </div>

      <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Field label="Turma"><select className="select" value={turma} onChange={e=>setTurma(e.target.value)}>
          <option>3ª Série EM — A</option><option>3ª Série EM — B</option><option>2ª Série EM — A</option></select></Field>
        <Field label="Matéria"><select className="select" value={materia} onChange={e=>setMateria(e.target.value)}>
          <option>Química</option><option>Física</option><option>Matemática</option><option>Biologia</option></select></Field>
        <Field label="Bimestre">
          <div style={{ display: 'inline-flex', background: 'var(--bg-2)', borderRadius: 6, padding: 3, border: '1px solid var(--line)' }}>
            {[1,2,3,4].map(b => (
              <button key={b} className="btn sm" onClick={()=>setBim(b)} style={{ background: bim===b?'var(--panel)':'transparent', border: 0, boxShadow: bim===b?'var(--shadow)':'none', minWidth: 44 }}>{b}º</button>
            ))}
          </div>
        </Field>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        <Tab active={tab==='notas'} onClick={()=>setTab('notas')}>Notas</Tab>
        <Tab active={tab==='presenca'} onClick={()=>setTab('presenca')}>Presença</Tab>
        <Tab active={tab==='atitudinais'} onClick={()=>setTab('atitudinais')}>Atitudinais</Tab>
      </div>

      {tab === 'notas' && (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div className="section-head">
              <div className="row">
                <span className="t">Avaliações do bimestre</span>
                <span className="chip">{bim}º bim</span>
              </div>
              <button className="btn sm" onClick={()=>setAvalModal({ mode:'new' })}><Icon name="plus"/>Nova avaliação</button>
            </div>
            <div style={{ display: 'flex', gap: 0, padding: 14 }}>
              {[
                { nome: 'Prova', peso: '6.0', data: '08 abr', on: true },
                { nome: 'Trabalho em grupo', peso: '2.0', data: '15 abr', on: false },
                { nome: 'Exercícios', peso: '2.0', data: '22 abr', on: false },
              ].map((a, i) => (
                <div key={i} onClick={() => setAval(a.nome)} style={{ flex: 1, padding: '10px 14px', borderRight: i < 2 ? '1px solid var(--line)' : 'none', cursor: 'pointer', background: aval === a.nome ? 'var(--accent-soft)' : 'transparent', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 2, color: aval === a.nome ? 'var(--accent-ink)' : 'var(--ink)' }}>{a.nome}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>Peso {a.peso} · {a.data}</div>
                  </div>
                  <button className="icon-btn" onClick={e=>{e.stopPropagation(); setAvalModal({ mode:'edit', aval: a });}}><Icon name="edit"/></button>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead><tr>
                <th style={{ width: 40 }}>#</th>
                <th>Aluno</th>
                <th style={{ width: 120, textAlign: 'right' }}>Nota (0 — 10)</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 60 }}></th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="num" style={{ color: 'var(--ink-4)' }}>{String(i+1).padStart(2,'0')}</td>
                    <td><span className="row"><span className={`avatar sm ${r.c}`}>{r.n.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><span className="strong">{r.n}</span></span></td>
                    <td style={{ textAlign: 'right' }}>
                      <input type="number" min="0" max="10" step="0.1" className="input num" style={{ width: 100, textAlign: 'right', padding: '6px 10px', fontFamily: 'var(--font-mono)' }} value={r.nota} onChange={e=>changeNota(i, e.target.value)}/>
                    </td>
                    <td>
                      {typeof r.nota === 'number' && !isNaN(r.nota) ? (
                        <span className={`chip ${r.nota >= 7 ? 'ok' : r.nota >= 5 ? 'warn' : 'bad'}`}><span className="dot"/>{r.nota >= 7 ? 'Lançado' : r.nota >= 5 ? 'Atenção' : 'Recuperação'}</span>
                      ) : <span className="chip">Pendente</span>}
                    </td>
                    <td><button className="icon-btn"><Icon name="dots"/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'presenca' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead><tr>
              <th>Aluno</th>
              {['08 abr','09 abr','10 abr','11 abr','12 abr'].map(d => <th key={d} style={{ textAlign: 'center', width: 70 }}>{d}</th>)}
              <th style={{ textAlign: 'right', width: 80 }}>Presença</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const p = r.presenca.filter(Boolean).length;
                return (
                  <tr key={i}>
                    <td><span className="row"><span className={`avatar sm ${r.c}`}>{r.n.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><span className="strong">{r.n}</span></span></td>
                    {r.presenca.map((pr, j) => (
                      <td key={j} style={{ textAlign: 'center' }}>
                        <button style={{ width: 26, height: 26, borderRadius: 4, border: 0, background: pr ? 'var(--ok-soft)' : 'var(--bad-soft)', color: pr ? 'var(--ok)' : 'var(--bad)', cursor: 'pointer' }}>
                          <Icon name={pr ? 'check' : 'x'} size={12}/>
                        </button>
                      </td>
                    ))}
                    <td className="num" style={{ textAlign: 'right' }}>{Math.round(p/5*100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'atitudinais' && (
        <div className="empty">
          <div className="t">Nenhum critério atitudinal configurado</div>
          <div className="s">Configure em Configurações → Modelo de avaliação</div>
        </div>
      )}

      {avalModal && <AvalModal {...avalModal} turma={turma} materia={materia} bim={bim} onClose={()=>setAvalModal(null)}/>}
    </div>
  );
};

const AvalModal = ({ mode, aval, turma, materia, bim, onClose }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = React.useState({
    nome: aval?.nome || '', tipo: 'Prova', peso: aval?.peso || '2.0',
    data: aval?.data || '22 abr', nota_max: '10.0', descricao: '',
  });
  const upd = (k,v) => setForm({ ...form, [k]: v });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{isEdit ? 'Editar avaliação' : 'Nova avaliação'}</div>
            <div className="modal-title">{isEdit ? form.nome : 'Cadastrar avaliação'}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{turma} · {materia} · {bim}º bimestre</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <FieldL label="Nome" span={2}><input className="input" placeholder="Ex: Prova mensal" value={form.nome} onChange={e=>upd('nome', e.target.value)}/></FieldL>
            <FieldL label="Tipo"><select className="select" value={form.tipo} onChange={e=>upd('tipo', e.target.value)}>
              <option>Prova</option><option>Trabalho</option><option>Seminário</option>
              <option>Exercícios</option><option>Projeto</option><option>Participação</option>
            </select></FieldL>
            <FieldL label="Data"><input className="input" value={form.data} onChange={e=>upd('data', e.target.value)} placeholder="dd/mm/aaaa"/></FieldL>
            <FieldL label="Nota máxima" span={2}><input className="input num" value={form.nota_max} onChange={e=>upd('nota_max', e.target.value)}/></FieldL>
            <FieldL label="Descrição / conteúdo" span={2}><textarea className="input" rows={3} placeholder="Conteúdos abordados…" value={form.descricao} onChange={e=>upd('descricao', e.target.value)}/></FieldL>
          </div>
          <div style={{ padding: 12, background: 'var(--panel-2)', borderRadius: 6, marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name="info" size={14}/>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>Ao salvar, todos os alunos da turma começam como "pendente". Use a tabela de lançamento para inserir as notas.</div>
          </div>
        </div>
        <div className="modal-footer">
          {isEdit && <button className="btn" style={{ marginRight: 'auto', color: 'var(--bad)', borderColor: 'var(--bad-soft)' }}><Icon name="x" size={11}/>Excluir avaliação</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn accent" onClick={onClose}><Icon name="check"/>{isEdit ? 'Salvar alterações' : 'Criar avaliação'}</button>
        </div>
      </div>
    </div>
  );
};

const FieldL = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ minWidth: 180 }}>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Tab = ({ active, children, onClick }) => (
  <button onClick={onClick} style={{ padding: '10px 16px', background: 'transparent', border: 0, borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, color: active ? 'var(--ink)' : 'var(--ink-3)', fontWeight: active ? 500 : 400, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1 }}>{children}</button>
);

Object.assign(window, { Lancamentos });
