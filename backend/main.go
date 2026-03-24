package main

import (
	"log/slog"

	"community-platform-backend/config"
	"community-platform-backend/database"
	applog "community-platform-backend/log"
	"community-platform-backend/middleware"
	"community-platform-backend/models"
	"community-platform-backend/routes"
)

func main() {
	// Initialize structured logger first
	applog.Init()

	// Load configuration from environment
	config.LoadConfig()

	// Initialize Database
	database.InitDatabase(config.DBName)

	// Auto migrate models
	database.DB.AutoMigrate(&models.User{}, &models.Announcement{})

	// Initialize router and register routes
	router := routes.SetupRouter()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	slog.Info("Server starting", "port", config.ServerPort)

	// Start server
	router.Run(config.ServerPort)
}
