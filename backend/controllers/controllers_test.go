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

	if err := db.AutoMigrate(&models.User{}, &models.Announcement{}, &models.Event{}, &models.Alert{}); err != nil {
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

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v body=%s", err, w.Body.String())
	}

	data, ok := resp["data"].([]interface{})
	if !ok {
		t.Fatalf("expected 'data' array in response: %s", w.Body.String())
	}
	if len(data) != 1 {
		t.Fatalf("expected 1 announcement in data, got %d", len(data))
	}

	first := data[0].(map[string]interface{})
	if first["title"] != "T1" {
		t.Fatalf("expected title 'T1', got %v", first["title"])
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

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v body=%s", err, w.Body.String())
	}

	data, ok := resp["data"].([]interface{})
	if !ok {
		t.Fatalf("expected 'data' array in response: %s", w.Body.String())
	}
	if len(data) != 0 {
		t.Fatalf("expected empty data array, got %d events", len(data))
	}

	if resp["total"].(float64) != 0 {
		t.Fatalf("expected total 0, got %v", resp["total"])
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

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}

	data, ok := resp["data"].([]interface{})
	if !ok {
		t.Fatalf("expected 'data' array in response: %s", w.Body.String())
	}

	if len(data) != 3 {
		t.Fatalf("expected 3 events, got %d", len(data))
	}

	// Verify sorted by created_at desc (most recent first)
	first := data[0].(map[string]interface{})
	second := data[1].(map[string]interface{})
	third := data[2].(map[string]interface{})
	if first["title"] != "Event 3" || second["title"] != "Event 2" || third["title"] != "Event 1" {
		t.Fatalf("events not sorted correctly by created_at desc")
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

func TestCreateEvent_ImageUpload_InvalidType(t *testing.T) {
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

	// Create mock text file data
	mockImage := []byte("This is a text file, not an image.")

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "image", "event.txt", mockImage)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid file type, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestCreateEvent_ImageUpload_ExceedsSizeLimit(t *testing.T) {
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

	// Create mock large file data (just over 5MB)
	mockImage := make([]byte, MaxUploadSize+1)

	w := performMultipartRequest(r, http.MethodPost, "/api/events", fields, "image", "large.png", mockImage)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for large file size, got %d body=%s", w.Code, w.Body.String())
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

// Pagination Tests — Events

func seedEvents(t *testing.T, count int) {
	t.Helper()
	for i := 1; i <= count; i++ {
		evt := models.Event{
			Title:    fmt.Sprintf("Event %d", i),
			Date:     "2026-05-01",
			Time:     "10:00",
			Location: "Venue",
			Author:   "user1",
		}
		if err := database.DB.Create(&evt).Error; err != nil {
			t.Fatalf("seed event %d failed: %v", i, err)
		}
	}
}

func TestGetEvents_Pagination_DefaultParams(t *testing.T) {
	setupControllerTestDB(t)
	seedEvents(t, 15) // more than default limit of 10

	r := gin.New()
	r.GET("/api/events", GetEvents)

	w := performJSONRequest(r, http.MethodGet, "/api/events", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	data := resp["data"].([]interface{})
	if len(data) != 10 {
		t.Fatalf("expected 10 events (default limit), got %d", len(data))
	}
	if int(resp["page"].(float64)) != 1 {
		t.Fatalf("expected page 1, got %v", resp["page"])
	}
	if int(resp["total"].(float64)) != 15 {
		t.Fatalf("expected total 15, got %v", resp["total"])
	}
	if int(resp["total_pages"].(float64)) != 2 {
		t.Fatalf("expected total_pages 2, got %v", resp["total_pages"])
	}
}

func TestGetEvents_Pagination_CustomPage(t *testing.T) {
	setupControllerTestDB(t)
	seedEvents(t, 5)

	r := gin.New()
	r.GET("/api/events", GetEvents)

	w := performJSONRequest(r, http.MethodGet, "/api/events?page=2&limit=2", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	data := resp["data"].([]interface{})
	if len(data) != 2 {
		t.Fatalf("expected 2 events on page 2 with limit 2, got %d", len(data))
	}
	if int(resp["page"].(float64)) != 2 {
		t.Fatalf("expected page 2, got %v", resp["page"])
	}
	if int(resp["total"].(float64)) != 5 {
		t.Fatalf("expected total 5, got %v", resp["total"])
	}
	if int(resp["total_pages"].(float64)) != 3 {
		t.Fatalf("expected total_pages 3, got %v", resp["total_pages"])
	}
}

func TestGetEvents_Pagination_BeyondLastPage(t *testing.T) {
	setupControllerTestDB(t)
	seedEvents(t, 3)

	r := gin.New()
	r.GET("/api/events", GetEvents)

	w := performJSONRequest(r, http.MethodGet, "/api/events?page=10&limit=5", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	data := resp["data"].([]interface{})
	if len(data) != 0 {
		t.Fatalf("expected 0 events beyond last page, got %d", len(data))
	}
	if int(resp["total"].(float64)) != 3 {
		t.Fatalf("expected total 3, got %v", resp["total"])
	}
}

// Pagination Tests — Announcements

func seedAnnouncements(t *testing.T, count int) {
	t.Helper()
	for i := 1; i <= count; i++ {
		ann := models.Announcement{
			Title:   fmt.Sprintf("Announcement %d", i),
			Content: fmt.Sprintf("Content %d", i),
			Author:  "user1",
		}
		if err := database.DB.Create(&ann).Error; err != nil {
			t.Fatalf("seed announcement %d failed: %v", i, err)
		}
	}
}

func TestGetAnnouncements_Pagination_DefaultParams(t *testing.T) {
	setupControllerTestDB(t)
	seedAnnouncements(t, 12)

	r := gin.New()
	r.GET("/api/announcements", GetAnnouncements)

	w := performJSONRequest(r, http.MethodGet, "/api/announcements", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	data := resp["data"].([]interface{})
	if len(data) != 10 {
		t.Fatalf("expected 10 announcements (default limit), got %d", len(data))
	}
	if int(resp["total"].(float64)) != 12 {
		t.Fatalf("expected total 12, got %v", resp["total"])
	}
	if int(resp["total_pages"].(float64)) != 2 {
		t.Fatalf("expected total_pages 2, got %v", resp["total_pages"])
	}
}

func TestGetAnnouncements_Pagination_CustomPage(t *testing.T) {
	setupControllerTestDB(t)
	seedAnnouncements(t, 7)

	r := gin.New()
	r.GET("/api/announcements", GetAnnouncements)

	w := performJSONRequest(r, http.MethodGet, "/api/announcements?page=2&limit=3", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	data := resp["data"].([]interface{})
	if len(data) != 3 {
		t.Fatalf("expected 3 announcements on page 2 with limit 3, got %d", len(data))
	}
	if int(resp["page"].(float64)) != 2 {
		t.Fatalf("expected page 2, got %v", resp["page"])
	}
	if int(resp["total"].(float64)) != 7 {
		t.Fatalf("expected total 7, got %v", resp["total"])
	}
	if int(resp["total_pages"].(float64)) != 3 {
		t.Fatalf("expected total_pages 3, got %v", resp["total_pages"])
	}
}

// Event Update/Delete Tests

func TestUpdateEvent_SuccessfulUpdate(t *testing.T) {
	setupControllerTestDB(t)

	// Create an event
	event := models.Event{Title: "Old Title", Date: "2026-04-20", Time: "10:00", Location: "Old Location", Author: "user1"}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/events/:id/update", func(c *gin.Context) {
		c.Set("userID", "user1")
		UpdateEvent(c)
	})

	fields := map[string]string{
		"title":    "New Title",
		"date":     "2026-05-20",
		"time":     "14:00",
		"location": "New Location",
	}

	w := performMultipartRequest(r, http.MethodPost, fmt.Sprintf("/api/events/%d/update", event.ID), fields, "", "", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var updated models.Event
	if err := database.DB.First(&updated, event.ID).Error; err != nil {
		t.Fatalf("failed to fetch updated event: %v", err)
	}

	if updated.Title != "New Title" || updated.Date != "2026-05-20" {
		t.Fatalf("event not updated correctly: %+v", updated)
	}
}

func TestUpdateEvent_ForbiddenForDifferentAuthor(t *testing.T) {
	setupControllerTestDB(t)

	event := models.Event{Title: "Event", Date: "2026-04-20", Time: "10:00", Location: "Location", Author: "user1"}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/events/:id/update", func(c *gin.Context) {
		c.Set("userID", "user2") // Different user
		UpdateEvent(c)
	})

	fields := map[string]string{
		"title": "Updated",
	}

	w := performMultipartRequest(r, http.MethodPost, fmt.Sprintf("/api/events/%d/update", event.ID), fields, "", "", nil)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for different author, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestUpdateEvent_WithImageReplacement(t *testing.T) {
	setupControllerTestDB(t)

	event := models.Event{
		Title:    "Event",
		Date:     "2026-04-20",
		Time:     "10:00",
		Location: "Location",
		ImageURL: "/uploads/old_image.png",
		Author:   "user1",
	}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/events/:id/update", func(c *gin.Context) {
		c.Set("userID", "user1")
		UpdateEvent(c)
	})

	fields := map[string]string{
		"title": "Updated Title",
	}
	mockImage := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}

	w := performMultipartRequest(r, http.MethodPost, fmt.Sprintf("/api/events/%d/update", event.ID), fields, "image", "new_event.png", mockImage)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var updated models.Event
	if err := database.DB.First(&updated, event.ID).Error; err != nil {
		t.Fatalf("failed to fetch updated event: %v", err)
	}

	if updated.ImageURL == "/uploads/old_image.png" {
		t.Fatalf("image should have been replaced, got %q", updated.ImageURL)
	}
}

func TestUpdateEvent_ImageUpload_InvalidType(t *testing.T) {
	setupControllerTestDB(t)

	event := models.Event{Title: "Event", Date: "2026-04-20", Time: "10:00", Location: "Location", Author: "user1"}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/events/:id/update", func(c *gin.Context) {
		c.Set("userID", "user1")
		UpdateEvent(c)
	})

	fields := map[string]string{
		"title": "Updated",
	}
	mockFile := []byte("not an image")

	w := performMultipartRequest(r, http.MethodPost, fmt.Sprintf("/api/events/%d/update", event.ID), fields, "image", "bad.txt", mockFile)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid image type, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestUpdateEvent_ImageUpload_ExceedsSizeLimit(t *testing.T) {
	setupControllerTestDB(t)

	event := models.Event{Title: "Event", Date: "2026-04-20", Time: "10:00", Location: "Location", Author: "user1"}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/events/:id/update", func(c *gin.Context) {
		c.Set("userID", "user1")
		UpdateEvent(c)
	})

	fields := map[string]string{
		"title": "Updated",
	}
	largeFile := make([]byte, MaxUploadSize+1)

	w := performMultipartRequest(r, http.MethodPost, fmt.Sprintf("/api/events/%d/update", event.ID), fields, "image", "large.png", largeFile)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for oversized image, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestDeleteEvent_SuccessfulDeletion(t *testing.T) {
	setupControllerTestDB(t)

	event := models.Event{Title: "To Delete", Date: "2026-04-20", Time: "10:00", Location: "Location", Author: "user1"}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.DELETE("/api/events/:id", func(c *gin.Context) {
		c.Set("userID", "user1")
		DeleteEvent(c)
	})

	w := performJSONRequest(r, http.MethodDelete, fmt.Sprintf("/api/events/%d", event.ID), nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte(`"message":"Event deleted successfully"`)) {
		t.Fatalf("expected success message in response: %s", w.Body.String())
	}

	// Verify event is deleted
	var deleted models.Event
	result := database.DB.First(&deleted, event.ID)
	if result.Error == nil {
		t.Fatalf("event should have been deleted, but still exists")
	}
}

func TestDeleteEvent_ForbiddenForDifferentAuthor(t *testing.T) {
	setupControllerTestDB(t)

	event := models.Event{Title: "Event", Date: "2026-04-20", Time: "10:00", Location: "Location", Author: "user1"}
	if err := database.DB.Create(&event).Error; err != nil {
		t.Fatalf("seed event failed: %v", err)
	}

	r := gin.New()
	r.DELETE("/api/events/:id", func(c *gin.Context) {
		c.Set("userID", "user2") // Different user
		DeleteEvent(c)
	})

	w := performJSONRequest(r, http.MethodDelete, fmt.Sprintf("/api/events/%d", event.ID), nil)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for different author, got %d body=%s", w.Code, w.Body.String())
	}

	// Verify event still exists
	var stillExists models.Event
	if err := database.DB.First(&stillExists, event.ID).Error; err != nil {
		t.Fatalf("event should still exist: %v", err)
	}
}

// Alert Controller Tests

func TestGetAlerts_EmptyList(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.GET("/api/alerts", GetAlerts)

	w := performJSONRequest(r, http.MethodGet, "/api/alerts", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var alerts []models.Alert
	if err := json.Unmarshal(w.Body.Bytes(), &alerts); err != nil {
		t.Fatalf("failed to unmarshal response: %v body=%s", err, w.Body.String())
	}

	if len(alerts) != 0 {
		t.Fatalf("expected 0 alerts, got %d", len(alerts))
	}
}

func TestGetAlerts_WithData(t *testing.T) {
	setupControllerTestDB(t)

	// Seed some alerts
	for i := 1; i <= 3; i++ {
		alert := models.Alert{
			Title:   fmt.Sprintf("Alert %d", i),
			Message: fmt.Sprintf("Message %d", i),
			Type:    "info",
			Author:  "user1",
		}
		if err := database.DB.Create(&alert).Error; err != nil {
			t.Fatalf("seed alert failed: %v", err)
		}
	}

	r := gin.New()
	r.GET("/api/alerts", GetAlerts)

	w := performJSONRequest(r, http.MethodGet, "/api/alerts", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var alerts []models.Alert
	if err := json.Unmarshal(w.Body.Bytes(), &alerts); err != nil {
		t.Fatalf("failed to unmarshal response: %v body=%s", err, w.Body.String())
	}

	if len(alerts) != 3 {
		t.Fatalf("expected 3 alerts, got %d", len(alerts))
	}
}

func TestCreateAlert_SuccessfulCreation(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/alerts", func(c *gin.Context) {
		c.Set("userID", "user123")
		CreateAlert(c)
	})

	payload := map[string]any{
		"title":   "System Alert",
		"message": "Something important",
		"type":    "warning",
	}

	w := performJSONRequest(r, http.MethodPost, "/api/alerts", payload)
	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", w.Code, w.Body.String())
	}

	var created models.Alert
	if err := database.DB.First(&created).Error; err != nil {
		t.Fatalf("failed to fetch created alert: %v", err)
	}

	if created.Title != "System Alert" || created.Author != "user123" {
		t.Fatalf("alert not created correctly: %+v", created)
	}
}

func TestCreateAlert_Unauthorized(t *testing.T) {
	setupControllerTestDB(t)

	r := gin.New()
	r.POST("/api/alerts", CreateAlert) // No auth middleware, no userID set

	payload := map[string]any{
		"title":   "System Alert",
		"message": "Something important",
		"type":    "warning",
	}

	w := performJSONRequest(r, http.MethodPost, "/api/alerts", payload)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for missing auth, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestUpdateAlert_SuccessfulUpdate(t *testing.T) {
	setupControllerTestDB(t)

	alert := models.Alert{
		Title:   "Old Title",
		Message: "Old Message",
		Type:    "info",
		Author:  "user1",
	}
	if err := database.DB.Create(&alert).Error; err != nil {
		t.Fatalf("seed alert failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/alerts/:id", func(c *gin.Context) {
		c.Set("userID", "user1")
		UpdateAlert(c)
	})

	payload := map[string]any{
		"title":   "Updated Title",
		"message": "Updated Message",
		"type":    "warning",
	}

	w := performJSONRequest(r, http.MethodPost, fmt.Sprintf("/api/alerts/%d", alert.ID), payload)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	var updated models.Alert
	if err := database.DB.First(&updated, alert.ID).Error; err != nil {
		t.Fatalf("failed to fetch updated alert: %v", err)
	}

	if updated.Title != "Updated Title" || updated.Message != "Updated Message" {
		t.Fatalf("alert not updated correctly: %+v", updated)
	}
}

func TestUpdateAlert_ForbiddenForDifferentAuthor(t *testing.T) {
	setupControllerTestDB(t)

	alert := models.Alert{
		Title:   "Alert",
		Message: "Message",
		Type:    "info",
		Author:  "user1",
	}
	if err := database.DB.Create(&alert).Error; err != nil {
		t.Fatalf("seed alert failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/alerts/:id", func(c *gin.Context) {
		c.Set("userID", "user2") // Different user
		UpdateAlert(c)
	})

	payload := map[string]any{
		"title": "Hacked",
	}

	w := performJSONRequest(r, http.MethodPost, fmt.Sprintf("/api/alerts/%d", alert.ID), payload)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for different author, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestUpdateAlert_NoFieldsToUpdate(t *testing.T) {
	setupControllerTestDB(t)

	alert := models.Alert{
		Title:   "Alert",
		Message: "Message",
		Type:    "info",
		Author:  "user1",
	}
	if err := database.DB.Create(&alert).Error; err != nil {
		t.Fatalf("seed alert failed: %v", err)
	}

	r := gin.New()
	r.POST("/api/alerts/:id", func(c *gin.Context) {
		c.Set("userID", "user1")
		UpdateAlert(c)
	})

	payload := map[string]any{} // Empty update

	w := performJSONRequest(r, http.MethodPost, fmt.Sprintf("/api/alerts/%d", alert.ID), payload)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for no fields to update, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestDeleteAlert_SuccessfulDeletion(t *testing.T) {
	setupControllerTestDB(t)

	alert := models.Alert{
		Title:   "To Delete",
		Message: "Message",
		Type:    "info",
		Author:  "user1",
	}
	if err := database.DB.Create(&alert).Error; err != nil {
		t.Fatalf("seed alert failed: %v", err)
	}

	r := gin.New()
	r.DELETE("/api/alerts/:id", func(c *gin.Context) {
		c.Set("userID", "user1")
		DeleteAlert(c)
	})

	w := performJSONRequest(r, http.MethodDelete, fmt.Sprintf("/api/alerts/%d", alert.ID), nil)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}

	if !bytes.Contains(w.Body.Bytes(), []byte(`"message":"Alert deleted successfully"`)) {
		t.Fatalf("expected success message in response: %s", w.Body.String())
	}

	// Verify alert is deleted
	var deleted models.Alert
	result := database.DB.First(&deleted, alert.ID)
	if result.Error == nil {
		t.Fatalf("alert should have been deleted, but still exists")
	}
}

func TestDeleteAlert_ForbiddenForDifferentAuthor(t *testing.T) {
	setupControllerTestDB(t)

	alert := models.Alert{
		Title:   "Alert",
		Message: "Message",
		Type:    "info",
		Author:  "user1",
	}
	if err := database.DB.Create(&alert).Error; err != nil {
		t.Fatalf("seed alert failed: %v", err)
	}

	r := gin.New()
	r.DELETE("/api/alerts/:id", func(c *gin.Context) {
		c.Set("userID", "user2") // Different user
		DeleteAlert(c)
	})

	w := performJSONRequest(r, http.MethodDelete, fmt.Sprintf("/api/alerts/%d", alert.ID), nil)
	if w.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for different author, got %d body=%s", w.Code, w.Body.String())
	}

	// Verify alert still exists
	var stillExists models.Alert
	if err := database.DB.First(&stillExists, alert.ID).Error; err != nil {
		t.Fatalf("alert should still exist: %v", err)
	}
}
