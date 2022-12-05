import { io } from "socket.io-client";

export class ControlSocket{

  private controlSocket = io("ws://localhost:5000");

  constructor() {
    // client-side
    this.controlSocket.on("connect", () => {
      console.log(this.controlSocket.id);
    });
  }

  // forwarding emit to socket
  emit(endpoint: any, data: any){
    this.controlSocket.emit(endpoint,data);
  }
}