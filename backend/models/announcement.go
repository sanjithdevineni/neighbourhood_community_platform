package models

import (
	"gorm.io/gorm"
)

type Announcement struct {
	gorm.Model        // Adds ID, CreatedAt, UpdatedAt, DeletedAt
	Title      string `json:"title"   gorm:"not null"`
	Content    string `json:"content" gorm:"not null"`
	Author     string `json:"author"  gorm:"not null"`
}
