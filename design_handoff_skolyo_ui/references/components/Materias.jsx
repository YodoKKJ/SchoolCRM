// Matérias - só nome e cor (simplificado) + modais
const MATERIAS = [
  { id: 1, nome: 'Português', sigla: 'POR', cor: '#C04A3A' },
  { id: 2, nome: 'Matemática', sigla: 'MAT', cor: '#3F6FB0' },
  { id: 3, nome: 'História', sigla: 'HIS', cor: '#B5832A' },
  { id: 4, nome: 'Geografia', sigla: 'GEO', cor: '#2F7F5E' },
  { id: 5, nome: 'Ciências', sigla: 'CIE', cor: '#6A4FA6' },
  { id: 6, nome: 'Biologia', sigla: 'BIO', cor: '#4FAE85' },
  { id: 7, nome: 'Química', sigla: 'QUI', cor: '#2C7787' },
  { id: 8, nome: 'Física', sigla: 'FIS', cor: '#A8473A' },
  { id: 9, nome: 'Inglês', sigla: 'ING', cor: '#9C5580' },
  { id: 10, nome: 'Espanhol', sigla: 'ESP', cor: '#C08A2E' },
  { id: 11, nome: 'Ed. Física', sigla: 'EDF', cor: '#52626F' },
  { id: 12, nome: 'Artes', sigla: 'ART', cor: '#D78A7E' },
  { id: 13, nome: 'Filosofia', sigla: 'FIL', cor: '#6A4FA6' },
  { id: 14, nome: 'Sociologia', sigla: 'SOC', cor: '#3F6FB0' },
];

const Materias = () => {
  const [search, setSearch] = React.useState('');
  const [modal, setModal] = React.useState(null);
  const filtered = MATERIAS.filter(m => m.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Matérias</div>
          <h1 className="page-title">Componentes curriculares</h1>
          <div className="page-subtitle">{MATERIAS.length} matérias cadastradas</div>
        </div>
        <div className="row">
          <button className="btn"><Icon name="download"/>Exportar</button>
          <button className="btn accent" onClick={() => setModal({ mode: 'new' })}><Icon name="plus"/>Nova matéria</button>
        </div>
      </div>

      <div className="filter-row">
        <div style={{ flex: 1, maxWidth: 320 }}>
          <div className="search" style={{ width: '100%', minWidth: 0, background: 'var(--panel)' }}>
            <Icon name="search" size={13}/>
            <input style={{ border: 0, outline: 0, background: 'transparent', flex: 1, color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }} placeholder="Buscar matéria…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead><tr>
            <th style={{ width: 80 }}>Sigla</th>
            <th>Nome</th>
            <th style={{ width: 180, textAlign: 'right' }}>Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td>
                  <span style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 4, background: m.cor, color: 'white', fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.02em' }}>{m.sigla}</span>
                </td>
                <td><span className="strong">{m.nome}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                    <button className="btn sm" onClick={() => setModal({ mode: 'edit', m })}><Icon name="edit"/>Editar</button>
                    <button className="icon-btn" title="Excluir"><Icon name="trash"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <MateriaModal mode={modal.mode} m={modal.m} onClose={() => setModal(null)}/>}
    </div>
  );
};

const CORES_PALETTE = ['#C04A3A','#3F6FB0','#B5832A','#2F7F5E','#6A4FA6','#4FAE85','#2C7787','#A8473A','#9C5580','#C08A2E','#52626F','#D78A7E'];

const MateriaModal = ({ mode, m, onClose }) => {
  const [form, setForm] = React.useState(m || { nome: '', sigla: '', cor: CORES_PALETTE[0] });
  const isEdit = mode === 'edit';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="card-eyebrow">{isEdit ? 'Editar matéria' : 'Nova matéria'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, marginTop: 4 }}>{isEdit ? form.nome : 'Cadastrar nova matéria'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 20px' }}>
            <span style={{ display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: 10, background: form.cor, color: 'white', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, letterSpacing: '0.02em' }}>{form.sigla || '—'}</span>
          </div>
          <div className="field">
            <label>Nome da matéria</label>
            <input className="input" placeholder="ex: Matemática" value={form.nome} onChange={e => set('nome', e.target.value)}/>
          </div>
          <div className="field">
            <label>Sigla (3 letras)</label>
            <input className="input" maxLength={3} placeholder="MAT" style={{ textTransform: 'uppercase', width: 120, fontFamily: 'var(--font-mono)' }} value={form.sigla} onChange={e => set('sigla', e.target.value.toUpperCase())}/>
          </div>
          <div className="field">
            <label>Cor de identificação</label>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {CORES_PALETTE.map(c => (
                <button key={c} onClick={() => set('cor', c)} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: form.cor === c ? '2px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }}/>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          {isEdit && <button className="btn" style={{ marginRight: 'auto', color: 'var(--bad)' }}><Icon name="trash"/>Excluir matéria</button>}
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn accent" onClick={onClose}><Icon name="check"/>{isEdit ? 'Salvar alterações' : 'Criar matéria'}</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Materias });
