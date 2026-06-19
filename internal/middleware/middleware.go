// internal/middleware/middleware.go
package middleware

import (
	"log"
	"net/http"
)

// WithMiddleware handles CORS preflight logic (OPTIONS), JSON Content-Type, 
// and gracefully recovers from Go panics.
func WithMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Server Panic Recovered: %v", err)
				http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
			}
		}()

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		next(w, r)
	}
}