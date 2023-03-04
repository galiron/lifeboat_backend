import { io } from "socket.io-client";
import fs from "fs";

export class CanBusWebSocket {

  data = JSON.parse(fs.readFileSync("./src/app/config.json", "utf-8"))
  private controlSocket = io(this.data.canBusApiURL);

  constructor() {
    this.controlSocket.on("connect", () => {
      console.log("Established connection to ID: ",this.controlSocket.id);
    });
  }

  // forwarding emit to socket
  emit(endpoint: any, data: any){
    this.controlSocket.emit(endpoint,data);
  }
}