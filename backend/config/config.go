package config

import (
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

var (
	ServerPort  string
	DBName      string
	JwtSecret   string
	TokenExpiry time.Duration
	FrontendURL string
)

// LoadConfig loads environment variables from .env and the environment.
func LoadConfig() {
	// prefer local .env but ignore error if not present
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	ServerPort = ":" + port

	DBName = os.Getenv("DB_NAME")
	if DBName == "" {
		DBName = "community.db"
	}

	JwtSecret = os.Getenv("JWT_SECRET")
	if JwtSecret == "" {
		slog.Warn("JWT_SECRET is not set, using default insecure secret")
		JwtSecret = "insecure-default-secret"
	}

	expiry := os.Getenv("TOKEN_EXPIRY")
	if expiry == "" {
		expiry = "24h"
	}

	// Try to parse duration like "24h" or a plain integer as hours
	d, err := time.ParseDuration(expiry)
	if err != nil {
		if i, err2 := strconv.Atoi(expiry); err2 == nil {
			d = time.Duration(i) * time.Hour
		} else {
			slog.Warn("Invalid TOKEN_EXPIRY, defaulting to 24h", "value", expiry)
			d = 24 * time.Hour
		}
	}
	TokenExpiry = d

	FrontendURL = os.Getenv("FRONTEND_URL")
	if FrontendURL == "" {
		slog.Warn("FRONTEND_URL is not set, using default localhost:4200")
		FrontendURL = "http://localhost:4200"
	}

	slog.Info("Configuration loaded",
		"port", ServerPort,
		"db_name", DBName,
		"token_expiry", TokenExpiry.String(),
		"frontend_url", FrontendURL,
	)
}
