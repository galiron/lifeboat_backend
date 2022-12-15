import { ControlSocket } from '../models/ControllsSocket';
import { WSAPIMessage } from "../models/WSMessageInterfaces";
import { ControlLock } from "./ControlLock";
import * as WebSocket from 'ws';
import { WebSocketManager } from '../models/WebSocketManager';

// function that handles API calls
export function processMessage(msgString: string, webSocketManager: WebSocketManager, ws: WebSocket, controlSocket: ControlSocket, controlLock: ControlLock){
    const msg: WSAPIMessage = JSON.parse(msgString);
    if (msg){
        //TODO: lock release feedback
        let api = msg.api;
        console.log(msg.api)
        if (api === "lock") {
            if(msg.data){
                if (msg.data.secretKey) {
                    controlLock.takeControl(msg.data.secretKey, webSocketManager, ws)
                    .then((jwtMsg) => {
                        console.log(jwtMsg)
                         ws.send(JSON.stringify(jwtMsg));
                        }
                    )
                }
            }
        }
        if(api === "requestControlTransfer") {
            if(msg.data){
                console.log(msg.data)
                if (msg.data.name) {
                    controlLock.requestControlTransfer(webSocketManager, msg.data.secretKey, msg.data.name, ws)
                }
            }
        }
        if(api === "transferControl") {
            if(msg.data){
                if(msg.data.jwt && msg.data.identifier) {
                    controlLock.transferControlTransfer(msg.data.jwt, msg.data.identifier, webSocketManager)
                } else {
                    ws.send(JSON.stringify({
                            jwt: "", // 
                            success: false,
                            interfaceType: "WSJwtReply"
                    }));
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
}