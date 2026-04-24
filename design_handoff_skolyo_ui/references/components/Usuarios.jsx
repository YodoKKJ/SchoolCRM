// Usuários - lista unificada com ficha rica
const USU_DATA = [
  // ALUNOS
  { id: 1, nome: 'Bruno Badeschi', login: 'bruno.badeschi', role: 'ALUNO', ativo: true, rm: '2026.0001', c: 'c1', nasc: '2008-05-14', nomeMae: 'Clara Badeschi', nomePai: 'Roberto Badeschi', tel: '(11) 98765-1234', turmaAtual: '3ª Série EM — A', media: 8.7, freq: 96, responsaveis: 2, contratoAtivo: true, cadastrado: '2024-01-15' },
  { id: 2, nome: 'Felipe Pardolfo', login: 'felipe.pardolfo', role: 'ALUNO', ativo: true, rm: '2026.0002', c: 'c2', nasc: '2008-09-02', nomeMae: 'Sandra Pardolfo', nomePai: 'Ricardo Pardolfo', tel: '(11) 98012-9988', turmaAtual: '3ª Série EM — A', media: 7.9, freq: 92, responsaveis: 1, contratoAtivo: true, cadastrado: '2024-01-15' },
  { id: 3, nome: 'Helena Martins', login: 'helena.martins', role: 'ALUNO', ativo: true, rm: '2026.0003', c: 'c3', nasc: '2008-11-23', nomeMae: 'Laura Martins', nomePai: 'Paulo Martins', tel: '(11) 99112-4545', turmaAtual: '3ª Série EM — A', media: 9.1, freq: 98, responsaveis: 2, contratoAtivo: true, cadastrado: '2024-01-15' },
  { id: 4, nome: 'Lucas Teodoro', login: 'lucas.teodoro', role: 'ALUNO', ativo: true, rm: '2026.0004', c: 'c4', nasc: '2008-03-07', nomeMae: 'Beatriz Teodoro', nomePai: null, tel: '(11) 97221-3030', turmaAtual: '3ª Série EM — A', media: 6.3, freq: 84, responsaveis: 1, contratoAtivo: true, cadastrado: '2024-01-15' },
  { id: 5, nome: 'Mariana Coelho', login: 'mariana.coelho', role: 'ALUNO', ativo: true, rm: '2025.0087', c: 'c5', nasc: '2009-07-19', nomeMae: 'Patrícia Coelho', nomePai: 'Eduardo Coelho', tel: '(11) 98877-5566', turmaAtual: '2ª Série EM — B', media: 8.8, freq: 95, responsaveis: 2, contratoAtivo: true, cadastrado: '2023-02-10' },
  { id: 6, nome: 'Pedro Altavilla', login: 'pedro.altavilla', role: 'ALUNO', ativo: true, rm: '2025.0102', c: 'c6', nasc: '2009-12-11', nomeMae: 'Juliana Altavilla', nomePai: 'Marcos Altavilla', tel: '(11) 99876-2211', turmaAtual: '2ª Série EM — A', media: 6.8, freq: 88, responsaveis: 1, contratoAtivo: true, cadastrado: '2023-02-10' },
  { id: 7, nome: 'Sofia Monteiro', login: 'sofia.monteiro', role: 'ALUNO', ativo: true, rm: '2024.0213', c: 'c7', nasc: '2010-04-28', nomeMae: 'Carolina Monteiro', nomePai: 'Rafael Monteiro', tel: '(11) 98334-7788', turmaAtual: '1ª Série EM — A', media: 9.3, freq: 99, responsaveis: 2, contratoAtivo: true, cadastrado: '2022-01-20' },
  { id: 8, nome: 'Victor Vilanova', login: 'victor.vilanova', role: 'ALUNO', ativo: true, rm: '2026.0008', c: 'c8', nasc: '2008-08-15', nomeMae: 'Renata Vilanova', nomePai: 'Henrique Vilanova', tel: '(11) 97654-8899', turmaAtual: '3ª Série EM — A', media: 8.6, freq: 93, responsaveis: 2, contratoAtivo: true, cadastrado: '2024-01-15' },
  { id: 9, nome: 'Ana Ribeiro', login: 'ana.ribeiro', role: 'ALUNO', ativo: false, rm: '2024.0099', c: 'c1', nasc: '2010-02-09', nomeMae: 'Marta Ribeiro', nomePai: null, tel: '(11) 99001-1144', turmaAtual: null, media: 0, freq: 0, responsaveis: 1, contratoAtivo: false, cadastrado: '2022-03-05' },
  // PROFESSORES
  { id: 10, nome: 'Dra. A. Silva', login: 'a.silva', role: 'PROFESSOR', ativo: true, c: 'c5', tel: '(11) 98765-0001', materias: ['Matemática', 'Física'], turmas: 6, cadastrado: '2020-02-10' },
  { id: 11, nome: 'Prof. R. Lima', login: 'r.lima', role: 'PROFESSOR', ativo: true, c: 'c1', tel: '(11) 98765-0002', materias: ['Português', 'Literatura'], turmas: 8, cadastrado: '2019-08-01' },
  { id: 12, nome: 'Prof. C. Mendes', login: 'c.mendes', role: 'PROFESSOR', ativo: true, c: 'c6', tel: '(11) 98765-0003', materias: ['Química'], turmas: 4, cadastrado: '2021-03-12' },
  { id: 13, nome: 'Prof. J. Moraes', login: 'j.moraes', role: 'PROFESSOR', ativo: true, c: 'c2', tel: '(11) 98765-0004', materias: ['História', 'Geografia'], turmas: 7, cadastrado: '2018-02-18' },
  { id: 14, nome: 'Prof. M. Santos', login: 'm.santos', role: 'PROFESSOR', ativo: true, c: 'c4', tel: '(11) 98765-0005', materias: ['Biologia'], turmas: 5, cadastrado: '2022-02-01' },
  { id: 15, nome: 'Prof. P. Rocha', login: 'p.rocha', role: 'PROFESSOR', ativo: true, c: 'c8', tel: '(11) 98765-0006', materias: ['Inglês'], turmas: 10, cadastrado: '2019-03-11' },
  // COORD/DIREÇÃO/ADMIN
  { id: 20, nome: 'Clara Beneventi', login: 'clara.beneventi', role: 'COORDENACAO', ativo: true, c: 'c3', tel: '(11) 98765-7000', cargo: 'Coordenadora Pedagógica EM', cadastrado: '2018-01-10' },
  { id: 21, nome: 'Sérgio Paladino', login: 'sergio.paladino', role: 'COORDENACAO', ativo: true, c: 'c7', tel: '(11) 98765-7001', cargo: 'Coordenador EF II', cadastrado: '2017-02-03' },
  { id: 22, nome: 'Yodo Master', login: 'diretor', role: 'DIRECAO', ativo: true, c: 'c6', tel: '(11) 98765-9999', cargo: 'Diretor Geral', cadastrado: '2015-01-05' },
  { id: 23, nome: 'Marina Costa', login: 'm.costa', role: 'ADMINISTRADOR', ativo: true, c: 'c5', tel: '(11) 98765-8000', cargo: 'Secretaria Acadêmica', cadastrado: '2019-04-20' },
  { id: 24, nome: 'Roberto Silva', login: 'r.silva', role: 'ADMINISTRADOR', ativo: false, c: 'c2', tel: '(11) 98765-8001', cargo: 'Secretaria Financeira', cadastrado: '2016-06-15' },
];

const ROLES_USU = [
  { id: 'TODOS', label: 'Todos', cor: 'var(--ink-2)' },
  { id: 'ALUNO', label: 'Alunos', cor: '#3F6FB0' },
  { id: 'PROFESSOR', label: 'Professores', cor: '#2F7F5E' },
  { id: 'COORDENACAO', label: 'Coordenação', cor: '#B5832A' },
  { id: 'DIRECAO', label: 'Direção', cor: '#9C5580' },
  { id: 'ADMINISTRADOR', label: 'Admin/Secretaria', cor: '#A8473A' },
];

const roleLabel = (r) => ({ ALUNO: 'Aluno', PROFESSOR: 'Professor', COORDENACAO: 'Coordenação', DIRECAO: 'Direção', ADMINISTRADOR: 'Admin' }[r] || r);
const roleColor = (r) => ({ ALUNO: '#3F6FB0', PROFESSOR: '#2F7F5E', COORDENACAO: '#B5832A', DIRECAO: '#9C5580', ADMINISTRADOR: '#A8473A' }[r] || 'var(--ink-3)');

const Usuarios = () => {
  const [role, setRole] = React.useState('TODOS');
  const [busca, setBusca] = React.useState('');
  const [apenasAtivos, setApenasAtivos] = React.useState(true);
  const [ficha, setFicha] = React.useState(null);
  const [novoOpen, setNovoOpen] = React.useState(false);

  const filt = USU_DATA.filter(u => {
    if (role !== 'TODOS' && u.role !== role) return false;
    if (apenasAtivos && !u.ativo) return false;
    if (busca) {
      const t = busca.toLowerCase();
      if (!u.nome.toLowerCase().includes(t) && !u.login.toLowerCase().includes(t) && !(u.rm || '').includes(t)) return false;
    }
    return true;
  });

  const counts = React.useMemo(() => {
    const c = { TODOS: 0, ALUNO: 0, PROFESSOR: 0, COORDENACAO: 0, DIRECAO: 0, ADMINISTRADOR: 0 };
    USU_DATA.forEach(u => { if (!apenasAtivos || u.ativo) { c.TODOS++; c[u.role]++; } });
    return c;
  }, [apenasAtivos]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Pessoas · Usuários</div>
          <h1 className="page-title">Usuários do sistema</h1>
          <div className="page-subtitle">{counts.TODOS} {apenasAtivos ? 'ativos' : 'no total'} · {counts.ALUNO} alunos · {counts.PROFESSOR} professores · {counts.COORDENACAO + counts.DIRECAO + counts.ADMINISTRADOR} equipe</div>
        </div>
        <div className="row">
          <button className="btn"><Icon name="download" size={13}/>Exportar</button>
          <button className="btn accent" onClick={()=>setNovoOpen(true)}><Icon name="plus"/>Novo usuário</button>
        </div>
      </div>

      {/* Filtro por role — chips grandes */}
      <div className="card" style={{ padding: 12, marginBottom: 16 }}>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {ROLES_USU.map(r => (
            <button key={r.id} onClick={()=>setRole(r.id)} className="role-chip" data-on={role === r.id}>
              <span className="dotx" style={{ background: r.cor }}/>
              <span className="lbl">{r.label}</span>
              <span className="n">{counts[r.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative', maxWidth: 420 }}>
            <input className="input" placeholder="Buscar por nome, login ou RM…" value={busca} onChange={e=>setBusca(e.target.value)} style={{ paddingLeft: 32 }}/>
            <Icon name="search" size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }}/>
          </div>
          <label className="row" style={{ gap: 6, fontSize: 12, color: 'var(--ink-2)', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={apenasAtivos} onChange={e=>setApenasAtivos(e.target.checked)}/>
            Apenas ativos
          </label>
          <div style={{ flex: 1 }}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{filt.length} {filt.length === 1 ? 'resultado' : 'resultados'}</span>
        </div>

        <table className="table">
          <thead><tr>
            <th style={{ width: 36 }}><input type="checkbox"/></th>
            <th>Nome</th>
            <th>Login</th>
            <th>Perfil</th>
            <th>Contato / Vínculo</th>
            <th>Status</th>
            <th style={{ width: 80 }}></th>
          </tr></thead>
          <tbody>
            {filt.map(u => (
              <tr key={u.id} onClick={()=>setFicha(u)} style={{ cursor: 'pointer' }}>
                <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <span className={`avatar sm ${u.c}`}>{u.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
                    <div>
                      <div className="strong">{u.nome}</div>
                      {u.rm && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>RM {u.rm}</div>}
                      {u.cargo && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.cargo}</div>}
                    </div>
                  </div>
                </td>
                <td><span className="mono" style={{ fontSize: 11.5 }}>{u.login}</span></td>
                <td>
                  <span className="chip" style={{ borderColor: roleColor(u.role) + '55', background: roleColor(u.role) + '12', color: roleColor(u.role) }}>
                    <span className="dot" style={{ background: roleColor(u.role) }}/>{roleLabel(u.role)}
                  </span>
                </td>
                <td>
                  {u.role === 'ALUNO' ? (
                    <div style={{ fontSize: 11.5 }}>
                      <div>{u.turmaAtual || <span style={{ color: 'var(--ink-4)' }}>Sem turma</span>}</div>
                      <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{u.responsaveis} resp. · {u.tel}</div>
                    </div>
                  ) : u.role === 'PROFESSOR' ? (
                    <div style={{ fontSize: 11.5 }}>
                      <div>{u.materias?.join(' · ')}</div>
                      <div style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>{u.turmas} turmas · {u.tel}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11.5, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>{u.tel}</div>
                  )}
                </td>
                <td>
                  {u.ativo
                    ? <span className="chip ok"><span className="dot"/>Ativo</span>
                    : <span className="chip bad"><span className="dot"/>Inativo</span>}
                </td>
                <td onClick={e=>e.stopPropagation()}>
                  <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                    <button className="icon-btn sm" title="Ver ficha" onClick={()=>setFicha(u)}><Icon name="eye" size={13}/></button>
                    <button className="icon-btn sm" title="Editar"><Icon name="edit" size={13}/></button>
                    <button className="icon-btn sm" title="Mais"><Icon name="dots" size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filt.length === 0 && (
              <tr><td colSpan={7}>
                <div className="empty" style={{ margin: 20 }}>
                  <div className="t">Nenhum usuário encontrado</div>
                  <div className="s">ajuste os filtros ou a busca</div>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {ficha && <FichaUsuario usuario={ficha} onClose={()=>setFicha(null)}/>}
      {novoOpen && <NovoUsuarioModal onClose={()=>setNovoOpen(false)}/>}
    </div>
  );
};

// Ficha do usuário — drawer lateral grande
const FichaUsuario = ({ usuario, onClose }) => {
  const u = usuario;
  const [tab, setTab] = React.useState('dados');
  const isAluno = u.role === 'ALUNO';

  React.useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const idade = u.nasc ? Math.floor((new Date() - new Date(u.nasc)) / (365.25 * 864e5)) : null;
  const fmtD = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e=>e.stopPropagation()}>
        <div className="drawer-head">
          <div className="row" style={{ gap: 14, alignItems: 'center' }}>
            <span className={`avatar ${u.c}`} style={{ width: 56, height: 56, fontSize: 18 }}>{u.nome.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>
            <div style={{ flex: 1 }}>
              <div className="card-eyebrow" style={{ marginBottom: 2 }}>Ficha · {roleLabel(u.role)}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{u.nome}</div>
              <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                @{u.login}{u.rm ? ` · RM ${u.rm}` : ''}{u.turmaAtual ? ` · ${u.turmaAtual}` : ''}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn sm"><Icon name="edit" size={12}/>Editar</button>
            <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
          </div>
        </div>

        {isAluno && (
          <div className="ficha-kpis">
            <KpiSm label="Média bimestral" value={u.media.toFixed(1)} tone={u.media >= 7 ? 'ok' : 'warn'}/>
            <KpiSm label="Frequência" value={`${u.freq}%`} tone={u.freq >= 75 ? 'ok' : 'bad'}/>
            <KpiSm label="Responsáveis" value={u.responsaveis} tone={u.responsaveis > 0 ? 'ok' : 'warn'}/>
            <KpiSm label="Contrato" value={u.contratoAtivo ? 'Ativo' : 'Sem'} tone={u.contratoAtivo ? 'ok' : 'bad'}/>
          </div>
        )}

        <div className="drawer-tabs">
          <button className={tab === 'dados' ? 'on' : ''} onClick={()=>setTab('dados')}>Dados</button>
          {isAluno && <button className={tab === 'academico' ? 'on' : ''} onClick={()=>setTab('academico')}>Acadêmico</button>}
          {isAluno && <button className={tab === 'historico' ? 'on' : ''} onClick={()=>setTab('historico')}>Histórico</button>}
          {isAluno && <button className={tab === 'financeiro' ? 'on' : ''} onClick={()=>setTab('financeiro')}>Financeiro</button>}
          {u.role === 'PROFESSOR' && <button className={tab === 'turmas' ? 'on' : ''} onClick={()=>setTab('turmas')}>Turmas & matérias</button>}
          <button className={tab === 'acesso' ? 'on' : ''} onClick={()=>setTab('acesso')}>Acesso</button>
        </div>

        <div className="drawer-body">
          {tab === 'dados' && (
            <>
              <FichaSec title="Identificação">
                <FichaRow label="Nome completo" value={u.nome}/>
                <FichaRow label="Login" value={<span className="mono">@{u.login}</span>}/>
                {u.rm && <FichaRow label="RM" value={<span className="mono">{u.rm}</span>}/>}
                {u.nasc && <FichaRow label="Nascimento" value={`${fmtD(u.nasc)} · ${idade} anos`}/>}
                {u.cargo && <FichaRow label="Cargo" value={u.cargo}/>}
              </FichaSec>
              {isAluno && (
                <FichaSec title="Filiação & contato">
                  <FichaRow label="Mãe" value={u.nomeMae || '—'}/>
                  <FichaRow label="Pai" value={u.nomePai || <span style={{ color: 'var(--ink-4)' }}>não informado</span>}/>
                  <FichaRow label="Telefone" value={<span className="mono">{u.tel}</span>}/>
                </FichaSec>
              )}
              {!isAluno && u.tel && (
                <FichaSec title="Contato">
                  <FichaRow label="Telefone" value={<span className="mono">{u.tel}</span>}/>
                </FichaSec>
              )}
              <FichaSec title="Sistema">
                <FichaRow label="Cadastrado em" value={fmtD(u.cadastrado)}/>
                <FichaRow label="Status" value={u.ativo ? <span className="chip ok"><span className="dot"/>Ativo</span> : <span className="chip bad"><span className="dot"/>Inativo</span>}/>
              </FichaSec>
            </>
          )}

          {tab === 'academico' && isAluno && (
            <>
              <FichaSec title="Turma atual">
                <FichaRow label="Turma" value={u.turmaAtual || '—'}/>
                <FichaRow label="Ano letivo" value="2026"/>
                <FichaRow label="Turno" value="Manhã"/>
              </FichaSec>
              <FichaSec title="Desempenho · 2º bimestre">
                <div className="mini-grade">
                  {['Português 8.5', 'Matemática 7.8', 'História 9.0', 'Geografia 8.3', 'Biologia 9.2', 'Química 7.5', 'Física 8.0', 'Inglês 9.5'].map(m => {
                    const [mat, nota] = m.split(/ (?=\d)/);
                    const n = parseFloat(nota);
                    return (
                      <div key={mat} className="mg-row">
                        <span className="mg-m">{mat}</span>
                        <div className="mg-bar"><div style={{ width: `${n * 10}%`, background: n >= 7 ? 'var(--ok)' : 'var(--warn)' }}/></div>
                        <span className="mg-n" style={{ color: n >= 7 ? 'var(--ok)' : 'var(--warn)' }}>{nota}</span>
                      </div>
                    );
                  })}
                </div>
              </FichaSec>
            </>
          )}

          {tab === 'historico' && isAluno && (
            <FichaSec title="Histórico de matrículas">
              <div className="timeline">
                {[
                  { ano: '2026', turma: '3ª Série EM — A', situ: 'Em curso', cor: 'var(--accent)' },
                  { ano: '2025', turma: '2ª Série EM — A', situ: 'Aprovado · média 8.5', cor: 'var(--ok)' },
                  { ano: '2024', turma: '1ª Série EM — A', situ: 'Aprovado · média 8.1', cor: 'var(--ok)' },
                  { ano: '2023', turma: '9º Ano EF — B', situ: 'Aprovado · média 7.9', cor: 'var(--ok)' },
                ].map((h, i, arr) => (
                  <div key={i} className="tl-item">
                    <div className="tl-dot" style={{ background: h.cor }}/>
                    {i < arr.length - 1 && <div className="tl-line"/>}
                    <div className="tl-body">
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <div className="strong" style={{ fontSize: 13 }}>{h.turma}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{h.ano}</div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{h.situ}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FichaSec>
          )}

          {tab === 'financeiro' && isAluno && (
            <>
              <FichaSec title="Contrato 2026">
                <FichaRow label="Mensalidade" value={<span className="mono">R$ 1.850,00</span>}/>
                <FichaRow label="Desconto" value={<span className="mono">10% · irmão</span>}/>
                <FichaRow label="Vencimento" value="Dia 5"/>
                <FichaRow label="Status" value={<span className="chip ok"><span className="dot"/>Em dia</span>}/>
              </FichaSec>
              <FichaSec title="Parcelas · últimos 6 meses">
                <div className="parcelas-mini">
                  {[
                    { m: 'Abr', v: 1665, s: 'pendente' },
                    { m: 'Mar', v: 1665, s: 'pago' },
                    { m: 'Fev', v: 1665, s: 'pago' },
                    { m: 'Jan', v: 1665, s: 'pago' },
                    { m: 'Dez', v: 1850, s: 'pago' },
                    { m: 'Nov', v: 1850, s: 'pago' },
                  ].map((p, i) => (
                    <div key={i} className={`pcl ${p.s}`}>
                      <div className="pcl-m">{p.m}</div>
                      <div className="pcl-v mono">R$ {p.v.toLocaleString('pt-BR')}</div>
                      <div className="pcl-s">{p.s === 'pago' ? '✓ pago' : 'pendente'}</div>
                    </div>
                  ))}
                </div>
              </FichaSec>
            </>
          )}

          {tab === 'turmas' && u.role === 'PROFESSOR' && (
            <FichaSec title={`${u.turmas} turmas · ${u.materias?.join(', ')}`}>
              <div className="table-mini">
                {[
                  { t: '3ª Série EM — A', m: u.materias[0], h: '2 aulas/sem' },
                  { t: '3ª Série EM — B', m: u.materias[0], h: '2 aulas/sem' },
                  { t: '2ª Série EM — A', m: u.materias[0], h: '2 aulas/sem' },
                  { t: '2ª Série EM — B', m: u.materias[0], h: '2 aulas/sem' },
                ].slice(0, u.turmas).map((x, i) => (
                  <div key={i} className="tm-row">
                    <Icon name="users" size={13} style={{ color: 'var(--ink-3)' }}/>
                    <span className="strong" style={{ fontSize: 12.5 }}>{x.t}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-3)', flex: 1 }}>{x.m}</span>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{x.h}</span>
                  </div>
                ))}
              </div>
            </FichaSec>
          )}

          {tab === 'acesso' && (
            <>
              <FichaSec title="Credenciais">
                <FichaRow label="Login" value={<span className="mono">@{u.login}</span>}/>
                <FichaRow label="Senha" value={<div className="row" style={{ gap: 6 }}><span className="mono" style={{ color: 'var(--ink-3)' }}>••••••••</span><button className="btn sm">Redefinir</button></div>}/>
                <FichaRow label="Último acesso" value={<span className="mono">22/04/2026 · 08:14</span>}/>
                <FichaRow label="2FA" value={<span className="chip bad"><span className="dot"/>Desabilitado</span>}/>
              </FichaSec>
              <FichaSec title="Permissões">
                <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                  Perfil <span className="strong">{roleLabel(u.role)}</span> — permissões herdadas do perfil.
                </div>
              </FichaSec>
              <FichaSec title="Ações">
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn sm">Enviar nova senha por e-mail</button>
                  <button className="btn sm">Forçar 2FA</button>
                  <button className="btn sm" style={{ color: u.ativo ? 'var(--warn)' : 'var(--ok)', borderColor: 'var(--line)' }}>
                    {u.ativo ? 'Inativar usuário' : 'Reativar usuário'}
                  </button>
                  <button className="btn sm" style={{ color: 'var(--bad)' }}>Excluir permanentemente</button>
                </div>
              </FichaSec>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const FichaSec = ({ title, children }) => (
  <section style={{ marginBottom: 18 }}>
    <div className="card-eyebrow" style={{ marginBottom: 8 }}>{title}</div>
    <div>{children}</div>
  </section>
);

const FichaRow = ({ label, value }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
    <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{label}</span>
    <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{value}</span>
  </div>
);

const KpiSm = ({ label, value, tone }) => (
  <div className="kpi-sm">
    <div className="kpi-l">{label}</div>
    <div className="kpi-v" style={{ color: tone === 'ok' ? 'var(--ok)' : tone === 'bad' ? 'var(--bad)' : 'var(--warn)' }}>{value}</div>
  </div>
);

// Modal — novo usuário
const NovoUsuarioModal = ({ onClose }) => {
  const [role, setRole] = React.useState('ALUNO');
  const [form, setForm] = React.useState({ nome: '', login: '', senha: '', nasc: '', mae: '', pai: '', tel: '' });
  const upd = (k, v) => setForm(s => ({ ...s, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="card-eyebrow">Novo usuário</div>
            <div className="modal-title">Cadastrar usuário</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>perfil define campos obrigatórios</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x"/></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 8 }}>Perfil</label>
            <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
              {ROLES_USU.filter(r => r.id !== 'TODOS').map(r => (
                <button key={r.id} onClick={()=>setRole(r.id)} className="role-chip" data-on={role === r.id}>
                  <span className="dotx" style={{ background: r.cor }}/>
                  <span className="lbl">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <FieldL label="Nome completo" span={2}><input className="input" placeholder="Ex: Bruno Badeschi" value={form.nome} onChange={e=>upd('nome', e.target.value)}/></FieldL>
            <FieldL label="Login"><input className="input mono" placeholder="bruno.badeschi" value={form.login} onChange={e=>upd('login', e.target.value)}/></FieldL>
            <FieldL label="Senha"><input className="input" type="password" placeholder="••••••••" value={form.senha} onChange={e=>upd('senha', e.target.value)}/></FieldL>

            {role === 'ALUNO' && (
              <>
                <FieldL label="Data de nascimento"><input className="input" type="date" value={form.nasc} onChange={e=>upd('nasc', e.target.value)}/></FieldL>
                <FieldL label="Telefone"><input className="input mono" placeholder="(11) 98765-4321" value={form.tel} onChange={e=>upd('tel', e.target.value)}/></FieldL>
                <FieldL label="Nome da mãe" span={2}><input className="input" placeholder="Nome completo" value={form.mae} onChange={e=>upd('mae', e.target.value)}/></FieldL>
                <FieldL label="Nome do pai" span={2}><input className="input" placeholder="Nome completo (opcional)" value={form.pai} onChange={e=>upd('pai', e.target.value)}/></FieldL>
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            Um e-mail com as credenciais será enviado se houver e-mail cadastrado.
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn accent"><Icon name="check"/>Criar usuário</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reexporta FieldL caso não exista global — definido em Lancamentos.jsx
if (typeof window.FieldL === 'undefined') {
  window.FieldL = ({ label, span, children }) => (
    <div style={{ gridColumn: span === 2 ? 'span 2' : 'auto' }}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

Object.assign(window, { Usuarios });
