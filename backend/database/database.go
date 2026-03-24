package database

import (
	"community-platform-backend/config"
	"fmt"
	"log"
	"log/slog"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// InitDatabase opens the database and verifies the connection with a ping.
// Returns an error so the caller can decide how to handle failures.
func InitDatabase(dbName string) error {
	var err error
	gormConfig := &gorm.Config{}

	if config.DevMode {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	}

	DB, err = gorm.Open(sqlite.Open(dbName), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to open database %q: %w", dbName, err)
	}

	// Obtain the underlying *sql.DB to verify the connection is alive.
	sqlDB, err := DB.DB()
	if err != nil {
    slog.Error("Failed to connect to database", "error", err, "db_name", dbName)
    return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	if err = sqlDB.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

  slog.Info("Database connected successfully", "db_name", dbName)
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
