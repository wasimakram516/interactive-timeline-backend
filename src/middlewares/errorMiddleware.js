const errorHandler = (err, req, res, next) => {
    console.error("❌ Error:", err);
  
    const statusCode = err.statusCode || 500;
  
    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
      error: err.error || {},
    });
  };
  
  // Custom Error Class
  class ErrorResponse extends Error {
    constructor(message, statusCode, error = {}) {
      super(message);
      this.statusCode = statusCode;
      this.error = error;
    }
  }
  
  module.exports = { errorHandler, ErrorResponse };
  