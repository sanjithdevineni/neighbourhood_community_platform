package utils

import (
	"math"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// PaginationParams holds the parsed page and limit values from query strings.
type PaginationParams struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

// PaginatedResponse wraps a paginated result set with metadata.
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"total_pages"`
}

const (
	DefaultPage  = 1
	DefaultLimit = 10
	MaxLimit     = 100
)

// ParsePagination reads "page" and "limit" query parameters from the request
// and returns clamped, validated PaginationParams.
func ParsePagination(c *gin.Context) PaginationParams {
	page := DefaultPage
	limit := DefaultLimit

	if p := c.Query("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil && v > 0 {
			page = v
		}
	}

	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}

	// Clamp limit to MaxLimit
	if limit > MaxLimit {
		limit = MaxLimit
	}

	return PaginationParams{Page: page, Limit: limit}
}

// Paginate executes a count query and a paginated find on the provided *gorm.DB.
// The baseQuery should already have any Where/Order clauses applied.
// dest must be a pointer to a slice (e.g., *[]models.Event).
func Paginate(baseQuery *gorm.DB, params PaginationParams, dest interface{}) (*PaginatedResponse, error) {
	var total int64

	// Count total matching records (without offset/limit)
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// Calculate offset
	offset := (params.Page - 1) * params.Limit

	// Fetch the page of results
	if err := baseQuery.Offset(offset).Limit(params.Limit).Find(dest).Error; err != nil {
		return nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(params.Limit)))

	return &PaginatedResponse{
		Data:       dest,
		Page:       params.Page,
		Limit:      params.Limit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}
