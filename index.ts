import fs from "fs";
import http from "http";
import crypto from "crypto";
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

	public static badRequestResponseString = new Response(403, {}).toString();
	public static notFoundResponseString = new Response(404, {}).toString();
	public static serverDownResponseString = new Response(500, {}).toString();
	public static pingBackResponseString = new Response(200, "pong").toString();
}

class Query {
	public type: string = '(null)';
	public data: {
		mode: string,

		name: string,
		password: string,

		query: string,

		word: string,
		token: string
	} = {
		mode: '(null)',
		name: '(null)',
		password: '(null)',
		query: '(null)',
		word: '(null)',
		token: ''
	};
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
	public translations: Array<Translation> = new Array<Translation>();
	public examples: Array<Example> = new Array<Example>();
}

class User {
	public name: string = '(null)';
	public password: string = '';
	public lastActiveTime = Date.now();
}

interface ActiveUsers {
	[key: string]: User;
}

class Server {
	public start() {
		let config = JSON.parse(fs.readFileSync("config.json").toString());
		let port = config.port;
		let sessionAliveTime = config.sessionIdle;

		let httpServer = http.createServer((_, response) => {
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
				let connection = request.accept('collint', request.origin);
				connection.on('message', (msg) => {
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
													switch (query.data.mode) {
														case "user":
															let user = new User();
															user.name = query.data.name;
															let password = query.data.password;
															let glob = crypto.createHash('sha256').update(password).digest('hex').toString();
															user.password = glob;
															client.db().collection('users').insertOne(user).then(it => {
																if (it.insertedCount === 1) {
																	connection.sendUTF(new Response(201, {}).toString());
																} else {
																	connection.sendUTF(Response.serverDownResponseString);
																}
															});
															break;
														case "word":
															break;
														default:
															connection.sendUTF(Response.badRequestResponseString);
													}
													break;
												case "r":
													switch (query.data.mode) {
														case "user":
															let username = query.data.name;
															let password = query.data.password;
															let glob = crypto.createHash('sha256').update(password).digest('hex').toString();
															client.db().collection('users').findOne<User>({
																'name': username,
																'password': glob
															}).then(it => {
																if (it) {
																	it.lastActiveTime = Date.now();

																} else {
																	connection.sendUTF(Response.notFoundResponseString);
																}
															});
															break;
														case "word":
															break;
													}
													break;
												case "u":
													break;
												case "d":
													break;
												default:
													connection.sendUTF(Response.badRequestResponseString);
											}
										} else {
											connection.sendUTF(new Response(500, "db error"));
										}
									});
								} else {
									if (query.data.token) {
										let user = this.activeUsers[query.data.token];
										if (user) {
											if (Date.now() - user.lastActiveTime < sessionAliveTime) {
												user.lastActiveTime = Date.now();
											}
										}
									}
									connection.sendUTF(Response.pingBackResponseString);
								}
							} else {
								connection.sendUTF(Response.badRequestResponseString);
							}
						} catch (e) {
							connection.sendUTF(Response.badRequestResponseString);
						}
					} else {
						connection.sendUTF(Response.badRequestResponseString);
					}
				});
			} catch (e) {
				console.log(e);
			}
		});
	}

	private activeUsers: ActiveUsers = {};
}

new Server().start();

