import { Instruction, CameraData } from "./Interfaces";

export interface WSMessage {
    interfaceType: string;
}

export interface WSLockRequest extends WSMessage {
    username: string,
    password: string;
}

export interface WSErrorResponse extends WSMessageResponse {
    errorMessage: string;
}

export interface WSVigilanceFeedResponse extends WSMessageResponse {
    
}

export interface WSMessageResponse extends WSMessage{
    success: boolean;
}

export interface WSJwtResponse extends WSMessageResponse{
    jwt: string;
}

export interface WSControlAssignment extends WSJwtResponse{
    cameraData: CameraData [];
    isAuthorized: boolean
}

export interface WSJwtMessage extends WSMessage{
    jwt: string;
}

export interface WSFeedDogRequest extends WSMessage{
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
    username: string;
    password: string;
}

export interface WSRequestControlTransferToClient extends WSMessage{
    identifier: string;
    username: string
}