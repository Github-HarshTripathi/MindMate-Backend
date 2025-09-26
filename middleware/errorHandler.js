export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details
  console.error('🚨 Error Details:', {
    message: err.message,
    name: err.name,
    stack: isProduction ? undefined : err.stack,
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    isAxiosError: err.isAxiosError
  });

  let statusCode = err.status || err.statusCode || 500;
  let errorMessage = isProduction ? 'Something went wrong' : err.message;

  // Handle Axios errors
  if (err.isAxiosError) {
    statusCode = err.response?.status || 502;
    errorMessage = isProduction 
      ? 'External service error'
      : `API Error: ${err.response?.status || 'No response'} - ${err.message}`;
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoNetworkError') {
    statusCode = 503;
    errorMessage = isProduction ? 'Database temporarily unavailable' : err.message;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation failed';
  }

  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    ...(!isProduction && { 
      details: err.message,
      stack: err.stack 
    })
  });
};