package handlers

import (
	"fmt"
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"net/http"

	"github.com/alexedwards/scs/v2"
)

// SigninHandler GET /auth/me
func Me() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		sessionManager := r.Context().Value(globals.SessionContext).(*scs.SessionManager)
		emailRaw := sessionManager.Get(r.Context(), "user")
		email, ok := emailRaw.(string)
		if !ok || email == "" {
			err := fmt.Errorf("Unauthorized: %s", "/auth/me")
			WriteErrorResponse(w, http.StatusUnauthorized, err, "User is unauthorized.")
			return
		}

		WriteResponse(w, map[string]string{"email": email})
	}
}
