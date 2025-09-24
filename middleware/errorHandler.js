export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // 🌐 Log full error details (useful in dev)
  console.error('🚨 Error Details:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  let statusCode = err.status || 500;
  let errorMessage = isProduction ? 'Server error' : err.message;

  // ✅ Handle Axios errors explicitly
  if (err.name === 'AxiosError' || err.isAxiosError) {
    statusCode = err.response?.status || 500;
    errorMessage = isProduction
      ? 'External API error'
      : `API Error: ${err.response?.status || 500} - ${err.response?.statusText || err.message}`;
  }

  // Send JSON error response
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    ...(isProduction ? {} : { details: err.stack }) // Only expose stack trace in dev
  });
};
