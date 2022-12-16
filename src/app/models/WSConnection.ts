import * as WebSocket from 'ws';
import generator from 'generate-password-ts';

export class WSConnection {
    hasControl: boolean;
    private identity: string;
    jwt?: string;
    socketId: string;

    constructor(socketId: string){
        this.hasControl = false;
        this.identity = generator.generate({
            length: 20,
            numbers: true,
            symbols: true
        });
        this.jwt = undefined;
        this.socketId = socketId;
    }

    getIdentity () : string {
        return String(this.identity);
    }
}