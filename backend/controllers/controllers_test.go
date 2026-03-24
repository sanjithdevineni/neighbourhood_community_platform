package controllers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

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

	if err := db.AutoMigrate(&models.User{}, &models.Announcement{}); err != nil {
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
