package server

import (
	"github.com/afirthes/ws-quiz-centrifugo/internal/handlers"
	"github.com/afirthes/ws-quiz-centrifugo/internal/middleware"
	"github.com/go-chi/chi"
)

func setupRoutes(app *chi.Mux) {
	app.Get("/api", handlers.GetIndex())
	app.Get("/api/db", handlers.GetDb())
	app.With(middleware.UserFromURLParam("email")).
		Get("/api/user/{email}", handlers.GetUser())
	app.Get("/api/profile", handlers.GetProfile())
	app.Get("/api/public", handlers.GetPublic())
	app.With(middleware.Authenticate()).
		Get("/api/secret", handlers.GetSecret())

	app.Route("/api/auth", func(app chi.Router) {
		app.Post("/signup", handlers.SignupHandler())
		app.Post("/signin", handlers.SigninHandler())
		app.With(middleware.Authenticate()).
			Post("/signout", handlers.SignoutHandler())
		app.Get("/me", handlers.Me())
	})
}
