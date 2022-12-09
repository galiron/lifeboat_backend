"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
class ControlSocket {
    constructor() {
        this.controlSocket = (0, socket_io_client_1.io)("ws://localhost:5000");
        // client-side
        this.controlSocket.on("connect", () => {
            console.log(this.controlSocket.id);
        });
    }
    // forwarding emit to socket
    emit(socket, data) {
        this.controlSocket.emit(socket, data);
    }
}
exports.ControlSocket = ControlSocket;
