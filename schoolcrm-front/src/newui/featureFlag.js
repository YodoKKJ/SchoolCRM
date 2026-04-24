// Modo legado (UI antiga).
//
// Default: DESLIGADO — todas as rotas renderizam a nova UI.
// Para voltar para a antiga em runtime:
//   - localStorage.setItem("skolyo.legacyUI", "1")
//   - ?ui=legacy
// Para voltar para a nova:
//   - localStorage.setItem("skolyo.legacyUI", "0")
//   - ?ui=new
//
// Futuramente será exposto via um setting "Usar interface Legada".

const STORAGE_KEY = "skolyo.legacyUI";

export function syncFromQueryString() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ui = params.get("ui");
  if (ui === "legacy" || ui === "old") localStorage.setItem(STORAGE_KEY, "1");
  else if (ui === "new") localStorage.setItem(STORAGE_KEY, "0");
}

export function isLegacyUIEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setLegacyUI(enabled) {
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}
