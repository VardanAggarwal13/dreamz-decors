export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, _next) => {
  let status = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 404;
    message = 'Resource not found';
  }
  if (err.code === 11000) {
    status = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue).join(', ')}`;
  }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image size exceeds the 10MB limit. Please choose images under 10MB.';
    } else {
      message = err.message || 'File upload error';
    }
  }

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
