// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Las keys del backend (CFTA/CFTO) son legacy: en modo francés transportan
// CFTNA/CFTNO y las labels del modal (y del PDF) cambian con el flag del front.
const loanInfo = {
  FechaDeSolicitud: "01/07/2026",
  CapitalDelPrestamo: "$ 100.000,00",
  TotalDeIntereses: "$ 20.000,00 (incluye 21% de IVA)",
  CantidadDeCuotas: 12,
  MontoCuota: "$ 10.000,00",
  CFTO: "211.35%",
  TNA: "324.50%",
  CFTA: "420.00%",
};

// El flag se resuelve al importar config.js, así que hay que mockearlo y
// re-importar el componente con el valor desired.
const renderWithFlag = async (sistemaFrances) => {
  vi.resetModules();
  vi.doMock("../../../../../config.js", () => ({ SISTEMA_FRANCES_ON: sistemaFrances }));
  const { default: LoanInfoModal } = await import("../LoanInfoModal.jsx");
  render(<LoanInfoModal loanInfo={loanInfo} closeModal={() => {}} simulationData={null} />);
};

afterEach(() => {
  cleanup();
  vi.doUnmock("../../../../../config.js");
  vi.resetModules();
});

describe("LoanInfoModal — labels de tasas según VITE_SISTEMA_FRANCES_ON", () => {
  it("con SISTEMA_FRANCES_ON=true muestra CFTNA y CFTNO", async () => {
    await renderWithFlag(true);

    expect(screen.getByText("CFTNO:")).toBeTruthy();
    expect(screen.getByText("CFTNA:")).toBeTruthy();
    expect(screen.queryByText("CFTO:")).toBeNull();
    expect(screen.queryByText("CFTA:")).toBeNull();
  });

  it("con SISTEMA_FRANCES_ON=false mantiene CFTA y CFTO", async () => {
    await renderWithFlag(false);

    expect(screen.getByText("CFTO:")).toBeTruthy();
    expect(screen.getByText("CFTA:")).toBeTruthy();
    expect(screen.queryByText("CFTNO:")).toBeNull();
    expect(screen.queryByText("CFTNA:")).toBeNull();
  });

  it("la label de TNA no cambia entre modos", async () => {
    await renderWithFlag(true);
    expect(screen.getByText("TNA:")).toBeTruthy();
  });
});
