package database

import (
	"fmt"
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDatabase opens the database and verifies the connection with a ping.
// Returns an error so the caller can decide how to handle failures.
func InitDatabase(dbName string) error {
	var err error

	DB, err = gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to open database %q: %w", dbName, err)
	}

	// Obtain the underlying *sql.DB to verify the connection is alive.
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	if err = sqlDB.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	log.Println("Database connected successfully")
	return nil
}

// CloseDatabase closes the underlying connection pool.
// Safe to call even if InitDatabase was never called.
func CloseDatabase() {
	if DB == nil {
		return
	}
	sqlDB, err := DB.DB()
	if err != nil {
		log.Printf("Error retrieving sql.DB for close: %v", err)
		return
	}
	if err = sqlDB.Close(); err != nil {
		log.Printf("Error closing database: %v", err)
		return
	}
	log.Println("Database connection closed.")
}
