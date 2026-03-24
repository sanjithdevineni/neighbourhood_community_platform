package database

import (
	"log/slog"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDatabase(dbName string) {
	var err error

	DB, err = gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		slog.Error("Failed to connect to database", "error", err, "db_name", dbName)
		os.Exit(1)
	}

	slog.Info("Database connected successfully", "db_name", dbName)
}
