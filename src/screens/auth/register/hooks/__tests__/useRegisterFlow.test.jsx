// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("../../../../../services/authService.js", () => ({
  default: {
    resolveDni: vi.fn(),
    register: vi.fn(),
    registerExistingClient: vi.fn(),
    verifyEmail: vi.fn(),
    resendOtp: vi.fn(),
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

import authService from "../../../../../services/authService.js";
import { useRegisterFlow, STEP } from "../useRegisterFlow.js";

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe("useRegisterFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("alta nueva va a /ingresar, no a verify", async () => {
    authService.register.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });

    act(() => {
      result.current.setEmail("nuevo@test.com");
      result.current.setPassword("password1");
      result.current.turnstileReg.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleRegister();
    });

    expect(authService.register).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/ingresar", {
      replace: true,
      state: { from: undefined },
    });
    expect(result.current.step).toBe(STEP.DNI);
    expect(sessionStorage.getItem("cofa_auth_flash")).toMatch(/si el email es nuevo/i);
  });

  it("cliente SB no verificado va a VERIFY", async () => {
    authService.registerExistingClient.mockResolvedValue({
      email: "full@test.com",
      maskedEmail: "f****@t.com",
    });
    const { result } = renderHook(() => useRegisterFlow(), { wrapper });

    act(() => {
      result.current.setPasswordExisting("password1");
      result.current.turnstileExisting.onVerify("tok");
    });
    await act(async () => {
      await result.current.handleExistingClientRegister();
    });

    await waitFor(() => {
      expect(result.current.step).toBe(STEP.VERIFY);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
