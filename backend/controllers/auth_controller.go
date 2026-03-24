package controllers

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"community-platform-backend/database"
	"community-platform-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// SignupRequest is a DTO for user signup
type SignupRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginRequest is a DTO for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Signup handles user registration: validates input, hashes password, creates user
func Signup(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input", "details": err.Error()})
		return
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("Failed to hash password", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process password"})
		return
	}

	user := models.User{
		Name:     req.Name,
		Email:    strings.ToLower(req.Email),
		Password: string(hashed),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		// handle duplicate email (unique constraint)
		if strings.Contains(strings.ToLower(err.Error()), "unique") || strings.Contains(strings.ToLower(err.Error()), "constraint") {
			slog.Warn("Duplicate email registration attempt", "email", user.Email)
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}
		slog.Error("Failed to create user", "error", err, "email", user.Email)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	slog.Info("User registered successfully", "user_id", user.ID, "email", user.Email)

	// Structured response without password
	c.JSON(http.StatusCreated, gin.H{"data": gin.H{
		"id":         user.ID,
		"name":       user.Name,
		"email":      user.Email,
		"created_at": user.CreatedAt,
	}})
}

// Login handles user authentication: validates input, verifies password, returns JWT
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input", "details": err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		slog.Warn("Login failed: user not found", "email", strings.ToLower(req.Email))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		slog.Warn("Login failed: invalid password", "email", strings.ToLower(req.Email), "user_id", user.ID)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		slog.Error("JWT_SECRET environment variable is not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server configuration error"})
		return
	}

	claims := jwt.RegisteredClaims{
		Subject:   fmt.Sprint(user.ID),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		slog.Error("Failed to generate JWT token", "error", err, "user_id", user.ID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	slog.Info("User logged in successfully", "user_id", user.ID, "email", user.Email)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"token": signed,
		"user": gin.H{
			"id":         user.ID,
			"name":       user.Name,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		},
	}})
}
