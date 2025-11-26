// List of authorized admin emails
const AUTHORIZED_ADMINS = [
  'info@dentalschoolguide.com'
]

export function isAuthorizedAdmin(email: string | undefined): boolean {
  if (!email) return false
  return AUTHORIZED_ADMINS.includes(email.toLowerCase())
}

export function getAuthorizedAdmins(): string[] {
  return AUTHORIZED_ADMINS
}
