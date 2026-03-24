package applog

import (
	"io"
	"log/slog"
	"os"
	"path/filepath"
)

// Logger is the application-wide structured logger.
var Logger *slog.Logger

// Init initializes the structured JSON logger.
// Logs are written to both stdout and logs/app.log.
func Init() {
	// Ensure the logs directory exists
	logDir := "logs"
	if err := os.MkdirAll(logDir, 0755); err != nil {
		slog.Error("Failed to create log directory", "error", err)
		os.Exit(1)
	}

	logFile, err := os.OpenFile(
		filepath.Join(logDir, "app.log"),
		os.O_CREATE|os.O_WRONLY|os.O_APPEND,
		0644,
	)
	if err != nil {
		slog.Error("Failed to open log file", "error", err)
		os.Exit(1)
	}

	// Write to both stdout and the log file
	multiWriter := io.MultiWriter(os.Stdout, logFile)

	Logger = slog.New(slog.NewJSONHandler(multiWriter, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))

	// Set as the default logger so slog.Info(), slog.Error() etc. work globally
	slog.SetDefault(Logger)

	slog.Info("Logger initialized", "log_file", filepath.Join(logDir, "app.log"))
}
