import * as WebSocket from 'ws';
import generator from 'generate-password-ts';

export class WSConnection {
    hasControl: boolean;
    private identity: string;
    jwt?: string;
    socket: WebSocket;

    constructor(socket: WebSocket){
        this.hasControl = false;
        this.identity = generator.generate({
            length: 20,
            numbers: true,
            symbols: true
        });
        this.jwt = undefined;
        this.socket = socket;
    }

    getIdentity () : string {
        return String(this.identity);
    }
}