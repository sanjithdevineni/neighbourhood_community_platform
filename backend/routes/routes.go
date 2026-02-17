package routes

import (
	"community-platform-backend/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		api.GET("/announcements", controllers.GetAnnouncements)
		api.POST("/announcements", controllers.CreateAnnouncement)
	}
}
