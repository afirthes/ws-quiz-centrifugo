package middleware

import (
	"context"
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"net/http"

	"github.com/dgraph-io/badger"
)

// BadgerDB provides DB access through the request context
func BadgerDB(db *badger.DB) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), globals.DBContext, db)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
