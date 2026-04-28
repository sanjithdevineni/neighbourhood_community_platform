package models

import "gorm.io/gorm"

type Alert struct {
	gorm.Model
	Title   string `json:"title" gorm:"not null"`
	Message string `json:"message" gorm:"not null"`
	Type    string `json:"type" gorm:"not null"`
	Author  string `json:"author" gorm:"not null"`
}
