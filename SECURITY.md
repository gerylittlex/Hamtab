# SECURITY.md

- Passwords hashed with scrypt.
- Session tokens HMAC-signed and versioned (invalidated on password change / logout-everywhere).
- Rate limiting on auth endpoints.
- CSP, X-Frame-Options, X-Content-Type-Options headers.
- Input validation on all mutating endpoints.
- Ownership checks on all user-scoped resources.
- HTML escaping for dynamic UI content.
- Open-redirect protection on auth pages.
