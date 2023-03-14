import { io } from "socket.io-client";
import fs from "fs";

export class CanBusWebSocket {

  private data = JSON.parse(fs.readFileSync("./src/app/config.json", "utf-8"))
  private controlSocket = io(this.data.canBusApiURL);

  constructor() {
    console.log("canbus",this.data.canBusApiURL)
    this.controlSocket.on("connect", () => {
      console.log("Established connection to ID: ",this.controlSocket.id);
      this.poke()
    });
  }

  poke() {
    this.emit("poke",{})
    setTimeout(() => {
      this.poke()
  }, 1000);
  }

  // forwarding emit to socket
  emit(endpoint: any, data: any){
    this.controlSocket.emit(endpoint,data);
  }
}