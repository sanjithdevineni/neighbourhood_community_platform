package routes

import (
	"community-platform-backend/controllers"
	"community-platform-backend/middleware"

	"github.com/gin-contrib/cors"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		api.POST("/signup", controllers.Signup)
		api.POST("/login", controllers.Login)
		api.GET("/announcements", controllers.GetAnnouncements)
		api.POST("/announcements", middleware.AuthMiddleware(), controllers.CreateAnnouncement)
		api.POST("/announcements/update", middleware.AuthMiddleware(), controllers.UpdateAnnouncement)
		api.POST("/announcements/delete", middleware.AuthMiddleware(), controllers.DeleteAnnouncement)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}
}

// SetupRouter initializes the Gin engine and registers routes.
func SetupRouter() *gin.Engine {
	router := gin.Default()

    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:4200"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
    }))
	RegisterRoutes(router)
	return router
}
