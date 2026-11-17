import { SISTEMA_AMORTIZACION } from '../../../constants/sistema-amortizacion.constants.js';
import { useMemo } from "react";
import { roundToFiveHundreds } from "../../../lib/utils.js";

export const useSimulationStep = ({ simulationData, installment }) => {
  const esSistemaFrances = simulationData?.sistemaAmortizacion === SISTEMA_AMORTIZACION.FRANCES;
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

  // Tasas segun el sistema confirmado en esta respuesta.
  // Directo: tasa_nominal, plan.tasaOp y TNA = CFTA * 0.79.
  // Frances: tasas.cftna, plan.tasas.cftno y tasas.tna.
  //
  // Cada valor es UN solo useMemo (no condicionales dentro de useMemo — Rules of Hooks).
  // Orden de declaración: cfta primero (tna legacy depende de cfta, evita TDZ).
  //
  // Nota: tna y cftna son anuales, constantes para todos los plazos → top-level.
  // cftno es mensual y varía por plan → a nivel del plan seleccionado.

  const cfta = useMemo(
    () =>
      esSistemaFrances
        ? ((simulationData?.tasas?.cftna || 0) * 100).toFixed(2)
        : ((simulationData?.tasa_nominal || 0) * 100).toFixed(2),
    [simulationData?.tasas?.cftna, simulationData?.tasa_nominal, esSistemaFrances],
  );

  const cfto = useMemo(
    () =>
      esSistemaFrances
        ? ((selectedPlan?.tasas?.cftno || 0) * 100).toFixed(2)
        : ((selectedPlan?.tasaOp || 0) * 100).toFixed(2),
    [selectedPlan?.tasas?.cftno, selectedPlan?.tasaOp, esSistemaFrances],
  );

  const tna = useMemo(
    () =>
      esSistemaFrances
        ? ((simulationData?.tasas?.tna || 0) * 100).toFixed(2)
        : (Number(cfta) * 0.79).toFixed(2),
    [simulationData?.tasas?.tna, cfta, esSistemaFrances],
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
    esSistemaFrances,
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
