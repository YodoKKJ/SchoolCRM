// Atrasos - registro de atrasos/chegadas + modais
const ATRASOS = [
  { h: '07:42', aluno: 'Bruno Badeschi', turma: '3ª EM A', resp: 'Mãe', motivo: 'Trânsito', justif: 'Justificado', c: 'c1' },
  { h: '07:45', aluno: 'Vicente Araújo', turma: '3ª EM A', resp: 'Pai', motivo: 'Transporte', justif: 'Aguardando', c: 'c2' },
  { h: '07:48', aluno: 'Mariana Coelho', turma: '2ª EM B', resp: 'Mãe', motivo: 'Consulta médica', justif: 'Justificado', c: 'c3' },
  { h: '07:51', aluno: 'Lucas Teodoro', turma: '1ª EM A', resp: '—', motivo: 'Não informado', justif: 'Pendente', c: 'c4' },
  { h: '07:55', aluno: 'Felipe Pardolfo', turma: '3ª EM A', resp: 'Mãe', motivo: 'Trânsito', justif: 'Justificado', c: 'c5' },
  { h: '08:02', aluno: 'Victor Vilanova', turma: '3ª EM A', resp: 'Pai', motivo: 'Transporte', justif: 'Justificado', c: 'c6' },
  { h: '08:10', aluno: 'Helena Martins', turma: '9º EF A', resp: 'Responsável', motivo: 'Não informado', justif: 'Pendente', c: 'c7' },
];

const Atrasos = () => {
  const [dia, setDia] = React.useState('hoje');
  const [filterJ, setFilterJ] = React.useState('todos');
  const [modal, setModal] = React.useState(null);
  const filtered = ATRASOS.filter(a => filterJ === 'todos' || a.justif.toLowerCase().includes(filterJ));
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Acadêmico · Atrasos & Chegadas</div>
          <h1 className="page-title">Registro de atrasos</h1>
          <div className="page-subtitle">Terça, 14 abril 2026 · 7 atrasos · 3 pendentes de justificativa</div>
        </div>
        <div className="row">
          <button className="btn"><Icon name="whatsapp"/>Notificar responsáveis</button>
          <button className="btn accent" onClick={()=>setModal({ mode:'new' })}><Icon name="plus"/>Registrar atraso</button>
        </div>
      </div>

      <div className="grid g-4 mb-4">
        <MetricCard label="Atrasos hoje" value="7" delta="-2 vs ontem" deltaClass="up"/>
        <MetricCard label="Justificados" value="4" delta="57% do total"/>
        <MetricCard label="Pendentes" value="3" delta="requer ação" deltaClass="down"/>
        <MetricCard label="Média mensal" value="12/dia" delta="dentro do esperado"/>
      </div>

      <div className="filter-row">
        <button className={`chip-btn ${dia === 'hoje' ? 'on' : ''}`} onClick={() => setDia('hoje')}>Hoje</button>
        <button className={`chip-btn ${dia === 'semana' ? 'on' : ''}`} onClick={() => setDia('semana')}>Esta semana</button>
        <button className={`chip-btn ${dia === 'mes' ? 'on' : ''}`} onClick={() => setDia('mes')}>Mês</button>
        <div style={{ width: 16 }}/>
        <button className={`chip-btn ${filterJ === 'todos' ? 'on' : ''}`} onClick={() => setFilterJ('todos')}>Todos</button>
        <button className={`chip-btn ${filterJ === 'justif' ? 'on' : ''}`} onClick={() => setFilterJ('justif')}>Justificados</button>
        <button className={`chip-btn ${filterJ === 'pend' ? 'on' : ''}`} onClick={() => setFilterJ('pend')}>Pendentes</button>
        <button className={`chip-btn ${filterJ === 'aguard' ? 'on' : ''}`} onClick={() => setFilterJ('aguard')}>Aguardando</button>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn sm"><Icon name="download"/>Exportar dia</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead><tr>
            <th style={{ width: 80 }}>Chegada</th>
            <th>Aluno</th><th>Turma</th><th>Responsável</th>
            <th>Motivo informado</th><th>Status</th>
            <th style={{ width: 140, textAlign: 'right' }}>Ações</th>
          </tr></thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i}>
                <td className="num strong">{a.h}</td>
                <td><span className="row"><span className={`avatar sm ${a.c}`}>{a.aluno.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span className="strong">{a.aluno}</span></span></td>
                <td>{a.turma}</td><td>{a.resp}</td>
                <td style={{ color: 'var(--ink-3)' }}>{a.motivo}</td>
                <td><span className={`chip ${a.justif === 'Justificado' ? 'ok' : a.justif === 'Pendente' ? 'bad' : 'warn'}`}><span className="dot"/>{a.justif}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                    <button className="btn sm" onClick={()=>setModal({ mode:'just', atraso: a })}>Justificar</button>
                    <button className="icon-btn"><Icon name="whatsapp"/></button>
                    <button className="icon-btn" onClick={()=>setModal({ mode:'edit', atraso: a })}><Icon name="edit"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <AtrasoModal {...modal} onClose={()=>setModal(null)}/>}
    </div>
  );
};

const AtrasoModal = ({ mode, atraso, onClose }) => {
  const isJust = mode === 'just';
  const isEdit = mode === 'edit';
  const [form, setForm] = React.useState({
    aluno: atraso?.aluno || '', turma: atraso?.turma || '3ª EM A',
    data: '14/04/2026', hora: atraso?.h || '07:30',
    motivo: atraso?.motivo || '', resp: atraso?.resp || '',
    justificativa: '', anexo: '',
  });
  const upd = (k,v) => setForm({ ...form, [k]: v });
  const title = isJust ? 'Justificar atraso' : isEdit ? 'Editar atraso' : 'Registrar atraso';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">{title}</div>
            <div className="modal-title">{isJust ? atraso.aluno : 'Novo registro de chegada'}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          {isJust ? (
            <>
              <div style={{ padding: 14, background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: 6, marginBottom: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                <span className={`avatar ${atraso.c}`} style={{ width: 40, height: 40, fontSize: 14 }}>{atraso.aluno.split(' ').map(n=>n[0]).slice(0,2).join('')}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{atraso.aluno}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{atraso.turma} · chegou {atraso.h} · informou {atraso.motivo}</div>
                </div>
              </div>
              <div className="form-grid">
                <Field3 label="Status" span={2}>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="chip-btn on">Justificar</button>
                    <button className="chip-btn">Não justificar</button>
                  </div>
                </Field3>
                <Field3 label="Categoria da justificativa" span={2}>
                  <select className="select">
                    <option>Trânsito / transporte</option><option>Consulta médica</option>
                    <option>Atestado médico</option><option>Questão familiar</option>
                    <option>Outros (informar abaixo)</option>
                  </select>
                </Field3>
                <Field3 label="Observação (opcional)" span={2}>
                  <textarea className="input" rows={3} placeholder="Detalhes da justificativa…" value={form.justificativa} onChange={e=>upd('justificativa', e.target.value)}/>
                </Field3>
                <Field3 label="Anexar comprovante" span={2}>
                  <div style={{ padding: 16, border: '1px dashed var(--line-2)', borderRadius: 6, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
                    <Icon name="upload" size={14}/> Arrastar ou clicar · PDF/JPG até 5 MB
                  </div>
                </Field3>
              </div>
            </>
          ) : (
            <div className="form-grid">
              <Field3 label="Aluno" span={2}>
                <div style={{ position: 'relative' }}>
                  <input className="input" placeholder="Buscar aluno pelo nome ou RM…" value={form.aluno} onChange={e=>upd('aluno', e.target.value)} style={{ paddingLeft: 32 }}/>
                  <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
                </div>
              </Field3>
              <Field3 label="Turma"><select className="select" value={form.turma} onChange={e=>upd('turma', e.target.value)}><option>3ª EM A</option><option>3ª EM B</option><option>2ª EM A</option><option>1ª EM A</option><option>9º EF A</option></select></Field3>
              <Field3 label="Data"><input className="input" value={form.data} onChange={e=>upd('data', e.target.value)}/></Field3>
              <Field3 label="Hora de chegada"><input className="input num" value={form.hora} onChange={e=>upd('hora', e.target.value)}/></Field3>
              <Field3 label="Responsável notificado"><select className="select" value={form.resp} onChange={e=>upd('resp', e.target.value)}><option>Mãe</option><option>Pai</option><option>Responsável</option><option>Não informado</option></select></Field3>
              <Field3 label="Motivo informado" span={2}>
                <select className="select" value={form.motivo} onChange={e=>upd('motivo', e.target.value)}>
                  <option value="">Selecionar…</option>
                  <option>Trânsito</option><option>Transporte</option><option>Consulta médica</option>
                  <option>Atestado médico</option><option>Questão familiar</option><option>Não informado</option>
                </select>
              </Field3>
              <Field3 label="Observação" span={2}><textarea className="input" rows={2} placeholder="Detalhes adicionais…"/></Field3>
              <Field3 label="Notificar responsável automaticamente" span={2}>
                <div className="row" style={{ gap: 6 }}>
                  <button className="chip-btn on"><Icon name="whatsapp" size={11}/>WhatsApp</button>
                  <button className="chip-btn">E-mail</button>
                  <button className="chip-btn">Não notificar</button>
                </div>
              </Field3>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn accent" onClick={onClose}><Icon name="check"/>{isJust ? 'Salvar justificativa' : isEdit ? 'Salvar alterações' : 'Registrar atraso'}</button>
        </div>
      </div>
    </div>
  );
};

const Field3 = ({ label, children, span = 1 }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

Object.assign(window, { Atrasos });
