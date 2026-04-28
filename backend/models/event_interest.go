package models

import "time"

// EventInterest represents a user's interest in a community event.
// This preserves the many-to-many relationship and prevents duplicate entries.
type EventInterest struct {
	EventID   uint      `gorm:"primaryKey" json:"event_id"`
	UserID    uint      `gorm:"primaryKey" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}
