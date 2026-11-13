/**
 * Step model for the product detail wizard.
 *
 * When a product has addon groups, each group is one step and an extra
 * dedicated step is appended at the end for the item observations, so the
 * observations field gets its own screen instead of being squeezed under the
 * last addon group. When a product has no addon groups there is no wizard and
 * observations are shown inline on the main screen.
 */

const ADD_TO_CART = "Adicionar ao pedido";
const UPDATE_CART = "Atualizar pedido";
const NEXT_STEP = "Próximo passo";

export function getTotalSteps(addonGroupCount: number): number {
  return addonGroupCount > 0 ? addonGroupCount + 1 : 0;
}

export function isObservationsStep(
  currentStep: number,
  addonGroupCount: number,
): boolean {
  return addonGroupCount > 0 && currentStep === addonGroupCount;
}

export function getStepButtonText(
  currentStep: number,
  addonGroupCount: number,
  isEditing: boolean,
): string {
  const actionText = isEditing ? UPDATE_CART : ADD_TO_CART;
  const totalSteps = getTotalSteps(addonGroupCount);

  if (totalSteps === 0) {
    return actionText;
  }
  if (currentStep < totalSteps - 1) {
    return NEXT_STEP;
  }
  return actionText;
}
