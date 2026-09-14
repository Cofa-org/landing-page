// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

// Mocks: declarados ANTES de importar el componente bajo test.
// El componente llama `window.matchMedia` en el primer render para decidir
// mobile vs PC. Forzamos el camino mobile (dos inputs file) mockeando
// matchMedia con matches: true.

vi.mock("../../../hooks/useDNIUpload.js", () => ({
  useDNIUpload: () => ({
    previewFront: null,
    previewBack: null,
    isUploading: false,
    uploadError: "",
    isFormValid: false,
    handleFileChange: vi.fn(),
    subirDNI: vi.fn().mockResolvedValue({ success: false }),
    setDniFront: vi.fn(),
    setDniBack: vi.fn(),
    setPreviewFront: vi.fn(),
    setPreviewBack: vi.fn(),
  }),
}));

vi.mock("../../../hooks/useDNIPolling.js", () => ({
  useDNIPolling: () => ({
    isPolling: false,
    pollingError: "",
    startPolling: vi.fn(),
    stopPolling: vi.fn(),
  }),
}));

// jsdom no implementa matchMedia — la asignación global obliga el camino
// mobile del componente (los dos inputs file del frente/dorso del DNI).
window.matchMedia = vi.fn().mockImplementation((q) => ({
  matches: true,
  media: q,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

import DNIUploadStep from "../DNIUploadStep.jsx";

describe("DNIUploadStep — accept attribute includes HEIC variants (2026-09-14 heic-upload-support)", () => {
  const HEIC_ACCEPT_REQUIRED = "image/heic";
  const HEIF_ACCEPT_REQUIRED = "image/heif";

  it("mobile: ambos inputs file aceptan image/heic y image/heif", () => {
    // El componente chequea matchMedia("(pointer: coarse)") en el primer
    // render. El mock arriba fuerza matches:true → rama mobile con dos
    // inputs file (Frente y Dorso del DNI).
    const { container } = render(<DNIUploadStep />);

    const inputs = container.querySelectorAll('input[type="file"]');
    expect(
      inputs.length,
      "mobile debe renderizar 2 inputs file (frente + dorso)",
    ).toBeGreaterThanOrEqual(2);

    inputs.forEach((input) => {
      const accept = input.getAttribute("accept") || "";
      expect(accept).toContain(HEIC_ACCEPT_REQUIRED);
      expect(accept).toContain(HEIF_ACCEPT_REQUIRED);
    });
  });
});
