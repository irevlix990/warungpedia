/**
 * Typed application errors.
 *
 * Server-side services throw these instead of raw errors so that callers
 * can distinguish authorization, validation, and not-found failures, and so
 * technical details are never exposed directly to users.
 */

export class AppError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

/** Thrown when the authenticated user lacks the required permission/role. */
export class UnauthorizedError extends AppError {
  constructor(message = 'Anda tidak memiliki akses.') {
    super('UNAUTHORIZED', message, 403)
    this.name = 'UnauthorizedError'
  }
}

/** Thrown when a resource does not exist or the caller cannot see it. */
export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan.') {
    super('NOT_FOUND', message, 404)
    this.name = 'NotFoundError'
  }
}

/** Thrown when an authenticated session is required but absent. */
export class AuthenticationRequiredError extends AppError {
  constructor(message = 'Silakan masuk terlebih dahulu.') {
    super('AUTH_REQUIRED', message, 401)
    this.name = 'AuthenticationRequiredError'
  }
}

/** Thrown when input fails server-side validation / business rules. */
export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION') {
    super(code, message, 400)
    this.name = 'ValidationError'
  }
}

/** Thrown when a financial/integrity constraint is violated. */
export class IntegrityError extends AppError {
  constructor(message = 'Operasi ditolak untuk menjaga integritas data.') {
    super('INTEGRITY', message, 409)
    this.name = 'IntegrityError'
  }
}
