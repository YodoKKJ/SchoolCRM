import { useEffect, useState } from "react";
import AppShell from "./AppShell";
import Inicio from "./pages/Inicio";
import Turmas from "./pages/Turmas";
import Materias from "./pages/Materias";
import Horarios from "./pages/Horarios";
import Atrasos from "./pages/Atrasos";
import Lancamentos from "./pages/Lancamentos";
import Boletins from "./pages/Boletins";
import Usuarios from "./pages/Usuarios";
import Pessoas from "./pages/Pessoas";
import Responsaveis from "./pages/Responsaveis";
import FinDashboard from "./pages/FinDashboard";
import FinContratos from "./pages/FinContratos";
import FinReceber from "./pages/FinReceber";
import FinPagar from "./pages/FinPagar";
import FinMovimentacoes from "./pages/FinMovimentacoes";
import FinFuncionarios from "./pages/FinFuncionarios";
import FinConfiguracoes from "./pages/FinConfiguracoes";
import Comunicacao from "./pages/Comunicacao";
import Relatorios from "./pages/Relatorios";

// Default page (sub-nav) por seção
const DEFAULT_PAGE = {
  academico: "turmas",
  pessoas: "usuarios",
  financeiro: "dashboard",
};

// Resolvedor de conteúdo por (section, page)
function renderSection(section, page, onNav) {
  if (section === "inicio") return <Inicio onNav={onNav} />;

  if (section === "academico") {
    if (page === "turmas")      return <Turmas />;
    if (page === "materias")    return <Materias />;
    if (page === "horarios")    return <Horarios />;
    if (page === "atrasos")     return <Atrasos />;
    if (page === "lancamentos") return <Lancamentos />;
    if (page === "boletins")    return <Boletins />;
    return <EmBreve titulo={page || "Acadêmico"} />;
  }

  if (section === "pessoas") {
    if (page === "usuarios")     return <Usuarios />;
    if (page === "pessoas")      return <Pessoas />;
    if (page === "responsaveis") return <Responsaveis />;
    return <EmBreve titulo={page || "Pessoas"} />;
  }

  if (section === "financeiro") {
    if (page === "dashboard")  return <FinDashboard />;
    if (page === "contratos")  return <FinContratos />;
    if (page === "receber")       return <FinReceber />;
    if (page === "pagar")         return <FinPagar />;
    if (page === "movimentacoes") return <FinMovimentacoes />;
    if (page === "funcionarios")  return <FinFuncionarios />;
    return <EmBreve titulo={page || "Financeiro"} />;
  }

  if (section === "comunicacao")   return <Comunicacao />;
  if (section === "relatorios")    return <Relatorios />;
  if (section === "configuracoes") return <FinConfiguracoes />;

  return <EmBreve titulo={section} />;
}

function EmBreve({ titulo }) {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Em breve</div>
          <h1 className="page-title">Módulo {titulo}</h1>
          <div className="page-subtitle">Este módulo está sendo migrado.</div>
        </div>
      </div>
      <div className="empty">
        <div className="t">Em breve</div>
        <div className="s">ESTE MÓDULO ESTÁ SENDO MIGRADO</div>
      </div>
    </div>
  );
}

export default function NewUIRoot() {
  const [section, setSection] = useState("inicio");
  const [page, setPage] = useState(null);

  // Ao trocar de seção, aplica a página default (ex: academico → turmas)
  useEffect(() => {
    if (section && DEFAULT_PAGE[section] && !page) {
      setPage(DEFAULT_PAGE[section]);
    }
  }, [section, page]);

  const handleNav = (id) => {
    setSection(id);
    setPage(DEFAULT_PAGE[id] || null);
  };

  // Callback para navegação interna (ex: botões do painel de professor)
  const handleNavFull = (sectionId, pageId) => {
    setSection(sectionId);
    setPage(pageId || DEFAULT_PAGE[sectionId] || null);
  };

  return (
    <AppShell
      section={section}
      page={page}
      onNav={handleNav}
      onSubNav={setPage}
      contextLabels={[
        { text: "Ano letivo" },
        { text: "2026", pill: true },
      ]}
    >
      {renderSection(section, page, handleNavFull)}
    </AppShell>
  );
}
