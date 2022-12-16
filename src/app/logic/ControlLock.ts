import { Server } from 'socket.io';
import { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import generator from 'generate-password-ts';
import bcrypt from 'bcrypt';
import { Watchdog } from 'watchdog'
import { Queue } from 'queue-typescript';
import { ControlTransferObject } from '../models/Interfaces';
import { WSControlTransferResponse } from '../models/WSMessageInterfaces';
import { WebSocketManager } from '../models/WebSocketManager';
import * as WebSocket from 'ws';
import { WSConnection } from '../models/WSConnection';

export class ControlLock {
    isLocked: boolean = false;
    controllerToken: string | undefined = '';
    private saltRounds = 9;
    private password = "";
    private secretKey = "";
    private dog: Watchdog |undefined;
    private requesters: ControlTransferObject[] = [];
    private currentController!: WSConnection;

    async takeControl(secretKey: string, webSocketManager: WebSocketManager, socketId: string, force?: boolean) {
        let success: boolean = false;
        if (this.isLocked == false || force === true) {
            this.isLocked = true;
            const controller: WSConnection | undefined = webSocketManager.findClientBySocketId(socketId);
            console.log("controller is now: ", controller)
            if(controller) {
                const oldController = webSocketManager.findCurrentController();
                if(oldController) {
                    oldController.hasControl = false;
                }
                controller.hasControl = true;
                this.currentController = controller;
            } else{
                success = false;
            }
            this.password = generator.generate({
                length: 20,
                numbers: true,
                symbols: true
            });
            this.password = await bcrypt.hash(this.password, this.saltRounds);
            this.controllerToken = jwt.sign(this.password, secretKey);
            this.secretKey = secretKey;
            success = true;
            // check if old watchdog messes around with new one
            if(this.dog) {
                this.dog.removeAllListeners()
                this.dog = undefined;
            }
            this.dog = new Watchdog(2200) // 2.2 sec
            this.dog.on('reset', () => { this.dog!.sleep(); })
            this.dog.on('feed', () => { })
            this.dog.on('sleep', () => {
                this.isLocked = false;
                this.controllerToken = undefined;
            })
            this.dog.feed({
                data:    'delicious',
                timeout: 2200,
            })
            this.watchDogPoll(webSocketManager, String(this.controllerToken));
            console.log("control assigned to: ", this.controllerToken)
            return {
                jwt: this.controllerToken, // 
                success,
                interfaceType: "WSControlAssignment"
            }
            
        } else {
            return {
                jwt: "", // 
                success,
                interfaceType: "WSControlAssignment"
            }
        }
    };

    /*
        @param name: name of the requesting user that gets displayed to the user in control
        @param secretKey: key for new jwt token generation
    */
    async requestControlTransfer(webSocketManager: WebSocketManager, secretKey: string, name: string, server: Server, socketId: string) {
        const identifier = webSocketManager.findIdentifierBySocketId(socketId);
        //console.log("incoming control request for: ", JSON.stringify(identifier));
        if(identifier) {
            let controlTransferObject: ControlTransferObject = {
                secretKey,
                name,
                identifier
            };
            this.requesters.push(controlTransferObject);
            if(this.currentController){
                console.log("request from to: ", socketId)
                console.log("request going to: ", this.currentController.socketId)
                const data = {
                    success: true,
                    name,
                    identifier,
                    interfaceType: "WSRequestControlTransferToClient"
                }
                webSocketManager.emitMessage(this.currentController.socketId, "WSRequestControlTransferToClient", data);
            } else{
                const data = {
                    success: false,
                    name,
                    undefined,
                    interfaceType: "WSRequestControlTransferToClient"
                }
                webSocketManager.emitMessage(socketId, "WSRequestControlTransferToClient", data);
            }
        } else {
            const data = {
                success: false,
                errorMessage: "couldn't identify socket",
                interfaceType: "WSErrorResponse"
            }
            webSocketManager.emitMessage(socketId, "WSErrorResponse", data);
        }
    }

    transferControlTransfer(jwt: string, identifier: string, webSocketManager: WebSocketManager) {
        let newController: ControlTransferObject | undefined = this.requesters.find(requester => requester.identifier === identifier)
        const client = webSocketManager.findClientByIdentifier(identifier);
        if (newController && client) {
            console.log("give control to: ", newController)
            console.log("give control to client: ", client)
            this.takeControl(newController.secretKey, webSocketManager, client.socketId, true).then((jwtMsg) => {
                console.log(jwtMsg)
                this.requesters = [];
                webSocketManager.emitMessage(this.currentController.socketId, "WSControlAssignment", jwtMsg);
                }
            )
        }
    }

    transferControlDeclined(jwt: string, identifier: string, webSocketManager: WebSocketManager) {
        let declinedClient: ControlTransferObject | undefined = this.requesters.find(requester => requester.identifier === identifier)
        if(declinedClient) {
            const index = this.requesters.indexOf(declinedClient, 0);
            if (index > -1) {
                this.requesters.splice(index, 1);
            }
        }
    }

    watchDogPoll(webSocketManager: WebSocketManager, controllerToken: string){
        if(this.controllerToken === controllerToken){
            this.requestDogFood(this.currentController.socketId, webSocketManager)
            console.log("controller is currently:", controllerToken)
            setTimeout(() => {
                this.watchDogPoll(webSocketManager, controllerToken)
            }, 1000);
        } 
    }

    requestDogFood(socketId: string, webSocketManager: WebSocketManager) : any{
        webSocketManager.emitMessage(socketId, "WSFeedDogRequest", {
            interfaceType: "WSFeedDogRequest"
        })
    }

    feedWatchdog(clientToken: string){
        let success: boolean = false;
        try {
            console.log("requesters: ", this.requesters.length)
            console.log("clientToken", clientToken)
            console.log("this.controllerToken", this.controllerToken)
            if(clientToken == this.controllerToken){
                console.log("surebru2")
                var decoded = jwt.verify(clientToken, this.secretKey);
                success = true;
                this.dog?.feed({
                    data:    'delicious',
                    timeout: 2200,
                  })
                // console.log(decoded)
            } else {
                console.log("client: is not allowed to feed: ", clientToken)
                console.log("only allowed client is:  ", this.controllerToken)
            }
        } catch(err) {
            console.log(err)
        }
    }

    releaseControl(clientToken: string) {
        let success: boolean = false;
        console.log("request from to: ", clientToken)
        try {
            var decoded = jwt.verify(clientToken, this.secretKey);
            this.isLocked = false;
            success = true;
            this.dog?.sleep();
            console.log(decoded)
        } catch(err) {
            console.log(err)
        }
        return {
            success,
            interfaceType: "WSLockReleaseResponse"
        }
    }

    verify(clientToken: string) {
        try {
            var decoded = jwt.verify(clientToken, this.secretKey);
            return true;
        } catch(err) {
            console.log(err)
            return false;
        }
    }




}