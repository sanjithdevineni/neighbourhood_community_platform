package handlers

import (
	"community-platform-backend/models"
	"net/http"

	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

// Struct with DB dependency
type AnnouncementHandler struct {
	DB *gorm.DB
}

// Constructor
func NewAnnouncementHandler(db *gorm.DB) *AnnouncementHandler {
	return &AnnouncementHandler{DB: db}
}

// GET /announcements
func (h *AnnouncementHandler) GetAnnouncements(c *gin.Context) {
	var announcements []models.Announcement

	if err := h.DB.Order("created_at desc").Find(&announcements).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch announcements"})
		return
	}

	c.JSON(http.StatusOK, announcements)
}

// POST /announcements
func (h *AnnouncementHandler) CreateAnnouncement(c *gin.Context) {
	var newAnnouncement models.Announcement

	if err := c.ShouldBindJSON(&newAnnouncement); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// Validate required fields
	if newAnnouncement.Title == "" || newAnnouncement.Content == "" || newAnnouncement.Author == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Title, Content, and Author are required"})
		return
	}

	if err := h.DB.Create(&newAnnouncement).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create announcement"})
		return
	}

	c.JSON(http.StatusCreated, newAnnouncement)
}
