import fs from "fs";
import http from "http";
import { server } from "websocket";
import { MongoClient } from "mongodb";

class Response {
	public constructor(code: number, data: any) {
		this.code = code;
		this.data = data;
	}

	public toString() {
		return JSON.stringify(this);
	}

	private code: number;
	private data: any;
}

class Query {
	public type: string = '(null)';
	public data: any = {};
}

class Translation {
	public lang: string = 'und';
	public type: string = '(null)';
	public translation: string = '(null)';
}

class Example {
	public lang: string = 'und';
	public example: string = '(null)';
}

class Word {
	public lang: string = 'und';
	public word: string = '(null)';
	public pronunciation: string = '(null)';
	public translations: Array<Translation> = new Array();
	public examples: Array<Example> = new Array();
}

let badRequestResponseString = new Response(403, {}).toString();

let config = JSON.parse(fs.readFileSync("config.json").toString());
let port = config.port;

let httpServer = http.createServer((request, response) => {
	response.writeHead(404);
	response.end();
});
httpServer.listen(port);

function isProperRequest(obj: any): obj is Query {
	return obj && obj.hasOwnProperty("type") && obj.hasOwnProperty("data");
}

let socket = new server({
	httpServer: httpServer,
	autoAcceptConnections: false
});
socket.on('request', (request) => {
	try {
		let conn = request.accept('collint', request.origin);
		conn.on('message', (msg) => {
			if (msg.type === "utf8" && msg.utf8Data) {
				try {
					let glob = JSON.parse(msg.utf8Data);
					if (isProperRequest(glob)) {
						let query = glob as Query;
						if (query.type !== 'ping') {
							let url: string;
							if (config.hasAuthorization) {
								url = `mongo://${config.username}:${config.password}@${config.mongo}:${config.port}/${config.db}?authMechanism=${config.auth}`;
							} else {
								url = `mongo://${config.mongo}:${config.mongoPort}/${config.db}`;
							}
							let client = new MongoClient(url);
							client.connect((err) => {
								if (err == null) {
									switch (query.type) {
										case "c":
											break;
										case "r":
											break;
										case "u":
											break;
										case "d":
											break;
										default:
											conn.sendUTF(badRequestResponseString);
									}
								} else {
									conn.sendUTF(new Response(500, "db error"));
								}
							});
						} else {
							conn.sendUTF(new Response(200, "pong").toString());
						}
					} else {
						conn.sendUTF(badRequestResponseString);
					}
				} catch (e) {
					conn.sendUTF(badRequestResponseString);
				}
			} else {
				conn.sendUTF(badRequestResponseString);
			}
		});
	} catch (e) {
		console.log(e);
	}
});
