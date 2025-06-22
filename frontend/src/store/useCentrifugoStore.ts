import { create } from 'zustand';
import { Centrifuge, Subscription } from 'centrifuge';
import { SignJWT } from 'jose';
import { flushSync } from 'react-dom';

const secret = new TextEncoder().encode('a-string-secret-at-least-256-bits-long');

async function generateConnectionToken(userId: string): Promise<string> {
  return await new SignJWT({ sub: userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
}

async function generateSubscriptionToken(userId: string, channel: string): Promise<string> {
  return await new SignJWT({ sub: userId, channel })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
}

type Message = {
  id: string;
  user: string;
  text: string;
};

type Status = 'disconnected' | 'connecting' | 'connected';

type QuizQuestion = { q: string; a: string[] };

type ConnectionData = {
  centrifuge: Centrifuge;
  subscription: Subscription;
  status: Status;
  messages: Message[];
  channel: string;
  userId: string;
};

type TokenInfo = {
  connectionToken: string;
  subscriptionToken: string;
  channel: string;
  userId: string;
};

type CentrifugoStore = {
  connections: Record<string, ConnectionData>;
  tokens: Record<string, TokenInfo>;
  currentQuestion?: QuizQuestion;
  usersAnswered: string[];
  currentQuiz?: string;
  currentUser?: string;
  connectedUsers: Record<string, string[]>;
  setCurrentUser: (userId: string) => void;

  connect: (connectionId: string, userId: string, channel: string) => Promise<void>;
  disconnect: (connectionId: string) => void;
  sendMessage: (connectionId: string, message: Omit<Message, 'id'>) => void;

  getStatus: (connectionId: string) => Status | undefined;
  getMessages: (connectionId: string) => Message[];
  setCurrentQuiz: (quizId: string) => void;
};

export const useCentrifugoStore = create<CentrifugoStore>((set, get) => ({
  connections: {},
  tokens: {},
  usersAnswered: [],
  currentUser: undefined,
  connectedUsers: {},

  connect: async (connectionId, userId, channel) => {
    const { connections } = get();

    if (connections[connectionId]) {
      console.warn(`Connection ${connectionId} already exists`);
      return;
    }

    const connectionToken = await generateConnectionToken(userId);
    const subscriptionToken = await generateSubscriptionToken(userId, channel);

    flushSync(() => {
      set((state) => ({
        tokens: {
          ...state.tokens,
          [connectionId]: {
            connectionToken,
            subscriptionToken,
            userId,
            channel,
          },
        },
      }));
    });

    const centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket', {
      token: connectionToken,
    });

    const sub = centrifuge.newSubscription(channel, {
      token: subscriptionToken,
    });

    sub.on('publication', (ctx) => {
      console.log("Получено сообщение:", ctx.data);
      if (ctx.data?.action === "ANSWER") {
        flushSync(() => {
          set((state) => {
            const existing = state.usersAnswered ?? [];
            const updated = Array.from(new Set([...existing, ctx.data.user]));
            console.log("Ответившие пользователи:", updated);
            return {
              usersAnswered: updated,
            };
          });
        });
      } else if (ctx.data?.action === "NEXT_QUESTION") {
        flushSync(() => {
          set(() => ({
            currentQuestion: ctx.data.data,
            usersAnswered: [],
          }));
        });
        console.log("Получен новый вопрос:", ctx.data.data);
        return;
      } else if (ctx.data?.action === "CONNECTED") {
        flushSync(() => {
          set((state) => {
            const channel = state.tokens[connectionId]?.channel;
            if (!channel) return state;
            const prev = state.connectedUsers[channel] ?? [];
            const updated = Array.from(new Set([...prev, ctx.data.user]));
            return {
              connectedUsers: {
                ...state.connectedUsers,
                [channel]: updated,
              },
            };
          });
        });
        return;
      } else {
        const message = ctx.data as Message;
        flushSync(() => {
          set((state) => {
            const prev = state.connections[connectionId];
            if (!prev) return state;
            return {
              connections: {
                ...state.connections,
                [connectionId]: {
                  ...prev,
                  messages: [...prev.messages, message],
                },
              },
            };
          });
        });
      }
    });

    centrifuge.on('connecting', () => {
      flushSync(() => {
        set((state) => {
          const prev = state.connections[connectionId];
          if (!prev) return state;
          return {
            connections: {
              ...state.connections,
              [connectionId]: {
                ...prev,
                status: 'connecting',
              },
            },
          };
        });
      });
    });

    centrifuge.on('connected', () => {
      flushSync(() => {
        set((state) => {
          const prev = state.connections[connectionId];
          if (!prev) return state;
          return {
            connections: {
              ...state.connections,
              [connectionId]: {
                ...prev,
                status: 'connected',
              },
            },
          };
        });
      });
    });

    centrifuge.on('disconnected', () => {
      flushSync(() => {
        set((state) => {
          const prev = state.connections[connectionId];
          if (!prev) return state;
          return {
            connections: {
              ...state.connections,
              [connectionId]: {
                ...prev,
                status: 'disconnected',
              },
            },
          };
        });
      });
    });

    sub.subscribe();
    centrifuge.connect();

    // Отправка сообщения о подключении
    centrifuge.publish(channel, {
      action: "CONNECTED",
      user: userId,
    });

    flushSync(() => {
      set((state) => ({
        connections: {
          ...state.connections,
          [connectionId]: {
            centrifuge,
            subscription: sub,
            status: 'connecting',
            messages: [],
            channel,
            userId,
            // answers поле больше не используется внутри connections
          },
        },
      }));
    });
  },

  disconnect: (connectionId) => {
    const conn = get().connections[connectionId];
    if (!conn) return;

    conn.subscription.unsubscribe();
    conn.centrifuge.disconnect();

    flushSync(() => {
      set((state) => {
        const newConnections = { ...state.connections };
        delete newConnections[connectionId];
        return { connections: newConnections };
      });
    });
  },

  sendMessage: (connectionId, msg) => {
    const conn = get().connections[connectionId];
    if (!conn || conn.status !== 'connected') return;

    const fullMsg: Message = {
      ...msg,
      id: crypto.randomUUID(),
    };

    conn.centrifuge.publish(conn.channel, fullMsg);

    flushSync(() => {
      set((state) => ({
        connections: {
          ...state.connections,
          [connectionId]: {
            ...conn,
            messages: [...conn.messages, fullMsg],
          },
        },
      }));
    });
  },

  getStatus: (connectionId) => get().connections[connectionId]?.status,
  getMessages: (connectionId) => get().connections[connectionId]?.messages ?? [],

  setCurrentQuiz: (quizId) => {
    flushSync(() => {
      set({ currentQuiz: quizId });
    });
  },

  setCurrentUser: (userId) => {
    flushSync(() => {
      set({ currentUser: userId });
    });
  },
}));