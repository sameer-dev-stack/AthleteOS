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

// Maps the current visibility flag to the next <input type>. Pure so the
// toggle is unit-testable without rendering (eye/eye-off button).
export function nextPasswordInputType(isVisible: boolean): "text" | "password" {
  return isVisible ? "password" : "text";
}

// Trust signal shown under auth submit buttons. No emoji; single accent via CSS.
export function securedNote(): string {
  return "Secured by 256-bit encryption · No card required";
}
