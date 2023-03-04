export interface ControlTransferObject{
    password: string;
    username: string;
    identifier: string;
}

export interface Instruction {
    value: number
}

export interface CameraData {
    name: string;
    uuid: string;
}