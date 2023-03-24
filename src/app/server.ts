import { ControlManager } from './logic/ControlManager';
import express from 'express';
import * as http from 'http';
import { AddressInfo } from 'net';
import { CanBusWebSocket } from './WebSockets/CanBusWebSocket';
import { feedVigilanceControl, feedWatchdog, lock, requestControlTransfer, select, shift, steer, throttle, transferControl, transferControlDeclined, unlock } from './logic/WebsocketApi';
import { ClientWebSocketManager } from './WebSockets/ClientWebSocketManager';
import { Server } from "socket.io"
import fs from "fs";

const app = express();


// initialize control lock
const controlManager: ControlManager = new ControlManager
// initialize a simple http server
const server = http.createServer(app);
// initilaize socket.io wrapper for communication with the control device
const controlSocket = new CanBusWebSocket();
// get configurations
const config = JSON.parse(fs.readFileSync("./src/app/config.json", "utf-8"));
// initialize the WebSocket server instance
const io = new Server(server, {
	cors: {
		origin: config.allowedOrigins // adjust this for the designated origins. Important for productive systems 
	}
})
const webSocketManager: ClientWebSocketManager = new ClientWebSocketManager(io);

io.on("connection", (socket) => {
	webSocketManager.addClient(socket.id);
	socket.on("lock", (msg) => {
		lock(msg, webSocketManager, controlManager, socket.id, controlSocket)
	});
	socket.on("unlock", (msg) => {
		unlock(msg, webSocketManager, controlManager, io, socket.id)
	});
	socket.on("requestControlTransfer", (msg) => {
		requestControlTransfer(msg, webSocketManager, controlManager, io, socket.id)
	});
	socket.on("transferControl", (msg) => {
		transferControl(msg, webSocketManager, controlManager, controlSocket, socket.id)
	});
	socket.on("transferControlDeclined", (msg) => {
		transferControlDeclined(msg, webSocketManager, controlManager, io, socket.id)
	});
	socket.on("feedWatchdog", (msg) => {
		feedWatchdog(msg, webSocketManager, controlManager, io, socket.id)
	});
	socket.on("feedVigilanceControl", (msg) => {
		feedVigilanceControl(msg, webSocketManager, controlManager, io, socket.id)
	});
	socket.on("select", (msg) => {
		select(msg, webSocketManager, controlSocket, controlManager, io, socket.id)
	});
	socket.on("shift", (msg) => {
		shift(msg, webSocketManager, controlSocket, controlManager, io, socket.id)
	});
	socket.on("throttle", (msg) => {
		throttle(msg, webSocketManager, controlSocket, controlManager, io, socket.id)
	});
	socket.on("steer", (msg) => {
		steer(msg, webSocketManager, controlSocket, controlManager, io, socket.id)
	});
})

// start our server
server.listen(config.hostPort, config.hostURL, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
