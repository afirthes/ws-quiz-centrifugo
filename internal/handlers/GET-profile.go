package handlers

import (
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"net/http"

	"github.com/alexedwards/scs/v2"
)

// GetProfile GET /profile
func GetProfile() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionManager := r.Context().Value(globals.SessionContext).(*scs.SessionManager)
		currentUser := sessionManager.GetString(r.Context(), "user")

		if currentUser == "" {
			WriteResponse(w, "You're not logged in.")
			return
		}

		WriteResponse(w, "You're logged in as "+currentUser)
	}
}
