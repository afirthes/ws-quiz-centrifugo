package server

import (
	"context"
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"github.com/afirthes/ws-quiz-centrifugo/internal/middleware"
	"github.com/afirthes/ws-quiz-centrifugo/internal/models"
	"github.com/dgraph-io/badger"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
)

// StartServer is the main entry point of the application.
func StartServer() {
	// #region Setup global dependencies
	db := GetDatabase(&DatabaseOptions{
		Path: "data.db",
	})
	defer func(db *badger.DB) {
		err := db.Close()
		if err != nil {
			log.Fatalf("Error closing db %v", err)
		}
	}(db)

	createDummyUser(db)

	sessionManager := GetSessionManager(db, &SessionManagerOptions{
		StorePrefix: "session:",
		CookieName:  "sessionid",
	})

	validator := GetValidator()
	// #endregion Setup global dependencies

	// #region setup routes and global middleware
	app := chi.NewRouter()
	app.Use(chiMiddleware.Logger)
	app.Use(chiMiddleware.Recoverer)
	app.Use(middleware.SetContext(map[globals.ContextKey]interface{}{
		globals.DBContext:        db,
		globals.SessionContext:   sessionManager,
		globals.ValidatorContext: validator,
	}))
	app.Use(middleware.BadgerDB(db))
	app.Use(sessionManager.LoadAndSave)
	setupRoutes(app)
	// #endregion setup routes and global middleware

	// #region Setup server
	logger := log.New(os.Stdout, "http: ", log.LstdFlags)
	addr := ":8080"
	server := &http.Server{
		Addr:         addr,
		Handler:      app,
		ErrorLog:     logger,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  15 * time.Second,
	}
	// #endregion Setup server

	// #region Graceful shutdown with [ctrl] + [c]
	done := make(chan bool, 1)
	quit := make(chan os.Signal, 1)

	signal.Notify(quit, os.Interrupt)

	go func() {
		<-quit
		logger.Println("Server is shutting down...")

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		server.SetKeepAlivesEnabled(false)
		if err := server.Shutdown(ctx); err != nil {
			logger.Fatalf("Could not gracefully shutdown the server: %v\n", err)
		}

		close(done)
	}()

	logger.Println("Server is ready to handle requests at", addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not start server on addr \"%s\": %v", addr, err)
	}

	<-done
	logger.Println("Server stopped")
	// #endregion Graceful shutdown with [ctrl] + [c]
}

func createDummyUser(db *badger.DB) {
	hash, err := bcrypt.GenerateFromPassword([]byte("123123"), 12)
	if err != nil {
		panic("")
	}

	user := &models.User{
		Email:    "a@a.a",
		Password: string(hash),
	}

	err = user.Save(db)
	if err != nil {
		panic("")
		return
	}

}
