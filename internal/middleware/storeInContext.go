package middleware

import (
	"context"
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"net/http"
)

// SetContext stores some values in the context
func SetContext(data map[globals.ContextKey]interface{}) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			for key, item := range data {
				ctx = context.WithValue(ctx, key, item)
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
