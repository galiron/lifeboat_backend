import { Subject } from "rxjs/internal/Subject";
import Watchdog from "watchdog";
import { requestIsAllowed } from "../utils/helpers";
import { WebSocketManager } from "./WebSocketManager";
import { WSConnection } from "./WSConnection";
import jwt from 'jsonwebtoken';
import { ControlLock } from "../logic/ControlLock";

export class TimeoutManager {
    dog: Watchdog | undefined;
    vigilanceControl: Watchdog | undefined;
    isLocked$: Subject<boolean> = new Subject();
    controllerToken$: Subject<string | undefined> = new Subject();
    constructor() {
    }

    setupWatchdog() {
        if(this.dog) {
            this.dog.removeAllListeners()
            this.dog = undefined;
        }
        this.dog = new Watchdog(2200) // 2.2 sec
        this.dog.on('reset', () => { this.dog!.sleep(); })
        this.dog.on('feed', () => { })
        this.dog.on('sleep', () => {
            this.isLocked$.next(false);
            this.controllerToken$.next(undefined);
        })
        this.dog.feed({
            data:    'delicious',
            timeout: 2200,
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

    feedWatchdog(webSocketManager: WebSocketManager, clientToken: string, controlLock: ControlLock){
        let success: boolean = false;
        try {
            if(requestIsAllowed(webSocketManager, controlLock.getCurrentController(), controlLock.getControllerToken(), clientToken)) {
                var decoded = jwt.verify(clientToken, controlLock.getSecretKey());
                success = true;
                this.dog?.feed({
                    data:    'delicious',
                    timeout: 2200,
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

  }