package centrifuge

import (
	"github.com/afirthes/ws-quiz-centrifugo/internal/server"
	"github.com/centrifugal/centrifuge-go"
	"log"
	"time"
)

type CentrifugeService struct {
	client *centrifuge.Client
	subs   map[string]chan string
	pubs   map[string]chan string
}

// NewCentrifugeService инициализирует клиент, но не подключает.
func NewCentrifugeService() *CentrifugeService {
	client := centrifuge.NewJsonClient(
		"ws://localhost:8000/connection/websocket",
		centrifuge.Config{
			Token: server.ConnectionToken("SERVER", "*"),
		},
	)

	service := &CentrifugeService{client: client}

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

	return service
}

func (s *CentrifugeService) Start() {
	go func() {
		for {
			func() {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Recovered from panic: %v. Retrying in 5 seconds...", r)
						time.Sleep(5 * time.Second)
					}
				}()

				err := s.client.Connect()
				if err != nil {
					log.Printf("Connection error: %v. Retrying in 5 seconds...", err)
					time.Sleep(5 * time.Second)
					return
				}

				// Блокируем, пока соединение активно
				select {}
			}()
		}
	}()
}

func (s *CentrifugeService) Subscribe(channel string) error {
	sub, err := s.client.NewSubscription(channel)

	if err != nil {
		return err
	}

	sub.OnPublication(func(e centrifuge.PublicationEvent) {
		log.Printf("Message on %s: %s", channel, e.Data)
		// TODO: implement custom logic here
	})

	sub.OnJoin(func(e centrifuge.JoinEvent) {
		log.Printf("User joined %s: %s", channel, e.User)
	})

	sub.OnLeave(func(e centrifuge.LeaveEvent) {
		log.Printf("User left %s: %s", channel, e.User)
	})

	return sub.Subscribe()
}

func (s *CentrifugeService) Disconnect() error {
	err := s.client.Disconnect()
	if err != nil {
		return err
	}
}
