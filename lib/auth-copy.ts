// Pure copy builder for the post-signup verification screen. Keeps user-facing
// text in one testable place (no emoji; single accent handled by CSS).
export function accountCreatedCopy(email: string | null | undefined) {
  const safeEmail = email && email.trim() ? email.trim() : null;
  return {
    heading: "Your account has been created",
    body: safeEmail
      ? `Please verify your account — a verification email has been sent to ${safeEmail}.`
      : "Please verify your account — a verification email has been sent to your email.",
  };
}
