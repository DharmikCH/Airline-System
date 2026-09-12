// Every error response in this API has the same shape:
//   { "error": { "code": "SOME_CODE", "message": "Human readable text." } }
// The frontend can therefore write its error handling once.

// Helper for errors a controller detects itself, e.g. a missing field.
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

// Last middleware in the chain. Express routes anything passed to next(err),
// or thrown inside an async handler, to this function.
//
// The point of the mapping below is the stated requirement that no endpoint
// returns 500 for bad user input: a validation failure or a malformed id is
// the caller's mistake, so it must come back as a 4xx.
function errorHandler(err, req, res, next) {
  // Mongoose rejected the document, e.g. a missing required field or a number
  // outside its allowed range.
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return sendError(res, 400, 'VALIDATION_ERROR', message);
  }

  // An id in the URL was not a valid ObjectId.
  if (err.name === 'CastError') {
    return sendError(res, 400, 'INVALID_ID', 'The id in the URL is not valid.');
  }

  // A unique index rejected the write. Controllers that can predict this
  // (duplicate email, duplicate PNR) handle it themselves with a specific
  // code; this is the safety net for the ones that cannot.
  if (err.code === 11000) {
    return sendError(res, 409, 'DUPLICATE_VALUE', 'That value is already in use.');
  }

  // Anything reaching here is a genuine bug, so log it for us but do not leak
  // the internal message to the client.
  console.error(err);
  return sendError(res, 500, 'SERVER_ERROR', 'Something went wrong on the server.');
}

module.exports = { errorHandler, sendError };
