// Início - Dashboard rico da direção
const KPIS = [
  { k: 'alunos', label: 'Alunos', value: 342, sub: 'em 2026', icon: 'eye', color: '#52626F' },
  { k: 'profs', label: 'Professores', value: 18, sub: 'ativos', icon: 'users', color: '#3F6FB0' },
  { k: 'turmas', label: 'Turmas', value: 12, sub: 'em curso', icon: 'school', color: '#2F7F5E' },
  { k: 'mat', label: 'Matérias', value: 14, sub: 'cadastradas', icon: 'book', color: '#6A4FA6' },
  { k: 'media', label: 'Média geral', value: '7.8', sub: 'todas as turmas', icon: 'chart', color: '#3F6FB0' },
  { k: 'risco', label: 'Em risco', value: 9, sub: 'de reprovação', icon: 'alert', color: '#C04A3A' },
];

const DESEMPENHO = [
  { t: '6º A', media: 7.8, freq: 94 },
  { t: '6º B', media: 7.2, freq: 91 },
  { t: '7º A', media: 8.1, freq: 96 },
  { t: '8º A', media: 7.9, freq: 93 },
  { t: '9º A', media: 7.0, freq: 89 },
  { t: '9º B', media: 6.8, freq: 87 },
  { t: '1ª EM A', media: 8.2, freq: 95 },
  { t: '1ª EM B', media: 7.7, freq: 92 },
  { t: '2ª EM A', media: 8.5, freq: 96 },
  { t: '2ª EM B', media: 8.0, freq: 94 },
  { t: '3ª EM A', media: 8.7, freq: 97 },
  { t: '3ª EM B', media: 8.3, freq: 95 },
];

const ALERTAS = [
  { aluno: 'Felipe Pardolfo', c: 'c2', turma: '3ª EM A', media: 4.7, freq: 62, discs: ['Matemática', 'Física'] },
  { aluno: 'Victor Vilanova', c: 'c6', turma: '3ª EM A', media: 5.2, freq: 68, discs: ['Matemática', 'Química'] },
  { aluno: 'Lucas Teodoro', c: 'c4', turma: '1ª EM A', media: 4.9, freq: 71, discs: ['Português', 'História'] },
  { aluno: 'Pedro Altavilla', c: 'c6', turma: '9º A', media: 5.5, freq: 74, discs: ['Geografia'] },
  { aluno: 'Sofia Prates', c: 'c7', turma: '2ª EM B', media: 5.1, freq: 69, discs: ['Biologia', 'Química'] },
];

const RANKING = [
  { pos: 1, t: '3ª Série EM — A', alunos: 32, media: 8.7, risco: 1 },
  { pos: 2, t: '2ª Série EM — A', alunos: 28, media: 8.5, risco: 1 },
  { pos: 3, t: '3ª Série EM — B', alunos: 29, media: 8.3, risco: 2 },
  { pos: 4, t: '1ª Série EM — A', alunos: 31, media: 8.2, risco: 2 },
  { pos: 5, t: '7º Ano EF — A', alunos: 30, media: 8.1, risco: 0 },
  { pos: 6, t: '2ª Série EM — B', alunos: 26, media: 8.0, risco: 1 },
  { pos: 7, t: '8º Ano EF — A', alunos: 29, media: 7.9, risco: 1 },
  { pos: 8, t: '6º Ano EF — A', alunos: 28, media: 7.8, risco: 0 },
];

const Inicio = () => {
  const totalAlunos = 342;
  const emRisco = 9;
  const regular = totalAlunos - emRisco;
  const freqGeral = 90;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Painel da direção · Escola Dom Bosco · 2026</div>
          <h1 className="page-title">Bom dia, Yodo.</h1>
          <div className="page-subtitle">Terça, 14 de abril de 2026 · 7 tarefas pendentes · 2 alunos em risco crítico</div>
        </div>
        <div className="row">
          <button className="btn"><Icon name="download"/>Relatório consolidado</button>
          <button className="btn accent"><Icon name="plus"/>Ação rápida</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid mb-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {KPIS.map(k => (
          <div key={k.k} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ height: 3, background: k.color }}/>
            <div style={{ padding: 16 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: 4, background: 'var(--bg-2)', color: k.color, display: 'grid', placeItems: 'center' }}>
                  <Icon name={k.icon} size={14}/>
                </span>
              </div>
              <div className="metric" style={{ margin: 0 }}>
                <div className="label">{k.label}</div>
                <div className="value" style={{ fontSize: 32 }}>{k.value}</div>
                <div className="delta">{k.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desempenho + Situação dos Alunos */}
      <div className="grid mb-4" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="section-head">
            <div>
              <div className="t">Desempenho por turma</div>
              <div className="s">Média geral e frequência · 12 turmas</div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="row" style={{ gap: 6, fontSize: 11, color: 'var(--ink-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }}/> Média
              </span>
              <span className="row" style={{ gap: 6, fontSize: 11, color: 'var(--ink-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3F6FB0' }}/> Frequência %
              </span>
            </div>
          </div>
          <div style={{ padding: '24px 20px 16px' }}>
            <BarChart data={DESEMPENHO}/>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="section-head">
            <div>
              <div className="t">Situação dos alunos</div>
              <div className="s">Visão geral</div>
            </div>
            <span className="chip">{totalAlunos} total</span>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Donut regular={regular} risco={emRisco}/>
            <div style={{ width: '100%' }}>
              <LegendRow color="var(--ok)" label="Regulares" value={regular} pct={Math.round(regular/totalAlunos*100)}/>
              <LegendRow color="var(--bad)" label="Em risco" value={emRisco} pct={Math.round(emRisco/totalAlunos*100)}/>
              <LegendRow color="var(--warn)" label="Atenção" value={18} pct={5}/>
            </div>
          </div>
        </div>
      </div>

      {/* Frequência geral */}
      <div className="card mb-4">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <div className="card-eyebrow">Frequência geral · escola</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>média dos últimos 30 dias · limite legal 75%</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--ok)', lineHeight: 1 }}>{freqGeral}%</div>
        </div>
        <div style={{ position: 'relative', height: 8, background: 'var(--bg-2)', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${freqGeral}%`, background: 'var(--ok)' }}/>
          <div style={{ position: 'absolute', left: '75%', top: -2, bottom: -2, width: 2, background: 'var(--warn)' }}/>
        </div>
        <div className="row between" style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
          <span>0%</span>
          <span style={{ marginLeft: '72%', color: 'var(--warn)' }}>mínimo 75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Alertas + Tarefas do Dia + Agenda */}
      <div className="grid mb-4" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-head">
            <div className="row" style={{ gap: 10 }}>
              <Icon name="alert" size={15}/>
              <div>
                <div className="t">Alertas de risco de reprovação</div>
                <div className="s">{ALERTAS.length} alunos precisam de intervenção</div>
              </div>
            </div>
            <button className="btn sm">Ver todos</button>
          </div>
          <table className="table">
            <thead><tr>
              <th>Aluno</th>
              <th>Turma</th>
              <th style={{ textAlign: 'right' }}>Média</th>
              <th style={{ textAlign: 'right' }}>Frequência</th>
              <th>Disciplinas com problema</th>
              <th style={{ width: 40 }}></th>
            </tr></thead>
            <tbody>
              {ALERTAS.map((a, i) => (
                <tr key={i}>
                  <td><span className="row"><span className={`avatar sm ${a.c}`}>{a.aluno.split(' ').map(n=>n[0]).slice(0,2).join('')}</span><span className="strong">{a.aluno}</span></span></td>
                  <td>{a.turma}</td>
                  <td className="num strong" style={{ textAlign: 'right', color: 'var(--bad)' }}>{a.media.toFixed(1)}</td>
                  <td className="num" style={{ textAlign: 'right', color: a.freq >= 75 ? 'var(--ink-2)' : 'var(--bad)' }}>{a.freq}%</td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                      {a.discs.map(d => <span key={d} className="chip bad" style={{ fontSize: 9.5 }}>{d}</span>)}
                    </div>
                  </td>
                  <td><button className="icon-btn"><Icon name="chev"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="section-head">
              <div>
                <div className="t">Tarefas do dia</div>
                <div className="s">5 pendentes</div>
              </div>
              <button className="icon-btn"><Icon name="plus"/></button>
            </div>
            {[
              { t: 'Publicar boletins do 2º bimestre', s: 'Acadêmico · Boletins', c: 'info', i: 'clipboard', due: 'até 20 abr' },
              { t: 'Aprovar lançamentos — Química 3ª EM A', s: 'Lançamentos', c: 'warn', i: 'edit', due: 'hoje' },
              { t: 'Justificar 3 atrasos pendentes', s: 'Atrasos', c: 'bad', i: 'clock', due: 'urgente' },
              { t: 'Assinar 12 contratos de rematrícula', s: 'Financeiro', c: 'info', i: 'clipboard', due: 'esta semana' },
              { t: 'Responder 4 comunicados', s: 'Comunicação', c: 'warn', i: 'mail', due: 'hoje' },
            ].map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < 4 ? '1px solid var(--line)' : 'none' }}>
                <span style={{ width: 28, height: 28, borderRadius: 4, background: `var(--${task.c}-soft)`, color: `var(--${task.c === 'info' ? 'info' : task.c === 'warn' ? 'warn' : 'bad'})`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <Icon name={task.i} size={13}/>
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3, marginBottom: 2 }}>{task.t}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-3)' }}>{task.s} · {task.due}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="section-head">
              <div>
                <div className="t">Hoje no calendário</div>
                <div className="s">14 abr · 4 eventos</div>
              </div>
              <button className="icon-btn"><Icon name="calendar"/></button>
            </div>
            {[
              { h: '09:00', t: 'Reunião pedagógica — EF2', loc: 'Sala dos professores', c: 'info' },
              { h: '11:00', t: 'Conselho de classe — 3ª EM A', loc: 'Sala 302', c: 'accent' },
              { h: '14:30', t: 'Visita pais — família Altavilla', loc: 'Direção', c: 'warn' },
              { h: '16:00', t: 'Treinamento LGPD', loc: 'Online', c: 'info' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 14px', borderBottom: i < 3 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ width: 3, borderRadius: 2, background: e.c === 'accent' ? 'var(--accent)' : e.c === 'warn' ? 'var(--warn)' : 'var(--info)' }}/>
                <div className="num" style={{ fontSize: 12, color: 'var(--ink-2)', width: 40, fontWeight: 500, flexShrink: 0 }}>{e.h}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.3 }}>{e.t}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-3)', marginTop: 2 }}>{e.loc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="section-head">
          <div>
            <div className="t">Ranking de turmas — 2026</div>
            <div className="s">{RANKING.length} turmas ordenadas por média geral</div>
          </div>
          <button className="btn sm">Exportar ranking</button>
        </div>
        <table className="table">
          <thead><tr>
            <th style={{ width: 40 }}>#</th>
            <th>Turma</th>
            <th style={{ textAlign: 'right' }}>Alunos</th>
            <th style={{ textAlign: 'right' }}>Média</th>
            <th style={{ textAlign: 'right' }}>Em risco</th>
            <th style={{ width: 200 }}>Desempenho</th>
          </tr></thead>
          <tbody>
            {RANKING.map(r => (
              <tr key={r.pos}>
                <td className="num" style={{ fontWeight: r.pos <= 3 ? 600 : 400, color: r.pos <= 3 ? 'var(--accent)' : 'var(--ink-4)' }}>{r.pos}º</td>
                <td className="strong">{r.t}</td>
                <td className="num" style={{ textAlign: 'right' }}>{r.alunos}</td>
                <td className="num strong" style={{ textAlign: 'right' }}>{r.media.toFixed(1)}</td>
                <td className="num" style={{ textAlign: 'right', color: r.risco > 0 ? 'var(--bad)' : 'var(--ink-3)' }}>{r.risco}</td>
                <td>
                  <div className="progress" style={{ width: 180 }}>
                    <span style={{ width: `${r.media*10}%`, background: r.media >= 8 ? 'var(--ok)' : r.media >= 7 ? 'var(--accent)' : 'var(--warn)' }}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BarChart = ({ data }) => {
  const max = 10;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 160, position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: '50%', marginRight: 1, height: `${d.media/max*100}%`, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }}/>
            <div style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: 1, right: 0, height: `${d.freq}%`, background: '#3F6FB0', opacity: 0.7, borderRadius: '2px 2px 0 0' }}/>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{d.t}</div>
        </div>
      ))}
    </div>
  );
};

const Donut = ({ regular, risco }) => {
  const total = regular + risco;
  const r = 62;
  const circ = 2 * Math.PI * r;
  const regularLen = circ * (regular/total);
  const riscoLen = circ * (risco/total);
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="18"/>
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--ok)" strokeWidth="18" strokeDasharray={`${regularLen} ${circ}`} transform="rotate(-90 90 90)" strokeLinecap="butt"/>
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--bad)" strokeWidth="18" strokeDasharray={`${riscoLen} ${circ}`} strokeDashoffset={-regularLen} transform="rotate(-90 90 90)"/>
      <text x="90" y="86" textAnchor="middle" style={{ fontFamily: 'var(--font-display)', fontSize: 30, fill: 'var(--ink)' }}>{total}</text>
      <text x="90" y="106" textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fill: 'var(--ink-3)', letterSpacing: '0.1em' }}>ALUNOS</text>
    </svg>
  );
};

const LegendRow = ({ color, label, value, pct }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
    <span style={{ width: 10, height: 10, borderRadius: 2, background: color }}/>
    <span style={{ fontSize: 12.5, flex: 1 }}>{label}</span>
    <span className="num strong" style={{ fontSize: 12.5 }}>{value}</span>
    <span className="num" style={{ fontSize: 11, color: 'var(--ink-3)', width: 36, textAlign: 'right' }}>{pct}%</span>
  </div>
);

Object.assign(window, { Inicio });
