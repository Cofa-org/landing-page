import "@testing-library/jest-dom/vitest";

/**
 * Node >= 22 expone `globalThis.localStorage` / `sessionStorage` (Web Storage
 * nativo) como getters que devuelven `undefined` cuando no se pasa
 * `--localstorage-file`.
 *
 * El `populateGlobal` de vitest NO pisa las claves que ya existen en el
 * global (`if (k in global) return keysArray.includes(k)`), así que el
 * `Storage` real de jsdom nunca llega a instalarse y en los tests queda
 * `window.localStorage === undefined`.
 *
 * Consecuencia: cualquier test que toque el storage revienta con
 * `TypeError: Cannot read properties of undefined (reading 'clear')`, y los
 * mocks no se resetean (el `afterEach` corta antes del `vi.resetAllMocks()`),
 * lo que hace fallar después por conteo de llamadas.
 *
 * Acá reinstalamos el `Storage` de jsdom — el mismo que usan los navegadores
 * — para que los tests se comporten como en producción.
 *
 * Se borra la propiedad antes de redefinirla porque `defineProperty` sobre una
 * propiedad existente conserva los atributos no especificados: el setter de
 * Node sobreviviría y las asignaciones de los tests (p.ej.
 * `global.localStorage = { getItem: vi.fn() }`) se perderían. El setter propio
 * reproduce el comportamiento del `populateGlobal` de vitest (guarda el valor
 * asignado y lo devuelve en la lectura).
 */
const jsdomWindow = globalThis.jsdom?.window;

if (jsdomWindow) {
  for (const key of ["localStorage", "sessionStorage"]) {
    delete globalThis[key];
    let override = null;
    Object.defineProperty(globalThis, key, {
      get: () => (override !== null ? override : jsdomWindow[key]),
      set: (value) => {
        override = value;
      },
      configurable: true,
    });
  }
}
