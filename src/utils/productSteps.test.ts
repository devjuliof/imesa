import {
  getTotalSteps,
  isObservationsStep,
  getStepButtonText,
} from "./productSteps";

describe("getTotalSteps", () => {
  it("has no wizard steps when the product has no addon groups", () => {
    expect(getTotalSteps(0)).toBe(0);
  });

  it("adds a dedicated observations step after the addon groups", () => {
    expect(getTotalSteps(1)).toBe(2);
    expect(getTotalSteps(3)).toBe(4);
  });
});

describe("isObservationsStep", () => {
  it("is never the observations step when there are no addon groups", () => {
    expect(isObservationsStep(0, 0)).toBe(false);
  });

  it("is not the observations step while the user is still choosing addons", () => {
    // 3 addon groups => addon steps are index 0, 1, 2
    expect(isObservationsStep(0, 3)).toBe(false);
    expect(isObservationsStep(2, 3)).toBe(false);
  });

  it("is the observations step on the extra final step after all addon groups", () => {
    // 3 addon groups => observations step is index 3
    expect(isObservationsStep(3, 3)).toBe(true);
    // 1 addon group => observations step is index 1
    expect(isObservationsStep(1, 1)).toBe(true);
  });
});

describe("getStepButtonText", () => {
  it("adds to cart directly when the product has no addon groups", () => {
    expect(getStepButtonText(0, 0, false)).toBe("Adicionar ao pedido");
  });

  it("updates the cart directly when editing a product with no addon groups", () => {
    expect(getStepButtonText(0, 0, true)).toBe("Atualizar pedido");
  });

  it("advances to the next step while on an addon group step", () => {
    // 3 addon groups => steps 0, 1, 2 are addons, step 3 is observations
    expect(getStepButtonText(0, 3, false)).toBe("Próximo passo");
    expect(getStepButtonText(2, 3, false)).toBe("Próximo passo");
  });

  it("adds to cart on the final observations step", () => {
    expect(getStepButtonText(3, 3, false)).toBe("Adicionar ao pedido");
  });

  it("updates the cart on the final observations step when editing", () => {
    expect(getStepButtonText(3, 3, true)).toBe("Atualizar pedido");
  });
});
