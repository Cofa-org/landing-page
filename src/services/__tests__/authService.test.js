import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config", () => ({
  LANDING_BACKEND_URL: "https://api.test",
  LANDING_BACKEND_API_KEY: "test-key",
}));

vi.mock("../../lib/http.js", () => ({
  HttpApi: vi.fn(),
}));

import { HttpApi } from "../../lib/http.js";
import AuthService from "../authService.js";

const ok = (body) => ({
  ok: true,
  json: async () => body,
});

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("login success devuelve el body (incluye perfil)", async () => {
    HttpApi.mockResolvedValue(ok({ success: true, email: "a@b.com", emailVerified: true }));
    const data = await AuthService.login("a@b.com", "pass", "tok");
    expect(data.email).toBe("a@b.com");
    expect(HttpApi).toHaveBeenCalledWith(
      "https://api.test/api/auth/login",
      { email: "a@b.com", password: "pass", turnstileToken: "tok" },
      "POST",
      "test-key",
      null,
      undefined,
    );
  });

  it("login con success:false lanza Error con cause", async () => {
    HttpApi.mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, message: "fail", cause: "AUTH_LOGIN_FAILED" }),
    });
    await expect(AuthService.login("a@b.com", "x", "tok")).rejects.toMatchObject({
      message: "fail",
      cause: "AUTH_LOGIN_FAILED",
    });
    expect(console.error).toHaveBeenCalledWith("AUTH_SERVICE_ERROR:", "AUTH_LOGIN_FAILED");
  });

  it("me es GET y pasa signal", async () => {
    const controller = new AbortController();
    HttpApi.mockResolvedValue(ok({ success: true, email: "a@b.com" }));
    await AuthService.me(controller.signal);
    expect(HttpApi.mock.calls[0][2]).toBe("GET");
    expect(HttpApi.mock.calls[0][5]).toBe(controller.signal);
  });

  it("resolveDni y registerExistingClient pegán los paths nuevos", async () => {
    HttpApi.mockResolvedValue(ok({ success: true, identities: [] }));
    await AuthService.resolveDni("30123456", "tok");
    expect(HttpApi.mock.calls[0][0]).toContain("/dni/resolve");

    HttpApi.mockResolvedValue(ok({ success: true, maskedEmail: "a****@b.com" }));
    await AuthService.registerExistingClient("20301234568", "passphrase", "tok");
    expect(HttpApi.mock.calls[1][0]).toContain("/register-existing-client");
  });

  it("forgot/reset/changePassword/requestEmailChange/confirmEmailChange", async () => {
    HttpApi.mockResolvedValue(ok({ success: true }));
    await AuthService.forgotPassword("a@b.com", "tok");
    await AuthService.resetPassword("token-value", "newpass12", "tok");
    await AuthService.changePassword("old", "newpass12");
    await AuthService.requestEmailChange("old", "n@b.com");
    await AuthService.confirmEmailChange("123456");
    expect(HttpApi).toHaveBeenCalledTimes(5);
  });
});
