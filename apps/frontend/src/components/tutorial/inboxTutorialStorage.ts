/** Session flag: user started inbox tutorial from Tutorials (entry `/tutorial/dashboard`). */
export const INBOX_TUTORIAL_SESSION_KEY = "hanover-inbox-tutorial";

export function setInboxTutorialSession(active: boolean): void {
  try {
    if (active) {
      sessionStorage.setItem(INBOX_TUTORIAL_SESSION_KEY, "1");
    } else {
      sessionStorage.removeItem(INBOX_TUTORIAL_SESSION_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function readInboxTutorialSession(): boolean {
  try {
    return sessionStorage.getItem(INBOX_TUTORIAL_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
