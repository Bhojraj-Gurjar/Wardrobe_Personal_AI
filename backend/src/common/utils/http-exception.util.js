export function isNestHttpException(error) {
  return Boolean(
    error
    && typeof error === 'object'
    && typeof error.getStatus === 'function'
    && typeof error.getResponse === 'function',
  );
}

export function getNestHttpStatus(error) {
  if (!isNestHttpException(error)) {
    return null;
  }

  return error.getStatus();
}

export function isRethrowableAiError(error) {
  const status = getNestHttpStatus(error);
  return status !== null && [400, 401, 409, 429, 503].includes(status);
}
