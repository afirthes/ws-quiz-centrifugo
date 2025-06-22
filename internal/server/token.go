package server

import (
	"github.com/golang-jwt/jwt/v5"
	"log"
	"time"
)

const exampleTokenHmacSecret = "a-string-secret-at-least-256-bits-long"

func ConnectionToken(user string, chat string) string {

	claims := jwt.MapClaims{
		"sub": user,
		"exp": time.Now().Add(time.Hour * 24).Unix(),
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
