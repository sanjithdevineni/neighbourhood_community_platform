package main

import (
	"community-platform-backend/config"
	"community-platform-backend/database"
	"community-platform-backend/middleware"
	"community-platform-backend/models"
	"community-platform-backend/routes"
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Load configuration from environment
	config.LoadConfig()

	// Initialize Database — exit immediately on any connection error
	if err := database.InitDatabase(config.DBName); err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer database.CloseDatabase()

	// Auto migrate models
	if err := database.DB.AutoMigrate(&models.User{}, &models.Announcement{}); err != nil {
		log.Fatalf("AutoMigrate failed: %v", err)
	}

	// Initialize router and register routes
	router := routes.SetupRouter()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Wrap the router in an http.Server so we can shut it down gracefully
	srv := &http.Server{
		Addr:    config.ServerPort,
		Handler: router,
	}

	// Run the server in a goroutine so the main goroutine can listen for signals
	go func() {
		log.Printf("Server listening on %s", config.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Block until SIGINT or SIGTERM is received
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown signal received, stopping server...")

	// Give in-flight requests up to 5 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}
	log.Println("Server stopped.")
	// database.CloseDatabase() is called via defer above
}
