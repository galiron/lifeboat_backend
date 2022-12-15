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
    controllerToken = '';
    private saltRounds = 9;
    private password = "";
    private secretKey = "";
    private dog!: Watchdog;
    private watchDogSleep: boolean = false;
    private requesters: ControlTransferObject[] = [];
    private currentController!: WSConnection;

    async takeControl(secretKey: string, webSocketManager: WebSocketManager, socket: any, force?: boolean) {
        let success: boolean = false;
        if (this.isLocked == false || force === true) {
            this.isLocked = true;
            const controller = webSocketManager.findClientBySocket(socket);
            const oldController = webSocketManager.findCurrentController();
            if(controller) {
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
            this.dog = new Watchdog(2200) // 2.2 sec
            this.dog.on('reset', () => { this.dog.sleep() })
            this.dog.on('feed', () => {})
            this.dog.on('sleep', () => {
                this.watchDogSleep = true;
                this.isLocked = false;
                socket.send(JSON.stringify({
                    success: true,
                    interfaceType: "WSConnectionTerminated"
                }));
            })
            this.dog.feed({
                data:    'delicious',
                timeout: 2200,
              })
              this.watchDogSleep = false;
            this.watchDogPoll(socket);
            return {
                jwt: this.controllerToken, // 
                success,
                interfaceType: "WSJwtReply"
            }
            
        } else {
            return {
                jwt: "", // 
                success,
                interfaceType: "WSJwtReply"
            }
        }
    };

    /*
        @param name: name of the requesting user that gets displayed to the user in control
        @param secretKey: key for new jwt token generation
    */
    async requestControlTransfer(webSocketManager: WebSocketManager, secretKey: string, name: string, socket: WebSocket) {
        const identifier = webSocketManager.findIdentifierBySocket(socket);
        console.log("incoming control request for: ", JSON.stringify(identifier));
        if(identifier) {
            let controlTransferObject: ControlTransferObject = {
                secretKey,
                name,
                identifier
            };
            this.requesters.push(controlTransferObject);
            if(this.currentController){
                this.currentController.socket.send(JSON.stringify({
                    success: true,
                    name,
                    identifier,
                    interfaceType: "WSRequestControlTransferToClient"
                }));
            } else{
                socket.send(JSON.stringify({
                    success: false,
                    name,
                    undefined,
                    interfaceType: "WSRequestControlTransferToClient"
                }))
            }
        } else {
            socket.send(JSON.stringify({
                success: false,
                name,
                undefined,
                interfaceType: "WSRequestControlTransferToClient"
            }))
        }
    }

    transferControlTransfer(jwt: string, identifier: string, webSocketManager: WebSocketManager) {
        let newController: ControlTransferObject | undefined = this.requesters.find(requester => requester.identifier === identifier)
        const client = webSocketManager.findClientByIdentifier(identifier);
        if (newController && client) {
            this.takeControl(newController.secretKey, webSocketManager, client.socket, true)
        }
    }

    watchDogPoll(socket: any){
        if(this.watchDogSleep == false){
            this.requestDogFood(socket)
            setTimeout(() => {
                this.watchDogPoll(socket)
            }, 1000);
        } 
    }

    requestDogFood(socket: any) : any{
        // socket.emit("WSFeedDogRequest", {
        //     success: true,
        //     interfaceType: "WSFeedDogRequest"
        // })
        socket.send(JSON.stringify({
            success: true,
            interfaceType: "WSFeedDogRequest"
        }))
    }

    feedWatchdog(clientToken: string){
        let success: boolean = false;
        try {
            var decoded = jwt.verify(clientToken, this.secretKey);
            success = true;
            this.dog.feed({
                data:    'delicious',
                timeout: 2200,
              })
            // console.log(decoded)
        } catch(err) {
            console.log(err)
        }
    }

    releaseControl(clientToken: string) {
        let success: boolean = false;
        try {
            var decoded = jwt.verify(clientToken, this.secretKey);
            this.isLocked = false;
            success = true;
            this.dog.sleep();
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