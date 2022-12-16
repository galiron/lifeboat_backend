import { Server } from 'socket.io';
import { WSConnection } from "./WSConnection";
import * as WebSocket from 'ws';

export class WebSocketManager{

    private wsClients: WSConnection [] = [];
    server: Server;

    constructor(socketioServer: Server) {
        this.server = socketioServer;
    }

    emitMessage(socketId: string, api: string, data: any){
        let socket = this.server.sockets.sockets.get(socketId);
        if (socket){
            socket.emit(api, JSON.stringify(data))
        }
    }

    addClient(socketId: string) {
        const client = new WSConnection(socketId);
        this.wsClients.push(client);
    }

    removeClient(socketId: string) : boolean {
        let client = this.wsClients.find(client => client.socketId === socketId);
        if(client) {
            const index = this.wsClients.indexOf(client, 0);
            if (index > -1) {
                this.wsClients.splice(index, 1);
            }
            this.server.sockets.sockets.get(socketId)?.disconnect();
            return true;
        } else {
            return false;
        }
    }

    findIdentifierBySocketId(socketId: string): string | undefined {
        console.log("socket:", JSON.stringify(socketId));
        let client = this.wsClients.find(client => client.socketId == socketId);
        console.log("found client:", JSON.stringify(client))
        if(client) {
            return client.getIdentity();
        } else {
            return undefined;
        }
    }
    findClientBySocketId(socketId: string): WSConnection | undefined {
        let client = this.wsClients.find(client => client.socketId === socketId);
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

    findClientByIdentifier(identifier: string): WSConnection | undefined {
        let client = this.wsClients.find(client => client.getIdentity() === identifier);
        if(client) {
            return client;
        } else {
            return undefined;
        }
    }

}