// package main

// import (
//     "log"
//     "net/http"
// )

// func main() {
//     mux := http.NewServeMux()

//     // Placeholder endpoint to confirm server is running
//     mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
//         w.WriteHeader(http.StatusOK)
//         _, _ = w.Write([]byte("Backend running"))
//     })

//     server := &http.Server{
//         Addr:    ":8080",
//         Handler: mux,
//     }

//     log.Println("Backend listening")
//     log.Fatal(server.ListenAndServe())
// }

package main

import (
	"community-platform-backend/config"
	"community-platform-backend/database"
	"community-platform-backend/middleware"
	"community-platform-backend/models"
	"community-platform-backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration from environment
	config.LoadConfig()

	// Initialize Database
	database.InitDatabase(config.DBName)

	// Auto migrate models
	database.DB.AutoMigrate(&models.Announcement{})

	// Create Gin router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Register routes
	routes.RegisterRoutes(router)

	// Start server
	router.Run(config.ServerPort)
}
