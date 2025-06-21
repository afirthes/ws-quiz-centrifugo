import { Centrifuge } from 'centrifuge';

export const createCentrifugo = (token: string) => {
    const centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket', {
        token,
    });

    return centrifuge;
};