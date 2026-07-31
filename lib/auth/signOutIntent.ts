/** Marks the next SIGNED_OUT as user-initiated so we skip the session-expired alert. */
let intentionalSignOutUntil = 0;

export function markIntentionalSignOut() {
  intentionalSignOutUntil = Date.now() + 4000;
}

export function wasIntentionalSignOut() {
  if (Date.now() <= intentionalSignOutUntil) {
    intentionalSignOutUntil = 0;
    return true;
  }
  return false;
}
