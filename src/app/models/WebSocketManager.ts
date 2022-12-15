import { WSConnection } from "./WSConnection";
import * as WebSocket from 'ws';

export class WebSocketManager{

    private wsClients: WSConnection [] = [];

    constructor() {

    }

    addClient(socket: WebSocket) {
        const client = new WSConnection(socket);
        this.wsClients.push(client);
    }

    removeClient(socket: WebSocket) : boolean {
        let client = this.wsClients.find(client => Object.values(client.socket) === Object.values(socket));
        if(client) {
            const index = this.wsClients.indexOf(client, 0);
            if (index > -1) {
                this.wsClients.splice(index, 1);
            }
            client.socket.terminate();
            return true;
        } else {
            return false;
        }
    }

    findIdentifierBySocket(socket: WebSocket): string | undefined {
        console.log("socket:", JSON.stringify(socket));
        let client = this.wsClients.find(client => JSON.stringify(client.socket) == JSON.stringify(socket));
        console.log("found client:", JSON.stringify(client))
        if(client) {
            return client.getIdentity();
        } else {
            return undefined;
        }
    }
    findClientBySocket(socket: WebSocket): WSConnection | undefined {
        let client = this.wsClients.find(client => Object.values(client.socket) === Object.values(socket));
        if(client) {
            return client;
        } else {
            return undefined;
        }
    }

    findSocketByIdentifier(identifier: string): WebSocket | undefined {
        let client = this.wsClients.find(client => client.getIdentity() === identifier);
        if(client) {
            return client.socket;
        } else {
            return undefined;
        }
    }

    findClientByIdentifier(identifier: string): WSConnection | undefined {
        let client = this.wsClients.find(client => client.getIdentity() === identifier);
        if(client) {
            return client;
        } else {
            return undefined;
        }
    }

    findCurrentController() {
        let client = this.wsClients.find(client => client.hasControl === true);
        if(client) {
            return client;
        } else {
            return undefined;
        }
    }



}