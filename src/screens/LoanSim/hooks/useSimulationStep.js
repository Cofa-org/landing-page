import { useMemo } from "react";
import { roundToFiveHundreds } from "../../../lib/utils.js";

export const useSimulationStep = ({ simulationData, installment }) => {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value || 0);

  const installments = useMemo(
    () => simulationData?.planes_disponibles?.map((p) => p.plazo) || [],
    [simulationData?.planes_disponibles]
  );

  const maxOffer = simulationData?.capital_maximo_a_ofrecer ?? 0;

  const selectedPlan = useMemo(
    () => simulationData?.planes_disponibles?.find((p) => p.plazo === installment) || null,
    [simulationData?.planes_disponibles, installment]
  );

  const cfta = useMemo(
    () => ((simulationData?.tasa_nominal || 0) * 100).toFixed(2),
    [simulationData?.tasa_nominal]
  );

  const cfto = useMemo(
    () => ((selectedPlan?.tasaOp || 0) * 100).toFixed(2),
    [selectedPlan?.tasaOp]
  );

  const tna = useMemo(() => (cfta * 0.79).toFixed(2), [cfta]);

  const usedCapital = simulationData?.capital_utilizado;
  const discountInstallment = simulationData?.cuotaADescontar;
  const discountInstRoundToFiveHund = roundToFiveHundreds(discountInstallment)
  const installmentNbr = simulationData?.nroCuota;
  const loanNbr = simulationData?.nroPrestamo;

  const capitalWithoutDiscount = useMemo(
    () => (usedCapital || 0) - (discountInstallment || 0),
    [usedCapital, discountInstallment]
  );

  const sortedInstallments = useMemo(() => [...installments].sort((a, b) => a - b), [installments]);

  const maxPlazo = useMemo(() => Math.max(...installments, 0), [installments]);

  const secondMaxPlazo = useMemo(
    () =>
      sortedInstallments.length > 1 ? sortedInstallments[sortedInstallments.length - 2] : maxPlazo,
    [sortedInstallments, maxPlazo]
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