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
};

type CentrifugoStore = {
  connection?: ConnectionData;
  currentQuestion?: QuizQuestion;
  usersAnswered: string[];
  currentQuiz?: string;
  currentUser?: string;
  connectedUsers: string[];
  quizzes?: {
    id: string;
    name: string;
    questions: { id: string; q: string; a: string[]; correct: number; score: number }[];
  }[];
  setQuizzes: (quizzes: {
    id: string;
    name: string;
    questions: { id: string; q: string; a: string[]; correct: number; score: number }[];
  }[]) => void;
  setCurrentUser: (userId: string) => void;

  connect: (userId: string, channel: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: Omit<Message, 'id'>) => void;

  getStatus: () => Status | undefined;
  getMessages: () => Message[];
  setCurrentQuiz: (quizId: string) => void;
  setCurrentQuestion: (q: QuizQuestion) => void;
};

export const useCentrifugoStore = create<CentrifugoStore>((set, get) => ({
  connection: undefined,
  usersAnswered: [],
  currentUser: undefined,
  connectedUsers: [],
  quizzes: undefined,

  setQuizzes: (quizzes) => {
    flushSync(() => {
      set({ quizzes });
    });
  },

  connect: async (userId, channel) => {
    const { connection } = get();

    if (connection) {
      console.warn(`Connection already exists`);
      return;
    }

    const connectionToken = await generateConnectionToken(userId);
    const subscriptionToken = await generateSubscriptionToken(userId, channel);

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
            const prev = state.connectedUsers ?? [];
            const updated = Array.from(new Set([...prev, ctx.data.user]));
            return {
              connectedUsers: updated,
            };
          });
        });
        return;
      } else {
        const message = ctx.data as Message;
        flushSync(() => {
          set((state) => {
            const prev = state.connection;
            if (!prev) return state;
            return {
              connection: {
                ...prev,
                messages: [...prev.messages, message],
              },
            };
          });
        });
      }
    });

    centrifuge.on('connecting', () => {
      flushSync(() => {
        set((state) => {
          const prev = state.connection;
          if (!prev) return state;
          return {
            connection: {
              ...prev,
              status: 'connecting',
            },
          };
        });
      });
    });

    centrifuge.on('connected', () => {
      flushSync(() => {
        set((state) => {
          const prev = state.connection;
          if (!prev) return state;
          return {
            connection: {
              ...prev,
              status: 'connected',
            },
          };
        });
      });
    });

    centrifuge.on('disconnected', () => {
      flushSync(() => {
        set((state) => {
          const prev = state.connection;
          if (!prev) return state;
          return {
            connection: {
              ...prev,
              status: 'disconnected',
            },
          };
        });
      });
    });

    sub.subscribe();
    centrifuge.connect();

    console.log("Called!")

    // Отправка сообщения о подключении
    centrifuge.publish(channel, {
      action: "CONNECTED",
      user: userId,
    });

    flushSync(() => {
      set(() => ({
        connection: {
          centrifuge,
          subscription: sub,
          status: 'connecting',
          messages: [],
          channel,
        },
      }));
    });
  },

  disconnect: () => {
    const conn = get().connection;
    if (!conn) return;

    conn.subscription.unsubscribe();
    conn.centrifuge.disconnect();

    flushSync(() => {
      set(() => ({ connection: undefined }));
    });
  },

  sendMessage: (msg) => {
    const conn = get().connection;
    if (!conn || conn.status !== 'connected') return;

    const fullMsg: Message = {
      ...msg,
      id: crypto.randomUUID(),
    };

    conn.centrifuge.publish(conn.channel, fullMsg);

    flushSync(() => {
      set((state) => ({
        connection: {
          ...conn,
          messages: [...conn.messages, fullMsg],
        },
      }));
    });
  },

  getStatus: () => get().connection?.status,
  getMessages: () => get().connection?.messages ?? [],

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

  setCurrentQuestion: (q) => {
    flushSync(() => {
      set({ currentQuestion: q });
    });
  },
}));