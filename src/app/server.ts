import { ControlLock } from './logic/ControlLock';
import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';
import { ControlSocket } from './models/ControllsSocket';
import { feedWatchdog, lock, processMessage, requestControlTransfer, select, shift, steer, throttle, transferControl, transferControlDeclined, unlock } from './logic/WebsocketApi';
import { WebSocketManager } from './models/WebSocketManager';
import { Server } from "socket.io"

const app = express();


// initialize control lock
const controlLock: ControlLock = new ControlLock
// initialize a simple http server
const server = http.createServer(app);
// initilaize socket.io wrapper for communication with the control device
const controlSocket = new ControlSocket();
// initialize the WebSocket server instance
const io = new Server(server, {
	cors: {
		origin: "http://localhost:4200"
	}
})
//const wss = new WebSocket.Server({ server });
const webSocketManager: WebSocketManager = new WebSocketManager(io);

io.on("connection", (socket) => {
	webSocketManager.addClient(socket.id);
	console.log("connected, current controller = ", controlLock.controllerToken)
	socket.on("lock", (msg) => {
		lock(msg, webSocketManager, controlLock, socket.id)
	});
	socket.on("unlock", (msg) => {
		unlock(msg, webSocketManager, controlLock, io, socket.id)
	});
	socket.on("requestControlTransfer", (msg) => {
		requestControlTransfer(msg, webSocketManager, controlLock, io, socket.id)
	});
	socket.on("transferControl", (msg) => {
		transferControl(msg, webSocketManager, controlLock, io, socket.id)
	});
	socket.on("transferControlDeclined", (msg) => {
		transferControlDeclined(msg, webSocketManager, controlLock, io, socket.id)
	});
	socket.on("feedWatchdog", (msg) => {
		feedWatchdog(msg, webSocketManager, controlLock, io, socket.id)
	});
	socket.on("select", (msg) => {
		select(msg, webSocketManager, controlSocket, controlLock, io, socket.id)
	});
	socket.on("shift", (msg) => {
		shift(msg, webSocketManager, controlSocket, controlLock, io, socket.id)
	});
	socket.on("throttle", (msg) => {
		throttle(msg, webSocketManager, controlSocket, controlLock, io, socket.id)
	});
	socket.on("steer", (msg) => {
		steer(msg, webSocketManager, controlSocket, controlLock, io, socket.id)
	});
})

// wss.on('connection', (ws: WebSocket) => {
// 		ws.on('message', (msgString: string) => {
// 			// outsourced the functionality for better testability
// 			processMessage(msgString, webSocketManager, ws, controlSocket, controlLock)
// 		});

// 		ws.on('disconnect', () => {
// 			// outsourced the functionality for better testability
// 			webSocketManager.removeClient(ws);
// 		});
// });

// start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
