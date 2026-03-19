package controllers

import (
	"net/http"

	"community-platform-backend/database"
	"community-platform-backend/models"
	"community-platform-backend/utils"

	"github.com/gin-gonic/gin"
)

func GetAnnouncements(c *gin.Context) {
	var announcements []models.Announcement

	if err := database.DB.Find(&announcements).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch announcements"))
		return
	}

	c.JSON(http.StatusOK, announcements)
}

func CreateAnnouncement(c *gin.Context) {
	var announcement models.Announcement

	if err := c.BindJSON(&announcement); err != nil {
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}
	// If middleware attached userID, prefer it as the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok && s != "" {
			announcement.Author = s
		}
	}

	if err := database.DB.Create(&announcement).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to create announcement"))
		return
	}

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
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}

	var announcement models.Announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Announcement not found"))
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != announcement.Author {
				utils.RespondWithError(c, utils.Forbidden("Not authorized to update this announcement"))
				return
			}
		}
	} else {
		utils.RespondWithError(c, utils.Unauthorized("Unauthorized"))
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
		utils.RespondWithError(c, utils.BadRequest("No fields to update"))
		return
	}

	if err := database.DB.Model(&announcement).Updates(updated).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to update announcement"))
		return
	}

	// Return the updated announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch updated announcement"))
		return
	}

	c.JSON(http.StatusOK, announcement)
}

// DeleteAnnouncement deletes an existing announcement. Requires authentication.
func DeleteAnnouncement(c *gin.Context) {
	var req struct {
		ID uint `json:"id" binding:"required"`
	}

	if err := c.BindJSON(&req); err != nil {
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}

	var announcement models.Announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Announcement not found"))
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != announcement.Author {
				utils.RespondWithError(c, utils.Forbidden("Not authorized to delete this announcement"))
				return
			}
		}
	} else {
		utils.RespondWithError(c, utils.Unauthorized("Unauthorized"))
		return
	}

	if err := database.DB.Delete(&announcement).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to delete announcement"))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}
