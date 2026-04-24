// Feature flag para a nova UI Skolyo.
//
// Habilitada se QUALQUER uma for verdadeira:
//  - build time: VITE_NEW_UI === "true"
//  - runtime: localStorage.getItem("skolyo.newUI") === "1"
//  - query string: ?ui=new (persiste em localStorage ao visitar)
//
// Para desligar no runtime: localStorage.setItem("skolyo.newUI", "0") ou ?ui=old

const STORAGE_KEY = "skolyo.newUI";

export function syncFromQueryString() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ui = params.get("ui");
  if (ui === "new") localStorage.setItem(STORAGE_KEY, "1");
  else if (ui === "old") localStorage.setItem(STORAGE_KEY, "0");
}

export function isNewUIEnabled() {
  if (import.meta.env?.VITE_NEW_UI === "true") return true;
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setNewUI(enabled) {
  localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
}
