package models

import "gorm.io/gorm"

// Event represents a community event created by an authenticated user.
type Event struct {
	gorm.Model
	Title    string `json:"title" gorm:"not null"`
	Date     string `json:"date" gorm:"not null"`
	Time     string `json:"time" gorm:"not null"`
	Location string `json:"location" gorm:"not null"`
	ImageURL string `json:"image_url"`
	Author   string `json:"author" gorm:"not null"`
}
