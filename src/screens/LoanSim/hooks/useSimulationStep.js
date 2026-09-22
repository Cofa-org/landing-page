import { useMemo } from "react";
import { roundToFiveHundreds } from "../../../lib/utils.js";
import { SISTEMA_FRANCES_ON } from "../../../config.js";

export const useSimulationStep = ({ simulationData, installment }) => {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value || 0);

  const installments = useMemo(
    () => simulationData?.planes_disponibles?.map((p) => p.plazo) || [],
    [simulationData?.planes_disponibles],
  );

  const maxOffer = simulationData?.capital_maximo_a_ofrecer ?? 0;

  const selectedPlan = useMemo(
    () => simulationData?.planes_disponibles?.find((p) => p.plazo === installment) || null,
    [simulationData?.planes_disponibles, installment],
  );

  // Tasas flag-gated. SISTEMA_FRANCES_ON es boolean (parseado en config.js).
  //   flag=false (legacy pre-merge 8cce032): cfta = tasas.cftna * 100,
  //                                          cfto = plan.tasaOp * 100,
  //                                          tna  = cfta * 0.79
  //   flag=true (sistema francés nuevo):   cfta = tasas.cftna * 100,
  //                                          cfto = plan.tasas.cftno * 100,
  //                                          tna  = tasas.tna * 100
  //
  // Cada valor es UN solo useMemo (no condicionales dentro de useMemo — Rules of Hooks).
  // Orden de declaración: cfta primero (tna legacy depende de cfta, evita TDZ).
  //
  // Nota: tna y cftna son anuales, constantes para todos los plazos → top-level.
  // cftno es mensual y varía por plan → a nivel del plan seleccionado.

  const cfta = useMemo(
    () =>
      SISTEMA_FRANCES_ON
        ? ((simulationData?.tasas?.cftna || 0) * 100).toFixed(2)
        : ((simulationData?.tasa_nominal || 0) * 100).toFixed(2),
    [simulationData?.tasas?.cftna, simulationData?.tasa_nominal, SISTEMA_FRANCES_ON],
  );

  const cfto = useMemo(
    () =>
      SISTEMA_FRANCES_ON
        ? ((selectedPlan?.tasas?.cftno || 0) * 100).toFixed(2)
        : ((selectedPlan?.tasaOp || 0) * 100).toFixed(2),
    [selectedPlan?.tasas?.cftno, selectedPlan?.tasaOp, SISTEMA_FRANCES_ON],
  );

  const tna = useMemo(
    () =>
      SISTEMA_FRANCES_ON
        ? ((simulationData?.tasas?.tna || 0) * 100).toFixed(2)
        : (Number(cfta) * 0.79).toFixed(2),
    [simulationData?.tasas?.tna, cfta, SISTEMA_FRANCES_ON],
  );

  const usedCapital = simulationData?.capital_utilizado;
  const discountInstallment = simulationData?.cuotaADescontar;
  const discountInstRoundToFiveHund = roundToFiveHundreds(discountInstallment);
  const installmentNbr = simulationData?.nroCuota;
  const loanNbr = simulationData?.nroPrestamo;

  const capitalWithoutDiscount = useMemo(
    () => (usedCapital || 0) - (discountInstallment || 0),
    [usedCapital, discountInstallment],
  );

  const sortedInstallments = useMemo(() => [...installments].sort((a, b) => a - b), [installments]);

  const maxPlazo = useMemo(() => Math.max(...installments, 0), [installments]);

  const secondMaxPlazo = useMemo(
    () =>
      sortedInstallments.length > 1 ? sortedInstallments[sortedInstallments.length - 2] : maxPlazo,
    [sortedInstallments, maxPlazo],
  );

  return {
    formatCurrency,
    installments,
    maxOffer,
    selectedPlan,
    cfta,
    cfto,
    tna,
    usedCapital,
    discountInstallment,
    discountInstRoundToFiveHund,
    installmentNbr,
    loanNbr,
    capitalWithoutDiscount,
    sortedInstallments,
    maxPlazo,
    secondMaxPlazo,
  };
};
