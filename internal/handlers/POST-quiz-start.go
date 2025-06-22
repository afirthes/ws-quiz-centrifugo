package handlers

import (
	"encoding/json"
	"net/http"
)

type StartQuizRequestBody struct {
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=6"`
	PasswordConfirm string `json:"password_confirm" validate:"required,eqfield=Password"`
}

// SignupHandler POST /auth/signup
func StartQuizHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// #region Validate request body
		input := &signupHandlerRequestBody{}
		err := json.NewDecoder(r.Body).Decode(input)
		if err != nil {
			WriteErrorResponse(w, http.StatusInternalServerError, err,
				"Error while parsing request body.")
			return
		}

	}
}
