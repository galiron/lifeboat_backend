import { ControlLock } from './logic/ControlLock';
import { WSMessage } from './models/wsMessage';
// import { ControlLock } from './models/ControlLock';
// import express, { application } from 'express';
// import cors from 'cors';
// import expressWs from 'express-ws';

// const app = expressWs(express()).app;
// const PORT:Number=3000;
// const allowedOrigins : any = '*';
// const options: cors.CorsOptions = {
//     origin: allowedOrigins
// };
// let controlLocked: boolean = false;
// let control: ControlLock = new ControlLock;
// app.use(cors(options));
// app.use(express.json());

// // Handling GET / Request
// app.get('/', (req, res) => {
// 	res.send('Welcome to typescript backend!');
// })

// app.post('/takeControl', control.takeControl);

// app.post('/releaseControl', control.releaseControl);

// app.ws('/connection', (ws, req) => {
// 	console.log('test');
// 	ws.on('message', (msg) => {
// 		console.log(msg);
// 		ws.send(msg);
// 	});
// });

// // Server setup
// app.listen(PORT,() => {
// 	console.log('The application is listening '
// 		+ 'on port http://localhost:'+PORT);
// })

import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';

const app = express();

// initialize control lock
const controlLock: ControlLock = new ControlLock

// initialize a simple http server
const server = http.createServer(app);

// initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {

		ws.on('message', (msgString: string) => {
			const msg: WSMessage = JSON.parse(msgString);
			if (msg){
				let api = msg.api;
				console.log(msg.api)
				if (api === "lock") {
					if(msg.data){
						if (msg.data.secretKey){
							controlLock.takeControl(msg.data.secretKey, ws)
							.then((jwtMsg) => {
								console.log(jwtMsg)
								 ws.send(JSON.stringify(jwtMsg));
								}
							)
						}
					}
				}
				if (api === "unlock") {
					if(msg.data){
						console.log(msg)
						if (msg.data.jwt){
							const releaseMessage = controlLock.releaseControl(msg.data.jwt)
							console.log(releaseMessage)
							ws.send(JSON.stringify(releaseMessage))
						}
					}
				}
				if (api === "feedWatchdog") {
					if(msg.data){
						if (msg.data.jwt){
							controlLock.feedWatchdog(msg.data.jwt)
							//console.log(releaseMessage)
							//ws.send(JSON.stringify(releaseMessage))
						}
					}
				}
			} else {
				ws.send({success: false, interfaceType: "error"})
			}
		});
});

// start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`);
});
