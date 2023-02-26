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
import { TimeoutManager } from '../models/TimeoutManager';
import { requestIsAllowed } from '../utils/helpers';
import * as fs from 'fs'

export class ControlManager {
    isLocked: boolean = false;
    private saltRounds = 9;
    private password = "";
    private secretKey = "";
    private timeoutManager = new TimeoutManager();
    private requesters: ControlTransferObject[] = [];
    private currentController!: WSConnection;
    private users : Array<{"name": string,"password" : string}> = new Array<{"name": string,"password" : string}>;
    private data = fs.readFileSync("./src/app/logic/users.json", "utf-8")
    constructor(){
        this.timeoutManager.isLocked$.subscribe((isLocked: boolean) => {
            this.isLocked = isLocked;
        });
        this.timeoutManager.revokeControllerRights$.subscribe(() => {
            this.currentController.jwt = undefined;
            this.currentController.hasControl = false;
        });

        for(let user of JSON.parse(this.data).users){
            console.log("user: ", user)
            this.users.push(user)
        }
    }

    getControllerToken(): string{
        return String(this.currentController?.jwt);
    }
    

    getSecretKey(){
        return String(this.secretKey)
    }

    getTimeoutManager(): TimeoutManager{
        return this.timeoutManager
    }

    async takeControl(name: string, password: string, webSocketManager: WebSocketManager, socketId: string | undefined, force?: boolean) {
        let success: boolean = false;
        if ((this.isLocked == false || force === true) && this.verifyUser(name, password)) {
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
            this.currentController.jwt = jwt.sign(this.password, password);
            this.secretKey = password;
            success = true;
            // check if old watchdog messes around with new one
            this.timeoutManager.setupWatchdog(webSocketManager, String(this.currentController.jwt), this);
            this.timeoutManager.setupVigilanceControl(webSocketManager);
            console.log("control assigned to: ", this.currentController.jwt)
            return {
                jwt: this.currentController.jwt, // 
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
        if(identifier) {
            let controlTransferObject: ControlTransferObject = {
                "password":secretKey,
                "username":name,
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

    transferControl(jwt: string, identifier: string, webSocketManager: WebSocketManager) {
        let newController: ControlTransferObject | undefined = this.requesters.find(requester => requester.identifier === identifier)
        const client = webSocketManager.findClientByIdentifier(identifier);
        if (newController && client) {
            console.log("give control to: ", newController)
            console.log("give control to client: ", client)
            const isAllowed = requestIsAllowed(webSocketManager,webSocketManager.findCurrentController(), this.getControllerToken(), jwt)
            if(isAllowed){
                webSocketManager.emitMessage(this.currentController.socketId, "WSLockReleaseResponse", this.releaseControl(jwt, true));
                this.takeControl(newController.username, newController.password, webSocketManager, client.socketId, true).then((jwtMsg) => {
                    console.log(jwtMsg)
                    this.requesters = [];
                    webSocketManager.emitMessage(this.currentController.socketId, "WSControlAssignment", jwtMsg);
                    }
                )
            }
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

    releaseControl(clientToken: string, keepLock?: boolean) {
        let success: boolean = false;
        console.log("request from to: ", clientToken)
        try {
            if(!keepLock){
                console.log("unlocking")
                this.isLocked = false;
            } else{
                console.log("keeping lock")
            }
            success = true;
            this.timeoutManager.dog?.sleep();
        } catch(err) {
            console.log(err)
        }
        return {
            success,
            interfaceType: "WSLockReleaseResponse"
        }
    }

    verifyUser(name: string, password: string) : boolean {
        let userToCheck : {"name": string,"password" : string} = {"name": name,"password": password}
        for (let entry of this.users){
            console.log("entry: ", entry);
            console.log(" equals user: ", userToCheck);
            if (entry.name === userToCheck.name && entry.password === userToCheck.password) {
                console.log(" = true");
                return true
            } else{
                console.log(" = false");
            }
        }
        return false
    }
}