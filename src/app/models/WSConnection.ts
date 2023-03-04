import * as WebSocket from 'ws';
import generator from 'generate-password-ts';

export class WSConnection {
    hasControl: boolean;
    private identity: string;
    jwt: string | undefined;
    socketId: string | undefined;

    constructor(socketId: string, hasControl?: boolean, identity?: string, jwt?: string){
        if(socketId && hasControl && identity && jwt) {
            this.hasControl = hasControl;
            this.identity = identity;
            this.jwt = jwt;
            this.socketId = socketId;
        } else {
            this.hasControl = false;
            this.identity = generator.generate({
                length: 20,
                numbers: true,
                symbols: true
            });
            this.jwt = undefined;
            this.socketId = socketId;
        }
    }

    getIdentity () : string {
        return String(this.identity);
    }
    setIdentity (identity: string) {
        this.identity = identity;
    }
}