package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware returns a Gin middleware that logs structured details
// for every HTTP request: method, path, status, latency, client IP, and user agent.
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		rawQuery := c.Request.URL.RawQuery

		// Process the request
		c.Next()

		// Calculate latency
		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		userAgent := c.Request.UserAgent()

		if rawQuery != "" {
			path = path + "?" + rawQuery
		}

		attrs := []any{
			"method", method,
			"path", path,
			"status", status,
			"latency_ms", latency.Milliseconds(),
			"client_ip", clientIP,
			"user_agent", userAgent,
		}

		// Log at different levels based on status code
		switch {
		case status >= 500:
			slog.Error("HTTP Request", attrs...)
		case status >= 400:
			slog.Warn("HTTP Request", attrs...)
		default:
			slog.Info("HTTP Request", attrs...)
		}
	}
}
