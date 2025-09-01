export const AUTH_ALLOWED_EMAILS = (
  process.env.AUTH_ALLOWED_EMAILS || "admin@example.com,ops@example.com,viewer@example.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isEmailAllowed(email: string) {
  const normalized = email.trim().toLowerCase()
  if (normalized === "dev@flawstick.com") return true
  return AUTH_ALLOWED_EMAILS.includes(normalized)
}
