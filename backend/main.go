package main

import (
	"community-platform-backend/config"
	"community-platform-backend/database"
	"community-platform-backend/middleware"
	"community-platform-backend/models"
	"community-platform-backend/routes"

	"log"
)

func main() {
	// Load configuration from environment
	config.LoadConfig()

	// Initialize Database
	db, err := database.InitDatabase(config.DBName)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate models
	db.AutoMigrate(&models.Announcement{})

	// Initialize router and register routes
	router := routes.SetupRouter(db)

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Start server
	router.Run(config.ServerPort)
}
