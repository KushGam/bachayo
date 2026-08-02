/** Marks the next SIGNED_OUT as user-initiated so we skip the session-expired alert. */
let intentionalSignOutUntil = 0;

export function markIntentionalSignOut() {
  // Keep the window open long enough for async signOut + auth listeners.
  intentionalSignOutUntil = Date.now() + 15_000;
}

/** True while a user-initiated logout is in progress (does not clear the flag). */
export function wasIntentionalSignOut() {
  return Date.now() <= intentionalSignOutUntil;
}
