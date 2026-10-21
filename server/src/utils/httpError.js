/**
 * Small HTTP-aware error used by the service layer so route handlers can keep
 * their current 4xx semantics without each service re-implementing them.
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * Route error responder: HttpError keeps its status/message, anything else is
 * logged and reported as a generic 500 so internals never leak.
 */
function fail(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server error' });
}

module.exports = { HttpError, fail };
