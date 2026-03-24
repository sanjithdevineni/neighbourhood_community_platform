package controllers

import (
	"log/slog"
	"net/http"

	"community-platform-backend/database"
	"community-platform-backend/models"

	"github.com/gin-gonic/gin"
)

func GetAnnouncements(c *gin.Context) {
	var announcements []models.Announcement

	if err := database.DB.Find(&announcements).Error; err != nil {
		slog.Error("Failed to fetch announcements", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch"})
		return
	}

	slog.Info("Announcements fetched", "count", len(announcements))
	c.JSON(http.StatusOK, announcements)
}

func CreateAnnouncement(c *gin.Context) {
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

	if err := database.DB.Create(&announcement).Error; err != nil {
		slog.Error("Failed to create announcement", "error", err, "author", announcement.Author)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create"})
		return
	}

	slog.Info("Announcement created", "id", announcement.ID, "author", announcement.Author, "title", announcement.Title)
	c.JSON(http.StatusCreated, announcement)
}

// UpdateAnnouncement updates an existing announcement. Requires authentication.
func UpdateAnnouncement(c *gin.Context) {
	var req struct {
		ID      uint   `json:"id" binding:"required"`
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	var announcement models.Announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		slog.Warn("Announcement not found for update", "id", req.ID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != announcement.Author {
				slog.Warn("Unauthorized update attempt", "announcement_id", req.ID, "user_id", s, "author", announcement.Author)
				c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to update this announcement"})
				return
			}
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Apply updates if provided
	updated := map[string]interface{}{}
	if req.Title != "" {
		updated["title"] = req.Title
	}
	if req.Content != "" {
		updated["content"] = req.Content
	}

	if len(updated) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	if err := database.DB.Model(&announcement).Updates(updated).Error; err != nil {
		slog.Error("Failed to update announcement", "error", err, "id", req.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update"})
		return
	}

	// Return the updated announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		slog.Error("Failed to fetch updated announcement", "error", err, "id", req.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated announcement"})
		return
	}

	slog.Info("Announcement updated", "id", req.ID)
	c.JSON(http.StatusOK, announcement)
}

// DeleteAnnouncement deletes an existing announcement. Requires authentication.
func DeleteAnnouncement(c *gin.Context) {
	var req struct {
		ID uint `json:"id" binding:"required"`
	}

	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	var announcement models.Announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		slog.Warn("Announcement not found for deletion", "id", req.ID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Announcement not found"})
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != announcement.Author {
				slog.Warn("Unauthorized delete attempt", "announcement_id", req.ID, "user_id", s, "author", announcement.Author)
				c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to delete this announcement"})
				return
			}
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := database.DB.Delete(&announcement).Error; err != nil {
		slog.Error("Failed to delete announcement", "error", err, "id", req.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete"})
		return
	}

	slog.Info("Announcement deleted", "id", req.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}
