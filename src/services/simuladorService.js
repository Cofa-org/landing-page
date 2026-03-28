import { LANDING_BACKEND_URL, LANDING_BACKEND_API_KEY } from "../config";
import { HTTP_METHOD } from "../constants/HTTP_METHODS.js";
import { HttpApi } from "../http.js";

export default class SimuladorService {
  static async calcularPlanes({ scoringId, plazoSeleccionado, capitalSeleccionado }, signal = null) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/calcular`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const body = {
        scoringId,
        plazoSeleccionado,
        capitalSeleccionado,
      };
      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null, signal);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al calcular planes");
      }

      const responseJson = await response.json();
      return responseJson;
    } catch (error) {
      console.error("CALCULAR_PLANES_ERROR:", error);
      throw error;
    }
  }

  static async guardarPlan(payload) {
    try {
      const URL = `${LANDING_BACKEND_URL}/api/simulador-prestamos/guardar`;
      const apiKey = LANDING_BACKEND_API_KEY;
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
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/solicitar-otp`;
      const apiKey = LANDING_BACKEND_API_KEY;
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
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/verificar-otp`;
      const apiKey = LANDING_BACKEND_API_KEY;

      const body = {
        code,
        email,
        scoringId,
      };

      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);

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

  static async validarCBU(cbu, cuit, scoringId, accountType = "cbu") {
    try {
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/validar-cbu`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const body = {
        cbu,
        cuit,
        scoringId,
        accountType,
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
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/preaprobado`;
      const apiKey = LANDING_BACKEND_API_KEY;
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
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/info/${scoringId}`;
      const apiKey = LANDING_BACKEND_API_KEY;
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

  static async guardarCompliance(payload) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/compliance`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const response = await HttpApi(url, payload, HTTP_METHOD.POST, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar información de compliance");
      }
      return await response.json();
    } catch (error) {
      console.error("GUARDAR_COMPLIANCE_ERROR:", error);
      throw error;
    }
  }

  static async verificarComplianceExistente(cuit) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/compliance/verificar?cuit=${encodeURIComponent(cuit)}`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const response = await HttpApi(url, null, HTTP_METHOD.GET, apiKey, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al verificar compliance existente");
      }
      return await response.json();
    } catch (error) {
      console.error("VERIFICAR_COMPLIANCE_ERROR:", error);
      throw error;
    }
  }

  static async validarCodigoBanco(codigo) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/validar-codigo-banco`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const body = { codigo };

      const response = await HttpApi(url, body, HTTP_METHOD.POST, apiKey, null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al validar código de banco");
      }

      return await response.json();
    } catch (error) {
      console.error("VALIDAR_CODIGO_BANCO_ERROR:", error);
      throw error;
    }
  }

  static async actualizarEstado({ scoringId, estado }) {
    try {
      const url = `${LANDING_BACKEND_URL}/api/simulador-prestamos/estado`;
      const apiKey = LANDING_BACKEND_API_KEY;
      const body = { scoringId, estado };
      const response = await HttpApi(url, body, HTTP_METHOD.PUT, apiKey, null);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el estado de la simulación");
      }

      return await response.json();
    } catch (error) {
      console.error("ACTUALIZAR_ESTADO_ERROR:", error);
      throw error;
    }
  }
}
