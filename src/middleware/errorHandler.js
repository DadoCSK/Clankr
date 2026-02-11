function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }
  if (err.code === '23503') {
    return res.status(404).json({ error: 'Referenced resource not found' });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;
