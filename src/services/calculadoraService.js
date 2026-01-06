import { HttpApi } from "../http";
import { VITE_URL_LOCAL, VITE_COFA_AUTH_URL } from "../config";

export default class CalculadoraService {
  static async calcularPlanes({ scoringId, plazoSeleccionado, capitalSeleccionado }) {
    try {
      //   const baseUrl = VITE_COFA_AUTH_URL || VITE_URL_LOCAL;
      //   const url = `${baseUrl}/api/calculadora/calcular`;

      const body = JSON.stringify({
        scoringId,
        plazoSeleccionado,
        capitalSeleccionado,
      });

      //   const response = await HttpApi(url, body)
      const local = "http://localhost:1000/api/calculadora/calcular";
      const response = await fetch(local, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "4b2129b4-c4f6-4551-8d1c-934af49f5309",
        },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al calcular planes");
      }
      const jsonResponse = await response.json();
      console.log("response", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error("CALCULADORA_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async guardarPlan(payload) {
    try {
      const body = JSON.stringify(payload);

      const local = "http://localhost:1000/api/calculadora/guardar";
      const response = await fetch(local, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "4b2129b4-c4f6-4551-8d1c-934af49f5309",
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar plan");
      }

      const jsonResponse = await response.json();
      console.log("guardarPlan response", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error("GUARDAR_PLAN_ERROR:", error);
      throw error;
    }
  }

  static async solicitarOTP({ scoringId, email, isResend }) {
    try {
      const body = JSON.stringify({
        scoringId,
        email,
        isResend,
      });

      //   const response = await HttpApi(url, body)
      const local = "http://localhost:1000/api/calculadora/solicitar-otp";
      const response = await fetch(local, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "4b2129b4-c4f6-4551-8d1c-934af49f5309",
        },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al calcular planes");
      }
      const jsonResponse = await response.json();
      console.log("response", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error("VALIDAR_EMAIL_ERROR:", error);
      throw error;
    }
  }

  static async verificarOTP({ code, email, scoringId }) {
    try {
      const body = JSON.stringify({
        code,
        email,
        scoringId,
      });

      const local = "http://localhost:1000/api/calculadora/verificar-otp";
      const response = await fetch(local, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "4b2129b4-c4f6-4551-8d1c-934af49f5309",
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al verificar código");
      }

      const jsonResponse = await response.json();
      console.log("response", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error("VERIFICAR_OTP_ERROR:", error);
      throw error;
    }
  }

  static async validarCBU(cbu, cuit) {
    cuit = "20284623569";
    try {
      const body = JSON.stringify({
        cbu,
        cuit,
      });

      //   const response = await HttpApi(url, body)
      const local = "http://localhost:1000/api/calculadora/validar-cbu";
      const response = await fetch(local, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "4b2129b4-c4f6-4551-8d1c-934af49f5309",
        },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al calcular planes");
      }
      const jsonResponse = await response.json();
      console.log("response", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error("VALIDAR_CBU_ERROR:", error);
      throw error;
    }
  }

  static async obtenerIdPreaprobado({ scoringId, cantidad_cuotas, monto }) {
    try {
      const body = JSON.stringify({
        scoringId,
        cantidad_cuotas,
        monto,
      });

      const local = "http://localhost:1000/api/calculadora/preaprobado";
      const response = await fetch(local, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "4b2129b4-c4f6-4551-8d1c-934af49f5309",
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener ID preaprobado");
      }

      const jsonResponse = await response.json();
      console.log("obtenerIdPreaprobado response", jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error("OBTENER_ID_PREAPROBADO_ERROR:", error);
      throw error;
    }
  }
}
