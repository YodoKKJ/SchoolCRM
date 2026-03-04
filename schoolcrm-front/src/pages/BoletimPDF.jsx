import { useState, useRef } from "react";

const ESCOLA = {
    nome: "DOM Sistema Educacional",
    endereco: "Avenida Padre Antonio, 190 - CENTRO - CEP 89.874-000",
    telefone: "(49) 3664-4454",
    anoLetivo: new Date().getFullYear(),
};

// ── Helpers ───────────────────────────────────────────────────
function fmt(val) {
    if (val === null || val === undefined) return "";
    const n = Number(val);
    if (isNaN(n)) return "";
    return n.toFixed(1).replace(".", ",");
}

function fmtFreq(val) {
    if (val === null || val === undefined) return "—";
    const n = Number(val);
    if (isNaN(n)) return "—";
    return n % 1 === 0 ? `${n}%` : `${n.toFixed(1)}%`;
}

function sanitizeFilename(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
}

function calcResultado(disciplinas, freqGeral) {
    if (!disciplinas || disciplinas.length === 0) return "Cursando";
    const hasNull = disciplinas.some(d => d.mediaAnual == null);
    if (hasNull) return "Cursando";
    const reprovadoFreq = freqGeral != null && Number(freqGeral) < 75;
    const reprovadoNota = disciplinas.some(d => Number(d.mediaAnual) < 6);
    if (reprovadoFreq || reprovadoNota) return "REPROVADO";
    return "APROVADO";
}

// ── Boletim para impressão/PDF ───────────────────────────────
export function BoletimImpresso({ boletim, logo, dataEmissao }) {
    const hoje = dataEmissao || new Date().toLocaleDateString("pt-BR");

    function getBim(bimestres, num) {
        const b = bimestres ? bimestres[num] : null;
        return {
            nota: b?.media != null ? fmt(b.media) : "",
            faltas: b?.faltas != null ? b.faltas : (b ? 0 : ""),
        };
    }

    const disciplinas = boletim?.disciplinas || [];
    const freqGeral = boletim?.frequenciaGeral ?? null;
    const resultado = calcResultado(disciplinas, freqGeral);

    const resultadoCor = resultado === "APROVADO" ? "#2d6a4f"
        : resultado === "REPROVADO" ? "#b94040"
        : "#555";

    const s = {
        page: { fontFamily: "Arial, sans-serif", fontSize: 10, color: "#000", background: "#fff", padding: "20px 24px", width: 794, minHeight: 1123, boxSizing: "border-box", display: "flex", flexDirection: "column" },
        thMain: { border: "1px solid #000", padding: "3px 4px", textAlign: "center", background: "#e8e8e8", fontWeight: "bold" },
        tdDisciplina: { border: "1px solid #000", padding: "2px 4px", textAlign: "left" },
        tdCenter: { border: "1px solid #000", padding: "2px 4px", textAlign: "center", minWidth: 28 },
        tdFinal: { border: "1px solid #000", padding: "2px 4px", textAlign: "center", minWidth: 24 },
        trAlt: { background: "#f5f5f5" },
        legendaBox: { fontSize: 8, textAlign: "center", borderTop: "1px solid #000", padding: "3px 0" },
        assinaturaLinha: { borderTop: "1px solid #000", width: 220, textAlign: "center", paddingTop: 2, fontSize: 9 },
    };

    return (
        <div style={s.page}>
            {/* ── Cabeçalho ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ width: 90, height: 60, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc", overflow: "hidden" }}>
                    {logo
                        ? <img src={logo} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="Logo escola" />
                        : <span style={{ fontSize: 9, color: "#aaa", textAlign: "center", padding: 4 }}>Logo da<br/>Escola</span>
                    }
                </div>
                <div style={{ flex: 1, textAlign: "center", paddingTop: 4 }}>
                    <p style={{ fontWeight: "bold", fontSize: 11, marginBottom: 2 }}>{ESCOLA.nome}</p>
                    <p style={{ fontSize: 9.5, marginBottom: 2 }}>{ESCOLA.endereco}</p>
                    <p style={{ fontSize: 9.5 }}>Telefone: {ESCOLA.telefone}</p>
                </div>
                <div style={{ fontSize: 9, textAlign: "right", minWidth: 120 }}>
                    Data de Emissão: {hoje}
                </div>
            </div>

            {/* ── Título ── */}
            <div style={{ background: "#d0d0d0", border: "1px solid #000", textAlign: "center", fontWeight: "bold", fontSize: 13, padding: "5px 0", marginBottom: 8, letterSpacing: ".04em" }}>
                BOLETIM ESCOLAR
            </div>

            {/* ── Dados do aluno ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: 9.5, marginBottom: 2 }}>
                <tbody>
                <tr>
                    <td style={{ padding: "2px 6px", width: "18%" }}>Matrícula: <b>{boletim?.aluno?.id || ""}</b></td>
                    <td style={{ padding: "2px 6px" }}>Aluno(a): <b>{boletim?.aluno?.nome || ""}</b></td>
                    <td style={{ padding: "2px 6px", width: "22%", textAlign: "right" }}>Ano Letivo: <b>{boletim?.turma?.anoLetivo || ESCOLA.anoLetivo}</b></td>
                </tr>
                <tr style={{ borderTop: "1px solid #000" }}>
                    <td style={{ padding: "2px 6px" }}>Turma: <b>{boletim?.turma?.nome || ""}</b></td>
                    <td colSpan={2} style={{ padding: "2px 6px" }}>Série: <b>{boletim?.turma?.serie || ""}</b></td>
                </tr>
                </tbody>
            </table>

            {/* ── Tabela de notas ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, marginBottom: 4 }}>
                <thead>
                <tr>
                    <th rowSpan={2} style={{ ...s.thMain, textAlign: "left", width: "14%" }}>Disciplina</th>
                    <th colSpan={2} style={s.thMain}>1º Bimestre</th>
                    <th colSpan={2} style={s.thMain}>2º Bimestre</th>
                    <th colSpan={2} style={s.thMain}>3º Bimestre</th>
                    <th colSpan={2} style={s.thMain}>4º Bimestre</th>
                    <th colSpan={4} style={s.thMain}>Resultado</th>
                </tr>
                <tr>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Nota</th><th style={s.thMain}>F</th>
                    <th style={s.thMain}>Média</th>
                    <th style={s.thMain}>T.Faltas</th>
                    <th style={s.thMain}>Freq%</th>
                    <th style={s.thMain}>Situação</th>
                </tr>
                </thead>
                <tbody>
                {disciplinas.map((d, i) => {
                    const bimMap = d.bimestres || {};
                    const b1 = getBim(bimMap, 1);
                    const b2 = getBim(bimMap, 2);
                    const b3 = getBim(bimMap, 3);
                    const b4 = getBim(bimMap, 4);
                    const tf = d.faltasMateria ?? 0;
                    const ma = fmt(d.mediaAnual);
                    const freq = d.frequenciaMateria;
                    const aprovado = d.mediaAnual != null && Number(d.mediaAnual) >= 6
                        && (freq == null || Number(freq) >= 75);
                    const situacao = d.mediaAnual == null ? "" : aprovado ? "Aprovado" : "Reprovado";
                    const sitCor = situacao === "Aprovado" ? "#2d6a4f" : situacao === "Reprovado" ? "#b94040" : "#000";
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
                            <td style={{ ...s.tdFinal, fontWeight: "bold", color: d.mediaAnual != null && Number(d.mediaAnual) < 6 ? "#b94040" : "#2d6a4f" }}>{ma}</td>
                            <td style={s.tdFinal}>{tf}</td>
                            <td style={{ ...s.tdFinal, color: freq != null && Number(freq) < 75 ? "#b94040" : "inherit", fontWeight: freq != null && Number(freq) < 75 ? "bold" : "normal" }}>
                                {freq != null ? fmtFreq(freq) : "—"}
                            </td>
                            <td style={{ ...s.tdFinal, fontWeight: "bold", color: sitCor }}>{situacao}</td>
                        </tr>
                    );
                })}
                <tr>
                    <td colSpan={13} style={{ border: "1px solid #000", padding: "2px 6px", fontSize: 9 }}>
                        <b>Obs.:</b>
                    </td>
                </tr>
                </tbody>
            </table>

            {/* ── Resultado final + frequência ── */}
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none", fontSize: 9.5 }}>
                <tbody>
                <tr>
                    <td style={{ padding: "3px 6px", fontWeight: "bold", borderRight: "1px solid #000", width: "16%" }}>Resultado Final:</td>
                    <td style={{ padding: "3px 6px", borderRight: "1px solid #000", width: "22%", fontWeight: "bold", color: resultadoCor }}>{resultado}</td>
                    <td style={{ padding: "3px 6px", flex: 1 }}></td>
                    <td style={{ padding: "3px 6px", fontWeight: "bold", textAlign: "right" }}>
                        Frequência Geral: {fmtFreq(freqGeral)}
                    </td>
                </tr>
                </tbody>
            </table>

            {/* ── Legenda ── */}
            <div style={s.legendaBox}>
                F = Faltas &nbsp;|&nbsp; T.Faltas = Total de Faltas &nbsp;|&nbsp; Freq% = Frequência &nbsp;|&nbsp; Aprovado: Média ≥ 6,0 e Freq ≥ 75%
            </div>

            {/* Espaço para preencher resto da folha */}
            <div style={{ flex: 1 }} />

            {/* ── Linha de corte ── */}
            <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: 8, color: "#555" }}>
                <span style={{ flex: 1, borderTop: "2px dashed #555" }} />
                <span style={{ fontSize: 16 }}>✂</span>
                <span style={{ fontSize: 9, letterSpacing: ".1em" }}>Destaque Aqui</span>
                <span style={{ flex: 1, borderTop: "2px dashed #555" }} />
            </div>

            {/* ── Protocolo de recebimento ── */}
            <div>
                <p style={{ fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>PROTOCOLO DE RECEBIMENTO</p>
                <p style={{ fontWeight: "bold", fontSize: 11, marginBottom: 6 }}>Aluno(a): {boletim?.aluno?.nome || ""}</p>
                <div style={{ display: "flex", gap: 24, fontSize: 9.5, marginBottom: 4 }}>
                    <span>Turma: <b>{boletim?.turma?.nome || ""}</b></span>
                    <span>Série: <b>{boletim?.turma?.serie || ""}</b></span>
                    <span>Ano Letivo: <b>{boletim?.turma?.anoLetivo || ESCOLA.anoLetivo}</b></span>
                    <span>Resultado: <b style={{ color: resultadoCor }}>{resultado}</b></span>
                </div>
                <p style={{ fontSize: 9.5, margin: "10px 0 4px" }}>
                    Recebi em ____/____/________ o Boletim do aluno(a) acima, referente ao ano letivo de {boletim?.turma?.anoLetivo || ESCOLA.anoLetivo}.
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
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
                windowWidth: 794,
            });

            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
            const pdfH = pdf.internal.pageSize.getHeight();  // 297mm

            // Pixels per mm based on canvas width
            const pxPerMm = canvas.width / pdfW;
            const pageHeightPx = pdfH * pxPerMm;
            const totalPages = Math.ceil(canvas.height / pageHeightPx);

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) pdf.addPage();

                const srcY = page * pageHeightPx;
                const srcH = Math.min(pageHeightPx, canvas.height - srcY);

                // Slice this page out of the full canvas
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = canvas.width;
                pageCanvas.height = pageHeightPx;
                const ctx = pageCanvas.getContext("2d");
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

                pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH);
            }

            const nomeAluno = sanitizeFilename(boletim?.aluno?.nome || "aluno");
            pdf.save(`boletim_${nomeAluno}.pdf`);
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar PDF. Verifique se jspdf e html2canvas estão instalados:\nnpm install jspdf html2canvas");
        }
        setGerando(false);
    };

    return (
        <>
            {/* Preview oculto para captura pelo html2canvas */}
            <div style={{ position: "fixed", left: -9999, top: 0, zIndex: -1 }}>
                <div ref={ref} style={{ width: 794 }}>
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
