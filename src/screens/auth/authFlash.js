const KEY = "cofa_auth_flash";

export function writeAuthFlash(message) {
  if (typeof sessionStorage === "undefined" || !message) return;
  sessionStorage.setItem(KEY, message);
}

export function consumeAuthFlash() {
  if (typeof sessionStorage === "undefined") return "";
  const value = sessionStorage.getItem(KEY) ?? "";
  sessionStorage.removeItem(KEY);
  return value;
}
