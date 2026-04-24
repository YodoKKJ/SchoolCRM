// AppShell - Top bar, sub-nav, theme toggle
const NAV = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'academico', label: 'Acadêmico', icon: 'school', hasSub: true },
  { id: 'pessoas', label: 'Pessoas', icon: 'users', hasSub: true },
  { id: 'financeiro', label: 'Financeiro', icon: 'dollar', hasSub: true },
  { id: 'comunicacao', label: 'Comunicação', icon: 'mail' },
  { id: 'relatorios', label: 'Relatórios', icon: 'chart' },
];

const SUBNAV = {
  academico: [
    { id: 'turmas', label: 'Turmas', icon: 'users', count: 24 },
    { id: 'materias', label: 'Matérias', icon: 'book', count: 18 },
    { id: 'horarios', label: 'Horários', icon: 'calendar' },
    { id: 'atrasos', label: 'Atrasos', icon: 'clock', count: 7 },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'edit' },
    { id: 'boletins', label: 'Boletins', icon: 'clipboard' },
  ],
  pessoas: [
    { id: 'usuarios', label: 'Usuários', icon: 'users' },
    { id: 'responsaveis', label: 'Responsáveis', icon: 'users' },
  ],
  financeiro: [
    { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
    { id: 'contratos', label: 'Contratos', icon: 'clipboard' },
    { id: 'receber', label: 'Contas a Receber', icon: 'dollar' },
    { id: 'pagar', label: 'Contas a Pagar', icon: 'dollar' },
  ],
};

const AppShell = ({ section, page, onNav, onSubNav, theme, setTheme, tweaks, children }) => {
  const subs = SUBNAV[section] || [];
  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <div className="brand">
            <img src="assets/skolyo-logo.svg" alt="Skolyo"/>
            <div>
              <div className="brand-name">Skolyo</div>
              <div className="brand-sub">ERP · 2026</div>
            </div>
          </div>
          <nav className="topnav">
            {NAV.map(n => (
              <div key={n.id} className={`tnav ${section === n.id ? 'active' : ''}`} onClick={() => onNav(n.id)}>
                <Icon name={n.icon}/>
                {n.label}
                {n.hasSub && <Icon name="chevDown" size={10}/>}
              </div>
            ))}
          </nav>
          <div className="top-right">
            <div className="search">
              <Icon name="search" size={13}/>
              <span>Buscar alunos, turmas…</span>
              <span className="kbd">⌘K</span>
            </div>
            <button className="icon-btn" title="Tema" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              <Icon name={theme === 'light' ? 'moon' : 'sun'}/>
            </button>
            <button className="icon-btn" title="Notificações"><Icon name="bell"/><span className="badge"></span></button>
            <button className="icon-btn" title="Configurações"><Icon name="settings"/></button>
            <div className="user-chip">
              <div className="avatar">YM</div>
              <div>
                <div className="name">Yodo Master</div>
                <div className="role">Direção</div>
              </div>
              <Icon name="chevDown" size={10}/>
            </div>
          </div>
        </div>
        {subs.length > 0 && (
          <div className="subnav">
            {subs.map(s => (
              <div key={s.id} className={`snav ${page === s.id ? 'active' : ''}`} onClick={() => onSubNav(s.id)}>
                <Icon name={s.icon} size={13}/>
                {s.label}
                {s.count != null && <span className="count">{s.count}</span>}
              </div>
            ))}
            <div className="ctx">
              <span>Escola Dom Bosco</span>
              <span className="pill">3ª Série EM — A</span>
              <span>2026</span>
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      {tweaks}
    </>
  );
};

Object.assign(window, { AppShell });
