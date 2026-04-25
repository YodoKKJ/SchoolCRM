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
import Responsaveis from "./pages/Responsaveis";

// Default page (sub-nav) por seção
const DEFAULT_PAGE = {
  academico: "turmas",
  pessoas: "usuarios",
  financeiro: "dashboard",
};

// Resolvedor de conteúdo por (section, page)
function renderSection(section, page) {
  if (section === "inicio") return <Inicio />;

  if (section === "academico") {
    if (page === "turmas") return <Turmas />;
    if (page === "materias") return <Materias />;
    if (page === "horarios") return <Horarios />;
    if (page === "atrasos") return <Atrasos />;
    if (page === "lancamentos") return <Lancamentos />;
    if (page === "boletins") return <Boletins />;
    return <EmBreve titulo={page || "Acadêmico"} />;
  }

  if (section === "pessoas") {
    if (page === "usuarios") return <Usuarios />;
    if (page === "responsaveis") return <Responsaveis />;
    return <EmBreve titulo={page || "Pessoas"} />;
  }

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
      {renderSection(section, page)}
    </AppShell>
  );
}
