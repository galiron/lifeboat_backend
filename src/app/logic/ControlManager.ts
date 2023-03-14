import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import generator from 'generate-password-ts';
import bcrypt from 'bcrypt';
import { CameraData, ControlTransferObject } from '../models/Interfaces';
import { ClientWebSocketManager } from '../WebSockets/ClientWebSocketManager';
import { WSConnection } from '../models/wsConnection';
import { TimeoutManager } from './TimeoutManager';
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
    private cameraData : Array<CameraData> = new Array<CameraData>;
    private data = fs.readFileSync("./src/app/config.json", "utf-8")
    constructor(){
        this.timeoutManager.isLocked$.subscribe((isLocked: boolean) => {
            this.isLocked = isLocked;
        });
        this.timeoutManager.revokeControllerRights$.subscribe(() => {
            this.currentController.jwt = undefined;
            this.currentController.hasControl = false;
        });

        for(let user of JSON.parse(this.data).users){
            this.users.push(user)
        }
        for(let camera of JSON.parse(this.data).cameras){
            this.cameraData.push(camera)
        }
    }

    resetRequesters() : void {
        this.requesters = []
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

    async takeControl(name: string, password: string, webSocketManager: ClientWebSocketManager, socketId: string | undefined, force?: boolean) {
        let success: boolean = false;
        const isAuthorized = this.verifyUser(name, password)
        if ((this.isLocked == false || force === true) && isAuthorized) {
            this.isLocked = true;
            let controller: WSConnection | undefined = webSocketManager.findClientBySocketId(socketId);
            console.log("controller is now: ", controller)
            if(controller) {
                const oldController = webSocketManager.findCurrentController();
                if(oldController) {
                    oldController.hasControl = false;
                }
                controller.hasControl = true;
                this.currentController = controller;
            } else{
                return {
                    jwt: "",
                    success  : false,
                    cameraData: this.cameraData,
                    isAuthorized : isAuthorized,
                    interfaceType: "WSControlAssignment"
                }
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
            this.timeoutManager.setupWatchdog(webSocketManager, String(this.currentController.jwt), this);
            this.timeoutManager.setupVigilanceControl(webSocketManager);
            return {
                jwt: this.currentController.jwt,
                success,
                cameraData: this.cameraData,
                isAuthorized : isAuthorized,
                interfaceType: "WSControlAssignment"
            }
            
        } else {
            return {
                jwt: "", // 
                success,
                cameraData: this.cameraData,
                isAuthorized : isAuthorized,
                interfaceType: "WSControlAssignment"
            }
        }
    };


    async requestControlTransfer(webSocketManager: ClientWebSocketManager, password: string, name: string, server: Server, socketId: string) {
        const identifier = webSocketManager.findIdentifierBySocketId(socketId);
        if(identifier && this.verifyUser(name, password)) {
            let controlTransferObject: ControlTransferObject = {
                "password":password,
                "username":name,
                identifier
            };
            if(!this.requesters.find(( entry ) => entry.identifier == controlTransferObject.identifier)){
                this.requesters.push(controlTransferObject);
                if(this.currentController){
                    const data = {
                        success: true,
                        username: name,
                        identifier,
                        interfaceType: "WSRequestControlTransferToClient"
                    }
                    webSocketManager.emitMessage(this.currentController.socketId, "WSRequestControlTransferToClient", data);
                } else{
                    const data = {
                        success: false,
                        username: name,
                        undefined,
                        interfaceType: "WSRequestControlTransferToClient"
                    }
                    webSocketManager.emitMessage(socketId, "WSRequestControlTransferToClient", data);
                }
            } else{
                const data = {
                    success: false,
                    errorMessage: "already queued a request",
                    interfaceType: "WSErrorResponse"
                }
                webSocketManager.emitMessage(socketId, "WSErrorResponse", data);
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

    async transferControl(jwt: string, identifier: string, webSocketManager: ClientWebSocketManager) {
        let newController: ControlTransferObject | undefined = this.requesters.find(requester => requester.identifier === identifier)
        const client = webSocketManager.findClientByIdentifier(identifier);
        if (newController && client) {
            const isAllowed = requestIsAllowed(webSocketManager,webSocketManager.findCurrentController(), this.getControllerToken(), jwt)
            if(isAllowed){
                webSocketManager.emitMessage(this.currentController.socketId, "WSLockReleaseResponse", this.releaseControl(jwt, true));
                return new Promise((resolve, reject) => { 
                    if (newController && client) {
                        this.takeControl(newController.username, newController.password, webSocketManager, client.socketId, true).then((jwtMsg) => {
                            console.log(jwtMsg)
                            this.requesters = [];
                            webSocketManager.emitMessage(this.currentController.socketId, "WSControlAssignment", jwtMsg);
                            resolve(jwtMsg)
                            }
                        )
                    } else {
                        reject("missing controller or client")
                    }
                });
            }
        } else {
            console.log("error")
        }
    }

    transferControlDeclined(jwt: string, identifier: string, webSocketManager: ClientWebSocketManager) {
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
        try {
            if(!keepLock){
                console.log("unlocking")
                this.isLocked = false;
            } else{
                console.log("keeping lock")
            }
            success = true;
            this.timeoutManager.dog?.sleep();
            this.requesters = [];
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
            if (entry.name === userToCheck.name && entry.password === userToCheck.password) {
                return true
            } else{
            }
        }
        return false
    }
}