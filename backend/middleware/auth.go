package middleware

import (
	"strings"
	"time"

	"community-platform-backend/config"
	"community-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates JWT from the Authorization header.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.RespondWithError(c, utils.Unauthorized("Authorization header missing"))
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			utils.RespondWithError(c, utils.Unauthorized("Invalid authorization header format"))
			c.Abort()
			return
		}

		tokenStr := parts[1]

		token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
			return []byte(config.JwtSecret), nil
		})
		if err != nil || token == nil {
			utils.RespondWithError(c, utils.Unauthorized("Invalid token"))
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*jwt.RegisteredClaims)
		if !ok || !token.Valid {
			utils.RespondWithError(c, utils.Unauthorized("Invalid token claims"))
			c.Abort()
			return
		}

		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			utils.RespondWithError(c, utils.Unauthorized("Token expired"))
			c.Abort()
			return
		}

		// use Subject as user ID
		userID := claims.Subject
		if userID == "" {
			utils.RespondWithError(c, utils.Unauthorized("Token subject missing"))
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
