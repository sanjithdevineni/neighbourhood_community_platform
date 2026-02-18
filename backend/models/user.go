package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents an application user.
type User struct {
	ID        uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string         `gorm:"not null" json:"name" binding:"required"`
	Email     string         `gorm:"uniqueIndex;not null" json:"email" binding:"required,email"`
	Password  string         `gorm:"not null" json:"-" binding:"required"`
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
