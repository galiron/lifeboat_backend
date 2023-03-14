import { WSConnection } from "../models/WSConnection";
import { ClientWebSocketManager } from "../WebSockets/ClientWebSocketManager";

export function requestIsAllowed(webSocketManager: ClientWebSocketManager, currentController: WSConnection | undefined, controllerToken: string | undefined, jwtToken: string) : boolean {
    if(currentController?.socketId) {
        return controllerToken === jwtToken && currentController.socketId === webSocketManager.findCurrentController()?.socketId
    } else {
        return false
    }
}

