import { Subject } from "rxjs/internal/Subject";
import Watchdog from "watchdog";
import { requestIsAllowed } from "../utils/helpers";
import { WebSocketManager } from "./WebSocketManager";
import jwt from 'jsonwebtoken';
import { ControlLock } from "../logic/ControlLock";

export class TimeoutManager {
    dog: Watchdog | undefined;
    vigilanceControl: Watchdog | undefined;
    isLocked$: Subject<boolean> = new Subject();
    revokeControllerRights$: Subject<undefined> = new Subject(); // jwt to verify if access is valid
    constructor() {
    }

    setupWatchdog(webSocketManager: WebSocketManager, initializedToken: string, controlLock: ControlLock) {
        if(this.dog) {
            this.dog.removeAllListeners()
            this.dog = undefined;
        }
        this.dog = new Watchdog(2200) // 2.2 sec
        this.dog.on('reset', () => { 
            this.dog?.sleep();
            this.vigilanceControl?.sleep();})
        this.dog.on('feed', () => { })
        this.dog.on('sleep', () => {
            this.isLocked$.next(false);
            this.revokeControllerRights$.next(undefined);
        })
        this.dog.feed({
            data:    'delicious',
            timeout: 2200,
        })
        this.watchDogPoll(webSocketManager, initializedToken, controlLock);
    }

    setupVigilanceControl(webSocketManager: WebSocketManager) {
        if(this.vigilanceControl) {
            this.vigilanceControl.removeAllListeners()
            this.vigilanceControl = undefined;
        }
        this.vigilanceControl = new Watchdog(3000)
        this.vigilanceControl.on('reset', () => { 
            this.vigilanceControl?.sleep(); 
            this.dog?.sleep(); })
        this.vigilanceControl.on('feed', () => { })
        this.vigilanceControl.on('sleep', () => {
            this.isLocked$.next(false);
            let currentController = webSocketManager.findCurrentController()
            if (currentController) {
                const releaseMessage = {
                    success: true,
                    interfaceType: "WSLockReleaseResponse"
                }
                webSocketManager.emitMessage(currentController.socketId, "WSLockReleaseResponse", releaseMessage)
            }
            this.revokeControllerRights$.next(undefined);
            console.log("control released, due to inactivity")
        })
        this.vigilanceControl.feed({
            data:    'delicious',
            timeout: 30000, // 30sec
        })
    }    

    watchDogPoll(webSocketManager: WebSocketManager, initializedToken: string, controlLock: ControlLock){
        if(requestIsAllowed(webSocketManager, webSocketManager.findCurrentController(), controlLock.getControllerToken(), initializedToken)){
            this.requestDogFood(webSocketManager.findCurrentController()?.socketId, webSocketManager)
            setTimeout(() => {
                this.watchDogPoll(webSocketManager, initializedToken, controlLock)
            }, 1000);
        }
    }

    requestDogFood(socketId: string | undefined, webSocketManager: WebSocketManager) : any{
        if (socketId) {
            webSocketManager.emitMessage(socketId, "WSFeedDogRequest", {
                interfaceType: "WSFeedDogRequest"
            })
        }
    }

    private feedTimer(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock, watchdog: Watchdog | undefined, timeoutTime: number) : Promise<any>{
        return new Promise((resolve, reject) => {
            let success: boolean = false;
            try {
                if(requestIsAllowed(webSocketManager, webSocketManager.findCurrentController(), controlLock.getControllerToken(), clientToken)) {
                    var decoded = jwt.verify(clientToken, controlLock.getSecretKey());
                    success = true;
                    watchdog?.feed({
                        data:    'delicious',
                        timeout: timeoutTime,
                      })
                    resolve("success")
                    // console.log(decoded)
                } else {
                    console.log("client: is not allowed to feed: ", clientToken)
                    console.log("only allowed client is:  ", controlLock.getControllerToken())
                    reject(new Error("not allowed to feed"))
                }
            } catch(err) {
                reject(console.log(err))
            }
        })
    }

    feedWatchdog(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock) : Promise<any> {
        return this.feedTimer(webSocketManager, clientToken, controlLock, this.dog, 2200);
    }

    feedVigilanceControl(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock) : Promise<any> {
        return this.feedTimer(webSocketManager, clientToken, controlLock, this.vigilanceControl, 30000);
    }

  }