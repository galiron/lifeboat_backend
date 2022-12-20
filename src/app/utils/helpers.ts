import { WebSocketManager } from "../models/WebSocketManager";
import { WSConnection } from "../models/WSConnection";
import jwt from 'jsonwebtoken';

export function requestIsAllowed(webSocketManager: WebSocketManager, currentController: WSConnection, controllerToken: string | undefined, jwtToken: string){
    return controllerToken === jwtToken && currentController.socketId === webSocketManager.findCurrentController()?.socketId
}