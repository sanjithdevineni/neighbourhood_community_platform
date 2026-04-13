package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"community-platform-backend/database"
	"community-platform-backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupControllerTestDB(t *testing.T) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Announcement{}, &models.Event{}); err != nil {
		t.Fatalf("failed to migrate test db: %v", err)
	}

	database.DB = db
}

func performJSONRequest(r *gin.Engine, method, path string, payload any) *httptest.ResponseRecorder {
	var body []byte
	if payload != nil {
		body, _ = json.Marshal(payload)
	}

	req := httptest.NewRequest(method, path, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func performMultipartRequest(r *gin.Engine, method, path string, fields map[string]string, fileField, fileName string, fileData []byte) *httptest.ResponseRecorder {
	body := bytes.NewBuffer(nil)
	writer := multipart.NewWriter(body)

	// Add form fields
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			panic(err)
		}
	}

	// Add file if provided
	if fileField != "" && len(fileData) > 0 {
		filePart, err := writer.CreateFormFile(fileField, fileName)
		if err != nil {
			panic(err)
		}
		if _, err := filePart.Write(fileData); err != nil {
			panic(err)
		}
	}

	if err := writer.Close(); err != nil {
		panic(err)
	}

	req := httptest.NewRequest(method, path, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestGetAnnouncements(t *testing.T) {
	setupControllerTestDB(t)

	if err := database.DB.Create(&models.Announcement{Title: "T1", Content: "C1", Author: "1"}).Error; err != nil {
		t.Fatalf("seed announcement failed: %v", err)
	}

	r := gin.New()
	r.GET("/api/announcements", GetAnnouncements)

	w := performJSONRequest(r, http.MethodGet, "/api/announcements", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"title":"T1"`)) {
		t.Fatalf("expected announcement in response body: %s", w.Body.String())
	}
}

func TestCreateAnnouncement(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/announcements", func(c *gin.Context) {
		c.Set("userID", "99")
		CreateAnnouncement(c)
	})

	payload := map[string]any{"title": "Cleanup", "content": "Saturday", "author": "ignored"}
	w := performJSONRequest(r, http.MethodPost, "/api/announcements", payload)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", w.Code, w.Body.String())
	}

	var created models.Announcement
	if err := database.DB.First(&created).Error; err != nil {
		t.Fatalf("failed to fetch created announcement: %v", err)
	}
	if created.Author != "99" {
		t.Fatalf("expected author from userID context, got %q", created.Author)
	}
}

func TestUpdateAnnouncement(t *testing.T) {
	setupControllerTestDB(t)

	rec := models.Announcement{Title: "Old", Content: "Old", Author: "1"}
	if err := database.DB.Create(&rec).Error; err != nil {
		t.Fatalf("seed announcement failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/announcements/update", func(c *gin.Context) {
		c.Set("userID", "1")
		UpdateAnnouncement(c)
	})

	payload := map[string]any{"id": rec.ID, "title": "New", "content": "Updated"}
	w := performJSONRequest(r, http.MethodPost, "/api/announcements/update", payload)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var updated models.Announcement
	if err := database.DB.First(&updated, rec.ID).Error; err != nil {
		t.Fatalf("failed to fetch updated announcement: %v", err)
	}
	if updated.Title != "New" || updated.Content != "Updated" {
		t.Fatalf("announcement not updated as expected: %+v", updated)
	}
}

func TestDeleteAnnouncement(t *testing.T) {
	setupControllerTestDB(t)

	rec := models.Announcement{Title: "DeleteMe", Content: "C", Author: "1"}
	if err := database.DB.Create(&rec).Error; err != nil {
		t.Fatalf("seed announcement failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/announcements/delete", func(c *gin.Context) {
		c.Set("userID", "1")
		DeleteAnnouncement(c)
	})

	payload := map[string]any{"id": rec.ID}
	w := performJSONRequest(r, http.MethodPost, "/api/announcements/delete", payload)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"message":"Announcement deleted successfully"`)) {
		t.Fatalf("unexpected response: %s", w.Body.String())
	}
}

func TestSignup(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/signup", Signup)

	payload := map[string]any{"name": "Jane", "email": "JANE@EXAMPLE.COM", "password": "password123"}
	w := performJSONRequest(r, http.MethodPost, "/api/signup", payload)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", w.Code, w.Body.String())
	}

	var user models.User
	if err := database.DB.Where("email = ?", "jane@example.com").First(&user).Error; err != nil {
		t.Fatalf("expected created user in db: %v", err)
	}
}

func TestLogin(t *testing.T) {
	setupControllerTestDB(t)

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	seed := models.User{Name: "Jane", Email: "jane@example.com", Password: string(hash)}
	if err := database.DB.Create(&seed).Error; err != nil {
		t.Fatalf("seed user failed: %v", err)
	}

	oldSecret := os.Getenv("JWT_SECRET")
	os.Setenv("JWT_SECRET", "test-secret")
	t.Cleanup(func() { _ = os.Setenv("JWT_SECRET", oldSecret) })

	r := gin.New()
	r.POST("/api/login", Login)

	payload := map[string]any{"email": "jane@example.com", "password": "password123"}
	w := performJSONRequest(r, http.MethodPost, "/api/login", payload)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}
	if !bytes.Contains(w.Body.Bytes(), []byte(`"token":"`)) {
		t.Fatalf("expected token in response: %s", w.Body.String())
	}
}

// Event Controller Tests

func TestGetEvents_EmptyList(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.GET("/api/events", GetEvents)

	w := performJSONRequest(r, http.MethodGet, "/api/events", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var events []models.Event
	if err := json.Unmarshal(w.Body.Bytes(), &events); err != nil {
		t.Fatalf("failed to unmarshal response: %v body=%s", err, w.Body.String())
	}

	if len(events) != 0 {
		t.Fatalf("expected empty array, got %d events", len(events))
	}
}

func TestGetEvents_SortedByCreatedAtDesc(t *testing.T) {
	setupControllerTestDB(t)

	// Create events with different timestamps
	now := time.Now()
	event1 := models.Event{Model: gorm.Model{CreatedAt: now.Add(-2 * time.Hour)}, Title: "Event 1", Date: "2026-04-20", Time: "10:00", Location: "Park"}
	event2 := models.Event{Model: gorm.Model{CreatedAt: now.Add(-1 * time.Hour)}, Title: "Event 2", Date: "2026-04-21", Time: "14:00", Location: "Beach"}
	event3 := models.Event{Model: gorm.Model{CreatedAt: now}, Title: "Event 3", Date: "2026-04-22", Time: "16:00", Location: "Hall"}

	for _, evt := range []models.Event{event1, event2, event3} {
		if err := database.DB.Create(&evt).Error; err != nil {
			t.Fatalf("seed event failed: %v", err)
		}
	}

	r := gin.New()
	r.GET("/api/events", GetEvents)

	w := performJSONRequest(r, http.MethodGet, "/api/events", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var events []models.Event
	if err := json.Unmarshal(w.Body.Bytes(), &events); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	if len(events) != 3 {
		t.Fatalf("expected 3 events, got %d", len(events))
	}

	// Verify sorted by created_at desc (most recent first)
	if events[0].Title != "Event 3" || events[1].Title != "Event 2" || events[2].Title != "Event 1" {
		t.Fatalf("events not sorted correctly by created_at desc: %v", events)
	}
}

func TestCreateEvent_SuccessfulCreation(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"title":    "Community Cleanup",
		"date":     "2026-04-20",
		"time":     "10:00",
		"location": "Central Park",
	}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", w.Code, w.Body.String())
	}

	var created models.Event
	if err := database.DB.First(&created).Error; err != nil {
		t.Fatalf("failed to fetch created event: %v", err)
	}

	if created.Title != "Community Cleanup" || created.Author != "user123" {
		t.Fatalf("event not created correctly: %+v", created)
	}
}

func TestCreateEvent_MissingRequiredField_Title(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"date":     "2026-04-20",
		"time":     "10:00",
		"location": "Central Park",
		// missing title
	}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing title, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateEvent_MissingRequiredField_Date(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"title":    "Community Cleanup",
		"time":     "10:00",
		"location": "Central Park",
		// missing date
	}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing date, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateEvent_MissingRequiredField_Time(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"title":    "Community Cleanup",
		"date":     "2026-04-20",
		"location": "Central Park",
		// missing time
	}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing time, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateEvent_MissingRequiredField_Location(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"title": "Community Cleanup",
		"date":  "2026-04-20",
		"time":  "10:00",
		// missing location
	}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing location, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateEvent_NoAuthToken(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", CreateEvent) // No auth middleware

	fields := map[string]string{
		"title":    "Community Cleanup",
		"date":     "2026-04-20",
		"time":     "10:00",
		"location": "Central Park",
	}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing auth token, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateEvent_WithImageUpload(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"title":    "Community Cleanup",
		"date":     "2026-04-20",
		"time":     "10:00",
		"location": "Central Park",
	}

	// Create mock image data (simple PNG header)
	mockImage := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "image", "event.png", mockImage)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", w.Code, w.Body.String())
	}

	var created models.Event
	if err := database.DB.First(&created).Error; err != nil {
		t.Fatalf("failed to fetch created event: %v", err)
	}

	if created.ImageURL == "" {
		t.Fatalf("expected image_url to be set, got empty string")
	}

	if !bytes.Contains(w.Body.Bytes(), []byte(`"image_url":"`)) {
		t.Fatalf("expected image_url in response: %s", w.Body.String())
	}
}

func TestCreateEvent_WithoutImage_Optional(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/events", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateEvent(c)
	})

	fields := map[string]string{
		"title":    "Community Cleanup",
		"date":     "2026-04-20",
		"time":     "10:00",
		"location": "Central Park",
	}

	// No image file provided
	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "", "", nil)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201 even without image, got %d body=%s", w.Code, w.Body.String())
	}

	var created models.Event
	if err := database.DB.First(&created).Error; err != nil {
		t.Fatalf("failed to fetch created event: %v", err)
	}

	if created.Title != "Community Cleanup" {
		t.Fatalf("event not created correctly: %+v", created)
	}

	// Image URL should be empty or not set
	if created.ImageURL != "" {
		t.Fatalf("expected image_url to be empty, got %q", created.ImageURL)
	}
}
