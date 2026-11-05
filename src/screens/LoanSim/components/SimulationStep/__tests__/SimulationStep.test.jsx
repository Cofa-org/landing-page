// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// El flag del front se expone como un valor mutable: `SISTEMA_FRANCES_ON` se
// lee DENTRO del render del componente, así que alcanza con cambiarlo entre
// renders.
//
// La versión anterior usaba `vi.doMock` + `import()` dinámico +
// `vi.resetModules()` para re-importar el componente en cada test. Eso
// depende del orden de resolución de módulos y fallaba de forma intermitente:
// el mock de `config.js` a veces no se aplicaba y el componente renderizaba
// con el flag real (`.env` → `false`) en los dos casos.
//
// `vi.hoisted` sube los valores por encima de los imports, que es lo que
// necesitan los factories de `vi.mock`.
const { sistemaFrances, hookResult } = vi.hoisted(() => ({
  sistemaFrances: { value: false },
  // El tooltip del simulador muestra las tasas del plan. En modo francés los
  // valores son CFTNA/CFTNO (ver useSimulationStep) y las labels cambian con
  // el flag del front.
  hookResult: {
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
  },
}));

vi.mock("../../../../../config.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get SISTEMA_FRANCES_ON() {
      return sistemaFrances.value;
    },
  };
});

vi.mock("../../../hooks/useSimulationStep", () => ({
  useSimulationStep: () => hookResult,
}));

import SimulationStep from "../SimulationStep.jsx";

const renderWithFlag = (sistemaFrancesOn) => {
  sistemaFrances.value = sistemaFrancesOn;
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
  sistemaFrances.value = false;
});

describe("SimulationStep — labels del tooltip según VITE_SISTEMA_FRANCES_ON", () => {
  it("con SISTEMA_FRANCES_ON=true muestra CFTNA y CFTNO", () => {
    renderWithFlag(true);

    expect(screen.getByText(/CFTNA:/)).toBeTruthy();
    expect(screen.getByText(/CFTNO:/)).toBeTruthy();
    expect(screen.queryByText(/CFTA:/)).toBeNull();
    expect(screen.queryByText(/CFTO:/)).toBeNull();
  });

  it("con SISTEMA_FRANCES_ON=false mantiene CFTA y CFTO", () => {
    renderWithFlag(false);

    expect(screen.getByText(/CFTA:/)).toBeTruthy();
    expect(screen.getByText(/CFTO:/)).toBeTruthy();
    expect(screen.queryByText(/CFTNA:/)).toBeNull();
    expect(screen.queryByText(/CFTNO:/)).toBeNull();
  });
});
