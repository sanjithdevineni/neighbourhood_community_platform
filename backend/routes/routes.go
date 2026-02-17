package routes

import (
	"community-platform-backend/controllers"
	"community-platform-backend/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		api.GET("/announcements", controllers.GetAnnouncements)
		api.POST("/announcements", middleware.AuthMiddleware(), controllers.CreateAnnouncement)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}
}

// SetupRouter initializes the Gin engine and registers routes.
func SetupRouter() *gin.Engine {
	router := gin.Default()
	RegisterRoutes(router)
	return router
}
