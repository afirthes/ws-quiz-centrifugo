package middleware

import (
	"context"
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"github.com/afirthes/ws-quiz-centrifugo/internal/handlers"
	"github.com/afirthes/ws-quiz-centrifugo/internal/models"
	"net/http"

	"github.com/dgraph-io/badger"
	"github.com/go-chi/chi"
)

// UserFromURLParam is a middleware that stores a user struct in the context.
func UserFromURLParam(paramName string) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userEmail := chi.URLParam(r, paramName)
			ctx := r.Context()
			db := ctx.Value(globals.DBContext).(*badger.DB)

			user, err := models.GetUserByEmail(db, userEmail)
			if err != nil {
				handlers.WriteErrorResponse(w, http.StatusNotFound, err,
					"Error while retrieving user.")
				return
			}

			ctx = context.WithValue(ctx, globals.UserContext, user)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
