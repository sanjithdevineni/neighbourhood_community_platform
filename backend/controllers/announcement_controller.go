package controllers

import (
	"log/slog"
	"net/http"

	"community-platform-backend/database"
	"community-platform-backend/models"
	"community-platform-backend/utils"

	"github.com/gin-gonic/gin"
)

// GetAnnouncements returns a paginated list of announcements.
// Supports ?page=1&limit=10 query parameters.
func GetAnnouncements(c *gin.Context) {
	params := utils.ParsePagination(c)
	var announcements []models.Announcement

	baseQuery := database.DB.Model(&models.Announcement{})

	result, err := utils.Paginate(baseQuery, params, &announcements)
	if err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch announcements"), "error", err)
		return
	}

	slog.Info("Announcements fetched", "count", len(announcements), "page", params.Page, "limit", params.Limit)
	c.JSON(http.StatusOK, result)
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
		utils.RespondWithError(c, utils.InternalServerError("Failed to create announcement"), "error", err, "author", announcement.Author)
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
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}

	var announcement models.Announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Announcement not found"), "op", "update", "id", req.ID)
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != announcement.Author {
				utils.RespondWithError(c, utils.Forbidden("Not authorized to update this announcement"), "op", "update", "user_id", s, "author", announcement.Author, "id", req.ID)
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
		utils.RespondWithError(c, utils.InternalServerError("Failed to update announcement"), "error", err, "id", req.ID)
		return
	}

	// Return the updated announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch updated announcement"), "error", err, "id", req.ID)
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
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}

	var announcement models.Announcement
	if err := database.DB.First(&announcement, req.ID).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Announcement not found"), "op", "delete", "id", req.ID)
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != announcement.Author {
				utils.RespondWithError(c, utils.Forbidden("Not authorized to delete this announcement"), "op", "delete", "user_id", s, "author", announcement.Author, "id", req.ID)
				return
			}
		}
	} else {
		utils.RespondWithError(c, utils.Unauthorized("Unauthorized"))
		return
	}

	if err := database.DB.Delete(&announcement).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to delete announcement"), "error", err, "id", req.ID)
		return
	}

	slog.Info("Announcement deleted", "id", req.ID)
	c.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}
