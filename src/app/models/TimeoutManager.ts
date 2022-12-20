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
    controllerToken$: Subject<string | undefined> = new Subject();
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
            this.controllerToken$.next(undefined);
        })
        this.dog.feed({
            data:    'delicious',
            timeout: 2200,
        })
        this.watchDogPoll(webSocketManager, initializedToken, controlLock);
    }

    setupVigilanceControl() {
        if(this.vigilanceControl) {
            this.vigilanceControl.removeAllListeners()
            this.vigilanceControl = undefined;
        }
        this.vigilanceControl = new Watchdog(3000) // 30sec
        this.vigilanceControl.on('reset', () => { 
            this.vigilanceControl?.sleep(); 
            this.dog?.sleep(); })
        this.vigilanceControl.on('feed', () => { })
        this.vigilanceControl.on('sleep', () => {
            this.isLocked$.next(false);
            this.controllerToken$.next(undefined);
            console.log("control released, due to inactivity")
        })
        this.vigilanceControl.feed({
            data:    'delicious',
            timeout: 30000,
        })
    }    

    watchDogPoll(webSocketManager: WebSocketManager, initializedToken: string, controlLock: ControlLock){
        if(requestIsAllowed(webSocketManager, controlLock.getCurrentController(), controlLock.getControllerToken(), initializedToken)){
            this.requestDogFood(controlLock.getCurrentController().socketId, webSocketManager)
            setTimeout(() => {
                this.watchDogPoll(webSocketManager, initializedToken, controlLock)
            }, 1000);
        } 
    }

    requestDogFood(socketId: string, webSocketManager: WebSocketManager) : any{
        webSocketManager.emitMessage(socketId, "WSFeedDogRequest", {
            interfaceType: "WSFeedDogRequest"
        })
    }

    private feedTimer(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock, watchdog: Watchdog | undefined, timeoutTime: number){
        let success: boolean = false;
        try {
            if(requestIsAllowed(webSocketManager, controlLock.getCurrentController(), controlLock.getControllerToken(), clientToken)) {
                var decoded = jwt.verify(clientToken, controlLock.getSecretKey());
                success = true;
                watchdog?.feed({
                    data:    'delicious',
                    timeout: timeoutTime,
                  })
                // console.log(decoded)
            } else {
                console.log("client: is not allowed to feed: ", clientToken)
                console.log("only allowed client is:  ", controlLock.getControllerToken())
            }
        } catch(err) {
            console.log(err)
        }
    }

    feedWatchdog(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock){
        this.feedTimer(webSocketManager, clientToken, controlLock, this.dog, 2200);
    }

    feedVigilanceControl(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock) {
        this.feedTimer(webSocketManager, clientToken, controlLock, this.vigilanceControl, 30000);
    }

  }