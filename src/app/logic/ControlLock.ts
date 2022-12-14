import { Request, Response } from 'express';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import generator from 'generate-password-ts';
import bcrypt from 'bcrypt';
import { Watchdog } from 'watchdog'
import { Queue } from 'queue-typescript';
import { ControlTransferObject } from '../models/Interfaces';
import { WSControlTransferResponse } from '../models/wsInterfaces';

export class ControlLock {
    isLocked: boolean = false;
    controllerToken = '';
    private saltRounds = 9;
    private password = "";
    private secretKey = "";
    private dog!: Watchdog;
    private watchDogSleep: boolean = false;
    private requesters: ControlTransferObject[] = [];

    async takeControl(secretKey: string, socket: any, force?: boolean) {
        let success: boolean = false;
        if (this.isLocked == false || force === true) {
            this.isLocked = true;
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
    async requestControlTransfer(secretKey: string, name: string, socket: any) {
        let identifier = generator.generate({
            length: 20,
            numbers: true,
            symbols: true
        });
        let controlTransferObject: ControlTransferObject = {
            secretKey,
            name,
            identifier
        };
        this.requesters.push(controlTransferObject);
        socket.send(JSON.stringify({
            success: true,
            identifier,
            interfaceType: "WSRequestControlTransfer"
        }));
    }

    transferControlTransfer(data: WSControlTransferResponse) {
        let newController: ControlTransferObject | undefined = this.requesters.find(requester => requester.identifier === data.identifier)
        if (newController) {
            this.takeControl(newController.secretKey, socket, true)
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