import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        this.socket = io({
            // Socket.io standard path /socket.io/
        });

        this.socket.on('connect', () => {
            console.log('✅ Connected to Real-time Gateway');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from Real-time Gateway');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }
}

export const socketService = new SocketService();
