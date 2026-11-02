// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// El tooltip del simulador muestra las tasas del plan. En modo francés los
// valores son CFTNA/CFTNO (ver useSimulationStep) y las labels cambian con el
// flag del front.
const hookResult = {
  formatCurrency: (v) => `$${v}`,
  installments: [],
  maxOffer: 100000,
  selectedPlan: { valorCuota: 10000 },
  cfta: "420.00",
  cfto: "211.35",
  tna: "324.50",
  discountInstallment: 0,
  discountInstRoundToFiveHund: 0,
  installmentNbr: 0,
  loanNbr: 0,
  capitalWithoutDiscount: 0,
  sortedInstallments: [3, 6],
  maxPlazo: 6,
  secondMaxPlazo: 3,
};

const renderWithFlag = async (sistemaFrances) => {
  vi.resetModules();
  vi.doMock("../../../../../config.js", () => ({ SISTEMA_FRANCES_ON: sistemaFrances }));
  vi.doMock("../../../hooks/useSimulationStep", () => ({
    useSimulationStep: () => hookResult,
  }));
  const { default: SimulationStep } = await import("../SimulationStep.jsx");
  render(
    <SimulationStep
      amount={100000}
      installment={6}
      simulationData={{}}
      loading={false}
      nombreCompleto=""
      onAmountChange={() => {}}
      onInstallmentChange={() => {}}
      onNextStep={() => {}}
      error={null}
    />,
  );
};

afterEach(() => {
  cleanup();
  vi.doUnmock("../../../../../config.js");
  vi.doUnmock("../../../hooks/useSimulationStep");
  vi.resetModules();
});

describe("SimulationStep — labels del tooltip según VITE_SISTEMA_FRANCES_ON", () => {
  it("con SISTEMA_FRANCES_ON=true muestra CFTNA y CFTNO", async () => {
    await renderWithFlag(true);

    expect(screen.getByText(/CFTNA:/)).toBeTruthy();
    expect(screen.getByText(/CFTNO:/)).toBeTruthy();
    expect(screen.queryByText(/CFTA:/)).toBeNull();
    expect(screen.queryByText(/CFTO:/)).toBeNull();
  });

  it("con SISTEMA_FRANCES_ON=false mantiene CFTA y CFTO", async () => {
    await renderWithFlag(false);

    expect(screen.getByText(/CFTA:/)).toBeTruthy();
    expect(screen.getByText(/CFTO:/)).toBeTruthy();
    expect(screen.queryByText(/CFTNA:/)).toBeNull();
    expect(screen.queryByText(/CFTNO:/)).toBeNull();
  });
});
