import { useState } from "react";
import AppShell from "./AppShell";
import Inicio from "./pages/Inicio";

export default function NewUIRoot() {
  const [section, setSection] = useState("inicio");
  const [page, setPage] = useState(null);

  const handleNav = (id) => {
    setSection(id);
    setPage(null);
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
      {section === "inicio" ? (
        <Inicio />
      ) : (
        <div className="page">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Em breve</div>
              <h1 className="page-title">Módulo {section}</h1>
              <div className="page-subtitle">
                Este módulo será migrado em breve.
              </div>
            </div>
          </div>
          <div className="empty">
            <div className="t">Em breve</div>
            <div className="s">ESTE MÓDULO ESTÁ SENDO MIGRADO</div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
