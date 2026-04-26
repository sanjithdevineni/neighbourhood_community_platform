package routes

import (
	"community-platform-backend/controllers"
	"community-platform-backend/middleware"

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
		api.GET("/events", controllers.GetEvents)
		api.POST("/events", middleware.AuthMiddleware(), controllers.CreateEvent)
		api.PUT("/events/:id", middleware.AuthMiddleware(), controllers.UpdateEvent)
		api.DELETE("/events/:id", middleware.AuthMiddleware(), controllers.DeleteEvent)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}
}

// SetupRouter initializes the Gin engine and registers routes.
// Uses gin.New() instead of gin.Default() to avoid the built-in logger,
// since we use our own structured logging middleware.
func SetupRouter() *gin.Engine {
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.LoggerMiddleware())
	RegisterRoutes(router)
	return router
}
