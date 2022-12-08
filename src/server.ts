import { ControlLock } from './logic/ControlLock';
import { WSMessage } from './models/wsMessage';
import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';
import { io } from "socket.io-client";
import { ControlSocket } from './logic/ControllsSocket';
import { processMessage } from './logic/WebsocketApi';

const app = express();


// initialize control lock
const controlLock: ControlLock = new ControlLock
// initialize a simple http server
const server = http.createServer(app);
// initilaize socket.io wrapper for communication with the control device
const controlSocket = new ControlSocket();
// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {

		ws.on('message', (msgString: string) => {
			// outsourced the functionality for better testability
			processMessage(msgString, ws, controlSocket, controlLock)
		});
});

// start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
