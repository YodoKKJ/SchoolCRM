// Helpers puramente apresentacionais para matérias — o backend só guarda
// nome, mas o handoff pede sigla + cor. Derivamos determinísticamente do nome.

const CORES_PALETTE = [
  "#C04A3A", "#3F6FB0", "#B5832A", "#2F7F5E",
  "#6A4FA6", "#4FAE85", "#2C7787", "#A8473A",
  "#9C5580", "#C08A2E", "#52626F", "#D78A7E",
];

const OVERRIDES = {
  portugues: { sigla: "POR", cor: "#C04A3A" },
  matematica: { sigla: "MAT", cor: "#3F6FB0" },
  historia: { sigla: "HIS", cor: "#B5832A" },
  geografia: { sigla: "GEO", cor: "#2F7F5E" },
  ciencias: { sigla: "CIE", cor: "#6A4FA6" },
  biologia: { sigla: "BIO", cor: "#4FAE85" },
  quimica: { sigla: "QUI", cor: "#2C7787" },
  fisica: { sigla: "FIS", cor: "#A8473A" },
  ingles: { sigla: "ING", cor: "#9C5580" },
  espanhol: { sigla: "ESP", cor: "#C08A2E" },
  "educacaofisica": { sigla: "EDF", cor: "#52626F" },
  "edfisica": { sigla: "EDF", cor: "#52626F" },
  artes: { sigla: "ART", cor: "#D78A7E" },
  filosofia: { sigla: "FIL", cor: "#6A4FA6" },
  sociologia: { sigla: "SOC", cor: "#3F6FB0" },
};

function normalize(name = "") {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function siglaFor(nome = "") {
  const key = normalize(nome);
  if (OVERRIDES[key]) return OVERRIDES[key].sigla;
  // Primeiras 3 letras úteis
  const clean = nome.replace(/[^A-Za-zÀ-ú]/g, "");
  return (clean.slice(0, 3) || "—").toUpperCase();
}

export function corFor(nome = "") {
  const key = normalize(nome);
  if (OVERRIDES[key]) return OVERRIDES[key].cor;
  if (!key) return CORES_PALETTE[0];
  return CORES_PALETTE[hash(key) % CORES_PALETTE.length];
}

export function visual(nome) {
  return { sigla: siglaFor(nome), cor: corFor(nome) };
}

export { CORES_PALETTE };
