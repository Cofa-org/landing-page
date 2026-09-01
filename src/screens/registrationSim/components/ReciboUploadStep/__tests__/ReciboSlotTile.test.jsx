// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

import ReciboSlotTile from "../ReciboSlotTile.jsx";

const noop = () => {};

describe("ReciboSlotTile — detección de imagen vs PDF", () => {
  it("renders <img> con slot.preview cuando slot.file es null pero slot.mime es 'image/jpeg' (slot hidratado)", () => {
    const slot = {
      file: null,
      preview: "https://blob.example/recibo.jpg",
      mime: "image/jpeg",
      size: 12345,
      status: "uploaded",
      filename: "recibo.jpg",
    };

    const { container } = render(
      <ReciboSlotTile orden={1} slot={slot} onAddFile={noop} onClear={noop} />
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://blob.example/recibo.jpg");
  });

  it("renders PDF icon (no <img>) cuando slot.file es null y slot.mime es 'application/pdf' (slot hidratado PDF)", () => {
    const slot = {
      file: null,
      preview: "https://blob.example/recibo.pdf",
      mime: "application/pdf",
      size: 54321,
      status: "uploaded",
      filename: "recibo.pdf",
    };

    const { container } = render(
      <ReciboSlotTile orden={1} slot={slot} onAddFile={noop} onClear={noop} />
    );

    // PDF branch: no debe haber <img> renderizado.
    expect(container.querySelector("img")).toBeNull();
    // Y debe haber un PDF icon block (el contenedor con clase pdfIcon contiene el FaFilePdf).
    // Como no tenemos acceso directo a la clase CSS module, verificamos que NO
    // existe el img, y que el slot.filename sigue visible en el header.
    expect(screen.getByText((_, el) => el.textContent.startsWith("recibo.pdf"))).toBeInTheDocument();
  });

  it("mantiene compatibilidad hacia atrás: con slot.file.type='image/png' sigue renderizando <img>", () => {
    const file = new File(["(binary)"], "local.png", { type: "image/png" });
    const slot = {
      file,
      preview: "blob:http://localhost/local.png",
      status: "idle",
    };

    const { container } = render(
      <ReciboSlotTile orden={1} slot={slot} onAddFile={noop} onClear={noop} />
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("blob:http://localhost/local.png");
  });

  it("renders PDF icon cuando slot.file.type es 'application/pdf' (local upload PDF)", () => {
    const file = new File(["(binary)"], "local.pdf", { type: "application/pdf" });
    const slot = {
      file,
      preview: "blob:http://localhost/local.pdf",
      status: "idle",
    };

    const { container } = render(
      <ReciboSlotTile orden={1} slot={slot} onAddFile={noop} onClear={noop} />
    );

    expect(container.querySelector("img")).toBeNull();
  });
});
