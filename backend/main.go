package main

import (
	"community-platform-backend/config"
	"community-platform-backend/database"
	"community-platform-backend/middleware"
	"community-platform-backend/models"
	"community-platform-backend/routes"
)

func main() {
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

	// Start server
	router.Run(config.ServerPort)
}
