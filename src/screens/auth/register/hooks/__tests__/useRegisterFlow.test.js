import { describe, it, expect } from "vitest";
import { nextStepFromExisting, STEP } from "../useRegisterFlow.js";

describe("nextStepFromExisting", () => {
  it("sin mail enmascarado va a registro nuevo", () => {
    expect(nextStepFromExisting(null)).toBe(STEP.REGISTER);
    expect(nextStepFromExisting({})).toBe(STEP.REGISTER);
  });

  it("cuenta verificada va a ya registrada", () => {
    expect(
      nextStepFromExisting({
        maskedEmail: "a****@b.com",
        alreadyRegistered: true,
        verified: true,
      }),
    ).toBe(STEP.ALREADY_REGISTERED);
  });

  it("cliente SB sin cuenta verificada va a existing", () => {
    expect(
      nextStepFromExisting({ maskedEmail: "a****@b.com" }),
    ).toBe(STEP.EXISTING);
    expect(
      nextStepFromExisting({
        maskedEmail: "a****@b.com",
        alreadyRegistered: true,
        verified: false,
      }),
    ).toBe(STEP.EXISTING);
  });
});
