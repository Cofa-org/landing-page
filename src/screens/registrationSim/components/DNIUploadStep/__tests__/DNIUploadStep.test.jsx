// @vitest-environment jsdom
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import Service from "../../../../../services/leadRegistrationService.js";
import DNIUploadStep from "../DNIUploadStep.jsx";
vi.mock("../../../../../services/leadRegistrationService.js", () => ({ default: { obtenerContextoDni: vi.fn(), subirDniMobile: vi.fn(), subirDni: vi.fn() } }));
vi.mock("../../../../../utils/callbellHelpers.js", () => ({ openCallbellWebchat: vi.fn() }));
const context = { solicitudId: "9007199254740993", captureSessionId: "11111111-1111-4111-8111-111111111111", baseRevision: "a".repeat(64) };
const snapshot = (extra = {}) => ({ success: true, data: { ...context, estado_onboarding: "CELULAR_VALIDADO", canCapture: true, dniReceivedForSession: false, receivedUploadId: null, receiptKind: "none", ...extra } });
beforeEach(() => {
 vi.clearAllMocks();
 Object.defineProperty(navigator, "userAgent", { configurable: true, value: "Windows desktop" });
 Object.defineProperty(navigator, "userAgentData", { configurable: true, value: { mobile: false } });
 Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn() } });
 window.matchMedia = vi.fn(() => ({ matches: true }));
 Service.obtenerContextoDni.mockResolvedValue(snapshot());
});
afterEach(cleanup);
it("touch PC with webcam stays handoff; programmatic submit never uploads", async () => {
 const { container } = render(<DNIUploadStep leadId="42" leadToken="synthetic+token" />);
 expect(container.querySelector('input[type="file"]')).toBeNull();
 const qr = await screen.findByTitle("Escaneá con tu celular");
 const expectedUrl = new URL("/subir-dni", window.location.origin);
 expectedUrl.search = new URLSearchParams({ leadId: "42", token: "synthetic+token", ...context });
 const expected = render(<QRCodeSVG value={expectedUrl.href} size={180} />);
 expect(qr.querySelector("path:last-child").getAttribute("d")).toBe(expected.container.querySelector("path:last-child").getAttribute("d"));
 expect(container.querySelectorAll('a[href*="/subir-dni?"]').length).toBe(0);
 fireEvent.submit(container.querySelector("form"));
 expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
 expect(Service.subirDniMobile).not.toHaveBeenCalled();
 expect(screen.queryByRole("button", { name: /Sacar foto/ })).toBeNull();
});
it("phone offers camera by action, no files even after denied permission", async () => {
 Object.defineProperty(navigator, "userAgentData", { configurable: true, value: { mobile: true } });
 navigator.mediaDevices.getUserMedia.mockRejectedValue(new DOMException("canary", "NotAllowedError"));
 const { container } = render(<DNIUploadStep leadId="42" leadToken="synthetic" />);
 fireEvent.click(await screen.findByRole("button", { name: "Sacar foto del frente" }));
 expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole("button", { name: "Activar cámara" }));
 await screen.findByRole("button", { name: "Reintentar cámara" });
 expect(container.querySelector('input[type="file"]')).toBeNull();
 expect(screen.getAllByRole("button", { name:"Hablar con un asesor" }).length).toBeGreaterThan(0);
 expect(screen.queryAllByRole("link")).toHaveLength(0);
 expect(screen.queryByText("canary")).toBeNull();
});
it("does not expose QR for safe404", async () => {
 Service.obtenerContextoDni.mockResolvedValue({ success:false, status:404, cause:"DNI_CAPTURE_NOT_FOUND", message:"raw-canary" });
 render(<DNIUploadStep leadId="42" leadToken="synthetic" />);
 await screen.findByRole("alert");
 expect(screen.queryByTitle("Escaneá con tu celular")).toBeNull();
 expect(screen.queryByText("raw-canary")).toBeNull();
});
it("receipt restore failure retries continuation without POST", async () => {
 Service.obtenerContextoDni.mockResolvedValue(snapshot({ dniReceivedForSession:true, receiptKind:"current_session", receivedUploadId:"22222222-2222-4222-8222-222222222222", estado_onboarding:"DNI_SUBIDO" }));
 const onSuccess = vi.fn().mockRejectedValueOnce(new Error("raw-canary")).mockResolvedValue();
 render(<DNIUploadStep leadId="42" leadToken="synthetic" onSuccess={onSuccess} />);
 expect(await screen.findByRole("alert")).toHaveTextContent("Tus fotos se guardaron. Volvé a intentar continuar.");
 fireEvent.click(screen.getByRole("button", { name:"Volver a intentar continuar" }));
 await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(2));
 expect(Service.subirDniMobile).not.toHaveBeenCalled();
});

it.each(['frente', 'dorso'])('returns focus to the %s invoker when pointer click did not focus it', async side => {
 Object.defineProperty(navigator, 'userAgentData', { configurable: true, value: { mobile: true } });
 render(<DNIUploadStep leadId="42" leadToken="synthetic" />);
 const opener = await screen.findByRole('button', { name: `Sacar foto del ${side}` });
 await waitFor(() => expect(opener).toBeEnabled());
 expect(opener).not.toHaveFocus();
 // fireEvent preserves WebKit's pointer behavior: clicking does not focus the button.
 fireEvent.click(opener);
 expect(screen.getByRole('button', { name: 'Cerrar cámara' })).toHaveFocus();
 fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
 await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
 expect(opener).toHaveFocus();
 expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
});
