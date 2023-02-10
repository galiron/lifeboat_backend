import { WebSocketManager } from "../models/WebSocketManager";
import { WSConnection } from "../models/WSConnection";
import jwt from 'jsonwebtoken';

export function requestIsAllowed(webSocketManager: WebSocketManager, currentController: WSConnection | undefined, controllerToken: string | undefined, jwtToken: string) : boolean {
    console.log("controllerToken: ", controllerToken);
    console.log("jwtToken: ", jwtToken);
    console.log("currentController: ", currentController);
    console.log("webSocketManager.findCurrentController(): ", webSocketManager.findCurrentController());
    if(currentController?.socketId) {
        return controllerToken === jwtToken && currentController.socketId === webSocketManager.findCurrentController()?.socketId
    } else {
        return false
    }
}

