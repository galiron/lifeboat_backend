"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlLock = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generate_password_ts_1 = __importDefault(require("generate-password-ts"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const watchdog_1 = require("watchdog");
class ControlLock {
    constructor() {
        this.isLocked = false;
        this.controllerToken = '';
        this.saltRounds = 9;
        this.password = "";
        this.secretKey = "";
        this.watchDogSleep = false;
    }
    takeControl(secretKey, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            let success = false;
            if (this.isLocked == false) {
                this.isLocked = true;
                this.password = generate_password_ts_1.default.generate({
                    length: 20,
                    numbers: true,
                    symbols: true
                });
                this.password = yield bcrypt_1.default.hash(this.password, this.saltRounds);
                this.controllerToken = jsonwebtoken_1.default.sign(this.password, secretKey);
                this.secretKey = secretKey;
                success = true;
                this.dog = new watchdog_1.Watchdog(2200); // 2.2 sec
                this.dog.on('reset', () => {
                    console.log("bark bark, where is my food?");
                    this.dog.sleep();
                });
                this.dog.on('feed', () => { console.log("nom nom nom"); });
                this.dog.on('sleep', () => { console.log("I'm tired"); this.watchDogSleep = true; this.isLocked = false; });
                this.dog.feed({
                    data: 'delicious',
                    timeout: 2200,
                });
                this.watchDogSleep = false;
                this.watchDogPoll(socket);
            }
            return {
                jwt: this.controllerToken,
                success,
                interfaceType: "WSjwtReply"
            };
        });
    }
    ;
    watchDogPoll(socket) {
        if (this.watchDogSleep == false) {
            this.requestDogFood(socket);
            setTimeout(() => {
                this.watchDogPoll(socket);
            }, 1000);
        }
    }
    requestDogFood(socket) {
        console.log("sending dog food request");
        // socket.emit("WSFeedDogRequest", {
        //     success: true,
        //     interfaceType: "WSFeedDogRequest"
        // })
        socket.send(JSON.stringify({
            success: true,
            interfaceType: "WSFeedDogRequest"
        }));
    }
    feedWatchdog(clientToken) {
        let success = false;
        try {
            console.log("trying to feed dog");
            var decoded = jsonwebtoken_1.default.verify(clientToken, this.secretKey);
            success = true;
            this.dog.feed({
                data: 'delicious',
                timeout: 2200,
            });
            // console.log(decoded)
        }
        catch (err) {
            console.log(err);
        }
    }
    releaseControl(clientToken) {
        let success = false;
        try {
            var decoded = jsonwebtoken_1.default.verify(clientToken, this.secretKey);
            this.isLocked = false;
            success = true;
            this.dog.sleep();
            console.log(decoded);
        }
        catch (err) {
            console.log(err);
        }
        return {
            success,
            interfaceType: "WSReply"
        };
    }
}
exports.ControlLock = ControlLock;
