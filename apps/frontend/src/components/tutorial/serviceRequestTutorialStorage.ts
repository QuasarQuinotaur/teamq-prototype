/** Session flag: user started service-request tutorial from Help (entry may be `/tutorial/dashboard`). */
export const SR_TUTORIAL_SESSION_KEY = "hanover-sr-tutorial";

export function setServiceRequestTutorialSession(active: boolean): void {
  try {
    if (active) {
      sessionStorage.setItem(SR_TUTORIAL_SESSION_KEY, "1");
    } else {
      sessionStorage.removeItem(SR_TUTORIAL_SESSION_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readServiceRequestTutorialSession(): boolean {
  try {
    return sessionStorage.getItem(SR_TUTORIAL_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
