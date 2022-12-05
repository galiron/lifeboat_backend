"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ControlLock_1 = require("./logic/ControlLock");
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const WebSocket = __importStar(require("ws"));
const ControllsSocket_1 = require("./logic/ControllsSocket");
const app = (0, express_1.default)();
// initialize control lock
const controlLock = new ControlLock_1.ControlLock;
// initialize a simple http server
const server = http.createServer(app);
const controlSocket = new ControllsSocket_1.ControlSocket();
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
wss.on('connection', (ws) => {
    ws.on('message', (msgString) => {
        const msg = JSON.parse(msgString);
        if (msg) {
            let api = msg.api;
            console.log(msg.api);
            if (api === "lock") {
                if (msg.data) {
                    if (msg.data.secretKey) {
                        controlLock.takeControl(msg.data.secretKey, ws)
                            .then((jwtMsg) => {
                            console.log(jwtMsg);
                            ws.send(JSON.stringify(jwtMsg));
                        });
                    }
                }
            }
            if (api === "unlock") {
                if (msg.data) {
                    console.log(msg);
                    if (msg.data.jwt) {
                        const releaseMessage = controlLock.releaseControl(msg.data.jwt);
                        console.log(releaseMessage);
                        ws.send(JSON.stringify(releaseMessage));
                    }
                }
            }
            if (api === "feedWatchdog") {
                if (msg.data) {
                    if (msg.data.jwt) {
                        controlLock.feedWatchdog(msg.data.jwt);
                        //console.log(releaseMessage)
                        //ws.send(JSON.stringify(releaseMessage))
                    }
                }
            }
            if (api === "select") {
                if (msg.data) {
                    if (msg.data.jwt && msg.data.instruction) {
                        const isController = controlLock.verify(msg.data.jwt);
                        if (isController) {
                            controlSocket.emit("select", msg.data.instruction);
                        }
                    }
                }
            }
            if (api === "shift") {
                if (msg.data) {
                    if (msg.data.jwt && msg.data.instruction) {
                        const isController = controlLock.verify(msg.data.jwt);
                        if (isController) {
                            controlSocket.emit("shift", msg.data.instruction);
                        }
                    }
                }
            }
            if (api === "throttle") {
                console.log("throttle");
                if (msg.data) {
                    if (msg.data.jwt && msg.data.instruction) {
                        const isController = controlLock.verify(msg.data.jwt);
                        if (isController) {
                            console.log("emit throttle");
                            controlSocket.emit("throttle", msg.data.instruction);
                        }
                    }
                }
            }
            if (api === "steer") {
                if (msg.data) {
                    if (msg.data.jwt && msg.data.instruction) {
                        const isController = controlLock.verify(msg.data.jwt);
                        if (isController) {
                            controlSocket.emit("steer", msg.data.instruction);
                        }
                    }
                }
            }
        }
        else {
            ws.send({ success: false, interfaceType: "error" });
        }
    });
});
// start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});
