import { useState, useRef } from "react";

// Instala dependências se não tiver:
// npm install jspdf html2canvas

const ESCOLA = {
    nome: "DOM Sistema Educacional",
    endereco: "Avenida Padre Antonio, 190 - CENTRO - CEP 89.874-000",
    telefone: "(49) 3664-4454",
    anoLetivo: new Date().getFullYear(),
};

// ── Helper: média formatada ──────────────────────────────────
function fmt(val) {
    if (val === null || val === undefined) return "";
    const n = Number(val);
    if (isNaN(n)) return "";
    return n.toFixed(1).replace(".", ",");
}

// ── Boletim para impressão/PDF ───────────────────────────────
export function BoletimImpresso({ boletim, logo, dataEmissao }) {
    const hoje = dataEmissao || new Date().toLocaleDateString("pt-BR");

    // Garante 4 bimestres por disciplina
    function getBim(bimestres, num) {
        const b = bimestres ? bimestres[num] : null;
        return {
            nota: b?.media != null ? fmt(b.media) : "",
            faltas: b?.faltas != null ? b.faltas : (b ? 0 : ""),
        };
    }

    const disciplinas = boletim?.disciplinas || [];
    const totalFaltasGeral = boletim?.totalFaltasGeral || 0;
    const freqGeral = boletim?.frequenciaGeral || 100;

    const s = {
        page: { fontFamily: "Arial, sans-serif", fontSize: 10, color: "#000", background: "#fff", padding: "20px 24px", width: 794, minHeight: 1123, boxSizing: "border-box", display: "flex", flexDirection: "column" },
        header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 },
        logoBox: { width: 90, height: 60, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc", overflow: "hidden" },
        logoImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" },
        logoPlaceholder: { fontSize: 9, color: "#aaa", textAlign: "center", padding: 4 },
        escolaInfo: { flex: 1, textAlign: "center", paddingTop: 4 },
        escolaNome: { fontWeight: "bold", fontSize: 11, marginBottom: 2 },
        tituloBox: { background: "#d0d0d0", border: "1px solid #000", textAlign: "center", fontWeight: "bold", fontSize: 13, padding: "5px 0", marginBottom: 8, letterSpacing: ".04em" },
        infoRow: { display: "flex", gap: 0, borderBottom: "1px solid #000", padding: "3px 0", fontSize: 9.5 },
        infoCell: { flex: 1 },
        table: { width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 4 },
        thMain: { border: "1px solid #000", padding: "3px 4px", textAlign: "center", background: "#e8e8e8", fontWeight: "bold" },
        tdDisciplina: { border: "1px solid #000", padding: "2px 4px", textAlign: "left" },
        tdCenter: { border: "1px solid #000", padding: "2px 4px", textAlign: "center", minWidth: 28 },
        tdFinal: { border: "1px solid #000", padding: "2px 4px", textAlign: "center", minWidth: 24 },
        trAlt: { background: "#f5f5f5" },
        obsRow: { border: "1px solid #000", padding: "2px 6px", marginBottom: 0 },
        resultRow: { display: "flex", border: "1px solid #000", borderTop: "none" },
        resultCell: { padding: "3px 6px", fontWeight: "bold", borderRight: "1px solid #000" },
        legendaBox: { fontSize: 8, textAlign: "center", borderTop: "1px solid #000", padding: "3px 0", marginTop: 0 },
        corteLine: { borderTop: "2px dashed #555", margin: "10px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#555", fontSize: 11 },
        protocoloTitulo: { fontWeight: "bold", fontSize: 12, marginBottom: 4 },
        protocoloAluno: { fontWeight: "bold", fontSize: 11, marginBottom: 6 },
        protocoloRow: { display: "flex", gap: 24, fontSize: 9.5, marginBottom: 4 },
        assinaturaRow: { display: "flex", justifyContent: "space-between", marginTop: 16 },
        assinaturaLinha: { borderTop: "1px solid #000", width: 220, textAlign: "center", paddingTop: 2, fontSize: 9 },
    };

    return (
        <div style={s.page}>
            {/* ── Cabeçalho ── */}
            <div style={s.header}>
                <div style={s.logoBox}>
                    {logo
                        ? <img src={logo} style={s.logoImg} alt="Logo escola" />
                        : <span style={s.logoPlaceholder}>Logo da<br/>Escola</span>
                    }
                </div>
                <div style={s.escolaInfo}>
                    <p style={s.escolaNome}>{ESCOLA.nome}</p>
                    <p style={{ fontSize: 9.5, marginBottom: 2 }}>{ESCOLA.endereco}</p>
                    <p style={{ fontSize: 9.5 }}>Telefone: {ESCOLA.telefone}</p>
                </div>
                <div style={{ fontSize: 9, textAlign: "right", minWidth: 120 }}>
                    Data de Emissão: {hoje}
                </div>
            </div>

            {/* ── Título ── */}
            <div style={s.tituloBox}>BOLETIM ESCOLAR</div>

            {/* ── Dados do aluno ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: 9.5, marginBottom: 2 }}>
                <tbody>
                <tr>
                    <td style={{ padding: "2px 6px", width: "18%" }}>Matrícula: <b>{boletim?.aluno?.id || ""}</b></td>
                    <td style={{ padding: "2px 6px" }}>Aluno: <b>{boletim?.aluno?.nome || ""}</b></td>
                    <td style={{ padding: "2px 6px", width: "22%", textAlign: "right" }}>Ano Letivo: <b>{boletim?.turma?.anoLetivo || ESCOLA.anoLetivo}</b></td>
                </tr>
                <tr style={{ borderTop: "1px solid #000" }}>
                    <td style={{ padding: "2px 6px" }}>Turno: <b>MANHÃ</b></td>
                    <td style={{ padding: "2px 6px" }}>
                        Tipo Curso: <b>Ensino Médio</b> &nbsp;&nbsp; Turma: <b>{boletim?.turma?.nome || ""}</b>
                    </td>
                    <td style={{ padding: "2px 6px", textAlign: "right" }}>Nº.Chamada: <b>{boletim?.aluno?.id || ""}</b></td>
                </tr>
                <tr style={{ borderTop: "1px solid #000" }}>
                    <td colSpan={3} style={{ padding: "2px 6px" }}>
                        Série: <b>{boletim?.turma?.serie || ""}</b>
                    </td>
                </tr>
                </tbody>
            </table>

            {/* ── Tabela de notas ── */}
            <table style={s.table}>
                <thead>
                <tr>
                    <th rowSpan={2} style={{ ...s.thMain, textAlign: "left", width: "22%" }}>Disciplinas</th>
                    <th colSpan={2} style={s.thMain}>1 Bimestre</th>
                    <th colSpan={2} style={s.thMain}>2 Bimestre</th>
                    <th colSpan={2} style={s.thMain}>3 Bimestre</th>
                    <th colSpan={2} style={s.thMain}>4 Bimestre</th>
                    <th colSpan={5} style={s.thMain}>Final</th>
                </tr>
                <tr>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>MA</th>
                    <th style={s.thMain}>TF</th>
                    <th style={s.thMain}>Freq%</th>
                    <th style={s.thMain}>MF</th>
                    <th style={s.thMain}>Cons</th>
                </tr>
                </thead>
                <tbody>
                {disciplinas.map((d, i) => {
                    const bimMap = d.bimestres || {};
                    const b1 = getBim(bimMap, 1);
                    const b2 = getBim(bimMap, 2);
                    const b3 = getBim(bimMap, 3);
                    const b4 = getBim(bimMap, 4);
                    const tf = d.faltasMateria || 0;
                    const ma = fmt(d.mediaAnual);
                    const freq = d.frequenciaMateria != null ? `${d.frequenciaMateria}%` : "";
                    return (
                        <tr key={d.materiaId} style={i % 2 === 1 ? s.trAlt : {}}>
                            <td style={s.tdDisciplina}>{d.materiaNome}</td>
                            <td style={s.tdCenter}>{b1.nota}</td>
                            <td style={s.tdCenter}>{b1.faltas !== "" ? b1.faltas : 0}</td>
                            <td style={s.tdCenter}>{b2.nota}</td>
                            <td style={s.tdCenter}>{b2.faltas !== "" ? b2.faltas : 0}</td>
                            <td style={s.tdCenter}>{b3.nota}</td>
                            <td style={s.tdCenter}>{b3.faltas !== "" ? b3.faltas : 0}</td>
                            <td style={s.tdCenter}>{b4.nota}</td>
                            <td style={s.tdCenter}>{b4.faltas !== "" ? b4.faltas : 0}</td>
                            <td style={s.tdFinal}>{ma}</td>
                            <td style={s.tdFinal}>{tf}</td>
                            <td style={{ ...s.tdFinal, fontWeight: d.frequenciaMateria != null && d.frequenciaMateria < 75 ? "bold" : "normal", color: d.frequenciaMateria != null && d.frequenciaMateria < 75 ? "#b94040" : "inherit" }}>{freq}</td>
                            <td style={s.tdFinal}>{ma}</td>
                            <td style={s.tdFinal}></td>
                        </tr>
                    );
                })}
                <tr>
                    <td colSpan={14} style={{ border: "1px solid #000", padding: "2px 6px", fontSize: 9 }}>
                        <b>Obs.</b>
                    </td>
                </tr>
                </tbody>
            </table>

            {/* ── Resultado + frequência ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none", fontSize: 9.5 }}>
                <tbody>
                <tr>
                    <td style={{ padding: "3px 6px", fontWeight: "bold", borderRight: "1px solid #000", width: "16%" }}>Resultado Final:</td>
                    <td style={{ padding: "3px 6px", borderRight: "1px solid #000", width: "20%" }}>Cursando</td>
                    <td style={{ padding: "3px 6px", flex: 1 }}></td>
                    <td style={{ padding: "3px 6px", fontWeight: "bold", textAlign: "right" }}>Frequência: {freqGeral}%</td>
                </tr>
                </tbody>
            </table>

            {/* ── Legenda ── */}
            <div style={s.legendaBox}>
                Legenda:** F=Faltas ** MA=Média Anual ** TF=Total Faltas ** Freq%=Frequência ** MF= Média Final ** Cons= conselho de Classe
            </div>

            {/* Espaço flexível para preencher o resto da folha */}
            <div style={{ flex: 1 }} />

            {/* ── Linha de corte ── */}
            <div style={s.corteLine}>
                <span style={{ flex: 1, borderTop: "2px dashed #555" }} />
                <span style={{ fontSize: 16 }}>✂</span>
                <span style={{ fontSize: 9, letterSpacing: ".1em" }}>Destaque Aqui</span>
                <span style={{ flex: 1, borderTop: "2px dashed #555" }} />
            </div>

            {/* ── Protocolo de recebimento ── */}
            <div>
                <p style={s.protocoloTitulo}>PROTOCOLO DE RECEBIMENTO</p>
                <p style={s.protocoloAluno}>Aluno(a): {boletim?.aluno?.nome || ""}</p>
                <div style={s.protocoloRow}>
                    <span>Turno: <b>MANHÃ</b></span>
                    <span>Tipo Curso: <b>Ensino Médio</b></span>
                    <span>Curso: <b>{boletim?.turma?.serie || ""}</b></span>
                    <span>Turma: <b>{boletim?.turma?.nome || ""}</b></span>
                </div>
                <p style={{ fontSize: 9.5, margin: "10px 0 4px" }}>
                    Recebi em ____/____/________ o Boletim do aluno acima, referente ao ano letivo de {boletim?.turma?.anoLetivo || ESCOLA.anoLetivo}
                </p>
                <div style={s.assinaturaRow}>
                    <div>
                        <p style={{ fontSize: 9.5 }}>Data de Emissão: {hoje}</p>
                        <p style={{ fontSize: 9.5, marginTop: 4 }}>Data de Devolução: ____/____/________</p>
                    </div>
                    <div style={s.assinaturaLinha}>Assinatura do Responsável</div>
                </div>
            </div>
        </div>
    );
}

// ── Botão de gerar PDF ───────────────────────────────────────
export function BotaoGerarPDF({ boletim, logo }) {
    const [gerando, setGerando] = useState(false);
    const ref = useRef(null);

    const gerar = async () => {
        if (!ref.current) return;
        setGerando(true);
        try {
            const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
                import("jspdf"),
                import("html2canvas"),
            ]);

            const canvas = await html2canvas(ref.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#fff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

            const nomeArquivo = `boletim_${(boletim?.aluno?.nome || "aluno").replace(/\s+/g,"_").toLowerCase()}.pdf`;
            pdf.save(nomeArquivo);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar PDF. Verifique se jspdf e html2canvas estão instalados:\nnpm install jspdf html2canvas");
        }
        setGerando(false);
    };

    return (
        <>
            {/* Preview oculto para captura */}
            <div style={{ position: "fixed", left: -9999, top: 0, zIndex: -1 }}>
                <div ref={ref}>
                    <BoletimImpresso boletim={boletim} logo={logo} />
                </div>
            </div>

            <button
                onClick={gerar}
                disabled={gerando || !boletim}
                style={{
                    background: gerando ? "#9aaa9f" : "#0d1f18",
                    color: "#fff", border: "none", padding: "11px 20px",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                    fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase",
                    cursor: gerando || !boletim ? "default" : "pointer",
                    opacity: !boletim ? 0.4 : 1,
                }}>
                {gerando ? "Gerando PDF..." : "Baixar PDF →"}
            </button>
        </>
    );
}