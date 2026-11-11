// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LeadRegistrationService from "../leadRegistrationService.js";
import { deleteCookie, getCookie, setCookieWithDuration } from "../../lib/utils.js";
import { COOKIE_LEAD_TOKEN_CONFIG } from "../../constants/LOAN_SIM.js";

vi.mock("../../config.js", () => ({
  LANDING_BACKEND_URL: "https://backend.example.test",
  LANDING_BACKEND_API_KEY: "test-api-key",
}));

const cookieName = COOKIE_LEAD_TOKEN_CONFIG.NAME;
const sessionId = "callbell-de-esta-pagina";
const captureContext = { solicitudId: "7", captureSessionId: "11111111-1111-4111-8111-111111111111", baseRevision: "a".repeat(64) };
const originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, "cookie");
function restorePlatformMocks() {
  vi.restoreAllMocks();
  if (originalCookieDescriptor) {
    Object.defineProperty(document, "cookie", originalCookieDescriptor);
    return;
  }
  Reflect.deleteProperty(document, "cookie");
}
const denyStorage = () => {
  throw new DOMException("Acceso al almacenamiento denegado", "SecurityError");
};
const jsonResponse = (body) => ({
  ok: true, status: 200, json: async () => body,
});

beforeEach(async () => {
  restorePlatformMocks();
  await deleteCookie(cookieName);
});

afterEach(async () => {
  restorePlatformMocks();
  await deleteCookie(cookieName);
  vi.unstubAllGlobals();
});

describe("registro integrado con almacenamiento bloqueado", () => {
  it.each(["silencioso", "SecurityError"])(
    "crea el lead, valida OTP y sube DNI con bloqueo %s",
    async (cookieMode) => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(denyStorage);
      const cookieGetter = vi.spyOn(document, "cookie", "get");
      const cookieSetter = vi.spyOn(document, "cookie", "set");
      if (cookieMode === "SecurityError") {
        cookieGetter.mockImplementation(denyStorage);
        cookieSetter.mockImplementation(denyStorage);
      } else {
        cookieGetter.mockReturnValue("");
        cookieSetter.mockImplementation(() => {});
      }
      vi.stubGlobal("callbellSettings", {
        extra_params: { identifier: sessionId },
      });

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(jsonResponse({
          success: true,
          data: { lead: { id: 42 }, token: "jwt-nuevo" },
        }))
        .mockResolvedValueOnce(jsonResponse({ success: true }))
        .mockResolvedValueOnce(jsonResponse({ success: true }))
        .mockResolvedValueOnce(jsonResponse({ success: true, data: {
          ...captureContext, canCapture: true, estado_onboarding: "CELULAR_VALIDADO",
          dniReceivedForSession: false, receivedUploadId: null, receiptKind: "none",
        } }));
      vi.stubGlobal("fetch", fetchMock);

      const uploads = [];
      class FakeXHR {
        constructor() {
          this.requestHeaders = {};
          uploads.push(this);
        }
        open(method, url) { this.method = method; this.url = url; }
        setRequestHeader(name, value) { this.requestHeaders[name] = value; }
        getAllResponseHeaders() { return "Content-Type: application/json"; }
        send(body) {
          this.body = body;
          this.status = 200;
          this.responseText = JSON.stringify({ success: true, data: {
            solicitudId: body.get("solicitudId"), captureSessionId: body.get("captureSessionId"), uploadId: body.get("uploadId"),
            dniReceivedForSession: true, estado_onboarding: "DNI_SUBIDO", documentValidation: "not_performed",
          } });
          this.onload();
        }
      }
      vi.stubGlobal("XMLHttpRequest", FakeXHR);

      const created = await LeadRegistrationService.crearLead({
        dni: "30111222", celular: "1144445555", turnstileToken: "turnstile-test",
        situacion_laboral: "RELACION_DEPENDENCIA",
        term_y_cond: true, prevencion_fraudes: true,
      });
      expect(created.success).toBe(true);
      await setCookieWithDuration(
        cookieName, created.data.token, COOKIE_LEAD_TOKEN_CONFIG.EXPIRY_MS,
      );
      expect(await getCookie(cookieName)).toBe("jwt-nuevo");

      const leadId = created.data.lead.id;
      await expect(LeadRegistrationService.solicitarOTPCelular({
        leadId, celular: "1144445555",
      })).resolves.toMatchObject({ success: true });
      await expect(LeadRegistrationService.verificarOTPCelular({
        leadId, codigo: "123456", huella_dispositivo: null, requestId: null,
      })).resolves.toMatchObject({ success: true });
      await expect(LeadRegistrationService.obtenerContextoDni(leadId)).resolves.toMatchObject({ data: captureContext });
      await expect(LeadRegistrationService.subirDni({ leadId }, {
        dniFront: new Blob(["frente"], { type: "image/png" }),
        dniBack: new Blob(["dorso"], { type: "image/png" }),
      }, null, null, {
        context: captureContext,
        uploadId: "22222222-2222-4222-8222-222222222222", rotationFront: 0, rotationBack: 90,
      })).resolves.toMatchObject({ success: true });

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        "https://backend.example.test/api/lead-registration/crear",
        "https://backend.example.test/api/lead-registration/solicitar-otp-celular",
        "https://backend.example.test/api/lead-registration/verificar-otp-celular",
        "https://backend.example.test/api/lead-registration/dni-contexto/42",
      ]);
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
      for (const [, options] of fetchMock.mock.calls) {
        expect(options.headers["x-callbell-session-id"]).toBe(sessionId);
      }
      for (const [, options] of fetchMock.mock.calls.slice(1)) {
        expect(options.headers.Authorization).toBe("Bearer jwt-nuevo");
      }
      expect(uploads).toHaveLength(1);
      expect(uploads[0].method).toBe("POST");
      expect(uploads[0].url).toBe(
        "https://backend.example.test/api/lead-registration/subir-dni/42",
      );
      expect(uploads[0].requestHeaders).toMatchObject({
        "x-api-key": "test-api-key", Authorization: "Bearer jwt-nuevo",
        "x-callbell-session-id": sessionId,
      });
      expect(uploads[0].requestHeaders["Content-Type"]).toBeUndefined();
      expect(uploads[0].body).toBeInstanceOf(FormData);
      expect(uploads[0].body.get("dniFront").name).toBe("dni-front.png");
      expect(uploads[0].body.get("dniBack").name).toBe("dni-back.png");
    },
  );
});
