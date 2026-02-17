package controllers

import (
	"net/http"

	"community-platform-backend/database"
	"community-platform-backend/models"

	"github.com/gin-gonic/gin"
)

func GetAnnouncements(c *gin.Context) {
	var announcements []models.Announcement

	if err := database.DB.Find(&announcements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch"})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func CreateAnnouncement(c *gin.Context) {
	var announcement models.Announcement

	if err := c.BindJSON(&announcement); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if err := database.DB.Create(&announcement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
		return
	}

	c.JSON(http.StatusCreated, announcement)
}
