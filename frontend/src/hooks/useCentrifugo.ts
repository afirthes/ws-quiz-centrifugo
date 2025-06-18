import {useEffect} from 'react';
import {Centrifuge} from 'centrifuge';
import {useDispatch} from 'react-redux';
import {setStatus} from '../store/connectionSlice';
import {SignJWT} from 'jose';

const secret = new TextEncoder().encode('a-string-secret-at-least-256-bits-long');

export async function generateConnectionToken(userId: string): Promise<string> {
    return await new SignJWT({sub: userId})
        .setProtectedHeader({alg: 'HS256'})
        .setExpirationTime('1h')
        .sign(secret);
}

export async function generateSubscriptionToken(userId: string, channel: string): Promise<string> {
    return await new SignJWT({sub: userId, channel})
        .setProtectedHeader({alg: 'HS256'})
        .setExpirationTime('1h')
        .sign(secret);
}

export const useCentrifugo = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        let centrifuge: Centrifuge;

        const init = async () => {
            const userId = 'user123';
            const connectionToken = await generateConnectionToken(userId);
            const subscriptionToken = await generateSubscriptionToken(userId, 'chat');

            centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket', {
                token: connectionToken,
            });

            centrifuge.on('connected', () => {
                console.log('CONNECTED');
                dispatch(setStatus('connected'))
            });
            centrifuge.on('connecting', () => {
                console.log('CONNECTING');
                dispatch(setStatus('connecting'))
            });
            centrifuge.on('disconnected', () => {
                console.log('DISCONNECTED');
                dispatch(setStatus('disconnected'))
            });

            const sub = centrifuge.newSubscription('chat', {
                token: subscriptionToken,
            });

            sub.on('publication', (ctx) => {
                console.log('Received message:', ctx.data);
            });

            sub.subscribe();
            centrifuge.connect();
        };

        init();

        return () => {
            if (centrifuge) {
                centrifuge.disconnect();
            }
        };
    }, [dispatch]);
};