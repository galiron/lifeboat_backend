import { Instruction } from './../models/Interfaces';
import { Server } from 'socket.io';
import { ControlSocket } from '../models/ControllsSocket';
import { messageIsOfInterface, WSAPIMessage, WSControlTransferResponse, WSJwtMessage, WSLockReleaseResponse, WSLockRequest, WSRequestControlTransferToBackend, WSSelectRequest, WSShifttRequest, WSSteeringRequest, WSThrottleRequest } from "../models/WSMessageInterfaces";
import { ControlLock } from "./ControlLock";
import * as WebSocket from 'ws';
import { WebSocketManager } from '../models/WebSocketManager';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export function lock(data: WSLockRequest, webSocketManager: WebSocketManager, controlLock: ControlLock, socketId: string){
    try {
        if (data.secretKey) {
            controlLock.takeControl(data.secretKey, webSocketManager, socketId)
            .then((jwtMsg) => {
                console.log(jwtMsg)
                webSocketManager.emitMessage(socketId, "WSControlAssignment", jwtMsg);
                }
            )
        }
        
    } catch(err: any){
        console.log(err)
    }
}
export function requestControlTransfer(data: WSRequestControlTransferToBackend, webSocketManager: WebSocketManager, controlLock: ControlLock, server: Server, socketId: string){
    try {
        if (data.name && data.secretKey) {
            controlLock.requestControlTransfer(webSocketManager, data.secretKey, data.name, server, socketId)
        } else {
            console.log("data expected format of WSControlTransferResponse, found data is: ", data)
        }
    } catch(err: any){
        console.log(err)
    }
}
export function transferControl(data: WSControlTransferResponse, webSocketManager: WebSocketManager, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt && data.identifier){
            controlLock.transferControlTransfer(data.jwt, data.identifier, webSocketManager)
        } else {
            const data = {
                success: false,
                errorMessage: "the request was missing a jwt token or identifier",
                interfaceType: "WSErrorResponse"
            }
            webSocketManager.emitMessage(socketId,"WSErrorResponse" , data);
        }
    } catch(err: any){
        console.log(err)
    }
}
export function transferControlDeclined(data: WSControlTransferResponse, webSocketManager: WebSocketManager, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt && data.identifier){
            controlLock.transferControlDeclined(data.jwt, data.identifier, webSocketManager)
        } else {
        }
    } catch(err: any){
        console.log(err)
    }
}
export function unlock(data: WSJwtMessage, webSocketManager: WebSocketManager, controlLock: ControlLock, server: Server, socketId: string) {
    try { 
        if (data.jwt){
            const releaseMessage = controlLock.releaseControl(data.jwt)
            console.log(releaseMessage)
            webSocketManager.emitMessage(socketId,"WSLockReleaseResponse", releaseMessage)
        }
    } catch(err: any){
        console.log(err)
    }
}
export function feedWatchdog(data: WSJwtMessage, webSocketManager: WebSocketManager, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt){
            controlLock.feedWatchdog(data.jwt)
        }
    } catch(err: any){
        console.log(err)
    }
}
export function select(data: WSSelectRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlLock.verify(data.jwt);
            if(isController){
                controlSocket.emit("select", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}
export function shift(data: WSShifttRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlLock.verify(data.jwt);
            if(isController){
                controlSocket.emit("shift", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}
export function throttle(data: WSThrottleRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlLock.verify(data.jwt);
            if(isController){
                controlSocket.emit("throttle", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}
export function steer(data: WSSteeringRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlLock: ControlLock, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlLock.verify(data.jwt);
            if(isController){
                controlSocket.emit("steer", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}

// function that handles API calls
export function processMessage(msgString: string, webSocketManager: WebSocketManager, ws: WebSocket, controlSocket: ControlSocket, controlLock: ControlLock){
    const msg: WSAPIMessage = JSON.parse(msgString);
    if (msg){
        //TODO: lock release feedback
        let api = msg.api;
        console.log(msg.api)
        // if (api === "lock") {
        //     if(msg.data){
        //         if (msg.data.secretKey) {
        //             controlLock.takeControl(msg.data.secretKey, webSocketManager, ws)
        //             .then((jwtMsg) => {
        //                 console.log(jwtMsg)
        //                  ws.send(JSON.stringify(jwtMsg));
        //                 }
        //             )
        //         }
        //     }
        // }
        // if(api === "requestControlTransfer") {
        //     if(msg.data){
        //         console.log(msg.data)
        //         if (msg.data.name) {
        //             controlLock.requestControlTransfer(webSocketManager, msg.data.secretKey, msg.data.name, ws)
        //         }
        //     }
        // }
        // if(api === "transferControl") {
        //     if(msg.data){
        //         if(msg.data.jwt && msg.data.identifier) {
        //             controlLock.transferControlTransfer(msg.data.jwt, msg.data.identifier, webSocketManager)
        //         } else {
        //             ws.send(JSON.stringify({
        //                     jwt: "", // 
        //                     success: false,
        //                     interfaceType: "WSJwtReply"
        //             }));
        //         }
        //     }
        // }
        // if (api === "unlock") {
        //     if(msg.data){
        //         console.log(msg)
        //         if (msg.data.jwt){
        //             const releaseMessage = controlLock.releaseControl(msg.data.jwt)
        //             console.log(releaseMessage)
        //             ws.send(JSON.stringify(releaseMessage))
        //         }
        //     }
        // }
        // if (api === "feedWatchdog") {
        //     if(msg.data){
        //         if (msg.data.jwt){
        //             controlLock.feedWatchdog(msg.data.jwt)
        //             //console.log(releaseMessage)
        //             //ws.send(JSON.stringify(releaseMessage))
        //         }
        //     }
        // }
        // if (api === "select") {
        //     if(msg.data){
        //         if (msg.data.jwt && msg.data.instruction){
        //             const isController = controlLock.verify(msg.data.jwt);
        //             if(isController){
        //                 controlSocket.emit("select", msg.data.instruction)
        //             }
        //         }
        //     }
        // }
        // if (api === "shift") {
        //     if(msg.data){
        //         if (msg.data.jwt && msg.data.instruction){
        //             const isController = controlLock.verify(msg.data.jwt);
        //             if(isController){
        //                 controlSocket.emit("shift", msg.data.instruction)
        //             }
        //         }
        //     }
        // }
        // if (api === "throttle") {
        //     console.log("throttle")
        //     if(msg.data){
        //         if (msg.data.jwt && msg.data.instruction){
        //             const isController = controlLock.verify(msg.data.jwt);
        //             if(isController){
        //                 console.log("emit throttle")
        //                 controlSocket.emit("throttle", msg.data.instruction)
        //             }
        //         }
        //     }
        // }
        // if (api === "steer") {
        //     if(msg.data){
        //         if (msg.data.jwt && msg.data.instruction){
        //             const isController = controlLock.verify(msg.data.jwt);
        //             if(isController){
        //                 controlSocket.emit("steer", msg.data.instruction)
        //             }
        //         }
        //     }
        // }
    } else {
        ws.send({success: false, interfaceType: "error"})
    }
}