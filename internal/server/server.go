package server

import (
	"bufio"
	"context"
	"encoding/json"
	"github.com/afirthes/ws-quiz-centrifugo/internal/globals"
	"github.com/afirthes/ws-quiz-centrifugo/internal/middleware"
	"github.com/afirthes/ws-quiz-centrifugo/internal/models"
	"github.com/centrifugal/centrifuge-go"
	"github.com/dgraph-io/badger"
	"github.com/go-chi/chi"
	chiMiddleware "github.com/go-chi/chi/middleware"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"time"
)

const exampleTokenHmacSecret = "a-string-secret-at-least-256-bits-long"

func connToken(user string, exp int64, chat string) string {
	if exp == 0 {
		exp = time.Now().Add(time.Hour).Unix() // <- установка exp в секундах
	}

	claims := jwt.MapClaims{
		"sub": user,
		"exp": exp,
	}

	if chat != "" {
		claims["channel"] = chat
	}

	t, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(exampleTokenHmacSecret))
	if err != nil {
		panic(err)
	}

	log.Println("channel:", chat)
	log.Println("token:", t)
	return t
}

type ChatMessage struct {
	Input string `json:"input"`
}

func startCentrifuge() {
	go func() {
		log.Println(http.ListenAndServe(":6060", nil))
	}()

	client := centrifuge.NewJsonClient(
		"ws://localhost:8000/connection/websocket",
		centrifuge.Config{
			// Sending token makes it work with Centrifugo JWT auth (with `secret` HMAC key).
			Token: connToken("49", 0, ""),

			// Most of the time available protocol callbacks cover all necessary information about client-server
			// communication. But some advanced use cases or issue investigation may require more logging.
			//LogLevel: centrifuge.LogLevelDebug,
			//LogHandler: func(e centrifuge.LogEntry) {
			//	log.Printf("[centrifuge] %s %s: %v", e.Level, e.Message, e.Fields)
			//},
		},
	)
	defer client.Close()

	client.OnConnecting(func(e centrifuge.ConnectingEvent) {
		log.Printf("Connecting - %d (%s)", e.Code, e.Reason)
	})
	client.OnConnected(func(e centrifuge.ConnectedEvent) {
		log.Printf("Connected with ID %s", e.ClientID)
	})
	client.OnDisconnected(func(e centrifuge.DisconnectedEvent) {
		log.Printf("Disconnected: %d (%s)", e.Code, e.Reason)
	})

	client.OnError(func(e centrifuge.ErrorEvent) {
		log.Printf("Error: %s", e.Error.Error())
	})

	client.OnMessage(func(e centrifuge.MessageEvent) {
		log.Printf("Message from server: %s", string(e.Data))
	})

	client.OnSubscribed(func(e centrifuge.ServerSubscribedEvent) {
		log.Printf("Subscribed to server-side channel %s: (was recovering: %v, recovered: %v)", e.Channel, e.WasRecovering, e.Recovered)
	})
	client.OnSubscribing(func(e centrifuge.ServerSubscribingEvent) {
		log.Printf("Subscribing to server-side channel %s", e.Channel)
	})
	client.OnUnsubscribed(func(e centrifuge.ServerUnsubscribedEvent) {
		log.Printf("Unsubscribed from server-side channel %s", e.Channel)
	})

	client.OnPublication(func(e centrifuge.ServerPublicationEvent) {
		log.Printf("Publication from server-side channel %s: %s (offset %d)", e.Channel, e.Data, e.Offset)
	})
	client.OnJoin(func(e centrifuge.ServerJoinEvent) {
		log.Printf("Join to server-side channel %s: %s (%s)", e.Channel, e.User, e.Client)
	})
	client.OnLeave(func(e centrifuge.ServerLeaveEvent) {
		log.Printf("Leave from server-side channel %s: %s (%s)", e.Channel, e.User, e.Client)
	})

	err := client.Connect()
	if err != nil {
		log.Fatalln(err)
	}

	sub, err := client.NewSubscription("chat:index", centrifuge.SubscriptionConfig{
		Token:       connToken("49", 0, "chat:index"),
		Recoverable: true,
		JoinLeave:   true,
	})
	if err != nil {
		log.Fatalln(err)
	}

	sub.OnSubscribing(func(e centrifuge.SubscribingEvent) {
		log.Printf("Subscribing on channel %s - %d (%s)", sub.Channel, e.Code, e.Reason)
	})
	sub.OnSubscribed(func(e centrifuge.SubscribedEvent) {
		log.Printf("Subscribed on channel %s, (was recovering: %v, recovered: %v)", sub.Channel, e.WasRecovering, e.Recovered)
	})
	sub.OnUnsubscribed(func(e centrifuge.UnsubscribedEvent) {
		log.Printf("Unsubscribed from channel %s - %d (%s)", sub.Channel, e.Code, e.Reason)
	})

	sub.OnError(func(e centrifuge.SubscriptionErrorEvent) {
		log.Printf("Subscription error %s: %s", sub.Channel, e.Error)
	})

	sub.OnPublication(func(e centrifuge.PublicationEvent) {
		var chatMessage *ChatMessage
		err := json.Unmarshal(e.Data, &chatMessage)
		if err != nil {
			return
		}
		log.Printf("Someone says via channel %s: %s (offset %d)", sub.Channel, chatMessage.Input, e.Offset)
	})
	sub.OnJoin(func(e centrifuge.JoinEvent) {
		log.Printf("Someone joined %s: user id %s, client id %s", sub.Channel, e.User, e.Client)
	})
	sub.OnLeave(func(e centrifuge.LeaveEvent) {
		log.Printf("Someone left %s: user id %s, client id %s", sub.Channel, e.User, e.Client)
	})

	err = sub.Subscribe()
	if err != nil {
		log.Fatalln(err)
	}

	pubText := func(text string) error {
		msg := &ChatMessage{
			Input: text,
		}
		data, _ := json.Marshal(msg)
		_, err := sub.Publish(context.Background(), data)
		return err
	}

	err = pubText("hello")
	if err != nil {
		//log.Printf("Error publish: %s", err)
	}

	log.Printf("Print something and press ENTER to send\n")

	// Read input from stdin.
	go func(sub *centrifuge.Subscription) {
		reader := bufio.NewReader(os.Stdin)
		for {
			text, _ := reader.ReadString('\n')
			text = strings.TrimSpace(text)
			switch text {
			case "#subscribe":
				err := sub.Subscribe()
				if err != nil {
					log.Println(err)
				}
			case "#unsubscribe":
				err := sub.Unsubscribe()
				if err != nil {
					log.Println(err)
				}
			case "#disconnect":
				err := client.Disconnect()
				if err != nil {
					log.Println(err)
				}
			case "#connect":
				err := client.Connect()
				if err != nil {
					log.Println(err)
				}
			case "#close":
				client.Close()
			default:
				err = pubText(text)
				if err != nil {
					//log.Printf("Error publish: %s", err)
				}
			}
		}
	}(sub)

	// Run until CTRL+C.
	select {}
}

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

	// Start Centrifuge publisher
	//go startCentrifuge()

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

func startCentrifugoPublisher() {
	client := centrifuge.NewJsonClient(
		"ws://localhost:8000/connection/websocket",
		centrifuge.Config{},
	)

	client.OnConnecting(func(e centrifuge.ConnectingEvent) {
		log.Printf("Connecting - %d (%s)", e.Code, e.Reason)
	})
	client.OnConnected(func(e centrifuge.ConnectedEvent) {
		log.Printf("Connected with ID %s", e.ClientID)
	})
	client.OnDisconnected(func(e centrifuge.DisconnectedEvent) {
		log.Printf("Disconnected: %d (%s)", e.Code, e.Reason)
	})

	if err := client.Connect(); err != nil {
		log.Fatalf("connect error: %v", err)
	}

	go func() {
		for {
			time.Sleep(10 * time.Second)
			msg := []byte(`{"time": "` + time.Now().Format(time.RFC3339) + `"}`)
			_, err := client.Publish(context.Background(), "chat", msg)
			if err != nil {
				log.Printf("publish error: %v", err)
			}
		}
	}()

	// Keep the goroutine alive
	select {}
}
