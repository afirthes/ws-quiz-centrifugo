package handlers

import (
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"net/http"

	"github.com/alexedwards/scs/v2"
)

// SignoutHandler POST /auth/signout
func SignoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// #region Remove session cookie
		sessionManager := r.Context().Value(globals.SessionContext).(*scs.SessionManager)
		err := sessionManager.Destroy(r.Context())
		if err != nil {
			WriteErrorResponse(w, http.StatusInternalServerError, err,
				"Error while destroying the session.")
			return
		}
		// #endregion Remove session cookie

		WriteResponse(w, nil)
	}
}
