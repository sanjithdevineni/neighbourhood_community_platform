package controllers

import (
	"log/slog"
	"net/http"

	"community-platform-backend/database"
	"community-platform-backend/models"
	"community-platform-backend/utils"

	"github.com/gin-gonic/gin"
)

// GetAlerts fetches all alerts from the database.
func GetAlerts(c *gin.Context) {
	var alerts []models.Alert

	if err := database.DB.Find(&alerts).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch alerts"), "error", err)
		return
	}

	slog.Info("Alerts fetched", "count", len(alerts))
	c.JSON(http.StatusOK, alerts)
}

// CreateAlert creates a new alert. Requires authentication.
func CreateAlert(c *gin.Context) {
	var alert models.Alert

	if err := c.BindJSON(&alert); err != nil {
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}

	// Attach authenticated user as the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok && s != "" {
			alert.Author = s
		}
	}

	if err := database.DB.Create(&alert).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to create alert"), "error", err, "author", alert.Author)
		return
	}

	slog.Info("Alert created", "id", alert.ID, "author", alert.Author, "type", alert.Type)
	c.JSON(http.StatusCreated, alert)
}

// UpdateAlert updates an existing alert. Requires authentication.
func UpdateAlert(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Title   string `json:"title"`
		Message string `json:"message"`
		Type    string `json:"type"`
	}

	if err := c.BindJSON(&req); err != nil {
		utils.RespondWithError(c, utils.BadRequest("Invalid JSON"))
		return
	}

	var alert models.Alert
	if err := database.DB.First(&alert, id).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Alert not found"), "op", "update", "id", id)
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != alert.Author {
				utils.RespondWithError(c, utils.Forbidden("Not authorized to update this alert"), "op", "update", "user_id", s, "author", alert.Author, "id", id)
				return
			}
		}
	} else {
		utils.RespondWithError(c, utils.Unauthorized("Unauthorized"))
		return
	}

	// Apply updates
	updated := map[string]interface{}{}
	if req.Title != "" {
		updated["title"] = req.Title
	}
	if req.Message != "" {
		updated["message"] = req.Message
	}
	if req.Type != "" {
		updated["type"] = req.Type
	}

	if len(updated) == 0 {
		utils.RespondWithError(c, utils.BadRequest("No fields to update"))
		return
	}

	if err := database.DB.Model(&alert).Updates(updated).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to update alert"), "error", err, "id", id)
		return
	}

	// Fetch the updated alert to return
	if err := database.DB.First(&alert, id).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch updated alert"), "error", err, "id", id)
		return
	}

	slog.Info("Alert updated", "id", id)
	c.JSON(http.StatusOK, alert)
}

// DeleteAlert deletes an existing alert. Requires authentication.
func DeleteAlert(c *gin.Context) {
	id := c.Param("id")

	var alert models.Alert
	if err := database.DB.First(&alert, id).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Alert not found"), "op", "delete", "id", id)
		return
	}

	// Ensure authenticated user is the author
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok {
			if s != alert.Author {
				utils.RespondWithError(c, utils.Forbidden("Not authorized to delete this alert"), "op", "delete", "user_id", s, "author", alert.Author, "id", id)
				return
			}
		}
	} else {
		utils.RespondWithError(c, utils.Unauthorized("Unauthorized"))
		return
	}

	if err := database.DB.Delete(&alert).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to delete alert"), "error", err, "id", id)
		return
	}

	slog.Info("Alert deleted", "id", id)
	c.JSON(http.StatusOK, gin.H{"message": "Alert deleted successfully"})
}
