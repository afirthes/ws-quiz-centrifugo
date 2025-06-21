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

  connect: (connectionId: string, userId: string, channel: string) => Promise<void>;
  disconnect: (connectionId: string) => void;
  sendMessage: (connectionId: string, message: Omit<Message, 'id'>) => void;

  getStatus: (connectionId: string) => Status | undefined;
  getMessages: (connectionId: string) => Message[];
};

export const useCentrifugoStore = create<CentrifugoStore>((set, get) => ({
  connections: {},
  tokens: {},

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
}));