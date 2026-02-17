package routes

import (
	"community-platform-backend/controllers"
	"community-platform-backend/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB) {
	api := router.Group("/api")
	// DB injection
	announcementController := controllers.NewAnnouncementController(db)
	{
		api.GET("/announcements", announcementController.GetAnnouncements)
		api.POST("/announcements", middleware.AuthMiddleware(), announcementController.CreateAnnouncement)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})
	}
}

// SetupRouter initializes the Gin engine and registers routes.
func SetupRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()
	RegisterRoutes(router, db)
	return router
}
