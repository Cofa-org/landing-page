import { cofaAuthLogin, HttpApi } from "../http";
import { VITE_URL_LOCAL, VITE_COFA_AUTH_URL, VITE_COFA_AUTH_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";

export default class SimuladorService {
  static async verificarAcceso(token) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/verificar`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = {
        token,
      };
      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        throw new Error(response.message || "Error al verificar acceso");
      }

      return await response.json();
    } catch (error) {
      console.error("VERIFICAR_ACCESO_ERROR:", error);
      throw error;
    }
  }

  static async calcularPlanes({ scoringId, plazoSeleccionado, capitalSeleccionado }) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/calcular`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = {
        scoringId,
        plazoSeleccionado,
        capitalSeleccionado,
      };

      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al calcular planes");
      }
      return await response.json();
    } catch (error) {
      console.error("CALCULADORA_SERVICE_ERROR:", error);
      throw error;
    }
  }

  static async guardarPlan(payload) {
    try {
      const URL = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/guardar`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = payload;
      const response = await HttpApi(URL, body, HTTP_METHOD.POST, apiKey, null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar plan");
      }

      return await response.json();
    } catch (error) {
      console.error("GUARDAR_PLAN_ERROR:", error);
      throw error;
    }
  }

  static async solicitarOTP({ scoringId, email, isResend }) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/solicitar-otp`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = {
        scoringId,
        email,
        isResend,
      };

      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al solicitar OTP");
      }
      const jsonResponse = await response.json();
      return jsonResponse;
    } catch (error) {
      console.error("VALIDAR_EMAIL_ERROR:", error);
      throw error;
    }
  }

  static async verificarOTP({ code, email, scoringId }) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/verificar-otp`;
      const apiKey = VITE_COFA_AUTH_API_KEY;

      const body = {
        code,
        email,
        scoringId,
      };

      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);
      console.log(response);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al verificar OTP");
      }
      return await response.json();
    } catch (error) {
      console.error("VERIFICAR_OTP_ERROR:", error);
      throw error;
    }
  }

  static async validarCBU(cbu, cuit) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/validar-cbu`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = {
        cbu,
        cuit,
      };
      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al validar CBU");
      }
      return await response.json();
    } catch (error) {
      console.error("VALIDAR_CBU_ERROR:", error);
      throw error;
    }
  }

  static async obtenerIdPreaprobado({ scoringId, cantidad_cuotas, monto }) {
    try {
      const url = `${VITE_COFA_AUTH_URL || VITE_URL_LOCAL}/api/simulador-prestamos/preaprobado`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const body = {
        scoringId,
        cantidad_cuotas,
        monto,
      };
      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener ID preaprobado");
      }

      return await response.json();
    } catch (error) {
      console.error("OBTENER_ID_PREAPROBADO_ERROR:", error);
      throw error;
    }
  }

  static async obtenerInfoPrestamo(scoringId) {
    try {
      const url = `${
        VITE_COFA_AUTH_URL || VITE_URL_LOCAL
      }/api/simulador-prestamos/info/${scoringId}`;
      const apiKey = VITE_COFA_AUTH_API_KEY;
      const response = await HttpApi(url, null, HTTP_METHOD.GET, apiKey, null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener info del préstamo");
      }

      return await response.json();
    } catch (error) {
      console.error("OBTENER_INFO_PRESTAMO_ERROR:", error);
      throw error;
    }
  }
}
