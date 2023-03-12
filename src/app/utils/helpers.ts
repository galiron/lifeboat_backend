import { ClientWebSocketManager } from "../websockets/clientWebSocketManager";
import { WSConnection } from "../models/wsConnection";

export function requestIsAllowed(webSocketManager: ClientWebSocketManager, currentController: WSConnection | undefined, controllerToken: string | undefined, jwtToken: string) : boolean {
    if(currentController?.socketId) {
        return controllerToken === jwtToken && currentController.socketId === webSocketManager.findCurrentController()?.socketId
    } else {
        return false
    }
}

