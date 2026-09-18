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

  // Tasas del bloque `tasas` que devuelve calculadora-planes en /calcular
  // (mismo set que persiste `buildPlanInsert` en `simulador_prestamos_plan`).
  // Antes se usaban fuentes distintas (tasa_nominal/tasaOp) y tna derivaba
  // con magic 0.79 — ahora leemos los valores reales directo del upstream.
  //
  // Nota: tna y cftna son anuales, constantes para todos los plazos — se leen
  // del top-level `simulationData.tasas`. cftno es mensual y VARÍA por plan
  // (a menor plazo, menor cftno), por eso se lee del plan seleccionado.
  // Sin esto, al cambiar de plazo el CFTO quedaba pegado al valor del plazo=6.
  const tna = useMemo(
    () => ((simulationData?.tasas?.tna || 0) * 100).toFixed(2),
    [simulationData?.tasas?.tna]
  );

  const cfta = useMemo(
    () => ((simulationData?.tasas?.cftna || 0) * 100).toFixed(2),
    [simulationData?.tasas?.cftna]
  );

  const cfto = useMemo(
    () => ((selectedPlan?.tasas?.cftno || 0) * 100).toFixed(2),
    [selectedPlan?.tasas?.cftno]
  );

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