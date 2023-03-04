import { Server } from 'socket.io';
import { CanBusWebSocket } from '../WebSockets/CanBusWebSocket';
import { WSControlTransferResponse, WSJwtMessage, WSLockReleaseResponse, WSLockRequest, WSRequestControlTransferToBackend, WSSelectRequest, WSShifttRequest, WSSteeringRequest, WSThrottleRequest, WSVigilanceFeedResponse } from "../models/WSMessageInterfaces";
import { ControlManager } from "./ControlManager";
import { ClientWebSocketManager } from '../WebSockets/ClientWebSocketManager';
import { requestIsAllowed } from '../utils/helpers';

export function lock(data: WSLockRequest, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, socketId: string){
    try {
        if (data.password) {
            controlManager.takeControl(data.username, data.password, webSocketManager, socketId)
            .then((jwtMsg) => {
                console.log(jwtMsg)
                webSocketManager.emitMessage(socketId, "WSControlAssignment", jwtMsg);
                }
            )
        } else {
            throw new Error("Missing fields in lock request, data is " + JSON.stringify(data))
        }
        
    } catch(err: any){
        console.log(err)
    }
}
export function requestControlTransfer(data: WSRequestControlTransferToBackend, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, server: Server, socketId: string){
    try {
        if (data.username && data.password) {
            if(!(webSocketManager.findCurrentController()?.socketId === socketId)){
                if(webSocketManager.findCurrentController()?.hasControl === true){
                    controlManager.requestControlTransfer(webSocketManager, data.password, data.username, server, socketId)
                } else {
                    controlManager.takeControl(data.username, data.password, webSocketManager, socketId)
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
            throw new Error("Missing fields in requestControlTransfer request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function transferControl(data: WSControlTransferResponse, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
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
export function transferControlDeclined(data: WSControlTransferResponse, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.identifier){
            controlManager.transferControlDeclined(data.jwt, data.identifier, webSocketManager)
        } else {
            throw new Error("Missing fields in transferControlDeclined request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function unlock(data: WSJwtMessage, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try { 
        if (data.jwt){
            const releaseMessage = controlManager.releaseControl(data.jwt)
            console.log(releaseMessage)
            webSocketManager.emitMessage(socketId,"WSLockReleaseResponse", releaseMessage)
        } else {
            throw new Error("Missing fields in unlock request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function feedWatchdog(data: WSJwtMessage, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt){
            controlManager.getTimeoutManager().feedWatchdog(webSocketManager, data.jwt, controlManager).catch((err) => {
                console.log(err);
            })
        } else {
            throw new Error("Missing fields in feedWatchdog request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function feedVigilanceControl(data: WSJwtMessage, webSocketManager: ClientWebSocketManager, controlManager: ControlManager, server: Server, socketId: string) {
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
        } else {
            throw new Error("Missing fields in feedVigilanceControl request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function select(data: WSSelectRequest, webSocketManager: ClientWebSocketManager, controlSocket: CanBusWebSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isAllowed = requestIsAllowed(webSocketManager,webSocketManager.findCurrentController(), controlManager.getControllerToken(), data.jwt)
            if(isAllowed){
                controlSocket.emit("select", data.instruction)
            }
        } else {
            throw new Error("Missing fields in select request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function shift(data: WSShifttRequest, webSocketManager: ClientWebSocketManager, controlSocket: CanBusWebSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isAllowed = requestIsAllowed(webSocketManager,webSocketManager.findCurrentController(), controlManager.getControllerToken(), data.jwt)
            if(isAllowed){
                controlSocket.emit("shift", data.instruction)
            }
        } else {
           throw new Error("Missing fields in shift request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function throttle(data: WSThrottleRequest, webSocketManager: ClientWebSocketManager, controlSocket: CanBusWebSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isAllowed = requestIsAllowed(webSocketManager,webSocketManager.findCurrentController(), controlManager.getControllerToken(), data.jwt)
            if(isAllowed){
                controlSocket.emit("throttle", data.instruction)
            }
        } else {
            throw new Error("Missing fields in throttle request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}
export function steer(data: WSSteeringRequest, webSocketManager: ClientWebSocketManager, controlSocket: CanBusWebSocket, controlManager: ControlManager, server: Server, socketId: string) {
    try {
        if (data.jwt && data.instruction){
            const isAllowed = requestIsAllowed(webSocketManager,webSocketManager.findCurrentController(), controlManager.getControllerToken(), data.jwt)
            if(isAllowed){
                controlSocket.emit("steer", data.instruction)
            }
        } else {
            throw new Error("Missing fields in steer request, data is " + JSON.stringify(data))
        }
    } catch(err: any){
        console.log(err)
    }
}