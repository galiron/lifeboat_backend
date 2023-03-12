import { Server } from 'socket.io';
import { WSConnection } from "../models/wsConnection";

export class ClientWebSocketManager {

    private wsClients: WSConnection [] = [];
    server: Server;

    constructor(socketioServer: Server) {
        this.server = socketioServer;
    }

    emitMessage(socketId: string | undefined, api: string, data: any) : boolean{
        if(socketId) {
            let socket = this.server.sockets.sockets.get(socketId);
            if (socket){
                socket.emit(api, data)
                return true
            }
        } else {
            console.log("can't emit message without socketID")
        }
        return false;
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
        let client = this.wsClients.find(client => client.socketId == socketId);
        if(client) {
            return client.getIdentity();
        } else {
            return undefined;
        }
    }
    
    findClientBySocketId(socketId: string | undefined): WSConnection | undefined {
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