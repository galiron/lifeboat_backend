import { Instruction } from "./Interfaces";

export interface WSMessage {
    interfaceType: string;
}

export interface WSLockRequest extends WSMessage {
    secretKey: string;
}

export interface WSErrorResponse extends WSMessageResponse {
    errorMessage: string;
}

export interface WSVigilanceFeedResponse extends WSMessageResponse {
    
}

export interface WSAPIMessage extends WSMessage{
    api: string;
    data: any;
}

export interface WSMessageResponse extends WSMessage{
    success: boolean;
}

export interface WSJwtResponse extends WSMessageResponse{
    jwt: string;
}

export interface WSControlAssignment extends WSJwtResponse{
}

export interface WSJwtMessage extends WSMessage{
    jwt: string;
}

export interface WSFeedDogRequest extends WSMessage{
}

export interface WSConnectionTerminated extends WSMessage{
}

export interface WSLockReleaseResponse extends WSMessageResponse{
}

export interface WSControlTransfer extends WSMessage{
    name: string;
    identifier: string;
}


export interface WSThrottleRequest extends WSJwtMessage{
    instruction: Instruction
}

export interface WSSelectRequest extends WSJwtMessage{
    instruction: Instruction
}

export interface WSShifttRequest extends WSJwtMessage{
    instruction: Instruction
}

export interface WSSteeringRequest extends WSJwtMessage{
    instruction: Instruction
}

export interface WSControlTransferResponse extends WSJwtResponse{
    identifier: string;
}

export interface WSRequestControlTransferToBackend extends WSMessage{
    name: string;
    secretKey: string;
}

export interface WSRequestControlTransferToClient extends WSMessage{
    identifier: string;
    name: string
}



/* Careful, this function is dumb and only checks the interfaceName
   that gets send! Make sure to not use the wrong interfaceName for the
   belonging data on the backend !!! */
export function messageIsOfInterface(message: any, interfaceName: string){
    const parsedMessage = JSON.parse(message)
    if(parsedMessage){
        if(parsedMessage.interfaceType == interfaceName){
            return true;
        }
    }
    return false;
}