// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("../../../../../services/authService.js", () => ({
  default: {
    forgotPassword: vi.fn(),
  },
}));

import authService from "../../../../../services/authService.js";
import { useForgotPassword } from "../useForgotPassword.js";

describe("useForgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("honeypot relleno no llama a forgotPassword", async () => {
    const { result } = renderHook(() => useForgotPassword());
    act(() => {
      result.current.setEmail("a@b.com");
      result.current.setHoneypot("bot");
      result.current.turnstile.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(authService.forgotPassword).not.toHaveBeenCalled();
    expect(result.current.sent).toBe(false);
  });

  it("sin honeypot marca sent", async () => {
    authService.forgotPassword.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useForgotPassword());
    act(() => {
      result.current.setEmail("a@b.com");
      result.current.turnstile.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(authService.forgotPassword).toHaveBeenCalledWith("a@b.com", "tok");
    expect(result.current.sent).toBe(true);
  });
});
