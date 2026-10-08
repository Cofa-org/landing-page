import { describe, it, expect, beforeEach } from "vitest";
import { writeAuthFlash, consumeAuthFlash } from "../authFlash.js";

describe("authFlash", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("persiste y se consume una sola vez", () => {
    writeAuthFlash("hola");
    expect(consumeAuthFlash()).toBe("hola");
    expect(consumeAuthFlash()).toBe("");
  });
});
