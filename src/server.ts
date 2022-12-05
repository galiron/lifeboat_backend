import { ControlLock } from './logic/ControlLock';
import { WSMessage } from './models/wsMessage';
import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';
import { io } from "socket.io-client";
import { ControlSocket } from './logic/ControllsSocket';

const app = express();


// initialize control lock
const controlLock: ControlLock = new ControlLock

// initialize a simple http server
const server = http.createServer(app);

const controlSocket = new ControlSocket();



//controlSocket.emit("hello_world","hello_world")

// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

// const io = new Server(server, {
// 	cors: {
// 		origin: ["*"]
// 	  }
// })

// io.on("connection", (socket) => {
// 	//socket.emit("hello", "world")
// 	socket.on("lock", (msg) => {
// 		if(msg.data){
// 			if (msg.data.secretKey){
// 				controlLock.takeControl(msg.data.secretKey, socket)
// 				.then((jwtMsg) => {
// 					console.log(jwtMsg)
// 					socket.emit("WSJwtReply",jwtMsg)
// 					}
// 				)
// 			}
// 		}
// 	})
// 	socket.on("unlock", (msg) => {
// 		if(msg.data){
// 			console.log(msg)
// 			if (msg.data.jwt){
// 				const releaseMessage = controlLock.releaseControl(msg.data.jwt)
// 				console.log(releaseMessage)
// 				socket.emit("WSReply",releaseMessage)
// 			}
// 		}
// 	})
// 	socket.on("feedWatchdog", (msg) => {
// 		if(msg.data){
// 			if (msg.data.jwt){
// 				controlLock.feedWatchdog(msg.data.jwt)
// 				//console.log(releaseMessage)
// 				//ws.send(JSON.stringify(releaseMessage))
// 			}
// 		}
// 	})
// })

wss.on('connection', (ws: WebSocket) => {

		ws.on('message', (msgString: string) => {
			const msg: WSMessage = JSON.parse(msgString);
			if (msg){
				let api = msg.api;
				console.log(msg.api)
				if (api === "lock") {
					if(msg.data){
						if (msg.data.secretKey){
							controlLock.takeControl(msg.data.secretKey, ws)
							.then((jwtMsg) => {
								console.log(jwtMsg)
								 ws.send(JSON.stringify(jwtMsg));
								}
							)
						}
					}
				}
				if (api === "unlock") {
					if(msg.data){
						console.log(msg)
						if (msg.data.jwt){
							const releaseMessage = controlLock.releaseControl(msg.data.jwt)
							console.log(releaseMessage)
							ws.send(JSON.stringify(releaseMessage))
						}
					}
				}
				if (api === "feedWatchdog") {
					if(msg.data){
						if (msg.data.jwt){
							controlLock.feedWatchdog(msg.data.jwt)
							//console.log(releaseMessage)
							//ws.send(JSON.stringify(releaseMessage))
						}
					}
				}
				if (api === "select") {
					if(msg.data){
						if (msg.data.jwt && msg.data.instruction){
							const isController = controlLock.verify(msg.data.jwt);
							if(isController){
								controlSocket.emit("select", msg.data.instruction)
							}
						}
					}
				}
				if (api === "shift") {
					if(msg.data){
						if (msg.data.jwt && msg.data.instruction){
							const isController = controlLock.verify(msg.data.jwt);
							if(isController){
								controlSocket.emit("shift", msg.data.instruction)
							}
						}
					}
				}
				if (api === "throttle") {
					console.log("throttle")
					if(msg.data){
						if (msg.data.jwt && msg.data.instruction){
							const isController = controlLock.verify(msg.data.jwt);
							if(isController){
								console.log("emit throttle")
								controlSocket.emit("throttle", msg.data.instruction)
							}
						}
					}
				}
				if (api === "steer") {
					if(msg.data){
						if (msg.data.jwt && msg.data.instruction){
							const isController = controlLock.verify(msg.data.jwt);
							if(isController){
								controlSocket.emit("steer", msg.data.instruction)
							}
						}
					}
				}
			} else {
				ws.send({success: false, interfaceType: "error"})
			}
		});
});

// start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
