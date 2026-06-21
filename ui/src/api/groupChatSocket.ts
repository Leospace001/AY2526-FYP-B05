import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function createGroupChatClient(
    token: string,
    onConnect: () => void,
    onError?: (message: string) => void
): Client {
    return new Client({
        webSocketFactory: () => new SockJS('/ws'),
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        onConnect,
        onStompError: (frame) => {
            onError?.(frame.headers['message'] || 'WebSocket connection failed');
        },
        onWebSocketError: () => {
            onError?.('WebSocket connection failed');
        },
    });
}

export function subscribeToGroup(
    client: Client,
    groupId: number,
    onMessage: (body: string) => void
): () => void {
    const subscription = client.subscribe(`/topic/groups/${groupId}`, (message: IMessage) => {
        onMessage(message.body);
    });
    return () => subscription.unsubscribe();
}

export function sendGroupMessage(client: Client, groupId: number, content: string): void {
    client.publish({
        destination: `/app/groups/${groupId}/send`,
        body: JSON.stringify({ content }),
    });
}
