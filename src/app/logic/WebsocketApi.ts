import { Instruction } from './../models/Interfaces';
import { Server } from 'socket.io';
import { ControlSocket } from '../models/ControllsSocket';
import { messageIsOfInterface, WSAPIMessage, WSControlTransferResponse, WSJwtMessage, WSLockReleaseResponse, WSLockRequest, WSRequestControlTransferToBackend, WSSelectRequest, WSShifttRequest, WSSteeringRequest, WSThrottleRequest, WSVigilanceFeedResponse } from "../models/WSMessageInterfaces";
import { ControlManager } from "./ControlManager";
import * as WebSocket from 'ws';
import { WebSocketManager } from '../models/WebSocketManager';
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export function lock(data: WSLockRequest, webSocketManager: WebSocketManager, controlManager: ControlManager, socketId: string){
    try {
        if (data.secretKey) {
            controlManager.takeControl(data.secretKey, webSocketManager, socketId)
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
export function requestControlTransfer(data: WSRequestControlTransferToBackend, webSocketManager: WebSocketManager, controlManager: ControlManager, server: Server, socketId: string){
    try {
        if (data.name && data.secretKey) {
            if(!(webSocketManager.findCurrentController()?.socketId === socketId)){
                if(webSocketManager.findCurrentController()?.hasControl === true){
                    controlManager.requestControlTransfer(webSocketManager, data.secretKey, data.name, server, socketId)
                } else {
                    controlManager.takeControl(data.secretKey, webSocketManager, socketId)
                    .then((jwtMsg) => {
                        console.log(jwtMsg)
                        webSocketManager.emitMessage(socketId, "WSControlAssignment", jwtMsg);
                        }
                    )       
                }
            } else {
                console.log("error: requester is already in control ")
            }
        } else {
            console.log("data expected format of WSControlTransferResponse, found data is: ", data)
        }
    } catch(err: any){
        console.log(err)
    }
}
export function transferControl(data: WSControlTransferResponse, webSocketManager: WebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.identifier){
            controlManager.transferControl(data.jwt, data.identifier, webSocketManager)
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
export function transferControlDeclined(data: WSControlTransferResponse, webSocketManager: WebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.identifier){
            controlManager.transferControlDeclined(data.jwt, data.identifier, webSocketManager)
        } else {
        }
    } catch(err: any){
        console.log(err)
    }
}
export function unlock(data: WSJwtMessage, webSocketManager: WebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try { 
        if (data.jwt){
            const releaseMessage = controlManager.releaseControl(data.jwt)
            console.log(releaseMessage)
            webSocketManager.emitMessage(socketId,"WSLockReleaseResponse", releaseMessage)
        }
    } catch(err: any){
        console.log(err)
    }
}
export function feedWatchdog(data: WSJwtMessage, webSocketManager: WebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt){
            controlManager.getTimeoutManager().feedWatchdog(webSocketManager, data.jwt, controlManager).catch((err) => {
                console.log(err);
            })
        } else {
            throw new Error("Missing jwt in feedWatchdog request")
        }
    } catch(err: any){
        console.log(err)
    }
}
export function feedVigilanceControl(data: WSJwtMessage, webSocketManager: WebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt){
            controlManager.getTimeoutManager().feedVigilanceControl(webSocketManager, data.jwt, controlManager).then(() => {
                let responseData: WSVigilanceFeedResponse = {
                    success: true,
                    interfaceType: "WSVigilanceFeedResponse"
                }
                webSocketManager.emitMessage(socketId, "WSVigilanceFeedResponse", responseData);
            }).catch((err) => {
                console.log(err);
            })
        }
    } catch(err: any){
        console.log(err)
    }
}
export function select(data: WSSelectRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlManager.verify(data.jwt);
            if(isController){
                controlSocket.emit("select", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}
export function shift(data: WSShifttRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlManager.verify(data.jwt);
            if(isController){
                controlSocket.emit("shift", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}
export function throttle(data: WSThrottleRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlManager.verify(data.jwt);
            if(isController){
                controlSocket.emit("throttle", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}
export function steer(data: WSSteeringRequest, webSocketManager: WebSocketManager,controlSocket: ControlSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isController = controlManager.verify(data.jwt);
            if(isController){
                controlSocket.emit("steer", data.instruction)
            }
        }
    } catch(err: any){
        console.log(err)
    }
}