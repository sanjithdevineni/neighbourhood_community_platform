package utils

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// AppError represents a standardized application error
type AppError struct {
	Message    string `json:"error"`
	Code       string `json:"code"`
	StatusCode int    `json:"status_code"`
}

// NewAppError creates a new AppError with the given message, code, and HTTP status code
func NewAppError(message string, code string, statusCode int) *AppError {
	return &AppError{
		Message:    message,
		Code:       code,
		StatusCode: statusCode,
	}
}

// Common error constructors for frequently used errors

// BadRequest returns a 400 Bad Request error
func BadRequest(message string) *AppError {
	return NewAppError(message, "BAD_REQUEST", http.StatusBadRequest)
}

// Unauthorized returns a 401 Unauthorized error
func Unauthorized(message string) *AppError {
	return NewAppError(message, "UNAUTHORIZED", http.StatusUnauthorized)
}

// Forbidden returns a 403 Forbidden error
func Forbidden(message string) *AppError {
	return NewAppError(message, "FORBIDDEN", http.StatusForbidden)
}

// NotFound returns a 404 Not Found error
func NotFound(message string) *AppError {
	return NewAppError(message, "NOT_FOUND", http.StatusNotFound)
}

// Conflict returns a 409 Conflict error
func Conflict(message string) *AppError {
	return NewAppError(message, "CONFLICT", http.StatusConflict)
}

// InternalServerError returns a 500 Internal Server Error
func InternalServerError(message string) *AppError {
	return NewAppError(message, "INTERNAL_SERVER_ERROR", http.StatusInternalServerError)
}

// RespondWithError sends the error as a JSON response
func RespondWithError(c *gin.Context, err *AppError) {
	// Log server errors for monitoring
	if err.StatusCode >= 500 {
		log.Printf("Error: %s (Code: %s, Status: %d), URL: %s, Method: %s", err.Message, err.Code, err.StatusCode, c.Request.URL.Path, c.Request.Method)
	}
	c.AbortWithStatusJSON(err.StatusCode, gin.H{
		"error": err.Message,
		"code":  err.Code,
	})
}
