package controllers

import (
	"fmt"
	"io"
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
	"gorm.io/gorm"
)

const MaxUploadSize = 5 * 1024 * 1024 // 5 MB

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
		if file.Size > MaxUploadSize {
			utils.RespondWithError(c, utils.BadRequest("Image file size exceeds the 5MB limit"))
			return
		}

		openedFile, err := file.Open()
		if err != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to open uploaded image"), "error", err)
			return
		}
		defer openedFile.Close()

		buffer := make([]byte, 512)
		if _, err := openedFile.Read(buffer); err != nil && err != io.EOF {
			utils.RespondWithError(c, utils.InternalServerError("Failed to read uploaded image"), "error", err)
			return
		}

		contentType := http.DetectContentType(buffer)
		if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
			utils.RespondWithError(c, utils.BadRequest("Invalid file type. Only JPEG, PNG, and WEBP are allowed"))
			return
		}

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

// UpdateEvent handles PUT requests to update an existing event.
func UpdateEvent(c *gin.Context) {
	id := c.Param("id")

	// Parse form fields
	title := c.PostForm("title")
	date := c.PostForm("date")
	eventTime := c.PostForm("time")
	location := c.PostForm("location")

	// Extract authenticated user
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

	var event models.Event
	if err := database.DB.First(&event, id).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Event not found"))
		return
	}

	// Verify authorship
	if event.Author != author {
		utils.RespondWithError(c, utils.Forbidden("You are not authorized to update this event"))
		return
	}

	// Update fields if provided
	if title != "" {
		event.Title = title
	}
	if date != "" {
		event.Date = date
	}
	if eventTime != "" {
		event.Time = eventTime
	}
	if location != "" {
		event.Location = location
	}

	// Handle optional image upload (replace if new one provided)
	file, err := c.FormFile("image")
	if err == nil && file != nil {
		if file.Size > MaxUploadSize {
			utils.RespondWithError(c, utils.BadRequest("Image file size exceeds the 5MB limit"))
			return
		}

		openedFile, err := file.Open()
		if err != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to open uploaded image"), "error", err)
			return
		}
		defer openedFile.Close()

		buffer := make([]byte, 512)
		if _, err := openedFile.Read(buffer); err != nil && err != io.EOF {
			utils.RespondWithError(c, utils.InternalServerError("Failed to read uploaded image"), "error", err)
			return
		}

		contentType := http.DetectContentType(buffer)
		if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
			utils.RespondWithError(c, utils.BadRequest("Invalid file type. Only JPEG, PNG, and WEBP are allowed"))
			return
		}

		uploadDir := "./uploads"
		if mkErr := os.MkdirAll(uploadDir, os.ModePerm); mkErr != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to create upload directory"), "error", mkErr)
			return
		}
		ext := filepath.Ext(file.Filename)
		uniqueName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), uuid.New().String(), ext)
		savePath := filepath.Join(uploadDir, uniqueName)
		if saveErr := c.SaveUploadedFile(file, savePath); saveErr != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to save uploaded image"), "error", saveErr)
			return
		}
		event.ImageURL = "/uploads/" + uniqueName
	}

	if err := database.DB.Save(&event).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to update event"), "error", err)
		return
	}

	slog.Info("Event updated", "id", event.ID, "author", author)
	c.JSON(http.StatusOK, event)
}

// DeleteEvent handles DELETE requests to remove an event.
func DeleteEvent(c *gin.Context) {
	id := c.Param("id")

	author := ""
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok && s != "" {
			author = s
		}
	}
	if author == "" {
		utils.RespondWithError(c, utils.Unauthorized("Unable to identify user"))
		return
	}

	var event models.Event
	if err := database.DB.First(&event, id).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Event not found"))
		return
	}

	// Verify authorship
	if event.Author != author {
		utils.RespondWithError(c, utils.Forbidden("You are not authorized to delete this event"))
		return
	}

	if err := database.DB.Delete(&event).Error; err != nil {
		utils.RespondWithError(c, utils.InternalServerError("Failed to delete event"), "error", err)
		return
	}

	slog.Info("Event deleted", "id", event.ID, "author", author)
	c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
}

// ToggleEventInterest adds or removes interest for the authenticated user and updates the event's InterestedCount.
func ToggleEventInterest(c *gin.Context) {
	eventIDStr := c.Param("id")
	
	// Get authenticated user ID
	userIDStr := ""
	if uid, exists := c.Get("userID"); exists {
		if s, ok := uid.(string); ok && s != "" {
			userIDStr = s
		}
	}
	if userIDStr == "" {
		utils.RespondWithError(c, utils.Unauthorized("You must be logged in to express interest"))
		return
	}

	// In this codebase, userID is stored as string in context but might be uint in models.
	// Let's check the users table if needed, or parse if it's a numeric string.
	// Based on User model, ID is uint.
	var user models.User
	if err := database.DB.Where("id = ?", userIDStr).First(&user).Error; err != nil {
		utils.RespondWithError(c, utils.Unauthorized("User not found"))
		return
	}

	var event models.Event
	if err := database.DB.First(&event, eventIDStr).Error; err != nil {
		utils.RespondWithError(c, utils.NotFound("Event not found"))
		return
	}

	var interest models.EventInterest
	err := database.DB.Where("event_id = ? AND user_id = ?", event.ID, user.ID).First(&interest).Error

	isInterested := false
	if err == nil {
		// Already interested, so remove it
		if delErr := database.DB.Delete(&interest).Error; delErr != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to remove interest"), "error", delErr)
			return
		}
		// Atomic decrement
		database.DB.Model(&event).Update("interested_count", gorm.Expr("interested_count - ?", 1))
		isInterested = false
	} else {
		// Not interested, so add it
		interest = models.EventInterest{
			EventID: event.ID,
			UserID:  user.ID,
		}
		if createErr := database.DB.Create(&interest).Error; createErr != nil {
			utils.RespondWithError(c, utils.InternalServerError("Failed to add interest"), "error", createErr)
			return
		}
		// Atomic increment
		database.DB.Model(&event).Update("interested_count", gorm.Expr("interested_count + ?", 1))
		isInterested = true
	}

	// Fetch updated count
	database.DB.First(&event, event.ID)

	slog.Info("Event interest toggled", "event_id", event.ID, "user_id", user.ID, "is_interested", isInterested)
	c.JSON(http.StatusOK, gin.H{
		"is_interested":    isInterested,
		"interested_count": event.InterestedCount,
	})
}
