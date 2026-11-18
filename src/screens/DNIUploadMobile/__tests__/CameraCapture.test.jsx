// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import CameraCapture from "../components/CameraCapture/CameraCapture.jsx";

let stop;
let readyState;
let videoWidth;
let videoHeight;
let play;
let videoBox;
let resize;
let disconnect;
const props = { open: true, tipoFoto: "frente", onCapture: vi.fn(), onCancel: vi.fn() };
const openCamera = async () => {
  const view = render(<CameraCapture {...props} />);
  await act(async () => {});
  return view;
};

beforeEach(() => {
  stop = vi.fn();
  readyState = 4;
  videoWidth = 1200;
  videoHeight = 800;
  videoBox = { width: 400, height: 300 };
  vi.spyOn(HTMLVideoElement.prototype, "getBoundingClientRect").mockImplementation(() => videoBox);
  disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() { disconnect(); }
  });
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockImplementation(() => readyState);
  vi.spyOn(HTMLVideoElement.prototype, "videoWidth", "get").mockImplementation(() => videoWidth);
  vi.spyOn(HTMLVideoElement.prototype, "videoHeight", "get").mockImplementation(() => videoHeight);
  vi.stubGlobal("navigator", { mediaDevices: {
    getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop }] })),
  } });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("projects the visible mask against the painted pixels after video and box resizes", async () => {
  const { container } = await openCamera();
  const video = container.querySelector("video");
  expect(screen.getByRole("button", { name: "Capturar" })).toBeEnabled();
  videoWidth = 1200;
  videoHeight = 1600;
  fireEvent.resize(video);
  const guide = video.nextElementSibling.firstElementChild;
  expect(guide.style).toMatchObject({ left: "87.5px", top: "79.6875px", width: "225px", height: "140.625px" });
  videoBox = { width: 320, height: 240 };
  act(() => resize());
  expect(guide.style).toMatchObject({ left: "70px", top: "63.75px", width: "180px", height: "112.5px" });
  fireEvent.click(screen.getByRole("button", { name: "Cerrar cámara" }));
  expect(disconnect).toHaveBeenCalledOnce();
  expect(stop).toHaveBeenCalledOnce();
});

it("keeps the shutter disabled until the video has a visible box for the guide", async () => {
  videoBox = { width: 0, height: 0 };
  await openCamera();
  expect(screen.getByRole("button", { name: "Capturar" })).toBeDisabled();
  videoBox = { width: 400, height: 300 };
  act(() => resize());
  expect(screen.getByRole("button", { name: "Capturar" })).toBeEnabled();
});

it("keeps permission waiting as loading, offers a delayed hint and releases a late camera after close", async () => {
  vi.useFakeTimers();
  let permit;
  navigator.mediaDevices.getUserMedia.mockImplementation(() => new Promise(resolve => { permit = resolve; }));
  await openCamera();
  expect(screen.getByRole("status")).toHaveTextContent("Abriendo cámara");
  expect(screen.queryByRole("button", { name: "Capturar" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Hablar con un asesor" })).toBeNull();
  expect(screen.queryByText(/Si el navegador te pide permiso/)).toBeNull();
  await act(async () => { vi.advanceTimersByTime(5000); });
  expect(screen.getByText(/Si el navegador te pide permiso/)).toBeVisible();
  expect(screen.queryByRole("alert")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Cerrar cámara" }));
  await act(async () => { permit({ getTracks: () => [{ stop }] }); });
  expect(stop).toHaveBeenCalledOnce();
  expect(screen.queryByRole("button", { name: "Capturar" })).toBeNull();
});

it("waits for playback and a usable frame before showing capture, with no help on the happy path", async () => {
  readyState = 0;
  videoWidth = 0;
  videoHeight = 0;
  let finishPlayback;
  play.mockImplementation(() => new Promise(resolve => { finishPlayback = resolve; }));
  const { container } = await openCamera();
  const video = container.querySelector("video");
  expect(screen.getByRole("status")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Capturar" })).toBeNull();
  fireEvent.loadedData(video);
  await act(async () => { finishPlayback(); });
  expect(screen.getByRole("status")).toBeVisible();
  readyState = 2;
  videoWidth = 1200;
  videoHeight = 800;
  fireEvent.loadedData(video);
  expect(screen.getByRole("button", { name: "Capturar" })).toBeEnabled();
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByText(/Si no podés usar la cámara/)).toBeNull();
  expect(screen.queryByRole("button", { name: "Hablar con un asesor" })).toBeNull();
});

it.each([
  ["NotAllowedError", /Habilitá el permiso/],
  ["NotReadableError", /otra aplicación/],
])("shows actionable recovery only after %s and clears it on a successful retry", async (name, guidance) => {
  navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(new DOMException("PRIVATE-CANARY", name));
  await openCamera();
  expect(screen.getByRole("alert")).toHaveTextContent(guidance);
  expect(screen.getByRole("alert")).not.toHaveTextContent("PRIVATE-CANARY");
  expect(screen.getByRole("button", { name: "Hablar con un asesor" })).toBeVisible();
  expect(screen.queryByRole("status")).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Reintentar cámara" })); });
  expect(screen.getByRole("button", { name: "Capturar" })).toBeEnabled();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("button", { name: "Hablar con un asesor" })).toBeNull();
});

it("offers recovery and stops the camera when video playback fails", async () => {
  play.mockRejectedValue(new Error("PRIVATE-PLAYBACK"));
  await openCamera();
  expect(screen.getByRole("alert")).toHaveTextContent(/No pudimos iniciar el video/);
  expect(screen.getByRole("alert")).not.toHaveTextContent("PRIVATE-PLAYBACK");
  expect(screen.getByRole("button", { name: "Reintentar cámara" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Hablar con un asesor" })).toBeVisible();
  expect(screen.queryByRole("status")).toBeNull();
  expect(stop).toHaveBeenCalledOnce();
});

it("closes the error dialog and restores chat access when requesting an advisor", async () => {
  navigator.mediaDevices.getUserMedia.mockRejectedValue(new DOMException("synthetic", "NotAllowedError"));
  const host = document.createElement("div");
  host.id = "callbell-livechat-host";
  const launcher = document.createElement("button");
  launcher.setAttribute("aria-label", "Abrir chat");
  const openChat = vi.fn();
  launcher.addEventListener("click", openChat);
  host.append(launcher);
  document.body.append(host);
  const onCancel = vi.fn();
  try {
    render(<CameraCapture {...props} onCancel={onCancel} />);
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Hablar con un asesor" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(document.body.classList.contains("dni-camera-open")).toBe(false);
    expect(openChat).toHaveBeenCalledOnce();
  } finally { host.remove(); }
});

it("preserves another screen's chat visibility setting when the camera closes", async () => {
  document.body.classList.add("hide-callbell");
  try {
    const { unmount } = await openCamera();
    unmount();
    expect(document.body.classList.contains("dni-camera-open")).toBe(false);
    expect(document.body.classList.contains("hide-callbell")).toBe(true);
  } finally { document.body.classList.remove("hide-callbell"); }
});

it("does not let old playback readiness change a reopened camera session", async () => {
  let finishOldPlayback;
  play.mockImplementationOnce(() => new Promise(resolve => { finishOldPlayback = resolve; }));
  const { rerender } = await openCamera();
  expect(screen.queryByRole("button", { name: "Capturar" })).toBeNull();
  rerender(<CameraCapture {...props} open={false} />);
  readyState = 0;
  rerender(<CameraCapture {...props} />);
  await act(async () => { finishOldPlayback(); });
  expect(screen.getByRole("status")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Capturar" })).toBeNull();
  expect(stop).toHaveBeenCalledOnce();
});
