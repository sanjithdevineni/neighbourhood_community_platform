package controllers

import (
	"net/http"

	"community-platform-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Struct holding dependencies
type AnnouncementController struct {
	DB *gorm.DB
}

// Constructor
func NewAnnouncementController(db *gorm.DB) *AnnouncementController {
	return &AnnouncementController{DB: db}
}

func (ac *AnnouncementController) GetAnnouncements(c *gin.Context) {
	var announcements []models.Announcement

	if err := ac.DB.Find(&announcements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch"})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func (ac *AnnouncementController) CreateAnnouncement(c *gin.Context) {
	var announcement models.Announcement

	if err := c.BindJSON(&announcement); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}
	// If middleware attached userID, prefer it as the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok && s != "" {
			announcement.Author = s
		}
	}

	if err := ac.DB.Create(&announcement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
		return
	}

	c.JSON(http.StatusCreated, announcement)
}
