package main

import (
	"community-platform-backend/database"
	"community-platform-backend/handlers"
	"community-platform-backend/models"
	"net/http"

	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	db, err := database.ConnectToSQLite()
	if err != nil {
		log.Fatal(err)
	}

	// Get underlying sql.DB
	sqlDB, err := db.DB()
	if err != nil {
		panic(err)
	}
	// Close DB when main exits
	//defer sqlDB.Close()

	// Perform database migration
	err = db.AutoMigrate(&models.Announcement{})
	if err != nil {
		log.Fatal(err)
	}

	announcementHandler := handlers.NewAnnouncementHandler(db)

	// Setup api routes
	r := gin.Default()
	r.GET("/announcements", announcementHandler.GetAnnouncements)
	r.POST("/announcements", announcementHandler.CreateAnnouncement)

	// Create HTTP server using gin as Handler
	srv := &http.Server{
		Addr:         ":8080",
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Println("Starting server on :8080")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit

	log.Printf("Received signal: %v. Shutting down server...", sig)

	// Create shutdown context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Attempt graceful shutdown of HTTP server
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	} else {
		log.Println("Server shutdown completed successfully")
	}

	// Close database connection
	log.Println("Closing database connection...")
	if err := sqlDB.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
	} else {
		log.Println("Database connection closed successfully")
	}

	log.Println("Application exited")
}
