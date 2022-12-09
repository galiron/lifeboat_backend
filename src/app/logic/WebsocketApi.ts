import { ControlSocket } from './ControllsSocket';
import { WSMessage } from "../models/wsMessage";
import { ControlLock } from "./ControlLock";
import * as WebSocket from 'ws';

// function that handles API calls
export function processMessage(msgString: string, ws: WebSocket, controlSocket: ControlSocket, controlLock: ControlLock){
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
}