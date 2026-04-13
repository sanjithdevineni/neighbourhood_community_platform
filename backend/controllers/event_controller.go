package controllers

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"community-platform-backend/database"
	"community-platform-backend/models"
	"community-platform-backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetEvents returns all events ordered by newest first.
func GetEvents(c *gin.Context) {
	var events []models.Event

	if err := database.DB.Order("created_at desc").Find(&events).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to fetch events"), "error", err)
		return
	}

	slog.Info("Events fetched", "count", len(events))
	c.JSON(http.StatusOK, events)
}

// CreateEvent handles multipart/form-data to create an event with an optional image upload.
func CreateEvent(c *gin.Context) {
	// Parse form fields
	title := c.PostForm("title")
	date := c.PostForm("date")
	eventTime := c.PostForm("time")
	location := c.PostForm("location")

	// Validate required fields
	if title == "" || date == "" || eventTime == "" || location == "" {
		utils.RespondWithError(c, utils.BadRequest("title, date, time, and location are required"))
		return
	}

	// Extract authenticated user as the author
	author := ""
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok && s != "" {
			author = s
		}
	}
	if author == "" {
		utils.RespondWithError(c, utils.Unauthorized("Unable to identify event author"))
		return
	}

	// Handle optional image upload
	imageURL := ""
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		// Ensure the uploads directory exists
		uploadDir := "./uploads"
		if mkErr := os.MkdirAll(uploadDir, os.ModePerm); mkErr != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to create upload directory"), "error", mkErr)
			return
		}

		// Generate a unique filename to prevent collisions
		ext := filepath.Ext(file.Filename)
		uniqueName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		savePath := filepath.Join(uploadDir, uniqueName)

		if saveErr := c.SaveUploadedFile(file, savePath); saveErr != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to save uploaded image"), "error", saveErr)
			return
		}

		// Store the URL path that the frontend can use to fetch the image
		imageURL = "/uploads/" + uniqueName
	}

	event := models.Event{
		Title:    title,
		Date:     date,
		Time:     eventTime,
		Location: location,
		ImageURL: imageURL,
		Author:   author,
	}

	if err := database.DB.Create(&event).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to create event"), "error", err, "author", author)
		return
	}

	slog.Info("Event created", "id", event.ID, "author", author, "title", title)
	c.JSON(http.StatusCreated, event)
}
