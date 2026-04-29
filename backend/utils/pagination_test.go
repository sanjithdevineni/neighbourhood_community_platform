package utils

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func createTestContext(queryString string) *gin.Context {
	req := httptest.NewRequest(http.MethodGet, "/test?"+queryString, nil)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = req
	return c
}

func TestParsePagination_Defaults(t *testing.T) {
	c := createTestContext("")
	params := ParsePagination(c)

	if params.Page != DefaultPage {
		t.Errorf("expected default page %d, got %d", DefaultPage, params.Page)
	}
	if params.Limit != DefaultLimit {
		t.Errorf("expected default limit %d, got %d", DefaultLimit, params.Limit)
	}
}

func TestParsePagination_CustomValues(t *testing.T) {
	c := createTestContext("page=3&limit=25")
	params := ParsePagination(c)

	if params.Page != 3 {
		t.Errorf("expected page 3, got %d", params.Page)
	}
	if params.Limit != 25 {
		t.Errorf("expected limit 25, got %d", params.Limit)
	}
}

func TestParsePagination_NegativePageClampedToDefault(t *testing.T) {
	c := createTestContext("page=-5&limit=10")
	params := ParsePagination(c)

	if params.Page != DefaultPage {
		t.Errorf("expected page to be clamped to %d, got %d", DefaultPage, params.Page)
	}
}

func TestParsePagination_ZeroPageClampedToDefault(t *testing.T) {
	c := createTestContext("page=0&limit=10")
	params := ParsePagination(c)

	if params.Page != DefaultPage {
		t.Errorf("expected page to be clamped to %d, got %d", DefaultPage, params.Page)
	}
}

func TestParsePagination_LimitClampedToMax(t *testing.T) {
	c := createTestContext("page=1&limit=500")
	params := ParsePagination(c)

	if params.Limit != MaxLimit {
		t.Errorf("expected limit to be clamped to %d, got %d", MaxLimit, params.Limit)
	}
}

func TestParsePagination_InvalidStringsUseDefaults(t *testing.T) {
	c := createTestContext("page=abc&limit=xyz")
	params := ParsePagination(c)

	if params.Page != DefaultPage {
		t.Errorf("expected default page %d, got %d", DefaultPage, params.Page)
	}
	if params.Limit != DefaultLimit {
		t.Errorf("expected default limit %d, got %d", DefaultLimit, params.Limit)
	}
}

func TestParsePagination_NegativeLimitClampedToDefault(t *testing.T) {
	c := createTestContext("page=1&limit=-10")
	params := ParsePagination(c)

	if params.Limit != DefaultLimit {
		t.Errorf("expected limit to be clamped to %d, got %d", DefaultLimit, params.Limit)
	}
}
