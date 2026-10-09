import { createRequire } from "node:module";
import * as os$1 from "os";
import os, { EOL } from "os";
import * as fs$1 from "fs";
import { constants, promises } from "fs";
import "path";
import * as http from "http";
import * as https from "https";
import * as events from "events";
import { Readable } from "node:stream";
import { stripVTControlCharacters } from "node:util";
import { EventEmitter } from "node:events";
import "child_process";
import "timers";
import childProcess from "node:child_process";
import path, { join, relative, sep } from "node:path";
import fs from "node:fs";
import process$1 from "node:process";
import { readFile, readdir } from "node:fs/promises";
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
//#endregion
//#region node_modules/@actions/core/lib/utils.js
/**
* Sanitizes an input into a string so it can be passed into issueCommand safely
* @param input input to sanitize into a string
*/
function toCommandValue(input) {
	if (input === null || input === void 0) return "";
	else if (typeof input === "string" || input instanceof String) return input;
	return JSON.stringify(input);
}
/**
*
* @param annotationProperties
* @returns The command properties to send with the actual annotation command
* See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
*/
function toCommandProperties(annotationProperties) {
	if (!Object.keys(annotationProperties).length) return {};
	return {
		title: annotationProperties.title,
		file: annotationProperties.file,
		line: annotationProperties.startLine,
		endLine: annotationProperties.endLine,
		col: annotationProperties.startColumn,
		endColumn: annotationProperties.endColumn
	};
}
//#endregion
//#region node_modules/@actions/core/lib/command.js
/**
* Issues a command to the GitHub Actions runner
*
* @param command - The command name to issue
* @param properties - Additional properties for the command (key-value pairs)
* @param message - The message to include with the command
* @remarks
* This function outputs a specially formatted string to stdout that the Actions
* runner interprets as a command. These commands can control workflow behavior,
* set outputs, create annotations, mask values, and more.
*
* Command Format:
*   ::name key=value,key=value::message
*
* @example
* ```typescript
* // Issue a warning annotation
* issueCommand('warning', {}, 'This is a warning message');
* // Output: ::warning::This is a warning message
*
* // Set an environment variable
* issueCommand('set-env', { name: 'MY_VAR' }, 'some value');
* // Output: ::set-env name=MY_VAR::some value
*
* // Add a secret mask
* issueCommand('add-mask', {}, 'secretValue123');
* // Output: ::add-mask::secretValue123
* ```
*
* @internal
* This is an internal utility function that powers the public API functions
* such as setSecret, warning, error, and exportVariable.
*/
function issueCommand(command, properties, message) {
	const cmd = new Command$1(command, properties, message);
	process.stdout.write(cmd.toString() + os$1.EOL);
}
var CMD_STRING = "::";
var Command$1 = class {
	constructor(command, properties, message) {
		if (!command) command = "missing.command";
		this.command = command;
		this.properties = properties;
		this.message = message;
	}
	toString() {
		let cmdStr = CMD_STRING + this.command;
		if (this.properties && Object.keys(this.properties).length > 0) {
			cmdStr += " ";
			let first = true;
			for (const key in this.properties) if (this.properties.hasOwnProperty(key)) {
				const val = this.properties[key];
				if (val) {
					if (first) first = false;
					else cmdStr += ",";
					cmdStr += `${key}=${escapeProperty(val)}`;
				}
			}
		}
		cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
		return cmdStr;
	}
};
function escapeData(s) {
	return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s) {
	return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
//#endregion
//#region node_modules/@actions/http-client/lib/proxy.js
function getProxyUrl(reqUrl) {
	const usingSsl = reqUrl.protocol === "https:";
	if (checkBypass(reqUrl)) return;
	const proxyVar = (() => {
		if (usingSsl) return process.env["https_proxy"] || process.env["HTTPS_PROXY"];
		else return process.env["http_proxy"] || process.env["HTTP_PROXY"];
	})();
	if (proxyVar) try {
		return new DecodedURL(proxyVar);
	} catch (_a) {
		if (!proxyVar.startsWith("http://") && !proxyVar.startsWith("https://")) return new DecodedURL(`http://${proxyVar}`);
	}
	else return;
}
function checkBypass(reqUrl) {
	if (!reqUrl.hostname) return false;
	const reqHost = reqUrl.hostname;
	if (isLoopbackAddress(reqHost)) return true;
	const noProxy = process.env["no_proxy"] || process.env["NO_PROXY"] || "";
	if (!noProxy) return false;
	let reqPort;
	if (reqUrl.port) reqPort = Number(reqUrl.port);
	else if (reqUrl.protocol === "http:") reqPort = 80;
	else if (reqUrl.protocol === "https:") reqPort = 443;
	const upperReqHosts = [reqUrl.hostname.toUpperCase()];
	if (typeof reqPort === "number") upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
	for (const upperNoProxyItem of noProxy.split(",").map((x) => x.trim().toUpperCase()).filter((x) => x)) if (upperNoProxyItem === "*" || upperReqHosts.some((x) => x === upperNoProxyItem || x.endsWith(`.${upperNoProxyItem}`) || upperNoProxyItem.startsWith(".") && x.endsWith(`${upperNoProxyItem}`))) return true;
	return false;
}
function isLoopbackAddress(host) {
	const hostLower = host.toLowerCase();
	return hostLower === "localhost" || hostLower.startsWith("127.") || hostLower.startsWith("[::1]") || hostLower.startsWith("[0:0:0:0:0:0:0:1]");
}
var DecodedURL = class extends URL {
	constructor(url, base) {
		super(url, base);
		this._decodedUsername = decodeURIComponent(super.username);
		this._decodedPassword = decodeURIComponent(super.password);
	}
	get username() {
		return this._decodedUsername;
	}
	get password() {
		return this._decodedPassword;
	}
};
//#endregion
//#region node_modules/tunnel/lib/tunnel.js
var require_tunnel$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	__require("net");
	var tls = __require("tls");
	var http$2 = __require("http");
	var https$1 = __require("https");
	var events$1 = __require("events");
	__require("assert");
	var util$2 = __require("util");
	exports.httpOverHttp = httpOverHttp;
	exports.httpsOverHttp = httpsOverHttp;
	exports.httpOverHttps = httpOverHttps;
	exports.httpsOverHttps = httpsOverHttps;
	function httpOverHttp(options) {
		var agent = new TunnelingAgent(options);
		agent.request = http$2.request;
		return agent;
	}
	function httpsOverHttp(options) {
		var agent = new TunnelingAgent(options);
		agent.request = http$2.request;
		agent.createSocket = createSecureSocket;
		agent.defaultPort = 443;
		return agent;
	}
	function httpOverHttps(options) {
		var agent = new TunnelingAgent(options);
		agent.request = https$1.request;
		return agent;
	}
	function httpsOverHttps(options) {
		var agent = new TunnelingAgent(options);
		agent.request = https$1.request;
		agent.createSocket = createSecureSocket;
		agent.defaultPort = 443;
		return agent;
	}
	function TunnelingAgent(options) {
		var self = this;
		self.options = options || {};
		self.proxyOptions = self.options.proxy || {};
		self.maxSockets = self.options.maxSockets || http$2.Agent.defaultMaxSockets;
		self.requests = [];
		self.sockets = [];
		self.on("free", function onFree(socket, host, port, localAddress) {
			var options = toOptions(host, port, localAddress);
			for (var i = 0, len = self.requests.length; i < len; ++i) {
				var pending = self.requests[i];
				if (pending.host === options.host && pending.port === options.port) {
					self.requests.splice(i, 1);
					pending.request.onSocket(socket);
					return;
				}
			}
			socket.destroy();
			self.removeSocket(socket);
		});
	}
	util$2.inherits(TunnelingAgent, events$1.EventEmitter);
	TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
		var self = this;
		var options = mergeOptions({ request: req }, self.options, toOptions(host, port, localAddress));
		if (self.sockets.length >= this.maxSockets) {
			self.requests.push(options);
			return;
		}
		self.createSocket(options, function(socket) {
			socket.on("free", onFree);
			socket.on("close", onCloseOrRemove);
			socket.on("agentRemove", onCloseOrRemove);
			req.onSocket(socket);
			function onFree() {
				self.emit("free", socket, options);
			}
			function onCloseOrRemove(err) {
				self.removeSocket(socket);
				socket.removeListener("free", onFree);
				socket.removeListener("close", onCloseOrRemove);
				socket.removeListener("agentRemove", onCloseOrRemove);
			}
		});
	};
	TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
		var self = this;
		var placeholder = {};
		self.sockets.push(placeholder);
		var connectOptions = mergeOptions({}, self.proxyOptions, {
			method: "CONNECT",
			path: options.host + ":" + options.port,
			agent: false,
			headers: { host: options.host + ":" + options.port }
		});
		if (options.localAddress) connectOptions.localAddress = options.localAddress;
		if (connectOptions.proxyAuth) {
			connectOptions.headers = connectOptions.headers || {};
			connectOptions.headers["Proxy-Authorization"] = "Basic " + new Buffer(connectOptions.proxyAuth).toString("base64");
		}
		debug("making CONNECT request");
		var connectReq = self.request(connectOptions);
		connectReq.useChunkedEncodingByDefault = false;
		connectReq.once("response", onResponse);
		connectReq.once("upgrade", onUpgrade);
		connectReq.once("connect", onConnect);
		connectReq.once("error", onError);
		connectReq.end();
		function onResponse(res) {
			res.upgrade = true;
		}
		function onUpgrade(res, socket, head) {
			process.nextTick(function() {
				onConnect(res, socket, head);
			});
		}
		function onConnect(res, socket, head) {
			connectReq.removeAllListeners();
			socket.removeAllListeners();
			if (res.statusCode !== 200) {
				debug("tunneling socket could not be established, statusCode=%d", res.statusCode);
				socket.destroy();
				var error = /* @__PURE__ */ new Error("tunneling socket could not be established, statusCode=" + res.statusCode);
				error.code = "ECONNRESET";
				options.request.emit("error", error);
				self.removeSocket(placeholder);
				return;
			}
			if (head.length > 0) {
				debug("got illegal response body from proxy");
				socket.destroy();
				var error = /* @__PURE__ */ new Error("got illegal response body from proxy");
				error.code = "ECONNRESET";
				options.request.emit("error", error);
				self.removeSocket(placeholder);
				return;
			}
			debug("tunneling connection has established");
			self.sockets[self.sockets.indexOf(placeholder)] = socket;
			return cb(socket);
		}
		function onError(cause) {
			connectReq.removeAllListeners();
			debug("tunneling socket could not be established, cause=%s\n", cause.message, cause.stack);
			var error = /* @__PURE__ */ new Error("tunneling socket could not be established, cause=" + cause.message);
			error.code = "ECONNRESET";
			options.request.emit("error", error);
			self.removeSocket(placeholder);
		}
	};
	TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
		var pos = this.sockets.indexOf(socket);
		if (pos === -1) return;
		this.sockets.splice(pos, 1);
		var pending = this.requests.shift();
		if (pending) this.createSocket(pending, function(socket) {
			pending.request.onSocket(socket);
		});
	};
	function createSecureSocket(options, cb) {
		var self = this;
		TunnelingAgent.prototype.createSocket.call(self, options, function(socket) {
			var hostHeader = options.request.getHeader("host");
			var tlsOptions = mergeOptions({}, self.options, {
				socket,
				servername: hostHeader ? hostHeader.replace(/:.*$/, "") : options.host
			});
			var secureSocket = tls.connect(0, tlsOptions);
			self.sockets[self.sockets.indexOf(socket)] = secureSocket;
			cb(secureSocket);
		});
	}
	function toOptions(host, port, localAddress) {
		if (typeof host === "string") return {
			host,
			port,
			localAddress
		};
		return host;
	}
	function mergeOptions(target) {
		for (var i = 1, len = arguments.length; i < len; ++i) {
			var overrides = arguments[i];
			if (typeof overrides === "object") {
				var keys = Object.keys(overrides);
				for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
					var k = keys[j];
					if (overrides[k] !== void 0) target[k] = overrides[k];
				}
			}
		}
		return target;
	}
	var debug;
	if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) debug = function() {
		var args = Array.prototype.slice.call(arguments);
		if (typeof args[0] === "string") args[0] = "TUNNEL: " + args[0];
		else args.unshift("TUNNEL:");
		console.error.apply(console, args);
	};
	else debug = function() {};
}));
//#endregion
//#region node_modules/tunnel/index.js
var require_tunnel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_tunnel$1();
}));
//#endregion
//#region node_modules/undici/lib/core/symbols.js
var require_symbols$4 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kClose: Symbol("close"),
		kDestroy: Symbol("destroy"),
		kDispatch: Symbol("dispatch"),
		kUrl: Symbol("url"),
		kWriting: Symbol("writing"),
		kResuming: Symbol("resuming"),
		kQueue: Symbol("queue"),
		kConnect: Symbol("connect"),
		kConnecting: Symbol("connecting"),
		kKeepAliveDefaultTimeout: Symbol("default keep alive timeout"),
		kKeepAliveMaxTimeout: Symbol("max keep alive timeout"),
		kKeepAliveTimeoutThreshold: Symbol("keep alive timeout threshold"),
		kKeepAliveTimeoutValue: Symbol("keep alive timeout"),
		kKeepAlive: Symbol("keep alive"),
		kHeadersTimeout: Symbol("headers timeout"),
		kBodyTimeout: Symbol("body timeout"),
		kServerName: Symbol("server name"),
		kLocalAddress: Symbol("local address"),
		kHost: Symbol("host"),
		kNoRef: Symbol("no ref"),
		kBodyUsed: Symbol("used"),
		kBody: Symbol("abstracted request body"),
		kRunning: Symbol("running"),
		kBlocking: Symbol("blocking"),
		kPending: Symbol("pending"),
		kSize: Symbol("size"),
		kBusy: Symbol("busy"),
		kQueued: Symbol("queued"),
		kFree: Symbol("free"),
		kConnected: Symbol("connected"),
		kClosed: Symbol("closed"),
		kNeedDrain: Symbol("need drain"),
		kReset: Symbol("reset"),
		kDestroyed: Symbol.for("nodejs.stream.destroyed"),
		kResume: Symbol("resume"),
		kOnError: Symbol("on error"),
		kMaxHeadersSize: Symbol("max headers size"),
		kRunningIdx: Symbol("running index"),
		kPendingIdx: Symbol("pending index"),
		kError: Symbol("error"),
		kClients: Symbol("clients"),
		kClient: Symbol("client"),
		kParser: Symbol("parser"),
		kOnDestroyed: Symbol("destroy callbacks"),
		kPipelining: Symbol("pipelining"),
		kSocket: Symbol("socket"),
		kHostHeader: Symbol("host header"),
		kConnector: Symbol("connector"),
		kStrictContentLength: Symbol("strict content length"),
		kMaxRedirections: Symbol("maxRedirections"),
		kMaxRequests: Symbol("maxRequestsPerClient"),
		kProxy: Symbol("proxy agent options"),
		kCounter: Symbol("socket request counter"),
		kInterceptors: Symbol("dispatch interceptors"),
		kMaxResponseSize: Symbol("max response size"),
		kHTTP2Session: Symbol("http2Session"),
		kHTTP2SessionState: Symbol("http2Session state"),
		kRetryHandlerDefaultRetry: Symbol("retry agent default retry"),
		kConstruct: Symbol("constructable"),
		kListeners: Symbol("listeners"),
		kHTTPContext: Symbol("http context"),
		kMaxConcurrentStreams: Symbol("max concurrent streams"),
		kNoProxyAgent: Symbol("no proxy agent"),
		kHttpProxyAgent: Symbol("http proxy agent"),
		kHttpsProxyAgent: Symbol("https proxy agent")
	};
}));
//#endregion
//#region node_modules/undici/lib/core/errors.js
var require_errors$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var kUndiciError = Symbol.for("undici.error.UND_ERR");
	var UndiciError = class extends Error {
		constructor(message) {
			super(message);
			this.name = "UndiciError";
			this.code = "UND_ERR";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kUndiciError] === true;
		}
		[kUndiciError] = true;
	};
	var kConnectTimeoutError = Symbol.for("undici.error.UND_ERR_CONNECT_TIMEOUT");
	var ConnectTimeoutError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ConnectTimeoutError";
			this.message = message || "Connect Timeout Error";
			this.code = "UND_ERR_CONNECT_TIMEOUT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kConnectTimeoutError] === true;
		}
		[kConnectTimeoutError] = true;
	};
	var kHeadersTimeoutError = Symbol.for("undici.error.UND_ERR_HEADERS_TIMEOUT");
	var HeadersTimeoutError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "HeadersTimeoutError";
			this.message = message || "Headers Timeout Error";
			this.code = "UND_ERR_HEADERS_TIMEOUT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kHeadersTimeoutError] === true;
		}
		[kHeadersTimeoutError] = true;
	};
	var kHeadersOverflowError = Symbol.for("undici.error.UND_ERR_HEADERS_OVERFLOW");
	var HeadersOverflowError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "HeadersOverflowError";
			this.message = message || "Headers Overflow Error";
			this.code = "UND_ERR_HEADERS_OVERFLOW";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kHeadersOverflowError] === true;
		}
		[kHeadersOverflowError] = true;
	};
	var kBodyTimeoutError = Symbol.for("undici.error.UND_ERR_BODY_TIMEOUT");
	var BodyTimeoutError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "BodyTimeoutError";
			this.message = message || "Body Timeout Error";
			this.code = "UND_ERR_BODY_TIMEOUT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kBodyTimeoutError] === true;
		}
		[kBodyTimeoutError] = true;
	};
	var kResponseStatusCodeError = Symbol.for("undici.error.UND_ERR_RESPONSE_STATUS_CODE");
	var ResponseStatusCodeError = class extends UndiciError {
		constructor(message, statusCode, headers, body) {
			super(message);
			this.name = "ResponseStatusCodeError";
			this.message = message || "Response Status Code Error";
			this.code = "UND_ERR_RESPONSE_STATUS_CODE";
			this.body = body;
			this.status = statusCode;
			this.statusCode = statusCode;
			this.headers = headers;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseStatusCodeError] === true;
		}
		[kResponseStatusCodeError] = true;
	};
	var kInvalidArgumentError = Symbol.for("undici.error.UND_ERR_INVALID_ARG");
	var InvalidArgumentError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "InvalidArgumentError";
			this.message = message || "Invalid Argument Error";
			this.code = "UND_ERR_INVALID_ARG";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kInvalidArgumentError] === true;
		}
		[kInvalidArgumentError] = true;
	};
	var kInvalidReturnValueError = Symbol.for("undici.error.UND_ERR_INVALID_RETURN_VALUE");
	var InvalidReturnValueError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "InvalidReturnValueError";
			this.message = message || "Invalid Return Value Error";
			this.code = "UND_ERR_INVALID_RETURN_VALUE";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kInvalidReturnValueError] === true;
		}
		[kInvalidReturnValueError] = true;
	};
	var kAbortError = Symbol.for("undici.error.UND_ERR_ABORT");
	var AbortError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "AbortError";
			this.message = message || "The operation was aborted";
			this.code = "UND_ERR_ABORT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kAbortError] === true;
		}
		[kAbortError] = true;
	};
	var kRequestAbortedError = Symbol.for("undici.error.UND_ERR_ABORTED");
	var RequestAbortedError = class extends AbortError {
		constructor(message) {
			super(message);
			this.name = "AbortError";
			this.message = message || "Request aborted";
			this.code = "UND_ERR_ABORTED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kRequestAbortedError] === true;
		}
		[kRequestAbortedError] = true;
	};
	var kInformationalError = Symbol.for("undici.error.UND_ERR_INFO");
	var InformationalError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "InformationalError";
			this.message = message || "Request information";
			this.code = "UND_ERR_INFO";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kInformationalError] === true;
		}
		[kInformationalError] = true;
	};
	var kRequestContentLengthMismatchError = Symbol.for("undici.error.UND_ERR_REQ_CONTENT_LENGTH_MISMATCH");
	var RequestContentLengthMismatchError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "RequestContentLengthMismatchError";
			this.message = message || "Request body length does not match content-length header";
			this.code = "UND_ERR_REQ_CONTENT_LENGTH_MISMATCH";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kRequestContentLengthMismatchError] === true;
		}
		[kRequestContentLengthMismatchError] = true;
	};
	var kResponseContentLengthMismatchError = Symbol.for("undici.error.UND_ERR_RES_CONTENT_LENGTH_MISMATCH");
	var ResponseContentLengthMismatchError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ResponseContentLengthMismatchError";
			this.message = message || "Response body length does not match content-length header";
			this.code = "UND_ERR_RES_CONTENT_LENGTH_MISMATCH";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseContentLengthMismatchError] === true;
		}
		[kResponseContentLengthMismatchError] = true;
	};
	var kClientDestroyedError = Symbol.for("undici.error.UND_ERR_DESTROYED");
	var ClientDestroyedError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ClientDestroyedError";
			this.message = message || "The client is destroyed";
			this.code = "UND_ERR_DESTROYED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kClientDestroyedError] === true;
		}
		[kClientDestroyedError] = true;
	};
	var kClientClosedError = Symbol.for("undici.error.UND_ERR_CLOSED");
	var ClientClosedError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ClientClosedError";
			this.message = message || "The client is closed";
			this.code = "UND_ERR_CLOSED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kClientClosedError] === true;
		}
		[kClientClosedError] = true;
	};
	var kSocketError = Symbol.for("undici.error.UND_ERR_SOCKET");
	var SocketError = class extends UndiciError {
		constructor(message, socket) {
			super(message);
			this.name = "SocketError";
			this.message = message || "Socket error";
			this.code = "UND_ERR_SOCKET";
			this.socket = socket;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kSocketError] === true;
		}
		[kSocketError] = true;
	};
	var kNotSupportedError = Symbol.for("undici.error.UND_ERR_NOT_SUPPORTED");
	var NotSupportedError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "NotSupportedError";
			this.message = message || "Not supported error";
			this.code = "UND_ERR_NOT_SUPPORTED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kNotSupportedError] === true;
		}
		[kNotSupportedError] = true;
	};
	var kBalancedPoolMissingUpstreamError = Symbol.for("undici.error.UND_ERR_BPL_MISSING_UPSTREAM");
	var BalancedPoolMissingUpstreamError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "MissingUpstreamError";
			this.message = message || "No upstream has been added to the BalancedPool";
			this.code = "UND_ERR_BPL_MISSING_UPSTREAM";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kBalancedPoolMissingUpstreamError] === true;
		}
		[kBalancedPoolMissingUpstreamError] = true;
	};
	var kHTTPParserError = Symbol.for("undici.error.UND_ERR_HTTP_PARSER");
	var HTTPParserError = class extends Error {
		constructor(message, code, data) {
			super(message);
			this.name = "HTTPParserError";
			this.code = code ? `HPE_${code}` : void 0;
			this.data = data ? data.toString() : void 0;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kHTTPParserError] === true;
		}
		[kHTTPParserError] = true;
	};
	var kResponseExceededMaxSizeError = Symbol.for("undici.error.UND_ERR_RES_EXCEEDED_MAX_SIZE");
	var ResponseExceededMaxSizeError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ResponseExceededMaxSizeError";
			this.message = message || "Response content exceeded max size";
			this.code = "UND_ERR_RES_EXCEEDED_MAX_SIZE";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseExceededMaxSizeError] === true;
		}
		[kResponseExceededMaxSizeError] = true;
	};
	var kRequestRetryError = Symbol.for("undici.error.UND_ERR_REQ_RETRY");
	var RequestRetryError = class extends UndiciError {
		constructor(message, code, { headers, data }) {
			super(message);
			this.name = "RequestRetryError";
			this.message = message || "Request retry error";
			this.code = "UND_ERR_REQ_RETRY";
			this.statusCode = code;
			this.data = data;
			this.headers = headers;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kRequestRetryError] === true;
		}
		[kRequestRetryError] = true;
	};
	var kResponseError = Symbol.for("undici.error.UND_ERR_RESPONSE");
	var ResponseError = class extends UndiciError {
		constructor(message, code, { headers, data }) {
			super(message);
			this.name = "ResponseError";
			this.message = message || "Response error";
			this.code = "UND_ERR_RESPONSE";
			this.statusCode = code;
			this.data = data;
			this.headers = headers;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseError] === true;
		}
		[kResponseError] = true;
	};
	var kSecureProxyConnectionError = Symbol.for("undici.error.UND_ERR_PRX_TLS");
	var SecureProxyConnectionError = class extends UndiciError {
		constructor(cause, message, options) {
			super(message, {
				cause,
				...options ?? {}
			});
			this.name = "SecureProxyConnectionError";
			this.message = message || "Secure Proxy Connection failed";
			this.code = "UND_ERR_PRX_TLS";
			this.cause = cause;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kSecureProxyConnectionError] === true;
		}
		[kSecureProxyConnectionError] = true;
	};
	var kMessageSizeExceededError = Symbol.for("undici.error.UND_ERR_WS_MESSAGE_SIZE_EXCEEDED");
	var MessageSizeExceededError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "MessageSizeExceededError";
			this.message = message || "Max decompressed message size exceeded";
			this.code = "UND_ERR_WS_MESSAGE_SIZE_EXCEEDED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kMessageSizeExceededError] === true;
		}
		get [kMessageSizeExceededError]() {
			return true;
		}
	};
	module.exports = {
		AbortError,
		HTTPParserError,
		UndiciError,
		HeadersTimeoutError,
		HeadersOverflowError,
		BodyTimeoutError,
		RequestContentLengthMismatchError,
		ConnectTimeoutError,
		ResponseStatusCodeError,
		InvalidArgumentError,
		InvalidReturnValueError,
		RequestAbortedError,
		ClientDestroyedError,
		ClientClosedError,
		InformationalError,
		SocketError,
		NotSupportedError,
		ResponseContentLengthMismatchError,
		BalancedPoolMissingUpstreamError,
		ResponseExceededMaxSizeError,
		RequestRetryError,
		ResponseError,
		SecureProxyConnectionError,
		MessageSizeExceededError
	};
}));
//#endregion
//#region node_modules/undici/lib/core/constants.js
var require_constants$5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** @type {Record<string, string | undefined>} */
	var headerNameLowerCasedRecord = {};
	var wellknownHeaderNames = [
		"Accept",
		"Accept-Encoding",
		"Accept-Language",
		"Accept-Ranges",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Origin",
		"Access-Control-Expose-Headers",
		"Access-Control-Max-Age",
		"Access-Control-Request-Headers",
		"Access-Control-Request-Method",
		"Age",
		"Allow",
		"Alt-Svc",
		"Alt-Used",
		"Authorization",
		"Cache-Control",
		"Clear-Site-Data",
		"Connection",
		"Content-Disposition",
		"Content-Encoding",
		"Content-Language",
		"Content-Length",
		"Content-Location",
		"Content-Range",
		"Content-Security-Policy",
		"Content-Security-Policy-Report-Only",
		"Content-Type",
		"Cookie",
		"Cross-Origin-Embedder-Policy",
		"Cross-Origin-Opener-Policy",
		"Cross-Origin-Resource-Policy",
		"Date",
		"Device-Memory",
		"Downlink",
		"ECT",
		"ETag",
		"Expect",
		"Expect-CT",
		"Expires",
		"Forwarded",
		"From",
		"Host",
		"If-Match",
		"If-Modified-Since",
		"If-None-Match",
		"If-Range",
		"If-Unmodified-Since",
		"Keep-Alive",
		"Last-Modified",
		"Link",
		"Location",
		"Max-Forwards",
		"Origin",
		"Permissions-Policy",
		"Pragma",
		"Proxy-Authenticate",
		"Proxy-Authorization",
		"RTT",
		"Range",
		"Referer",
		"Referrer-Policy",
		"Refresh",
		"Retry-After",
		"Sec-WebSocket-Accept",
		"Sec-WebSocket-Extensions",
		"Sec-WebSocket-Key",
		"Sec-WebSocket-Protocol",
		"Sec-WebSocket-Version",
		"Server",
		"Server-Timing",
		"Service-Worker-Allowed",
		"Service-Worker-Navigation-Preload",
		"Set-Cookie",
		"SourceMap",
		"Strict-Transport-Security",
		"Supports-Loading-Mode",
		"TE",
		"Timing-Allow-Origin",
		"Trailer",
		"Transfer-Encoding",
		"Upgrade",
		"Upgrade-Insecure-Requests",
		"User-Agent",
		"Vary",
		"Via",
		"WWW-Authenticate",
		"X-Content-Type-Options",
		"X-DNS-Prefetch-Control",
		"X-Frame-Options",
		"X-Permitted-Cross-Domain-Policies",
		"X-Powered-By",
		"X-Requested-With",
		"X-XSS-Protection"
	];
	for (let i = 0; i < wellknownHeaderNames.length; ++i) {
		const key = wellknownHeaderNames[i];
		const lowerCasedKey = key.toLowerCase();
		headerNameLowerCasedRecord[key] = headerNameLowerCasedRecord[lowerCasedKey] = lowerCasedKey;
	}
	Object.setPrototypeOf(headerNameLowerCasedRecord, null);
	module.exports = {
		wellknownHeaderNames,
		headerNameLowerCasedRecord
	};
}));
//#endregion
//#region node_modules/undici/lib/core/tree.js
var require_tree = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { wellknownHeaderNames, headerNameLowerCasedRecord } = require_constants$5();
	var TstNode = class TstNode {
		/** @type {any} */
		value = null;
		/** @type {null | TstNode} */
		left = null;
		/** @type {null | TstNode} */
		middle = null;
		/** @type {null | TstNode} */
		right = null;
		/** @type {number} */
		code;
		/**
		* @param {string} key
		* @param {any} value
		* @param {number} index
		*/
		constructor(key, value, index) {
			if (index === void 0 || index >= key.length) throw new TypeError("Unreachable");
			if ((this.code = key.charCodeAt(index)) > 127) throw new TypeError("key must be ascii string");
			if (key.length !== ++index) this.middle = new TstNode(key, value, index);
			else this.value = value;
		}
		/**
		* @param {string} key
		* @param {any} value
		*/
		add(key, value) {
			const length = key.length;
			if (length === 0) throw new TypeError("Unreachable");
			let index = 0;
			let node = this;
			while (true) {
				const code = key.charCodeAt(index);
				if (code > 127) throw new TypeError("key must be ascii string");
				if (node.code === code) {
					if (length === ++index) {
						node.value = value;
						break;
					} else if (node.middle !== null) node = node.middle;
					else {
						node.middle = new TstNode(key, value, index);
						break;
					}
				} else if (node.code < code) {
					if (node.left !== null) node = node.left;
					else {
						node.left = new TstNode(key, value, index);
						break;
					}
				} else if (node.right !== null) node = node.right;
				else {
					node.right = new TstNode(key, value, index);
					break;
				}
			}
		}
		/**
		* @param {Uint8Array} key
		* @return {TstNode | null}
		*/
		search(key) {
			const keylength = key.length;
			let index = 0;
			let node = this;
			while (node !== null && index < keylength) {
				let code = key[index];
				if (code <= 90 && code >= 65) code |= 32;
				while (node !== null) {
					if (code === node.code) {
						if (keylength === ++index) return node;
						node = node.middle;
						break;
					}
					node = node.code < code ? node.left : node.right;
				}
			}
			return null;
		}
	};
	var TernarySearchTree = class {
		/** @type {TstNode | null} */
		node = null;
		/**
		* @param {string} key
		* @param {any} value
		* */
		insert(key, value) {
			if (this.node === null) this.node = new TstNode(key, value, 0);
			else this.node.add(key, value);
		}
		/**
		* @param {Uint8Array} key
		* @return {any}
		*/
		lookup(key) {
			return this.node?.search(key)?.value ?? null;
		}
	};
	var tree = new TernarySearchTree();
	for (let i = 0; i < wellknownHeaderNames.length; ++i) {
		const key = headerNameLowerCasedRecord[wellknownHeaderNames[i]];
		tree.insert(key, key);
	}
	module.exports = {
		TernarySearchTree,
		tree
	};
}));
//#endregion
//#region node_modules/undici/lib/core/util.js
var require_util$8 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$26 = __require("node:assert");
	var { kDestroyed, kBodyUsed, kListeners, kBody } = require_symbols$4();
	var { IncomingMessage } = __require("node:http");
	var stream = __require("node:stream");
	var net$2 = __require("node:net");
	var { Blob: Blob$3 } = __require("node:buffer");
	var nodeUtil$3 = __require("node:util");
	var { stringify } = __require("node:querystring");
	var { EventEmitter: EE$2 } = __require("node:events");
	var { InvalidArgumentError } = require_errors$1();
	var { headerNameLowerCasedRecord } = require_constants$5();
	var { tree } = require_tree();
	var [nodeMajor, nodeMinor] = process.versions.node.split(".").map((v) => Number(v));
	var BodyAsyncIterable = class {
		constructor(body) {
			this[kBody] = body;
			this[kBodyUsed] = false;
		}
		async *[Symbol.asyncIterator]() {
			assert$26(!this[kBodyUsed], "disturbed");
			this[kBodyUsed] = true;
			yield* this[kBody];
		}
	};
	function wrapRequestBody(body) {
		if (isStream(body)) {
			if (bodyLength(body) === 0) body.on("data", function() {
				assert$26(false);
			});
			if (typeof body.readableDidRead !== "boolean") {
				body[kBodyUsed] = false;
				EE$2.prototype.on.call(body, "data", function() {
					this[kBodyUsed] = true;
				});
			}
			return body;
		} else if (body && typeof body.pipeTo === "function") return new BodyAsyncIterable(body);
		else if (body && typeof body !== "string" && !ArrayBuffer.isView(body) && isIterable(body)) return new BodyAsyncIterable(body);
		else return body;
	}
	function nop() {}
	function isStream(obj) {
		return obj && typeof obj === "object" && typeof obj.pipe === "function" && typeof obj.on === "function";
	}
	function isBlobLike(object) {
		if (object === null) return false;
		else if (object instanceof Blob$3) return true;
		else if (typeof object !== "object") return false;
		else {
			const sTag = object[Symbol.toStringTag];
			return (sTag === "Blob" || sTag === "File") && ("stream" in object && typeof object.stream === "function" || "arrayBuffer" in object && typeof object.arrayBuffer === "function");
		}
	}
	function buildURL(url, queryParams) {
		if (url.includes("?") || url.includes("#")) throw new Error("Query params cannot be passed when url already contains \"?\" or \"#\".");
		const stringified = stringify(queryParams);
		if (stringified) url += "?" + stringified;
		return url;
	}
	function isValidPort(port) {
		const value = parseInt(port, 10);
		return value === Number(port) && value >= 0 && value <= 65535;
	}
	function isHttpOrHttpsPrefixed(value) {
		return value != null && value[0] === "h" && value[1] === "t" && value[2] === "t" && value[3] === "p" && (value[4] === ":" || value[4] === "s" && value[5] === ":");
	}
	function parseURL(url) {
		if (typeof url === "string") {
			url = new URL(url);
			if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
			return url;
		}
		if (!url || typeof url !== "object") throw new InvalidArgumentError("Invalid URL: The URL argument must be a non-null object.");
		if (!(url instanceof URL)) {
			if (url.port != null && url.port !== "" && isValidPort(url.port) === false) throw new InvalidArgumentError("Invalid URL: port must be a valid integer or a string representation of an integer.");
			if (url.path != null && typeof url.path !== "string") throw new InvalidArgumentError("Invalid URL path: the path must be a string or null/undefined.");
			if (url.pathname != null && typeof url.pathname !== "string") throw new InvalidArgumentError("Invalid URL pathname: the pathname must be a string or null/undefined.");
			if (url.hostname != null && typeof url.hostname !== "string") throw new InvalidArgumentError("Invalid URL hostname: the hostname must be a string or null/undefined.");
			if (url.origin != null && typeof url.origin !== "string") throw new InvalidArgumentError("Invalid URL origin: the origin must be a string or null/undefined.");
			if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
			const port = url.port != null ? url.port : url.protocol === "https:" ? 443 : 80;
			let origin = url.origin != null ? url.origin : `${url.protocol || ""}//${url.hostname || ""}:${port}`;
			let path = url.path != null ? url.path : `${url.pathname || ""}${url.search || ""}`;
			if (origin[origin.length - 1] === "/") origin = origin.slice(0, origin.length - 1);
			if (path && path[0] !== "/") path = `/${path}`;
			return new URL(`${origin}${path}`);
		}
		if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
		return url;
	}
	function parseOrigin(url) {
		url = parseURL(url);
		if (url.pathname !== "/" || url.search || url.hash) throw new InvalidArgumentError("invalid url");
		return url;
	}
	function getHostname(host) {
		if (host[0] === "[") {
			const idx = host.indexOf("]");
			assert$26(idx !== -1);
			return host.substring(1, idx);
		}
		const idx = host.indexOf(":");
		if (idx === -1) return host;
		return host.substring(0, idx);
	}
	function getServerName(host) {
		if (!host) return null;
		assert$26(typeof host === "string");
		const servername = getHostname(host);
		if (net$2.isIP(servername)) return "";
		return servername;
	}
	function deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	function isAsyncIterable(obj) {
		return !!(obj != null && typeof obj[Symbol.asyncIterator] === "function");
	}
	function isIterable(obj) {
		return !!(obj != null && (typeof obj[Symbol.iterator] === "function" || typeof obj[Symbol.asyncIterator] === "function"));
	}
	function bodyLength(body) {
		if (body == null) return 0;
		else if (isStream(body)) {
			const state = body._readableState;
			return state && state.objectMode === false && state.ended === true && Number.isFinite(state.length) ? state.length : null;
		} else if (isBlobLike(body)) return body.size != null ? body.size : null;
		else if (isBuffer(body)) return body.byteLength;
		return null;
	}
	function isDestroyed(body) {
		return body && !!(body.destroyed || body[kDestroyed] || stream.isDestroyed?.(body));
	}
	function destroy(stream, err) {
		if (stream == null || !isStream(stream) || isDestroyed(stream)) return;
		if (typeof stream.destroy === "function") {
			if (Object.getPrototypeOf(stream).constructor === IncomingMessage) stream.socket = null;
			stream.destroy(err);
		} else if (err) queueMicrotask(() => {
			stream.emit("error", err);
		});
		if (stream.destroyed !== true) stream[kDestroyed] = true;
	}
	var KEEPALIVE_TIMEOUT_EXPR = /timeout=(\d+)/;
	function parseKeepAliveTimeout(val) {
		const m = val.toString().match(KEEPALIVE_TIMEOUT_EXPR);
		return m ? parseInt(m[1], 10) * 1e3 : null;
	}
	/**
	* Retrieves a header name and returns its lowercase value.
	* @param {string | Buffer} value Header name
	* @returns {string}
	*/
	function headerNameToString(value) {
		return typeof value === "string" ? headerNameLowerCasedRecord[value] ?? value.toLowerCase() : tree.lookup(value) ?? value.toString("latin1").toLowerCase();
	}
	/**
	* Receive the buffer as a string and return its lowercase value.
	* @param {Buffer} value Header name
	* @returns {string}
	*/
	function bufferToLowerCasedHeaderName(value) {
		return tree.lookup(value) ?? value.toString("latin1").toLowerCase();
	}
	/**
	* @param {Record<string, string | string[]> | (Buffer | string | (Buffer | string)[])[]} headers
	* @param {Record<string, string | string[]>} [obj]
	* @returns {Record<string, string | string[]>}
	*/
	function parseHeaders(headers, obj) {
		if (obj === void 0) obj = {};
		for (let i = 0; i < headers.length; i += 2) {
			const key = headerNameToString(headers[i]);
			let val = obj[key];
			if (val) {
				if (typeof val === "string") {
					val = [val];
					obj[key] = val;
				}
				val.push(headers[i + 1].toString("utf8"));
			} else {
				const headersValue = headers[i + 1];
				if (typeof headersValue === "string") obj[key] = headersValue;
				else obj[key] = Array.isArray(headersValue) ? headersValue.map((x) => x.toString("utf8")) : headersValue.toString("utf8");
			}
		}
		if ("content-length" in obj && "content-disposition" in obj) obj["content-disposition"] = Buffer.from(obj["content-disposition"]).toString("latin1");
		return obj;
	}
	function parseRawHeaders(headers) {
		const len = headers.length;
		const ret = new Array(len);
		let hasContentLength = false;
		let contentDispositionIdx = -1;
		let key;
		let val;
		let kLen = 0;
		for (let n = 0; n < headers.length; n += 2) {
			key = headers[n];
			val = headers[n + 1];
			typeof key !== "string" && (key = key.toString());
			typeof val !== "string" && (val = val.toString("utf8"));
			kLen = key.length;
			if (kLen === 14 && key[7] === "-" && (key === "content-length" || key.toLowerCase() === "content-length")) hasContentLength = true;
			else if (kLen === 19 && key[7] === "-" && (key === "content-disposition" || key.toLowerCase() === "content-disposition")) contentDispositionIdx = n + 1;
			ret[n] = key;
			ret[n + 1] = val;
		}
		if (hasContentLength && contentDispositionIdx !== -1) ret[contentDispositionIdx] = Buffer.from(ret[contentDispositionIdx]).toString("latin1");
		return ret;
	}
	function isBuffer(buffer) {
		return buffer instanceof Uint8Array || Buffer.isBuffer(buffer);
	}
	function validateHandler(handler, method, upgrade) {
		if (!handler || typeof handler !== "object") throw new InvalidArgumentError("handler must be an object");
		if (typeof handler.onConnect !== "function") throw new InvalidArgumentError("invalid onConnect method");
		if (typeof handler.onError !== "function") throw new InvalidArgumentError("invalid onError method");
		if (typeof handler.onBodySent !== "function" && handler.onBodySent !== void 0) throw new InvalidArgumentError("invalid onBodySent method");
		if (upgrade || method === "CONNECT") {
			if (typeof handler.onUpgrade !== "function") throw new InvalidArgumentError("invalid onUpgrade method");
		} else {
			if (typeof handler.onHeaders !== "function") throw new InvalidArgumentError("invalid onHeaders method");
			if (typeof handler.onData !== "function") throw new InvalidArgumentError("invalid onData method");
			if (typeof handler.onComplete !== "function") throw new InvalidArgumentError("invalid onComplete method");
		}
	}
	function isDisturbed(body) {
		return !!(body && (stream.isDisturbed(body) || body[kBodyUsed]));
	}
	function isErrored(body) {
		return !!(body && stream.isErrored(body));
	}
	function isReadable(body) {
		return !!(body && stream.isReadable(body));
	}
	function getSocketInfo(socket) {
		return {
			localAddress: socket.localAddress,
			localPort: socket.localPort,
			remoteAddress: socket.remoteAddress,
			remotePort: socket.remotePort,
			remoteFamily: socket.remoteFamily,
			timeout: socket.timeout,
			bytesWritten: socket.bytesWritten,
			bytesRead: socket.bytesRead
		};
	}
	/** @type {globalThis['ReadableStream']} */
	function ReadableStreamFrom(iterable) {
		let iterator;
		return new ReadableStream({
			async start() {
				iterator = iterable[Symbol.asyncIterator]();
			},
			async pull(controller) {
				const { done, value } = await iterator.next();
				if (done) queueMicrotask(() => {
					controller.close();
					controller.byobRequest?.respond(0);
				});
				else {
					const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
					if (buf.byteLength) controller.enqueue(new Uint8Array(buf));
				}
				return controller.desiredSize > 0;
			},
			async cancel(reason) {
				await iterator.return();
			},
			type: "bytes"
		});
	}
	function isFormDataLike(object) {
		return object && typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && object[Symbol.toStringTag] === "FormData";
	}
	function addAbortListener(signal, listener) {
		if ("addEventListener" in signal) {
			signal.addEventListener("abort", listener, { once: true });
			return () => signal.removeEventListener("abort", listener);
		}
		signal.addListener("abort", listener);
		return () => signal.removeListener("abort", listener);
	}
	var hasToWellFormed = typeof String.prototype.toWellFormed === "function";
	var hasIsWellFormed = typeof String.prototype.isWellFormed === "function";
	/**
	* @param {string} val
	*/
	function toUSVString(val) {
		return hasToWellFormed ? `${val}`.toWellFormed() : nodeUtil$3.toUSVString(val);
	}
	/**
	* @param {string} val
	*/
	function isUSVString(val) {
		return hasIsWellFormed ? `${val}`.isWellFormed() : toUSVString(val) === `${val}`;
	}
	/**
	* @see https://tools.ietf.org/html/rfc7230#section-3.2.6
	* @param {number} c
	*/
	function isTokenCharCode(c) {
		switch (c) {
			case 34:
			case 40:
			case 41:
			case 44:
			case 47:
			case 58:
			case 59:
			case 60:
			case 61:
			case 62:
			case 63:
			case 64:
			case 91:
			case 92:
			case 93:
			case 123:
			case 125: return false;
			default: return c >= 33 && c <= 126;
		}
	}
	/**
	* @param {string} characters
	*/
	function isValidHTTPToken(characters) {
		if (characters.length === 0) return false;
		for (let i = 0; i < characters.length; ++i) if (!isTokenCharCode(characters.charCodeAt(i))) return false;
		return true;
	}
	/**
	* Matches if val contains an invalid field-vchar
	*  field-value    = *( field-content / obs-fold )
	*  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
	*  field-vchar    = VCHAR / obs-text
	*/
	var headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
	/**
	* @param {string} characters
	*/
	function isValidHeaderValue(characters) {
		return !headerCharRegex.test(characters);
	}
	function parseRangeHeader(range) {
		if (range == null || range === "") return {
			start: 0,
			end: null,
			size: null
		};
		const m = range ? range.match(/^bytes (\d+)-(\d+)\/(\d+)?$/) : null;
		return m ? {
			start: parseInt(m[1]),
			end: m[2] ? parseInt(m[2]) : null,
			size: m[3] ? parseInt(m[3]) : null
		} : null;
	}
	function addListener(obj, name, listener) {
		(obj[kListeners] ??= []).push([name, listener]);
		obj.on(name, listener);
		return obj;
	}
	function removeAllListeners(obj) {
		for (const [name, listener] of obj[kListeners] ?? []) obj.removeListener(name, listener);
		obj[kListeners] = null;
	}
	function errorRequest(client, request, err) {
		try {
			request.onError(err);
			assert$26(request.aborted);
		} catch (err) {
			client.emit("error", err);
		}
	}
	var kEnumerableProperty = Object.create(null);
	kEnumerableProperty.enumerable = true;
	var normalizedMethodRecordsBase = {
		delete: "DELETE",
		DELETE: "DELETE",
		get: "GET",
		GET: "GET",
		head: "HEAD",
		HEAD: "HEAD",
		options: "OPTIONS",
		OPTIONS: "OPTIONS",
		post: "POST",
		POST: "POST",
		put: "PUT",
		PUT: "PUT"
	};
	var normalizedMethodRecords = {
		...normalizedMethodRecordsBase,
		patch: "patch",
		PATCH: "PATCH"
	};
	Object.setPrototypeOf(normalizedMethodRecordsBase, null);
	Object.setPrototypeOf(normalizedMethodRecords, null);
	module.exports = {
		kEnumerableProperty,
		nop,
		isDisturbed,
		isErrored,
		isReadable,
		toUSVString,
		isUSVString,
		isBlobLike,
		parseOrigin,
		parseURL,
		getServerName,
		isStream,
		isIterable,
		isAsyncIterable,
		isDestroyed,
		headerNameToString,
		bufferToLowerCasedHeaderName,
		addListener,
		removeAllListeners,
		errorRequest,
		parseRawHeaders,
		parseHeaders,
		parseKeepAliveTimeout,
		destroy,
		bodyLength,
		deepClone,
		ReadableStreamFrom,
		isBuffer,
		validateHandler,
		getSocketInfo,
		isFormDataLike,
		buildURL,
		addAbortListener,
		isValidHTTPToken,
		isValidHeaderValue,
		isTokenCharCode,
		parseRangeHeader,
		normalizedMethodRecordsBase,
		normalizedMethodRecords,
		isValidPort,
		isHttpOrHttpsPrefixed,
		nodeMajor,
		nodeMinor,
		safeHTTPMethods: [
			"GET",
			"HEAD",
			"OPTIONS",
			"TRACE"
		],
		wrapRequestBody
	};
}));
//#endregion
//#region node_modules/undici/lib/core/diagnostics.js
var require_diagnostics = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var diagnosticsChannel = __require("node:diagnostics_channel");
	var util$1 = __require("node:util");
	var undiciDebugLog = util$1.debuglog("undici");
	var fetchDebuglog = util$1.debuglog("fetch");
	var websocketDebuglog = util$1.debuglog("websocket");
	var isClientSet = false;
	var channels = {
		beforeConnect: diagnosticsChannel.channel("undici:client:beforeConnect"),
		connected: diagnosticsChannel.channel("undici:client:connected"),
		connectError: diagnosticsChannel.channel("undici:client:connectError"),
		sendHeaders: diagnosticsChannel.channel("undici:client:sendHeaders"),
		create: diagnosticsChannel.channel("undici:request:create"),
		bodySent: diagnosticsChannel.channel("undici:request:bodySent"),
		headers: diagnosticsChannel.channel("undici:request:headers"),
		trailers: diagnosticsChannel.channel("undici:request:trailers"),
		error: diagnosticsChannel.channel("undici:request:error"),
		open: diagnosticsChannel.channel("undici:websocket:open"),
		close: diagnosticsChannel.channel("undici:websocket:close"),
		socketError: diagnosticsChannel.channel("undici:websocket:socket_error"),
		ping: diagnosticsChannel.channel("undici:websocket:ping"),
		pong: diagnosticsChannel.channel("undici:websocket:pong")
	};
	if (undiciDebugLog.enabled || fetchDebuglog.enabled) {
		const debuglog = fetchDebuglog.enabled ? fetchDebuglog : undiciDebugLog;
		diagnosticsChannel.channel("undici:client:beforeConnect").subscribe((evt) => {
			const { connectParams: { version, protocol, port, host } } = evt;
			debuglog("connecting to %s using %s%s", `${host}${port ? `:${port}` : ""}`, protocol, version);
		});
		diagnosticsChannel.channel("undici:client:connected").subscribe((evt) => {
			const { connectParams: { version, protocol, port, host } } = evt;
			debuglog("connected to %s using %s%s", `${host}${port ? `:${port}` : ""}`, protocol, version);
		});
		diagnosticsChannel.channel("undici:client:connectError").subscribe((evt) => {
			const { connectParams: { version, protocol, port, host }, error } = evt;
			debuglog("connection to %s using %s%s errored - %s", `${host}${port ? `:${port}` : ""}`, protocol, version, error.message);
		});
		diagnosticsChannel.channel("undici:client:sendHeaders").subscribe((evt) => {
			const { request: { method, path, origin } } = evt;
			debuglog("sending request to %s %s/%s", method, origin, path);
		});
		diagnosticsChannel.channel("undici:request:headers").subscribe((evt) => {
			const { request: { method, path, origin }, response: { statusCode } } = evt;
			debuglog("received response to %s %s/%s - HTTP %d", method, origin, path, statusCode);
		});
		diagnosticsChannel.channel("undici:request:trailers").subscribe((evt) => {
			const { request: { method, path, origin } } = evt;
			debuglog("trailers received from %s %s/%s", method, origin, path);
		});
		diagnosticsChannel.channel("undici:request:error").subscribe((evt) => {
			const { request: { method, path, origin }, error } = evt;
			debuglog("request to %s %s/%s errored - %s", method, origin, path, error.message);
		});
		isClientSet = true;
	}
	if (websocketDebuglog.enabled) {
		if (!isClientSet) {
			const debuglog = undiciDebugLog.enabled ? undiciDebugLog : websocketDebuglog;
			diagnosticsChannel.channel("undici:client:beforeConnect").subscribe((evt) => {
				const { connectParams: { version, protocol, port, host } } = evt;
				debuglog("connecting to %s%s using %s%s", host, port ? `:${port}` : "", protocol, version);
			});
			diagnosticsChannel.channel("undici:client:connected").subscribe((evt) => {
				const { connectParams: { version, protocol, port, host } } = evt;
				debuglog("connected to %s%s using %s%s", host, port ? `:${port}` : "", protocol, version);
			});
			diagnosticsChannel.channel("undici:client:connectError").subscribe((evt) => {
				const { connectParams: { version, protocol, port, host }, error } = evt;
				debuglog("connection to %s%s using %s%s errored - %s", host, port ? `:${port}` : "", protocol, version, error.message);
			});
			diagnosticsChannel.channel("undici:client:sendHeaders").subscribe((evt) => {
				const { request: { method, path, origin } } = evt;
				debuglog("sending request to %s %s/%s", method, origin, path);
			});
		}
		diagnosticsChannel.channel("undici:websocket:open").subscribe((evt) => {
			const { address: { address, port } } = evt;
			websocketDebuglog("connection opened %s%s", address, port ? `:${port}` : "");
		});
		diagnosticsChannel.channel("undici:websocket:close").subscribe((evt) => {
			const { websocket, code, reason } = evt;
			websocketDebuglog("closed connection to %s - %s %s", websocket.url, code, reason);
		});
		diagnosticsChannel.channel("undici:websocket:socket_error").subscribe((err) => {
			websocketDebuglog("connection errored - %s", err.message);
		});
		diagnosticsChannel.channel("undici:websocket:ping").subscribe((evt) => {
			websocketDebuglog("ping received");
		});
		diagnosticsChannel.channel("undici:websocket:pong").subscribe((evt) => {
			websocketDebuglog("pong received");
		});
	}
	module.exports = { channels };
}));
//#endregion
//#region node_modules/undici/lib/core/request.js
var require_request$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { InvalidArgumentError, NotSupportedError } = require_errors$1();
	var assert$25 = __require("node:assert");
	var { isValidHTTPToken, isValidHeaderValue, isStream, destroy, isBuffer, isFormDataLike, isIterable, isBlobLike, buildURL, validateHandler, getServerName, normalizedMethodRecords } = require_util$8();
	var { channels } = require_diagnostics();
	var { headerNameLowerCasedRecord } = require_constants$5();
	var invalidPathRegex = /[^\u0021-\u00ff]/;
	var kHandler = Symbol("handler");
	var Request = class {
		constructor(origin, { path, method, body, headers, query, idempotent, blocking, upgrade, headersTimeout, bodyTimeout, reset, throwOnError, expectContinue, servername }, handler) {
			if (typeof path !== "string") throw new InvalidArgumentError("path must be a string");
			else if (path[0] !== "/" && !(path.startsWith("http://") || path.startsWith("https://")) && method !== "CONNECT") throw new InvalidArgumentError("path must be an absolute URL or start with a slash");
			else if (invalidPathRegex.test(path)) throw new InvalidArgumentError("invalid request path");
			if (typeof method !== "string") throw new InvalidArgumentError("method must be a string");
			else if (normalizedMethodRecords[method] === void 0 && !isValidHTTPToken(method)) throw new InvalidArgumentError("invalid request method");
			if (upgrade && typeof upgrade !== "string") throw new InvalidArgumentError("upgrade must be a string");
			if (upgrade && !isValidHeaderValue(upgrade)) throw new InvalidArgumentError("invalid upgrade header");
			if (headersTimeout != null && (!Number.isFinite(headersTimeout) || headersTimeout < 0)) throw new InvalidArgumentError("invalid headersTimeout");
			if (bodyTimeout != null && (!Number.isFinite(bodyTimeout) || bodyTimeout < 0)) throw new InvalidArgumentError("invalid bodyTimeout");
			if (reset != null && typeof reset !== "boolean") throw new InvalidArgumentError("invalid reset");
			if (expectContinue != null && typeof expectContinue !== "boolean") throw new InvalidArgumentError("invalid expectContinue");
			this.headersTimeout = headersTimeout;
			this.bodyTimeout = bodyTimeout;
			this.throwOnError = throwOnError === true;
			this.method = method;
			this.abort = null;
			if (body == null) this.body = null;
			else if (isStream(body)) {
				this.body = body;
				const rState = this.body._readableState;
				if (!rState || !rState.autoDestroy) {
					this.endHandler = function autoDestroy() {
						destroy(this);
					};
					this.body.on("end", this.endHandler);
				}
				this.errorHandler = (err) => {
					if (this.abort) this.abort(err);
					else this.error = err;
				};
				this.body.on("error", this.errorHandler);
			} else if (isBuffer(body)) this.body = body.byteLength ? body : null;
			else if (ArrayBuffer.isView(body)) this.body = body.buffer.byteLength ? Buffer.from(body.buffer, body.byteOffset, body.byteLength) : null;
			else if (body instanceof ArrayBuffer) this.body = body.byteLength ? Buffer.from(body) : null;
			else if (typeof body === "string") this.body = body.length ? Buffer.from(body) : null;
			else if (isFormDataLike(body) || isIterable(body) || isBlobLike(body)) this.body = body;
			else throw new InvalidArgumentError("body must be a string, a Buffer, a Readable stream, an iterable, or an async iterable");
			this.completed = false;
			this.aborted = false;
			this.upgrade = upgrade || null;
			this.path = query ? buildURL(path, query) : path;
			this.origin = origin;
			this.idempotent = idempotent == null ? method === "HEAD" || method === "GET" : idempotent;
			this.blocking = blocking == null ? false : blocking;
			this.reset = reset == null ? null : reset;
			this.host = null;
			this.contentLength = null;
			this.contentType = null;
			this.headers = [];
			this.expectContinue = expectContinue != null ? expectContinue : false;
			if (Array.isArray(headers)) {
				if (headers.length % 2 !== 0) throw new InvalidArgumentError("headers array must be even");
				for (let i = 0; i < headers.length; i += 2) processHeader(this, headers[i], headers[i + 1]);
			} else if (headers && typeof headers === "object") {
				if (headers[Symbol.iterator]) for (const header of headers) {
					if (!Array.isArray(header) || header.length !== 2) throw new InvalidArgumentError("headers must be in key-value pair format");
					processHeader(this, header[0], header[1]);
				}
				else {
					const keys = Object.keys(headers);
					for (let i = 0; i < keys.length; ++i) processHeader(this, keys[i], headers[keys[i]]);
				}
			} else if (headers != null) throw new InvalidArgumentError("headers must be an object or an array");
			validateHandler(handler, method, upgrade);
			this.servername = servername || getServerName(this.host);
			this[kHandler] = handler;
			if (channels.create.hasSubscribers) channels.create.publish({ request: this });
		}
		onBodySent(chunk) {
			if (this[kHandler].onBodySent) try {
				return this[kHandler].onBodySent(chunk);
			} catch (err) {
				this.abort(err);
			}
		}
		onRequestSent() {
			if (channels.bodySent.hasSubscribers) channels.bodySent.publish({ request: this });
			if (this[kHandler].onRequestSent) try {
				return this[kHandler].onRequestSent();
			} catch (err) {
				this.abort(err);
			}
		}
		onConnect(abort) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			if (this.error) abort(this.error);
			else {
				this.abort = abort;
				return this[kHandler].onConnect(abort);
			}
		}
		onResponseStarted() {
			return this[kHandler].onResponseStarted?.();
		}
		onHeaders(statusCode, headers, resume, statusText) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			if (channels.headers.hasSubscribers) channels.headers.publish({
				request: this,
				response: {
					statusCode,
					headers,
					statusText
				}
			});
			try {
				return this[kHandler].onHeaders(statusCode, headers, resume, statusText);
			} catch (err) {
				this.abort(err);
			}
		}
		onData(chunk) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			try {
				return this[kHandler].onData(chunk);
			} catch (err) {
				this.abort(err);
				return false;
			}
		}
		/**
		* @param {number|null} statusCode
		* @param {Buffer[]|null} headers
		* @param {import('node:stream').Duplex} socket
		* @param {string} [statusText]
		*/
		onUpgrade(statusCode, headers, socket, statusText = "") {
			this.onFinally();
			assert$25(!this.aborted);
			assert$25(!this.completed);
			if (statusCode !== null) this.#publishUpgradeHeaders(statusCode, headers, statusText);
			const result = this[kHandler].onUpgrade(statusCode, headers, socket);
			if (!this.aborted) {
				this.completed = true;
				if (statusCode !== null) this.#publishUpgradeTrailers();
			}
			return result;
		}
		/**
		* @param {number} statusCode
		* @param {import('node:http2').IncomingHttpHeaders} headers
		* @param {(headers: import('node:http2').IncomingHttpHeaders) => Buffer[]} parseHeaders
		* @param {string} [statusText]
		*/
		onUpgradeResponse(statusCode, headers, parseHeaders, statusText = "") {
			assert$25(!this.aborted);
			assert$25(this.completed);
			if (channels.headers.hasSubscribers) this.#publishUpgradeHeaders(statusCode, parseHeaders(headers), statusText);
			this.#publishUpgradeTrailers();
		}
		/**
		* @param {Error} error
		*/
		onUpgradeError(error) {
			assert$25(!this.aborted);
			assert$25(this.completed);
			if (channels.error.hasSubscribers) channels.error.publish({
				request: this,
				error
			});
		}
		/**
		* @param {number} statusCode
		* @param {Buffer[]} headers
		* @param {string} statusText
		*/
		#publishUpgradeHeaders(statusCode, headers, statusText) {
			if (channels.headers.hasSubscribers) channels.headers.publish({
				request: this,
				response: {
					statusCode,
					headers,
					statusText
				}
			});
		}
		#publishUpgradeTrailers() {
			if (channels.trailers.hasSubscribers) channels.trailers.publish({
				request: this,
				trailers: []
			});
		}
		onComplete(trailers) {
			this.onFinally();
			assert$25(!this.aborted);
			this.completed = true;
			if (channels.trailers.hasSubscribers) channels.trailers.publish({
				request: this,
				trailers
			});
			try {
				return this[kHandler].onComplete(trailers);
			} catch (err) {
				this.onError(err);
			}
		}
		onError(error) {
			this.onFinally();
			if (channels.error.hasSubscribers) channels.error.publish({
				request: this,
				error
			});
			if (this.aborted) return;
			this.aborted = true;
			return this[kHandler].onError(error);
		}
		onFinally() {
			if (this.errorHandler) {
				this.body.off("error", this.errorHandler);
				this.errorHandler = null;
			}
			if (this.endHandler) {
				this.body.off("end", this.endHandler);
				this.endHandler = null;
			}
		}
		addHeader(key, value) {
			processHeader(this, key, value);
			return this;
		}
	};
	function processHeader(request, key, val) {
		if (val && typeof val === "object" && !Array.isArray(val)) throw new InvalidArgumentError(`invalid ${key} header`);
		else if (val === void 0) return;
		let headerName = headerNameLowerCasedRecord[key];
		if (headerName === void 0) {
			headerName = key.toLowerCase();
			if (headerNameLowerCasedRecord[headerName] === void 0 && !isValidHTTPToken(headerName)) throw new InvalidArgumentError("invalid header key");
		}
		if (Array.isArray(val)) {
			const arr = [];
			for (let i = 0; i < val.length; i++) if (typeof val[i] === "string") {
				if (!isValidHeaderValue(val[i])) throw new InvalidArgumentError(`invalid ${key} header`);
				arr.push(val[i]);
			} else if (val[i] === null) arr.push("");
			else if (typeof val[i] === "object") throw new InvalidArgumentError(`invalid ${key} header`);
			else {
				const str = `${val[i]}`;
				if (!isValidHeaderValue(str)) throw new InvalidArgumentError(`invalid ${key} header`);
				arr.push(str);
			}
			val = arr;
		} else if (typeof val === "string") {
			if (!isValidHeaderValue(val)) throw new InvalidArgumentError(`invalid ${key} header`);
		} else if (val === null) val = "";
		else {
			val = `${val}`;
			if (!isValidHeaderValue(val)) throw new InvalidArgumentError(`invalid ${key} header`);
		}
		if (headerName === "host") {
			if (request.host !== null) throw new InvalidArgumentError("duplicate host header");
			if (typeof val !== "string") throw new InvalidArgumentError("invalid host header");
			request.host = val;
		} else if (headerName === "content-length") {
			if (request.contentLength !== null) throw new InvalidArgumentError("duplicate content-length header");
			request.contentLength = parseInt(val, 10);
			if (!Number.isFinite(request.contentLength)) throw new InvalidArgumentError("invalid content-length header");
		} else if (request.contentType === null && headerName === "content-type") {
			request.contentType = val;
			request.headers.push(key, val);
		} else if (headerName === "transfer-encoding" || headerName === "keep-alive" || headerName === "upgrade") throw new InvalidArgumentError(`invalid ${headerName} header`);
		else if (headerName === "connection") {
			const value = typeof val === "string" ? val.toLowerCase() : null;
			if (value !== "close" && value !== "keep-alive") throw new InvalidArgumentError("invalid connection header");
			if (value === "close") request.reset = true;
		} else if (headerName === "expect") throw new NotSupportedError("expect header not supported");
		else request.headers.push(key, val);
	}
	module.exports = Request;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/dispatcher.js
var require_dispatcher = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$1 = __require("node:events");
	var Dispatcher = class extends EventEmitter$1 {
		dispatch() {
			throw new Error("not implemented");
		}
		close() {
			throw new Error("not implemented");
		}
		destroy() {
			throw new Error("not implemented");
		}
		compose(...args) {
			const interceptors = Array.isArray(args[0]) ? args[0] : args;
			let dispatch = this.dispatch.bind(this);
			for (const interceptor of interceptors) {
				if (interceptor == null) continue;
				if (typeof interceptor !== "function") throw new TypeError(`invalid interceptor, expected function received ${typeof interceptor}`);
				dispatch = interceptor(dispatch);
				if (dispatch == null || typeof dispatch !== "function" || dispatch.length !== 2) throw new TypeError("invalid interceptor");
			}
			return new ComposedDispatcher(this, dispatch);
		}
	};
	var ComposedDispatcher = class extends Dispatcher {
		#dispatcher = null;
		#dispatch = null;
		constructor(dispatcher, dispatch) {
			super();
			this.#dispatcher = dispatcher;
			this.#dispatch = dispatch;
		}
		dispatch(...args) {
			this.#dispatch(...args);
		}
		close(...args) {
			return this.#dispatcher.close(...args);
		}
		destroy(...args) {
			return this.#dispatcher.destroy(...args);
		}
	};
	module.exports = Dispatcher;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/dispatcher-base.js
var require_dispatcher_base = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Dispatcher = require_dispatcher();
	var { ClientDestroyedError, ClientClosedError, InvalidArgumentError } = require_errors$1();
	var { kDestroy, kClose, kClosed, kDestroyed, kDispatch, kInterceptors } = require_symbols$4();
	var kOnDestroyed = Symbol("onDestroyed");
	var kOnClosed = Symbol("onClosed");
	var kInterceptedDispatch = Symbol("Intercepted Dispatch");
	var kWebSocketOptions = Symbol("webSocketOptions");
	var DispatcherBase = class extends Dispatcher {
		constructor(opts) {
			super();
			this[kDestroyed] = false;
			this[kOnDestroyed] = null;
			this[kClosed] = false;
			this[kOnClosed] = [];
			this[kWebSocketOptions] = opts?.webSocket ?? {};
		}
		get webSocketOptions() {
			return {
				maxFragments: this[kWebSocketOptions].maxFragments ?? 131072,
				maxPayloadSize: this[kWebSocketOptions].maxPayloadSize ?? 134217728
			};
		}
		get destroyed() {
			return this[kDestroyed];
		}
		get closed() {
			return this[kClosed];
		}
		get interceptors() {
			return this[kInterceptors];
		}
		set interceptors(newInterceptors) {
			if (newInterceptors) {
				for (let i = newInterceptors.length - 1; i >= 0; i--) if (typeof this[kInterceptors][i] !== "function") throw new InvalidArgumentError("interceptor must be an function");
			}
			this[kInterceptors] = newInterceptors;
		}
		close(callback) {
			if (callback === void 0) return new Promise((resolve, reject) => {
				this.close((err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			if (this[kDestroyed]) {
				queueMicrotask(() => callback(new ClientDestroyedError(), null));
				return;
			}
			if (this[kClosed]) {
				if (this[kOnClosed]) this[kOnClosed].push(callback);
				else queueMicrotask(() => callback(null, null));
				return;
			}
			this[kClosed] = true;
			this[kOnClosed].push(callback);
			const onClosed = () => {
				const callbacks = this[kOnClosed];
				this[kOnClosed] = null;
				for (let i = 0; i < callbacks.length; i++) callbacks[i](null, null);
			};
			this[kClose]().then(() => this.destroy()).then(() => {
				queueMicrotask(onClosed);
			});
		}
		destroy(err, callback) {
			if (typeof err === "function") {
				callback = err;
				err = null;
			}
			if (callback === void 0) return new Promise((resolve, reject) => {
				this.destroy(err, (err, data) => {
					return err ? /* istanbul ignore next: should never error */ reject(err) : resolve(data);
				});
			});
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			if (this[kDestroyed]) {
				if (this[kOnDestroyed]) this[kOnDestroyed].push(callback);
				else queueMicrotask(() => callback(null, null));
				return;
			}
			if (!err) err = new ClientDestroyedError();
			this[kDestroyed] = true;
			this[kOnDestroyed] = this[kOnDestroyed] || [];
			this[kOnDestroyed].push(callback);
			const onDestroyed = () => {
				const callbacks = this[kOnDestroyed];
				this[kOnDestroyed] = null;
				for (let i = 0; i < callbacks.length; i++) callbacks[i](null, null);
			};
			this[kDestroy](err).then(() => {
				queueMicrotask(onDestroyed);
			});
		}
		[kInterceptedDispatch](opts, handler) {
			if (!this[kInterceptors] || this[kInterceptors].length === 0) {
				this[kInterceptedDispatch] = this[kDispatch];
				return this[kDispatch](opts, handler);
			}
			let dispatch = this[kDispatch].bind(this);
			for (let i = this[kInterceptors].length - 1; i >= 0; i--) dispatch = this[kInterceptors][i](dispatch);
			this[kInterceptedDispatch] = dispatch;
			return dispatch(opts, handler);
		}
		dispatch(opts, handler) {
			if (!handler || typeof handler !== "object") throw new InvalidArgumentError("handler must be an object");
			try {
				if (!opts || typeof opts !== "object") throw new InvalidArgumentError("opts must be an object.");
				if (this[kDestroyed] || this[kOnDestroyed]) throw new ClientDestroyedError();
				if (this[kClosed]) throw new ClientClosedError();
				return this[kInterceptedDispatch](opts, handler);
			} catch (err) {
				if (typeof handler.onError !== "function") throw new InvalidArgumentError("invalid onError method");
				handler.onError(err);
				return false;
			}
		}
	};
	module.exports = DispatcherBase;
}));
//#endregion
//#region node_modules/undici/lib/util/timers.js
var require_timers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This module offers an optimized timer implementation designed for scenarios
	* where high precision is not critical.
	*
	* The timer achieves faster performance by using a low-resolution approach,
	* with an accuracy target of within 500ms. This makes it particularly useful
	* for timers with delays of 1 second or more, where exact timing is less
	* crucial.
	*
	* It's important to note that Node.js timers are inherently imprecise, as
	* delays can occur due to the event loop being blocked by other operations.
	* Consequently, timers may trigger later than their scheduled time.
	*/
	/**
	* The fastNow variable contains the internal fast timer clock value.
	*
	* @type {number}
	*/
	var fastNow = 0;
	/**
	* RESOLUTION_MS represents the target resolution time in milliseconds.
	*
	* @type {number}
	* @default 1000
	*/
	var RESOLUTION_MS = 1e3;
	/**
	* TICK_MS defines the desired interval in milliseconds between each tick.
	* The target value is set to half the resolution time, minus 1 ms, to account
	* for potential event loop overhead.
	*
	* @type {number}
	* @default 499
	*/
	var TICK_MS = 499;
	/**
	* fastNowTimeout is a Node.js timer used to manage and process
	* the FastTimers stored in the `fastTimers` array.
	*
	* @type {NodeJS.Timeout}
	*/
	var fastNowTimeout;
	/**
	* The kFastTimer symbol is used to identify FastTimer instances.
	*
	* @type {Symbol}
	*/
	var kFastTimer = Symbol("kFastTimer");
	/**
	* The fastTimers array contains all active FastTimers.
	*
	* @type {FastTimer[]}
	*/
	var fastTimers = [];
	/**
	* These constants represent the various states of a FastTimer.
	*/
	/**
	* The `NOT_IN_LIST` constant indicates that the FastTimer is not included
	* in the `fastTimers` array. Timers with this status will not be processed
	* during the next tick by the `onTick` function.
	*
	* A FastTimer can be re-added to the `fastTimers` array by invoking the
	* `refresh` method on the FastTimer instance.
	*
	* @type {-2}
	*/
	var NOT_IN_LIST = -2;
	/**
	* The `TO_BE_CLEARED` constant indicates that the FastTimer is scheduled
	* for removal from the `fastTimers` array. A FastTimer in this state will
	* be removed in the next tick by the `onTick` function and will no longer
	* be processed.
	*
	* This status is also set when the `clear` method is called on the FastTimer instance.
	*
	* @type {-1}
	*/
	var TO_BE_CLEARED = -1;
	/**
	* The `PENDING` constant signifies that the FastTimer is awaiting processing
	* in the next tick by the `onTick` function. Timers with this status will have
	* their `_idleStart` value set and their status updated to `ACTIVE` in the next tick.
	*
	* @type {0}
	*/
	var PENDING = 0;
	/**
	* The `ACTIVE` constant indicates that the FastTimer is active and waiting
	* for its timer to expire. During the next tick, the `onTick` function will
	* check if the timer has expired, and if so, it will execute the associated callback.
	*
	* @type {1}
	*/
	var ACTIVE = 1;
	/**
	* The onTick function processes the fastTimers array.
	*
	* @returns {void}
	*/
	function onTick() {
		/**
		* Increment the fastNow value by the TICK_MS value, despite the actual time
		* that has passed since the last tick. This approach ensures independence
		* from the system clock and delays caused by a blocked event loop.
		*
		* @type {number}
		*/
		fastNow += TICK_MS;
		/**
		* The `idx` variable is used to iterate over the `fastTimers` array.
		* Expired timers are removed by replacing them with the last element in the array.
		* Consequently, `idx` is only incremented when the current element is not removed.
		*
		* @type {number}
		*/
		let idx = 0;
		/**
		* The len variable will contain the length of the fastTimers array
		* and will be decremented when a FastTimer should be removed from the
		* fastTimers array.
		*
		* @type {number}
		*/
		let len = fastTimers.length;
		while (idx < len) {
			/**
			* @type {FastTimer}
			*/
			const timer = fastTimers[idx];
			if (timer._state === PENDING) {
				timer._idleStart = fastNow - TICK_MS;
				timer._state = ACTIVE;
			} else if (timer._state === ACTIVE && fastNow >= timer._idleStart + timer._idleTimeout) {
				timer._state = TO_BE_CLEARED;
				timer._idleStart = -1;
				timer._onTimeout(timer._timerArg);
			}
			if (timer._state === TO_BE_CLEARED) {
				timer._state = NOT_IN_LIST;
				if (--len !== 0) fastTimers[idx] = fastTimers[len];
			} else ++idx;
		}
		fastTimers.length = len;
		if (fastTimers.length !== 0) refreshTimeout();
	}
	function refreshTimeout() {
		if (fastNowTimeout) fastNowTimeout.refresh();
		else {
			clearTimeout(fastNowTimeout);
			fastNowTimeout = setTimeout(onTick, TICK_MS);
			if (fastNowTimeout.unref) fastNowTimeout.unref();
		}
	}
	/**
	* The `FastTimer` class is a data structure designed to store and manage
	* timer information.
	*/
	var FastTimer = class {
		[kFastTimer] = true;
		/**
		* The state of the timer, which can be one of the following:
		* - NOT_IN_LIST (-2)
		* - TO_BE_CLEARED (-1)
		* - PENDING (0)
		* - ACTIVE (1)
		*
		* @type {-2|-1|0|1}
		* @private
		*/
		_state = NOT_IN_LIST;
		/**
		* The number of milliseconds to wait before calling the callback.
		*
		* @type {number}
		* @private
		*/
		_idleTimeout = -1;
		/**
		* The time in milliseconds when the timer was started. This value is used to
		* calculate when the timer should expire.
		*
		* @type {number}
		* @default -1
		* @private
		*/
		_idleStart = -1;
		/**
		* The function to be executed when the timer expires.
		* @type {Function}
		* @private
		*/
		_onTimeout;
		/**
		* The argument to be passed to the callback when the timer expires.
		*
		* @type {*}
		* @private
		*/
		_timerArg;
		/**
		* @constructor
		* @param {Function} callback A function to be executed after the timer
		* expires.
		* @param {number} delay The time, in milliseconds that the timer should wait
		* before the specified function or code is executed.
		* @param {*} arg
		*/
		constructor(callback, delay, arg) {
			this._onTimeout = callback;
			this._idleTimeout = delay;
			this._timerArg = arg;
			this.refresh();
		}
		/**
		* Sets the timer's start time to the current time, and reschedules the timer
		* to call its callback at the previously specified duration adjusted to the
		* current time.
		* Using this on a timer that has already called its callback will reactivate
		* the timer.
		*
		* @returns {void}
		*/
		refresh() {
			if (this._state === NOT_IN_LIST) fastTimers.push(this);
			if (!fastNowTimeout || fastTimers.length === 1) refreshTimeout();
			this._state = PENDING;
		}
		/**
		* The `clear` method cancels the timer, preventing it from executing.
		*
		* @returns {void}
		* @private
		*/
		clear() {
			this._state = TO_BE_CLEARED;
			this._idleStart = -1;
		}
	};
	/**
	* This module exports a setTimeout and clearTimeout function that can be
	* used as a drop-in replacement for the native functions.
	*/
	module.exports = {
		/**
		* The setTimeout() method sets a timer which executes a function once the
		* timer expires.
		* @param {Function} callback A function to be executed after the timer
		* expires.
		* @param {number} delay The time, in milliseconds that the timer should
		* wait before the specified function or code is executed.
		* @param {*} [arg] An optional argument to be passed to the callback function
		* when the timer expires.
		* @returns {NodeJS.Timeout|FastTimer}
		*/
		setTimeout(callback, delay, arg) {
			return delay <= RESOLUTION_MS ? setTimeout(callback, delay, arg) : new FastTimer(callback, delay, arg);
		},
		/**
		* The clearTimeout method cancels an instantiated Timer previously created
		* by calling setTimeout.
		*
		* @param {NodeJS.Timeout|FastTimer} timeout
		*/
		clearTimeout(timeout) {
			if (timeout[kFastTimer])
 /**
			* @type {FastTimer}
			*/
			timeout.clear();
			else clearTimeout(timeout);
		},
		/**
		* The setFastTimeout() method sets a fastTimer which executes a function once
		* the timer expires.
		* @param {Function} callback A function to be executed after the timer
		* expires.
		* @param {number} delay The time, in milliseconds that the timer should
		* wait before the specified function or code is executed.
		* @param {*} [arg] An optional argument to be passed to the callback function
		* when the timer expires.
		* @returns {FastTimer}
		*/
		setFastTimeout(callback, delay, arg) {
			return new FastTimer(callback, delay, arg);
		},
		/**
		* The clearTimeout method cancels an instantiated FastTimer previously
		* created by calling setFastTimeout.
		*
		* @param {FastTimer} timeout
		*/
		clearFastTimeout(timeout) {
			timeout.clear();
		},
		/**
		* The now method returns the value of the internal fast timer clock.
		*
		* @returns {number}
		*/
		now() {
			return fastNow;
		},
		/**
		* Trigger the onTick function to process the fastTimers array.
		* Exported for testing purposes only.
		* Marking as deprecated to discourage any use outside of testing.
		* @deprecated
		* @param {number} [delay=0] The delay in milliseconds to add to the now value.
		*/
		tick(delay = 0) {
			fastNow += delay - RESOLUTION_MS + 1;
			onTick();
			onTick();
		},
		/**
		* Reset FastTimers.
		* Exported for testing purposes only.
		* Marking as deprecated to discourage any use outside of testing.
		* @deprecated
		*/
		reset() {
			fastNow = 0;
			fastTimers.length = 0;
			clearTimeout(fastNowTimeout);
			fastNowTimeout = null;
		},
		/**
		* Exporting for testing purposes only.
		* Marking as deprecated to discourage any use outside of testing.
		* @deprecated
		*/
		kFastTimer
	};
}));
//#endregion
//#region node_modules/undici/lib/core/connect.js
var require_connect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var net$1 = __require("node:net");
	var assert$24 = __require("node:assert");
	var util = require_util$8();
	var { InvalidArgumentError, ConnectTimeoutError } = require_errors$1();
	var timers = require_timers();
	function noop() {}
	var tls;
	var SessionCache;
	if (global.FinalizationRegistry && !(process.env.NODE_V8_COVERAGE || process.env.UNDICI_NO_FG)) SessionCache = class WeakSessionCache {
		constructor(maxCachedSessions) {
			this._maxCachedSessions = maxCachedSessions;
			this._sessionCache = /* @__PURE__ */ new Map();
			this._sessionRegistry = new global.FinalizationRegistry((key) => {
				if (this._sessionCache.size < this._maxCachedSessions) return;
				const ref = this._sessionCache.get(key);
				if (ref !== void 0 && ref.deref() === void 0) this._sessionCache.delete(key);
			});
		}
		get(sessionKey) {
			const ref = this._sessionCache.get(sessionKey);
			return ref ? ref.deref() : null;
		}
		set(sessionKey, session) {
			if (this._maxCachedSessions === 0) return;
			this._sessionCache.set(sessionKey, new WeakRef(session));
			this._sessionRegistry.register(session, sessionKey);
		}
	};
	else SessionCache = class SimpleSessionCache {
		constructor(maxCachedSessions) {
			this._maxCachedSessions = maxCachedSessions;
			this._sessionCache = /* @__PURE__ */ new Map();
		}
		get(sessionKey) {
			return this._sessionCache.get(sessionKey);
		}
		set(sessionKey, session) {
			if (this._maxCachedSessions === 0) return;
			if (this._sessionCache.size >= this._maxCachedSessions) {
				const { value: oldestKey } = this._sessionCache.keys().next();
				this._sessionCache.delete(oldestKey);
			}
			this._sessionCache.set(sessionKey, session);
		}
	};
	function buildConnector({ allowH2, maxCachedSessions, socketPath, timeout, session: customSession, ...opts }) {
		if (maxCachedSessions != null && (!Number.isInteger(maxCachedSessions) || maxCachedSessions < 0)) throw new InvalidArgumentError("maxCachedSessions must be a positive integer or zero");
		const options = {
			path: socketPath,
			...opts
		};
		const sessionCache = new SessionCache(maxCachedSessions == null ? 100 : maxCachedSessions);
		timeout = timeout == null ? 1e4 : timeout;
		allowH2 = allowH2 != null ? allowH2 : false;
		return function connect({ hostname, host, protocol, port, servername, localAddress, httpSocket }, callback) {
			let socket;
			if (protocol === "https:") {
				if (!tls) tls = __require("node:tls");
				servername = servername || options.servername || util.getServerName(host) || null;
				const sessionKey = servername || hostname;
				assert$24(sessionKey);
				const session = customSession || sessionCache.get(sessionKey) || null;
				port = port || 443;
				socket = tls.connect({
					highWaterMark: 16384,
					...options,
					servername,
					session,
					localAddress,
					ALPNProtocols: allowH2 ? ["http/1.1", "h2"] : ["http/1.1"],
					socket: httpSocket,
					port,
					host: hostname
				});
				socket.on("session", function(session) {
					sessionCache.set(sessionKey, session);
				});
			} else {
				assert$24(!httpSocket, "httpSocket can only be sent on TLS update");
				port = port || 80;
				socket = net$1.connect({
					highWaterMark: 65536,
					...options,
					localAddress,
					port,
					host: hostname
				});
			}
			if (options.keepAlive == null || options.keepAlive) {
				const keepAliveInitialDelay = options.keepAliveInitialDelay === void 0 ? 6e4 : options.keepAliveInitialDelay;
				socket.setKeepAlive(true, keepAliveInitialDelay);
			}
			const clearConnectTimeout = setupConnectTimeout(new WeakRef(socket), {
				timeout,
				hostname,
				port
			});
			socket.setNoDelay(true).once(protocol === "https:" ? "secureConnect" : "connect", function() {
				queueMicrotask(clearConnectTimeout);
				if (callback) {
					const cb = callback;
					callback = null;
					cb(null, this);
				}
			}).on("error", function(err) {
				queueMicrotask(clearConnectTimeout);
				if (callback) {
					const cb = callback;
					callback = null;
					cb(err);
				}
			});
			return socket;
		};
	}
	/**
	* @param {WeakRef<net.Socket>} socketWeakRef
	* @param {object} opts
	* @param {number} opts.timeout
	* @param {string} opts.hostname
	* @param {number} opts.port
	* @returns {() => void}
	*/
	var setupConnectTimeout = process.platform === "win32" ? (socketWeakRef, opts) => {
		if (!opts.timeout) return noop;
		let s1 = null;
		let s2 = null;
		const fastTimer = timers.setFastTimeout(() => {
			s1 = setImmediate(() => {
				s2 = setImmediate(() => onConnectTimeout(socketWeakRef.deref(), opts));
			});
		}, opts.timeout);
		return () => {
			timers.clearFastTimeout(fastTimer);
			clearImmediate(s1);
			clearImmediate(s2);
		};
	} : (socketWeakRef, opts) => {
		if (!opts.timeout) return noop;
		let s1 = null;
		const fastTimer = timers.setFastTimeout(() => {
			s1 = setImmediate(() => {
				onConnectTimeout(socketWeakRef.deref(), opts);
			});
		}, opts.timeout);
		return () => {
			timers.clearFastTimeout(fastTimer);
			clearImmediate(s1);
		};
	};
	/**
	* @param {net.Socket} socket
	* @param {object} opts
	* @param {number} opts.timeout
	* @param {string} opts.hostname
	* @param {number} opts.port
	*/
	function onConnectTimeout(socket, opts) {
		if (socket == null) return;
		let message = "Connect Timeout Error";
		if (Array.isArray(socket.autoSelectFamilyAttemptedAddresses)) message += ` (attempted addresses: ${socket.autoSelectFamilyAttemptedAddresses.join(", ")},`;
		else message += ` (attempted address: ${opts.hostname}:${opts.port},`;
		message += ` timeout: ${opts.timeout}ms)`;
		util.destroy(socket, new ConnectTimeoutError(message));
	}
	module.exports = buildConnector;
}));
//#endregion
//#region node_modules/undici/lib/llhttp/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.enumToMap = void 0;
	function enumToMap(obj) {
		const res = {};
		Object.keys(obj).forEach((key) => {
			const value = obj[key];
			if (typeof value === "number") res[key] = value;
		});
		return res;
	}
	exports.enumToMap = enumToMap;
}));
//#endregion
//#region node_modules/undici/lib/llhttp/constants.js
var require_constants$4 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SPECIAL_HEADERS = exports.HEADER_STATE = exports.MINOR = exports.MAJOR = exports.CONNECTION_TOKEN_CHARS = exports.HEADER_CHARS = exports.TOKEN = exports.STRICT_TOKEN = exports.HEX = exports.URL_CHAR = exports.STRICT_URL_CHAR = exports.USERINFO_CHARS = exports.MARK = exports.ALPHANUM = exports.NUM = exports.HEX_MAP = exports.NUM_MAP = exports.ALPHA = exports.FINISH = exports.H_METHOD_MAP = exports.METHOD_MAP = exports.METHODS_RTSP = exports.METHODS_ICE = exports.METHODS_HTTP = exports.METHODS = exports.LENIENT_FLAGS = exports.FLAGS = exports.TYPE = exports.ERROR = void 0;
	var utils_1 = require_utils$1();
	(function(ERROR) {
		ERROR[ERROR["OK"] = 0] = "OK";
		ERROR[ERROR["INTERNAL"] = 1] = "INTERNAL";
		ERROR[ERROR["STRICT"] = 2] = "STRICT";
		ERROR[ERROR["LF_EXPECTED"] = 3] = "LF_EXPECTED";
		ERROR[ERROR["UNEXPECTED_CONTENT_LENGTH"] = 4] = "UNEXPECTED_CONTENT_LENGTH";
		ERROR[ERROR["CLOSED_CONNECTION"] = 5] = "CLOSED_CONNECTION";
		ERROR[ERROR["INVALID_METHOD"] = 6] = "INVALID_METHOD";
		ERROR[ERROR["INVALID_URL"] = 7] = "INVALID_URL";
		ERROR[ERROR["INVALID_CONSTANT"] = 8] = "INVALID_CONSTANT";
		ERROR[ERROR["INVALID_VERSION"] = 9] = "INVALID_VERSION";
		ERROR[ERROR["INVALID_HEADER_TOKEN"] = 10] = "INVALID_HEADER_TOKEN";
		ERROR[ERROR["INVALID_CONTENT_LENGTH"] = 11] = "INVALID_CONTENT_LENGTH";
		ERROR[ERROR["INVALID_CHUNK_SIZE"] = 12] = "INVALID_CHUNK_SIZE";
		ERROR[ERROR["INVALID_STATUS"] = 13] = "INVALID_STATUS";
		ERROR[ERROR["INVALID_EOF_STATE"] = 14] = "INVALID_EOF_STATE";
		ERROR[ERROR["INVALID_TRANSFER_ENCODING"] = 15] = "INVALID_TRANSFER_ENCODING";
		ERROR[ERROR["CB_MESSAGE_BEGIN"] = 16] = "CB_MESSAGE_BEGIN";
		ERROR[ERROR["CB_HEADERS_COMPLETE"] = 17] = "CB_HEADERS_COMPLETE";
		ERROR[ERROR["CB_MESSAGE_COMPLETE"] = 18] = "CB_MESSAGE_COMPLETE";
		ERROR[ERROR["CB_CHUNK_HEADER"] = 19] = "CB_CHUNK_HEADER";
		ERROR[ERROR["CB_CHUNK_COMPLETE"] = 20] = "CB_CHUNK_COMPLETE";
		ERROR[ERROR["PAUSED"] = 21] = "PAUSED";
		ERROR[ERROR["PAUSED_UPGRADE"] = 22] = "PAUSED_UPGRADE";
		ERROR[ERROR["PAUSED_H2_UPGRADE"] = 23] = "PAUSED_H2_UPGRADE";
		ERROR[ERROR["USER"] = 24] = "USER";
	})(exports.ERROR || (exports.ERROR = {}));
	(function(TYPE) {
		TYPE[TYPE["BOTH"] = 0] = "BOTH";
		TYPE[TYPE["REQUEST"] = 1] = "REQUEST";
		TYPE[TYPE["RESPONSE"] = 2] = "RESPONSE";
	})(exports.TYPE || (exports.TYPE = {}));
	(function(FLAGS) {
		FLAGS[FLAGS["CONNECTION_KEEP_ALIVE"] = 1] = "CONNECTION_KEEP_ALIVE";
		FLAGS[FLAGS["CONNECTION_CLOSE"] = 2] = "CONNECTION_CLOSE";
		FLAGS[FLAGS["CONNECTION_UPGRADE"] = 4] = "CONNECTION_UPGRADE";
		FLAGS[FLAGS["CHUNKED"] = 8] = "CHUNKED";
		FLAGS[FLAGS["UPGRADE"] = 16] = "UPGRADE";
		FLAGS[FLAGS["CONTENT_LENGTH"] = 32] = "CONTENT_LENGTH";
		FLAGS[FLAGS["SKIPBODY"] = 64] = "SKIPBODY";
		FLAGS[FLAGS["TRAILING"] = 128] = "TRAILING";
		FLAGS[FLAGS["TRANSFER_ENCODING"] = 512] = "TRANSFER_ENCODING";
	})(exports.FLAGS || (exports.FLAGS = {}));
	(function(LENIENT_FLAGS) {
		LENIENT_FLAGS[LENIENT_FLAGS["HEADERS"] = 1] = "HEADERS";
		LENIENT_FLAGS[LENIENT_FLAGS["CHUNKED_LENGTH"] = 2] = "CHUNKED_LENGTH";
		LENIENT_FLAGS[LENIENT_FLAGS["KEEP_ALIVE"] = 4] = "KEEP_ALIVE";
	})(exports.LENIENT_FLAGS || (exports.LENIENT_FLAGS = {}));
	var METHODS;
	(function(METHODS) {
		METHODS[METHODS["DELETE"] = 0] = "DELETE";
		METHODS[METHODS["GET"] = 1] = "GET";
		METHODS[METHODS["HEAD"] = 2] = "HEAD";
		METHODS[METHODS["POST"] = 3] = "POST";
		METHODS[METHODS["PUT"] = 4] = "PUT";
		METHODS[METHODS["CONNECT"] = 5] = "CONNECT";
		METHODS[METHODS["OPTIONS"] = 6] = "OPTIONS";
		METHODS[METHODS["TRACE"] = 7] = "TRACE";
		METHODS[METHODS["COPY"] = 8] = "COPY";
		METHODS[METHODS["LOCK"] = 9] = "LOCK";
		METHODS[METHODS["MKCOL"] = 10] = "MKCOL";
		METHODS[METHODS["MOVE"] = 11] = "MOVE";
		METHODS[METHODS["PROPFIND"] = 12] = "PROPFIND";
		METHODS[METHODS["PROPPATCH"] = 13] = "PROPPATCH";
		METHODS[METHODS["SEARCH"] = 14] = "SEARCH";
		METHODS[METHODS["UNLOCK"] = 15] = "UNLOCK";
		METHODS[METHODS["BIND"] = 16] = "BIND";
		METHODS[METHODS["REBIND"] = 17] = "REBIND";
		METHODS[METHODS["UNBIND"] = 18] = "UNBIND";
		METHODS[METHODS["ACL"] = 19] = "ACL";
		METHODS[METHODS["REPORT"] = 20] = "REPORT";
		METHODS[METHODS["MKACTIVITY"] = 21] = "MKACTIVITY";
		METHODS[METHODS["CHECKOUT"] = 22] = "CHECKOUT";
		METHODS[METHODS["MERGE"] = 23] = "MERGE";
		METHODS[METHODS["M-SEARCH"] = 24] = "M-SEARCH";
		METHODS[METHODS["NOTIFY"] = 25] = "NOTIFY";
		METHODS[METHODS["SUBSCRIBE"] = 26] = "SUBSCRIBE";
		METHODS[METHODS["UNSUBSCRIBE"] = 27] = "UNSUBSCRIBE";
		METHODS[METHODS["PATCH"] = 28] = "PATCH";
		METHODS[METHODS["PURGE"] = 29] = "PURGE";
		METHODS[METHODS["MKCALENDAR"] = 30] = "MKCALENDAR";
		METHODS[METHODS["LINK"] = 31] = "LINK";
		METHODS[METHODS["UNLINK"] = 32] = "UNLINK";
		METHODS[METHODS["SOURCE"] = 33] = "SOURCE";
		METHODS[METHODS["PRI"] = 34] = "PRI";
		METHODS[METHODS["DESCRIBE"] = 35] = "DESCRIBE";
		METHODS[METHODS["ANNOUNCE"] = 36] = "ANNOUNCE";
		METHODS[METHODS["SETUP"] = 37] = "SETUP";
		METHODS[METHODS["PLAY"] = 38] = "PLAY";
		METHODS[METHODS["PAUSE"] = 39] = "PAUSE";
		METHODS[METHODS["TEARDOWN"] = 40] = "TEARDOWN";
		METHODS[METHODS["GET_PARAMETER"] = 41] = "GET_PARAMETER";
		METHODS[METHODS["SET_PARAMETER"] = 42] = "SET_PARAMETER";
		METHODS[METHODS["REDIRECT"] = 43] = "REDIRECT";
		METHODS[METHODS["RECORD"] = 44] = "RECORD";
		METHODS[METHODS["FLUSH"] = 45] = "FLUSH";
	})(METHODS = exports.METHODS || (exports.METHODS = {}));
	exports.METHODS_HTTP = [
		METHODS.DELETE,
		METHODS.GET,
		METHODS.HEAD,
		METHODS.POST,
		METHODS.PUT,
		METHODS.CONNECT,
		METHODS.OPTIONS,
		METHODS.TRACE,
		METHODS.COPY,
		METHODS.LOCK,
		METHODS.MKCOL,
		METHODS.MOVE,
		METHODS.PROPFIND,
		METHODS.PROPPATCH,
		METHODS.SEARCH,
		METHODS.UNLOCK,
		METHODS.BIND,
		METHODS.REBIND,
		METHODS.UNBIND,
		METHODS.ACL,
		METHODS.REPORT,
		METHODS.MKACTIVITY,
		METHODS.CHECKOUT,
		METHODS.MERGE,
		METHODS["M-SEARCH"],
		METHODS.NOTIFY,
		METHODS.SUBSCRIBE,
		METHODS.UNSUBSCRIBE,
		METHODS.PATCH,
		METHODS.PURGE,
		METHODS.MKCALENDAR,
		METHODS.LINK,
		METHODS.UNLINK,
		METHODS.PRI,
		METHODS.SOURCE
	];
	exports.METHODS_ICE = [METHODS.SOURCE];
	exports.METHODS_RTSP = [
		METHODS.OPTIONS,
		METHODS.DESCRIBE,
		METHODS.ANNOUNCE,
		METHODS.SETUP,
		METHODS.PLAY,
		METHODS.PAUSE,
		METHODS.TEARDOWN,
		METHODS.GET_PARAMETER,
		METHODS.SET_PARAMETER,
		METHODS.REDIRECT,
		METHODS.RECORD,
		METHODS.FLUSH,
		METHODS.GET,
		METHODS.POST
	];
	exports.METHOD_MAP = utils_1.enumToMap(METHODS);
	exports.H_METHOD_MAP = {};
	Object.keys(exports.METHOD_MAP).forEach((key) => {
		if (/^H/.test(key)) exports.H_METHOD_MAP[key] = exports.METHOD_MAP[key];
	});
	(function(FINISH) {
		FINISH[FINISH["SAFE"] = 0] = "SAFE";
		FINISH[FINISH["SAFE_WITH_CB"] = 1] = "SAFE_WITH_CB";
		FINISH[FINISH["UNSAFE"] = 2] = "UNSAFE";
	})(exports.FINISH || (exports.FINISH = {}));
	exports.ALPHA = [];
	for (let i = "A".charCodeAt(0); i <= "Z".charCodeAt(0); i++) {
		exports.ALPHA.push(String.fromCharCode(i));
		exports.ALPHA.push(String.fromCharCode(i + 32));
	}
	exports.NUM_MAP = {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		4: 4,
		5: 5,
		6: 6,
		7: 7,
		8: 8,
		9: 9
	};
	exports.HEX_MAP = {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		4: 4,
		5: 5,
		6: 6,
		7: 7,
		8: 8,
		9: 9,
		A: 10,
		B: 11,
		C: 12,
		D: 13,
		E: 14,
		F: 15,
		a: 10,
		b: 11,
		c: 12,
		d: 13,
		e: 14,
		f: 15
	};
	exports.NUM = [
		"0",
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9"
	];
	exports.ALPHANUM = exports.ALPHA.concat(exports.NUM);
	exports.MARK = [
		"-",
		"_",
		".",
		"!",
		"~",
		"*",
		"'",
		"(",
		")"
	];
	exports.USERINFO_CHARS = exports.ALPHANUM.concat(exports.MARK).concat([
		"%",
		";",
		":",
		"&",
		"=",
		"+",
		"$",
		","
	]);
	exports.STRICT_URL_CHAR = [
		"!",
		"\"",
		"$",
		"%",
		"&",
		"'",
		"(",
		")",
		"*",
		"+",
		",",
		"-",
		".",
		"/",
		":",
		";",
		"<",
		"=",
		">",
		"@",
		"[",
		"\\",
		"]",
		"^",
		"_",
		"`",
		"{",
		"|",
		"}",
		"~"
	].concat(exports.ALPHANUM);
	exports.URL_CHAR = exports.STRICT_URL_CHAR.concat(["	", "\f"]);
	for (let i = 128; i <= 255; i++) exports.URL_CHAR.push(i);
	exports.HEX = exports.NUM.concat([
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"A",
		"B",
		"C",
		"D",
		"E",
		"F"
	]);
	exports.STRICT_TOKEN = [
		"!",
		"#",
		"$",
		"%",
		"&",
		"'",
		"*",
		"+",
		"-",
		".",
		"^",
		"_",
		"`",
		"|",
		"~"
	].concat(exports.ALPHANUM);
	exports.TOKEN = exports.STRICT_TOKEN.concat([" "]);
	exports.HEADER_CHARS = ["	"];
	for (let i = 32; i <= 255; i++) if (i !== 127) exports.HEADER_CHARS.push(i);
	exports.CONNECTION_TOKEN_CHARS = exports.HEADER_CHARS.filter((c) => c !== 44);
	exports.MAJOR = exports.NUM_MAP;
	exports.MINOR = exports.MAJOR;
	var HEADER_STATE;
	(function(HEADER_STATE) {
		HEADER_STATE[HEADER_STATE["GENERAL"] = 0] = "GENERAL";
		HEADER_STATE[HEADER_STATE["CONNECTION"] = 1] = "CONNECTION";
		HEADER_STATE[HEADER_STATE["CONTENT_LENGTH"] = 2] = "CONTENT_LENGTH";
		HEADER_STATE[HEADER_STATE["TRANSFER_ENCODING"] = 3] = "TRANSFER_ENCODING";
		HEADER_STATE[HEADER_STATE["UPGRADE"] = 4] = "UPGRADE";
		HEADER_STATE[HEADER_STATE["CONNECTION_KEEP_ALIVE"] = 5] = "CONNECTION_KEEP_ALIVE";
		HEADER_STATE[HEADER_STATE["CONNECTION_CLOSE"] = 6] = "CONNECTION_CLOSE";
		HEADER_STATE[HEADER_STATE["CONNECTION_UPGRADE"] = 7] = "CONNECTION_UPGRADE";
		HEADER_STATE[HEADER_STATE["TRANSFER_ENCODING_CHUNKED"] = 8] = "TRANSFER_ENCODING_CHUNKED";
	})(HEADER_STATE = exports.HEADER_STATE || (exports.HEADER_STATE = {}));
	exports.SPECIAL_HEADERS = {
		"connection": HEADER_STATE.CONNECTION,
		"content-length": HEADER_STATE.CONTENT_LENGTH,
		"proxy-connection": HEADER_STATE.CONNECTION,
		"transfer-encoding": HEADER_STATE.TRANSFER_ENCODING,
		"upgrade": HEADER_STATE.UPGRADE
	};
}));
//#endregion
//#region node_modules/undici/lib/llhttp/llhttp-wasm.js
var require_llhttp_wasm = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Buffer: Buffer$2 } = __require("node:buffer");
	module.exports = Buffer$2.from("AGFzbQEAAAABJwdgAX8Bf2ADf39/AX9gAX8AYAJ/fwBgBH9/f38Bf2AAAGADf39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQAEA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAAy0sBQYAAAIAAAAAAAACAQIAAgICAAADAAAAAAMDAwMBAQEBAQEBAQEAAAIAAAAEBQFwARISBQMBAAIGCAF/AUGA1AQLB9EFIgZtZW1vcnkCAAtfaW5pdGlhbGl6ZQAIGV9faW5kaXJlY3RfZnVuY3Rpb25fdGFibGUBAAtsbGh0dHBfaW5pdAAJGGxsaHR0cF9zaG91bGRfa2VlcF9hbGl2ZQAvDGxsaHR0cF9hbGxvYwALBm1hbGxvYwAxC2xsaHR0cF9mcmVlAAwEZnJlZQAMD2xsaHR0cF9nZXRfdHlwZQANFWxsaHR0cF9nZXRfaHR0cF9tYWpvcgAOFWxsaHR0cF9nZXRfaHR0cF9taW5vcgAPEWxsaHR0cF9nZXRfbWV0aG9kABAWbGxodHRwX2dldF9zdGF0dXNfY29kZQAREmxsaHR0cF9nZXRfdXBncmFkZQASDGxsaHR0cF9yZXNldAATDmxsaHR0cF9leGVjdXRlABQUbGxodHRwX3NldHRpbmdzX2luaXQAFQ1sbGh0dHBfZmluaXNoABYMbGxodHRwX3BhdXNlABcNbGxodHRwX3Jlc3VtZQAYG2xsaHR0cF9yZXN1bWVfYWZ0ZXJfdXBncmFkZQAZEGxsaHR0cF9nZXRfZXJybm8AGhdsbGh0dHBfZ2V0X2Vycm9yX3JlYXNvbgAbF2xsaHR0cF9zZXRfZXJyb3JfcmVhc29uABwUbGxodHRwX2dldF9lcnJvcl9wb3MAHRFsbGh0dHBfZXJybm9fbmFtZQAeEmxsaHR0cF9tZXRob2RfbmFtZQAfEmxsaHR0cF9zdGF0dXNfbmFtZQAgGmxsaHR0cF9zZXRfbGVu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PgtBhwEMPQtBiAEMPAtBiQEMOwtBigEMOgtBiwEMOQtBjAEMOAtBjQEMNwtBjgEMNgtBjwEMNQtBkAEMNAtBkQEMMwtBkgEMMgtBkwEMMQtBlAEMMAtBlQEMLwtBlgEMLgtBlwEMLQtBmAEMLAtBmQEMKwtBmgEMKgtBmwEMKQtBnAEMKAtBnQEMJwtBngEMJgtBnwEMJQtBoAEMJAtBoQEMIwtBogEMIgtBowEMIQtBpAEMIAtBpQEMHwtBpgEMHgtBpwEMHQtBqAEMHAtBqQEMGwtBqgEMGgtBqwEMGQtBrAEMGAtBrQEMFwtBrgEMFgtBAQwVC0GvAQwUC0GwAQwTC0GxAQwSC0GzAQwRC0GyAQwQC0G0AQwPC0G1AQwOC0G2AQwNC0G3AQwMC0G4AQwLC0G5AQwKC0G6AQwJC0G7AQwIC0HGAQwHC0G8AQwGC0G9AQwFC0G+AQwEC0G/AQwDC0HAAQwCC0HCAQwBC0HBAQshAwNAAkACQAJAAkACQAJAAkACQAJAIAICfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAgJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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iQEhAwykAgtBASABLQAAQd8ARw1nGiABQQFqIQEMXgtBigEhAyABIARGDaICIAIoAgAiACAEIAFraiEFIAEgAGtBAWohBgNAIAEtAAAgAEGMzwBqLQAARw1kIABBAUYN+gEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMogILQYsBIQMgASAERg2hAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGOzwBqLQAARw1kIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyiAgsgAkEANgIAIAZBAWohAUECDGULQYwBIQMgASAERg2gAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHwzwBqLQAARw1jIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyhAgsgAkEANgIAIAZBAWohAUEfDGQLQY0BIQMgASAERg2fAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHyzwBqLQAARw1iIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAygAgsgAkEANgIAIAZBAWohAUEJDGMLIAEgBEYEQEGOASEDDJ8CCwJAAkAgAS0AAEHJAGsOBwBiYmJiYgFiCyABQQFqIQFB+AAhAwyGAgsgAUEBaiEBQfkAIQMMhQILQY8BIQMgASAERg2dAiACKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEGRzwBqLQAARw1gIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyeAgsgAkEANgIAIAZBAWohAUEYDGELQZABIQMgASAERg2cAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGXzwBqLQAARw1fIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAydAgsgAkEANgIAIAZBAWohAUEXDGALQZEBIQMgASAERg2bAiACKAIAIgAgBCABa2ohBSABIABrQQZqIQYCQANAIAEtAAAgAEGazwBqLQAARw1eIABBBkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAycAgsgAkEANgIAIAZBAWohAUEV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JSIARQ0RIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMtAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0gIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMswELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0iIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMsgELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0OIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMsQELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0dIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMsAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0fIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMrwELIABBP0cNASABQQFqCyEBQQUhAwyUAQtBACEDIAJBADYCHCACIAE2AhQgAkH9EjYCECACQQc2AgwMrAELIAJBADYCHCACIAE2AhQgAkHcCDYCECACQQc2AgxBACEDDKsBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNByACQeUANgIcIAIgATYCFCACIAA2AgxBACEDDKoBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNFiACQdMANgIcIAIgATYCFCACIAA2AgxBACEDDKkBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNGCACQdIANgIcIAIgATYCFCACIAA2AgxBACEDDKgBCyACQQA2AhwgAiABNgIUIAJBxgo2AhAgAkEHNgIMQQAhAwynAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQMgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwymAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRIgAkHTADYCHCACIAE2AhQgAiAANgIMQQAhAwylAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRQgAkHSADYCHCACIAE2AhQgAiAANgIMQQAhAwykAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQAgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwyjAQtB1QAhAwyJAQsgAEEVRwRAIAJBADYCHCACIAE2AhQgAkG5DTYCECACQRo2AgxB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AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIABB5ABrDvQDY2IAAWFhYWFhYQIDBAVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhBgcICQoLDA0OD2FhYWFhEGFhYWFhYWFhYWFhEWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYRITFBUWFxgZGhthYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2YTc4OTphYWFhYWFhYTthYWE8YWFhYT0+P2FhYWFhYWFhQGFhQWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYUJDREVGR0hJSktMTU5PUFFSU2FhYWFhYWFhVFVWV1hZWlthXF1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFeYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhX2BhC0HhJw8LQaQhDwtByywPC0H+MQ8LQcAkDwtBqyQPC0GNKA8LQeImDwtBgDAPC0G5Lw8LQdckDwtB7x8PC0HhHw8LQfofDwtB8iAPC0GoLw8LQa4yDwtBiDAPC0HsJw8LQYIiDwtBjh0PC0HQLg8LQcojDwtBxTIPC0HfHA8LQdIcDwtBxCAPC0HXIA8LQaIfDwtB7S4PC0GrMA8LQdQlDwtBzC4PC0H6Lg8LQfwrDwtB0jAPC0HxHQ8LQbsgDwtB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CABB3AgLii1JbnZhbGlkIGNoYXIgaW4gdXJsIHF1ZXJ5AFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fYm9keQBDb250ZW50LUxlbmd0aCBvdmVyZmxvdwBDaHVuayBzaXplIG92ZXJmbG93AFJlc3BvbnNlIG92ZXJmbG93AEludmFsaWQgbWV0aG9kIGZvciBIVFRQL3gueCByZXF1ZXN0AEludmFsaWQgbWV0aG9kIGZvciBSVFNQL3gueCByZXF1ZXN0AEV4cGVjdGVkIFNPVVJDRSBtZXRob2QgZm9yIElDRS94LnggcmVxdWVzdABJbnZhbGlkIGNoYXIgaW4gdXJsIGZyYWdtZW50IHN0YXJ0AEV4cGVjdGVkIGRvdABTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3N0YXR1cwBJbnZhbGlkIHJlc3BvbnNlIHN0YXR1cwBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zAFVzZXIgY2FsbGJhY2sgZXJyb3IAYG9uX3Jlc2V0YCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfaGVhZGVyYCBjYWxsYmFjayBlcnJvcgBgb25fbWVzc2FnZV9iZWdpbmAgY2FsbGJhY2sgZXJyb3IAYG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3N0YXR1c19jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3ZlcnNpb25fY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl91cmxfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX2hlYWRlcl92YWx1ZV9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX21lc3NhZ2VfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXRob2RfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfZmllbGRfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19leHRlbnNpb25fbmFtZWAgY2FsbGJhY2sgZXJyb3IAVW5leHBlY3RlZCBjaGFyIGluIHVybCBzZXJ2ZXIASW52YWxpZCBoZWFkZXIgdmFsdWUgY2hhcgBJbnZhbGlkIGhlYWRlciBmaWVsZCBjaGFyAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fdmVyc2lvbgBJbnZhbGlkIG1pbm9yIHZlcnNpb24ASW52YWxpZCBtYWpvciB2ZXJzaW9uAEV4cGVjdGVkIHNwYWNlIGFmdGVyIHZlcnNpb24ARXhwZWN0ZWQgQ1JMRiBhZnRlciB2ZXJzaW9uAEludmFsaWQgSFRUUCB2ZXJzaW9uAEludmFsaWQgaGVhZGVyIHRva2VuAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fdXJsAEludmFsaWQgY2hhcmFjdGVycyBpbiB1cmwAVW5leHBlY3RlZCBzdGFydCBjaGFyIGluIHVybABEb3VibGUgQCBpbiB1cmwARW1wdHkgQ29udGVudC1MZW5ndGgASW52YWxpZCBjaGFyYWN0ZXIgaW4gQ29udGVudC1MZW5ndGgARHVwbGljYXRlIENvbnRlbnQtTGVuZ3RoAEludmFsaWQgY2hhciBpbiB1cmwgcGF0aABDb250ZW50LUxlbmd0aCBjYW4ndCBiZSBwcmVzZW50IHdpdGggVHJhbnNmZXItRW5jb2RpbmcASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgc2l6ZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2hlYWRlcl92YWx1ZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZQBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zIHZhbHVlAE1pc3NpbmcgZXhwZWN0ZWQgTEYgYWZ0ZXIgaGVhZGVyIHZhbHVlAEludmFsaWQgYFRyYW5zZmVyLUVuY29kaW5nYCBoZWFkZXIgdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZSB2YWx1ZQBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zIHF1b3RlZCB2YWx1ZQBQYXVzZWQgYnkgb25faGVhZGVyc19jb21wbGV0ZQBJbnZhbGlkIEVPRiBzdGF0ZQBvbl9yZXNldCBwYXVzZQBvbl9jaHVua19oZWFkZXIgcGF1c2UAb25fbWVzc2FnZV9iZWdpbiBwYXVzZQBvbl9jaHVua19leHRlbnNpb25fdmFsdWUgcGF1c2UAb25fc3RhdHVzX2NvbXBsZXRlIHBhdXNlAG9uX3ZlcnNpb25fY29tcGxldGUgcGF1c2UAb25fdXJsX2NvbXBsZXRlIHBhdXNlAG9uX2NodW5rX2NvbXBsZXRlIHBhdXNlAG9uX2hlYWRlcl92YWx1ZV9jb21wbGV0ZSBwYXVzZQBvbl9tZXNzYWdlX2NvbXBsZXRlIHBhdXNlAG9uX21ldGhvZF9jb21wbGV0ZSBwYXVzZQBvbl9oZWFkZXJfZmllbGRfY29tcGxldGUgcGF1c2UAb25fY2h1bmtfZXh0ZW5zaW9uX25hbWUgcGF1c2UAVW5leHBlY3RlZCBzcGFjZSBhZnRlciBzdGFydCBsaW5lAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fY2h1bmtfZXh0ZW5zaW9uX25hbWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBuYW1lAFBhdXNlIG9uIENPTk5FQ1QvVXBncmFkZQBQYXVzZSBvbiBQUkkvVXBncmFkZQBFeHBlY3RlZCBIVFRQLzIgQ29ubmVjdGlvbiBQcmVmYWNlAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fbWV0aG9kAEV4cGVjdGVkIHNwYWNlIGFmdGVyIG1ldGhvZABTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2hlYWRlcl9maWVsZABQYXVzZWQASW52YWxpZCB3b3JkIGVuY291bnRlcmVkAEludmFsaWQgbWV0aG9kIGVuY291bnRlcmVkAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2NoZW1hAFJlcXVlc3QgaGFzIGludmFsaWQgYFRyYW5zZmVyLUVuY29kaW5nYABTV0lUQ0hfUFJPWFkAVVNFX1BST1hZAE1LQUNUSVZJVFkAVU5QUk9DRVNTQUJMRV9FTlRJVFkAQ09QWQBNT1ZFRF9QRVJNQU5FTlRMWQBUT09fRUFSTFkATk9USUZZAEZBSUxFRF9ERVBFTkRFTkNZAEJBRF9HQVRFV0FZAFBMQVkAUFVUAENIRUNLT1VUAEdBVEVXQVlfVElNRU9VVABSRVFVRVNUX1RJTUVPVVQATkVUV09SS19DT05ORUNUX1RJTUVPVVQAQ09OTkVDVElPTl9USU1FT1VUAExPR0lOX1RJTUVPVVQATkVUV09SS19SRUFEX1RJTUVPVVQAUE9TVABNSVNESVJFQ1RFRF9SRVFVRVNUAENMSUVOVF9DTE9TRURfUkVRVUVTVABDTElFTlRfQ0xPU0VEX0xPQURfQkFMQU5DRURfUkVRVUVTVABCQURfUkVRVUVTVABIVFRQX1JFUVVFU1RfU0VOVF9UT19IVFRQU19QT1JUAFJFUE9SVABJTV9BX1RFQVBPVABSRVNFVF9DT05URU5UAE5PX0NPTlRFTlQAUEFSVElBTF9DT05URU5UAEhQRV9JTlZBTElEX0NPTlNUQU5UAEhQRV9DQl9SRVNFVABHRVQASFBFX1NUUklDVABDT05GTElDVABURU1QT1JBUllfUkVESVJFQ1QAUEVSTUFORU5UX1JFRElSRUNUAENPTk5FQ1QATVVMVElfU1RBVFVTAEhQRV9JTlZBTElEX1NUQVRVUwBUT09fTUFOWV9SRVFVRVNUUwBFQVJMWV9ISU5UUwBVTkFWQUlMQUJMRV9GT1JfTEVHQUxfUkVBU09OUwBPUFRJT05TAFNXSVRDSElOR19QUk9UT0NPTFMAVkFSSUFOVF9BTFNPX05FR09USUFURVMATVVMVElQTEVfQ0hPSUNFUwBJTlRFUk5BTF9TRVJWRVJfRVJST1IAV0VCX1NFUlZFUl9VTktOT1dOX0VSUk9SAFJBSUxHVU5fRVJST1IASURFTlRJVFlfUFJPVklERVJfQVVUSEVOVElDQVRJT05fRVJST1IAU1NMX0NFUlRJRklDQVRFX0VSUk9SAElOVkFMSURfWF9GT1JXQVJERURfRk9SAFNFVF9QQVJBTUVURVIAR0VUX1BBUkFNRVRFUgBIUEVfVVNFUgBTRUVfT1RIRVIASFBFX0NCX0NIVU5LX0hFQURFUgBNS0NBTEVOREFSAFNFVFVQAFdFQl9TRVJWRVJfSVNfRE9XTgBURUFSRE9XTgBIUEVfQ0xPU0VEX0NPTk5FQ1RJT04ASEVVUklTVElDX0VYUElSQVRJT04ARElTQ09OTkVDVEVEX09QRVJBVElPTgBOT05fQVVUSE9SSVRBVElWRV9JTkZPUk1BVElPTgBIUEVfSU5WQUxJRF9WRVJTSU9OAEhQRV9DQl9NRVNTQUdFX0JFR0lOAFNJVEVfSVNfRlJPWkVOAEhQRV9JTlZBTElEX0hFQURFUl9UT0tFTgBJTlZBTElEX1RPS0VOAEZPUkJJRERFTgBFTkhBTkNFX1lPVVJfQ0FMTQBIUEVfSU5WQUxJRF9VUkwAQkxPQ0tFRF9CWV9QQVJFTlRBTF9DT05UUk9MAE1LQ09MAEFDTABIUEVfSU5URVJOQUwAUkVRVUVTVF9IRUFERVJfRklFTERTX1RPT19MQVJHRV9VTk9GRklDSUFMAEhQRV9PSwBVTkxJTksAVU5MT0NLAFBSSQBSRVRSWV9XSVRIAEhQRV9JTlZBTElEX0NPTlRFTlRfTEVOR1RIAEhQRV9VTkVYUEVDVEVEX0NPTlRFTlRfTEVOR1RIAEZMVVNIAFBST1BQQVRDSABNLVNFQVJDSABVUklfVE9PX0xPTkcAUFJPQ0VTU0lORwBNSVNDRUxMQU5FT1VTX1BFUlNJU1RFTlRfV0FSTklORwBNSVNDRUxMQU5FT1VTX1dBUk5JTkcASFBFX0lOVkFMSURfVFJBTlNGRVJfRU5DT0RJTkcARXhwZWN0ZWQgQ1JMRgBIUEVfSU5WQUxJRF9DSFVOS19TSVpFAE1PVkUAQ09OVElOVUUASFBFX0NCX1NUQVRVU19DT01QTEVURQBIUEVfQ0JfSEVBREVSU19DT01QTEVURQBIUEVfQ0JfVkVSU0lPTl9DT01QTEVURQBIUEVfQ0JfVVJMX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19DT01QTEVURQBIUEVfQ0JfSEVBREVSX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fVkFMVUVfQ09NUExFVEUASFBFX0NCX0NIVU5LX0VYVEVOU0lPTl9OQU1FX0NPTVBMRVRFAEhQRV9DQl9NRVNTQUdFX0NPTVBMRVRFAEhQRV9DQl9NRVRIT0RfQ09NUExFVEUASFBFX0NCX0hFQURFUl9GSUVMRF9DT01QTEVURQBERUxFVEUASFBFX0lOVkFMSURfRU9GX1NUQVRFAElOVkFMSURfU1NMX0NFUlRJRklDQVRFAFBBVVNFAE5PX1JFU1BPTlNFAFVOU1VQUE9SVEVEX01FRElBX1RZUEUAR09ORQBOT1RfQUNDRVBUQUJMRQBTRVJWSUNFX1VOQVZBSUxBQkxFAFJBTkdFX05PVF9TQVRJU0ZJQUJMRQBPUklHSU5fSVNfVU5SRUFDSEFCTEUAUkVTUE9OU0VfSVNfU1RBTEUAUFVSR0UATUVSR0UAUkVRVUVTVF9IRUFERVJfRklFTERTX1RPT19MQVJHRQBSRVFVRVNUX0hFQURFUl9UT09fTEFSR0UAUEFZTE9BRF9UT09fTEFSR0UASU5TVUZGSUNJRU5UX1NUT1JBR0UASFBFX1BBVVNFRF9VUEdSQURFAEhQRV9QQVVTRURfSDJfVVBHUkFERQBTT1VSQ0UAQU5OT1VOQ0UAVFJBQ0UASFBFX1VORVhQRUNURURfU1BBQ0UAREVTQ1JJQkUAVU5TVUJTQ1JJQkUAUkVDT1JEAEhQRV9JTlZBTElEX01FVEhPRABOT1RfRk9VTkQAUFJPUEZJTkQAVU5CSU5EAFJFQklORABVTkFVVEhPUklaRUQATUVUSE9EX05PVF9BTExPV0VEAEhUVFBfVkVSU0lPTl9OT1RfU1VQUE9SVEVEAEFMUkVBRFlfUkVQT1JURUQAQUNDRVBURUQATk9UX0lNUExFTUVOVEVEAExPT1BfREVURUNURUQASFBFX0NSX0VYUEVDVEVEAEhQRV9MRl9FWFBFQ1RFRABDUkVBVEVEAElNX1VTRUQASFBFX1BBVVNFRABUSU1FT1VUX09DQ1VSRUQAUEFZTUVOVF9SRVFVSVJFRABQUkVDT05ESVRJT05fUkVRVUlSRUQAUFJPWFlfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATkVUV09SS19BVVRIRU5USUNBVElPTl9SRVFVSVJFRABMRU5HVEhfUkVRVUlSRUQAU1NMX0NFUlRJRklDQVRFX1JFUVVJUkVEAFVQR1JBREVfUkVRVUlSRUQAUEFHRV9FWFBJUkVEAFBSRUNPTkRJVElPTl9GQUlMRUQARVhQRUNUQVRJT05fRkFJTEVEAFJFVkFMSURBVElPTl9GQUlMRUQAU1NMX0hBTkRTSEFLRV9GQUlMRUQATE9DS0VEAFRSQU5TRk9STUFUSU9OX0FQUExJRUQATk9UX01PRElGSUVEAE5PVF9FWFRFTkRFRABCQU5EV0lEVEhfTElNSVRfRVhDRUVERUQAU0lURV9JU19PVkVSTE9BREVEAEhFQUQARXhwZWN0ZWQgSFRUUC8AAF4TAAAmEwAAMBAAAPAXAACdEwAAFRIAADkXAADwEgAAChAAAHUSAACtEgAAghMAAE8UAAB/EAAAoBUAACMUAACJEgAAixQAAE0VAADUEQAAzxQAABAYAADJFgAA3BYAAMERAADgFwAAuxQAAHQUAAB8FQAA5RQAAAgXAAAfEAAAZRUAAKMUAAAoFQAAAhUAAJkVAAAsEAAAixkAAE8PAADUDgAAahAAAM4QAAACFwAAiQ4AAG4TAAAcEwAAZhQAAFYXAADBEwAAzRMAAGwTAABoFwAAZhcAAF8XAAAiEwAAzg8AAGkOAADYDgAAYxYAAMsTAACqDgAAKBcAACYXAADFEwAAXRYAAOgRAABnEwAAZRMAAPIWAABzEwAAHRcAAPkWAADzEQAAzw4AAM4VAAAMEgAAsxEAAKURAABhEAAAMhcAALsTAEH5NQsBAQBBkDYL4AEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB/TcLAQEAQZE4C14CAwICAgICAAACAgACAgACAgICAgICAgICAAQAAAAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgACAEH9OQsBAQBBkToLXgIAAgICAgIAAAICAAICAAICAgICAgICAgIAAwAEAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgIAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgACAAIAQfA7Cw1sb3NlZWVwLWFsaXZlAEGJPAsBAQBBoDwL4AEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBiT4LAQEAQaA+C+cBAQEBAQEBAQEBAQEBAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQFjaHVua2VkAEGwwAALXwEBAAEBAQEBAAABAQABAQABAQEBAQEBAQEBAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQABAEGQwgALIWVjdGlvbmVudC1sZW5ndGhvbnJveHktY29ubmVjdGlvbgBBwMIACy1yYW5zZmVyLWVuY29kaW5ncGdyYWRlDQoNCg0KU00NCg0KVFRQL0NFL1RTUC8AQfnCAAsFAQIAAQMAQZDDAAvgAQQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAEH5xAALBQECAAEDAEGQxQAL4AEEAQEFAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB+cYACwQBAAABAEGRxwAL3wEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAEH6yAALBAEAAAIAQZDJAAtfAwQAAAQEBAQEBAQEBAQEBQQEBAQEBAQEBAQEBAAEAAYHBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQABAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAQAQfrKAAsEAQAAAQBBkMsACwEBAEGqywALQQIAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAEH6zAALBAEAAAEAQZDNAAsBAQBBms0ACwYCAAAAAAIAQbHNAAs6AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBB8M4AC5YBTk9VTkNFRUNLT1VUTkVDVEVURUNSSUJFTFVTSEVURUFEU0VBUkNIUkdFQ1RJVklUWUxFTkRBUlZFT1RJRllQVElPTlNDSFNFQVlTVEFUQ0hHRU9SRElSRUNUT1JUUkNIUEFSQU1FVEVSVVJDRUJTQ1JJQkVBUkRPV05BQ0VJTkROS0NLVUJTQ1JJQkVIVFRQL0FEVFAv", "base64");
}));
//#endregion
//#region node_modules/undici/lib/llhttp/llhttp_simd-wasm.js
var require_llhttp_simd_wasm = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Buffer: Buffer$1 } = __require("node:buffer");
	module.exports = Buffer$1.from("AGFzbQEAAAABJwdgAX8Bf2ADf39/AX9gAX8AYAJ/fwBgBH9/f38Bf2AAAGADf39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQAEA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAAy0sBQYAAAIAAAAAAAACAQIAAgICAAADAAAAAAMDAwMBAQEBAQEBAQEAAAIAAAAEBQFwARISBQMBAAIGCAF/AUGA1AQLB9EFIgZtZW1vcnkCAAtfaW5pdGlhbGl6ZQAIGV9faW5kaXJlY3RfZnVuY3Rpb25fdGFibGUBAAtsbGh0dHBfaW5pdAAJGGxsaHR0cF9zaG91bGRfa2VlcF9hbGl2ZQAvDGxsaHR0cF9hbGxvYwALBm1hbGxvYwAxC2xsaHR0cF9mcmVlAAwEZnJlZQAMD2xsaHR0cF9nZXRfdHlwZQANFWxsaHR0cF9nZXRfaHR0cF9tYWpvcgAOFWxsaHR0cF9nZXRfaHR0cF9taW5vcgAPEWxsaHR0cF9nZXRfbWV0aG9kABAWbGxodHRwX2dldF9zdGF0dXNfY29kZQAREmxsaHR0cF9nZXRfdXBncmFkZQASDGxsaHR0cF9yZXNldAATDmxsaHR0cF9leGVjdXRlABQUbGxodHRwX3NldHRpbmdzX2luaXQAFQ1sbGh0dHBfZmluaXNoABYMbGxodHRwX3BhdXNlABcNbGxodHRwX3Jlc3VtZQAYG2xsaHR0cF9yZXN1bWVfYWZ0ZXJfdXBncmFkZQAZEGxsaHR0cF9nZXRfZXJybm8AGhdsbGh0dHBfZ2V0X2Vycm9yX3JlYXNvbgAbF2xsaHR0cF9zZXRfZXJyb3JfcmVhc29uABwUbGxodHRwX2dldF9lcnJvcl9wb3MAHRFsbGh0dHBfZXJybm9fbmFtZQAeEmxsaHR0cF9tZXRob2RfbmFtZQAfEmxsaHR0cF9zdGF0dXNfbmFtZQAgGmxsaHR0cF9zZXRfbGVu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PgtBhwEMPQtBiAEMPAtBiQEMOwtBigEMOgtBiwEMOQtBjAEMOAtBjQEMNwtBjgEMNgtBjwEMNQtBkAEMNAtBkQEMMwtBkgEMMgtBkwEMMQtBlAEMMAtBlQEMLwtBlgEMLgtBlwEMLQtBmAEMLAtBmQEMKwtBmgEMKgtBmwEMKQtBnAEMKAtBnQEMJwtBngEMJgtBnwEMJQtBoAEMJAtBoQEMIwtBogEMIgtBowEMIQtBpAEMIAtBpQEMHwtBpgEMHgtBpwEMHQtBqAEMHAtBqQEMGwtBqgEMGgtBqwEMGQtBrAEMGAtBrQEMFwtBrgEMFgtBAQwVC0GvAQwUC0GwAQwTC0GxAQwSC0GzAQwRC0GyAQwQC0G0AQwPC0G1AQwOC0G2AQwNC0G3AQwMC0G4AQwLC0G5AQwKC0G6AQwJC0G7AQwIC0HGAQwHC0G8AQwGC0G9AQwFC0G+AQwEC0G/AQwDC0HAAQwCC0HCAQwBC0HBAQshAwNAAkACQAJAAkACQAJAAkACQAJAIAICfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAgJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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iQEhAwykAgtBASABLQAAQd8ARw1nGiABQQFqIQEMXgtBigEhAyABIARGDaICIAIoAgAiACAEIAFraiEFIAEgAGtBAWohBgNAIAEtAAAgAEGMzwBqLQAARw1kIABBAUYN+gEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMogILQYsBIQMgASAERg2hAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGOzwBqLQAARw1kIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyiAgsgAkEANgIAIAZBAWohAUECDGULQYwBIQMgASAERg2gAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHwzwBqLQAARw1jIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyhAgsgAkEANgIAIAZBAWohAUEfDGQLQY0BIQMgASAERg2fAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHyzwBqLQAARw1iIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAygAgsgAkEANgIAIAZBAWohAUEJDGMLIAEgBEYEQEGOASEDDJ8CCwJAAkAgAS0AAEHJAGsOBwBiYmJiYgFiCyABQQFqIQFB+AAhAwyGAgsgAUEBaiEBQfkAIQMMhQILQY8BIQMgASAERg2dAiACKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEGRzwBqLQAARw1gIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyeAgsgAkEANgIAIAZBAWohAUEYDGELQZABIQMgASAERg2cAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGXzwBqLQAARw1fIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAydAgsgAkEANgIAIAZBAWohAUEXDGALQZEBIQMgASAERg2bAiACKAIAIgAgBCABa2ohBSABIABrQQZqIQYCQANAIAEtAAAgAEGazwBqLQAARw1eIABBBkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAycAgsgAkEANgIAIAZBAWohAUEV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JSIARQ0RIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMtAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0gIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMswELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0iIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMsgELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0OIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMsQELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0dIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMsAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0fIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMrwELIABBP0cNASABQQFqCyEBQQUhAwyUAQtBACEDIAJBADYCHCACIAE2AhQgAkH9EjYCECACQQc2AgwMrAELIAJBADYCHCACIAE2AhQgAkHcCDYCECACQQc2AgxBACEDDKsBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNByACQeUANgIcIAIgATYCFCACIAA2AgxBACEDDKoBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNFiACQdMANgIcIAIgATYCFCACIAA2AgxBACEDDKkBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNGCACQdIANgIcIAIgATYCFCACIAA2AgxBACEDDKgBCyACQQA2AhwgAiABNgIUIAJBxgo2AhAgAkEHNgIMQQAhAwynAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQMgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwymAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRIgAkHTADYCHCACIAE2AhQgAiAANgIMQQAhAwylAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRQgAkHSADYCHCACIAE2AhQgAiAANgIMQQAhAwykAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQAgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwyjAQtB1QAhAwyJAQsgAEEVRwRAIAJBADYCHCACIAE2AhQgAkG5DTYCECACQRo2AgxBACEDDKIBCyACQeQANgIcIAIgATYCFCACQeMXNgIQIAJBFTYCDEEAIQMMoQELIAJBADYCACAGQQFqIQEgAi0AKSIAQSNrQQtJDQQCQCAAQQZLDQBBASAAdEHKAHFFDQAMBQtBACEDIAJBADYCHCACIAE2AhQgAkH3CTYCECACQQg2AgwMoAELIAJBADYCACAGQQFqIQEgAi0AKUEhRg0DIAJBADYCHCACIAE2AhQgAkGbCjYCECACQQg2AgxBACEDDJ8BCyACQQA2AgALQQAhAyACQQA2AhwgAiABNgIUIAJBkDM2AhAgAkEINgIMDJ0BCyACQQA2AgAgBkEBaiEBIAItAClBI0kNACACQQA2AhwgAiABNgIUIAJB0wk2AhAgAkEINgIMQQAhAwycAQtB0QAhAwyCAQsgAS0AAEEwayIAQf8BcUEKSQRAIAIgADoAKiABQQFqIQFBzwAhAwyCAQsgAigCBCEAIAJBADYCBCACIAAgARAoIgBFDYYBIAJB3gA2AhwgAiABNgIUIAIgADYCDEEAIQMMmgELIAIoAgQhACACQQA2AgQgAiAAIAEQKCIARQ2GASACQdwANgIcIAIgATYCFCACIAA2AgxBACEDDJkBCyACKAIEIQAgAkEANgIEIAIgACAFECgiAEUEQCAFIQEMhwELIAJB2gA2AhwgAiAFNgIUIAIgADYCDAyYAQtBACEBQQEhAwsgAiADOgArIAVBAWohAwJAAkACQCACLQAtQRBxDQACQAJAAkAgAi0AKg4DAQACBAsgBkUNAwwCCyAADQEMAgsgAUUNAQsgAigCBCEAIAJBADYCBCACIAAgAxAoIgBFBEAgAyEBDAILIAJB2AA2AhwgAiADNgIUIAIgADYCDEEAIQMMmAELIAIoAgQhACACQQA2AgQgAiAAIAMQKCIARQRAIAMhAQyHAQsgAkHZADYCHCACIAM2AhQgAiAANgIMQQAhAwyXAQtBzAAhAwx9CyAAQRVHBEAgAkEANgIcIAIgATYCFCACQZQNNgIQIAJBITYCDEEAIQMMlgELIAJB1wA2AhwgAiABNgIUIAJByRc2AhAgAkEVNgIMQQAhAwyVAQtBACEDIAJBADYCHCACIAE2AhQgAkGAETYCECACQQk2AgwMlAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0AIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMkwELQckAIQMMeQsgAkEANgIcIAIgATYCFCACQcEoNgIQIAJBBzYCDCACQQA2AgBBACEDDJEBCyACKAIEIQBBACEDIAJBADYCBCACIAAgARAlIgBFDQAgAkHSADYCHCACIAE2AhQgAiAANgIMDJABC0HIACEDDHYLIAJBADYCACAFIQELIAJBgBI7ASogAUEBaiEBQQAhAAJAIAIoAjgiA0UNACADKAIwIgNFDQAgAiADEQAAIQALIAANAQtBxwAhAwxzCyAAQRVGBEAgAkHRADYCHCACIAE2AhQgAkHjFzYCECACQRU2AgxBACEDDIwBC0EAIQMgAkEANgIcIAIgATYCFCACQbkNNgIQIAJBGjYCDAyLAQtBACEDIAJBADYCHCACIAE2AhQgAkGgGTYCECACQR42AgwMigELIAEtAABBOkYEQCACKAIEIQBBACEDIAJBADYCBCACIAAgARApIgBFDQEgAkHDADYCHCACIAA2AgwgAiABQQFqNgIUDIoBC0EAIQMgAkEANgIcIAIgATYCFCACQbERNgIQIAJBCjYCDAyJAQsgAUEBaiEBQTshAwxvCyACQcMANgIcIAIgADYCDCACIAFBAWo2AhQMhwELQQAhAyACQQA2AhwgAiABNgIUIAJB8A42AhAgAkEcNgIMDIYBCyACIAIvATBBEHI7ATAMZgsCQCACLwEwIgBBCHFFDQAgAi0AKEEBRw0AIAItAC1BCHFFDQMLIAIgAEH3+wNxQYAEcjsBMAwECyABIARHBEACQANAIAEtAABBMGsiAEH/AXFBCk8EQEE1IQMMbgsgAikDICIKQpmz5syZs+bMGVYNASACIApCCn4iCjcDICAKIACtQv8BgyILQn+FVg0BIAIgCiALfDcDICAEIAFBAWoiAUcNAAtBOSEDDIUBCyACKAIEIQBBACEDIAJBADYCBCACIAAgAUEBaiIBECoiAA0MDHcLQTkhAwyDAQsgAi0AMEEgcQ0GQcUBIQMMaQtBACEDIAJBADYCBCACIAEgARAqIgBFDQQgAkE6NgIcIAIgADYCDCACIAFBAWo2AhQMgQELIAItAChBAUcNACACLQAtQQhxRQ0BC0E3IQMMZgsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEQKiIABEAgAkE7NgIcIAIgADYCDCACIAFBAWo2AhQMfwsgAUEBaiEBDG4LIAJBCDoALAwECyABQQFqIQEMbQtBACEDIAJBADYCHCACIAE2AhQgAkHkEjYCECACQQQ2AgwMewsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEQKiIARQ1sIAJBNzYCHCACIAE2AhQgAiAANgIMDHoLIAIgAi8BMEEgcjsBMAtBMCEDDF8LIAJBNjYCHCACIAE2AhQgAiAANgIMDHcLIABBLEcNASABQQFqIQBBASEBAkACQAJAAkACQCACLQAsQQVrDgQDAQIEAAsgACEBDAQLQQIhAQwBC0EEIQELIAJBAToALCACIAIvATAgAXI7ATAgACEBDAELIAIgAi8BMEEIcjsBMCAAIQELQTkhAwxcCyACQQA6ACwLQTQhAwxaCyABIARGBEBBLSEDDHMLAkACQANAAkAgAS0AAEEKaw4EAgAAAwALIAQgAUEBaiIBRw0AC0EtIQMMdAsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEQKiIARQ0CIAJBLDYCHCACIAE2AhQgAiAANgIMDHMLIAIoAgQhAEEAIQMgAkEANgIEIAIgACABECoiAEUEQCABQQFqIQEMAgsgAkEsNgIcIAIgADYCDCACIAFBAWo2AhQMcgsgAS0AAEENRgRAIAIoAgQhAEEAIQMgAkEANgIEIAIgACABECoiAEUEQCABQQFqIQEMAgsgAkEsNgIcIAIgADYCDCACIAFBAWo2AhQMcgsgAi0ALUEBcQRAQcQBIQMMWQsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEQKiIADQEMZQtBLyEDDFcLIAJBLjYCHCACIAE2AhQgAiAANgIMDG8LQQAhAyACQQA2AhwgAiABNgIUIAJB8BQ2AhAgAkEDNgIMDG4LQQEhAwJAAkACQAJAIAItACxBBWsOBAMBAgAECyACIAIvATBBCHI7ATAMAwtBAiEDDAELQQQhAwsgAkEBOgAsIAIgAi8BMCADcjsBMAtBKiEDDFMLQQAhAyACQQA2AhwgAiABNgIUIAJB4Q82AhAgAkEKNgIMDGsLQQEhAwJAAkACQAJAAkACQCACLQAsQQJrDgcFBAQDAQIABAsgAiACLwEwQQhyOwEwDAMLQQIhAwwBC0EEIQMLIAJBAToALCACIAIvATAgA3I7ATALQSshAwxSC0EAIQMgAkEANgIcIAIgATYCFCACQasSNgIQIAJBCzYCDAxqC0EAIQMgAkEANgIcIAIgATYCFCACQf0NNgIQIAJBHTYCDAxpCyABIARHBEADQCABLQAAQSBHDUggBCABQQFqIgFHDQALQSUhAwxpC0ElIQMMaAsgAi0ALUEBcQRAQcMBIQMMTwsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEQKSIABEAgAkEmNgIcIAIgADYCDCACIAFBAWo2AhQMaAsgAUEBaiEBDFwLIAFBAWohASACLwEwIgBBgAFxBEBBACEAAkAgAigCOCIDRQ0AIAMoAlQiA0UNACACIAMRAAAhAAsgAEUNBiAAQRVHDR8gAkEFNgIcIAIgATYCFCACQfkXNgIQIAJBFTYCDEEAIQMMZwsCQCAAQaAEcUGgBEcNACACLQAtQQJxDQBBACEDIAJBADYCHCACIAE2AhQgAkGWEzYCECACQQQ2AgwMZwsgAgJ/IAIvATBBFHFBFEYEQEEBIAItAChBAUYNARogAi8BMkHlAEYMAQsgAi0AKUEFRgs6AC5BACEAAkAgAigCOCIDRQ0AIAMoAiQiA0UNACACIAMRAAAhAAsCQAJAAkACQAJAIAAOFgIBAAQEBAQEBAQEBAQEBAQEBAQEBAMECyACQQE6AC4LIAIgAi8BMEHAAHI7ATALQSchAwxPCyACQSM2AhwgAiABNgIUIAJBpRY2AhAgAkEVNgIMQQAhAwxnC0EAIQMgAkEANgIcIAIgATYCFCACQdULNgIQIAJBETYCDAxmC0EAIQACQCACKAI4IgNFDQAgAygCLCIDRQ0AIAIgAxEAACEACyAADQELQQ4hAwxLCyAAQRVGBEAgAkECNgIcIAIgATYCFCACQbAYNgIQIAJBFTYCDEEAIQMMZAtBACEDIAJBADYCHCACIAE2AhQgAkGnDjYCECACQRI2AgwMYwtBACEDIAJBADYCHCACIAE2AhQgAkGqHDYCECACQQ82AgwMYgsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEgCqdqIgEQKyIARQ0AIAJBBTYCHCACIAE2AhQgAiAANgIMDGELQQ8hAwxHC0EAIQMgAkEANgIcIAIgATYCFCACQc0TNgIQIAJBDDYCDAxfC0IBIQoLIAFBAWohAQJAIAIpAyAiC0L//////////w9YBEAgAiALQgSGIAqENwMgDAELQQAhAyACQQA2AhwgAiABNgIUIAJBrQk2AhAgAkEMNgIMDF4LQSQhAwxEC0EAIQMgAkEANgIcIAIgATYCFCACQc0TNgIQIAJBDDYCDAxcCyACKAIEIQBBACEDIAJBADYCBCACIAAgARAsIgBFBEAgAUEBaiEBDFILIAJBFzYCHCACIAA2AgwgAiABQQFqNgIUDFsLIAIoAgQhAEEAIQMgAkEANgIEAkAgAiAAIAEQLCIARQRAIAFBAWohAQwBCyACQRY2AhwgAiAANgIMIAIgAUEBajYCFAxbC0EfIQMMQQtBACEDIAJBADYCHCACIAE2AhQgAkGaDzYCECACQSI2AgwMWQsgAigCBCEAQQAhAyACQQA2AgQgAiAAIAEQLSIARQRAIAFBAWohAQxQCyACQRQ2AhwgAiAANgIMIAIgAUEBajYCFAxYCyACKAIEIQBBACEDIAJBADYCBAJAIAIgACABEC0iAEUEQCABQQFqIQEMAQsgAkETNgIcIAIgADYCDCACIAFBAWo2AhQMWAtBHiEDDD4LQQAhAyACQQA2AhwgAiABNgIUIAJBxgw2AhAgAkEjNgIMDFYLIAIoAgQhAEEAIQMgAkEANgIEIAIgACABEC0iAEUEQCABQQFqIQEMTgsgAkERNgIcIAIgADYCDCACIAFBAWo2AhQMVQsgAkEQNgIcIAIgATYCFCACIAA2AgwMVAtBACEDIAJBADYCHCACIAE2AhQgAkHGDDYCECACQSM2AgwMUwtBACEDIAJBADYCHCACIAE2AhQgAkHAFTYCECACQQI2AgwMUgsgAigCBCEAQQAhAyACQQA2AgQCQCACIAAgARAtIgBFBEAgAUEBaiEBDAELIAJBDjYCHCACIAA2AgwgAiABQQFqNgIUDFILQRshAww4C0EAIQMgAkEANgIcIAIgATYCFCACQcYMNgIQIAJBIzYCDAxQCyACKAIEIQBBACEDIAJBADYCBAJAIAIgACABECwiAEUEQCABQQFqIQEMAQsgAkENNgIcIAIgADYCDCACIAFBAWo2AhQMUAtBGiEDDDYLQQAhAyACQQA2AhwgAiABNgIUIAJBmg82AhAgAkEiNgIMDE4LIAIoAgQhAEEAIQMgAkEANgIEAkAgAiAAIAEQLCIARQRAIAFBAWohAQwBCyACQQw2AhwgAiAANgIMIAIgAUEBajYCFAxOC0EZIQMMNAtBACEDIAJBADYCHCACIAE2AhQgAkGaDzYCECACQSI2AgwMTAsgAEEVRwRAQQAhAyACQQA2AhwgAiABNgIUIAJBgww2AhAgAkETNgIMDEwLIAJBCjYCHCACIAE2AhQgAkHkFjYCECACQRU2AgxBACEDDEsLIAIoAgQhAEEAIQMgAkEANgIEIAIgACABIAqnaiIBECsiAARAIAJBBzYCHCACIAE2AhQgAiAANgIMDEsLQRMhAwwxCyAAQRVHBEBBACEDIAJBADYCHCACIAE2AhQgAkHaDTYCECACQRQ2AgwMSgsgAkEeNgIcIAIgATYCFCACQfkXNgIQIAJBFTYCDEEAIQMMSQtBACEAAkAgAigCOCIDRQ0AIAMoAiwiA0UNACACIAMRAAAhAAsgAEUNQSAAQRVGBEAgAkEDNgIcIAIgATYCFCACQbAYNgIQIAJBFTYCDEEAIQMMSQtBACEDIAJBADYCHCACIAE2AhQgAkGnDjYCECACQRI2AgwMSAtBACEDIAJBADYCHCACIAE2AhQgAkHaDTYCECACQRQ2AgwMRwtBACEDIAJBADYCHCACIAE2AhQgAkGnDjYCECACQRI2AgwMRgsgAkEAOgAvIAItAC1BBHFFDT8LIAJBADoALyACQQE6ADRBACEDDCsLQQAhAyACQQA2AhwgAkHkETYCECACQQc2AgwgAiABQQFqNgIUDEMLAkADQAJAIAEtAABBCmsOBAACAgACCyAEIAFBAWoiAUcNAAtB3QEhAwxDCwJAAkAgAi0ANEEBRw0AQQAhAAJAIAIoAjgiA0UNACADKAJYIgNFDQAgAiADEQAAIQALIABFDQAgAEEVRw0BIAJB3AE2AhwgAiABNgIUIAJB1RY2AhAgAkEVNgIMQQAhAwxEC0HBASEDDCoLIAJBADYCHCACIAE2AhQgAkHpCzYCECACQR82AgxBACEDDEILAkACQCACLQAoQQFrDgIEAQALQcABIQMMKQtBuQEhAwwoCyACQQI6AC9BACEAAkAgAigCOCIDRQ0AIAMoAgAiA0UNACACIAMRAAAhAAsgAEUEQEHCASEDDCgLIABBFUcEQCACQQA2AhwgAiABNgIUIAJBpAw2AhAgAkEQNgIMQQAhAwxBCyACQdsBNgIcIAIgATYCFCACQfoWNgIQIAJBFTYCDEEAIQMMQAsgASAERgRAQdoBIQMMQAsgAS0AAEHIAEYNASACQQE6ACgLQawBIQMMJQtBvwEhAwwkCyABIARHBEAgAkEQNgIIIAIgATYCBEG+ASEDDCQLQdkBIQMMPAsgASAERgRAQdgBIQMMPAsgAS0AAEHIAEcNBCABQQFqIQFBvQEhAwwiCyABIARGBEBB1wEhAww7CwJAAkAgAS0AAEHFAGsOEAAFBQUFBQUFBQUFBQUFBQEFCyABQQFqIQFBuwEhAwwiCyABQQFqIQFBvAEhAwwhC0HWASEDIAEgBEYNOSACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGD0ABqLQAARw0DIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAw6CyACKAIEIQAgAkIANwMAIAIgACAGQQFqIgEQJyIARQRAQcYBIQMMIQsgAkHVATYCHCACIAE2AhQgAiAANgIMQQAhAww5C0HUASEDIAEgBEYNOCACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEGB0ABqLQAARw0CIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAw5CyACQYEEOwEoIAIoAgQhACACQgA3AwAgAiAAIAZBAWoiARAnIgANAwwCCyACQQA2AgALQQAhAyACQQA2AhwgAiABNgIUIAJB2Bs2AhAgAkEINgIMDDYLQboBIQMMHAsgAkHTATYCHCACIAE2AhQgAiAANgIMQQAhAww0C0EAIQACQCACKAI4IgNFDQAgAygCOCIDRQ0AIAIgAxEAACEACyAARQ0AIABBFUYNASACQQA2AhwgAiABNgIUIAJBzA42AhAgAkEgNgIMQQAhAwwzC0HkACEDDBkLIAJB+AA2AhwgAiABNgIUIAJByhg2AhAgAkEVNgIMQQAhAwwxC0HSASEDIAQgASIARg0wIAQgAWsgAigCACIBaiEFIAAgAWtBBGohBgJAA0AgAC0AACABQfzPAGotAABHDQEgAUEERg0DIAFBAWohASAEIABBAWoiAEcNAAsgAiAFNgIADDELIAJBADYCHCACIAA2AhQgAkGQMzYCECACQQg2AgwgAkEANgIAQQAhAwwwCyABIARHBEAgAkEONgIIIAIgATYCBEG3ASEDDBcLQdEBIQMMLwsgAkEANgIAIAZBAWohAQtBuAEhAwwUCyABIARGBEBB0AEhAwwtCyABLQAAQTBrIgBB/wFxQQpJBEAgAiAAOgAqIAFBAWohAUG2ASEDDBQLIAIoAgQhACACQQA2AgQgAiAAIAEQKCIARQ0UIAJBzwE2AhwgAiABNgIUIAIgADYCDEEAIQMMLAsgASAERgRAQc4BIQMMLAsCQCABLQAAQS5GBEAgAUEBaiEBDAELIAIoAgQhACACQQA2AgQgAiAAIAEQKCIARQ0VIAJBzQE2AhwgAiABNgIUIAIgADYCDEEAIQMMLAtBtQEhAwwSCyAEIAEiBUYEQEHMASEDDCsLQQAhAEEBIQFBASEGQQAhAwJAAkACQAJAAkACfwJAAkACQAJAAkACQAJAIAUtAABBMGsOCgoJAAECAwQFBggLC0ECDAYLQQMMBQtBBAwEC0EFDAMLQQYMAgtBBwwBC0EICyEDQQAhAUEAIQYMAgtBCSEDQQEhAEEAIQFBACEGDAELQQAhAUEBIQMLIAIgAzoAKyAFQQFqIQMCQAJAIAItAC1BEHENAAJAAkACQCACLQAqDgMBAAIECyAGRQ0DDAILIAANAQwCCyABRQ0BCyACKAIEIQAgAkEANgIEIAIgACADECgiAEUEQCADIQEMAwsgAkHJATYCHCACIAM2AhQgAiAANgIMQQAhAwwtCyACKAIEIQAgAkEANgIEIAIgACADECgiAEUEQCADIQEMGAsgAkHKATYCHCACIAM2AhQgAiAANgIMQQAhAwwsCyACKAIEIQAgAkEANgIEIAIgACAFECgiAEUEQCAFIQEMFgsgAkHLATYCHCACIAU2AhQgAiAANgIMDCsLQbQBIQMMEQtBACEAAkAgAigCOCIDRQ0AIAMoAjwiA0UNACACIAMRAAAhAAsCQCAABEAgAEEVRg0BIAJBADYCHCACIAE2AhQgAkGUDTYCECACQSE2AgxBACEDDCsLQbIBIQMMEQsgAkHIATYCHCACIAE2AhQgAkHJFzYCECACQRU2AgxBACEDDCkLIAJBADYCACAGQQFqIQFB9QAhAwwPCyACLQApQQVGBEBB4wAhAwwPC0HiACEDDA4LIAAhASACQQA2AgALIAJBADoALEEJIQMMDAsgAkEANgIAIAdBAWohAUHAACEDDAsLQQELOgAsIAJBADYCACAGQQFqIQELQSkhAwwIC0E4IQMMBwsCQCABIARHBEADQCABLQAAQYA+ai0AACIAQQFHBEAgAEECRw0DIAFBAWohAQwFCyAEIAFBAWoiAUcNAAtBPiEDDCELQT4hAwwgCwsgAkEAOgAsDAELQQshAwwEC0E6IQMMAwsgAUEBaiEBQS0hAwwCCyACIAE6ACwgAkEANgIAIAZBAWohAUEMIQMMAQsgAkEANgIAIAZBAWohAUEKIQMMAAsAC0EAIQMgAkEANgIcIAIgATYCFCACQc0QNgIQIAJBCTYCDAwXC0EAIQMgAkEANgIcIAIgATYCFCACQekKNgIQIAJBCTYCDAwWC0EAIQMgAkEANgIcIAIgATYCFCACQbcQNgIQIAJBCTYCDAwVC0EAIQMgAkEANgIcIAIgATYCFCACQZwRNgIQIAJBCTYCDAwUC0EAIQMgAkEANgIcIAIgATYCFCACQc0QNgIQIAJBCTYCDAwTC0EAIQMgAkEANgIcIAIgATYCFCACQekKNgIQIAJBCTYCDAwSC0EAIQMgAkEANgIcIAIgATYCFCACQbcQNgIQIAJBCTYCDAwRC0EAIQMgAkEANgIcIAIgATYCFCACQZwRNgIQIAJBCTYCDAwQC0EAIQMgAkEANgIcIAIgATYCFCACQZcVNgIQIAJBDzYCDAwPC0EAIQMgAkEANgIcIAIgATYCFCACQZcVNgIQIAJBDzYCDAwOC0EAIQMgAkEANgIcIAIgATYCFCACQcASNgIQIAJBCzYCDAwNC0EAIQMgAkEANgIcIAIgATYCFCACQZUJNgIQIAJBCzYCDAwMC0EAIQMgAkEANgIcIAIgATYCFCACQeEPNgIQIAJBCjYCDAwLC0EAIQMgAkEANgIcIAIgATYCFCACQfsPNgIQIAJBCjYCDAwKC0EAIQMgAkEANgIcIAIgATYCFCACQfEZNgIQIAJBAjYCDAwJC0EAIQMgAkEANgIcIAIgATYCFCACQcQUNgIQIAJBAjYCDAwIC0EAIQMgAkEANgIcIAIgATYCFCACQfIVNgIQIAJBAjYCDAwHCyACQQI2AhwgAiABNgIUIAJBnBo2AhAgAkEWNgIMQQAhAwwGC0EBIQMMBQtB1AAhAyABIARGDQQgCEEIaiEJIAIoAgAhBQJAAkAgASAERwRAIAVB2MIAaiEHIAQgBWogAWshACAFQX9zQQpqIgUgAWohBgNAIAEtAAAgBy0AAEcEQEECIQcMAwsgBUUEQEEAIQcgBiEBDAMLIAVBAWshBSAHQQFqIQcgBCABQQFqIgFHDQALIAAhBSAEIQELIAlBATYCACACIAU2AgAMAQsgAkEANgIAIAkgBzYCAAsgCSABNgIEIAgoAgwhACAIKAIIDgMBBAIACwALIAJBADYCHCACQbUaNgIQIAJBFzYCDCACIABBAWo2AhRBACEDDAILIAJBADYCHCACIAA2AhQgAkHKGjYCECACQQk2AgxBACEDDAELIAEgBEYEQEEiIQMMAQsgAkEJNgIIIAIgATYCBEEhIQMLIAhBEGokACADRQRAIAIoAgwhAAwBCyACIAM2AhxBACEAIAIoAgQiAUUNACACIAEgBCACKAIIEQEAIgFFDQAgAiAENgIUIAIgATYCDCABIQALIAALvgIBAn8gAEEAOgAAIABB3ABqIgFBAWtBADoAACAAQQA6AAIgAEEAOgABIAFBA2tBADoAACABQQJrQQA6AAAgAEEAOgADIAFBBGtBADoAAEEAIABrQQNxIgEgAGoiAEEANgIAQdwAIAFrQXxxIgIgAGoiAUEEa0EANgIAAkAgAkEJSQ0AIABBADYCCCAAQQA2AgQgAUEIa0EANgIAIAFBDGtBADYCACACQRlJDQAgAEEANgIYIABBADYCFCAAQQA2AhAgAEEANgIMIAFBEGtBADYCACABQRRrQQA2AgAgAUEYa0EANgIAIAFBHGtBADYCACACIABBBHFBGHIiAmsiAUEgSQ0AIAAgAmohAANAIABCADcDGCAAQgA3AxAgAEIANwMIIABCADcDACAAQSBqIQAgAUEgayIBQR9LDQALCwtWAQF/AkAgACgCDA0AAkACQAJAAkAgAC0ALw4DAQADAgsgACgCOCIBRQ0AIAEoAiwiAUUNACAAIAERAAAiAQ0DC0EADwsACyAAQcMWNgIQQQ4hAQsgAQsaACAAKAIMRQRAIABB0Rs2AhAgAEEVNgIMCwsUACAAKAIMQRVGBEAgAEEANgIMCwsUACAAKAIMQRZGBEAgAEEANgIMCwsHACAAKAIMCwcAIAAoAhALCQAgACABNgIQCwcAIAAoAhQLFwAgAEEkTwRAAAsgAEECdEGgM2ooAgALFwAgAEEuTwRAAAsgAEECdEGwNGooAgALvwkBAX9B6yghAQJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIABB5ABrDvQDY2IAAWFhYWFhYQIDBAVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhBgcICQoLDA0OD2FhYWFhEGFhYWFhYWFhYWFhEWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYRITFBUWFxgZGhthYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2YTc4OTphYWFhYWFhYTthYWE8YWFhYT0+P2FhYWFhYWFhQGFhQWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYUJDREVGR0hJSktMTU5PUFFSU2FhYWFhYWFhVFVWV1hZWlthXF1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFeYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhX2BhC0HhJw8LQaQhDwtByywPC0H+MQ8LQcAkDwtBqyQPC0GNKA8LQeImDwtBgDAPC0G5Lw8LQdckDwtB7x8PC0HhHw8LQfofDwtB8iAPC0GoLw8LQa4yDwtBiDAPC0HsJw8LQYIiDwtBjh0PC0HQLg8LQcojDwtBxTIPC0HfHA8LQdIcDwtBxCAPC0HXIA8LQaIfDwtB7S4PC0GrMA8LQdQlDwtBzC4PC0H6Lg8LQfwrDwtB0jAPC0HxHQ8LQbsgDwtB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AAADAEGUCAsFBAAAAAUAQaQICwkGAAAABwAAAAgAQdwIC4otSW52YWxpZCBjaGFyIGluIHVybCBxdWVyeQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2JvZHkAQ29udGVudC1MZW5ndGggb3ZlcmZsb3cAQ2h1bmsgc2l6ZSBvdmVyZmxvdwBSZXNwb25zZSBvdmVyZmxvdwBJbnZhbGlkIG1ldGhvZCBmb3IgSFRUUC94LnggcmVxdWVzdABJbnZhbGlkIG1ldGhvZCBmb3IgUlRTUC94LnggcmVxdWVzdABFeHBlY3RlZCBTT1VSQ0UgbWV0aG9kIGZvciBJQ0UveC54IHJlcXVlc3QASW52YWxpZCBjaGFyIGluIHVybCBmcmFnbWVudCBzdGFydABFeHBlY3RlZCBkb3QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9zdGF0dXMASW52YWxpZCByZXNwb25zZSBzdGF0dXMASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucwBVc2VyIGNhbGxiYWNrIGVycm9yAGBvbl9yZXNldGAgY2FsbGJhY2sgZXJyb3IAYG9uX2NodW5rX2hlYWRlcmAgY2FsbGJhY2sgZXJyb3IAYG9uX21lc3NhZ2VfYmVnaW5gIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19leHRlbnNpb25fdmFsdWVgIGNhbGxiYWNrIGVycm9yAGBvbl9zdGF0dXNfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl92ZXJzaW9uX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fdXJsX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fbWV0aG9kX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX25hbWVgIGNhbGxiYWNrIGVycm9yAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2VydmVyAEludmFsaWQgaGVhZGVyIHZhbHVlIGNoYXIASW52YWxpZCBoZWFkZXIgZmllbGQgY2hhcgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3ZlcnNpb24ASW52YWxpZCBtaW5vciB2ZXJzaW9uAEludmFsaWQgbWFqb3IgdmVyc2lvbgBFeHBlY3RlZCBzcGFjZSBhZnRlciB2ZXJzaW9uAEV4cGVjdGVkIENSTEYgYWZ0ZXIgdmVyc2lvbgBJbnZhbGlkIEhUVFAgdmVyc2lvbgBJbnZhbGlkIGhlYWRlciB0b2tlbgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3VybABJbnZhbGlkIGNoYXJhY3RlcnMgaW4gdXJsAFVuZXhwZWN0ZWQgc3RhcnQgY2hhciBpbiB1cmwARG91YmxlIEAgaW4gdXJsAEVtcHR5IENvbnRlbnQtTGVuZ3RoAEludmFsaWQgY2hhcmFjdGVyIGluIENvbnRlbnQtTGVuZ3RoAER1cGxpY2F0ZSBDb250ZW50LUxlbmd0aABJbnZhbGlkIGNoYXIgaW4gdXJsIHBhdGgAQ29udGVudC1MZW5ndGggY2FuJ3QgYmUgcHJlc2VudCB3aXRoIFRyYW5zZmVyLUVuY29kaW5nAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIHNpemUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfdmFsdWUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9jaHVua19leHRlbnNpb25fdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyB2YWx1ZQBNaXNzaW5nIGV4cGVjdGVkIExGIGFmdGVyIGhlYWRlciB2YWx1ZQBJbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AgaGVhZGVyIHZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGUgdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZWQgdmFsdWUAUGF1c2VkIGJ5IG9uX2hlYWRlcnNfY29tcGxldGUASW52YWxpZCBFT0Ygc3RhdGUAb25fcmVzZXQgcGF1c2UAb25fY2h1bmtfaGVhZGVyIHBhdXNlAG9uX21lc3NhZ2VfYmVnaW4gcGF1c2UAb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlIHBhdXNlAG9uX3N0YXR1c19jb21wbGV0ZSBwYXVzZQBvbl92ZXJzaW9uX2NvbXBsZXRlIHBhdXNlAG9uX3VybF9jb21wbGV0ZSBwYXVzZQBvbl9jaHVua19jb21wbGV0ZSBwYXVzZQBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGUgcGF1c2UAb25fbWVzc2FnZV9jb21wbGV0ZSBwYXVzZQBvbl9tZXRob2RfY29tcGxldGUgcGF1c2UAb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlIHBhdXNlAG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lIHBhdXNlAFVuZXhwZWN0ZWQgc3BhY2UgYWZ0ZXIgc3RhcnQgbGluZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgbmFtZQBQYXVzZSBvbiBDT05ORUNUL1VwZ3JhZGUAUGF1c2Ugb24gUFJJL1VwZ3JhZGUARXhwZWN0ZWQgSFRUUC8yIENvbm5lY3Rpb24gUHJlZmFjZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX21ldGhvZABFeHBlY3RlZCBzcGFjZSBhZnRlciBtZXRob2QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfZmllbGQAUGF1c2VkAEludmFsaWQgd29yZCBlbmNvdW50ZXJlZABJbnZhbGlkIG1ldGhvZCBlbmNvdW50ZXJlZABVbmV4cGVjdGVkIGNoYXIgaW4gdXJsIHNjaGVtYQBSZXF1ZXN0IGhhcyBpbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AAU1dJVENIX1BST1hZAFVTRV9QUk9YWQBNS0FDVElWSVRZAFVOUFJPQ0VTU0FCTEVfRU5USVRZAENPUFkATU9WRURfUEVSTUFORU5UTFkAVE9PX0VBUkxZAE5PVElGWQBGQUlMRURfREVQRU5ERU5DWQBCQURfR0FURVdBWQBQTEFZAFBVVABDSEVDS09VVABHQVRFV0FZX1RJTUVPVVQAUkVRVUVTVF9USU1FT1VUAE5FVFdPUktfQ09OTkVDVF9USU1FT1VUAENPTk5FQ1RJT05fVElNRU9VVABMT0dJTl9USU1FT1VUAE5FVFdPUktfUkVBRF9USU1FT1VUAFBPU1QATUlTRElSRUNURURfUkVRVUVTVABDTElFTlRfQ0xPU0VEX1JFUVVFU1QAQ0xJRU5UX0NMT1NFRF9MT0FEX0JBTEFOQ0VEX1JFUVVFU1QAQkFEX1JFUVVFU1QASFRUUF9SRVFVRVNUX1NFTlRfVE9fSFRUUFNfUE9SVABSRVBPUlQASU1fQV9URUFQT1QAUkVTRVRfQ09OVEVOVABOT19DT05URU5UAFBBUlRJQUxfQ09OVEVOVABIUEVfSU5WQUxJRF9DT05TVEFOVABIUEVfQ0JfUkVTRVQAR0VUAEhQRV9TVFJJQ1QAQ09ORkxJQ1QAVEVNUE9SQVJZX1JFRElSRUNUAFBFUk1BTkVOVF9SRURJUkVDVABDT05ORUNUAE1VTFRJX1NUQVRVUwBIUEVfSU5WQUxJRF9TVEFUVVMAVE9PX01BTllfUkVRVUVTVFMARUFSTFlfSElOVFMAVU5BVkFJTEFCTEVfRk9SX0xFR0FMX1JFQVNPTlMAT1BUSU9OUwBTV0lUQ0hJTkdfUFJPVE9DT0xTAFZBUklBTlRfQUxTT19ORUdPVElBVEVTAE1VTFRJUExFX0NIT0lDRVMASU5URVJOQUxfU0VSVkVSX0VSUk9SAFdFQl9TRVJWRVJfVU5LTk9XTl9FUlJPUgBSQUlMR1VOX0VSUk9SAElERU5USVRZX1BST1ZJREVSX0FVVEhFTlRJQ0FUSU9OX0VSUk9SAFNTTF9DRVJUSUZJQ0FURV9FUlJPUgBJTlZBTElEX1hfRk9SV0FSREVEX0ZPUgBTRVRfUEFSQU1FVEVSAEdFVF9QQVJBTUVURVIASFBFX1VTRVIAU0VFX09USEVSAEhQRV9DQl9DSFVOS19IRUFERVIATUtDQUxFTkRBUgBTRVRVUABXRUJfU0VSVkVSX0lTX0RPV04AVEVBUkRPV04ASFBFX0NMT1NFRF9DT05ORUNUSU9OAEhFVVJJU1RJQ19FWFBJUkFUSU9OAERJU0NPTk5FQ1RFRF9PUEVSQVRJT04ATk9OX0FVVEhPUklUQVRJVkVfSU5GT1JNQVRJT04ASFBFX0lOVkFMSURfVkVSU0lPTgBIUEVfQ0JfTUVTU0FHRV9CRUdJTgBTSVRFX0lTX0ZST1pFTgBIUEVfSU5WQUxJRF9IRUFERVJfVE9LRU4ASU5WQUxJRF9UT0tFTgBGT1JCSURERU4ARU5IQU5DRV9ZT1VSX0NBTE0ASFBFX0lOVkFMSURfVVJMAEJMT0NLRURfQllfUEFSRU5UQUxfQ09OVFJPTABNS0NPTABBQ0wASFBFX0lOVEVSTkFMAFJFUVVFU1RfSEVBREVSX0ZJRUxEU19UT09fTEFSR0VfVU5PRkZJQ0lBTABIUEVfT0sAVU5MSU5LAFVOTE9DSwBQUkkAUkVUUllfV0lUSABIUEVfSU5WQUxJRF9DT05URU5UX0xFTkdUSABIUEVfVU5FWFBFQ1RFRF9DT05URU5UX0xFTkdUSABGTFVTSABQUk9QUEFUQ0gATS1TRUFSQ0gAVVJJX1RPT19MT05HAFBST0NFU1NJTkcATUlTQ0VMTEFORU9VU19QRVJTSVNURU5UX1dBUk5JTkcATUlTQ0VMTEFORU9VU19XQVJOSU5HAEhQRV9JTlZBTElEX1RSQU5TRkVSX0VOQ09ESU5HAEV4cGVjdGVkIENSTEYASFBFX0lOVkFMSURfQ0hVTktfU0laRQBNT1ZFAENPTlRJTlVFAEhQRV9DQl9TVEFUVVNfQ09NUExFVEUASFBFX0NCX0hFQURFUlNfQ09NUExFVEUASFBFX0NCX1ZFUlNJT05fQ09NUExFVEUASFBFX0NCX1VSTF9DT01QTEVURQBIUEVfQ0JfQ0hVTktfQ09NUExFVEUASFBFX0NCX0hFQURFUl9WQUxVRV9DT01QTEVURQBIUEVfQ0JfQ0hVTktfRVhURU5TSU9OX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fTkFNRV9DT01QTEVURQBIUEVfQ0JfTUVTU0FHRV9DT01QTEVURQBIUEVfQ0JfTUVUSE9EX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJfRklFTERfQ09NUExFVEUAREVMRVRFAEhQRV9JTlZBTElEX0VPRl9TVEFURQBJTlZBTElEX1NTTF9DRVJUSUZJQ0FURQBQQVVTRQBOT19SRVNQT05TRQBVTlNVUFBPUlRFRF9NRURJQV9UWVBFAEdPTkUATk9UX0FDQ0VQVEFCTEUAU0VSVklDRV9VTkFWQUlMQUJMRQBSQU5HRV9OT1RfU0FUSVNGSUFCTEUAT1JJR0lOX0lTX1VOUkVBQ0hBQkxFAFJFU1BPTlNFX0lTX1NUQUxFAFBVUkdFAE1FUkdFAFJFUVVFU1RfSEVBREVSX0ZJRUxEU19UT09fTEFSR0UAUkVRVUVTVF9IRUFERVJfVE9PX0xBUkdFAFBBWUxPQURfVE9PX0xBUkdFAElOU1VGRklDSUVOVF9TVE9SQUdFAEhQRV9QQVVTRURfVVBHUkFERQBIUEVfUEFVU0VEX0gyX1VQR1JBREUAU09VUkNFAEFOTk9VTkNFAFRSQUNFAEhQRV9VTkVYUEVDVEVEX1NQQUNFAERFU0NSSUJFAFVOU1VCU0NSSUJFAFJFQ09SRABIUEVfSU5WQUxJRF9NRVRIT0QATk9UX0ZPVU5EAFBST1BGSU5EAFVOQklORABSRUJJTkQAVU5BVVRIT1JJWkVEAE1FVEhPRF9OT1RfQUxMT1dFRABIVFRQX1ZFUlNJT05fTk9UX1NVUFBPUlRFRABBTFJFQURZX1JFUE9SVEVEAEFDQ0VQVEVEAE5PVF9JTVBMRU1FTlRFRABMT09QX0RFVEVDVEVEAEhQRV9DUl9FWFBFQ1RFRABIUEVfTEZfRVhQRUNURUQAQ1JFQVRFRABJTV9VU0VEAEhQRV9QQVVTRUQAVElNRU9VVF9PQ0NVUkVEAFBBWU1FTlRfUkVRVUlSRUQAUFJFQ09ORElUSU9OX1JFUVVJUkVEAFBST1hZX0FVVEhFTlRJQ0FUSU9OX1JFUVVJUkVEAE5FVFdPUktfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATEVOR1RIX1JFUVVJUkVEAFNTTF9DRVJUSUZJQ0FURV9SRVFVSVJFRABVUEdSQURFX1JFUVVJUkVEAFBBR0VfRVhQSVJFRABQUkVDT05ESVRJT05fRkFJTEVEAEVYUEVDVEFUSU9OX0ZBSUxFRABSRVZBTElEQVRJT05fRkFJTEVEAFNTTF9IQU5EU0hBS0VfRkFJTEVEAExPQ0tFRABUUkFOU0ZPUk1BVElPTl9BUFBMSUVEAE5PVF9NT0RJRklFRABOT1RfRVhURU5ERUQAQkFORFdJRFRIX0xJTUlUX0VYQ0VFREVEAFNJVEVfSVNfT1ZFUkxPQURFRABIRUFEAEV4cGVjdGVkIEhUVFAvAABeEwAAJhMAADAQAADwFwAAnRMAABUSAAA5FwAA8BIAAAoQAAB1EgAArRIAAIITAABPFAAAfxAAAKAVAAAjFAAAiRIAAIsUAABNFQAA1BEAAM8UAAAQGAAAyRYAANwWAADBEQAA4BcAALsUAAB0FAAAfBUAAOUUAAAIFwAAHxAAAGUVAACjFAAAKBUAAAIVAACZFQAALBAAAIsZAABPDwAA1A4AAGoQAADOEAAAAhcAAIkOAABuEwAAHBMAAGYUAABWFwAAwRMAAM0TAABsEwAAaBcAAGYXAABfFwAAIhMAAM4PAABpDgAA2A4AAGMWAADLEwAAqg4AACgXAAAmFwAAxRMAAF0WAADoEQAAZxMAAGUTAADyFgAAcxMAAB0XAAD5FgAA8xEAAM8OAADOFQAADBIAALMRAAClEQAAYRAAADIXAAC7EwBB+TULAQEAQZA2C+ABAQECAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQf03CwEBAEGROAteAgMCAgICAgAAAgIAAgIAAgICAgICAgICAgAEAAAAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAAIAAgBB/TkLAQEAQZE6C14CAAICAgICAAACAgACAgACAgICAgICAgICAAMABAAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgACAEHwOwsNbG9zZWVlcC1hbGl2ZQBBiTwLAQEAQaA8C+ABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQYk+CwEBAEGgPgvnAQEBAQEBAQEBAQEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBY2h1bmtlZABBsMAAC18BAQABAQEBAQAAAQEAAQEAAQEBAQEBAQEBAQAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQBBkMIACyFlY3Rpb25lbnQtbGVuZ3Rob25yb3h5LWNvbm5lY3Rpb24AQcDCAAstcmFuc2Zlci1lbmNvZGluZ3BncmFkZQ0KDQoNClNNDQoNClRUUC9DRS9UU1AvAEH5wgALBQECAAEDAEGQwwAL4AEEAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB+cQACwUBAgABAwBBkMUAC+ABBAEBBQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQfnGAAsEAQAAAQBBkccAC98BAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB+sgACwQBAAACAEGQyQALXwMEAAAEBAQEBAQEBAQEBAUEBAQEBAQEBAQEBAQABAAGBwQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEAEH6ygALBAEAAAEAQZDLAAsBAQBBqssAC0ECAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBB+swACwQBAAABAEGQzQALAQEAQZrNAAsGAgAAAAACAEGxzQALOgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQfDOAAuWAU5PVU5DRUVDS09VVE5FQ1RFVEVDUklCRUxVU0hFVEVBRFNFQVJDSFJHRUNUSVZJVFlMRU5EQVJWRU9USUZZUFRJT05TQ0hTRUFZU1RBVENIR0VPUkRJUkVDVE9SVFJDSFBBUkFNRVRFUlVSQ0VCU0NSSUJFQVJET1dOQUNFSU5ETktDS1VCU0NSSUJFSFRUUC9BRFRQLw==", "base64");
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/constants.js
var require_constants$3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var corsSafeListedMethods = [
		"GET",
		"HEAD",
		"POST"
	];
	var corsSafeListedMethodsSet = new Set(corsSafeListedMethods);
	var nullBodyStatus = [
		101,
		204,
		205,
		304
	];
	var redirectStatus = [
		301,
		302,
		303,
		307,
		308
	];
	var redirectStatusSet = new Set(redirectStatus);
	/**
	* @see https://fetch.spec.whatwg.org/#block-bad-port
	*/
	var badPorts = [
		"1",
		"7",
		"9",
		"11",
		"13",
		"15",
		"17",
		"19",
		"20",
		"21",
		"22",
		"23",
		"25",
		"37",
		"42",
		"43",
		"53",
		"69",
		"77",
		"79",
		"87",
		"95",
		"101",
		"102",
		"103",
		"104",
		"109",
		"110",
		"111",
		"113",
		"115",
		"117",
		"119",
		"123",
		"135",
		"137",
		"139",
		"143",
		"161",
		"179",
		"389",
		"427",
		"465",
		"512",
		"513",
		"514",
		"515",
		"526",
		"530",
		"531",
		"532",
		"540",
		"548",
		"554",
		"556",
		"563",
		"587",
		"601",
		"636",
		"989",
		"990",
		"993",
		"995",
		"1719",
		"1720",
		"1723",
		"2049",
		"3659",
		"4045",
		"4190",
		"5060",
		"5061",
		"6000",
		"6566",
		"6665",
		"6666",
		"6667",
		"6668",
		"6669",
		"6679",
		"6697",
		"10080"
	];
	var badPortsSet = new Set(badPorts);
	/**
	* @see https://w3c.github.io/webappsec-referrer-policy/#referrer-policies
	*/
	var referrerPolicy = [
		"",
		"no-referrer",
		"no-referrer-when-downgrade",
		"same-origin",
		"origin",
		"strict-origin",
		"origin-when-cross-origin",
		"strict-origin-when-cross-origin",
		"unsafe-url"
	];
	var referrerPolicySet = new Set(referrerPolicy);
	var requestRedirect = [
		"follow",
		"manual",
		"error"
	];
	var safeMethods = [
		"GET",
		"HEAD",
		"OPTIONS",
		"TRACE"
	];
	var safeMethodsSet = new Set(safeMethods);
	var requestMode = [
		"navigate",
		"same-origin",
		"no-cors",
		"cors"
	];
	var requestCredentials = [
		"omit",
		"same-origin",
		"include"
	];
	var requestCache = [
		"default",
		"no-store",
		"reload",
		"no-cache",
		"force-cache",
		"only-if-cached"
	];
	/**
	* @see https://fetch.spec.whatwg.org/#request-body-header-name
	*/
	var requestBodyHeader = [
		"content-encoding",
		"content-language",
		"content-location",
		"content-type",
		"content-length"
	];
	/**
	* @see https://fetch.spec.whatwg.org/#enumdef-requestduplex
	*/
	var requestDuplex = ["half"];
	/**
	* @see http://fetch.spec.whatwg.org/#forbidden-method
	*/
	var forbiddenMethods = [
		"CONNECT",
		"TRACE",
		"TRACK"
	];
	var forbiddenMethodsSet = new Set(forbiddenMethods);
	var subresource = [
		"audio",
		"audioworklet",
		"font",
		"image",
		"manifest",
		"paintworklet",
		"script",
		"style",
		"track",
		"video",
		"xslt",
		""
	];
	module.exports = {
		subresource,
		forbiddenMethods,
		requestBodyHeader,
		referrerPolicy,
		requestRedirect,
		requestMode,
		requestCredentials,
		requestCache,
		redirectStatus,
		corsSafeListedMethods,
		nullBodyStatus,
		safeMethods,
		badPorts,
		requestDuplex,
		subresourceSet: new Set(subresource),
		badPortsSet,
		redirectStatusSet,
		corsSafeListedMethodsSet,
		safeMethodsSet,
		forbiddenMethodsSet,
		referrerPolicySet
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/global.js
var require_global$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var globalOrigin = Symbol.for("undici.globalOrigin.1");
	function getGlobalOrigin() {
		return globalThis[globalOrigin];
	}
	function setGlobalOrigin(newOrigin) {
		if (newOrigin === void 0) {
			Object.defineProperty(globalThis, globalOrigin, {
				value: void 0,
				writable: true,
				enumerable: false,
				configurable: false
			});
			return;
		}
		const parsedURL = new URL(newOrigin);
		if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") throw new TypeError(`Only http & https urls are allowed, received ${parsedURL.protocol}`);
		Object.defineProperty(globalThis, globalOrigin, {
			value: parsedURL,
			writable: true,
			enumerable: false,
			configurable: false
		});
	}
	module.exports = {
		getGlobalOrigin,
		setGlobalOrigin
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/data-url.js
var require_data_url = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$23 = __require("node:assert");
	var encoder = new TextEncoder();
	/**
	* @see https://mimesniff.spec.whatwg.org/#http-token-code-point
	*/
	var HTTP_TOKEN_CODEPOINTS = /^[!#$%&'*+\-.^_|~A-Za-z0-9]+$/;
	var HTTP_WHITESPACE_REGEX = /[\u000A\u000D\u0009\u0020]/;
	var ASCII_WHITESPACE_REPLACE_REGEX = /[\u0009\u000A\u000C\u000D\u0020]/g;
	/**
	* @see https://mimesniff.spec.whatwg.org/#http-quoted-string-token-code-point
	*/
	var HTTP_QUOTED_STRING_TOKENS = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
	/** @param {URL} dataURL */
	function dataURLProcessor(dataURL) {
		assert$23(dataURL.protocol === "data:");
		let input = URLSerializer(dataURL, true);
		input = input.slice(5);
		const position = { position: 0 };
		let mimeType = collectASequenceOfCodePointsFast(",", input, position);
		const mimeTypeLength = mimeType.length;
		mimeType = removeASCIIWhitespace(mimeType, true, true);
		if (position.position >= input.length) return "failure";
		position.position++;
		let body = stringPercentDecode(input.slice(mimeTypeLength + 1));
		if (/;(\u0020){0,}base64$/i.test(mimeType)) {
			body = forgivingBase64(isomorphicDecode(body));
			if (body === "failure") return "failure";
			mimeType = mimeType.slice(0, -6);
			mimeType = mimeType.replace(/(\u0020)+$/, "");
			mimeType = mimeType.slice(0, -1);
		}
		if (mimeType.startsWith(";")) mimeType = "text/plain" + mimeType;
		let mimeTypeRecord = parseMIMEType(mimeType);
		if (mimeTypeRecord === "failure") mimeTypeRecord = parseMIMEType("text/plain;charset=US-ASCII");
		return {
			mimeType: mimeTypeRecord,
			body
		};
	}
	/**
	* @param {URL} url
	* @param {boolean} excludeFragment
	*/
	function URLSerializer(url, excludeFragment = false) {
		if (!excludeFragment) return url.href;
		const href = url.href;
		const hashLength = url.hash.length;
		const serialized = hashLength === 0 ? href : href.substring(0, href.length - hashLength);
		if (!hashLength && href.endsWith("#")) return serialized.slice(0, -1);
		return serialized;
	}
	/**
	* @param {(char: string) => boolean} condition
	* @param {string} input
	* @param {{ position: number }} position
	*/
	function collectASequenceOfCodePoints(condition, input, position) {
		let result = "";
		while (position.position < input.length && condition(input[position.position])) {
			result += input[position.position];
			position.position++;
		}
		return result;
	}
	/**
	* A faster collectASequenceOfCodePoints that only works when comparing a single character.
	* @param {string} char
	* @param {string} input
	* @param {{ position: number }} position
	*/
	function collectASequenceOfCodePointsFast(char, input, position) {
		const idx = input.indexOf(char, position.position);
		const start = position.position;
		if (idx === -1) {
			position.position = input.length;
			return input.slice(start);
		}
		position.position = idx;
		return input.slice(start, position.position);
	}
	/** @param {string} input */
	function stringPercentDecode(input) {
		return percentDecode(encoder.encode(input));
	}
	/**
	* @param {number} byte
	*/
	function isHexCharByte(byte) {
		return byte >= 48 && byte <= 57 || byte >= 65 && byte <= 70 || byte >= 97 && byte <= 102;
	}
	/**
	* @param {number} byte
	*/
	function hexByteToNumber(byte) {
		return byte >= 48 && byte <= 57 ? byte - 48 : (byte & 223) - 55;
	}
	/** @param {Uint8Array} input */
	function percentDecode(input) {
		const length = input.length;
		/** @type {Uint8Array} */
		const output = new Uint8Array(length);
		let j = 0;
		for (let i = 0; i < length; ++i) {
			const byte = input[i];
			if (byte !== 37) output[j++] = byte;
			else if (byte === 37 && !(isHexCharByte(input[i + 1]) && isHexCharByte(input[i + 2]))) output[j++] = 37;
			else {
				output[j++] = hexByteToNumber(input[i + 1]) << 4 | hexByteToNumber(input[i + 2]);
				i += 2;
			}
		}
		return length === j ? output : output.subarray(0, j);
	}
	/** @param {string} input */
	function parseMIMEType(input) {
		input = removeHTTPWhitespace(input, true, true);
		const position = { position: 0 };
		const type = collectASequenceOfCodePointsFast("/", input, position);
		if (type.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(type)) return "failure";
		if (position.position > input.length) return "failure";
		position.position++;
		let subtype = collectASequenceOfCodePointsFast(";", input, position);
		subtype = removeHTTPWhitespace(subtype, false, true);
		if (subtype.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(subtype)) return "failure";
		const typeLowercase = type.toLowerCase();
		const subtypeLowercase = subtype.toLowerCase();
		const mimeType = {
			type: typeLowercase,
			subtype: subtypeLowercase,
			/** @type {Map<string, string>} */
			parameters: /* @__PURE__ */ new Map(),
			essence: `${typeLowercase}/${subtypeLowercase}`
		};
		while (position.position < input.length) {
			position.position++;
			collectASequenceOfCodePoints((char) => HTTP_WHITESPACE_REGEX.test(char), input, position);
			let parameterName = collectASequenceOfCodePoints((char) => char !== ";" && char !== "=", input, position);
			parameterName = parameterName.toLowerCase();
			if (position.position < input.length) {
				if (input[position.position] === ";") continue;
				position.position++;
			}
			if (position.position > input.length) break;
			let parameterValue = null;
			if (input[position.position] === "\"") {
				parameterValue = collectAnHTTPQuotedString(input, position, true);
				collectASequenceOfCodePointsFast(";", input, position);
			} else {
				parameterValue = collectASequenceOfCodePointsFast(";", input, position);
				parameterValue = removeHTTPWhitespace(parameterValue, false, true);
				if (parameterValue.length === 0) continue;
			}
			if (parameterName.length !== 0 && HTTP_TOKEN_CODEPOINTS.test(parameterName) && (parameterValue.length === 0 || HTTP_QUOTED_STRING_TOKENS.test(parameterValue)) && !mimeType.parameters.has(parameterName)) mimeType.parameters.set(parameterName, parameterValue);
		}
		return mimeType;
	}
	/** @param {string} data */
	function forgivingBase64(data) {
		data = data.replace(ASCII_WHITESPACE_REPLACE_REGEX, "");
		let dataLength = data.length;
		if (dataLength % 4 === 0) {
			if (data.charCodeAt(dataLength - 1) === 61) {
				--dataLength;
				if (data.charCodeAt(dataLength - 1) === 61) --dataLength;
			}
		}
		if (dataLength % 4 === 1) return "failure";
		if (/[^+/0-9A-Za-z]/.test(data.length === dataLength ? data : data.substring(0, dataLength))) return "failure";
		const buffer = Buffer.from(data, "base64");
		return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	}
	/**
	* @param {string} input
	* @param {{ position: number }} position
	* @param {boolean?} extractValue
	*/
	function collectAnHTTPQuotedString(input, position, extractValue) {
		const positionStart = position.position;
		let value = "";
		assert$23(input[position.position] === "\"");
		position.position++;
		while (true) {
			value += collectASequenceOfCodePoints((char) => char !== "\"" && char !== "\\", input, position);
			if (position.position >= input.length) break;
			const quoteOrBackslash = input[position.position];
			position.position++;
			if (quoteOrBackslash === "\\") {
				if (position.position >= input.length) {
					value += "\\";
					break;
				}
				value += input[position.position];
				position.position++;
			} else {
				assert$23(quoteOrBackslash === "\"");
				break;
			}
		}
		if (extractValue) return value;
		return input.slice(positionStart, position.position);
	}
	/**
	* @see https://mimesniff.spec.whatwg.org/#serialize-a-mime-type
	*/
	function serializeAMimeType(mimeType) {
		assert$23(mimeType !== "failure");
		const { parameters, essence } = mimeType;
		let serialization = essence;
		for (let [name, value] of parameters.entries()) {
			serialization += ";";
			serialization += name;
			serialization += "=";
			if (!HTTP_TOKEN_CODEPOINTS.test(value)) {
				value = value.replace(/(\\|")/g, "\\$1");
				value = "\"" + value;
				value += "\"";
			}
			serialization += value;
		}
		return serialization;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#http-whitespace
	* @param {number} char
	*/
	function isHTTPWhiteSpace(char) {
		return char === 13 || char === 10 || char === 9 || char === 32;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#http-whitespace
	* @param {string} str
	* @param {boolean} [leading=true]
	* @param {boolean} [trailing=true]
	*/
	function removeHTTPWhitespace(str, leading = true, trailing = true) {
		return removeChars(str, leading, trailing, isHTTPWhiteSpace);
	}
	/**
	* @see https://infra.spec.whatwg.org/#ascii-whitespace
	* @param {number} char
	*/
	function isASCIIWhitespace(char) {
		return char === 13 || char === 10 || char === 9 || char === 12 || char === 32;
	}
	/**
	* @see https://infra.spec.whatwg.org/#strip-leading-and-trailing-ascii-whitespace
	* @param {string} str
	* @param {boolean} [leading=true]
	* @param {boolean} [trailing=true]
	*/
	function removeASCIIWhitespace(str, leading = true, trailing = true) {
		return removeChars(str, leading, trailing, isASCIIWhitespace);
	}
	/**
	* @param {string} str
	* @param {boolean} leading
	* @param {boolean} trailing
	* @param {(charCode: number) => boolean} predicate
	* @returns
	*/
	function removeChars(str, leading, trailing, predicate) {
		let lead = 0;
		let trail = str.length - 1;
		if (leading) while (lead < str.length && predicate(str.charCodeAt(lead))) lead++;
		if (trailing) while (trail > 0 && predicate(str.charCodeAt(trail))) trail--;
		return lead === 0 && trail === str.length - 1 ? str : str.slice(lead, trail + 1);
	}
	/**
	* @see https://infra.spec.whatwg.org/#isomorphic-decode
	* @param {Uint8Array} input
	* @returns {string}
	*/
	function isomorphicDecode(input) {
		const length = input.length;
		if (65535 > length) return String.fromCharCode.apply(null, input);
		let result = "";
		let i = 0;
		let addition = 65535;
		while (i < length) {
			if (i + addition > length) addition = length - i;
			result += String.fromCharCode.apply(null, input.subarray(i, i += addition));
		}
		return result;
	}
	/**
	* @see https://mimesniff.spec.whatwg.org/#minimize-a-supported-mime-type
	* @param {Exclude<ReturnType<typeof parseMIMEType>, 'failure'>} mimeType
	*/
	function minimizeSupportedMimeType(mimeType) {
		switch (mimeType.essence) {
			case "application/ecmascript":
			case "application/javascript":
			case "application/x-ecmascript":
			case "application/x-javascript":
			case "text/ecmascript":
			case "text/javascript":
			case "text/javascript1.0":
			case "text/javascript1.1":
			case "text/javascript1.2":
			case "text/javascript1.3":
			case "text/javascript1.4":
			case "text/javascript1.5":
			case "text/jscript":
			case "text/livescript":
			case "text/x-ecmascript":
			case "text/x-javascript": return "text/javascript";
			case "application/json":
			case "text/json": return "application/json";
			case "image/svg+xml": return "image/svg+xml";
			case "text/xml":
			case "application/xml": return "application/xml";
		}
		if (mimeType.subtype.endsWith("+json")) return "application/json";
		if (mimeType.subtype.endsWith("+xml")) return "application/xml";
		return "";
	}
	module.exports = {
		dataURLProcessor,
		URLSerializer,
		collectASequenceOfCodePoints,
		collectASequenceOfCodePointsFast,
		stringPercentDecode,
		parseMIMEType,
		collectAnHTTPQuotedString,
		serializeAMimeType,
		removeChars,
		removeHTTPWhitespace,
		minimizeSupportedMimeType,
		HTTP_TOKEN_CODEPOINTS,
		isomorphicDecode
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/webidl.js
var require_webidl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { types: types$3, inspect } = __require("node:util");
	var { markAsUncloneable } = __require("node:worker_threads");
	var { toUSVString } = require_util$8();
	/** @type {import('../../../types/webidl').Webidl} */
	var webidl = {};
	webidl.converters = {};
	webidl.util = {};
	webidl.errors = {};
	webidl.errors.exception = function(message) {
		return /* @__PURE__ */ new TypeError(`${message.header}: ${message.message}`);
	};
	webidl.errors.conversionFailed = function(context) {
		const plural = context.types.length === 1 ? "" : " one of";
		const message = `${context.argument} could not be converted to${plural}: ${context.types.join(", ")}.`;
		return webidl.errors.exception({
			header: context.prefix,
			message
		});
	};
	webidl.errors.invalidArgument = function(context) {
		return webidl.errors.exception({
			header: context.prefix,
			message: `"${context.value}" is an invalid ${context.type}.`
		});
	};
	webidl.brandCheck = function(V, I, opts) {
		if (opts?.strict !== false) {
			if (!(V instanceof I)) {
				const err = /* @__PURE__ */ new TypeError("Illegal invocation");
				err.code = "ERR_INVALID_THIS";
				throw err;
			}
		} else if (V?.[Symbol.toStringTag] !== I.prototype[Symbol.toStringTag]) {
			const err = /* @__PURE__ */ new TypeError("Illegal invocation");
			err.code = "ERR_INVALID_THIS";
			throw err;
		}
	};
	webidl.argumentLengthCheck = function({ length }, min, ctx) {
		if (length < min) throw webidl.errors.exception({
			message: `${min} argument${min !== 1 ? "s" : ""} required, but${length ? " only" : ""} ${length} found.`,
			header: ctx
		});
	};
	webidl.illegalConstructor = function() {
		throw webidl.errors.exception({
			header: "TypeError",
			message: "Illegal constructor"
		});
	};
	webidl.util.Type = function(V) {
		switch (typeof V) {
			case "undefined": return "Undefined";
			case "boolean": return "Boolean";
			case "string": return "String";
			case "symbol": return "Symbol";
			case "number": return "Number";
			case "bigint": return "BigInt";
			case "function":
			case "object":
				if (V === null) return "Null";
				return "Object";
		}
	};
	webidl.util.markAsUncloneable = markAsUncloneable || (() => {});
	webidl.util.ConvertToInt = function(V, bitLength, signedness, opts) {
		let upperBound;
		let lowerBound;
		if (bitLength === 64) {
			upperBound = Math.pow(2, 53) - 1;
			if (signedness === "unsigned") lowerBound = 0;
			else lowerBound = Math.pow(-2, 53) + 1;
		} else if (signedness === "unsigned") {
			lowerBound = 0;
			upperBound = Math.pow(2, bitLength) - 1;
		} else {
			lowerBound = Math.pow(-2, bitLength) - 1;
			upperBound = Math.pow(2, bitLength - 1) - 1;
		}
		let x = Number(V);
		if (x === 0) x = 0;
		if (opts?.enforceRange === true) {
			if (Number.isNaN(x) || x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY) throw webidl.errors.exception({
				header: "Integer conversion",
				message: `Could not convert ${webidl.util.Stringify(V)} to an integer.`
			});
			x = webidl.util.IntegerPart(x);
			if (x < lowerBound || x > upperBound) throw webidl.errors.exception({
				header: "Integer conversion",
				message: `Value must be between ${lowerBound}-${upperBound}, got ${x}.`
			});
			return x;
		}
		if (!Number.isNaN(x) && opts?.clamp === true) {
			x = Math.min(Math.max(x, lowerBound), upperBound);
			if (Math.floor(x) % 2 === 0) x = Math.floor(x);
			else x = Math.ceil(x);
			return x;
		}
		if (Number.isNaN(x) || x === 0 && Object.is(0, x) || x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY) return 0;
		x = webidl.util.IntegerPart(x);
		x = x % Math.pow(2, bitLength);
		if (signedness === "signed" && x >= Math.pow(2, bitLength) - 1) return x - Math.pow(2, bitLength);
		return x;
	};
	webidl.util.IntegerPart = function(n) {
		const r = Math.floor(Math.abs(n));
		if (n < 0) return -1 * r;
		return r;
	};
	webidl.util.Stringify = function(V) {
		switch (webidl.util.Type(V)) {
			case "Symbol": return `Symbol(${V.description})`;
			case "Object": return inspect(V);
			case "String": return `"${V}"`;
			default: return `${V}`;
		}
	};
	webidl.sequenceConverter = function(converter) {
		return (V, prefix, argument, Iterable) => {
			if (webidl.util.Type(V) !== "Object") throw webidl.errors.exception({
				header: prefix,
				message: `${argument} (${webidl.util.Stringify(V)}) is not iterable.`
			});
			/** @type {Generator} */
			const method = typeof Iterable === "function" ? Iterable() : V?.[Symbol.iterator]?.();
			const seq = [];
			let index = 0;
			if (method === void 0 || typeof method.next !== "function") throw webidl.errors.exception({
				header: prefix,
				message: `${argument} is not iterable.`
			});
			while (true) {
				const { done, value } = method.next();
				if (done) break;
				seq.push(converter(value, prefix, `${argument}[${index++}]`));
			}
			return seq;
		};
	};
	webidl.recordConverter = function(keyConverter, valueConverter) {
		return (O, prefix, argument) => {
			if (webidl.util.Type(O) !== "Object") throw webidl.errors.exception({
				header: prefix,
				message: `${argument} ("${webidl.util.Type(O)}") is not an Object.`
			});
			const result = {};
			if (!types$3.isProxy(O)) {
				const keys = [...Object.getOwnPropertyNames(O), ...Object.getOwnPropertySymbols(O)];
				for (const key of keys) {
					const typedKey = keyConverter(key, prefix, argument);
					result[typedKey] = valueConverter(O[key], prefix, argument);
				}
				return result;
			}
			const keys = Reflect.ownKeys(O);
			for (const key of keys) if (Reflect.getOwnPropertyDescriptor(O, key)?.enumerable) {
				const typedKey = keyConverter(key, prefix, argument);
				result[typedKey] = valueConverter(O[key], prefix, argument);
			}
			return result;
		};
	};
	webidl.interfaceConverter = function(i) {
		return (V, prefix, argument, opts) => {
			if (opts?.strict !== false && !(V instanceof i)) throw webidl.errors.exception({
				header: prefix,
				message: `Expected ${argument} ("${webidl.util.Stringify(V)}") to be an instance of ${i.name}.`
			});
			return V;
		};
	};
	webidl.dictionaryConverter = function(converters) {
		return (dictionary, prefix, argument) => {
			const type = webidl.util.Type(dictionary);
			const dict = {};
			if (type === "Null" || type === "Undefined") return dict;
			else if (type !== "Object") throw webidl.errors.exception({
				header: prefix,
				message: `Expected ${dictionary} to be one of: Null, Undefined, Object.`
			});
			for (const options of converters) {
				const { key, defaultValue, required, converter } = options;
				if (required === true) {
					if (!Object.hasOwn(dictionary, key)) throw webidl.errors.exception({
						header: prefix,
						message: `Missing required key "${key}".`
					});
				}
				let value = dictionary[key];
				const hasDefault = Object.hasOwn(options, "defaultValue");
				if (hasDefault && value !== null) value ??= defaultValue();
				if (required || hasDefault || value !== void 0) {
					value = converter(value, prefix, `${argument}.${key}`);
					if (options.allowedValues && !options.allowedValues.includes(value)) throw webidl.errors.exception({
						header: prefix,
						message: `${value} is not an accepted type. Expected one of ${options.allowedValues.join(", ")}.`
					});
					dict[key] = value;
				}
			}
			return dict;
		};
	};
	webidl.nullableConverter = function(converter) {
		return (V, prefix, argument) => {
			if (V === null) return V;
			return converter(V, prefix, argument);
		};
	};
	webidl.converters.DOMString = function(V, prefix, argument, opts) {
		if (V === null && opts?.legacyNullToEmptyString) return "";
		if (typeof V === "symbol") throw webidl.errors.exception({
			header: prefix,
			message: `${argument} is a symbol, which cannot be converted to a DOMString.`
		});
		return String(V);
	};
	webidl.converters.ByteString = function(V, prefix, argument) {
		const x = webidl.converters.DOMString(V, prefix, argument);
		for (let index = 0; index < x.length; index++) if (x.charCodeAt(index) > 255) throw new TypeError(`Cannot convert argument to a ByteString because the character at index ${index} has a value of ${x.charCodeAt(index)} which is greater than 255.`);
		return x;
	};
	webidl.converters.USVString = toUSVString;
	webidl.converters.boolean = function(V) {
		return Boolean(V);
	};
	webidl.converters.any = function(V) {
		return V;
	};
	webidl.converters["long long"] = function(V, prefix, argument) {
		return webidl.util.ConvertToInt(V, 64, "signed", void 0, prefix, argument);
	};
	webidl.converters["unsigned long long"] = function(V, prefix, argument) {
		return webidl.util.ConvertToInt(V, 64, "unsigned", void 0, prefix, argument);
	};
	webidl.converters["unsigned long"] = function(V, prefix, argument) {
		return webidl.util.ConvertToInt(V, 32, "unsigned", void 0, prefix, argument);
	};
	webidl.converters["unsigned short"] = function(V, prefix, argument, opts) {
		return webidl.util.ConvertToInt(V, 16, "unsigned", opts, prefix, argument);
	};
	webidl.converters.ArrayBuffer = function(V, prefix, argument, opts) {
		if (webidl.util.Type(V) !== "Object" || !types$3.isAnyArrayBuffer(V)) throw webidl.errors.conversionFailed({
			prefix,
			argument: `${argument} ("${webidl.util.Stringify(V)}")`,
			types: ["ArrayBuffer"]
		});
		if (opts?.allowShared === false && types$3.isSharedArrayBuffer(V)) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "SharedArrayBuffer is not allowed."
		});
		if (V.resizable || V.growable) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "Received a resizable ArrayBuffer."
		});
		return V;
	};
	webidl.converters.TypedArray = function(V, T, prefix, name, opts) {
		if (webidl.util.Type(V) !== "Object" || !types$3.isTypedArray(V) || V.constructor.name !== T.name) throw webidl.errors.conversionFailed({
			prefix,
			argument: `${name} ("${webidl.util.Stringify(V)}")`,
			types: [T.name]
		});
		if (opts?.allowShared === false && types$3.isSharedArrayBuffer(V.buffer)) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "SharedArrayBuffer is not allowed."
		});
		if (V.buffer.resizable || V.buffer.growable) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "Received a resizable ArrayBuffer."
		});
		return V;
	};
	webidl.converters.DataView = function(V, prefix, name, opts) {
		if (webidl.util.Type(V) !== "Object" || !types$3.isDataView(V)) throw webidl.errors.exception({
			header: prefix,
			message: `${name} is not a DataView.`
		});
		if (opts?.allowShared === false && types$3.isSharedArrayBuffer(V.buffer)) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "SharedArrayBuffer is not allowed."
		});
		if (V.buffer.resizable || V.buffer.growable) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "Received a resizable ArrayBuffer."
		});
		return V;
	};
	webidl.converters.BufferSource = function(V, prefix, name, opts) {
		if (types$3.isAnyArrayBuffer(V)) return webidl.converters.ArrayBuffer(V, prefix, name, {
			...opts,
			allowShared: false
		});
		if (types$3.isTypedArray(V)) return webidl.converters.TypedArray(V, V.constructor, prefix, name, {
			...opts,
			allowShared: false
		});
		if (types$3.isDataView(V)) return webidl.converters.DataView(V, prefix, name, {
			...opts,
			allowShared: false
		});
		throw webidl.errors.conversionFailed({
			prefix,
			argument: `${name} ("${webidl.util.Stringify(V)}")`,
			types: ["BufferSource"]
		});
	};
	webidl.converters["sequence<ByteString>"] = webidl.sequenceConverter(webidl.converters.ByteString);
	webidl.converters["sequence<sequence<ByteString>>"] = webidl.sequenceConverter(webidl.converters["sequence<ByteString>"]);
	webidl.converters["record<ByteString, ByteString>"] = webidl.recordConverter(webidl.converters.ByteString, webidl.converters.ByteString);
	module.exports = { webidl };
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/util.js
var require_util$7 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Transform: Transform$2 } = __require("node:stream");
	var zlib$1 = __require("node:zlib");
	var { redirectStatusSet, referrerPolicySet: referrerPolicyTokens, badPortsSet } = require_constants$3();
	var { getGlobalOrigin } = require_global$1();
	var { collectASequenceOfCodePoints, collectAnHTTPQuotedString, removeChars, parseMIMEType } = require_data_url();
	var { performance: performance$1 } = __require("node:perf_hooks");
	var { isBlobLike, ReadableStreamFrom, isValidHTTPToken, normalizedMethodRecordsBase } = require_util$8();
	var assert$22 = __require("node:assert");
	var { isUint8Array } = __require("node:util/types");
	var { webidl } = require_webidl();
	var supportedHashes = [];
	/** @type {import('crypto')} */
	var crypto;
	try {
		crypto = __require("node:crypto");
		const possibleRelevantHashes = [
			"sha256",
			"sha384",
			"sha512"
		];
		supportedHashes = crypto.getHashes().filter((hash) => possibleRelevantHashes.includes(hash));
	} catch {}
	function responseURL(response) {
		const urlList = response.urlList;
		const length = urlList.length;
		return length === 0 ? null : urlList[length - 1].toString();
	}
	function responseLocationURL(response, requestFragment) {
		if (!redirectStatusSet.has(response.status)) return null;
		let location = response.headersList.get("location", true);
		if (location !== null && isValidHeaderValue(location)) {
			if (!isValidEncodedURL(location)) location = normalizeBinaryStringToUtf8(location);
			location = new URL(location, responseURL(response));
		}
		if (location && !location.hash) location.hash = requestFragment;
		return location;
	}
	/**
	* @see https://www.rfc-editor.org/rfc/rfc1738#section-2.2
	* @param {string} url
	* @returns {boolean}
	*/
	function isValidEncodedURL(url) {
		for (let i = 0; i < url.length; ++i) {
			const code = url.charCodeAt(i);
			if (code > 126 || code < 32) return false;
		}
		return true;
	}
	/**
	* If string contains non-ASCII characters, assumes it's UTF-8 encoded and decodes it.
	* Since UTF-8 is a superset of ASCII, this will work for ASCII strings as well.
	* @param {string} value
	* @returns {string}
	*/
	function normalizeBinaryStringToUtf8(value) {
		return Buffer.from(value, "binary").toString("utf8");
	}
	/** @returns {URL} */
	function requestCurrentURL(request) {
		return request.urlList[request.urlList.length - 1];
	}
	function requestBadPort(request) {
		const url = requestCurrentURL(request);
		if (urlIsHttpHttpsScheme(url) && badPortsSet.has(url.port)) return "blocked";
		return "allowed";
	}
	function isErrorLike(object) {
		return object instanceof Error || object?.constructor?.name === "Error" || object?.constructor?.name === "DOMException";
	}
	function isValidReasonPhrase(statusText) {
		for (let i = 0; i < statusText.length; ++i) {
			const c = statusText.charCodeAt(i);
			if (!(c === 9 || c >= 32 && c <= 126 || c >= 128 && c <= 255)) return false;
		}
		return true;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#header-name
	* @param {string} potentialValue
	*/
	var isValidHeaderName = isValidHTTPToken;
	/**
	* @see https://fetch.spec.whatwg.org/#header-value
	* @param {string} potentialValue
	*/
	function isValidHeaderValue(potentialValue) {
		return (potentialValue[0] === "	" || potentialValue[0] === " " || potentialValue[potentialValue.length - 1] === "	" || potentialValue[potentialValue.length - 1] === " " || potentialValue.includes("\n") || potentialValue.includes("\r") || potentialValue.includes("\0")) === false;
	}
	function setRequestReferrerPolicyOnRedirect(request, actualResponse) {
		const { headersList } = actualResponse;
		const policyHeader = (headersList.get("referrer-policy", true) ?? "").split(",");
		let policy = "";
		if (policyHeader.length > 0) for (let i = policyHeader.length; i !== 0; i--) {
			const token = policyHeader[i - 1].trim();
			if (referrerPolicyTokens.has(token)) {
				policy = token;
				break;
			}
		}
		if (policy !== "") request.referrerPolicy = policy;
	}
	function crossOriginResourcePolicyCheck() {
		return "allowed";
	}
	function corsCheck() {
		return "success";
	}
	function TAOCheck() {
		return "success";
	}
	function appendFetchMetadata(httpRequest) {
		let header = null;
		header = httpRequest.mode;
		httpRequest.headersList.set("sec-fetch-mode", header, true);
	}
	function appendRequestOriginHeader(request) {
		let serializedOrigin = request.origin;
		if (serializedOrigin === "client" || serializedOrigin === void 0) return;
		if (request.responseTainting === "cors" || request.mode === "websocket") request.headersList.append("origin", serializedOrigin, true);
		else if (request.method !== "GET" && request.method !== "HEAD") {
			switch (request.referrerPolicy) {
				case "no-referrer":
					serializedOrigin = null;
					break;
				case "no-referrer-when-downgrade":
				case "strict-origin":
				case "strict-origin-when-cross-origin":
					if (request.origin && urlHasHttpsScheme(request.origin) && !urlHasHttpsScheme(requestCurrentURL(request))) serializedOrigin = null;
					break;
				case "same-origin": if (!sameOrigin(request, requestCurrentURL(request))) serializedOrigin = null;
			}
			request.headersList.append("origin", serializedOrigin, true);
		}
	}
	function coarsenTime(timestamp, crossOriginIsolatedCapability) {
		return timestamp;
	}
	function clampAndCoarsenConnectionTimingInfo(connectionTimingInfo, defaultStartTime, crossOriginIsolatedCapability) {
		if (!connectionTimingInfo?.startTime || connectionTimingInfo.startTime < defaultStartTime) return {
			domainLookupStartTime: defaultStartTime,
			domainLookupEndTime: defaultStartTime,
			connectionStartTime: defaultStartTime,
			connectionEndTime: defaultStartTime,
			secureConnectionStartTime: defaultStartTime,
			ALPNNegotiatedProtocol: connectionTimingInfo?.ALPNNegotiatedProtocol
		};
		return {
			domainLookupStartTime: coarsenTime(connectionTimingInfo.domainLookupStartTime, crossOriginIsolatedCapability),
			domainLookupEndTime: coarsenTime(connectionTimingInfo.domainLookupEndTime, crossOriginIsolatedCapability),
			connectionStartTime: coarsenTime(connectionTimingInfo.connectionStartTime, crossOriginIsolatedCapability),
			connectionEndTime: coarsenTime(connectionTimingInfo.connectionEndTime, crossOriginIsolatedCapability),
			secureConnectionStartTime: coarsenTime(connectionTimingInfo.secureConnectionStartTime, crossOriginIsolatedCapability),
			ALPNNegotiatedProtocol: connectionTimingInfo.ALPNNegotiatedProtocol
		};
	}
	function coarsenedSharedCurrentTime(crossOriginIsolatedCapability) {
		return coarsenTime(performance$1.now(), crossOriginIsolatedCapability);
	}
	function createOpaqueTimingInfo(timingInfo) {
		return {
			startTime: timingInfo.startTime ?? 0,
			redirectStartTime: 0,
			redirectEndTime: 0,
			postRedirectStartTime: timingInfo.startTime ?? 0,
			finalServiceWorkerStartTime: 0,
			finalNetworkResponseStartTime: 0,
			finalNetworkRequestStartTime: 0,
			endTime: 0,
			encodedBodySize: 0,
			decodedBodySize: 0,
			finalConnectionTimingInfo: null
		};
	}
	function makePolicyContainer() {
		return { referrerPolicy: "strict-origin-when-cross-origin" };
	}
	function clonePolicyContainer(policyContainer) {
		return { referrerPolicy: policyContainer.referrerPolicy };
	}
	function determineRequestsReferrer(request) {
		const policy = request.referrerPolicy;
		assert$22(policy);
		let referrerSource = null;
		if (request.referrer === "client") {
			const globalOrigin = getGlobalOrigin();
			if (!globalOrigin || globalOrigin.origin === "null") return "no-referrer";
			referrerSource = new URL(globalOrigin);
		} else if (request.referrer instanceof URL) referrerSource = request.referrer;
		let referrerURL = stripURLForReferrer(referrerSource);
		const referrerOrigin = stripURLForReferrer(referrerSource, true);
		if (referrerURL.toString().length > 4096) referrerURL = referrerOrigin;
		const areSameOrigin = sameOrigin(request, referrerURL);
		const isNonPotentiallyTrustWorthy = isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(request.url);
		switch (policy) {
			case "origin": return referrerOrigin != null ? referrerOrigin : stripURLForReferrer(referrerSource, true);
			case "unsafe-url": return referrerURL;
			case "same-origin": return areSameOrigin ? referrerOrigin : "no-referrer";
			case "origin-when-cross-origin": return areSameOrigin ? referrerURL : referrerOrigin;
			case "strict-origin-when-cross-origin": {
				const currentURL = requestCurrentURL(request);
				if (sameOrigin(referrerURL, currentURL)) return referrerURL;
				if (isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(currentURL)) return "no-referrer";
				return referrerOrigin;
			}
			/**
			* 1. If referrerURL is a potentially trustworthy URL and
			* request’s current URL is not a potentially trustworthy URL,
			* then return no referrer.
			* 2. Return referrerOrigin
			*/
			default: return isNonPotentiallyTrustWorthy ? "no-referrer" : referrerOrigin;
		}
	}
	/**
	* @see https://w3c.github.io/webappsec-referrer-policy/#strip-url
	* @param {URL} url
	* @param {boolean|undefined} originOnly
	*/
	function stripURLForReferrer(url, originOnly) {
		assert$22(url instanceof URL);
		url = new URL(url);
		if (url.protocol === "file:" || url.protocol === "about:" || url.protocol === "blank:") return "no-referrer";
		url.username = "";
		url.password = "";
		url.hash = "";
		if (originOnly) {
			url.pathname = "";
			url.search = "";
		}
		return url;
	}
	function isURLPotentiallyTrustworthy(url) {
		if (!(url instanceof URL)) return false;
		if (url.href === "about:blank" || url.href === "about:srcdoc") return true;
		if (url.protocol === "data:") return true;
		if (url.protocol === "file:") return true;
		return isOriginPotentiallyTrustworthy(url.origin);
		function isOriginPotentiallyTrustworthy(origin) {
			if (origin == null || origin === "null") return false;
			const originAsURL = new URL(origin);
			if (originAsURL.protocol === "https:" || originAsURL.protocol === "wss:") return true;
			if (/^127(?:\.[0-9]+){0,2}\.[0-9]+$|^\[(?:0*:)*?:?0*1\]$/.test(originAsURL.hostname) || originAsURL.hostname === "localhost" || originAsURL.hostname.includes("localhost.") || originAsURL.hostname.endsWith(".localhost")) return true;
			return false;
		}
	}
	/**
	* @see https://w3c.github.io/webappsec-subresource-integrity/#does-response-match-metadatalist
	* @param {Uint8Array} bytes
	* @param {string} metadataList
	*/
	function bytesMatch(bytes, metadataList) {
		/* istanbul ignore if: only if node is built with --without-ssl */
		if (crypto === void 0) return true;
		const parsedMetadata = parseMetadata(metadataList);
		if (parsedMetadata === "no metadata") return true;
		if (parsedMetadata.length === 0) return true;
		const metadata = filterMetadataListByAlgorithm(parsedMetadata, getStrongestMetadata(parsedMetadata));
		for (const item of metadata) {
			const algorithm = item.algo;
			const expectedValue = item.hash;
			let actualValue = crypto.createHash(algorithm).update(bytes).digest("base64");
			if (actualValue[actualValue.length - 1] === "=") {
				if (actualValue[actualValue.length - 2] === "=") actualValue = actualValue.slice(0, -2);
				else actualValue = actualValue.slice(0, -1);
			}
			if (compareBase64Mixed(actualValue, expectedValue)) return true;
		}
		return false;
	}
	var parseHashWithOptions = /(?<algo>sha256|sha384|sha512)-((?<hash>[A-Za-z0-9+/]+|[A-Za-z0-9_-]+)={0,2}(?:\s|$)( +[!-~]*)?)?/i;
	/**
	* @see https://w3c.github.io/webappsec-subresource-integrity/#parse-metadata
	* @param {string} metadata
	*/
	function parseMetadata(metadata) {
		/** @type {{ algo: string, hash: string }[]} */
		const result = [];
		let empty = true;
		for (const token of metadata.split(" ")) {
			empty = false;
			const parsedToken = parseHashWithOptions.exec(token);
			if (parsedToken === null || parsedToken.groups === void 0 || parsedToken.groups.algo === void 0) continue;
			const algorithm = parsedToken.groups.algo.toLowerCase();
			if (supportedHashes.includes(algorithm)) result.push(parsedToken.groups);
		}
		if (empty === true) return "no metadata";
		return result;
	}
	/**
	* @param {{ algo: 'sha256' | 'sha384' | 'sha512' }[]} metadataList
	*/
	function getStrongestMetadata(metadataList) {
		let algorithm = metadataList[0].algo;
		if (algorithm[3] === "5") return algorithm;
		for (let i = 1; i < metadataList.length; ++i) {
			const metadata = metadataList[i];
			if (metadata.algo[3] === "5") {
				algorithm = "sha512";
				break;
			} else if (algorithm[3] === "3") continue;
			else if (metadata.algo[3] === "3") algorithm = "sha384";
		}
		return algorithm;
	}
	function filterMetadataListByAlgorithm(metadataList, algorithm) {
		if (metadataList.length === 1) return metadataList;
		let pos = 0;
		for (let i = 0; i < metadataList.length; ++i) if (metadataList[i].algo === algorithm) metadataList[pos++] = metadataList[i];
		metadataList.length = pos;
		return metadataList;
	}
	/**
	* Compares two base64 strings, allowing for base64url
	* in the second string.
	*
	* @param {string} actualValue always base64
	* @param {string} expectedValue base64 or base64url
	* @returns {boolean}
	*/
	function compareBase64Mixed(actualValue, expectedValue) {
		if (actualValue.length !== expectedValue.length) return false;
		for (let i = 0; i < actualValue.length; ++i) if (actualValue[i] !== expectedValue[i]) {
			if (actualValue[i] === "+" && expectedValue[i] === "-" || actualValue[i] === "/" && expectedValue[i] === "_") continue;
			return false;
		}
		return true;
	}
	function tryUpgradeRequestToAPotentiallyTrustworthyURL(request) {}
	/**
	* @link {https://html.spec.whatwg.org/multipage/origin.html#same-origin}
	* @param {URL} A
	* @param {URL} B
	*/
	function sameOrigin(A, B) {
		if (A.origin === B.origin && A.origin === "null") return true;
		if (A.protocol === B.protocol && A.hostname === B.hostname && A.port === B.port) return true;
		return false;
	}
	function createDeferredPromise() {
		let res;
		let rej;
		return {
			promise: new Promise((resolve, reject) => {
				res = resolve;
				rej = reject;
			}),
			resolve: res,
			reject: rej
		};
	}
	function isAborted(fetchParams) {
		return fetchParams.controller.state === "aborted";
	}
	function isCancelled(fetchParams) {
		return fetchParams.controller.state === "aborted" || fetchParams.controller.state === "terminated";
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-method-normalize
	* @param {string} method
	*/
	function normalizeMethod(method) {
		return normalizedMethodRecordsBase[method.toLowerCase()] ?? method;
	}
	function serializeJavascriptValueToJSONString(value) {
		const result = JSON.stringify(value);
		if (result === void 0) throw new TypeError("Value is not JSON serializable");
		assert$22(typeof result === "string");
		return result;
	}
	var esIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));
	/**
	* @see https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	* @param {string} name name of the instance
	* @param {symbol} kInternalIterator
	* @param {string | number} [keyIndex]
	* @param {string | number} [valueIndex]
	*/
	function createIterator(name, kInternalIterator, keyIndex = 0, valueIndex = 1) {
		class FastIterableIterator {
			/** @type {any} */
			#target;
			/** @type {'key' | 'value' | 'key+value'} */
			#kind;
			/** @type {number} */
			#index;
			/**
			* @see https://webidl.spec.whatwg.org/#dfn-default-iterator-object
			* @param {unknown} target
			* @param {'key' | 'value' | 'key+value'} kind
			*/
			constructor(target, kind) {
				this.#target = target;
				this.#kind = kind;
				this.#index = 0;
			}
			next() {
				if (typeof this !== "object" || this === null || !(#target in this)) throw new TypeError(`'next' called on an object that does not implement interface ${name} Iterator.`);
				const index = this.#index;
				const values = this.#target[kInternalIterator];
				if (index >= values.length) return {
					value: void 0,
					done: true
				};
				const { [keyIndex]: key, [valueIndex]: value } = values[index];
				this.#index = index + 1;
				let result;
				switch (this.#kind) {
					case "key":
						result = key;
						break;
					case "value":
						result = value;
						break;
					case "key+value": result = [key, value];
				}
				return {
					value: result,
					done: false
				};
			}
		}
		delete FastIterableIterator.prototype.constructor;
		Object.setPrototypeOf(FastIterableIterator.prototype, esIteratorPrototype);
		Object.defineProperties(FastIterableIterator.prototype, {
			[Symbol.toStringTag]: {
				writable: false,
				enumerable: false,
				configurable: true,
				value: `${name} Iterator`
			},
			next: {
				writable: true,
				enumerable: true,
				configurable: true
			}
		});
		/**
		* @param {unknown} target
		* @param {'key' | 'value' | 'key+value'} kind
		* @returns {IterableIterator<any>}
		*/
		return function(target, kind) {
			return new FastIterableIterator(target, kind);
		};
	}
	/**
	* @see https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	* @param {string} name name of the instance
	* @param {any} object class
	* @param {symbol} kInternalIterator
	* @param {string | number} [keyIndex]
	* @param {string | number} [valueIndex]
	*/
	function iteratorMixin(name, object, kInternalIterator, keyIndex = 0, valueIndex = 1) {
		const makeIterator = createIterator(name, kInternalIterator, keyIndex, valueIndex);
		const properties = {
			keys: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function keys() {
					webidl.brandCheck(this, object);
					return makeIterator(this, "key");
				}
			},
			values: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function values() {
					webidl.brandCheck(this, object);
					return makeIterator(this, "value");
				}
			},
			entries: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function entries() {
					webidl.brandCheck(this, object);
					return makeIterator(this, "key+value");
				}
			},
			forEach: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function forEach(callbackfn, thisArg = globalThis) {
					webidl.brandCheck(this, object);
					webidl.argumentLengthCheck(arguments, 1, `${name}.forEach`);
					if (typeof callbackfn !== "function") throw new TypeError(`Failed to execute 'forEach' on '${name}': parameter 1 is not of type 'Function'.`);
					for (const { 0: key, 1: value } of makeIterator(this, "key+value")) callbackfn.call(thisArg, value, key, this);
				}
			}
		};
		return Object.defineProperties(object.prototype, {
			...properties,
			[Symbol.iterator]: {
				writable: true,
				enumerable: false,
				configurable: true,
				value: properties.entries.value
			}
		});
	}
	/**
	* @see https://fetch.spec.whatwg.org/#body-fully-read
	*/
	async function fullyReadBody(body, processBody, processBodyError) {
		const successSteps = processBody;
		const errorSteps = processBodyError;
		let reader;
		try {
			reader = body.stream.getReader();
		} catch (e) {
			errorSteps(e);
			return;
		}
		try {
			successSteps(await readAllBytes(reader));
		} catch (e) {
			errorSteps(e);
		}
	}
	function isReadableStreamLike(stream) {
		return stream instanceof ReadableStream || stream[Symbol.toStringTag] === "ReadableStream" && typeof stream.tee === "function";
	}
	/**
	* @param {ReadableStreamController<Uint8Array>} controller
	*/
	function readableStreamClose(controller) {
		try {
			controller.close();
			controller.byobRequest?.respond(0);
		} catch (err) {
			if (!err.message.includes("Controller is already closed") && !err.message.includes("ReadableStream is already closed")) throw err;
		}
	}
	var invalidIsomorphicEncodeValueRegex = /[^\x00-\xFF]/;
	/**
	* @see https://infra.spec.whatwg.org/#isomorphic-encode
	* @param {string} input
	*/
	function isomorphicEncode(input) {
		assert$22(!invalidIsomorphicEncodeValueRegex.test(input));
		return input;
	}
	/**
	* @see https://streams.spec.whatwg.org/#readablestreamdefaultreader-read-all-bytes
	* @see https://streams.spec.whatwg.org/#read-loop
	* @param {ReadableStreamDefaultReader} reader
	*/
	async function readAllBytes(reader) {
		const bytes = [];
		let byteLength = 0;
		while (true) {
			const { done, value: chunk } = await reader.read();
			if (done) return Buffer.concat(bytes, byteLength);
			if (!isUint8Array(chunk)) throw new TypeError("Received non-Uint8Array chunk");
			bytes.push(chunk);
			byteLength += chunk.length;
		}
	}
	/**
	* @see https://fetch.spec.whatwg.org/#is-local
	* @param {URL} url
	*/
	function urlIsLocal(url) {
		assert$22("protocol" in url);
		const protocol = url.protocol;
		return protocol === "about:" || protocol === "blob:" || protocol === "data:";
	}
	/**
	* @param {string|URL} url
	* @returns {boolean}
	*/
	function urlHasHttpsScheme(url) {
		return typeof url === "string" && url[5] === ":" && url[0] === "h" && url[1] === "t" && url[2] === "t" && url[3] === "p" && url[4] === "s" || url.protocol === "https:";
	}
	/**
	* @see https://fetch.spec.whatwg.org/#http-scheme
	* @param {URL} url
	*/
	function urlIsHttpHttpsScheme(url) {
		assert$22("protocol" in url);
		const protocol = url.protocol;
		return protocol === "http:" || protocol === "https:";
	}
	/**
	* @see https://fetch.spec.whatwg.org/#simple-range-header-value
	* @param {string} value
	* @param {boolean} allowWhitespace
	*/
	function simpleRangeHeaderValue(value, allowWhitespace) {
		const data = value;
		if (!data.startsWith("bytes")) return "failure";
		const position = { position: 5 };
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		if (data.charCodeAt(position.position) !== 61) return "failure";
		position.position++;
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		const rangeStart = collectASequenceOfCodePoints((char) => {
			const code = char.charCodeAt(0);
			return code >= 48 && code <= 57;
		}, data, position);
		const rangeStartValue = rangeStart.length ? Number(rangeStart) : null;
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		if (data.charCodeAt(position.position) !== 45) return "failure";
		position.position++;
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		const rangeEnd = collectASequenceOfCodePoints((char) => {
			const code = char.charCodeAt(0);
			return code >= 48 && code <= 57;
		}, data, position);
		const rangeEndValue = rangeEnd.length ? Number(rangeEnd) : null;
		if (position.position < data.length) return "failure";
		if (rangeEndValue === null && rangeStartValue === null) return "failure";
		if (rangeStartValue > rangeEndValue) return "failure";
		return {
			rangeStartValue,
			rangeEndValue
		};
	}
	/**
	* @see https://fetch.spec.whatwg.org/#build-a-content-range
	* @param {number} rangeStart
	* @param {number} rangeEnd
	* @param {number} fullLength
	*/
	function buildContentRange(rangeStart, rangeEnd, fullLength) {
		let contentRange = "bytes ";
		contentRange += isomorphicEncode(`${rangeStart}`);
		contentRange += "-";
		contentRange += isomorphicEncode(`${rangeEnd}`);
		contentRange += "/";
		contentRange += isomorphicEncode(`${fullLength}`);
		return contentRange;
	}
	var InflateStream = class extends Transform$2 {
		#zlibOptions;
		/** @param {zlib.ZlibOptions} [zlibOptions] */
		constructor(zlibOptions) {
			super();
			this.#zlibOptions = zlibOptions;
		}
		_transform(chunk, encoding, callback) {
			if (!this._inflateStream) {
				if (chunk.length === 0) {
					callback();
					return;
				}
				this._inflateStream = (chunk[0] & 15) === 8 ? zlib$1.createInflate(this.#zlibOptions) : zlib$1.createInflateRaw(this.#zlibOptions);
				this._inflateStream.on("data", this.push.bind(this));
				this._inflateStream.on("end", () => this.push(null));
				this._inflateStream.on("error", (err) => this.destroy(err));
			}
			this._inflateStream.write(chunk, encoding, callback);
		}
		_final(callback) {
			if (this._inflateStream) {
				this._inflateStream.end();
				this._inflateStream = null;
			}
			callback();
		}
	};
	/**
	* @param {zlib.ZlibOptions} [zlibOptions]
	* @returns {InflateStream}
	*/
	function createInflate(zlibOptions) {
		return new InflateStream(zlibOptions);
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-header-extract-mime-type
	* @param {import('./headers').HeadersList} headers
	*/
	function extractMimeType(headers) {
		let charset = null;
		let essence = null;
		let mimeType = null;
		const values = getDecodeSplit("content-type", headers);
		if (values === null) return "failure";
		for (const value of values) {
			const temporaryMimeType = parseMIMEType(value);
			if (temporaryMimeType === "failure" || temporaryMimeType.essence === "*/*") continue;
			mimeType = temporaryMimeType;
			if (mimeType.essence !== essence) {
				charset = null;
				if (mimeType.parameters.has("charset")) charset = mimeType.parameters.get("charset");
				essence = mimeType.essence;
			} else if (!mimeType.parameters.has("charset") && charset !== null) mimeType.parameters.set("charset", charset);
		}
		if (mimeType == null) return "failure";
		return mimeType;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#header-value-get-decode-and-split
	* @param {string|null} value
	*/
	function gettingDecodingSplitting(value) {
		const input = value;
		const position = { position: 0 };
		const values = [];
		let temporaryValue = "";
		while (position.position < input.length) {
			temporaryValue += collectASequenceOfCodePoints((char) => char !== "\"" && char !== ",", input, position);
			if (position.position < input.length) {
				if (input.charCodeAt(position.position) === 34) {
					temporaryValue += collectAnHTTPQuotedString(input, position);
					if (position.position < input.length) continue;
				} else {
					assert$22(input.charCodeAt(position.position) === 44);
					position.position++;
				}
			}
			temporaryValue = removeChars(temporaryValue, true, true, (char) => char === 9 || char === 32);
			values.push(temporaryValue);
			temporaryValue = "";
		}
		return values;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-header-list-get-decode-split
	* @param {string} name lowercase header name
	* @param {import('./headers').HeadersList} list
	*/
	function getDecodeSplit(name, list) {
		const value = list.get(name, true);
		if (value === null) return null;
		return gettingDecodingSplitting(value);
	}
	var textDecoder = new TextDecoder();
	/**
	* @see https://encoding.spec.whatwg.org/#utf-8-decode
	* @param {Buffer} buffer
	*/
	function utf8DecodeBytes(buffer) {
		if (buffer.length === 0) return "";
		if (buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191) buffer = buffer.subarray(3);
		return textDecoder.decode(buffer);
	}
	var EnvironmentSettingsObjectBase = class {
		get baseUrl() {
			return getGlobalOrigin();
		}
		get origin() {
			return this.baseUrl?.origin;
		}
		policyContainer = makePolicyContainer();
	};
	var EnvironmentSettingsObject = class {
		settingsObject = new EnvironmentSettingsObjectBase();
	};
	module.exports = {
		isAborted,
		isCancelled,
		isValidEncodedURL,
		createDeferredPromise,
		ReadableStreamFrom,
		tryUpgradeRequestToAPotentiallyTrustworthyURL,
		clampAndCoarsenConnectionTimingInfo,
		coarsenedSharedCurrentTime,
		determineRequestsReferrer,
		makePolicyContainer,
		clonePolicyContainer,
		appendFetchMetadata,
		appendRequestOriginHeader,
		TAOCheck,
		corsCheck,
		crossOriginResourcePolicyCheck,
		createOpaqueTimingInfo,
		setRequestReferrerPolicyOnRedirect,
		isValidHTTPToken,
		requestBadPort,
		requestCurrentURL,
		responseURL,
		responseLocationURL,
		isBlobLike,
		isURLPotentiallyTrustworthy,
		isValidReasonPhrase,
		sameOrigin,
		normalizeMethod,
		serializeJavascriptValueToJSONString,
		iteratorMixin,
		createIterator,
		isValidHeaderName,
		isValidHeaderValue,
		isErrorLike,
		fullyReadBody,
		bytesMatch,
		isReadableStreamLike,
		readableStreamClose,
		isomorphicEncode,
		urlIsLocal,
		urlHasHttpsScheme,
		urlIsHttpHttpsScheme,
		readAllBytes,
		simpleRangeHeaderValue,
		buildContentRange,
		parseMetadata,
		createInflate,
		extractMimeType,
		getDecodeSplit,
		utf8DecodeBytes,
		environmentSettingsObject: new EnvironmentSettingsObject()
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/symbols.js
var require_symbols$3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kUrl: Symbol("url"),
		kHeaders: Symbol("headers"),
		kSignal: Symbol("signal"),
		kState: Symbol("state"),
		kDispatcher: Symbol("dispatcher")
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/file.js
var require_file = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Blob: Blob$2, File } = __require("node:buffer");
	var { kState } = require_symbols$3();
	var { webidl } = require_webidl();
	var FileLike = class FileLike {
		constructor(blobLike, fileName, options = {}) {
			const n = fileName;
			const t = options.type;
			const d = options.lastModified ?? Date.now();
			this[kState] = {
				blobLike,
				name: n,
				type: t,
				lastModified: d
			};
		}
		stream(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.stream(...args);
		}
		arrayBuffer(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.arrayBuffer(...args);
		}
		slice(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.slice(...args);
		}
		text(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.text(...args);
		}
		get size() {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.size;
		}
		get type() {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.type;
		}
		get name() {
			webidl.brandCheck(this, FileLike);
			return this[kState].name;
		}
		get lastModified() {
			webidl.brandCheck(this, FileLike);
			return this[kState].lastModified;
		}
		get [Symbol.toStringTag]() {
			return "File";
		}
	};
	webidl.converters.Blob = webidl.interfaceConverter(Blob$2);
	function isFileLike(object) {
		return object instanceof File || object && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && object[Symbol.toStringTag] === "File";
	}
	module.exports = {
		FileLike,
		isFileLike
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/formdata.js
var require_formdata = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { isBlobLike, iteratorMixin } = require_util$7();
	var { kState } = require_symbols$3();
	var { kEnumerableProperty } = require_util$8();
	var { FileLike, isFileLike } = require_file();
	var { webidl } = require_webidl();
	var { File: NativeFile } = __require("node:buffer");
	var nodeUtil$2 = __require("node:util");
	/** @type {globalThis['File']} */
	var File = globalThis.File ?? NativeFile;
	var FormData = class FormData {
		constructor(form) {
			webidl.util.markAsUncloneable(this);
			if (form !== void 0) throw webidl.errors.conversionFailed({
				prefix: "FormData constructor",
				argument: "Argument 1",
				types: ["undefined"]
			});
			this[kState] = [];
		}
		append(name, value, filename = void 0) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.append";
			webidl.argumentLengthCheck(arguments, 2, prefix);
			if (arguments.length === 3 && !isBlobLike(value)) throw new TypeError("Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'");
			name = webidl.converters.USVString(name, prefix, "name");
			value = isBlobLike(value) ? webidl.converters.Blob(value, prefix, "value", { strict: false }) : webidl.converters.USVString(value, prefix, "value");
			filename = arguments.length === 3 ? webidl.converters.USVString(filename, prefix, "filename") : void 0;
			const entry = makeEntry(name, value, filename);
			this[kState].push(entry);
		}
		delete(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.delete";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			this[kState] = this[kState].filter((entry) => entry.name !== name);
		}
		get(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.get";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			const idx = this[kState].findIndex((entry) => entry.name === name);
			if (idx === -1) return null;
			return this[kState][idx].value;
		}
		getAll(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.getAll";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			return this[kState].filter((entry) => entry.name === name).map((entry) => entry.value);
		}
		has(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.has";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			return this[kState].findIndex((entry) => entry.name === name) !== -1;
		}
		set(name, value, filename = void 0) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.set";
			webidl.argumentLengthCheck(arguments, 2, prefix);
			if (arguments.length === 3 && !isBlobLike(value)) throw new TypeError("Failed to execute 'set' on 'FormData': parameter 2 is not of type 'Blob'");
			name = webidl.converters.USVString(name, prefix, "name");
			value = isBlobLike(value) ? webidl.converters.Blob(value, prefix, "name", { strict: false }) : webidl.converters.USVString(value, prefix, "name");
			filename = arguments.length === 3 ? webidl.converters.USVString(filename, prefix, "name") : void 0;
			const entry = makeEntry(name, value, filename);
			const idx = this[kState].findIndex((entry) => entry.name === name);
			if (idx !== -1) this[kState] = [
				...this[kState].slice(0, idx),
				entry,
				...this[kState].slice(idx + 1).filter((entry) => entry.name !== name)
			];
			else this[kState].push(entry);
		}
		[nodeUtil$2.inspect.custom](depth, options) {
			const state = this[kState].reduce((a, b) => {
				if (a[b.name]) {
					if (Array.isArray(a[b.name])) a[b.name].push(b.value);
					else a[b.name] = [a[b.name], b.value];
				} else a[b.name] = b.value;
				return a;
			}, { __proto__: null });
			options.depth ??= depth;
			options.colors ??= true;
			const output = nodeUtil$2.formatWithOptions(options, state);
			return `FormData ${output.slice(output.indexOf("]") + 2)}`;
		}
	};
	iteratorMixin("FormData", FormData, kState, "name", "value");
	Object.defineProperties(FormData.prototype, {
		append: kEnumerableProperty,
		delete: kEnumerableProperty,
		get: kEnumerableProperty,
		getAll: kEnumerableProperty,
		has: kEnumerableProperty,
		set: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "FormData",
			configurable: true
		}
	});
	/**
	* @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#create-an-entry
	* @param {string} name
	* @param {string|Blob} value
	* @param {?string} filename
	* @returns
	*/
	function makeEntry(name, value, filename) {
		if (typeof value === "string") {} else {
			if (!isFileLike(value)) value = value instanceof Blob ? new File([value], "blob", { type: value.type }) : new FileLike(value, "blob", { type: value.type });
			if (filename !== void 0) {
				/** @type {FilePropertyBag} */
				const options = {
					type: value.type,
					lastModified: value.lastModified
				};
				value = value instanceof NativeFile ? new File([value], filename, options) : new FileLike(value, filename, options);
			}
		}
		return {
			name,
			value
		};
	}
	module.exports = {
		FormData,
		makeEntry
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/formdata-parser.js
var require_formdata_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { isUSVString, bufferToLowerCasedHeaderName } = require_util$8();
	var { utf8DecodeBytes } = require_util$7();
	var { HTTP_TOKEN_CODEPOINTS, isomorphicDecode } = require_data_url();
	var { isFileLike } = require_file();
	var { makeEntry } = require_formdata();
	var assert$21 = __require("node:assert");
	var { File: NodeFile } = __require("node:buffer");
	var File = globalThis.File ?? NodeFile;
	var formDataNameBuffer = Buffer.from("form-data; name=\"");
	var filenameBuffer = Buffer.from("; filename");
	var dd = Buffer.from("--");
	var ddcrlf = Buffer.from("--\r\n");
	/**
	* @param {string} chars
	*/
	function isAsciiString(chars) {
		for (let i = 0; i < chars.length; ++i) if ((chars.charCodeAt(i) & -128) !== 0) return false;
		return true;
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#multipart-form-data-boundary
	* @param {string} boundary
	*/
	function validateBoundary(boundary) {
		const length = boundary.length;
		if (length < 27 || length > 70) return false;
		for (let i = 0; i < length; ++i) {
			const cp = boundary.charCodeAt(i);
			if (!(cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 39 || cp === 45 || cp === 95)) return false;
		}
		return true;
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#multipart-form-data-parser
	* @param {Buffer} input
	* @param {ReturnType<import('./data-url')['parseMIMEType']>} mimeType
	*/
	function multipartFormDataParser(input, mimeType) {
		assert$21(mimeType !== "failure" && mimeType.essence === "multipart/form-data");
		const boundaryString = mimeType.parameters.get("boundary");
		if (boundaryString === void 0) return "failure";
		const boundary = Buffer.from(`--${boundaryString}`, "utf8");
		const entryList = [];
		const position = { position: 0 };
		while (input[position.position] === 13 && input[position.position + 1] === 10) position.position += 2;
		let trailing = input.length;
		while (input[trailing - 1] === 10 && input[trailing - 2] === 13) trailing -= 2;
		if (trailing !== input.length) input = input.subarray(0, trailing);
		while (true) {
			if (input.subarray(position.position, position.position + boundary.length).equals(boundary)) position.position += boundary.length;
			else return "failure";
			if (position.position === input.length - 2 && bufferStartsWith(input, dd, position) || position.position === input.length - 4 && bufferStartsWith(input, ddcrlf, position)) return entryList;
			if (input[position.position] !== 13 || input[position.position + 1] !== 10) return "failure";
			position.position += 2;
			const result = parseMultipartFormDataHeaders(input, position);
			if (result === "failure") return "failure";
			let { name, filename, contentType, encoding } = result;
			position.position += 2;
			let body;
			{
				const boundaryIndex = input.indexOf(boundary.subarray(2), position.position);
				if (boundaryIndex === -1) return "failure";
				body = input.subarray(position.position, boundaryIndex - 4);
				position.position += body.length;
				if (encoding === "base64") body = Buffer.from(body.toString(), "base64");
			}
			if (input[position.position] !== 13 || input[position.position + 1] !== 10) return "failure";
			else position.position += 2;
			let value;
			if (filename !== null) {
				contentType ??= "text/plain";
				if (!isAsciiString(contentType)) contentType = "";
				value = new File([body], filename, { type: contentType });
			} else value = utf8DecodeBytes(Buffer.from(body));
			assert$21(isUSVString(name));
			assert$21(typeof value === "string" && isUSVString(value) || isFileLike(value));
			entryList.push(makeEntry(name, value, filename));
		}
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#parse-multipart-form-data-headers
	* @param {Buffer} input
	* @param {{ position: number }} position
	*/
	function parseMultipartFormDataHeaders(input, position) {
		let name = null;
		let filename = null;
		let contentType = null;
		let encoding = null;
		while (true) {
			if (input[position.position] === 13 && input[position.position + 1] === 10) {
				if (name === null) return "failure";
				return {
					name,
					filename,
					contentType,
					encoding
				};
			}
			let headerName = collectASequenceOfBytes((char) => char !== 10 && char !== 13 && char !== 58, input, position);
			headerName = removeChars(headerName, true, true, (char) => char === 9 || char === 32);
			if (!HTTP_TOKEN_CODEPOINTS.test(headerName.toString())) return "failure";
			if (input[position.position] !== 58) return "failure";
			position.position++;
			collectASequenceOfBytes((char) => char === 32 || char === 9, input, position);
			switch (bufferToLowerCasedHeaderName(headerName)) {
				case "content-disposition":
					name = filename = null;
					if (!bufferStartsWith(input, formDataNameBuffer, position)) return "failure";
					position.position += 17;
					name = parseMultipartFormDataName(input, position);
					if (name === null) return "failure";
					if (bufferStartsWith(input, filenameBuffer, position)) {
						let check = position.position + filenameBuffer.length;
						if (input[check] === 42) {
							position.position += 1;
							check += 1;
						}
						if (input[check] !== 61 || input[check + 1] !== 34) return "failure";
						position.position += 12;
						filename = parseMultipartFormDataName(input, position);
						if (filename === null) return "failure";
					}
					break;
				case "content-type": {
					let headerValue = collectASequenceOfBytes((char) => char !== 10 && char !== 13, input, position);
					headerValue = removeChars(headerValue, false, true, (char) => char === 9 || char === 32);
					contentType = isomorphicDecode(headerValue);
					break;
				}
				case "content-transfer-encoding": {
					let headerValue = collectASequenceOfBytes((char) => char !== 10 && char !== 13, input, position);
					headerValue = removeChars(headerValue, false, true, (char) => char === 9 || char === 32);
					encoding = isomorphicDecode(headerValue);
					break;
				}
				default: collectASequenceOfBytes((char) => char !== 10 && char !== 13, input, position);
			}
			if (input[position.position] !== 13 && input[position.position + 1] !== 10) return "failure";
			else position.position += 2;
		}
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#parse-a-multipart-form-data-name
	* @param {Buffer} input
	* @param {{ position: number }} position
	*/
	function parseMultipartFormDataName(input, position) {
		assert$21(input[position.position - 1] === 34);
		/** @type {string | Buffer} */
		let name = collectASequenceOfBytes((char) => char !== 10 && char !== 13 && char !== 34, input, position);
		if (input[position.position] !== 34) return null;
		else position.position++;
		name = new TextDecoder().decode(name).replace(/%0A/gi, "\n").replace(/%0D/gi, "\r").replace(/%22/g, "\"");
		return name;
	}
	/**
	* @param {(char: number) => boolean} condition
	* @param {Buffer} input
	* @param {{ position: number }} position
	*/
	function collectASequenceOfBytes(condition, input, position) {
		let start = position.position;
		while (start < input.length && condition(input[start])) ++start;
		return input.subarray(position.position, position.position = start);
	}
	/**
	* @param {Buffer} buf
	* @param {boolean} leading
	* @param {boolean} trailing
	* @param {(charCode: number) => boolean} predicate
	* @returns {Buffer}
	*/
	function removeChars(buf, leading, trailing, predicate) {
		let lead = 0;
		let trail = buf.length - 1;
		if (leading) while (lead < buf.length && predicate(buf[lead])) lead++;
		if (trailing) while (trail > 0 && predicate(buf[trail])) trail--;
		return lead === 0 && trail === buf.length - 1 ? buf : buf.subarray(lead, trail + 1);
	}
	/**
	* Checks if {@param buffer} starts with {@param start}
	* @param {Buffer} buffer
	* @param {Buffer} start
	* @param {{ position: number }} position
	*/
	function bufferStartsWith(buffer, start, position) {
		if (buffer.length < start.length) return false;
		for (let i = 0; i < start.length; i++) if (start[i] !== buffer[position.position + i]) return false;
		return true;
	}
	module.exports = {
		multipartFormDataParser,
		validateBoundary
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/body.js
var require_body = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util = require_util$8();
	var { ReadableStreamFrom, isBlobLike, isReadableStreamLike, readableStreamClose, createDeferredPromise, fullyReadBody, extractMimeType, utf8DecodeBytes } = require_util$7();
	var { FormData } = require_formdata();
	var { kState } = require_symbols$3();
	var { webidl } = require_webidl();
	var { Blob: Blob$1 } = __require("node:buffer");
	var assert$20 = __require("node:assert");
	var { isErrored, isDisturbed } = __require("node:stream");
	var { isArrayBuffer } = __require("node:util/types");
	var { serializeAMimeType } = require_data_url();
	var { multipartFormDataParser } = require_formdata_parser();
	var random;
	try {
		const crypto = __require("node:crypto");
		random = (max) => crypto.randomInt(0, max);
	} catch {
		random = (max) => Math.floor(Math.random(max));
	}
	var textEncoder = new TextEncoder();
	function noop() {}
	var hasFinalizationRegistry = globalThis.FinalizationRegistry && process.version.indexOf("v18") !== 0;
	var streamRegistry;
	if (hasFinalizationRegistry) streamRegistry = new FinalizationRegistry((weakRef) => {
		const stream = weakRef.deref();
		if (stream && !stream.locked && !isDisturbed(stream) && !isErrored(stream)) stream.cancel("Response object has been garbage collected").catch(noop);
	});
	function extractBody(object, keepalive = false) {
		let stream = null;
		if (object instanceof ReadableStream) stream = object;
		else if (isBlobLike(object)) stream = object.stream();
		else stream = new ReadableStream({
			async pull(controller) {
				const buffer = typeof source === "string" ? textEncoder.encode(source) : source;
				if (buffer.byteLength) controller.enqueue(buffer);
				queueMicrotask(() => readableStreamClose(controller));
			},
			start() {},
			type: "bytes"
		});
		assert$20(isReadableStreamLike(stream));
		let action = null;
		let source = null;
		let length = null;
		let type = null;
		if (typeof object === "string") {
			source = object;
			type = "text/plain;charset=UTF-8";
		} else if (object instanceof URLSearchParams) {
			source = object.toString();
			type = "application/x-www-form-urlencoded;charset=UTF-8";
		} else if (isArrayBuffer(object)) source = new Uint8Array(object.slice());
		else if (ArrayBuffer.isView(object)) source = new Uint8Array(object.buffer.slice(object.byteOffset, object.byteOffset + object.byteLength));
		else if (util.isFormDataLike(object)) {
			const boundary = `----formdata-undici-0${`${random(1e11)}`.padStart(11, "0")}`;
			const prefix = `--${boundary}\r\nContent-Disposition: form-data`;
			/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
			const escape = (str) => str.replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22");
			const normalizeLinefeeds = (value) => value.replace(/\r?\n|\r/g, "\r\n");
			const blobParts = [];
			const rn = new Uint8Array([13, 10]);
			length = 0;
			let hasUnknownSizeValue = false;
			for (const [name, value] of object) if (typeof value === "string") {
				const chunk = textEncoder.encode(prefix + `; name="${escape(normalizeLinefeeds(name))}"\r\n\r\n${normalizeLinefeeds(value)}\r\n`);
				blobParts.push(chunk);
				length += chunk.byteLength;
			} else {
				const chunk = textEncoder.encode(`${prefix}; name="${escape(normalizeLinefeeds(name))}"` + (value.name ? `; filename="${escape(value.name)}"` : "") + `\r
Content-Type: ${value.type || "application/octet-stream"}\r\n\r\n`);
				blobParts.push(chunk, value, rn);
				if (typeof value.size === "number") length += chunk.byteLength + value.size + rn.byteLength;
				else hasUnknownSizeValue = true;
			}
			const chunk = textEncoder.encode(`--${boundary}--\r\n`);
			blobParts.push(chunk);
			length += chunk.byteLength;
			if (hasUnknownSizeValue) length = null;
			source = object;
			action = async function* () {
				for (const part of blobParts) if (part.stream) yield* part.stream();
				else yield part;
			};
			type = `multipart/form-data; boundary=${boundary}`;
		} else if (isBlobLike(object)) {
			source = object;
			length = object.size;
			if (object.type) type = object.type;
		} else if (typeof object[Symbol.asyncIterator] === "function") {
			if (keepalive) throw new TypeError("keepalive");
			if (util.isDisturbed(object) || object.locked) throw new TypeError("Response body object should not be disturbed or locked");
			stream = object instanceof ReadableStream ? object : ReadableStreamFrom(object);
		}
		if (typeof source === "string" || util.isBuffer(source)) length = Buffer.byteLength(source);
		if (action != null) {
			let iterator;
			stream = new ReadableStream({
				async start() {
					iterator = action(object)[Symbol.asyncIterator]();
				},
				async pull(controller) {
					const { value, done } = await iterator.next();
					if (done) queueMicrotask(() => {
						controller.close();
						controller.byobRequest?.respond(0);
					});
					else if (!isErrored(stream)) {
						const buffer = new Uint8Array(value);
						if (buffer.byteLength) controller.enqueue(buffer);
					}
					return controller.desiredSize > 0;
				},
				async cancel(reason) {
					await iterator.return();
				},
				type: "bytes"
			});
		}
		return [{
			stream,
			source,
			length
		}, type];
	}
	function safelyExtractBody(object, keepalive = false) {
		if (object instanceof ReadableStream) {
			// istanbul ignore next
			assert$20(!util.isDisturbed(object), "The body has already been consumed.");
			// istanbul ignore next
			assert$20(!object.locked, "The stream is locked.");
		}
		return extractBody(object, keepalive);
	}
	function cloneBody(instance, body) {
		const [out1, out2] = body.stream.tee();
		body.stream = out1;
		return {
			stream: out2,
			length: body.length,
			source: body.source
		};
	}
	function throwIfAborted(state) {
		if (state.aborted) throw new DOMException("The operation was aborted.", "AbortError");
	}
	function bodyMixinMethods(instance) {
		return {
			blob() {
				return consumeBody(this, (bytes) => {
					let mimeType = bodyMimeType(this);
					if (mimeType === null) mimeType = "";
					else if (mimeType) mimeType = serializeAMimeType(mimeType);
					return new Blob$1([bytes], { type: mimeType });
				}, instance);
			},
			arrayBuffer() {
				return consumeBody(this, (bytes) => {
					return new Uint8Array(bytes).buffer;
				}, instance);
			},
			text() {
				return consumeBody(this, utf8DecodeBytes, instance);
			},
			json() {
				return consumeBody(this, parseJSONFromBytes, instance);
			},
			formData() {
				return consumeBody(this, (value) => {
					const mimeType = bodyMimeType(this);
					if (mimeType !== null) switch (mimeType.essence) {
						case "multipart/form-data": {
							const parsed = multipartFormDataParser(value, mimeType);
							if (parsed === "failure") throw new TypeError("Failed to parse body as FormData.");
							const fd = new FormData();
							fd[kState] = parsed;
							return fd;
						}
						case "application/x-www-form-urlencoded": {
							const entries = new URLSearchParams(value.toString());
							const fd = new FormData();
							for (const [name, value] of entries) fd.append(name, value);
							return fd;
						}
					}
					throw new TypeError("Content-Type was not one of \"multipart/form-data\" or \"application/x-www-form-urlencoded\".");
				}, instance);
			},
			bytes() {
				return consumeBody(this, (bytes) => {
					return new Uint8Array(bytes);
				}, instance);
			}
		};
	}
	function mixinBody(prototype) {
		Object.assign(prototype.prototype, bodyMixinMethods(prototype));
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-body-consume-body
	* @param {Response|Request} object
	* @param {(value: unknown) => unknown} convertBytesToJSValue
	* @param {Response|Request} instance
	*/
	async function consumeBody(object, convertBytesToJSValue, instance) {
		webidl.brandCheck(object, instance);
		if (bodyUnusable(object)) throw new TypeError("Body is unusable: Body has already been read");
		throwIfAborted(object[kState]);
		const promise = createDeferredPromise();
		const errorSteps = (error) => promise.reject(error);
		const successSteps = (data) => {
			try {
				promise.resolve(convertBytesToJSValue(data));
			} catch (e) {
				errorSteps(e);
			}
		};
		if (object[kState].body == null) {
			successSteps(Buffer.allocUnsafe(0));
			return promise.promise;
		}
		await fullyReadBody(object[kState].body, successSteps, errorSteps);
		return promise.promise;
	}
	function bodyUnusable(object) {
		const body = object[kState].body;
		return body != null && (body.stream.locked || util.isDisturbed(body.stream));
	}
	/**
	* @see https://infra.spec.whatwg.org/#parse-json-bytes-to-a-javascript-value
	* @param {Uint8Array} bytes
	*/
	function parseJSONFromBytes(bytes) {
		return JSON.parse(utf8DecodeBytes(bytes));
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-body-mime-type
	* @param {import('./response').Response|import('./request').Request} requestOrResponse
	*/
	function bodyMimeType(requestOrResponse) {
		/** @type {import('./headers').HeadersList} */
		const headers = requestOrResponse[kState].headersList;
		const mimeType = extractMimeType(headers);
		if (mimeType === "failure") return null;
		return mimeType;
	}
	module.exports = {
		extractBody,
		safelyExtractBody,
		cloneBody,
		mixinBody,
		streamRegistry,
		hasFinalizationRegistry,
		bodyUnusable
	};
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/client-h1.js
var require_client_h1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$19 = __require("node:assert");
	var util = require_util$8();
	var { channels } = require_diagnostics();
	var timers = require_timers();
	var { RequestContentLengthMismatchError, ResponseContentLengthMismatchError, RequestAbortedError, InvalidArgumentError, HeadersTimeoutError, HeadersOverflowError, SocketError, InformationalError, BodyTimeoutError, HTTPParserError, ResponseExceededMaxSizeError } = require_errors$1();
	var { kUrl, kReset, kClient, kParser, kBlocking, kRunning, kPending, kSize, kWriting, kQueue, kNoRef, kKeepAliveDefaultTimeout, kHostHeader, kPendingIdx, kRunningIdx, kError, kPipelining, kSocket, kKeepAliveTimeoutValue, kMaxHeadersSize, kKeepAliveMaxTimeout, kKeepAliveTimeoutThreshold, kHeadersTimeout, kBodyTimeout, kStrictContentLength, kMaxRequests, kCounter, kMaxResponseSize, kOnError, kResume, kHTTPContext } = require_symbols$4();
	var constants = require_constants$4();
	var EMPTY_BUF = Buffer.alloc(0);
	var FastBuffer = Buffer[Symbol.species];
	var addListener = util.addListener;
	var removeAllListeners = util.removeAllListeners;
	var kIdleSocketValidation = Symbol("kIdleSocketValidation");
	var kIdleSocketValidationTimeout = Symbol("kIdleSocketValidationTimeout");
	var kSocketUsed = Symbol("kSocketUsed");
	var extractBody;
	async function lazyllhttp() {
		const llhttpWasmData = process.env.JEST_WORKER_ID ? require_llhttp_wasm() : void 0;
		let mod;
		try {
			mod = await WebAssembly.compile(require_llhttp_simd_wasm());
		} catch (e) {
			/* istanbul ignore next */
			mod = await WebAssembly.compile(llhttpWasmData || require_llhttp_wasm());
		}
		return await WebAssembly.instantiate(mod, { env: {
			wasm_on_url: (p, at, len) => {
				/* istanbul ignore next */
				return 0;
			},
			wasm_on_status: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onStatus(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_message_begin: (p) => {
				assert$19(currentParser.ptr === p);
				return currentParser.onMessageBegin() || 0;
			},
			wasm_on_header_field: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onHeaderField(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_header_value: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onHeaderValue(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_headers_complete: (p, statusCode, upgrade, shouldKeepAlive) => {
				assert$19(currentParser.ptr === p);
				return currentParser.onHeadersComplete(statusCode, Boolean(upgrade), Boolean(shouldKeepAlive)) || 0;
			},
			wasm_on_body: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onBody(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_message_complete: (p) => {
				assert$19(currentParser.ptr === p);
				return currentParser.onMessageComplete() || 0;
			}
		} });
	}
	var llhttpInstance = null;
	var llhttpPromise = lazyllhttp();
	llhttpPromise.catch();
	var currentParser = null;
	var currentBufferRef = null;
	var currentBufferSize = 0;
	var currentBufferPtr = null;
	var USE_FAST_TIMER = 1;
	var TIMEOUT_HEADERS = 3;
	var TIMEOUT_BODY = 5;
	var TIMEOUT_KEEP_ALIVE = 8;
	var Parser = class {
		constructor(client, socket, { exports: exports$1 }) {
			assert$19(Number.isFinite(client[kMaxHeadersSize]) && client[kMaxHeadersSize] > 0);
			this.llhttp = exports$1;
			this.ptr = this.llhttp.llhttp_alloc(constants.TYPE.RESPONSE);
			this.client = client;
			this.socket = socket;
			this.timeout = null;
			this.timeoutValue = null;
			this.timeoutType = null;
			this.statusCode = null;
			this.statusText = "";
			this.upgrade = false;
			this.headers = [];
			this.headersSize = 0;
			this.headersMaxSize = client[kMaxHeadersSize];
			this.shouldKeepAlive = false;
			this.paused = false;
			this.resume = this.resume.bind(this);
			this.bytesRead = 0;
			this.keepAlive = "";
			this.contentLength = "";
			this.connection = "";
			this.maxResponseSize = client[kMaxResponseSize];
		}
		setTimeout(delay, type) {
			if (delay !== this.timeoutValue || type & USE_FAST_TIMER ^ this.timeoutType & USE_FAST_TIMER) {
				if (this.timeout) {
					timers.clearTimeout(this.timeout);
					this.timeout = null;
				}
				if (delay) {
					if (type & USE_FAST_TIMER) this.timeout = timers.setFastTimeout(onParserTimeout, delay, new WeakRef(this));
					else {
						this.timeout = setTimeout(onParserTimeout, delay, new WeakRef(this));
						this.timeout.unref();
					}
				}
				this.timeoutValue = delay;
			} else if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			this.timeoutType = type;
		}
		resume() {
			if (this.socket.destroyed || !this.paused) return;
			assert$19(this.ptr != null);
			assert$19(currentParser == null);
			this.llhttp.llhttp_resume(this.ptr);
			assert$19(this.timeoutType === TIMEOUT_BODY);
			if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			this.paused = false;
			this.execute(this.socket.read() || EMPTY_BUF);
			this.readMore();
		}
		readMore() {
			while (!this.paused && this.ptr) {
				const chunk = this.socket.read();
				if (chunk === null) break;
				this.execute(chunk);
			}
		}
		execute(data) {
			assert$19(this.ptr != null);
			assert$19(currentParser == null);
			assert$19(!this.paused);
			const { socket, llhttp } = this;
			if (data.length > currentBufferSize) {
				if (currentBufferPtr) llhttp.free(currentBufferPtr);
				currentBufferSize = Math.ceil(data.length / 4096) * 4096;
				currentBufferPtr = llhttp.malloc(currentBufferSize);
			}
			new Uint8Array(llhttp.memory.buffer, currentBufferPtr, currentBufferSize).set(data);
			try {
				let ret;
				try {
					currentBufferRef = data;
					currentParser = this;
					ret = llhttp.llhttp_execute(this.ptr, currentBufferPtr, data.length);
				} catch (err) {
					/* istanbul ignore next: difficult to make a test case for */
					throw err;
				} finally {
					currentParser = null;
					currentBufferRef = null;
				}
				const offset = llhttp.llhttp_get_error_pos(this.ptr) - currentBufferPtr;
				if (ret !== constants.ERROR.OK) {
					const body = data.subarray(offset);
					if (ret === constants.ERROR.PAUSED_UPGRADE) this.onUpgrade(body);
					else if (ret === constants.ERROR.PAUSED) {
						this.paused = true;
						socket.unshift(body);
					} else throw this.createError(ret, body);
				}
			} catch (err) {
				util.destroy(socket, err);
			}
		}
		finish() {
			assert$19(currentParser === null);
			assert$19(this.ptr != null);
			assert$19(!this.paused);
			const { llhttp } = this;
			let ret;
			try {
				currentParser = this;
				ret = llhttp.llhttp_finish(this.ptr);
			} finally {
				currentParser = null;
			}
			if (ret === constants.ERROR.OK) return null;
			if (ret === constants.ERROR.PAUSED || ret === constants.ERROR.PAUSED_UPGRADE) {
				this.paused = true;
				return null;
			}
			return this.createError(ret, EMPTY_BUF);
		}
		createError(ret, data) {
			const { llhttp, contentLength, bytesRead } = this;
			if (contentLength && bytesRead !== parseInt(contentLength, 10)) return new ResponseContentLengthMismatchError();
			const ptr = llhttp.llhttp_get_error_reason(this.ptr);
			let message = "";
			if (ptr) {
				const len = new Uint8Array(llhttp.memory.buffer, ptr).indexOf(0);
				message = "Response does not match the HTTP/1.1 protocol (" + Buffer.from(llhttp.memory.buffer, ptr, len).toString() + ")";
			}
			return new HTTPParserError(message, constants.ERROR[ret], data);
		}
		destroy() {
			assert$19(this.ptr != null);
			assert$19(currentParser == null);
			this.llhttp.llhttp_free(this.ptr);
			this.ptr = null;
			this.timeout && timers.clearTimeout(this.timeout);
			this.timeout = null;
			this.timeoutValue = null;
			this.timeoutType = null;
			this.paused = false;
		}
		onStatus(buf) {
			this.statusText = buf.toString();
		}
		onMessageBegin() {
			const { socket, client } = this;
			/* istanbul ignore next: difficult to make a test case for */
			if (socket.destroyed) return -1;
			if (client[kRunning] === 0) {
				util.destroy(socket, new SocketError("bad response", util.getSocketInfo(socket)));
				return -1;
			}
			const request = client[kQueue][client[kRunningIdx]];
			if (!request) return -1;
			request.onResponseStarted();
		}
		onHeaderField(buf) {
			const len = this.headers.length;
			if ((len & 1) === 0) this.headers.push(buf);
			else this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
			this.trackHeader(buf.length);
		}
		onHeaderValue(buf) {
			let len = this.headers.length;
			if ((len & 1) === 1) {
				this.headers.push(buf);
				len += 1;
			} else this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
			const key = this.headers[len - 2];
			if (key.length === 10) {
				const headerName = util.bufferToLowerCasedHeaderName(key);
				if (headerName === "keep-alive") this.keepAlive += buf.toString();
				else if (headerName === "connection") this.connection += buf.toString();
			} else if (key.length === 14 && util.bufferToLowerCasedHeaderName(key) === "content-length") this.contentLength += buf.toString();
			this.trackHeader(buf.length);
		}
		trackHeader(len) {
			this.headersSize += len;
			if (this.headersSize >= this.headersMaxSize) util.destroy(this.socket, new HeadersOverflowError());
		}
		onUpgrade(head) {
			const { upgrade, client, socket, headers, statusCode, statusText } = this;
			assert$19(upgrade);
			assert$19(client[kSocket] === socket);
			assert$19(!socket.destroyed);
			assert$19(!this.paused);
			assert$19((headers.length & 1) === 0);
			const request = client[kQueue][client[kRunningIdx]];
			assert$19(request);
			assert$19(request.upgrade || request.method === "CONNECT");
			this.statusCode = null;
			this.statusText = "";
			this.shouldKeepAlive = null;
			this.headers = [];
			this.headersSize = 0;
			socket.unshift(head);
			socket[kParser].destroy();
			socket[kParser] = null;
			socket[kClient] = null;
			socket[kError] = null;
			removeAllListeners(socket);
			client[kSocket] = null;
			client[kHTTPContext] = null;
			client[kQueue][client[kRunningIdx]++] = null;
			client.emit("disconnect", client[kUrl], [client], new InformationalError("upgrade"));
			try {
				request.onUpgrade(statusCode, headers, socket, statusText);
			} catch (error) {
				util.errorRequest(client, request, error);
				util.destroy(socket, error);
			}
			client[kResume]();
		}
		onHeadersComplete(statusCode, upgrade, shouldKeepAlive) {
			const { client, socket, headers, statusText } = this;
			/* istanbul ignore next: difficult to make a test case for */
			if (socket.destroyed) return -1;
			if (client[kRunning] === 0) {
				util.destroy(socket, new SocketError("bad response", util.getSocketInfo(socket)));
				return -1;
			}
			const request = client[kQueue][client[kRunningIdx]];
			/* istanbul ignore next: difficult to make a test case for */
			if (!request) return -1;
			assert$19(!this.upgrade);
			assert$19(this.statusCode < 200);
			if (statusCode === 100) {
				util.destroy(socket, new SocketError("bad response", util.getSocketInfo(socket)));
				return -1;
			}
			if (upgrade && !request.upgrade) {
				util.destroy(socket, new SocketError("bad upgrade", util.getSocketInfo(socket)));
				return -1;
			}
			assert$19(this.timeoutType === TIMEOUT_HEADERS);
			this.statusCode = statusCode;
			this.shouldKeepAlive = shouldKeepAlive || request.method === "HEAD" && !socket[kReset] && this.connection.toLowerCase() === "keep-alive";
			if (this.statusCode >= 200) {
				const bodyTimeout = request.bodyTimeout != null ? request.bodyTimeout : client[kBodyTimeout];
				this.setTimeout(bodyTimeout, TIMEOUT_BODY);
			} else if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			if (request.method === "CONNECT") {
				assert$19(client[kRunning] === 1);
				this.upgrade = true;
				return 2;
			}
			if (upgrade) {
				assert$19(client[kRunning] === 1);
				this.upgrade = true;
				return 2;
			}
			assert$19((this.headers.length & 1) === 0);
			this.headers = [];
			this.headersSize = 0;
			if (this.shouldKeepAlive && client[kPipelining]) {
				const keepAliveTimeout = this.keepAlive ? util.parseKeepAliveTimeout(this.keepAlive) : null;
				if (keepAliveTimeout != null) {
					const timeout = Math.min(keepAliveTimeout - client[kKeepAliveTimeoutThreshold], client[kKeepAliveMaxTimeout]);
					if (timeout <= 0) socket[kReset] = true;
					else client[kKeepAliveTimeoutValue] = timeout;
				} else client[kKeepAliveTimeoutValue] = client[kKeepAliveDefaultTimeout];
			} else socket[kReset] = true;
			const pause = request.onHeaders(statusCode, headers, this.resume, statusText) === false;
			if (request.aborted) return -1;
			if (request.method === "HEAD") return 1;
			if (statusCode < 200) return 1;
			if (socket[kBlocking]) {
				socket[kBlocking] = false;
				client[kResume]();
			}
			return pause ? constants.ERROR.PAUSED : 0;
		}
		onBody(buf) {
			const { client, socket, statusCode, maxResponseSize } = this;
			if (socket.destroyed) return -1;
			const request = client[kQueue][client[kRunningIdx]];
			assert$19(request);
			assert$19(this.timeoutType === TIMEOUT_BODY);
			if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			assert$19(statusCode >= 200);
			if (maxResponseSize > -1 && this.bytesRead + buf.length > maxResponseSize) {
				util.destroy(socket, new ResponseExceededMaxSizeError());
				return -1;
			}
			this.bytesRead += buf.length;
			if (request.onData(buf) === false) return constants.ERROR.PAUSED;
		}
		onMessageComplete() {
			const { client, socket, statusCode, upgrade, headers, contentLength, bytesRead, shouldKeepAlive } = this;
			if (socket.destroyed && (!statusCode || shouldKeepAlive)) return -1;
			if (upgrade) return;
			assert$19(statusCode >= 100);
			assert$19((this.headers.length & 1) === 0);
			const request = client[kQueue][client[kRunningIdx]];
			assert$19(request);
			this.statusCode = null;
			this.statusText = "";
			this.bytesRead = 0;
			this.contentLength = "";
			this.keepAlive = "";
			this.connection = "";
			this.headers = [];
			this.headersSize = 0;
			if (statusCode < 200) return;
			/* istanbul ignore next: should be handled by llhttp? */
			if (request.method !== "HEAD" && contentLength && bytesRead !== parseInt(contentLength, 10)) {
				util.destroy(socket, new ResponseContentLengthMismatchError());
				return -1;
			}
			request.onComplete(headers);
			client[kQueue][client[kRunningIdx]++] = null;
			socket[kSocketUsed] = true;
			if (socket[kWriting]) {
				assert$19(client[kRunning] === 0);
				util.destroy(socket, new InformationalError("reset"));
				return constants.ERROR.PAUSED;
			} else if (!shouldKeepAlive) {
				util.destroy(socket, new InformationalError("reset"));
				return constants.ERROR.PAUSED;
			} else if (socket[kReset] && client[kRunning] === 0) {
				util.destroy(socket, new InformationalError("reset"));
				return constants.ERROR.PAUSED;
			} else if (client[kPipelining] == null || client[kPipelining] === 1) setImmediate(() => client[kResume]());
			else client[kResume]();
		}
	};
	function onParserTimeout(parser) {
		const { socket, timeoutType, client, paused } = parser.deref();
		/* istanbul ignore else */
		if (timeoutType === TIMEOUT_HEADERS) {
			if (!socket[kWriting] || socket.writableNeedDrain || client[kRunning] > 1) {
				assert$19(!paused, "cannot be paused while waiting for headers");
				util.destroy(socket, new HeadersTimeoutError());
			}
		} else if (timeoutType === TIMEOUT_BODY) {
			if (!paused) util.destroy(socket, new BodyTimeoutError());
		} else if (timeoutType === TIMEOUT_KEEP_ALIVE) {
			assert$19(client[kRunning] === 0 && client[kKeepAliveTimeoutValue]);
			util.destroy(socket, new InformationalError("socket idle timeout"));
		}
	}
	async function connectH1(client, socket) {
		client[kSocket] = socket;
		if (!llhttpInstance) {
			llhttpInstance = await llhttpPromise;
			llhttpPromise = null;
		}
		socket[kNoRef] = false;
		socket[kWriting] = false;
		socket[kReset] = false;
		socket[kBlocking] = false;
		socket[kIdleSocketValidation] = 0;
		socket[kIdleSocketValidationTimeout] = null;
		socket[kSocketUsed] = false;
		socket[kParser] = new Parser(client, socket, llhttpInstance);
		addListener(socket, "error", function(err) {
			assert$19(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
			const parser = this[kParser];
			if (err.code === "ECONNRESET" && parser.statusCode && !parser.shouldKeepAlive) {
				const parserErr = parser.finish();
				if (parserErr) {
					this[kError] = parserErr;
					this[kClient][kOnError](parserErr);
				}
				return;
			}
			this[kError] = err;
			this[kClient][kOnError](err);
		});
		addListener(socket, "readable", function() {
			const parser = this[kParser];
			if (parser) parser.readMore();
		});
		addListener(socket, "end", function() {
			const parser = this[kParser];
			if (parser.statusCode && !parser.shouldKeepAlive) {
				const parserErr = parser.finish();
				if (parserErr) util.destroy(this, parserErr);
				return;
			}
			util.destroy(this, new SocketError("other side closed", util.getSocketInfo(this)));
		});
		addListener(socket, "close", function() {
			const client = this[kClient];
			const parser = this[kParser];
			clearIdleSocketValidation(this);
			if (parser) {
				if (!this[kError] && parser.statusCode && !parser.shouldKeepAlive) this[kError] = parser.finish() || this[kError];
				this[kParser].destroy();
				this[kParser] = null;
			}
			const err = this[kError] || new SocketError("closed", util.getSocketInfo(this));
			client[kSocket] = null;
			client[kHTTPContext] = null;
			if (client.destroyed) {
				assert$19(client[kPending] === 0);
				const requests = client[kQueue].splice(client[kRunningIdx]);
				for (let i = 0; i < requests.length; i++) {
					const request = requests[i];
					util.errorRequest(client, request, err);
				}
			} else if (client[kRunning] > 0 && err.code !== "UND_ERR_INFO") {
				const request = client[kQueue][client[kRunningIdx]];
				client[kQueue][client[kRunningIdx]++] = null;
				util.errorRequest(client, request, err);
			}
			client[kPendingIdx] = client[kRunningIdx];
			assert$19(client[kRunning] === 0);
			client.emit("disconnect", client[kUrl], [client], err);
			client[kResume]();
		});
		let closed = false;
		socket.on("close", () => {
			closed = true;
		});
		return {
			version: "h1",
			defaultPipelining: 1,
			write(...args) {
				return writeH1(client, ...args);
			},
			resume() {
				resumeH1(client);
			},
			destroy(err, callback) {
				if (closed) queueMicrotask(callback);
				else socket.destroy(err).on("close", callback);
			},
			get destroyed() {
				return socket.destroyed;
			},
			busy(request) {
				if (socket[kWriting] || socket[kReset] || socket[kBlocking] || socket[kIdleSocketValidation] === 1) return true;
				if (request) {
					if (client[kRunning] > 0 && !request.idempotent) return true;
					if (client[kRunning] > 0 && (request.upgrade || request.method === "CONNECT")) return true;
					if (client[kRunning] > 0 && util.bodyLength(request.body) !== 0 && (util.isStream(request.body) || util.isAsyncIterable(request.body) || util.isFormDataLike(request.body))) return true;
				}
				return false;
			}
		};
	}
	function clearIdleSocketValidation(socket) {
		if (socket[kIdleSocketValidationTimeout]) {
			clearImmediate(socket[kIdleSocketValidationTimeout]);
			socket[kIdleSocketValidationTimeout] = null;
		}
		socket[kIdleSocketValidation] = 0;
	}
	function scheduleIdleSocketValidation(client, socket) {
		socket[kIdleSocketValidation] = 1;
		socket[kIdleSocketValidationTimeout] = setImmediate(() => {
			socket[kIdleSocketValidationTimeout] = null;
			socket[kIdleSocketValidation] = 2;
			if (client[kSocket] === socket && !socket.destroyed) client[kResume]();
		});
	}
	/**
	* @param {import('./client.js')} client
	*/
	function resumeH1(client) {
		const socket = client[kSocket];
		if (socket && !socket.destroyed) {
			if (client[kSize] === 0) {
				if (!socket[kNoRef] && socket.unref) {
					socket.unref();
					socket[kNoRef] = true;
				}
			} else if (socket[kNoRef] && socket.ref) {
				socket.ref();
				socket[kNoRef] = false;
			}
			if (client[kRunning] === 0 && client[kPending] > 0 && socket[kSocketUsed]) {
				if (socket[kIdleSocketValidation] === 0) {
					scheduleIdleSocketValidation(client, socket);
					socket[kParser].readMore();
					if (socket.destroyed) return;
					return;
				}
				if (socket[kIdleSocketValidation] === 1) {
					socket[kParser].readMore();
					if (socket.destroyed) return;
					return;
				}
			}
			if (client[kRunning] === 0) {
				socket[kParser].readMore();
				if (socket.destroyed) return;
			}
			if (client[kSize] === 0) {
				if (socket[kParser].timeoutType !== TIMEOUT_KEEP_ALIVE) socket[kParser].setTimeout(client[kKeepAliveTimeoutValue], TIMEOUT_KEEP_ALIVE);
			} else if (client[kRunning] > 0 && socket[kParser].statusCode < 200) {
				if (socket[kParser].timeoutType !== TIMEOUT_HEADERS) {
					const request = client[kQueue][client[kRunningIdx]];
					const headersTimeout = request.headersTimeout != null ? request.headersTimeout : client[kHeadersTimeout];
					socket[kParser].setTimeout(headersTimeout, TIMEOUT_HEADERS);
				}
			}
		}
	}
	function shouldSendContentLength(method) {
		return method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE" && method !== "CONNECT";
	}
	function writeH1(client, request) {
		const { method, path, host, upgrade, blocking, reset } = request;
		let { body, headers, contentLength } = request;
		const expectsPayload = method === "PUT" || method === "POST" || method === "PATCH" || method === "QUERY" || method === "PROPFIND" || method === "PROPPATCH";
		if (util.isFormDataLike(body)) {
			if (!extractBody) extractBody = require_body().extractBody;
			const [bodyStream, contentType] = extractBody(body);
			if (request.contentType == null) headers.push("content-type", contentType);
			body = bodyStream.stream;
			contentLength = bodyStream.length;
		} else if (util.isBlobLike(body) && request.contentType == null) {
			const contentType = body.type;
			if (contentType) {
				const contentTypeValue = `${contentType}`;
				if (!util.isValidHeaderValue(contentTypeValue)) {
					util.errorRequest(client, request, new InvalidArgumentError("invalid content-type header"));
					return false;
				}
				headers.push("content-type", contentTypeValue);
			}
		}
		if (body && typeof body.read === "function") body.read(0);
		const bodyLength = util.bodyLength(body);
		contentLength = bodyLength ?? contentLength;
		if (contentLength === null) contentLength = request.contentLength;
		if (contentLength === 0 && !expectsPayload) contentLength = null;
		if (shouldSendContentLength(method) && contentLength > 0 && request.contentLength !== null && request.contentLength !== contentLength) {
			if (client[kStrictContentLength]) {
				util.errorRequest(client, request, new RequestContentLengthMismatchError());
				return false;
			}
			process.emitWarning(new RequestContentLengthMismatchError());
		}
		const socket = client[kSocket];
		clearIdleSocketValidation(socket);
		/**
		* @param {Error} [error]
		*/
		const abort = (error) => {
			if (request.aborted) return;
			if (request.completed) {
				if (request.upgrade || request.method === "CONNECT") util.destroy(socket, new InformationalError("aborted"));
				return;
			}
			util.errorRequest(client, request, error || new RequestAbortedError());
			util.destroy(body);
			util.destroy(socket, new InformationalError("aborted"));
		};
		try {
			request.onConnect(abort);
		} catch (err) {
			util.errorRequest(client, request, err);
		}
		if (request.aborted) return false;
		if (method === "HEAD") socket[kReset] = true;
		if (upgrade || method === "CONNECT") socket[kReset] = true;
		if (reset != null) socket[kReset] = reset;
		if (client[kMaxRequests] && socket[kCounter]++ >= client[kMaxRequests]) socket[kReset] = true;
		if (blocking) socket[kBlocking] = true;
		let header = `${method} ${path} HTTP/1.1\r\n`;
		if (typeof host === "string") header += `host: ${host}\r\n`;
		else header += client[kHostHeader];
		if (upgrade) header += `connection: upgrade\r\nupgrade: ${upgrade}\r\n`;
		else if (client[kPipelining] && !socket[kReset]) header += "connection: keep-alive\r\n";
		else header += "connection: close\r\n";
		if (Array.isArray(headers)) for (let n = 0; n < headers.length; n += 2) {
			const key = headers[n + 0];
			const val = headers[n + 1];
			if (Array.isArray(val)) for (let i = 0; i < val.length; i++) header += `${key}: ${val[i]}\r\n`;
			else header += `${key}: ${val}\r\n`;
		}
		if (channels.sendHeaders.hasSubscribers) channels.sendHeaders.publish({
			request,
			headers: header,
			socket
		});
		/* istanbul ignore else: assertion */
		if (!body || bodyLength === 0) writeBuffer(abort, null, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isBuffer(body)) writeBuffer(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isBlobLike(body)) {
			if (typeof body.stream === "function") writeIterable(abort, body.stream(), client, request, socket, contentLength, header, expectsPayload);
			else writeBlob(abort, body, client, request, socket, contentLength, header, expectsPayload);
		} else if (util.isStream(body)) writeStream(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isIterable(body)) writeIterable(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else assert$19(false);
		return true;
	}
	function writeStream(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		assert$19(contentLength !== 0 || client[kRunning] === 0, "stream body cannot be pipelined");
		let finished = false;
		const writer = new AsyncWriter({
			abort,
			socket,
			request,
			contentLength,
			client,
			expectsPayload,
			header
		});
		const onData = function(chunk) {
			if (finished) return;
			try {
				if (!writer.write(chunk) && this.pause) this.pause();
			} catch (err) {
				util.destroy(this, err);
			}
		};
		const onDrain = function() {
			if (finished) return;
			if (body.resume) body.resume();
		};
		const onClose = function() {
			queueMicrotask(() => {
				body.removeListener("error", onFinished);
			});
			if (!finished) {
				const err = new RequestAbortedError();
				queueMicrotask(() => onFinished(err));
			}
		};
		const onFinished = function(err) {
			if (finished) return;
			finished = true;
			assert$19(socket.destroyed || socket[kWriting] && client[kRunning] <= 1);
			socket.off("drain", onDrain).off("error", onFinished);
			body.removeListener("data", onData).removeListener("end", onFinished).removeListener("close", onClose);
			if (!err) try {
				writer.end();
			} catch (er) {
				err = er;
			}
			writer.destroy(err);
			if (err && (err.code !== "UND_ERR_INFO" || err.message !== "reset")) util.destroy(body, err);
			else util.destroy(body);
		};
		body.on("data", onData).on("end", onFinished).on("error", onFinished).on("close", onClose);
		if (body.resume) body.resume();
		socket.on("drain", onDrain).on("error", onFinished);
		if (body.errorEmitted ?? body.errored) setImmediate(() => onFinished(body.errored));
		else if (body.endEmitted ?? body.readableEnded) setImmediate(() => onFinished(null));
		if (body.closeEmitted ?? body.closed) setImmediate(onClose);
	}
	function writeBuffer(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		try {
			if (!body) {
				if (contentLength === 0) socket.write(`${header}content-length: 0\r\n\r\n`, "latin1");
				else {
					assert$19(contentLength === null, "no body must not have content length");
					socket.write(`${header}\r\n`, "latin1");
				}
			} else if (util.isBuffer(body)) {
				assert$19(contentLength === body.byteLength, "buffer body must have content length");
				socket.cork();
				socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, "latin1");
				socket.write(body);
				socket.uncork();
				request.onBodySent(body);
				if (!expectsPayload && request.reset !== false) socket[kReset] = true;
			}
			request.onRequestSent();
			client[kResume]();
		} catch (err) {
			abort(err);
		}
	}
	async function writeBlob(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		assert$19(contentLength === body.size, "blob body must have content length");
		try {
			if (contentLength != null && contentLength !== body.size) throw new RequestContentLengthMismatchError();
			const buffer = Buffer.from(await body.arrayBuffer());
			socket.cork();
			socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, "latin1");
			socket.write(buffer);
			socket.uncork();
			request.onBodySent(buffer);
			request.onRequestSent();
			if (!expectsPayload && request.reset !== false) socket[kReset] = true;
			client[kResume]();
		} catch (err) {
			abort(err);
		}
	}
	async function writeIterable(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		assert$19(contentLength !== 0 || client[kRunning] === 0, "iterator body cannot be pipelined");
		let callback = null;
		function onDrain() {
			if (callback) {
				const cb = callback;
				callback = null;
				cb();
			}
		}
		const waitForDrain = () => new Promise((resolve, reject) => {
			assert$19(callback === null);
			if (socket[kError]) reject(socket[kError]);
			else callback = resolve;
		});
		socket.on("close", onDrain).on("drain", onDrain);
		const writer = new AsyncWriter({
			abort,
			socket,
			request,
			contentLength,
			client,
			expectsPayload,
			header
		});
		try {
			for await (const chunk of body) {
				if (socket[kError]) throw socket[kError];
				if (!writer.write(chunk)) await waitForDrain();
			}
			writer.end();
		} catch (err) {
			writer.destroy(err);
		} finally {
			socket.off("close", onDrain).off("drain", onDrain);
		}
	}
	var AsyncWriter = class {
		constructor({ abort, socket, request, contentLength, client, expectsPayload, header }) {
			this.socket = socket;
			this.request = request;
			this.contentLength = contentLength;
			this.client = client;
			this.bytesWritten = 0;
			this.expectsPayload = expectsPayload;
			this.header = header;
			this.abort = abort;
			socket[kWriting] = true;
		}
		write(chunk) {
			const { socket, request, contentLength, client, bytesWritten, expectsPayload, header } = this;
			if (socket[kError]) throw socket[kError];
			if (socket.destroyed) return false;
			const len = Buffer.byteLength(chunk);
			if (!len) return true;
			if (contentLength !== null && bytesWritten + len > contentLength) {
				if (client[kStrictContentLength]) throw new RequestContentLengthMismatchError();
				process.emitWarning(new RequestContentLengthMismatchError());
			}
			socket.cork();
			if (bytesWritten === 0) {
				if (!expectsPayload && request.reset !== false) socket[kReset] = true;
				if (contentLength === null) socket.write(`${header}transfer-encoding: chunked\r\n`, "latin1");
				else socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, "latin1");
			}
			if (contentLength === null) socket.write(`\r\n${len.toString(16)}\r\n`, "latin1");
			this.bytesWritten += len;
			const ret = socket.write(chunk);
			socket.uncork();
			request.onBodySent(chunk);
			if (!ret) {
				if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
					// istanbul ignore else: only for jest
					if (socket[kParser].timeout.refresh) socket[kParser].timeout.refresh();
				}
			}
			return ret;
		}
		end() {
			const { socket, contentLength, client, bytesWritten, expectsPayload, header, request } = this;
			request.onRequestSent();
			socket[kWriting] = false;
			if (socket[kError]) throw socket[kError];
			if (socket.destroyed) return;
			if (bytesWritten === 0) {
				if (expectsPayload) socket.write(`${header}content-length: 0\r\n\r\n`, "latin1");
				else socket.write(`${header}\r\n`, "latin1");
			} else if (contentLength === null) socket.write("\r\n0\r\n\r\n", "latin1");
			if (contentLength !== null && bytesWritten !== contentLength) {
				if (client[kStrictContentLength]) throw new RequestContentLengthMismatchError();
				else process.emitWarning(new RequestContentLengthMismatchError());
			}
			if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
				// istanbul ignore else: only for jest
				if (socket[kParser].timeout.refresh) socket[kParser].timeout.refresh();
			}
			client[kResume]();
		}
		destroy(err) {
			const { socket, client, abort } = this;
			socket[kWriting] = false;
			if (err) {
				assert$19(client[kRunning] <= 1, "pipeline should only contain this request");
				abort(err);
			}
		}
	};
	module.exports = connectH1;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/client-h2.js
var require_client_h2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$18 = __require("node:assert");
	var { errorMonitor } = __require("node:events");
	var { pipeline: pipeline$2 } = __require("node:stream");
	var util = require_util$8();
	var { RequestContentLengthMismatchError, RequestAbortedError, SocketError, InformationalError } = require_errors$1();
	var { kUrl, kReset, kClient, kRunning, kPending, kQueue, kPendingIdx, kRunningIdx, kError, kSocket, kStrictContentLength, kOnError, kMaxConcurrentStreams, kHTTP2Session, kResume, kSize, kHTTPContext } = require_symbols$4();
	var kOpenStreams = Symbol("open streams");
	var extractBody;
	var h2ExperimentalWarned = false;
	/** @type {import('http2')} */
	var http2;
	try {
		http2 = __require("node:http2");
	} catch {
		http2 = { constants: {} };
	}
	var { constants: { HTTP2_HEADER_AUTHORITY, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_SCHEME, HTTP2_HEADER_CONTENT_LENGTH, HTTP2_HEADER_EXPECT, HTTP2_HEADER_STATUS } } = http2;
	function parseH2Headers(headers) {
		const result = [];
		for (const [name, value] of Object.entries(headers)) if (Array.isArray(value)) for (const subvalue of value) result.push(Buffer.from(name), Buffer.from(subvalue));
		else result.push(Buffer.from(name), Buffer.from(value));
		return result;
	}
	/**
	* @param {import('node:http2').IncomingHttpHeaders} headers
	* @returns {Buffer[]}
	*/
	function parseH2ResponseHeaders(headers) {
		const { [HTTP2_HEADER_STATUS]: _statusCode, ...realHeaders } = headers;
		return parseH2Headers(realHeaders);
	}
	async function connectH2(client, socket) {
		client[kSocket] = socket;
		if (!h2ExperimentalWarned) {
			h2ExperimentalWarned = true;
			process.emitWarning("H2 support is experimental, expect them to change at any time.", { code: "UNDICI-H2" });
		}
		const session = http2.connect(client[kUrl], {
			createConnection: () => socket,
			peerMaxConcurrentStreams: client[kMaxConcurrentStreams]
		});
		session[kOpenStreams] = 0;
		session[kClient] = client;
		session[kSocket] = socket;
		util.addListener(session, "error", onHttp2SessionError);
		util.addListener(session, "frameError", onHttp2FrameError);
		util.addListener(session, "end", onHttp2SessionEnd);
		util.addListener(session, "goaway", onHTTP2GoAway);
		util.addListener(session, "close", function() {
			const { [kClient]: client } = this;
			const { [kSocket]: socket } = client;
			const err = this[kSocket][kError] || this[kError] || new SocketError("closed", util.getSocketInfo(socket));
			client[kHTTP2Session] = null;
			if (client.destroyed) {
				assert$18(client[kPending] === 0);
				const requests = client[kQueue].splice(client[kRunningIdx]);
				for (let i = 0; i < requests.length; i++) {
					const request = requests[i];
					util.errorRequest(client, request, err);
				}
			}
		});
		session.unref();
		client[kHTTP2Session] = session;
		socket[kHTTP2Session] = session;
		util.addListener(socket, "error", function(err) {
			assert$18(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
			this[kError] = err;
			this[kClient][kOnError](err);
		});
		util.addListener(socket, "end", function() {
			util.destroy(this, new SocketError("other side closed", util.getSocketInfo(this)));
		});
		util.addListener(socket, "close", function() {
			const err = this[kError] || new SocketError("closed", util.getSocketInfo(this));
			client[kSocket] = null;
			if (this[kHTTP2Session] != null) this[kHTTP2Session].destroy(err);
			client[kPendingIdx] = client[kRunningIdx];
			assert$18(client[kRunning] === 0);
			client.emit("disconnect", client[kUrl], [client], err);
			client[kResume]();
		});
		let closed = false;
		socket.on("close", () => {
			closed = true;
		});
		return {
			version: "h2",
			defaultPipelining: Infinity,
			write(...args) {
				return writeH2(client, ...args);
			},
			resume() {
				resumeH2(client);
			},
			destroy(err, callback) {
				if (closed) queueMicrotask(callback);
				else socket.destroy(err).on("close", callback);
			},
			get destroyed() {
				return socket.destroyed;
			},
			busy() {
				return false;
			}
		};
	}
	function resumeH2(client) {
		const socket = client[kSocket];
		if (socket?.destroyed === false) {
			if (client[kSize] === 0 && client[kMaxConcurrentStreams] === 0) {
				socket.unref();
				client[kHTTP2Session].unref();
			} else {
				socket.ref();
				client[kHTTP2Session].ref();
			}
		}
	}
	function onHttp2SessionError(err) {
		assert$18(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
		this[kSocket][kError] = err;
		this[kClient][kOnError](err);
	}
	function onHttp2FrameError(type, code, id) {
		if (id === 0) {
			const err = new InformationalError(`HTTP/2: "frameError" received - type ${type}, code ${code}`);
			this[kSocket][kError] = err;
			this[kClient][kOnError](err);
		}
	}
	function onHttp2SessionEnd() {
		const err = new SocketError("other side closed", util.getSocketInfo(this[kSocket]));
		this.destroy(err);
		util.destroy(this[kSocket], err);
	}
	/**
	* This is the root cause of #3011
	* We need to handle GOAWAY frames properly, and trigger the session close
	* along with the socket right away
	*/
	function onHTTP2GoAway(code) {
		const err = this[kError] || new SocketError(`HTTP/2: "GOAWAY" frame received with code ${code}`, util.getSocketInfo(this));
		const client = this[kClient];
		client[kSocket] = null;
		client[kHTTPContext] = null;
		if (this[kHTTP2Session] != null) {
			this[kHTTP2Session].destroy(err);
			this[kHTTP2Session] = null;
		}
		util.destroy(this[kSocket], err);
		if (client[kRunningIdx] < client[kQueue].length) {
			const request = client[kQueue][client[kRunningIdx]];
			client[kQueue][client[kRunningIdx]++] = null;
			util.errorRequest(client, request, err);
			client[kPendingIdx] = client[kRunningIdx];
		}
		assert$18(client[kRunning] === 0);
		client.emit("disconnect", client[kUrl], [client], err);
		client[kResume]();
	}
	function shouldSendContentLength(method) {
		return method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE" && method !== "CONNECT";
	}
	function writeH2(client, request) {
		const session = client[kHTTP2Session];
		const { method, path, host, upgrade, expectContinue, signal, headers: reqHeaders } = request;
		let { body } = request;
		if (upgrade) {
			util.errorRequest(client, request, /* @__PURE__ */ new Error("Upgrade not supported for H2"));
			return false;
		}
		const headers = {};
		for (let n = 0; n < reqHeaders.length; n += 2) {
			const key = reqHeaders[n + 0];
			const val = reqHeaders[n + 1];
			if (Array.isArray(val)) for (let i = 0; i < val.length; i++) if (headers[key]) headers[key] += `,${val[i]}`;
			else headers[key] = val[i];
			else headers[key] = val;
		}
		/** @type {import('node:http2').ClientHttp2Stream} */
		let stream;
		const { hostname, port } = client[kUrl];
		headers[HTTP2_HEADER_AUTHORITY] = host || `${hostname}${port ? `:${port}` : ""}`;
		headers[HTTP2_HEADER_METHOD] = method;
		/**
		* @param {Error} [error]
		*/
		const abort = (error) => {
			if (request.aborted) return;
			if (request.completed) {
				if (method === "CONNECT" && stream != null) util.destroy(stream, error || new RequestAbortedError());
				return;
			}
			error = error || new RequestAbortedError();
			util.errorRequest(client, request, error);
			if (stream != null) util.destroy(stream, error);
			util.destroy(body, error);
			client[kQueue][client[kRunningIdx]++] = null;
			client[kResume]();
		};
		try {
			request.onConnect(abort);
		} catch (err) {
			util.errorRequest(client, request, err);
		}
		if (request.aborted) return false;
		if (method === "CONNECT") {
			session.ref();
			stream = session.request(headers, {
				endStream: false,
				signal
			});
			let upgradeResponseFinished = false;
			/**
			* @param {import('node:http2').IncomingHttpHeaders} headers
			*/
			const onResponse = (headers) => {
				upgradeResponseFinished = true;
				stream.off(errorMonitor, onUpgradeError);
				request.onUpgradeResponse(Number(headers[HTTP2_HEADER_STATUS]), headers, parseH2ResponseHeaders);
			};
			/**
			* @param {Error} error
			*/
			const onUpgradeError = (error) => {
				upgradeResponseFinished = true;
				stream.off("response", onResponse);
				request.onUpgradeError(error);
			};
			const onReady = () => {
				try {
					request.onUpgrade(null, null, stream);
				} catch (error) {
					stream.off("response", onResponse);
					abort(error);
					return;
				}
				if (request.aborted) return;
				stream.off("error", abort);
				stream.once(errorMonitor, onUpgradeError);
				client[kQueue][client[kRunningIdx]++] = null;
			};
			stream.once("response", onResponse);
			stream.once("error", abort);
			++session[kOpenStreams];
			onReady();
			stream.once("close", () => {
				if (!upgradeResponseFinished && request.completed) {
					stream.off("response", onResponse);
					stream.off(errorMonitor, onUpgradeError);
					request.onUpgradeError(new InformationalError(`HTTP/2: "stream error" received - code ${stream.rstCode}`));
				}
				session[kOpenStreams] -= 1;
				if (session[kOpenStreams] === 0) session.unref();
			});
			return true;
		}
		headers[HTTP2_HEADER_PATH] = path;
		headers[HTTP2_HEADER_SCHEME] = "https";
		const expectsPayload = method === "PUT" || method === "POST" || method === "PATCH";
		if (body && typeof body.read === "function") body.read(0);
		let contentLength = util.bodyLength(body);
		if (util.isFormDataLike(body)) {
			extractBody ??= require_body().extractBody;
			const [bodyStream, contentType] = extractBody(body);
			headers["content-type"] = contentType;
			body = bodyStream.stream;
			contentLength = bodyStream.length;
		}
		if (contentLength == null) contentLength = request.contentLength;
		if (contentLength === 0 || !expectsPayload) contentLength = null;
		if (shouldSendContentLength(method) && contentLength > 0 && request.contentLength != null && request.contentLength !== contentLength) {
			if (client[kStrictContentLength]) {
				util.errorRequest(client, request, new RequestContentLengthMismatchError());
				return false;
			}
			process.emitWarning(new RequestContentLengthMismatchError());
		}
		if (contentLength != null) {
			assert$18(body, "no body must not have content length");
			headers[HTTP2_HEADER_CONTENT_LENGTH] = `${contentLength}`;
		}
		session.ref();
		const shouldEndStream = method === "GET" || method === "HEAD" || body === null;
		if (expectContinue) {
			headers[HTTP2_HEADER_EXPECT] = "100-continue";
			stream = session.request(headers, {
				endStream: shouldEndStream,
				signal
			});
			stream.once("continue", writeBodyH2);
		} else {
			stream = session.request(headers, {
				endStream: shouldEndStream,
				signal
			});
			writeBodyH2();
		}
		++session[kOpenStreams];
		stream.once("response", (headers) => {
			const { [HTTP2_HEADER_STATUS]: statusCode, ...realHeaders } = headers;
			request.onResponseStarted();
			if (request.aborted) {
				const err = new RequestAbortedError();
				util.errorRequest(client, request, err);
				util.destroy(stream, err);
				return;
			}
			if (request.onHeaders(Number(statusCode), parseH2Headers(realHeaders), stream.resume.bind(stream), "") === false) stream.pause();
			stream.on("data", (chunk) => {
				if (request.onData(chunk) === false) stream.pause();
			});
		});
		stream.once("end", () => {
			if (stream.state?.state == null || stream.state.state < 6) request.onComplete([]);
			if (session[kOpenStreams] === 0) session.unref();
			abort(new InformationalError("HTTP/2: stream half-closed (remote)"));
			client[kQueue][client[kRunningIdx]++] = null;
			client[kPendingIdx] = client[kRunningIdx];
			client[kResume]();
		});
		stream.once("close", () => {
			session[kOpenStreams] -= 1;
			if (session[kOpenStreams] === 0) session.unref();
		});
		stream.once("error", function(err) {
			abort(err);
		});
		stream.once("frameError", (type, code) => {
			abort(new InformationalError(`HTTP/2: "frameError" received - type ${type}, code ${code}`));
		});
		return true;
		function writeBodyH2() {
			/* istanbul ignore else: assertion */
			if (!body || contentLength === 0) writeBuffer(abort, stream, null, client, request, client[kSocket], contentLength, expectsPayload);
			else if (util.isBuffer(body)) writeBuffer(abort, stream, body, client, request, client[kSocket], contentLength, expectsPayload);
			else if (util.isBlobLike(body)) {
				if (typeof body.stream === "function") writeIterable(abort, stream, body.stream(), client, request, client[kSocket], contentLength, expectsPayload);
				else writeBlob(abort, stream, body, client, request, client[kSocket], contentLength, expectsPayload);
			} else if (util.isStream(body)) writeStream(abort, client[kSocket], expectsPayload, stream, body, client, request, contentLength);
			else if (util.isIterable(body)) writeIterable(abort, stream, body, client, request, client[kSocket], contentLength, expectsPayload);
			else assert$18(false);
		}
	}
	function writeBuffer(abort, h2stream, body, client, request, socket, contentLength, expectsPayload) {
		try {
			if (body != null && util.isBuffer(body)) {
				assert$18(contentLength === body.byteLength, "buffer body must have content length");
				h2stream.cork();
				h2stream.write(body);
				h2stream.uncork();
				h2stream.end();
				request.onBodySent(body);
			}
			if (!expectsPayload) socket[kReset] = true;
			request.onRequestSent();
			client[kResume]();
		} catch (error) {
			abort(error);
		}
	}
	function writeStream(abort, socket, expectsPayload, h2stream, body, client, request, contentLength) {
		assert$18(contentLength !== 0 || client[kRunning] === 0, "stream body cannot be pipelined");
		const pipe = pipeline$2(body, h2stream, (err) => {
			if (err) {
				util.destroy(pipe, err);
				abort(err);
			} else {
				util.removeAllListeners(pipe);
				request.onRequestSent();
				if (!expectsPayload) socket[kReset] = true;
				client[kResume]();
			}
		});
		util.addListener(pipe, "data", onPipeData);
		function onPipeData(chunk) {
			request.onBodySent(chunk);
		}
	}
	async function writeBlob(abort, h2stream, body, client, request, socket, contentLength, expectsPayload) {
		assert$18(contentLength === body.size, "blob body must have content length");
		try {
			if (contentLength != null && contentLength !== body.size) throw new RequestContentLengthMismatchError();
			const buffer = Buffer.from(await body.arrayBuffer());
			h2stream.cork();
			h2stream.write(buffer);
			h2stream.uncork();
			h2stream.end();
			request.onBodySent(buffer);
			request.onRequestSent();
			if (!expectsPayload) socket[kReset] = true;
			client[kResume]();
		} catch (err) {
			abort(err);
		}
	}
	async function writeIterable(abort, h2stream, body, client, request, socket, contentLength, expectsPayload) {
		assert$18(contentLength !== 0 || client[kRunning] === 0, "iterator body cannot be pipelined");
		let callback = null;
		function onDrain() {
			if (callback) {
				const cb = callback;
				callback = null;
				cb();
			}
		}
		const waitForDrain = () => new Promise((resolve, reject) => {
			assert$18(callback === null);
			if (socket[kError]) reject(socket[kError]);
			else callback = resolve;
		});
		h2stream.on("close", onDrain).on("drain", onDrain);
		try {
			for await (const chunk of body) {
				if (socket[kError]) throw socket[kError];
				const res = h2stream.write(chunk);
				request.onBodySent(chunk);
				if (!res) await waitForDrain();
			}
			h2stream.end();
			request.onRequestSent();
			if (!expectsPayload) socket[kReset] = true;
			client[kResume]();
		} catch (err) {
			abort(err);
		} finally {
			h2stream.off("close", onDrain).off("drain", onDrain);
		}
	}
	module.exports = connectH2;
}));
//#endregion
//#region node_modules/undici/lib/handler/redirect-handler.js
var require_redirect_handler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util = require_util$8();
	var { kBodyUsed } = require_symbols$4();
	var assert$17 = __require("node:assert");
	var { InvalidArgumentError } = require_errors$1();
	var EE$1 = __require("node:events");
	var redirectableStatusCodes = [
		300,
		301,
		302,
		303,
		307,
		308
	];
	var kBody = Symbol("body");
	var BodyAsyncIterable = class {
		constructor(body) {
			this[kBody] = body;
			this[kBodyUsed] = false;
		}
		async *[Symbol.asyncIterator]() {
			assert$17(!this[kBodyUsed], "disturbed");
			this[kBodyUsed] = true;
			yield* this[kBody];
		}
	};
	var RedirectHandler = class {
		constructor(dispatch, maxRedirections, opts, handler) {
			if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) throw new InvalidArgumentError("maxRedirections must be a positive number");
			util.validateHandler(handler, opts.method, opts.upgrade);
			this.dispatch = dispatch;
			this.location = null;
			this.abort = null;
			this.opts = {
				...opts,
				maxRedirections: 0
			};
			this.maxRedirections = maxRedirections;
			this.handler = handler;
			this.history = [];
			this.redirectionLimitReached = false;
			if (util.isStream(this.opts.body)) {
				if (util.bodyLength(this.opts.body) === 0) this.opts.body.on("data", function() {
					assert$17(false);
				});
				if (typeof this.opts.body.readableDidRead !== "boolean") {
					this.opts.body[kBodyUsed] = false;
					EE$1.prototype.on.call(this.opts.body, "data", function() {
						this[kBodyUsed] = true;
					});
				}
			} else if (this.opts.body && typeof this.opts.body.pipeTo === "function") this.opts.body = new BodyAsyncIterable(this.opts.body);
			else if (this.opts.body && typeof this.opts.body !== "string" && !ArrayBuffer.isView(this.opts.body) && util.isIterable(this.opts.body)) this.opts.body = new BodyAsyncIterable(this.opts.body);
		}
		onConnect(abort) {
			this.abort = abort;
			this.handler.onConnect(abort, { history: this.history });
		}
		onUpgrade(statusCode, headers, socket) {
			this.handler.onUpgrade(statusCode, headers, socket);
		}
		onError(error) {
			this.handler.onError(error);
		}
		onHeaders(statusCode, headers, resume, statusText) {
			this.location = this.history.length >= this.maxRedirections || util.isDisturbed(this.opts.body) ? null : parseLocation(statusCode, headers);
			if (this.opts.throwOnMaxRedirect && this.history.length >= this.maxRedirections) {
				if (this.request) this.request.abort(/* @__PURE__ */ new Error("max redirects"));
				this.redirectionLimitReached = true;
				this.abort(/* @__PURE__ */ new Error("max redirects"));
				return;
			}
			if (this.opts.origin) this.history.push(new URL(this.opts.path, this.opts.origin));
			if (!this.location) return this.handler.onHeaders(statusCode, headers, resume, statusText);
			const { origin, pathname, search } = util.parseURL(new URL(this.location, this.opts.origin && new URL(this.opts.path, this.opts.origin)));
			const path = search ? `${pathname}${search}` : pathname;
			this.opts.headers = cleanRequestHeaders(this.opts.headers, statusCode === 303, this.opts.origin !== origin);
			this.opts.path = path;
			this.opts.origin = origin;
			this.opts.maxRedirections = 0;
			this.opts.query = null;
			if (statusCode === 303 && this.opts.method !== "HEAD") {
				this.opts.method = "GET";
				this.opts.body = null;
			}
		}
		onData(chunk) {
			if (this.location) {} else return this.handler.onData(chunk);
		}
		onComplete(trailers) {
			if (this.location) {
				this.location = null;
				this.abort = null;
				this.dispatch(this.opts, this);
			} else this.handler.onComplete(trailers);
		}
		onBodySent(chunk) {
			if (this.handler.onBodySent) this.handler.onBodySent(chunk);
		}
	};
	function parseLocation(statusCode, headers) {
		if (redirectableStatusCodes.indexOf(statusCode) === -1) return null;
		for (let i = 0; i < headers.length; i += 2) if (headers[i].length === 8 && util.headerNameToString(headers[i]) === "location") return headers[i + 1];
	}
	function shouldRemoveHeader(header, removeContent, unknownOrigin) {
		if (header.length === 4) return util.headerNameToString(header) === "host";
		if (removeContent && util.headerNameToString(header).startsWith("content-")) return true;
		if (unknownOrigin && (header.length === 13 || header.length === 6 || header.length === 19)) {
			const name = util.headerNameToString(header);
			return name === "authorization" || name === "cookie" || name === "proxy-authorization";
		}
		return false;
	}
	function cleanRequestHeaders(headers, removeContent, unknownOrigin) {
		const ret = [];
		if (Array.isArray(headers)) {
			for (let i = 0; i < headers.length; i += 2) if (!shouldRemoveHeader(headers[i], removeContent, unknownOrigin)) ret.push(headers[i], headers[i + 1]);
		} else if (headers && typeof headers === "object") {
			for (const key of Object.keys(headers)) if (!shouldRemoveHeader(key, removeContent, unknownOrigin)) ret.push(key, headers[key]);
		} else assert$17(headers == null, "headers must be an object or an array");
		return ret;
	}
	module.exports = RedirectHandler;
}));
//#endregion
//#region node_modules/undici/lib/interceptor/redirect-interceptor.js
var require_redirect_interceptor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var RedirectHandler = require_redirect_handler();
	function createRedirectInterceptor({ maxRedirections: defaultMaxRedirections }) {
		return (dispatch) => {
			return function Intercept(opts, handler) {
				const { maxRedirections = defaultMaxRedirections } = opts;
				if (!maxRedirections) return dispatch(opts, handler);
				const redirectHandler = new RedirectHandler(dispatch, maxRedirections, opts, handler);
				opts = {
					...opts,
					maxRedirections: 0
				};
				return dispatch(opts, redirectHandler);
			};
		};
	}
	module.exports = createRedirectInterceptor;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/client.js
var require_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$16 = __require("node:assert");
	var net = __require("node:net");
	var http$1 = __require("node:http");
	var util = require_util$8();
	var { channels } = require_diagnostics();
	var Request = require_request$1();
	var DispatcherBase = require_dispatcher_base();
	var { InvalidArgumentError, InformationalError, ClientDestroyedError } = require_errors$1();
	var buildConnector = require_connect();
	var { kUrl, kServerName, kClient, kBusy, kConnect, kResuming, kRunning, kPending, kSize, kQueue, kConnected, kConnecting, kNeedDrain, kKeepAliveDefaultTimeout, kHostHeader, kPendingIdx, kRunningIdx, kError, kPipelining, kKeepAliveTimeoutValue, kMaxHeadersSize, kKeepAliveMaxTimeout, kKeepAliveTimeoutThreshold, kHeadersTimeout, kBodyTimeout, kStrictContentLength, kConnector, kMaxRedirections, kMaxRequests, kCounter, kClose, kDestroy, kDispatch, kInterceptors, kLocalAddress, kMaxResponseSize, kOnError, kHTTPContext, kMaxConcurrentStreams, kResume } = require_symbols$4();
	var connectH1 = require_client_h1();
	var connectH2 = require_client_h2();
	var deprecatedInterceptorWarned = false;
	var kClosedResolve = Symbol("kClosedResolve");
	var noop = () => {};
	function getPipelining(client) {
		return client[kPipelining] ?? client[kHTTPContext]?.defaultPipelining ?? 1;
	}
	/**
	* @type {import('../../types/client.js').default}
	*/
	var Client = class extends DispatcherBase {
		/**
		*
		* @param {string|URL} url
		* @param {import('../../types/client.js').Client.Options} options
		*/
		constructor(url, { interceptors, maxHeaderSize, headersTimeout, socketTimeout, requestTimeout, connectTimeout, bodyTimeout, idleTimeout, keepAlive, keepAliveTimeout, maxKeepAliveTimeout, keepAliveMaxTimeout, keepAliveTimeoutThreshold, socketPath, pipelining, tls, strictContentLength, maxCachedSessions, maxRedirections, connect, maxRequestsPerClient, localAddress, maxResponseSize, autoSelectFamily, autoSelectFamilyAttemptTimeout, maxConcurrentStreams, allowH2, webSocket } = {}) {
			super({ webSocket });
			if (keepAlive !== void 0) throw new InvalidArgumentError("unsupported keepAlive, use pipelining=0 instead");
			if (socketTimeout !== void 0) throw new InvalidArgumentError("unsupported socketTimeout, use headersTimeout & bodyTimeout instead");
			if (requestTimeout !== void 0) throw new InvalidArgumentError("unsupported requestTimeout, use headersTimeout & bodyTimeout instead");
			if (idleTimeout !== void 0) throw new InvalidArgumentError("unsupported idleTimeout, use keepAliveTimeout instead");
			if (maxKeepAliveTimeout !== void 0) throw new InvalidArgumentError("unsupported maxKeepAliveTimeout, use keepAliveMaxTimeout instead");
			if (maxHeaderSize != null && !Number.isFinite(maxHeaderSize)) throw new InvalidArgumentError("invalid maxHeaderSize");
			if (socketPath != null && typeof socketPath !== "string") throw new InvalidArgumentError("invalid socketPath");
			if (connectTimeout != null && (!Number.isFinite(connectTimeout) || connectTimeout < 0)) throw new InvalidArgumentError("invalid connectTimeout");
			if (keepAliveTimeout != null && (!Number.isFinite(keepAliveTimeout) || keepAliveTimeout <= 0)) throw new InvalidArgumentError("invalid keepAliveTimeout");
			if (keepAliveMaxTimeout != null && (!Number.isFinite(keepAliveMaxTimeout) || keepAliveMaxTimeout <= 0)) throw new InvalidArgumentError("invalid keepAliveMaxTimeout");
			if (keepAliveTimeoutThreshold != null && !Number.isFinite(keepAliveTimeoutThreshold)) throw new InvalidArgumentError("invalid keepAliveTimeoutThreshold");
			if (headersTimeout != null && (!Number.isInteger(headersTimeout) || headersTimeout < 0)) throw new InvalidArgumentError("headersTimeout must be a positive integer or zero");
			if (bodyTimeout != null && (!Number.isInteger(bodyTimeout) || bodyTimeout < 0)) throw new InvalidArgumentError("bodyTimeout must be a positive integer or zero");
			if (connect != null && typeof connect !== "function" && typeof connect !== "object") throw new InvalidArgumentError("connect must be a function or an object");
			if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) throw new InvalidArgumentError("maxRedirections must be a positive number");
			if (maxRequestsPerClient != null && (!Number.isInteger(maxRequestsPerClient) || maxRequestsPerClient < 0)) throw new InvalidArgumentError("maxRequestsPerClient must be a positive number");
			if (localAddress != null && (typeof localAddress !== "string" || net.isIP(localAddress) === 0)) throw new InvalidArgumentError("localAddress must be valid string IP address");
			if (maxResponseSize != null && (!Number.isInteger(maxResponseSize) || maxResponseSize < -1)) throw new InvalidArgumentError("maxResponseSize must be a positive number");
			if (autoSelectFamilyAttemptTimeout != null && (!Number.isInteger(autoSelectFamilyAttemptTimeout) || autoSelectFamilyAttemptTimeout < -1)) throw new InvalidArgumentError("autoSelectFamilyAttemptTimeout must be a positive number");
			if (allowH2 != null && typeof allowH2 !== "boolean") throw new InvalidArgumentError("allowH2 must be a valid boolean value");
			if (maxConcurrentStreams != null && (typeof maxConcurrentStreams !== "number" || maxConcurrentStreams < 1)) throw new InvalidArgumentError("maxConcurrentStreams must be a positive integer, greater than 0");
			if (typeof connect !== "function") connect = buildConnector({
				...tls,
				maxCachedSessions,
				allowH2,
				socketPath,
				timeout: connectTimeout,
				...autoSelectFamily ? {
					autoSelectFamily,
					autoSelectFamilyAttemptTimeout
				} : void 0,
				...connect
			});
			if (interceptors?.Client && Array.isArray(interceptors.Client)) {
				this[kInterceptors] = interceptors.Client;
				if (!deprecatedInterceptorWarned) {
					deprecatedInterceptorWarned = true;
					process.emitWarning("Client.Options#interceptor is deprecated. Use Dispatcher#compose instead.", { code: "UNDICI-CLIENT-INTERCEPTOR-DEPRECATED" });
				}
			} else this[kInterceptors] = [createRedirectInterceptor({ maxRedirections })];
			this[kUrl] = util.parseOrigin(url);
			this[kConnector] = connect;
			this[kPipelining] = pipelining != null ? pipelining : 1;
			this[kMaxHeadersSize] = maxHeaderSize || http$1.maxHeaderSize;
			this[kKeepAliveDefaultTimeout] = keepAliveTimeout == null ? 4e3 : keepAliveTimeout;
			this[kKeepAliveMaxTimeout] = keepAliveMaxTimeout == null ? 6e5 : keepAliveMaxTimeout;
			this[kKeepAliveTimeoutThreshold] = keepAliveTimeoutThreshold == null ? 2e3 : keepAliveTimeoutThreshold;
			this[kKeepAliveTimeoutValue] = this[kKeepAliveDefaultTimeout];
			this[kServerName] = null;
			this[kLocalAddress] = localAddress != null ? localAddress : null;
			this[kResuming] = 0;
			this[kNeedDrain] = 0;
			this[kHostHeader] = `host: ${this[kUrl].hostname}${this[kUrl].port ? `:${this[kUrl].port}` : ""}\r\n`;
			this[kBodyTimeout] = bodyTimeout != null ? bodyTimeout : 3e5;
			this[kHeadersTimeout] = headersTimeout != null ? headersTimeout : 3e5;
			this[kStrictContentLength] = strictContentLength == null ? true : strictContentLength;
			this[kMaxRedirections] = maxRedirections;
			this[kMaxRequests] = maxRequestsPerClient;
			this[kClosedResolve] = null;
			this[kMaxResponseSize] = maxResponseSize > -1 ? maxResponseSize : -1;
			this[kMaxConcurrentStreams] = maxConcurrentStreams != null ? maxConcurrentStreams : 100;
			this[kHTTPContext] = null;
			this[kQueue] = [];
			this[kRunningIdx] = 0;
			this[kPendingIdx] = 0;
			this[kResume] = (sync) => resume(this, sync);
			this[kOnError] = (err) => onError(this, err);
		}
		get pipelining() {
			return this[kPipelining];
		}
		set pipelining(value) {
			this[kPipelining] = value;
			this[kResume](true);
		}
		get [kPending]() {
			return this[kQueue].length - this[kPendingIdx];
		}
		get [kRunning]() {
			return this[kPendingIdx] - this[kRunningIdx];
		}
		get [kSize]() {
			return this[kQueue].length - this[kRunningIdx];
		}
		get [kConnected]() {
			return !!this[kHTTPContext] && !this[kConnecting] && !this[kHTTPContext].destroyed;
		}
		get [kBusy]() {
			return Boolean(this[kHTTPContext]?.busy(null) || this[kSize] >= (getPipelining(this) || 1) || this[kPending] > 0);
		}
		/* istanbul ignore: only used for test */
		[kConnect](cb) {
			connect(this);
			this.once("connect", cb);
		}
		[kDispatch](opts, handler) {
			const request = new Request(opts.origin || this[kUrl].origin, opts, handler);
			this[kQueue].push(request);
			if (this[kResuming]) {} else if (util.bodyLength(request.body) == null && util.isIterable(request.body)) {
				this[kResuming] = 1;
				queueMicrotask(() => resume(this));
			} else this[kResume](true);
			if (this[kResuming] && this[kNeedDrain] !== 2 && this[kBusy]) this[kNeedDrain] = 2;
			return this[kNeedDrain] < 2;
		}
		async [kClose]() {
			return new Promise((resolve) => {
				if (this[kSize]) this[kClosedResolve] = resolve;
				else resolve(null);
			});
		}
		async [kDestroy](err) {
			return new Promise((resolve) => {
				const requests = this[kQueue].splice(this[kPendingIdx]);
				for (let i = 0; i < requests.length; i++) {
					const request = requests[i];
					util.errorRequest(this, request, err);
				}
				const callback = () => {
					if (this[kClosedResolve]) {
						this[kClosedResolve]();
						this[kClosedResolve] = null;
					}
					resolve(null);
				};
				if (this[kHTTPContext]) {
					this[kHTTPContext].destroy(err, callback);
					this[kHTTPContext] = null;
				} else queueMicrotask(callback);
				this[kResume]();
			});
		}
	};
	var createRedirectInterceptor = require_redirect_interceptor();
	function onError(client, err) {
		if (client[kRunning] === 0 && err.code !== "UND_ERR_INFO" && err.code !== "UND_ERR_SOCKET") {
			assert$16(client[kPendingIdx] === client[kRunningIdx]);
			const requests = client[kQueue].splice(client[kRunningIdx]);
			for (let i = 0; i < requests.length; i++) {
				const request = requests[i];
				util.errorRequest(client, request, err);
			}
			assert$16(client[kSize] === 0);
		}
	}
	/**
	* @param {Client} client
	* @returns
	*/
	async function connect(client) {
		assert$16(!client[kConnecting]);
		assert$16(!client[kHTTPContext]);
		let { host, hostname, protocol, port } = client[kUrl];
		if (hostname[0] === "[") {
			const idx = hostname.indexOf("]");
			assert$16(idx !== -1);
			const ip = hostname.substring(1, idx);
			assert$16(net.isIP(ip));
			hostname = ip;
		}
		client[kConnecting] = true;
		if (channels.beforeConnect.hasSubscribers) channels.beforeConnect.publish({
			connectParams: {
				host,
				hostname,
				protocol,
				port,
				version: client[kHTTPContext]?.version,
				servername: client[kServerName],
				localAddress: client[kLocalAddress]
			},
			connector: client[kConnector]
		});
		try {
			const socket = await new Promise((resolve, reject) => {
				client[kConnector]({
					host,
					hostname,
					protocol,
					port,
					servername: client[kServerName],
					localAddress: client[kLocalAddress]
				}, (err, socket) => {
					if (err) reject(err);
					else resolve(socket);
				});
			});
			if (client.destroyed) {
				util.destroy(socket.on("error", noop), new ClientDestroyedError());
				return;
			}
			assert$16(socket);
			try {
				client[kHTTPContext] = socket.alpnProtocol === "h2" ? await connectH2(client, socket) : await connectH1(client, socket);
			} catch (err) {
				socket.destroy().on("error", noop);
				throw err;
			}
			client[kConnecting] = false;
			socket[kCounter] = 0;
			socket[kMaxRequests] = client[kMaxRequests];
			socket[kClient] = client;
			socket[kError] = null;
			if (channels.connected.hasSubscribers) channels.connected.publish({
				connectParams: {
					host,
					hostname,
					protocol,
					port,
					version: client[kHTTPContext]?.version,
					servername: client[kServerName],
					localAddress: client[kLocalAddress]
				},
				connector: client[kConnector],
				socket
			});
			client.emit("connect", client[kUrl], [client]);
		} catch (err) {
			if (client.destroyed) return;
			client[kConnecting] = false;
			if (channels.connectError.hasSubscribers) channels.connectError.publish({
				connectParams: {
					host,
					hostname,
					protocol,
					port,
					version: client[kHTTPContext]?.version,
					servername: client[kServerName],
					localAddress: client[kLocalAddress]
				},
				connector: client[kConnector],
				error: err
			});
			if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
				assert$16(client[kRunning] === 0);
				while (client[kPending] > 0 && client[kQueue][client[kPendingIdx]].servername === client[kServerName]) {
					const request = client[kQueue][client[kPendingIdx]++];
					util.errorRequest(client, request, err);
				}
			} else onError(client, err);
			client.emit("connectionError", client[kUrl], [client], err);
		}
		client[kResume]();
	}
	function emitDrain(client) {
		client[kNeedDrain] = 0;
		client.emit("drain", client[kUrl], [client]);
	}
	function resume(client, sync) {
		if (client[kResuming] === 2) return;
		client[kResuming] = 2;
		_resume(client, sync);
		client[kResuming] = 0;
		if (client[kRunningIdx] > 256) {
			client[kQueue].splice(0, client[kRunningIdx]);
			client[kPendingIdx] -= client[kRunningIdx];
			client[kRunningIdx] = 0;
		}
	}
	function _resume(client, sync) {
		while (true) {
			if (client.destroyed) {
				assert$16(client[kPending] === 0);
				return;
			}
			if (client[kClosedResolve] && !client[kSize]) {
				client[kClosedResolve]();
				client[kClosedResolve] = null;
				return;
			}
			if (client[kHTTPContext]) client[kHTTPContext].resume();
			if (client[kBusy]) client[kNeedDrain] = 2;
			else if (client[kNeedDrain] === 2) {
				if (sync) {
					client[kNeedDrain] = 1;
					queueMicrotask(() => emitDrain(client));
				} else emitDrain(client);
				continue;
			}
			if (client[kPending] === 0) return;
			if (client[kRunning] >= (getPipelining(client) || 1)) return;
			const request = client[kQueue][client[kPendingIdx]];
			if (client[kUrl].protocol === "https:" && client[kServerName] !== request.servername) {
				if (client[kRunning] > 0) return;
				client[kServerName] = request.servername;
				client[kHTTPContext]?.destroy(new InformationalError("servername changed"), () => {
					client[kHTTPContext] = null;
					resume(client);
				});
			}
			if (client[kConnecting]) return;
			if (!client[kHTTPContext]) {
				connect(client);
				return;
			}
			if (client[kHTTPContext].destroyed) return;
			if (client[kHTTPContext].busy(request)) return;
			if (!request.aborted && client[kHTTPContext].write(request)) client[kPendingIdx]++;
			else client[kQueue].splice(client[kPendingIdx], 1);
		}
	}
	module.exports = Client;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/fixed-queue.js
var require_fixed_queue = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var kSize = 2048;
	var kMask = 2047;
	var FixedCircularBuffer = class {
		constructor() {
			this.bottom = 0;
			this.top = 0;
			this.list = new Array(kSize);
			this.next = null;
		}
		isEmpty() {
			return this.top === this.bottom;
		}
		isFull() {
			return (this.top + 1 & kMask) === this.bottom;
		}
		push(data) {
			this.list[this.top] = data;
			this.top = this.top + 1 & kMask;
		}
		shift() {
			const nextItem = this.list[this.bottom];
			if (nextItem === void 0) return null;
			this.list[this.bottom] = void 0;
			this.bottom = this.bottom + 1 & kMask;
			return nextItem;
		}
	};
	module.exports = class FixedQueue {
		constructor() {
			this.head = this.tail = new FixedCircularBuffer();
		}
		isEmpty() {
			return this.head.isEmpty();
		}
		push(data) {
			if (this.head.isFull()) this.head = this.head.next = new FixedCircularBuffer();
			this.head.push(data);
		}
		shift() {
			const tail = this.tail;
			const next = tail.shift();
			if (tail.isEmpty() && tail.next !== null) this.tail = tail.next;
			return next;
		}
	};
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/pool-stats.js
var require_pool_stats = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kFree, kConnected, kPending, kQueued, kRunning, kSize } = require_symbols$4();
	var kPool = Symbol("pool");
	var PoolStats = class {
		constructor(pool) {
			this[kPool] = pool;
		}
		get connected() {
			return this[kPool][kConnected];
		}
		get free() {
			return this[kPool][kFree];
		}
		get pending() {
			return this[kPool][kPending];
		}
		get queued() {
			return this[kPool][kQueued];
		}
		get running() {
			return this[kPool][kRunning];
		}
		get size() {
			return this[kPool][kSize];
		}
	};
	module.exports = PoolStats;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/pool-base.js
var require_pool_base = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DispatcherBase = require_dispatcher_base();
	var FixedQueue = require_fixed_queue();
	var { kConnected, kSize, kRunning, kPending, kQueued, kBusy, kFree, kUrl, kClose, kDestroy, kDispatch } = require_symbols$4();
	var PoolStats = require_pool_stats();
	var kClients = Symbol("clients");
	var kNeedDrain = Symbol("needDrain");
	var kQueue = Symbol("queue");
	var kClosedResolve = Symbol("closed resolve");
	var kOnDrain = Symbol("onDrain");
	var kOnConnect = Symbol("onConnect");
	var kOnDisconnect = Symbol("onDisconnect");
	var kOnConnectionError = Symbol("onConnectionError");
	var kGetDispatcher = Symbol("get dispatcher");
	var kAddClient = Symbol("add client");
	var kRemoveClient = Symbol("remove client");
	var kStats = Symbol("stats");
	var PoolBase = class extends DispatcherBase {
		constructor(opts) {
			super(opts);
			this[kQueue] = new FixedQueue();
			this[kClients] = [];
			this[kQueued] = 0;
			const pool = this;
			this[kOnDrain] = function onDrain(origin, targets) {
				const queue = pool[kQueue];
				let needDrain = false;
				while (!needDrain) {
					const item = queue.shift();
					if (!item) break;
					pool[kQueued]--;
					needDrain = !this.dispatch(item.opts, item.handler);
				}
				this[kNeedDrain] = needDrain;
				if (!this[kNeedDrain] && pool[kNeedDrain]) {
					pool[kNeedDrain] = false;
					pool.emit("drain", origin, [pool, ...targets]);
				}
				if (pool[kClosedResolve] && queue.isEmpty()) Promise.all(pool[kClients].map((c) => c.close())).then(pool[kClosedResolve]);
			};
			this[kOnConnect] = (origin, targets) => {
				pool.emit("connect", origin, [pool, ...targets]);
			};
			this[kOnDisconnect] = (origin, targets, err) => {
				pool.emit("disconnect", origin, [pool, ...targets], err);
			};
			this[kOnConnectionError] = (origin, targets, err) => {
				pool.emit("connectionError", origin, [pool, ...targets], err);
			};
			this[kStats] = new PoolStats(this);
		}
		get [kBusy]() {
			return this[kNeedDrain];
		}
		get [kConnected]() {
			return this[kClients].filter((client) => client[kConnected]).length;
		}
		get [kFree]() {
			return this[kClients].filter((client) => client[kConnected] && !client[kNeedDrain]).length;
		}
		get [kPending]() {
			let ret = this[kQueued];
			for (const { [kPending]: pending } of this[kClients]) ret += pending;
			return ret;
		}
		get [kRunning]() {
			let ret = 0;
			for (const { [kRunning]: running } of this[kClients]) ret += running;
			return ret;
		}
		get [kSize]() {
			let ret = this[kQueued];
			for (const { [kSize]: size } of this[kClients]) ret += size;
			return ret;
		}
		get stats() {
			return this[kStats];
		}
		async [kClose]() {
			if (this[kQueue].isEmpty()) await Promise.all(this[kClients].map((c) => c.close()));
			else await new Promise((resolve) => {
				this[kClosedResolve] = resolve;
			});
		}
		async [kDestroy](err) {
			while (true) {
				const item = this[kQueue].shift();
				if (!item) break;
				item.handler.onError(err);
			}
			await Promise.all(this[kClients].map((c) => c.destroy(err)));
		}
		[kDispatch](opts, handler) {
			const dispatcher = this[kGetDispatcher]();
			if (!dispatcher) {
				this[kNeedDrain] = true;
				this[kQueue].push({
					opts,
					handler
				});
				this[kQueued]++;
			} else if (!dispatcher.dispatch(opts, handler)) {
				dispatcher[kNeedDrain] = true;
				this[kNeedDrain] = !this[kGetDispatcher]();
			}
			return !this[kNeedDrain];
		}
		[kAddClient](client) {
			client.on("drain", this[kOnDrain]).on("connect", this[kOnConnect]).on("disconnect", this[kOnDisconnect]).on("connectionError", this[kOnConnectionError]);
			this[kClients].push(client);
			if (this[kNeedDrain]) queueMicrotask(() => {
				if (this[kNeedDrain]) this[kOnDrain](client[kUrl], [this, client]);
			});
			return this;
		}
		[kRemoveClient](client) {
			client.close(() => {
				const idx = this[kClients].indexOf(client);
				if (idx !== -1) this[kClients].splice(idx, 1);
			});
			this[kNeedDrain] = this[kClients].some((dispatcher) => !dispatcher[kNeedDrain] && dispatcher.closed !== true && dispatcher.destroyed !== true);
		}
	};
	module.exports = {
		PoolBase,
		kClients,
		kNeedDrain,
		kAddClient,
		kRemoveClient,
		kGetDispatcher
	};
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/pool.js
var require_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { PoolBase, kClients, kNeedDrain, kAddClient, kGetDispatcher } = require_pool_base();
	var Client = require_client();
	var { InvalidArgumentError } = require_errors$1();
	var util = require_util$8();
	var { kUrl, kInterceptors } = require_symbols$4();
	var buildConnector = require_connect();
	var kOptions = Symbol("options");
	var kConnections = Symbol("connections");
	var kFactory = Symbol("factory");
	function defaultFactory(origin, opts) {
		return new Client(origin, opts);
	}
	var Pool = class extends PoolBase {
		constructor(origin, { connections, factory = defaultFactory, connect, connectTimeout, tls, maxCachedSessions, socketPath, autoSelectFamily, autoSelectFamilyAttemptTimeout, allowH2, ...options } = {}) {
			if (connections != null && (!Number.isFinite(connections) || connections < 0)) throw new InvalidArgumentError("invalid connections");
			if (typeof factory !== "function") throw new InvalidArgumentError("factory must be a function.");
			if (connect != null && typeof connect !== "function" && typeof connect !== "object") throw new InvalidArgumentError("connect must be a function or an object");
			if (typeof connect !== "function") connect = buildConnector({
				...tls,
				maxCachedSessions,
				allowH2,
				socketPath,
				timeout: connectTimeout,
				...autoSelectFamily ? {
					autoSelectFamily,
					autoSelectFamilyAttemptTimeout
				} : void 0,
				...connect
			});
			super(options);
			this[kInterceptors] = options.interceptors?.Pool && Array.isArray(options.interceptors.Pool) ? options.interceptors.Pool : [];
			this[kConnections] = connections || null;
			this[kUrl] = util.parseOrigin(origin);
			this[kOptions] = {
				...util.deepClone(options),
				connect,
				allowH2
			};
			this[kOptions].interceptors = options.interceptors ? { ...options.interceptors } : void 0;
			this[kFactory] = factory;
			this.on("connectionError", (origin, targets, error) => {
				for (const target of targets) {
					const idx = this[kClients].indexOf(target);
					if (idx !== -1) this[kClients].splice(idx, 1);
				}
			});
		}
		[kGetDispatcher]() {
			for (const client of this[kClients]) if (!client[kNeedDrain]) return client;
			if (!this[kConnections] || this[kClients].length < this[kConnections]) {
				const dispatcher = this[kFactory](this[kUrl], this[kOptions]);
				this[kAddClient](dispatcher);
				return dispatcher;
			}
		}
	};
	module.exports = Pool;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/balanced-pool.js
var require_balanced_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { BalancedPoolMissingUpstreamError, InvalidArgumentError } = require_errors$1();
	var { PoolBase, kClients, kNeedDrain, kAddClient, kRemoveClient, kGetDispatcher } = require_pool_base();
	var Pool = require_pool();
	var { kUrl, kInterceptors } = require_symbols$4();
	var { parseOrigin } = require_util$8();
	var kFactory = Symbol("factory");
	var kOptions = Symbol("options");
	var kGreatestCommonDivisor = Symbol("kGreatestCommonDivisor");
	var kCurrentWeight = Symbol("kCurrentWeight");
	var kIndex = Symbol("kIndex");
	var kWeight = Symbol("kWeight");
	var kMaxWeightPerServer = Symbol("kMaxWeightPerServer");
	var kErrorPenalty = Symbol("kErrorPenalty");
	/**
	* Calculate the greatest common divisor of two numbers by
	* using the Euclidean algorithm.
	*
	* @param {number} a
	* @param {number} b
	* @returns {number}
	*/
	function getGreatestCommonDivisor(a, b) {
		if (a === 0) return b;
		while (b !== 0) {
			const t = b;
			b = a % b;
			a = t;
		}
		return a;
	}
	function defaultFactory(origin, opts) {
		return new Pool(origin, opts);
	}
	var BalancedPool = class extends PoolBase {
		constructor(upstreams = [], { factory = defaultFactory, ...opts } = {}) {
			super();
			this[kOptions] = opts;
			this[kIndex] = -1;
			this[kCurrentWeight] = 0;
			this[kMaxWeightPerServer] = this[kOptions].maxWeightPerServer || 100;
			this[kErrorPenalty] = this[kOptions].errorPenalty || 15;
			if (!Array.isArray(upstreams)) upstreams = [upstreams];
			if (typeof factory !== "function") throw new InvalidArgumentError("factory must be a function.");
			this[kInterceptors] = opts.interceptors?.BalancedPool && Array.isArray(opts.interceptors.BalancedPool) ? opts.interceptors.BalancedPool : [];
			this[kFactory] = factory;
			for (const upstream of upstreams) this.addUpstream(upstream);
			this._updateBalancedPoolStats();
		}
		addUpstream(upstream) {
			const upstreamOrigin = parseOrigin(upstream).origin;
			if (this[kClients].find((pool) => pool[kUrl].origin === upstreamOrigin && pool.closed !== true && pool.destroyed !== true)) return this;
			const pool = this[kFactory](upstreamOrigin, Object.assign({}, this[kOptions]));
			this[kAddClient](pool);
			pool.on("connect", () => {
				pool[kWeight] = Math.min(this[kMaxWeightPerServer], pool[kWeight] + this[kErrorPenalty]);
			});
			pool.on("connectionError", () => {
				pool[kWeight] = Math.max(1, pool[kWeight] - this[kErrorPenalty]);
				this._updateBalancedPoolStats();
			});
			pool.on("disconnect", (...args) => {
				const err = args[2];
				if (err && err.code === "UND_ERR_SOCKET") {
					pool[kWeight] = Math.max(1, pool[kWeight] - this[kErrorPenalty]);
					this._updateBalancedPoolStats();
				}
			});
			for (const client of this[kClients]) client[kWeight] = this[kMaxWeightPerServer];
			this._updateBalancedPoolStats();
			return this;
		}
		_updateBalancedPoolStats() {
			let result = 0;
			for (let i = 0; i < this[kClients].length; i++) result = getGreatestCommonDivisor(this[kClients][i][kWeight], result);
			this[kGreatestCommonDivisor] = result;
		}
		removeUpstream(upstream) {
			const upstreamOrigin = parseOrigin(upstream).origin;
			const pool = this[kClients].find((pool) => pool[kUrl].origin === upstreamOrigin && pool.closed !== true && pool.destroyed !== true);
			if (pool) this[kRemoveClient](pool);
			return this;
		}
		get upstreams() {
			return this[kClients].filter((dispatcher) => dispatcher.closed !== true && dispatcher.destroyed !== true).map((p) => p[kUrl].origin);
		}
		[kGetDispatcher]() {
			if (this[kClients].length === 0) throw new BalancedPoolMissingUpstreamError();
			if (!this[kClients].find((dispatcher) => !dispatcher[kNeedDrain] && dispatcher.closed !== true && dispatcher.destroyed !== true)) return;
			if (this[kClients].map((pool) => pool[kNeedDrain]).reduce((a, b) => a && b, true)) return;
			let counter = 0;
			let maxWeightIndex = this[kClients].findIndex((pool) => !pool[kNeedDrain]);
			while (counter++ < this[kClients].length) {
				this[kIndex] = (this[kIndex] + 1) % this[kClients].length;
				const pool = this[kClients][this[kIndex]];
				if (pool[kWeight] > this[kClients][maxWeightIndex][kWeight] && !pool[kNeedDrain]) maxWeightIndex = this[kIndex];
				if (this[kIndex] === 0) {
					this[kCurrentWeight] = this[kCurrentWeight] - this[kGreatestCommonDivisor];
					if (this[kCurrentWeight] <= 0) this[kCurrentWeight] = this[kMaxWeightPerServer];
				}
				if (pool[kWeight] >= this[kCurrentWeight] && !pool[kNeedDrain]) return pool;
			}
			this[kCurrentWeight] = this[kClients][maxWeightIndex][kWeight];
			this[kIndex] = maxWeightIndex;
			return this[kClients][maxWeightIndex];
		}
	};
	module.exports = BalancedPool;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/agent.js
var require_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { InvalidArgumentError } = require_errors$1();
	var { kClients, kRunning, kClose, kDestroy, kDispatch, kInterceptors } = require_symbols$4();
	var DispatcherBase = require_dispatcher_base();
	var Pool = require_pool();
	var Client = require_client();
	var util = require_util$8();
	var createRedirectInterceptor = require_redirect_interceptor();
	var kOnConnect = Symbol("onConnect");
	var kOnDisconnect = Symbol("onDisconnect");
	var kOnConnectionError = Symbol("onConnectionError");
	var kMaxRedirections = Symbol("maxRedirections");
	var kOnDrain = Symbol("onDrain");
	var kFactory = Symbol("factory");
	var kOptions = Symbol("options");
	function defaultFactory(origin, opts) {
		return opts && opts.connections === 1 ? new Client(origin, opts) : new Pool(origin, opts);
	}
	var Agent = class extends DispatcherBase {
		constructor({ factory = defaultFactory, maxRedirections = 0, connect, ...options } = {}) {
			if (typeof factory !== "function") throw new InvalidArgumentError("factory must be a function.");
			if (connect != null && typeof connect !== "function" && typeof connect !== "object") throw new InvalidArgumentError("connect must be a function or an object");
			if (!Number.isInteger(maxRedirections) || maxRedirections < 0) throw new InvalidArgumentError("maxRedirections must be a positive number");
			super(options);
			if (connect && typeof connect !== "function") connect = { ...connect };
			this[kInterceptors] = options.interceptors?.Agent && Array.isArray(options.interceptors.Agent) ? options.interceptors.Agent : [createRedirectInterceptor({ maxRedirections })];
			this[kOptions] = {
				...util.deepClone(options),
				connect
			};
			this[kOptions].interceptors = options.interceptors ? { ...options.interceptors } : void 0;
			this[kMaxRedirections] = maxRedirections;
			this[kFactory] = factory;
			this[kClients] = /* @__PURE__ */ new Map();
			this[kOnDrain] = (origin, targets) => {
				this.emit("drain", origin, [this, ...targets]);
			};
			this[kOnConnect] = (origin, targets) => {
				this.emit("connect", origin, [this, ...targets]);
			};
			this[kOnDisconnect] = (origin, targets, err) => {
				this.emit("disconnect", origin, [this, ...targets], err);
			};
			this[kOnConnectionError] = (origin, targets, err) => {
				this.emit("connectionError", origin, [this, ...targets], err);
			};
		}
		get [kRunning]() {
			let ret = 0;
			for (const client of this[kClients].values()) ret += client[kRunning];
			return ret;
		}
		[kDispatch](opts, handler) {
			let key;
			if (opts.origin && (typeof opts.origin === "string" || opts.origin instanceof URL)) key = String(opts.origin);
			else throw new InvalidArgumentError("opts.origin must be a non-empty string or URL.");
			let dispatcher = this[kClients].get(key);
			if (!dispatcher) {
				dispatcher = this[kFactory](opts.origin, this[kOptions]).on("drain", this[kOnDrain]).on("connect", this[kOnConnect]).on("disconnect", this[kOnDisconnect]).on("connectionError", this[kOnConnectionError]);
				this[kClients].set(key, dispatcher);
			}
			return dispatcher.dispatch(opts, handler);
		}
		async [kClose]() {
			const closePromises = [];
			for (const client of this[kClients].values()) closePromises.push(client.close());
			this[kClients].clear();
			await Promise.all(closePromises);
		}
		async [kDestroy](err) {
			const destroyPromises = [];
			for (const client of this[kClients].values()) destroyPromises.push(client.destroy(err));
			this[kClients].clear();
			await Promise.all(destroyPromises);
		}
	};
	module.exports = Agent;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/proxy-agent.js
var require_proxy_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kProxy, kClose, kDestroy, kDispatch, kInterceptors } = require_symbols$4();
	var { URL: URL$1 } = __require("node:url");
	var Agent = require_agent();
	var Pool = require_pool();
	var DispatcherBase = require_dispatcher_base();
	var { InvalidArgumentError, RequestAbortedError, SecureProxyConnectionError } = require_errors$1();
	var buildConnector = require_connect();
	var Client = require_client();
	var kAgent = Symbol("proxy agent");
	var kClient = Symbol("proxy client");
	var kProxyHeaders = Symbol("proxy headers");
	var kRequestTls = Symbol("request tls settings");
	var kProxyTls = Symbol("proxy tls settings");
	var kConnectEndpoint = Symbol("connect endpoint function");
	var kTunnelProxy = Symbol("tunnel proxy");
	function defaultProtocolPort(protocol) {
		return protocol === "https:" ? 443 : 80;
	}
	function defaultFactory(origin, opts) {
		return new Pool(origin, opts);
	}
	var noop = () => {};
	function defaultAgentFactory(origin, opts) {
		if (opts.connections === 1) return new Client(origin, opts);
		return new Pool(origin, opts);
	}
	var Http1ProxyWrapper = class extends DispatcherBase {
		#client;
		constructor(proxyUrl, { headers = {}, connect, factory }) {
			super();
			if (!proxyUrl) throw new InvalidArgumentError("Proxy URL is mandatory");
			this[kProxyHeaders] = headers;
			if (factory) this.#client = factory(proxyUrl, { connect });
			else this.#client = new Client(proxyUrl, { connect });
		}
		[kDispatch](opts, handler) {
			const onHeaders = handler.onHeaders;
			handler.onHeaders = function(statusCode, data, resume) {
				if (statusCode === 407) {
					if (typeof handler.onError === "function") handler.onError(new InvalidArgumentError("Proxy Authentication Required (407)"));
					return;
				}
				if (onHeaders) onHeaders.call(this, statusCode, data, resume);
			};
			const { origin, path = "/", headers = {} } = opts;
			opts.path = origin + path;
			if (!("host" in headers) && !("Host" in headers)) {
				const { host } = new URL$1(origin);
				headers.host = host;
			}
			opts.headers = {
				...this[kProxyHeaders],
				...headers
			};
			return this.#client[kDispatch](opts, handler);
		}
		async [kClose]() {
			return this.#client.close();
		}
		async [kDestroy](err) {
			return this.#client.destroy(err);
		}
	};
	var ProxyAgent = class extends DispatcherBase {
		constructor(opts) {
			super();
			if (!opts || typeof opts === "object" && !(opts instanceof URL$1) && !opts.uri) throw new InvalidArgumentError("Proxy uri is mandatory");
			const { clientFactory = defaultFactory } = opts;
			if (typeof clientFactory !== "function") throw new InvalidArgumentError("Proxy opts.clientFactory must be a function.");
			const { proxyTunnel = true } = opts;
			const url = this.#getUrl(opts);
			const { href, origin, port, protocol, username, password, hostname: proxyHostname } = url;
			this[kProxy] = {
				uri: href,
				protocol
			};
			this[kInterceptors] = opts.interceptors?.ProxyAgent && Array.isArray(opts.interceptors.ProxyAgent) ? opts.interceptors.ProxyAgent : [];
			this[kRequestTls] = opts.requestTls;
			this[kProxyTls] = opts.proxyTls;
			this[kProxyHeaders] = opts.headers || {};
			this[kTunnelProxy] = proxyTunnel;
			if (opts.auth && opts.token) throw new InvalidArgumentError("opts.auth cannot be used in combination with opts.token");
			else if (opts.auth) this[kProxyHeaders]["proxy-authorization"] = `Basic ${opts.auth}`;
			else if (opts.token) this[kProxyHeaders]["proxy-authorization"] = opts.token;
			else if (username && password) this[kProxyHeaders]["proxy-authorization"] = `Basic ${Buffer.from(`${decodeURIComponent(username)}:${decodeURIComponent(password)}`).toString("base64")}`;
			const connect = buildConnector({ ...opts.proxyTls });
			this[kConnectEndpoint] = buildConnector({ ...opts.requestTls });
			const agentFactory = opts.factory || defaultAgentFactory;
			const factory = (origin, options) => {
				const { protocol } = new URL$1(origin);
				if (!this[kTunnelProxy] && protocol === "http:" && this[kProxy].protocol === "http:") return new Http1ProxyWrapper(this[kProxy].uri, {
					headers: this[kProxyHeaders],
					connect,
					factory: agentFactory
				});
				return agentFactory(origin, options);
			};
			this[kClient] = clientFactory(url, { connect });
			this[kAgent] = new Agent({
				...opts,
				factory,
				connect: async (opts, callback) => {
					let requestedPath = opts.host;
					if (!opts.port) requestedPath += `:${defaultProtocolPort(opts.protocol)}`;
					try {
						const { socket, statusCode } = await this[kClient].connect({
							origin,
							port,
							path: requestedPath,
							signal: opts.signal,
							headers: {
								...this[kProxyHeaders],
								host: opts.host
							},
							servername: this[kProxyTls]?.servername || proxyHostname
						});
						if (statusCode !== 200) {
							socket.on("error", noop).destroy();
							callback(new RequestAbortedError(`Proxy response (${statusCode}) !== 200 when HTTP Tunneling`));
						}
						if (opts.protocol !== "https:") {
							callback(null, socket);
							return;
						}
						let servername;
						if (this[kRequestTls]) servername = this[kRequestTls].servername;
						else servername = opts.servername;
						this[kConnectEndpoint]({
							...opts,
							servername,
							httpSocket: socket
						}, callback);
					} catch (err) {
						if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") callback(new SecureProxyConnectionError(err));
						else callback(err);
					}
				}
			});
		}
		dispatch(opts, handler) {
			const headers = buildHeaders(opts.headers);
			throwIfProxyAuthIsSent(headers);
			if (headers && !("host" in headers) && !("Host" in headers)) {
				const { host } = new URL$1(opts.origin);
				headers.host = host;
			}
			return this[kAgent].dispatch({
				...opts,
				headers
			}, handler);
		}
		/**
		* @param {import('../types/proxy-agent').ProxyAgent.Options | string | URL} opts
		* @returns {URL}
		*/
		#getUrl(opts) {
			if (typeof opts === "string") return new URL$1(opts);
			else if (opts instanceof URL$1) return opts;
			else return new URL$1(opts.uri);
		}
		async [kClose]() {
			await this[kAgent].close();
			await this[kClient].close();
		}
		async [kDestroy]() {
			await this[kAgent].destroy();
			await this[kClient].destroy();
		}
	};
	/**
	* @param {string[] | Record<string, string>} headers
	* @returns {Record<string, string>}
	*/
	function buildHeaders(headers) {
		if (Array.isArray(headers)) {
			/** @type {Record<string, string>} */
			const headersPair = {};
			for (let i = 0; i < headers.length; i += 2) headersPair[headers[i]] = headers[i + 1];
			return headersPair;
		}
		return headers;
	}
	/**
	* @param {Record<string, string>} headers
	*
	* Previous versions of ProxyAgent suggests the Proxy-Authorization in request headers
	* Nevertheless, it was changed and to avoid a security vulnerability by end users
	* this check was created.
	* It should be removed in the next major version for performance reasons
	*/
	function throwIfProxyAuthIsSent(headers) {
		if (headers && Object.keys(headers).find((key) => key.toLowerCase() === "proxy-authorization")) throw new InvalidArgumentError("Proxy-Authorization should be sent in ProxyAgent constructor");
	}
	module.exports = ProxyAgent;
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/env-http-proxy-agent.js
var require_env_http_proxy_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DispatcherBase = require_dispatcher_base();
	var { kClose, kDestroy, kClosed, kDestroyed, kDispatch, kNoProxyAgent, kHttpProxyAgent, kHttpsProxyAgent } = require_symbols$4();
	var ProxyAgent = require_proxy_agent();
	var Agent = require_agent();
	var DEFAULT_PORTS = {
		"http:": 80,
		"https:": 443
	};
	var experimentalWarned = false;
	var EnvHttpProxyAgent = class extends DispatcherBase {
		#noProxyValue = null;
		#noProxyEntries = null;
		#opts = null;
		constructor(opts = {}) {
			super();
			this.#opts = opts;
			if (!experimentalWarned) {
				experimentalWarned = true;
				process.emitWarning("EnvHttpProxyAgent is experimental, expect them to change at any time.", { code: "UNDICI-EHPA" });
			}
			const { httpProxy, httpsProxy, noProxy, ...agentOpts } = opts;
			this[kNoProxyAgent] = new Agent(agentOpts);
			const HTTP_PROXY = httpProxy ?? process.env.http_proxy ?? process.env.HTTP_PROXY;
			if (HTTP_PROXY) this[kHttpProxyAgent] = new ProxyAgent({
				...agentOpts,
				uri: HTTP_PROXY
			});
			else this[kHttpProxyAgent] = this[kNoProxyAgent];
			const HTTPS_PROXY = httpsProxy ?? process.env.https_proxy ?? process.env.HTTPS_PROXY;
			if (HTTPS_PROXY) this[kHttpsProxyAgent] = new ProxyAgent({
				...agentOpts,
				uri: HTTPS_PROXY
			});
			else this[kHttpsProxyAgent] = this[kHttpProxyAgent];
			this.#parseNoProxy();
		}
		[kDispatch](opts, handler) {
			const url = new URL(opts.origin);
			return this.#getProxyAgentForUrl(url).dispatch(opts, handler);
		}
		async [kClose]() {
			await this[kNoProxyAgent].close();
			if (!this[kHttpProxyAgent][kClosed]) await this[kHttpProxyAgent].close();
			if (!this[kHttpsProxyAgent][kClosed]) await this[kHttpsProxyAgent].close();
		}
		async [kDestroy](err) {
			await this[kNoProxyAgent].destroy(err);
			if (!this[kHttpProxyAgent][kDestroyed]) await this[kHttpProxyAgent].destroy(err);
			if (!this[kHttpsProxyAgent][kDestroyed]) await this[kHttpsProxyAgent].destroy(err);
		}
		#getProxyAgentForUrl(url) {
			let { protocol, host: hostname, port } = url;
			hostname = hostname.replace(/:\d*$/, "").toLowerCase();
			port = Number.parseInt(port, 10) || DEFAULT_PORTS[protocol] || 0;
			if (!this.#shouldProxy(hostname, port)) return this[kNoProxyAgent];
			if (protocol === "https:") return this[kHttpsProxyAgent];
			return this[kHttpProxyAgent];
		}
		#shouldProxy(hostname, port) {
			if (this.#noProxyChanged) this.#parseNoProxy();
			if (this.#noProxyEntries.length === 0) return true;
			if (this.#noProxyValue === "*") return false;
			for (let i = 0; i < this.#noProxyEntries.length; i++) {
				const entry = this.#noProxyEntries[i];
				if (entry.port && entry.port !== port) continue;
				if (!/^[.*]/.test(entry.hostname)) {
					if (hostname === entry.hostname) return false;
				} else if (hostname.endsWith(entry.hostname.replace(/^\*/, ""))) return false;
			}
			return true;
		}
		#parseNoProxy() {
			const noProxyValue = this.#opts.noProxy ?? this.#noProxyEnv;
			const noProxySplit = noProxyValue.split(/[,\s]/);
			const noProxyEntries = [];
			for (let i = 0; i < noProxySplit.length; i++) {
				const entry = noProxySplit[i];
				if (!entry) continue;
				const parsed = entry.match(/^(.+):(\d+)$/);
				noProxyEntries.push({
					hostname: (parsed ? parsed[1] : entry).toLowerCase(),
					port: parsed ? Number.parseInt(parsed[2], 10) : 0
				});
			}
			this.#noProxyValue = noProxyValue;
			this.#noProxyEntries = noProxyEntries;
		}
		get #noProxyChanged() {
			if (this.#opts.noProxy !== void 0) return false;
			return this.#noProxyValue !== this.#noProxyEnv;
		}
		get #noProxyEnv() {
			return process.env.no_proxy ?? process.env.NO_PROXY ?? "";
		}
	};
	module.exports = EnvHttpProxyAgent;
}));
//#endregion
//#region node_modules/undici/lib/handler/retry-handler.js
var require_retry_handler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$15 = __require("node:assert");
	var { kRetryHandlerDefaultRetry } = require_symbols$4();
	var { RequestRetryError } = require_errors$1();
	var { isDisturbed, parseHeaders, parseRangeHeader, wrapRequestBody } = require_util$8();
	function calculateRetryAfterHeader(retryAfter) {
		const current = Date.now();
		return new Date(retryAfter).getTime() - current;
	}
	function validatePartialResponseContentLength(headers, range, statusCode, retryCount) {
		const contentLength = headers["content-length"];
		if (contentLength == null) return null;
		if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) return null;
		const length = Number(contentLength);
		const expectedLength = range.end - range.start + 1;
		if (!Number.isFinite(length) || length !== expectedLength) return new RequestRetryError("Content-Length mismatch", statusCode, {
			headers,
			data: { count: retryCount }
		});
		return null;
	}
	module.exports = class RetryHandler {
		constructor(opts, handlers) {
			const { retryOptions, ...dispatchOpts } = opts;
			const { retry: retryFn, maxRetries, maxTimeout, minTimeout, timeoutFactor, methods, errorCodes, retryAfter, statusCodes } = retryOptions ?? {};
			this.dispatch = handlers.dispatch;
			this.handler = handlers.handler;
			this.opts = {
				...dispatchOpts,
				body: wrapRequestBody(opts.body)
			};
			this.abort = null;
			this.aborted = false;
			this.retryOpts = {
				retry: retryFn ?? RetryHandler[kRetryHandlerDefaultRetry],
				retryAfter: retryAfter ?? true,
				maxTimeout: maxTimeout ?? 3e4,
				minTimeout: minTimeout ?? 500,
				timeoutFactor: timeoutFactor ?? 2,
				maxRetries: maxRetries ?? 5,
				methods: methods ?? [
					"GET",
					"HEAD",
					"OPTIONS",
					"PUT",
					"DELETE",
					"TRACE"
				],
				statusCodes: statusCodes ?? [
					500,
					502,
					503,
					504,
					429
				],
				errorCodes: errorCodes ?? [
					"ECONNRESET",
					"ECONNREFUSED",
					"ENOTFOUND",
					"ENETDOWN",
					"ENETUNREACH",
					"EHOSTDOWN",
					"EHOSTUNREACH",
					"EPIPE",
					"UND_ERR_SOCKET"
				]
			};
			this.retryCount = 0;
			this.retryCountCheckpoint = 0;
			this.start = 0;
			this.end = null;
			this.etag = null;
			this.resume = null;
			this.headersSent = false;
			this.handler.onConnect((reason) => {
				this.aborted = true;
				if (this.abort) this.abort(reason);
				else this.reason = reason;
			});
		}
		checkpointResponseEnd(headers, resume) {
			if (this.end == null && this.opts.method !== "HEAD") {
				const contentLength = headers["content-length"];
				this.end = contentLength != null ? Number(contentLength) - 1 : null;
				assert$15(this.end == null || Number.isFinite(this.end), "invalid content-length");
			}
			this.resume = this.end != null ? resume : null;
		}
		onRequestSent() {
			if (this.handler.onRequestSent) this.handler.onRequestSent();
		}
		onUpgrade(statusCode, headers, socket) {
			if (this.handler.onUpgrade) this.handler.onUpgrade(statusCode, headers, socket);
		}
		onConnect(abort) {
			if (this.aborted) abort(this.reason);
			else this.abort = abort;
		}
		onBodySent(chunk) {
			if (this.handler.onBodySent) return this.handler.onBodySent(chunk);
		}
		static [kRetryHandlerDefaultRetry](err, { state, opts }, cb) {
			const { statusCode, code, headers } = err;
			const { method, retryOptions } = opts;
			const { maxRetries, minTimeout, maxTimeout, timeoutFactor, statusCodes, errorCodes, methods } = retryOptions;
			const { counter } = state;
			if (code && code !== "UND_ERR_REQ_RETRY" && !errorCodes.includes(code)) {
				cb(err);
				return;
			}
			if (Array.isArray(methods) && !methods.includes(method)) {
				cb(err);
				return;
			}
			if (statusCode != null && Array.isArray(statusCodes) && !statusCodes.includes(statusCode)) {
				cb(err);
				return;
			}
			if (counter > maxRetries) {
				cb(err);
				return;
			}
			let retryAfterHeader = headers?.["retry-after"];
			if (retryAfterHeader) {
				retryAfterHeader = Number(retryAfterHeader);
				retryAfterHeader = Number.isNaN(retryAfterHeader) ? calculateRetryAfterHeader(retryAfterHeader) : retryAfterHeader * 1e3;
			}
			const retryTimeout = retryAfterHeader > 0 ? Math.min(retryAfterHeader, maxTimeout) : Math.min(minTimeout * timeoutFactor ** (counter - 1), maxTimeout);
			setTimeout(() => cb(null), retryTimeout);
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const headers = parseHeaders(rawHeaders);
			this.retryCount += 1;
			if (statusCode >= 300) {
				if (!this.headersSent && this.retryOpts.statusCodes.includes(statusCode) === false) {
					this.headersSent = true;
					this.checkpointResponseEnd(headers, resume);
					return this.handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
				} else {
					this.abort(new RequestRetryError("Request failed", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
			}
			if (this.resume != null) {
				this.resume = null;
				if (statusCode !== 206 && (this.start > 0 || statusCode !== 200)) {
					this.abort(new RequestRetryError("server does not support the range header and the payload was partially consumed", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				const contentRange = parseRangeHeader(headers["content-range"]);
				if (!contentRange) {
					this.abort(new RequestRetryError("Content-Range mismatch", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				if (this.etag != null && this.etag !== headers.etag) {
					this.abort(new RequestRetryError("ETag mismatch", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				const contentLengthError = validatePartialResponseContentLength(headers, contentRange, statusCode, this.retryCount);
				if (contentLengthError != null) {
					this.abort(contentLengthError);
					return false;
				}
				const { start, size, end = size - 1 } = contentRange;
				if (this.start !== start || this.end != null && this.end !== end) {
					this.abort(new RequestRetryError("Content-Range mismatch", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				this.resume = resume;
				return true;
			}
			if (this.end == null) {
				if (statusCode === 206) {
					const range = parseRangeHeader(headers["content-range"]);
					if (range == null) {
						this.headersSent = true;
						return this.handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
					}
					const contentLengthError = validatePartialResponseContentLength(headers, range, statusCode, this.retryCount);
					if (contentLengthError != null) {
						this.abort(contentLengthError);
						return false;
					}
					const { start, size, end = size - 1 } = range;
					assert$15(start != null && Number.isFinite(start), "content-range mismatch");
					assert$15(end != null && Number.isFinite(end), "invalid content-length");
					this.start = start;
					this.end = end;
				}
				if (this.end == null) {
					const contentLength = headers["content-length"];
					this.end = contentLength != null ? Number(contentLength) - 1 : null;
				}
				assert$15(Number.isFinite(this.start));
				assert$15(this.end == null || Number.isFinite(this.end), "invalid content-length");
				this.resume = resume;
				this.headersSent = true;
				this.etag = headers.etag != null ? headers.etag : null;
				if (this.etag != null && this.etag.startsWith("W/")) this.etag = null;
				return this.handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
			}
			const err = new RequestRetryError("Request failed", statusCode, {
				headers,
				data: { count: this.retryCount }
			});
			this.abort(err);
			return false;
		}
		onData(chunk) {
			this.start += chunk.length;
			return this.handler.onData(chunk);
		}
		onComplete(rawTrailers) {
			this.retryCount = 0;
			return this.handler.onComplete(rawTrailers);
		}
		onError(err) {
			if (this.aborted || isDisturbed(this.opts.body) || this.headersSent && this.resume == null) return this.handler.onError(err);
			if (this.retryCount - this.retryCountCheckpoint > 0) this.retryCount = this.retryCountCheckpoint + (this.retryCount - this.retryCountCheckpoint);
			else this.retryCount += 1;
			this.retryOpts.retry(err, {
				state: { counter: this.retryCount },
				opts: {
					retryOptions: this.retryOpts,
					...this.opts
				}
			}, onRetry.bind(this));
			function onRetry(err) {
				if (err != null || this.aborted || isDisturbed(this.opts.body)) return this.handler.onError(err);
				if (this.start !== 0) {
					const headers = { range: `bytes=${this.start}-${this.end ?? ""}` };
					if (this.etag != null) headers["if-match"] = this.etag;
					this.opts = {
						...this.opts,
						headers: {
							...this.opts.headers,
							...headers
						}
					};
				}
				try {
					this.retryCountCheckpoint = this.retryCount;
					this.dispatch(this.opts, this);
				} catch (err) {
					this.handler.onError(err);
				}
			}
		}
	};
}));
//#endregion
//#region node_modules/undici/lib/dispatcher/retry-agent.js
var require_retry_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Dispatcher = require_dispatcher();
	var RetryHandler = require_retry_handler();
	var RetryAgent = class extends Dispatcher {
		#agent = null;
		#options = null;
		constructor(agent, options = {}) {
			super(options);
			this.#agent = agent;
			this.#options = options;
		}
		dispatch(opts, handler) {
			const retry = new RetryHandler({
				...opts,
				retryOptions: this.#options
			}, {
				dispatch: this.#agent.dispatch.bind(this.#agent),
				handler
			});
			return this.#agent.dispatch(opts, retry);
		}
		close() {
			return this.#agent.close();
		}
		destroy() {
			return this.#agent.destroy();
		}
	};
	module.exports = RetryAgent;
}));
//#endregion
//#region node_modules/undici/lib/api/readable.js
var require_readable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$14 = __require("node:assert");
	var { Readable: Readable$3 } = __require("node:stream");
	var { RequestAbortedError, NotSupportedError, InvalidArgumentError, AbortError } = require_errors$1();
	var util = require_util$8();
	var { ReadableStreamFrom } = require_util$8();
	var kConsume = Symbol("kConsume");
	var kReading = Symbol("kReading");
	var kBody = Symbol("kBody");
	var kAbort = Symbol("kAbort");
	var kContentType = Symbol("kContentType");
	var kContentLength = Symbol("kContentLength");
	var noop = () => {};
	var BodyReadable = class extends Readable$3 {
		constructor({ resume, abort, contentType = "", contentLength, highWaterMark = 65536 }) {
			super({
				autoDestroy: true,
				read: resume,
				highWaterMark
			});
			this._readableState.dataEmitted = false;
			this[kAbort] = abort;
			this[kConsume] = null;
			this[kBody] = null;
			this[kContentType] = contentType;
			this[kContentLength] = contentLength;
			this[kReading] = false;
		}
		destroy(err) {
			if (!err && !this._readableState.endEmitted) err = new RequestAbortedError();
			if (err) this[kAbort]();
			return super.destroy(err);
		}
		_destroy(err, callback) {
			if (!this[kReading]) setImmediate(() => {
				callback(err);
			});
			else callback(err);
		}
		on(ev, ...args) {
			if (ev === "data" || ev === "readable") this[kReading] = true;
			return super.on(ev, ...args);
		}
		addListener(ev, ...args) {
			return this.on(ev, ...args);
		}
		off(ev, ...args) {
			const ret = super.off(ev, ...args);
			if (ev === "data" || ev === "readable") this[kReading] = this.listenerCount("data") > 0 || this.listenerCount("readable") > 0;
			return ret;
		}
		removeListener(ev, ...args) {
			return this.off(ev, ...args);
		}
		push(chunk) {
			if (this[kConsume] && chunk !== null) {
				consumePush(this[kConsume], chunk);
				return this[kReading] ? super.push(chunk) : true;
			}
			return super.push(chunk);
		}
		async text() {
			return consume(this, "text");
		}
		async json() {
			return consume(this, "json");
		}
		async blob() {
			return consume(this, "blob");
		}
		async bytes() {
			return consume(this, "bytes");
		}
		async arrayBuffer() {
			return consume(this, "arrayBuffer");
		}
		async formData() {
			throw new NotSupportedError();
		}
		get bodyUsed() {
			return util.isDisturbed(this);
		}
		get body() {
			if (!this[kBody]) {
				this[kBody] = ReadableStreamFrom(this);
				if (this[kConsume]) {
					this[kBody].getReader();
					assert$14(this[kBody].locked);
				}
			}
			return this[kBody];
		}
		async dump(opts) {
			let limit = Number.isFinite(opts?.limit) ? opts.limit : 131072;
			const signal = opts?.signal;
			if (signal != null && (typeof signal !== "object" || !("aborted" in signal))) throw new InvalidArgumentError("signal must be an AbortSignal");
			signal?.throwIfAborted();
			if (this._readableState.closeEmitted) return null;
			return await new Promise((resolve, reject) => {
				if (this[kContentLength] > limit) this.destroy(new AbortError());
				const onAbort = () => {
					this.destroy(signal.reason ?? new AbortError());
				};
				signal?.addEventListener("abort", onAbort);
				this.on("close", function() {
					signal?.removeEventListener("abort", onAbort);
					if (signal?.aborted) reject(signal.reason ?? new AbortError());
					else resolve(null);
				}).on("error", noop).on("data", function(chunk) {
					limit -= chunk.length;
					if (limit <= 0) this.destroy();
				}).resume();
			});
		}
	};
	function isLocked(self) {
		return self[kBody] && self[kBody].locked === true || self[kConsume];
	}
	function isUnusable(self) {
		return util.isDisturbed(self) || isLocked(self);
	}
	async function consume(stream, type) {
		assert$14(!stream[kConsume]);
		return new Promise((resolve, reject) => {
			if (isUnusable(stream)) {
				const rState = stream._readableState;
				if (rState.destroyed && rState.closeEmitted === false) stream.on("error", (err) => {
					reject(err);
				}).on("close", () => {
					reject(/* @__PURE__ */ new TypeError("unusable"));
				});
				else reject(rState.errored ?? /* @__PURE__ */ new TypeError("unusable"));
			} else queueMicrotask(() => {
				stream[kConsume] = {
					type,
					stream,
					resolve,
					reject,
					length: 0,
					body: []
				};
				stream.on("error", function(err) {
					consumeFinish(this[kConsume], err);
				}).on("close", function() {
					if (this[kConsume].body !== null) consumeFinish(this[kConsume], new RequestAbortedError());
				});
				consumeStart(stream[kConsume]);
			});
		});
	}
	function consumeStart(consume) {
		if (consume.body === null) return;
		const { _readableState: state } = consume.stream;
		if (state.bufferIndex) {
			const start = state.bufferIndex;
			const end = state.buffer.length;
			for (let n = start; n < end; n++) consumePush(consume, state.buffer[n]);
		} else for (const chunk of state.buffer) consumePush(consume, chunk);
		if (state.endEmitted) consumeEnd(this[kConsume]);
		else consume.stream.on("end", function() {
			consumeEnd(this[kConsume]);
		});
		consume.stream.resume();
		while (consume.stream.read() != null);
	}
	/**
	* @param {Buffer[]} chunks
	* @param {number} length
	*/
	function chunksDecode(chunks, length) {
		if (chunks.length === 0 || length === 0) return "";
		const buffer = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, length);
		const bufferLength = buffer.length;
		const start = bufferLength > 2 && buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191 ? 3 : 0;
		return buffer.utf8Slice(start, bufferLength);
	}
	/**
	* @param {Buffer[]} chunks
	* @param {number} length
	* @returns {Uint8Array}
	*/
	function chunksConcat(chunks, length) {
		if (chunks.length === 0 || length === 0) return /* @__PURE__ */ new Uint8Array(0);
		if (chunks.length === 1) return new Uint8Array(chunks[0]);
		const buffer = new Uint8Array(Buffer.allocUnsafeSlow(length).buffer);
		let offset = 0;
		for (let i = 0; i < chunks.length; ++i) {
			const chunk = chunks[i];
			buffer.set(chunk, offset);
			offset += chunk.length;
		}
		return buffer;
	}
	function consumeEnd(consume) {
		const { type, body, resolve, stream, length } = consume;
		try {
			if (type === "text") resolve(chunksDecode(body, length));
			else if (type === "json") resolve(JSON.parse(chunksDecode(body, length)));
			else if (type === "arrayBuffer") resolve(chunksConcat(body, length).buffer);
			else if (type === "blob") resolve(new Blob(body, { type: stream[kContentType] }));
			else if (type === "bytes") resolve(chunksConcat(body, length));
			consumeFinish(consume);
		} catch (err) {
			stream.destroy(err);
		}
	}
	function consumePush(consume, chunk) {
		consume.length += chunk.length;
		consume.body.push(chunk);
	}
	function consumeFinish(consume, err) {
		if (consume.body === null) return;
		if (err) consume.reject(err);
		else consume.resolve();
		consume.type = null;
		consume.stream = null;
		consume.resolve = null;
		consume.reject = null;
		consume.length = 0;
		consume.body = null;
	}
	module.exports = {
		Readable: BodyReadable,
		chunksDecode
	};
}));
//#endregion
//#region node_modules/undici/lib/api/util.js
var require_util$6 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$13 = __require("node:assert");
	var { ResponseStatusCodeError } = require_errors$1();
	var { chunksDecode } = require_readable();
	var CHUNK_LIMIT = 131072;
	async function getResolveErrorBodyCallback({ callback, body, contentType, statusCode, statusMessage, headers }) {
		assert$13(body);
		let chunks = [];
		let length = 0;
		try {
			for await (const chunk of body) {
				chunks.push(chunk);
				length += chunk.length;
				if (length > CHUNK_LIMIT) {
					chunks = [];
					length = 0;
					break;
				}
			}
		} catch {
			chunks = [];
			length = 0;
		}
		const message = `Response status code ${statusCode}${statusMessage ? `: ${statusMessage}` : ""}`;
		if (statusCode === 204 || !contentType || !length) {
			queueMicrotask(() => callback(new ResponseStatusCodeError(message, statusCode, headers)));
			return;
		}
		const stackTraceLimit = Error.stackTraceLimit;
		Error.stackTraceLimit = 0;
		let payload;
		try {
			if (isContentTypeApplicationJson(contentType)) payload = JSON.parse(chunksDecode(chunks, length));
			else if (isContentTypeText(contentType)) payload = chunksDecode(chunks, length);
		} catch {} finally {
			Error.stackTraceLimit = stackTraceLimit;
		}
		queueMicrotask(() => callback(new ResponseStatusCodeError(message, statusCode, headers, payload)));
	}
	var isContentTypeApplicationJson = (contentType) => {
		return contentType.length > 15 && contentType[11] === "/" && contentType[0] === "a" && contentType[1] === "p" && contentType[2] === "p" && contentType[3] === "l" && contentType[4] === "i" && contentType[5] === "c" && contentType[6] === "a" && contentType[7] === "t" && contentType[8] === "i" && contentType[9] === "o" && contentType[10] === "n" && contentType[12] === "j" && contentType[13] === "s" && contentType[14] === "o" && contentType[15] === "n";
	};
	var isContentTypeText = (contentType) => {
		return contentType.length > 4 && contentType[4] === "/" && contentType[0] === "t" && contentType[1] === "e" && contentType[2] === "x" && contentType[3] === "t";
	};
	module.exports = {
		getResolveErrorBodyCallback,
		isContentTypeApplicationJson,
		isContentTypeText
	};
}));
//#endregion
//#region node_modules/undici/lib/api/api-request.js
var require_api_request = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$12 = __require("node:assert");
	var { Readable } = require_readable();
	var { InvalidArgumentError, RequestAbortedError } = require_errors$1();
	var util = require_util$8();
	var { getResolveErrorBodyCallback } = require_util$6();
	var { AsyncResource: AsyncResource$4 } = __require("node:async_hooks");
	var RequestHandler = class extends AsyncResource$4 {
		constructor(opts, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			const { signal, method, opaque, body, onInfo, responseHeaders, throwOnError, highWaterMark } = opts;
			try {
				if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
				if (highWaterMark && (typeof highWaterMark !== "number" || highWaterMark < 0)) throw new InvalidArgumentError("invalid highWaterMark");
				if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
				if (method === "CONNECT") throw new InvalidArgumentError("invalid method");
				if (onInfo && typeof onInfo !== "function") throw new InvalidArgumentError("invalid onInfo callback");
				super("UNDICI_REQUEST");
			} catch (err) {
				if (util.isStream(body)) util.destroy(body.on("error", util.nop), err);
				throw err;
			}
			this.method = method;
			this.responseHeaders = responseHeaders || null;
			this.opaque = opaque || null;
			this.callback = callback;
			this.res = null;
			this.abort = null;
			this.body = body;
			this.trailers = {};
			this.context = null;
			this.onInfo = onInfo || null;
			this.throwOnError = throwOnError;
			this.highWaterMark = highWaterMark;
			this.signal = signal;
			this.reason = null;
			this.removeAbortListener = null;
			if (util.isStream(body)) body.on("error", (err) => {
				this.onError(err);
			});
			if (this.signal) {
				if (this.signal.aborted) this.reason = this.signal.reason ?? new RequestAbortedError();
				else this.removeAbortListener = util.addAbortListener(this.signal, () => {
					this.reason = this.signal.reason ?? new RequestAbortedError();
					if (this.res) util.destroy(this.res.on("error", util.nop), this.reason);
					else if (this.abort) this.abort(this.reason);
					if (this.removeAbortListener) {
						this.res?.off("close", this.removeAbortListener);
						this.removeAbortListener();
						this.removeAbortListener = null;
					}
				});
			}
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$12(this.callback);
			this.abort = abort;
			this.context = context;
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const { callback, opaque, abort, context, responseHeaders, highWaterMark } = this;
			const headers = responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			if (statusCode < 200) {
				if (this.onInfo) this.onInfo({
					statusCode,
					headers
				});
				return;
			}
			const parsedHeaders = responseHeaders === "raw" ? util.parseHeaders(rawHeaders) : headers;
			const contentType = parsedHeaders["content-type"];
			const contentLength = parsedHeaders["content-length"];
			const res = new Readable({
				resume,
				abort,
				contentType,
				contentLength: this.method !== "HEAD" && contentLength ? Number(contentLength) : null,
				highWaterMark
			});
			if (this.removeAbortListener) res.on("close", this.removeAbortListener);
			this.callback = null;
			this.res = res;
			if (callback !== null) {
				if (this.throwOnError && statusCode >= 400) this.runInAsyncScope(getResolveErrorBodyCallback, null, {
					callback,
					body: res,
					contentType,
					statusCode,
					statusMessage,
					headers
				});
				else this.runInAsyncScope(callback, null, null, {
					statusCode,
					headers,
					trailers: this.trailers,
					opaque,
					body: res,
					context
				});
			}
		}
		onData(chunk) {
			return this.res.push(chunk);
		}
		onComplete(trailers) {
			util.parseHeaders(trailers, this.trailers);
			this.res.push(null);
		}
		onError(err) {
			const { res, callback, body, opaque } = this;
			if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
			if (res) {
				this.res = null;
				queueMicrotask(() => {
					util.destroy(res, err);
				});
			}
			if (body) {
				this.body = null;
				util.destroy(body, err);
			}
			if (this.removeAbortListener) {
				res?.off("close", this.removeAbortListener);
				this.removeAbortListener();
				this.removeAbortListener = null;
			}
		}
	};
	function request(opts, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			request.call(this, opts, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			this.dispatch(opts, new RequestHandler(opts, callback));
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = request;
	module.exports.RequestHandler = RequestHandler;
}));
//#endregion
//#region node_modules/undici/lib/api/abort-signal.js
var require_abort_signal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { addAbortListener } = require_util$8();
	var { RequestAbortedError } = require_errors$1();
	var kListener = Symbol("kListener");
	var kSignal = Symbol("kSignal");
	function abort(self) {
		if (self.abort) self.abort(self[kSignal]?.reason);
		else self.reason = self[kSignal]?.reason ?? new RequestAbortedError();
		removeSignal(self);
	}
	function addSignal(self, signal) {
		self.reason = null;
		self[kSignal] = null;
		self[kListener] = null;
		if (!signal) return;
		if (signal.aborted) {
			abort(self);
			return;
		}
		self[kSignal] = signal;
		self[kListener] = () => {
			abort(self);
		};
		addAbortListener(self[kSignal], self[kListener]);
	}
	function removeSignal(self) {
		if (!self[kSignal]) return;
		if ("removeEventListener" in self[kSignal]) self[kSignal].removeEventListener("abort", self[kListener]);
		else self[kSignal].removeListener("abort", self[kListener]);
		self[kSignal] = null;
		self[kListener] = null;
	}
	module.exports = {
		addSignal,
		removeSignal
	};
}));
//#endregion
//#region node_modules/undici/lib/api/api-stream.js
var require_api_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$11 = __require("node:assert");
	var { finished: finished$1, PassThrough: PassThrough$1 } = __require("node:stream");
	var { InvalidArgumentError, InvalidReturnValueError } = require_errors$1();
	var util = require_util$8();
	var { getResolveErrorBodyCallback } = require_util$6();
	var { AsyncResource: AsyncResource$3 } = __require("node:async_hooks");
	var { addSignal, removeSignal } = require_abort_signal();
	var StreamHandler = class extends AsyncResource$3 {
		constructor(opts, factory, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			const { signal, method, opaque, body, onInfo, responseHeaders, throwOnError } = opts;
			try {
				if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
				if (typeof factory !== "function") throw new InvalidArgumentError("invalid factory");
				if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
				if (method === "CONNECT") throw new InvalidArgumentError("invalid method");
				if (onInfo && typeof onInfo !== "function") throw new InvalidArgumentError("invalid onInfo callback");
				super("UNDICI_STREAM");
			} catch (err) {
				if (util.isStream(body)) util.destroy(body.on("error", util.nop), err);
				throw err;
			}
			this.responseHeaders = responseHeaders || null;
			this.opaque = opaque || null;
			this.factory = factory;
			this.callback = callback;
			this.res = null;
			this.abort = null;
			this.context = null;
			this.trailers = null;
			this.body = body;
			this.onInfo = onInfo || null;
			this.throwOnError = throwOnError || false;
			if (util.isStream(body)) body.on("error", (err) => {
				this.onError(err);
			});
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$11(this.callback);
			this.abort = abort;
			this.context = context;
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const { factory, opaque, context, callback, responseHeaders } = this;
			const headers = responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			if (statusCode < 200) {
				if (this.onInfo) this.onInfo({
					statusCode,
					headers
				});
				return;
			}
			this.factory = null;
			let res;
			if (this.throwOnError && statusCode >= 400) {
				const contentType = (responseHeaders === "raw" ? util.parseHeaders(rawHeaders) : headers)["content-type"];
				res = new PassThrough$1();
				this.callback = null;
				this.runInAsyncScope(getResolveErrorBodyCallback, null, {
					callback,
					body: res,
					contentType,
					statusCode,
					statusMessage,
					headers
				});
			} else {
				if (factory === null) return;
				res = this.runInAsyncScope(factory, null, {
					statusCode,
					headers,
					opaque,
					context
				});
				if (!res || typeof res.write !== "function" || typeof res.end !== "function" || typeof res.on !== "function") throw new InvalidReturnValueError("expected Writable");
				finished$1(res, { readable: false }, (err) => {
					const { callback, res, opaque, trailers, abort } = this;
					this.res = null;
					if (err || !res.readable) util.destroy(res, err);
					this.callback = null;
					this.runInAsyncScope(callback, null, err || null, {
						opaque,
						trailers
					});
					if (err) abort();
				});
			}
			res.on("drain", resume);
			this.res = res;
			return (res.writableNeedDrain !== void 0 ? res.writableNeedDrain : res._writableState?.needDrain) !== true;
		}
		onData(chunk) {
			const { res } = this;
			return res ? res.write(chunk) : true;
		}
		onComplete(trailers) {
			const { res } = this;
			removeSignal(this);
			if (!res) return;
			this.trailers = util.parseHeaders(trailers);
			res.end();
		}
		onError(err) {
			const { res, callback, opaque, body } = this;
			removeSignal(this);
			this.factory = null;
			if (res) {
				this.res = null;
				util.destroy(res, err);
			} else if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
			if (body) {
				this.body = null;
				util.destroy(body, err);
			}
		}
	};
	function stream(opts, factory, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			stream.call(this, opts, factory, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			this.dispatch(opts, new StreamHandler(opts, factory, callback));
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = stream;
}));
//#endregion
//#region node_modules/undici/lib/api/api-pipeline.js
var require_api_pipeline = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Readable: Readable$2, Duplex, PassThrough } = __require("node:stream");
	var { InvalidArgumentError, InvalidReturnValueError, RequestAbortedError } = require_errors$1();
	var util = require_util$8();
	var { AsyncResource: AsyncResource$2 } = __require("node:async_hooks");
	var { addSignal, removeSignal } = require_abort_signal();
	var assert$10 = __require("node:assert");
	var kResume = Symbol("resume");
	var PipelineRequest = class extends Readable$2 {
		constructor() {
			super({ autoDestroy: true });
			this[kResume] = null;
		}
		_read() {
			const { [kResume]: resume } = this;
			if (resume) {
				this[kResume] = null;
				resume();
			}
		}
		_destroy(err, callback) {
			this._read();
			callback(err);
		}
	};
	var PipelineResponse = class extends Readable$2 {
		constructor(resume) {
			super({ autoDestroy: true });
			this[kResume] = resume;
		}
		_read() {
			this[kResume]();
		}
		_destroy(err, callback) {
			if (!err && !this._readableState.endEmitted) err = new RequestAbortedError();
			callback(err);
		}
	};
	var PipelineHandler = class extends AsyncResource$2 {
		constructor(opts, handler) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (typeof handler !== "function") throw new InvalidArgumentError("invalid handler");
			const { signal, method, opaque, onInfo, responseHeaders } = opts;
			if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
			if (method === "CONNECT") throw new InvalidArgumentError("invalid method");
			if (onInfo && typeof onInfo !== "function") throw new InvalidArgumentError("invalid onInfo callback");
			super("UNDICI_PIPELINE");
			this.opaque = opaque || null;
			this.responseHeaders = responseHeaders || null;
			this.handler = handler;
			this.abort = null;
			this.context = null;
			this.onInfo = onInfo || null;
			this.req = new PipelineRequest().on("error", util.nop);
			this.ret = new Duplex({
				readableObjectMode: opts.objectMode,
				autoDestroy: true,
				read: () => {
					const { body } = this;
					if (body?.resume) body.resume();
				},
				write: (chunk, encoding, callback) => {
					const { req } = this;
					if (req.push(chunk, encoding) || req._readableState.destroyed) callback();
					else req[kResume] = callback;
				},
				destroy: (err, callback) => {
					const { body, req, res, ret, abort } = this;
					if (!err && !ret._readableState.endEmitted) err = new RequestAbortedError();
					if (abort && err) abort();
					util.destroy(body, err);
					util.destroy(req, err);
					util.destroy(res, err);
					removeSignal(this);
					callback(err);
				}
			}).on("prefinish", () => {
				const { req } = this;
				req.push(null);
			});
			this.res = null;
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			const { ret, res } = this;
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$10(!res, "pipeline cannot be retried");
			assert$10(!ret.destroyed);
			this.abort = abort;
			this.context = context;
		}
		onHeaders(statusCode, rawHeaders, resume) {
			const { opaque, handler, context } = this;
			if (statusCode < 200) {
				if (this.onInfo) {
					const headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
					this.onInfo({
						statusCode,
						headers
					});
				}
				return;
			}
			this.res = new PipelineResponse(resume);
			let body;
			try {
				this.handler = null;
				const headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
				body = this.runInAsyncScope(handler, null, {
					statusCode,
					headers,
					opaque,
					body: this.res,
					context
				});
			} catch (err) {
				this.res.on("error", util.nop);
				throw err;
			}
			if (!body || typeof body.on !== "function") throw new InvalidReturnValueError("expected Readable");
			body.on("data", (chunk) => {
				const { ret, body } = this;
				if (!ret.push(chunk) && body.pause) body.pause();
			}).on("error", (err) => {
				const { ret } = this;
				util.destroy(ret, err);
			}).on("end", () => {
				const { ret } = this;
				ret.push(null);
			}).on("close", () => {
				const { ret } = this;
				if (!ret._readableState.ended) util.destroy(ret, new RequestAbortedError());
			});
			this.body = body;
		}
		onData(chunk) {
			const { res } = this;
			return res.push(chunk);
		}
		onComplete(trailers) {
			const { res } = this;
			res.push(null);
		}
		onError(err) {
			const { ret } = this;
			this.handler = null;
			util.destroy(ret, err);
		}
	};
	function pipeline(opts, handler) {
		try {
			const pipelineHandler = new PipelineHandler(opts, handler);
			this.dispatch({
				...opts,
				body: pipelineHandler.req
			}, pipelineHandler);
			return pipelineHandler.ret;
		} catch (err) {
			return new PassThrough().destroy(err);
		}
	}
	module.exports = pipeline;
}));
//#endregion
//#region node_modules/undici/lib/api/api-upgrade.js
var require_api_upgrade = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { InvalidArgumentError, SocketError } = require_errors$1();
	var { AsyncResource: AsyncResource$1 } = __require("node:async_hooks");
	var util = require_util$8();
	var { addSignal, removeSignal } = require_abort_signal();
	var assert$9 = __require("node:assert");
	var UpgradeHandler = class extends AsyncResource$1 {
		constructor(opts, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			const { signal, opaque, responseHeaders } = opts;
			if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
			super("UNDICI_UPGRADE");
			this.responseHeaders = responseHeaders || null;
			this.opaque = opaque || null;
			this.callback = callback;
			this.abort = null;
			this.context = null;
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$9(this.callback);
			this.abort = abort;
			this.context = null;
		}
		onHeaders() {
			throw new SocketError("bad upgrade", null);
		}
		onUpgrade(statusCode, rawHeaders, socket) {
			assert$9(statusCode === 101);
			const { callback, opaque, context } = this;
			removeSignal(this);
			this.callback = null;
			const headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			this.runInAsyncScope(callback, null, null, {
				headers,
				socket,
				opaque,
				context
			});
		}
		onError(err) {
			const { callback, opaque } = this;
			removeSignal(this);
			if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
		}
	};
	function upgrade(opts, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			upgrade.call(this, opts, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			const upgradeHandler = new UpgradeHandler(opts, callback);
			this.dispatch({
				...opts,
				method: opts.method || "GET",
				upgrade: opts.protocol || "Websocket"
			}, upgradeHandler);
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = upgrade;
}));
//#endregion
//#region node_modules/undici/lib/api/api-connect.js
var require_api_connect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$8 = __require("node:assert");
	var { AsyncResource } = __require("node:async_hooks");
	var { InvalidArgumentError, SocketError } = require_errors$1();
	var util = require_util$8();
	var { addSignal, removeSignal } = require_abort_signal();
	var ConnectHandler = class extends AsyncResource {
		constructor(opts, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			const { signal, opaque, responseHeaders } = opts;
			if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
			super("UNDICI_CONNECT");
			this.opaque = opaque || null;
			this.responseHeaders = responseHeaders || null;
			this.callback = callback;
			this.abort = null;
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$8(this.callback);
			this.abort = abort;
			this.context = context;
		}
		onHeaders() {
			throw new SocketError("bad connect", null);
		}
		onUpgrade(statusCode, rawHeaders, socket) {
			const { callback, opaque, context } = this;
			removeSignal(this);
			this.callback = null;
			let headers = rawHeaders;
			if (headers != null) headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			this.runInAsyncScope(callback, null, null, {
				statusCode,
				headers,
				socket,
				opaque,
				context
			});
		}
		onError(err) {
			const { callback, opaque } = this;
			removeSignal(this);
			if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
		}
	};
	function connect(opts, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			connect.call(this, opts, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			const connectHandler = new ConnectHandler(opts, callback);
			this.dispatch({
				...opts,
				method: "CONNECT"
			}, connectHandler);
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = connect;
}));
//#endregion
//#region node_modules/undici/lib/api/index.js
var require_api = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports.request = require_api_request();
	module.exports.stream = require_api_stream();
	module.exports.pipeline = require_api_pipeline();
	module.exports.upgrade = require_api_upgrade();
	module.exports.connect = require_api_connect();
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-errors.js
var require_mock_errors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { UndiciError } = require_errors$1();
	var kMockNotMatchedError = Symbol.for("undici.error.UND_MOCK_ERR_MOCK_NOT_MATCHED");
	module.exports = { MockNotMatchedError: class MockNotMatchedError extends UndiciError {
		constructor(message) {
			super(message);
			Error.captureStackTrace(this, MockNotMatchedError);
			this.name = "MockNotMatchedError";
			this.message = message || "The request does not match any registered mock dispatches";
			this.code = "UND_MOCK_ERR_MOCK_NOT_MATCHED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kMockNotMatchedError] === true;
		}
		[kMockNotMatchedError] = true;
	} };
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-symbols.js
var require_mock_symbols = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kAgent: Symbol("agent"),
		kOptions: Symbol("options"),
		kFactory: Symbol("factory"),
		kDispatches: Symbol("dispatches"),
		kDispatchKey: Symbol("dispatch key"),
		kDefaultHeaders: Symbol("default headers"),
		kDefaultTrailers: Symbol("default trailers"),
		kContentLength: Symbol("content length"),
		kMockAgent: Symbol("mock agent"),
		kMockAgentSet: Symbol("mock agent set"),
		kMockAgentGet: Symbol("mock agent get"),
		kMockDispatch: Symbol("mock dispatch"),
		kClose: Symbol("close"),
		kOriginalClose: Symbol("original agent close"),
		kOrigin: Symbol("origin"),
		kIsMockActive: Symbol("is mock active"),
		kNetConnect: Symbol("net connect"),
		kGetNetConnect: Symbol("get net connect"),
		kConnected: Symbol("connected")
	};
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-utils.js
var require_mock_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { MockNotMatchedError } = require_mock_errors();
	var { kDispatches, kMockAgent, kOriginalDispatch, kOrigin, kGetNetConnect } = require_mock_symbols();
	var { buildURL } = require_util$8();
	var { STATUS_CODES: STATUS_CODES$1 } = __require("node:http");
	var { types: { isPromise } } = __require("node:util");
	function matchValue(match, value) {
		if (typeof match === "string") return match === value;
		if (match instanceof RegExp) return match.test(value);
		if (typeof match === "function") return match(value) === true;
		return false;
	}
	function lowerCaseEntries(headers) {
		return Object.fromEntries(Object.entries(headers).map(([headerName, headerValue]) => {
			return [headerName.toLocaleLowerCase(), headerValue];
		}));
	}
	/**
	* @param {import('../../index').Headers|string[]|Record<string, string>} headers
	* @param {string} key
	*/
	function getHeaderByName(headers, key) {
		if (Array.isArray(headers)) {
			for (let i = 0; i < headers.length; i += 2) if (headers[i].toLocaleLowerCase() === key.toLocaleLowerCase()) return headers[i + 1];
			return;
		} else if (typeof headers.get === "function") return headers.get(key);
		else return lowerCaseEntries(headers)[key.toLocaleLowerCase()];
	}
	/** @param {string[]} headers */
	function buildHeadersFromArray(headers) {
		const clone = headers.slice();
		const entries = [];
		for (let index = 0; index < clone.length; index += 2) entries.push([clone[index], clone[index + 1]]);
		return Object.fromEntries(entries);
	}
	function matchHeaders(mockDispatch, headers) {
		if (typeof mockDispatch.headers === "function") {
			if (Array.isArray(headers)) headers = buildHeadersFromArray(headers);
			return mockDispatch.headers(headers ? lowerCaseEntries(headers) : {});
		}
		if (typeof mockDispatch.headers === "undefined") return true;
		if (typeof headers !== "object" || typeof mockDispatch.headers !== "object") return false;
		for (const [matchHeaderName, matchHeaderValue] of Object.entries(mockDispatch.headers)) if (!matchValue(matchHeaderValue, getHeaderByName(headers, matchHeaderName))) return false;
		return true;
	}
	function safeUrl(path) {
		if (typeof path !== "string") return path;
		const pathSegments = path.split("?");
		if (pathSegments.length !== 2) return path;
		const qp = new URLSearchParams(pathSegments.pop());
		qp.sort();
		return [...pathSegments, qp.toString()].join("?");
	}
	function matchKey(mockDispatch, { path, method, body, headers }) {
		const pathMatch = matchValue(mockDispatch.path, path);
		const methodMatch = matchValue(mockDispatch.method, method);
		const bodyMatch = typeof mockDispatch.body !== "undefined" ? matchValue(mockDispatch.body, body) : true;
		const headersMatch = matchHeaders(mockDispatch, headers);
		return pathMatch && methodMatch && bodyMatch && headersMatch;
	}
	function getResponseData(data) {
		if (Buffer.isBuffer(data)) return data;
		else if (data instanceof Uint8Array) return data;
		else if (data instanceof ArrayBuffer) return data;
		else if (typeof data === "object") return JSON.stringify(data);
		else return data.toString();
	}
	function getMockDispatch(mockDispatches, key) {
		const basePath = key.query ? buildURL(key.path, key.query) : key.path;
		const resolvedPath = typeof basePath === "string" ? safeUrl(basePath) : basePath;
		let matchedMockDispatches = mockDispatches.filter(({ consumed }) => !consumed).filter(({ path }) => matchValue(safeUrl(path), resolvedPath));
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for path '${resolvedPath}'`);
		matchedMockDispatches = matchedMockDispatches.filter(({ method }) => matchValue(method, key.method));
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for method '${key.method}' on path '${resolvedPath}'`);
		matchedMockDispatches = matchedMockDispatches.filter(({ body }) => typeof body !== "undefined" ? matchValue(body, key.body) : true);
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for body '${key.body}' on path '${resolvedPath}'`);
		matchedMockDispatches = matchedMockDispatches.filter((mockDispatch) => matchHeaders(mockDispatch, key.headers));
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for headers '${typeof key.headers === "object" ? JSON.stringify(key.headers) : key.headers}' on path '${resolvedPath}'`);
		return matchedMockDispatches[0];
	}
	function addMockDispatch(mockDispatches, key, data) {
		const baseData = {
			timesInvoked: 0,
			times: 1,
			persist: false,
			consumed: false
		};
		const replyData = typeof data === "function" ? { callback: data } : { ...data };
		const newMockDispatch = {
			...baseData,
			...key,
			pending: true,
			data: {
				error: null,
				...replyData
			}
		};
		mockDispatches.push(newMockDispatch);
		return newMockDispatch;
	}
	function deleteMockDispatch(mockDispatches, key) {
		const index = mockDispatches.findIndex((dispatch) => {
			if (!dispatch.consumed) return false;
			return matchKey(dispatch, key);
		});
		if (index !== -1) mockDispatches.splice(index, 1);
	}
	function buildKey(opts) {
		const { path, method, body, headers, query } = opts;
		return {
			path,
			method,
			body,
			headers,
			query
		};
	}
	function generateKeyValues(data) {
		const keys = Object.keys(data);
		const result = [];
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			const value = data[key];
			const name = Buffer.from(`${key}`);
			if (Array.isArray(value)) for (let j = 0; j < value.length; ++j) result.push(name, Buffer.from(`${value[j]}`));
			else result.push(name, Buffer.from(`${value}`));
		}
		return result;
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
	* @param {number} statusCode
	*/
	function getStatusText(statusCode) {
		return STATUS_CODES$1[statusCode] || "unknown";
	}
	async function getResponse(body) {
		const buffers = [];
		for await (const data of body) buffers.push(data);
		return Buffer.concat(buffers).toString("utf8");
	}
	/**
	* Mock dispatch function used to simulate undici dispatches
	*/
	function mockDispatch(opts, handler) {
		const key = buildKey(opts);
		const mockDispatch = getMockDispatch(this[kDispatches], key);
		mockDispatch.timesInvoked++;
		if (mockDispatch.data.callback) mockDispatch.data = {
			...mockDispatch.data,
			...mockDispatch.data.callback(opts)
		};
		const { data: { statusCode, data, headers, trailers, error }, delay, persist } = mockDispatch;
		const { timesInvoked, times } = mockDispatch;
		mockDispatch.consumed = !persist && timesInvoked >= times;
		mockDispatch.pending = timesInvoked < times;
		if (error !== null) {
			deleteMockDispatch(this[kDispatches], key);
			handler.onError(error);
			return true;
		}
		if (typeof delay === "number" && delay > 0) setTimeout(() => {
			handleReply(this[kDispatches]);
		}, delay);
		else handleReply(this[kDispatches]);
		function handleReply(mockDispatches, _data = data) {
			const optsHeaders = Array.isArray(opts.headers) ? buildHeadersFromArray(opts.headers) : opts.headers;
			const body = typeof _data === "function" ? _data({
				...opts,
				headers: optsHeaders
			}) : _data;
			if (isPromise(body)) {
				body.then((newData) => handleReply(mockDispatches, newData));
				return;
			}
			const responseData = getResponseData(body);
			const responseHeaders = generateKeyValues(headers);
			const responseTrailers = generateKeyValues(trailers);
			handler.onConnect?.((err) => handler.onError(err), null);
			handler.onHeaders?.(statusCode, responseHeaders, resume, getStatusText(statusCode));
			handler.onData?.(Buffer.from(responseData));
			handler.onComplete?.(responseTrailers);
			deleteMockDispatch(mockDispatches, key);
		}
		function resume() {}
		return true;
	}
	function buildMockDispatch() {
		const agent = this[kMockAgent];
		const origin = this[kOrigin];
		const originalDispatch = this[kOriginalDispatch];
		return function dispatch(opts, handler) {
			if (agent.isMockActive) try {
				mockDispatch.call(this, opts, handler);
			} catch (error) {
				if (error instanceof MockNotMatchedError) {
					const netConnect = agent[kGetNetConnect]();
					if (netConnect === false) throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect disabled)`);
					if (checkNetConnect(netConnect, origin)) originalDispatch.call(this, opts, handler);
					else throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect is not enabled for this origin)`);
				} else throw error;
			}
			else originalDispatch.call(this, opts, handler);
		};
	}
	function checkNetConnect(netConnect, origin) {
		const url = new URL(origin);
		if (netConnect === true) return true;
		else if (Array.isArray(netConnect) && netConnect.some((matcher) => matchValue(matcher, url.host))) return true;
		return false;
	}
	function buildMockOptions(opts) {
		if (opts) {
			const { agent, ...mockOptions } = opts;
			return mockOptions;
		}
	}
	module.exports = {
		getResponseData,
		getMockDispatch,
		addMockDispatch,
		deleteMockDispatch,
		buildKey,
		generateKeyValues,
		matchValue,
		getResponse,
		getStatusText,
		mockDispatch,
		buildMockDispatch,
		checkNetConnect,
		buildMockOptions,
		getHeaderByName,
		buildHeadersFromArray
	};
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-interceptor.js
var require_mock_interceptor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { getResponseData, buildKey, addMockDispatch } = require_mock_utils();
	var { kDispatches, kDispatchKey, kDefaultHeaders, kDefaultTrailers, kContentLength, kMockDispatch } = require_mock_symbols();
	var { InvalidArgumentError } = require_errors$1();
	var { buildURL } = require_util$8();
	/**
	* Defines the scope API for an interceptor reply
	*/
	var MockScope = class {
		constructor(mockDispatch) {
			this[kMockDispatch] = mockDispatch;
		}
		/**
		* Delay a reply by a set amount in ms.
		*/
		delay(waitInMs) {
			if (typeof waitInMs !== "number" || !Number.isInteger(waitInMs) || waitInMs <= 0) throw new InvalidArgumentError("waitInMs must be a valid integer > 0");
			this[kMockDispatch].delay = waitInMs;
			return this;
		}
		/**
		* For a defined reply, never mark as consumed.
		*/
		persist() {
			this[kMockDispatch].persist = true;
			return this;
		}
		/**
		* Allow one to define a reply for a set amount of matching requests.
		*/
		times(repeatTimes) {
			if (typeof repeatTimes !== "number" || !Number.isInteger(repeatTimes) || repeatTimes <= 0) throw new InvalidArgumentError("repeatTimes must be a valid integer > 0");
			this[kMockDispatch].times = repeatTimes;
			return this;
		}
	};
	/**
	* Defines an interceptor for a Mock
	*/
	var MockInterceptor = class {
		constructor(opts, mockDispatches) {
			if (typeof opts !== "object") throw new InvalidArgumentError("opts must be an object");
			if (typeof opts.path === "undefined") throw new InvalidArgumentError("opts.path must be defined");
			if (typeof opts.method === "undefined") opts.method = "GET";
			if (typeof opts.path === "string") {
				if (opts.query) opts.path = buildURL(opts.path, opts.query);
				else {
					const parsedURL = new URL(opts.path, "data://");
					opts.path = parsedURL.pathname + parsedURL.search;
				}
			}
			if (typeof opts.method === "string") opts.method = opts.method.toUpperCase();
			this[kDispatchKey] = buildKey(opts);
			this[kDispatches] = mockDispatches;
			this[kDefaultHeaders] = {};
			this[kDefaultTrailers] = {};
			this[kContentLength] = false;
		}
		createMockScopeDispatchData({ statusCode, data, responseOptions }) {
			const responseData = getResponseData(data);
			const contentLength = this[kContentLength] ? { "content-length": responseData.length } : {};
			return {
				statusCode,
				data,
				headers: {
					...this[kDefaultHeaders],
					...contentLength,
					...responseOptions.headers
				},
				trailers: {
					...this[kDefaultTrailers],
					...responseOptions.trailers
				}
			};
		}
		validateReplyParameters(replyParameters) {
			if (typeof replyParameters.statusCode === "undefined") throw new InvalidArgumentError("statusCode must be defined");
			if (typeof replyParameters.responseOptions !== "object" || replyParameters.responseOptions === null) throw new InvalidArgumentError("responseOptions must be an object");
		}
		/**
		* Mock an undici request with a defined reply.
		*/
		reply(replyOptionsCallbackOrStatusCode) {
			if (typeof replyOptionsCallbackOrStatusCode === "function") {
				const wrappedDefaultsCallback = (opts) => {
					const resolvedData = replyOptionsCallbackOrStatusCode(opts);
					if (typeof resolvedData !== "object" || resolvedData === null) throw new InvalidArgumentError("reply options callback must return an object");
					const replyParameters = {
						data: "",
						responseOptions: {},
						...resolvedData
					};
					this.validateReplyParameters(replyParameters);
					return { ...this.createMockScopeDispatchData(replyParameters) };
				};
				return new MockScope(addMockDispatch(this[kDispatches], this[kDispatchKey], wrappedDefaultsCallback));
			}
			const replyParameters = {
				statusCode: replyOptionsCallbackOrStatusCode,
				data: arguments[1] === void 0 ? "" : arguments[1],
				responseOptions: arguments[2] === void 0 ? {} : arguments[2]
			};
			this.validateReplyParameters(replyParameters);
			const dispatchData = this.createMockScopeDispatchData(replyParameters);
			return new MockScope(addMockDispatch(this[kDispatches], this[kDispatchKey], dispatchData));
		}
		/**
		* Mock an undici request with a defined error.
		*/
		replyWithError(error) {
			if (typeof error === "undefined") throw new InvalidArgumentError("error must be defined");
			return new MockScope(addMockDispatch(this[kDispatches], this[kDispatchKey], { error }));
		}
		/**
		* Set default reply headers on the interceptor for subsequent replies
		*/
		defaultReplyHeaders(headers) {
			if (typeof headers === "undefined") throw new InvalidArgumentError("headers must be defined");
			this[kDefaultHeaders] = headers;
			return this;
		}
		/**
		* Set default reply trailers on the interceptor for subsequent replies
		*/
		defaultReplyTrailers(trailers) {
			if (typeof trailers === "undefined") throw new InvalidArgumentError("trailers must be defined");
			this[kDefaultTrailers] = trailers;
			return this;
		}
		/**
		* Set reply content length header for replies on the interceptor
		*/
		replyContentLength() {
			this[kContentLength] = true;
			return this;
		}
	};
	module.exports.MockInterceptor = MockInterceptor;
	module.exports.MockScope = MockScope;
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-client.js
var require_mock_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { promisify: promisify$1 } = __require("node:util");
	var Client = require_client();
	var { buildMockDispatch } = require_mock_utils();
	var { kDispatches, kMockAgent, kClose, kOriginalClose, kOrigin, kOriginalDispatch, kConnected } = require_mock_symbols();
	var { MockInterceptor } = require_mock_interceptor();
	var Symbols = require_symbols$4();
	var { InvalidArgumentError } = require_errors$1();
	/**
	* MockClient provides an API that extends the Client to influence the mockDispatches.
	*/
	var MockClient = class extends Client {
		constructor(origin, opts) {
			super(origin, opts);
			if (!opts || !opts.agent || typeof opts.agent.dispatch !== "function") throw new InvalidArgumentError("Argument opts.agent must implement Agent");
			this[kMockAgent] = opts.agent;
			this[kOrigin] = origin;
			this[kDispatches] = [];
			this[kConnected] = 1;
			this[kOriginalDispatch] = this.dispatch;
			this[kOriginalClose] = this.close.bind(this);
			this.dispatch = buildMockDispatch.call(this);
			this.close = this[kClose];
		}
		get [Symbols.kConnected]() {
			return this[kConnected];
		}
		/**
		* Sets up the base interceptor for mocking replies from undici.
		*/
		intercept(opts) {
			return new MockInterceptor(opts, this[kDispatches]);
		}
		async [kClose]() {
			await promisify$1(this[kOriginalClose])();
			this[kConnected] = 0;
			this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
		}
	};
	module.exports = MockClient;
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-pool.js
var require_mock_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { promisify } = __require("node:util");
	var Pool = require_pool();
	var { buildMockDispatch } = require_mock_utils();
	var { kDispatches, kMockAgent, kClose, kOriginalClose, kOrigin, kOriginalDispatch, kConnected } = require_mock_symbols();
	var { MockInterceptor } = require_mock_interceptor();
	var Symbols = require_symbols$4();
	var { InvalidArgumentError } = require_errors$1();
	/**
	* MockPool provides an API that extends the Pool to influence the mockDispatches.
	*/
	var MockPool = class extends Pool {
		constructor(origin, opts) {
			super(origin, opts);
			if (!opts || !opts.agent || typeof opts.agent.dispatch !== "function") throw new InvalidArgumentError("Argument opts.agent must implement Agent");
			this[kMockAgent] = opts.agent;
			this[kOrigin] = origin;
			this[kDispatches] = [];
			this[kConnected] = 1;
			this[kOriginalDispatch] = this.dispatch;
			this[kOriginalClose] = this.close.bind(this);
			this.dispatch = buildMockDispatch.call(this);
			this.close = this[kClose];
		}
		get [Symbols.kConnected]() {
			return this[kConnected];
		}
		/**
		* Sets up the base interceptor for mocking replies from undici.
		*/
		intercept(opts) {
			return new MockInterceptor(opts, this[kDispatches]);
		}
		async [kClose]() {
			await promisify(this[kOriginalClose])();
			this[kConnected] = 0;
			this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
		}
	};
	module.exports = MockPool;
}));
//#endregion
//#region node_modules/undici/lib/mock/pluralizer.js
var require_pluralizer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var singulars = {
		pronoun: "it",
		is: "is",
		was: "was",
		this: "this"
	};
	var plurals = {
		pronoun: "they",
		is: "are",
		was: "were",
		this: "these"
	};
	module.exports = class Pluralizer {
		constructor(singular, plural) {
			this.singular = singular;
			this.plural = plural;
		}
		pluralize(count) {
			const one = count === 1;
			const keys = one ? singulars : plurals;
			const noun = one ? this.singular : this.plural;
			return {
				...keys,
				count,
				noun
			};
		}
	};
}));
//#endregion
//#region node_modules/undici/lib/mock/pending-interceptors-formatter.js
var require_pending_interceptors_formatter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Transform: Transform$1 } = __require("node:stream");
	var { Console } = __require("node:console");
	var PERSISTENT = process.versions.icu ? "✅" : "Y ";
	var NOT_PERSISTENT = process.versions.icu ? "❌" : "N ";
	/**
	* Gets the output of `console.table(…)` as a string.
	*/
	module.exports = class PendingInterceptorsFormatter {
		constructor({ disableColors } = {}) {
			this.transform = new Transform$1({ transform(chunk, _enc, cb) {
				cb(null, chunk);
			} });
			this.logger = new Console({
				stdout: this.transform,
				inspectOptions: { colors: !disableColors && !process.env.CI }
			});
		}
		format(pendingInterceptors) {
			const withPrettyHeaders = pendingInterceptors.map(({ method, path, data: { statusCode }, persist, times, timesInvoked, origin }) => ({
				Method: method,
				Origin: origin,
				Path: path,
				"Status code": statusCode,
				Persistent: persist ? PERSISTENT : NOT_PERSISTENT,
				Invocations: timesInvoked,
				Remaining: persist ? Infinity : times - timesInvoked
			}));
			this.logger.table(withPrettyHeaders);
			return this.transform.read().toString();
		}
	};
}));
//#endregion
//#region node_modules/undici/lib/mock/mock-agent.js
var require_mock_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kClients } = require_symbols$4();
	var Agent = require_agent();
	var { kAgent, kMockAgentSet, kMockAgentGet, kDispatches, kIsMockActive, kNetConnect, kGetNetConnect, kOptions, kFactory } = require_mock_symbols();
	var MockClient = require_mock_client();
	var MockPool = require_mock_pool();
	var { matchValue, buildMockOptions } = require_mock_utils();
	var { InvalidArgumentError, UndiciError } = require_errors$1();
	var Dispatcher = require_dispatcher();
	var Pluralizer = require_pluralizer();
	var PendingInterceptorsFormatter = require_pending_interceptors_formatter();
	var MockAgent = class extends Dispatcher {
		constructor(opts) {
			super(opts);
			this[kNetConnect] = true;
			this[kIsMockActive] = true;
			if (opts?.agent && typeof opts.agent.dispatch !== "function") throw new InvalidArgumentError("Argument opts.agent must implement Agent");
			const agent = opts?.agent ? opts.agent : new Agent(opts);
			this[kAgent] = agent;
			this[kClients] = agent[kClients];
			this[kOptions] = buildMockOptions(opts);
		}
		get(origin) {
			let dispatcher = this[kMockAgentGet](origin);
			if (!dispatcher) {
				dispatcher = this[kFactory](origin);
				this[kMockAgentSet](origin, dispatcher);
			}
			return dispatcher;
		}
		dispatch(opts, handler) {
			this.get(opts.origin);
			return this[kAgent].dispatch(opts, handler);
		}
		async close() {
			await this[kAgent].close();
			this[kClients].clear();
		}
		deactivate() {
			this[kIsMockActive] = false;
		}
		activate() {
			this[kIsMockActive] = true;
		}
		enableNetConnect(matcher) {
			if (typeof matcher === "string" || typeof matcher === "function" || matcher instanceof RegExp) {
				if (Array.isArray(this[kNetConnect])) this[kNetConnect].push(matcher);
				else this[kNetConnect] = [matcher];
			} else if (typeof matcher === "undefined") this[kNetConnect] = true;
			else throw new InvalidArgumentError("Unsupported matcher. Must be one of String|Function|RegExp.");
		}
		disableNetConnect() {
			this[kNetConnect] = false;
		}
		get isMockActive() {
			return this[kIsMockActive];
		}
		[kMockAgentSet](origin, dispatcher) {
			this[kClients].set(origin, dispatcher);
		}
		[kFactory](origin) {
			const mockOptions = Object.assign({ agent: this }, this[kOptions]);
			return this[kOptions] && this[kOptions].connections === 1 ? new MockClient(origin, mockOptions) : new MockPool(origin, mockOptions);
		}
		[kMockAgentGet](origin) {
			const client = this[kClients].get(origin);
			if (client) return client;
			if (typeof origin !== "string") {
				const dispatcher = this[kFactory]("http://localhost:9999");
				this[kMockAgentSet](origin, dispatcher);
				return dispatcher;
			}
			for (const [keyMatcher, nonExplicitDispatcher] of Array.from(this[kClients])) if (nonExplicitDispatcher && typeof keyMatcher !== "string" && matchValue(keyMatcher, origin)) {
				const dispatcher = this[kFactory](origin);
				this[kMockAgentSet](origin, dispatcher);
				dispatcher[kDispatches] = nonExplicitDispatcher[kDispatches];
				return dispatcher;
			}
		}
		[kGetNetConnect]() {
			return this[kNetConnect];
		}
		pendingInterceptors() {
			const mockAgentClients = this[kClients];
			return Array.from(mockAgentClients.entries()).flatMap(([origin, scope]) => scope[kDispatches].map((dispatch) => ({
				...dispatch,
				origin
			}))).filter(({ pending }) => pending);
		}
		assertNoPendingInterceptors({ pendingInterceptorsFormatter = new PendingInterceptorsFormatter() } = {}) {
			const pending = this.pendingInterceptors();
			if (pending.length === 0) return;
			const pluralizer = new Pluralizer("interceptor", "interceptors").pluralize(pending.length);
			throw new UndiciError(`
${pluralizer.count} ${pluralizer.noun} ${pluralizer.is} pending:

${pendingInterceptorsFormatter.format(pending)}
`.trim());
		}
	};
	module.exports = MockAgent;
}));
//#endregion
//#region node_modules/undici/lib/global.js
var require_global = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var globalDispatcher = Symbol.for("undici.globalDispatcher.1");
	var { InvalidArgumentError } = require_errors$1();
	var Agent = require_agent();
	if (getGlobalDispatcher() === void 0) setGlobalDispatcher(new Agent());
	function setGlobalDispatcher(agent) {
		if (!agent || typeof agent.dispatch !== "function") throw new InvalidArgumentError("Argument agent must implement Agent");
		Object.defineProperty(globalThis, globalDispatcher, {
			value: agent,
			writable: true,
			enumerable: false,
			configurable: false
		});
	}
	function getGlobalDispatcher() {
		return globalThis[globalDispatcher];
	}
	module.exports = {
		setGlobalDispatcher,
		getGlobalDispatcher
	};
}));
//#endregion
//#region node_modules/undici/lib/handler/decorator-handler.js
var require_decorator_handler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = class DecoratorHandler {
		#handler;
		constructor(handler) {
			if (typeof handler !== "object" || handler === null) throw new TypeError("handler must be an object");
			this.#handler = handler;
		}
		onConnect(...args) {
			return this.#handler.onConnect?.(...args);
		}
		onError(...args) {
			return this.#handler.onError?.(...args);
		}
		onUpgrade(...args) {
			return this.#handler.onUpgrade?.(...args);
		}
		onResponseStarted(...args) {
			return this.#handler.onResponseStarted?.(...args);
		}
		onHeaders(...args) {
			return this.#handler.onHeaders?.(...args);
		}
		onData(...args) {
			return this.#handler.onData?.(...args);
		}
		onComplete(...args) {
			return this.#handler.onComplete?.(...args);
		}
		onBodySent(...args) {
			return this.#handler.onBodySent?.(...args);
		}
	};
}));
//#endregion
//#region node_modules/undici/lib/interceptor/redirect.js
var require_redirect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var RedirectHandler = require_redirect_handler();
	module.exports = (opts) => {
		const globalMaxRedirections = opts?.maxRedirections;
		return (dispatch) => {
			return function redirectInterceptor(opts, handler) {
				const { maxRedirections = globalMaxRedirections, ...baseOpts } = opts;
				if (!maxRedirections) return dispatch(opts, handler);
				return dispatch(baseOpts, new RedirectHandler(dispatch, maxRedirections, opts, handler));
			};
		};
	};
}));
//#endregion
//#region node_modules/undici/lib/interceptor/retry.js
var require_retry = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var RetryHandler = require_retry_handler();
	module.exports = (globalOpts) => {
		return (dispatch) => {
			return function retryInterceptor(opts, handler) {
				return dispatch(opts, new RetryHandler({
					...opts,
					retryOptions: {
						...globalOpts,
						...opts.retryOptions
					}
				}, {
					handler,
					dispatch
				}));
			};
		};
	};
}));
//#endregion
//#region node_modules/undici/lib/interceptor/dump.js
var require_dump = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var util = require_util$8();
	var { InvalidArgumentError, RequestAbortedError } = require_errors$1();
	var DecoratorHandler = require_decorator_handler();
	var DumpHandler = class extends DecoratorHandler {
		#maxSize = 1048576;
		#abort = null;
		#dumped = false;
		#aborted = false;
		#size = 0;
		#reason = null;
		#handler = null;
		constructor({ maxSize }, handler) {
			super(handler);
			if (maxSize != null && (!Number.isFinite(maxSize) || maxSize < 1)) throw new InvalidArgumentError("maxSize must be a number greater than 0");
			this.#maxSize = maxSize ?? this.#maxSize;
			this.#handler = handler;
		}
		onConnect(abort) {
			this.#abort = abort;
			this.#handler.onConnect(this.#customAbort.bind(this));
		}
		#customAbort(reason) {
			this.#aborted = true;
			this.#reason = reason;
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const contentLength = util.parseHeaders(rawHeaders)["content-length"];
			if (contentLength != null && contentLength > this.#maxSize) throw new RequestAbortedError(`Response size (${contentLength}) larger than maxSize (${this.#maxSize})`);
			if (this.#aborted) return true;
			return this.#handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
		}
		onError(err) {
			if (this.#dumped) return;
			err = this.#reason ?? err;
			this.#handler.onError(err);
		}
		onData(chunk) {
			this.#size = this.#size + chunk.length;
			if (this.#size >= this.#maxSize) {
				this.#dumped = true;
				if (this.#aborted) this.#handler.onError(this.#reason);
				else this.#handler.onComplete([]);
			}
			return true;
		}
		onComplete(trailers) {
			if (this.#dumped) return;
			if (this.#aborted) {
				this.#handler.onError(this.reason);
				return;
			}
			this.#handler.onComplete(trailers);
		}
	};
	function createDumpInterceptor({ maxSize: defaultMaxSize } = { maxSize: 1048576 }) {
		return (dispatch) => {
			return function Intercept(opts, handler) {
				const { dumpMaxSize = defaultMaxSize } = opts;
				return dispatch(opts, new DumpHandler({ maxSize: dumpMaxSize }, handler));
			};
		};
	}
	module.exports = createDumpInterceptor;
}));
//#endregion
//#region node_modules/undici/lib/interceptor/dns.js
var require_dns = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { isIP } = __require("node:net");
	var { lookup } = __require("node:dns");
	var DecoratorHandler = require_decorator_handler();
	var { InvalidArgumentError, InformationalError } = require_errors$1();
	var maxInt = Math.pow(2, 31) - 1;
	var DNSInstance = class {
		#maxTTL = 0;
		#maxItems = 0;
		#records = /* @__PURE__ */ new Map();
		dualStack = true;
		affinity = null;
		lookup = null;
		pick = null;
		constructor(opts) {
			this.#maxTTL = opts.maxTTL;
			this.#maxItems = opts.maxItems;
			this.dualStack = opts.dualStack;
			this.affinity = opts.affinity;
			this.lookup = opts.lookup ?? this.#defaultLookup;
			this.pick = opts.pick ?? this.#defaultPick;
		}
		get full() {
			return this.#records.size === this.#maxItems;
		}
		runLookup(origin, opts, cb) {
			const ips = this.#records.get(origin.hostname);
			if (ips == null && this.full) {
				cb(null, origin.origin);
				return;
			}
			const newOpts = {
				affinity: this.affinity,
				dualStack: this.dualStack,
				lookup: this.lookup,
				pick: this.pick,
				...opts.dns,
				maxTTL: this.#maxTTL,
				maxItems: this.#maxItems
			};
			if (ips == null) this.lookup(origin, newOpts, (err, addresses) => {
				if (err || addresses == null || addresses.length === 0) {
					cb(err ?? new InformationalError("No DNS entries found"));
					return;
				}
				this.setRecords(origin, addresses);
				const records = this.#records.get(origin.hostname);
				const ip = this.pick(origin, records, newOpts.affinity);
				let port;
				if (typeof ip.port === "number") port = `:${ip.port}`;
				else if (origin.port !== "") port = `:${origin.port}`;
				else port = "";
				cb(null, `${origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`);
			});
			else {
				const ip = this.pick(origin, ips, newOpts.affinity);
				if (ip == null) {
					this.#records.delete(origin.hostname);
					this.runLookup(origin, opts, cb);
					return;
				}
				let port;
				if (typeof ip.port === "number") port = `:${ip.port}`;
				else if (origin.port !== "") port = `:${origin.port}`;
				else port = "";
				cb(null, `${origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`);
			}
		}
		#defaultLookup(origin, opts, cb) {
			lookup(origin.hostname, {
				all: true,
				family: this.dualStack === false ? this.affinity : 0,
				order: "ipv4first"
			}, (err, addresses) => {
				if (err) return cb(err);
				const results = /* @__PURE__ */ new Map();
				for (const addr of addresses) results.set(`${addr.address}:${addr.family}`, addr);
				cb(null, results.values());
			});
		}
		#defaultPick(origin, hostnameRecords, affinity) {
			let ip = null;
			const { records, offset } = hostnameRecords;
			let family;
			if (this.dualStack) {
				if (affinity == null) {
					if (offset == null || offset === maxInt) {
						hostnameRecords.offset = 0;
						affinity = 4;
					} else {
						hostnameRecords.offset++;
						affinity = (hostnameRecords.offset & 1) === 1 ? 6 : 4;
					}
				}
				if (records[affinity] != null && records[affinity].ips.length > 0) family = records[affinity];
				else family = records[affinity === 4 ? 6 : 4];
			} else family = records[affinity];
			if (family == null || family.ips.length === 0) return ip;
			if (family.offset == null || family.offset === maxInt) family.offset = 0;
			else family.offset++;
			const position = family.offset % family.ips.length;
			ip = family.ips[position] ?? null;
			if (ip == null) return ip;
			if (Date.now() - ip.timestamp > ip.ttl) {
				family.ips.splice(position, 1);
				return this.pick(origin, hostnameRecords, affinity);
			}
			return ip;
		}
		setRecords(origin, addresses) {
			const timestamp = Date.now();
			const records = { records: {
				4: null,
				6: null
			} };
			for (const record of addresses) {
				record.timestamp = timestamp;
				if (typeof record.ttl === "number") record.ttl = Math.min(record.ttl, this.#maxTTL);
				else record.ttl = this.#maxTTL;
				const familyRecords = records.records[record.family] ?? { ips: [] };
				familyRecords.ips.push(record);
				records.records[record.family] = familyRecords;
			}
			this.#records.set(origin.hostname, records);
		}
		getHandler(meta, opts) {
			return new DNSDispatchHandler(this, meta, opts);
		}
	};
	var DNSDispatchHandler = class extends DecoratorHandler {
		#state = null;
		#opts = null;
		#dispatch = null;
		#handler = null;
		#origin = null;
		constructor(state, { origin, handler, dispatch }, opts) {
			super(handler);
			this.#origin = origin;
			this.#handler = handler;
			this.#opts = { ...opts };
			this.#state = state;
			this.#dispatch = dispatch;
		}
		onError(err) {
			switch (err.code) {
				case "ETIMEDOUT":
				case "ECONNREFUSED":
					if (this.#state.dualStack) {
						this.#state.runLookup(this.#origin, this.#opts, (err, newOrigin) => {
							if (err) return this.#handler.onError(err);
							const dispatchOpts = {
								...this.#opts,
								origin: newOrigin
							};
							this.#dispatch(dispatchOpts, this);
						});
						return;
					}
					this.#handler.onError(err);
					return;
				case "ENOTFOUND": this.#state.deleteRecord(this.#origin);
				default: this.#handler.onError(err);
			}
		}
	};
	module.exports = (interceptorOpts) => {
		if (interceptorOpts?.maxTTL != null && (typeof interceptorOpts?.maxTTL !== "number" || interceptorOpts?.maxTTL < 0)) throw new InvalidArgumentError("Invalid maxTTL. Must be a positive number");
		if (interceptorOpts?.maxItems != null && (typeof interceptorOpts?.maxItems !== "number" || interceptorOpts?.maxItems < 1)) throw new InvalidArgumentError("Invalid maxItems. Must be a positive number and greater than zero");
		if (interceptorOpts?.affinity != null && interceptorOpts?.affinity !== 4 && interceptorOpts?.affinity !== 6) throw new InvalidArgumentError("Invalid affinity. Must be either 4 or 6");
		if (interceptorOpts?.dualStack != null && typeof interceptorOpts?.dualStack !== "boolean") throw new InvalidArgumentError("Invalid dualStack. Must be a boolean");
		if (interceptorOpts?.lookup != null && typeof interceptorOpts?.lookup !== "function") throw new InvalidArgumentError("Invalid lookup. Must be a function");
		if (interceptorOpts?.pick != null && typeof interceptorOpts?.pick !== "function") throw new InvalidArgumentError("Invalid pick. Must be a function");
		const dualStack = interceptorOpts?.dualStack ?? true;
		let affinity;
		if (dualStack) affinity = interceptorOpts?.affinity ?? null;
		else affinity = interceptorOpts?.affinity ?? 4;
		const instance = new DNSInstance({
			maxTTL: interceptorOpts?.maxTTL ?? 1e4,
			lookup: interceptorOpts?.lookup ?? null,
			pick: interceptorOpts?.pick ?? null,
			dualStack,
			affinity,
			maxItems: interceptorOpts?.maxItems ?? Infinity
		});
		return (dispatch) => {
			return function dnsInterceptor(origDispatchOpts, handler) {
				const origin = origDispatchOpts.origin.constructor === URL ? origDispatchOpts.origin : new URL(origDispatchOpts.origin);
				if (isIP(origin.hostname) !== 0) return dispatch(origDispatchOpts, handler);
				instance.runLookup(origin, origDispatchOpts, (err, newOrigin) => {
					if (err) return handler.onError(err);
					let dispatchOpts = null;
					dispatchOpts = {
						...origDispatchOpts,
						servername: origin.hostname,
						origin: newOrigin,
						headers: {
							host: origin.hostname,
							...origDispatchOpts.headers
						}
					};
					dispatch(dispatchOpts, instance.getHandler({
						origin,
						dispatch,
						handler
					}, origDispatchOpts));
				});
				return true;
			};
		};
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/headers.js
var require_headers$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kConstruct } = require_symbols$4();
	var { kEnumerableProperty } = require_util$8();
	var { iteratorMixin, isValidHeaderName, isValidHeaderValue } = require_util$7();
	var { webidl } = require_webidl();
	var assert$7 = __require("node:assert");
	var util = __require("node:util");
	var kHeadersMap = Symbol("headers map");
	var kHeadersSortedMap = Symbol("headers map sorted");
	/**
	* @param {number} code
	*/
	function isHTTPWhiteSpaceCharCode(code) {
		return code === 10 || code === 13 || code === 9 || code === 32;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-header-value-normalize
	* @param {string} potentialValue
	*/
	function headerValueNormalize(potentialValue) {
		let i = 0;
		let j = potentialValue.length;
		while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(j - 1))) --j;
		while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(i))) ++i;
		return i === 0 && j === potentialValue.length ? potentialValue : potentialValue.substring(i, j);
	}
	function fill(headers, object) {
		if (Array.isArray(object)) for (let i = 0; i < object.length; ++i) {
			const header = object[i];
			if (header.length !== 2) throw webidl.errors.exception({
				header: "Headers constructor",
				message: `expected name/value pair to be length 2, found ${header.length}.`
			});
			appendHeader(headers, header[0], header[1]);
		}
		else if (typeof object === "object" && object !== null) {
			const keys = Object.keys(object);
			for (let i = 0; i < keys.length; ++i) appendHeader(headers, keys[i], object[keys[i]]);
		} else throw webidl.errors.conversionFailed({
			prefix: "Headers constructor",
			argument: "Argument 1",
			types: ["sequence<sequence<ByteString>>", "record<ByteString, ByteString>"]
		});
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-headers-append
	*/
	function appendHeader(headers, name, value) {
		value = headerValueNormalize(value);
		if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
			prefix: "Headers.append",
			value: name,
			type: "header name"
		});
		else if (!isValidHeaderValue(value)) throw webidl.errors.invalidArgument({
			prefix: "Headers.append",
			value,
			type: "header value"
		});
		if (getHeadersGuard(headers) === "immutable") throw new TypeError("immutable");
		return getHeadersList(headers).append(name, value, false);
	}
	function compareHeaderName(a, b) {
		return a[0] < b[0] ? -1 : 1;
	}
	var HeadersList = class HeadersList {
		/** @type {[string, string][]|null} */
		cookies = null;
		constructor(init) {
			if (init instanceof HeadersList) {
				this[kHeadersMap] = new Map(init[kHeadersMap]);
				this[kHeadersSortedMap] = init[kHeadersSortedMap];
				this.cookies = init.cookies === null ? null : [...init.cookies];
			} else {
				this[kHeadersMap] = new Map(init);
				this[kHeadersSortedMap] = null;
			}
		}
		/**
		* @see https://fetch.spec.whatwg.org/#header-list-contains
		* @param {string} name
		* @param {boolean} isLowerCase
		*/
		contains(name, isLowerCase) {
			return this[kHeadersMap].has(isLowerCase ? name : name.toLowerCase());
		}
		clear() {
			this[kHeadersMap].clear();
			this[kHeadersSortedMap] = null;
			this.cookies = null;
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-append
		* @param {string} name
		* @param {string} value
		* @param {boolean} isLowerCase
		*/
		append(name, value, isLowerCase) {
			this[kHeadersSortedMap] = null;
			const lowercaseName = isLowerCase ? name : name.toLowerCase();
			const exists = this[kHeadersMap].get(lowercaseName);
			if (exists) {
				const delimiter = lowercaseName === "cookie" ? "; " : ", ";
				this[kHeadersMap].set(lowercaseName, {
					name: exists.name,
					value: `${exists.value}${delimiter}${value}`
				});
			} else this[kHeadersMap].set(lowercaseName, {
				name,
				value
			});
			if (lowercaseName === "set-cookie") (this.cookies ??= []).push(value);
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-set
		* @param {string} name
		* @param {string} value
		* @param {boolean} isLowerCase
		*/
		set(name, value, isLowerCase) {
			this[kHeadersSortedMap] = null;
			const lowercaseName = isLowerCase ? name : name.toLowerCase();
			if (lowercaseName === "set-cookie") this.cookies = [value];
			this[kHeadersMap].set(lowercaseName, {
				name,
				value
			});
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-delete
		* @param {string} name
		* @param {boolean} isLowerCase
		*/
		delete(name, isLowerCase) {
			this[kHeadersSortedMap] = null;
			if (!isLowerCase) name = name.toLowerCase();
			if (name === "set-cookie") this.cookies = null;
			this[kHeadersMap].delete(name);
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-get
		* @param {string} name
		* @param {boolean} isLowerCase
		* @returns {string | null}
		*/
		get(name, isLowerCase) {
			return this[kHeadersMap].get(isLowerCase ? name : name.toLowerCase())?.value ?? null;
		}
		*[Symbol.iterator]() {
			for (const { 0: name, 1: { value } } of this[kHeadersMap]) yield [name, value];
		}
		get entries() {
			const headers = {};
			if (this[kHeadersMap].size !== 0) for (const { name, value } of this[kHeadersMap].values()) headers[name] = value;
			return headers;
		}
		rawValues() {
			return this[kHeadersMap].values();
		}
		get entriesList() {
			const headers = [];
			if (this[kHeadersMap].size !== 0) for (const { 0: lowerName, 1: { name, value } } of this[kHeadersMap]) if (lowerName === "set-cookie") for (const cookie of this.cookies) headers.push([name, cookie]);
			else headers.push([name, value]);
			return headers;
		}
		toSortedArray() {
			const size = this[kHeadersMap].size;
			const array = new Array(size);
			if (size <= 32) {
				if (size === 0) return array;
				const iterator = this[kHeadersMap][Symbol.iterator]();
				const firstValue = iterator.next().value;
				array[0] = [firstValue[0], firstValue[1].value];
				assert$7(firstValue[1].value !== null);
				for (let i = 1, j = 0, right = 0, left = 0, pivot = 0, x, value; i < size; ++i) {
					value = iterator.next().value;
					x = array[i] = [value[0], value[1].value];
					assert$7(x[1] !== null);
					left = 0;
					right = i;
					while (left < right) {
						pivot = left + (right - left >> 1);
						if (array[pivot][0] <= x[0]) left = pivot + 1;
						else right = pivot;
					}
					if (i !== pivot) {
						j = i;
						while (j > left) array[j] = array[--j];
						array[left] = x;
					}
				}
				/* c8 ignore next 4 */
				if (!iterator.next().done) throw new TypeError("Unreachable");
				return array;
			} else {
				let i = 0;
				for (const { 0: name, 1: { value } } of this[kHeadersMap]) {
					array[i++] = [name, value];
					assert$7(value !== null);
				}
				return array.sort(compareHeaderName);
			}
		}
	};
	var Headers = class Headers {
		#guard;
		#headersList;
		constructor(init = void 0) {
			webidl.util.markAsUncloneable(this);
			if (init === kConstruct) return;
			this.#headersList = new HeadersList();
			this.#guard = "none";
			if (init !== void 0) {
				init = webidl.converters.HeadersInit(init, "Headers contructor", "init");
				fill(this, init);
			}
		}
		append(name, value) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 2, "Headers.append");
			const prefix = "Headers.append";
			name = webidl.converters.ByteString(name, prefix, "name");
			value = webidl.converters.ByteString(value, prefix, "value");
			return appendHeader(this, name, value);
		}
		delete(name) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 1, "Headers.delete");
			name = webidl.converters.ByteString(name, "Headers.delete", "name");
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix: "Headers.delete",
				value: name,
				type: "header name"
			});
			if (this.#guard === "immutable") throw new TypeError("immutable");
			if (!this.#headersList.contains(name, false)) return;
			this.#headersList.delete(name, false);
		}
		get(name) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 1, "Headers.get");
			const prefix = "Headers.get";
			name = webidl.converters.ByteString(name, prefix, "name");
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix,
				value: name,
				type: "header name"
			});
			return this.#headersList.get(name, false);
		}
		has(name) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 1, "Headers.has");
			const prefix = "Headers.has";
			name = webidl.converters.ByteString(name, prefix, "name");
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix,
				value: name,
				type: "header name"
			});
			return this.#headersList.contains(name, false);
		}
		set(name, value) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 2, "Headers.set");
			const prefix = "Headers.set";
			name = webidl.converters.ByteString(name, prefix, "name");
			value = webidl.converters.ByteString(value, prefix, "value");
			value = headerValueNormalize(value);
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix,
				value: name,
				type: "header name"
			});
			else if (!isValidHeaderValue(value)) throw webidl.errors.invalidArgument({
				prefix,
				value,
				type: "header value"
			});
			if (this.#guard === "immutable") throw new TypeError("immutable");
			this.#headersList.set(name, value, false);
		}
		getSetCookie() {
			webidl.brandCheck(this, Headers);
			const list = this.#headersList.cookies;
			if (list) return [...list];
			return [];
		}
		get [kHeadersSortedMap]() {
			if (this.#headersList[kHeadersSortedMap]) return this.#headersList[kHeadersSortedMap];
			const headers = [];
			const names = this.#headersList.toSortedArray();
			const cookies = this.#headersList.cookies;
			if (cookies === null || cookies.length === 1) return this.#headersList[kHeadersSortedMap] = names;
			for (let i = 0; i < names.length; ++i) {
				const { 0: name, 1: value } = names[i];
				if (name === "set-cookie") for (let j = 0; j < cookies.length; ++j) headers.push([name, cookies[j]]);
				else headers.push([name, value]);
			}
			return this.#headersList[kHeadersSortedMap] = headers;
		}
		[util.inspect.custom](depth, options) {
			options.depth ??= depth;
			return `Headers ${util.formatWithOptions(options, this.#headersList.entries)}`;
		}
		static getHeadersGuard(o) {
			return o.#guard;
		}
		static setHeadersGuard(o, guard) {
			o.#guard = guard;
		}
		static getHeadersList(o) {
			return o.#headersList;
		}
		static setHeadersList(o, list) {
			o.#headersList = list;
		}
	};
	var { getHeadersGuard, setHeadersGuard, getHeadersList, setHeadersList } = Headers;
	Reflect.deleteProperty(Headers, "getHeadersGuard");
	Reflect.deleteProperty(Headers, "setHeadersGuard");
	Reflect.deleteProperty(Headers, "getHeadersList");
	Reflect.deleteProperty(Headers, "setHeadersList");
	iteratorMixin("Headers", Headers, kHeadersSortedMap, 0, 1);
	Object.defineProperties(Headers.prototype, {
		append: kEnumerableProperty,
		delete: kEnumerableProperty,
		get: kEnumerableProperty,
		has: kEnumerableProperty,
		set: kEnumerableProperty,
		getSetCookie: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "Headers",
			configurable: true
		},
		[util.inspect.custom]: { enumerable: false }
	});
	webidl.converters.HeadersInit = function(V, prefix, argument) {
		if (webidl.util.Type(V) === "Object") {
			const iterator = Reflect.get(V, Symbol.iterator);
			if (!util.types.isProxy(V) && iterator === Headers.prototype.entries) try {
				return getHeadersList(V).entriesList;
			} catch {}
			if (typeof iterator === "function") return webidl.converters["sequence<sequence<ByteString>>"](V, prefix, argument, iterator.bind(V));
			return webidl.converters["record<ByteString, ByteString>"](V, prefix, argument);
		}
		throw webidl.errors.conversionFailed({
			prefix: "Headers constructor",
			argument: "Argument 1",
			types: ["sequence<sequence<ByteString>>", "record<ByteString, ByteString>"]
		});
	};
	module.exports = {
		fill,
		compareHeaderName,
		Headers,
		HeadersList,
		getHeadersGuard,
		setHeadersGuard,
		setHeadersList,
		getHeadersList
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/response.js
var require_response = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Headers, HeadersList, fill, getHeadersGuard, setHeadersGuard, setHeadersList } = require_headers$1();
	var { extractBody, cloneBody, mixinBody, hasFinalizationRegistry, streamRegistry, bodyUnusable } = require_body();
	var util = require_util$8();
	var nodeUtil$1 = __require("node:util");
	var { kEnumerableProperty } = util;
	var { isValidReasonPhrase, isCancelled, isAborted, isBlobLike, serializeJavascriptValueToJSONString, isErrorLike, isomorphicEncode, environmentSettingsObject: relevantRealm } = require_util$7();
	var { redirectStatusSet, nullBodyStatus } = require_constants$3();
	var { kState, kHeaders } = require_symbols$3();
	var { webidl } = require_webidl();
	var { FormData } = require_formdata();
	var { URLSerializer } = require_data_url();
	var { kConstruct } = require_symbols$4();
	var assert$6 = __require("node:assert");
	var { types: types$2 } = __require("node:util");
	var textEncoder = new TextEncoder("utf-8");
	var Response = class Response {
		static error() {
			return fromInnerResponse(makeNetworkError(), "immutable");
		}
		static json(data, init = {}) {
			webidl.argumentLengthCheck(arguments, 1, "Response.json");
			if (init !== null) init = webidl.converters.ResponseInit(init);
			const body = extractBody(textEncoder.encode(serializeJavascriptValueToJSONString(data)));
			const responseObject = fromInnerResponse(makeResponse({}), "response");
			initializeResponse(responseObject, init, {
				body: body[0],
				type: "application/json"
			});
			return responseObject;
		}
		static redirect(url, status = 302) {
			webidl.argumentLengthCheck(arguments, 1, "Response.redirect");
			url = webidl.converters.USVString(url);
			status = webidl.converters["unsigned short"](status);
			let parsedURL;
			try {
				parsedURL = new URL(url, relevantRealm.settingsObject.baseUrl);
			} catch (err) {
				throw new TypeError(`Failed to parse URL from ${url}`, { cause: err });
			}
			if (!redirectStatusSet.has(status)) throw new RangeError(`Invalid status code ${status}`);
			const responseObject = fromInnerResponse(makeResponse({}), "immutable");
			responseObject[kState].status = status;
			const value = isomorphicEncode(URLSerializer(parsedURL));
			responseObject[kState].headersList.append("location", value, true);
			return responseObject;
		}
		constructor(body = null, init = {}) {
			webidl.util.markAsUncloneable(this);
			if (body === kConstruct) return;
			if (body !== null) body = webidl.converters.BodyInit(body);
			init = webidl.converters.ResponseInit(init);
			this[kState] = makeResponse({});
			this[kHeaders] = new Headers(kConstruct);
			setHeadersGuard(this[kHeaders], "response");
			setHeadersList(this[kHeaders], this[kState].headersList);
			let bodyWithType = null;
			if (body != null) {
				const [extractedBody, type] = extractBody(body);
				bodyWithType = {
					body: extractedBody,
					type
				};
			}
			initializeResponse(this, init, bodyWithType);
		}
		get type() {
			webidl.brandCheck(this, Response);
			return this[kState].type;
		}
		get url() {
			webidl.brandCheck(this, Response);
			const urlList = this[kState].urlList;
			const url = urlList[urlList.length - 1] ?? null;
			if (url === null) return "";
			return URLSerializer(url, true);
		}
		get redirected() {
			webidl.brandCheck(this, Response);
			return this[kState].urlList.length > 1;
		}
		get status() {
			webidl.brandCheck(this, Response);
			return this[kState].status;
		}
		get ok() {
			webidl.brandCheck(this, Response);
			return this[kState].status >= 200 && this[kState].status <= 299;
		}
		get statusText() {
			webidl.brandCheck(this, Response);
			return this[kState].statusText;
		}
		get headers() {
			webidl.brandCheck(this, Response);
			return this[kHeaders];
		}
		get body() {
			webidl.brandCheck(this, Response);
			return this[kState].body ? this[kState].body.stream : null;
		}
		get bodyUsed() {
			webidl.brandCheck(this, Response);
			return !!this[kState].body && util.isDisturbed(this[kState].body.stream);
		}
		clone() {
			webidl.brandCheck(this, Response);
			if (bodyUnusable(this)) throw webidl.errors.exception({
				header: "Response.clone",
				message: "Body has already been consumed."
			});
			const clonedResponse = cloneResponse(this[kState]);
			if (hasFinalizationRegistry && this[kState].body?.stream) streamRegistry.register(this, new WeakRef(this[kState].body.stream));
			return fromInnerResponse(clonedResponse, getHeadersGuard(this[kHeaders]));
		}
		[nodeUtil$1.inspect.custom](depth, options) {
			if (options.depth === null) options.depth = 2;
			options.colors ??= true;
			const properties = {
				status: this.status,
				statusText: this.statusText,
				headers: this.headers,
				body: this.body,
				bodyUsed: this.bodyUsed,
				ok: this.ok,
				redirected: this.redirected,
				type: this.type,
				url: this.url
			};
			return `Response ${nodeUtil$1.formatWithOptions(options, properties)}`;
		}
	};
	mixinBody(Response);
	Object.defineProperties(Response.prototype, {
		type: kEnumerableProperty,
		url: kEnumerableProperty,
		status: kEnumerableProperty,
		ok: kEnumerableProperty,
		redirected: kEnumerableProperty,
		statusText: kEnumerableProperty,
		headers: kEnumerableProperty,
		clone: kEnumerableProperty,
		body: kEnumerableProperty,
		bodyUsed: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "Response",
			configurable: true
		}
	});
	Object.defineProperties(Response, {
		json: kEnumerableProperty,
		redirect: kEnumerableProperty,
		error: kEnumerableProperty
	});
	function cloneResponse(response) {
		if (response.internalResponse) return filterResponse(cloneResponse(response.internalResponse), response.type);
		const newResponse = makeResponse({
			...response,
			body: null
		});
		if (response.body != null) newResponse.body = cloneBody(newResponse, response.body);
		return newResponse;
	}
	function makeResponse(init) {
		return {
			aborted: false,
			rangeRequested: false,
			timingAllowPassed: false,
			requestIncludesCredentials: false,
			type: "default",
			status: 200,
			timingInfo: null,
			cacheState: "",
			statusText: "",
			...init,
			headersList: init?.headersList ? new HeadersList(init?.headersList) : new HeadersList(),
			urlList: init?.urlList ? [...init.urlList] : []
		};
	}
	function makeNetworkError(reason) {
		return makeResponse({
			type: "error",
			status: 0,
			error: isErrorLike(reason) ? reason : new Error(reason ? String(reason) : reason),
			aborted: reason && reason.name === "AbortError"
		});
	}
	function isNetworkError(response) {
		return response.type === "error" && response.status === 0;
	}
	function makeFilteredResponse(response, state) {
		state = {
			internalResponse: response,
			...state
		};
		return new Proxy(response, {
			get(target, p) {
				return p in state ? state[p] : target[p];
			},
			set(target, p, value) {
				assert$6(!(p in state));
				target[p] = value;
				return true;
			}
		});
	}
	function filterResponse(response, type) {
		if (type === "basic") return makeFilteredResponse(response, {
			type: "basic",
			headersList: response.headersList
		});
		else if (type === "cors") return makeFilteredResponse(response, {
			type: "cors",
			headersList: response.headersList
		});
		else if (type === "opaque") return makeFilteredResponse(response, {
			type: "opaque",
			urlList: Object.freeze([]),
			status: 0,
			statusText: "",
			body: null
		});
		else if (type === "opaqueredirect") return makeFilteredResponse(response, {
			type: "opaqueredirect",
			status: 0,
			statusText: "",
			headersList: [],
			body: null
		});
		else assert$6(false);
	}
	function makeAppropriateNetworkError(fetchParams, err = null) {
		assert$6(isCancelled(fetchParams));
		return isAborted(fetchParams) ? makeNetworkError(Object.assign(new DOMException("The operation was aborted.", "AbortError"), { cause: err })) : makeNetworkError(Object.assign(new DOMException("Request was cancelled."), { cause: err }));
	}
	function initializeResponse(response, init, body) {
		if (init.status !== null && (init.status < 200 || init.status > 599)) throw new RangeError("init[\"status\"] must be in the range of 200 to 599, inclusive.");
		if ("statusText" in init && init.statusText != null) {
			if (!isValidReasonPhrase(String(init.statusText))) throw new TypeError("Invalid statusText");
		}
		if ("status" in init && init.status != null) response[kState].status = init.status;
		if ("statusText" in init && init.statusText != null) response[kState].statusText = init.statusText;
		if ("headers" in init && init.headers != null) fill(response[kHeaders], init.headers);
		if (body) {
			if (nullBodyStatus.includes(response.status)) throw webidl.errors.exception({
				header: "Response constructor",
				message: `Invalid response status code ${response.status}`
			});
			response[kState].body = body.body;
			if (body.type != null && !response[kState].headersList.contains("content-type", true)) response[kState].headersList.append("content-type", body.type, true);
		}
	}
	/**
	* @see https://fetch.spec.whatwg.org/#response-create
	* @param {any} innerResponse
	* @param {'request' | 'immutable' | 'request-no-cors' | 'response' | 'none'} guard
	* @returns {Response}
	*/
	function fromInnerResponse(innerResponse, guard) {
		const response = new Response(kConstruct);
		response[kState] = innerResponse;
		response[kHeaders] = new Headers(kConstruct);
		setHeadersList(response[kHeaders], innerResponse.headersList);
		setHeadersGuard(response[kHeaders], guard);
		if (hasFinalizationRegistry && innerResponse.body?.stream) streamRegistry.register(response, new WeakRef(innerResponse.body.stream));
		return response;
	}
	webidl.converters.ReadableStream = webidl.interfaceConverter(ReadableStream);
	webidl.converters.FormData = webidl.interfaceConverter(FormData);
	webidl.converters.URLSearchParams = webidl.interfaceConverter(URLSearchParams);
	webidl.converters.XMLHttpRequestBodyInit = function(V, prefix, name) {
		if (typeof V === "string") return webidl.converters.USVString(V, prefix, name);
		if (isBlobLike(V)) return webidl.converters.Blob(V, prefix, name, { strict: false });
		if (ArrayBuffer.isView(V) || types$2.isArrayBuffer(V)) return webidl.converters.BufferSource(V, prefix, name);
		if (util.isFormDataLike(V)) return webidl.converters.FormData(V, prefix, name, { strict: false });
		if (V instanceof URLSearchParams) return webidl.converters.URLSearchParams(V, prefix, name);
		return webidl.converters.DOMString(V, prefix, name);
	};
	webidl.converters.BodyInit = function(V, prefix, argument) {
		if (V instanceof ReadableStream) return webidl.converters.ReadableStream(V, prefix, argument);
		if (V?.[Symbol.asyncIterator]) return V;
		return webidl.converters.XMLHttpRequestBodyInit(V, prefix, argument);
	};
	webidl.converters.ResponseInit = webidl.dictionaryConverter([
		{
			key: "status",
			converter: webidl.converters["unsigned short"],
			defaultValue: () => 200
		},
		{
			key: "statusText",
			converter: webidl.converters.ByteString,
			defaultValue: () => ""
		},
		{
			key: "headers",
			converter: webidl.converters.HeadersInit
		}
	]);
	module.exports = {
		isNetworkError,
		makeNetworkError,
		makeResponse,
		makeAppropriateNetworkError,
		filterResponse,
		Response,
		cloneResponse,
		fromInnerResponse
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/dispatcher-weakref.js
var require_dispatcher_weakref = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kConnected, kSize } = require_symbols$4();
	var CompatWeakRef = class {
		constructor(value) {
			this.value = value;
		}
		deref() {
			return this.value[kConnected] === 0 && this.value[kSize] === 0 ? void 0 : this.value;
		}
	};
	var CompatFinalizer = class {
		constructor(finalizer) {
			this.finalizer = finalizer;
		}
		register(dispatcher, key) {
			if (dispatcher.on) dispatcher.on("disconnect", () => {
				if (dispatcher[kConnected] === 0 && dispatcher[kSize] === 0) this.finalizer(key);
			});
		}
		unregister(key) {}
	};
	module.exports = function() {
		if (process.env.NODE_V8_COVERAGE && process.version.startsWith("v18")) {
			process._rawDebug("Using compatibility WeakRef and FinalizationRegistry");
			return {
				WeakRef: CompatWeakRef,
				FinalizationRegistry: CompatFinalizer
			};
		}
		return {
			WeakRef,
			FinalizationRegistry
		};
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/request.js
var require_request = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { extractBody, mixinBody, cloneBody, bodyUnusable } = require_body();
	var { Headers, fill: fillHeaders, HeadersList, setHeadersGuard, getHeadersGuard, setHeadersList, getHeadersList } = require_headers$1();
	var { FinalizationRegistry } = require_dispatcher_weakref()();
	var util = require_util$8();
	var nodeUtil = __require("node:util");
	var { isValidHTTPToken, sameOrigin, environmentSettingsObject } = require_util$7();
	var { forbiddenMethodsSet, corsSafeListedMethodsSet, referrerPolicy, requestRedirect, requestMode, requestCredentials, requestCache, requestDuplex } = require_constants$3();
	var { kEnumerableProperty, normalizedMethodRecordsBase, normalizedMethodRecords } = util;
	var { kHeaders, kSignal, kState, kDispatcher } = require_symbols$3();
	var { webidl } = require_webidl();
	var { URLSerializer } = require_data_url();
	var { kConstruct } = require_symbols$4();
	var assert$5 = __require("node:assert");
	var { getMaxListeners, setMaxListeners, getEventListeners, defaultMaxListeners } = __require("node:events");
	var kAbortController = Symbol("abortController");
	var requestFinalizer = new FinalizationRegistry(({ signal, abort }) => {
		signal.removeEventListener("abort", abort);
	});
	var dependentControllerMap = /* @__PURE__ */ new WeakMap();
	function buildAbort(acRef) {
		return abort;
		function abort() {
			const ac = acRef.deref();
			if (ac !== void 0) {
				requestFinalizer.unregister(abort);
				this.removeEventListener("abort", abort);
				ac.abort(this.reason);
				const controllerList = dependentControllerMap.get(ac.signal);
				if (controllerList !== void 0) {
					if (controllerList.size !== 0) {
						for (const ref of controllerList) {
							const ctrl = ref.deref();
							if (ctrl !== void 0) ctrl.abort(this.reason);
						}
						controllerList.clear();
					}
					dependentControllerMap.delete(ac.signal);
				}
			}
		}
	}
	var patchMethodWarning = false;
	var Request = class Request {
		constructor(input, init = {}) {
			webidl.util.markAsUncloneable(this);
			if (input === kConstruct) return;
			const prefix = "Request constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			input = webidl.converters.RequestInfo(input, prefix, "input");
			init = webidl.converters.RequestInit(init, prefix, "init");
			let request = null;
			let fallbackMode = null;
			const baseUrl = environmentSettingsObject.settingsObject.baseUrl;
			let signal = null;
			if (typeof input === "string") {
				this[kDispatcher] = init.dispatcher;
				let parsedURL;
				try {
					parsedURL = new URL(input, baseUrl);
				} catch (err) {
					throw new TypeError("Failed to parse URL from " + input, { cause: err });
				}
				if (parsedURL.username || parsedURL.password) throw new TypeError("Request cannot be constructed from a URL that includes credentials: " + input);
				request = makeRequest({ urlList: [parsedURL] });
				fallbackMode = "cors";
			} else {
				this[kDispatcher] = init.dispatcher || input[kDispatcher];
				assert$5(input instanceof Request);
				request = input[kState];
				signal = input[kSignal];
			}
			const origin = environmentSettingsObject.settingsObject.origin;
			let window = "client";
			if (request.window?.constructor?.name === "EnvironmentSettingsObject" && sameOrigin(request.window, origin)) window = request.window;
			if (init.window != null) throw new TypeError(`'window' option '${window}' must be null`);
			if ("window" in init) window = "no-window";
			request = makeRequest({
				method: request.method,
				headersList: request.headersList,
				unsafeRequest: request.unsafeRequest,
				client: environmentSettingsObject.settingsObject,
				window,
				priority: request.priority,
				origin: request.origin,
				referrer: request.referrer,
				referrerPolicy: request.referrerPolicy,
				mode: request.mode,
				credentials: request.credentials,
				cache: request.cache,
				redirect: request.redirect,
				integrity: request.integrity,
				keepalive: request.keepalive,
				reloadNavigation: request.reloadNavigation,
				historyNavigation: request.historyNavigation,
				urlList: [...request.urlList]
			});
			const initHasKey = Object.keys(init).length !== 0;
			if (initHasKey) {
				if (request.mode === "navigate") request.mode = "same-origin";
				request.reloadNavigation = false;
				request.historyNavigation = false;
				request.origin = "client";
				request.referrer = "client";
				request.referrerPolicy = "";
				request.url = request.urlList[request.urlList.length - 1];
				request.urlList = [request.url];
			}
			if (init.referrer !== void 0) {
				const referrer = init.referrer;
				if (referrer === "") request.referrer = "no-referrer";
				else {
					let parsedReferrer;
					try {
						parsedReferrer = new URL(referrer, baseUrl);
					} catch (err) {
						throw new TypeError(`Referrer "${referrer}" is not a valid URL.`, { cause: err });
					}
					if (parsedReferrer.protocol === "about:" && parsedReferrer.hostname === "client" || origin && !sameOrigin(parsedReferrer, environmentSettingsObject.settingsObject.baseUrl)) request.referrer = "client";
					else request.referrer = parsedReferrer;
				}
			}
			if (init.referrerPolicy !== void 0) request.referrerPolicy = init.referrerPolicy;
			let mode;
			if (init.mode !== void 0) mode = init.mode;
			else mode = fallbackMode;
			if (mode === "navigate") throw webidl.errors.exception({
				header: "Request constructor",
				message: "invalid request mode navigate."
			});
			if (mode != null) request.mode = mode;
			if (init.credentials !== void 0) request.credentials = init.credentials;
			if (init.cache !== void 0) request.cache = init.cache;
			if (request.cache === "only-if-cached" && request.mode !== "same-origin") throw new TypeError("'only-if-cached' can be set only with 'same-origin' mode");
			if (init.redirect !== void 0) request.redirect = init.redirect;
			if (init.integrity != null) request.integrity = String(init.integrity);
			if (init.keepalive !== void 0) request.keepalive = Boolean(init.keepalive);
			if (init.method !== void 0) {
				let method = init.method;
				const mayBeNormalized = normalizedMethodRecords[method];
				if (mayBeNormalized !== void 0) request.method = mayBeNormalized;
				else {
					if (!isValidHTTPToken(method)) throw new TypeError(`'${method}' is not a valid HTTP method.`);
					const upperCase = method.toUpperCase();
					if (forbiddenMethodsSet.has(upperCase)) throw new TypeError(`'${method}' HTTP method is unsupported.`);
					method = normalizedMethodRecordsBase[upperCase] ?? method;
					request.method = method;
				}
				if (!patchMethodWarning && request.method === "patch") {
					process.emitWarning("Using `patch` is highly likely to result in a `405 Method Not Allowed`. `PATCH` is much more likely to succeed.", { code: "UNDICI-FETCH-patch" });
					patchMethodWarning = true;
				}
			}
			if (init.signal !== void 0) signal = init.signal;
			this[kState] = request;
			const ac = new AbortController();
			this[kSignal] = ac.signal;
			if (signal != null) {
				if (!signal || typeof signal.aborted !== "boolean" || typeof signal.addEventListener !== "function") throw new TypeError("Failed to construct 'Request': member signal is not of type AbortSignal.");
				if (signal.aborted) ac.abort(signal.reason);
				else {
					this[kAbortController] = ac;
					const abort = buildAbort(new WeakRef(ac));
					try {
						if (typeof getMaxListeners === "function" && getMaxListeners(signal) === defaultMaxListeners) setMaxListeners(1500, signal);
						else if (getEventListeners(signal, "abort").length >= defaultMaxListeners) setMaxListeners(1500, signal);
					} catch {}
					util.addAbortListener(signal, abort);
					requestFinalizer.register(ac, {
						signal,
						abort
					}, abort);
				}
			}
			this[kHeaders] = new Headers(kConstruct);
			setHeadersList(this[kHeaders], request.headersList);
			setHeadersGuard(this[kHeaders], "request");
			if (mode === "no-cors") {
				if (!corsSafeListedMethodsSet.has(request.method)) throw new TypeError(`'${request.method} is unsupported in no-cors mode.`);
				setHeadersGuard(this[kHeaders], "request-no-cors");
			}
			if (initHasKey) {
				/** @type {HeadersList} */
				const headersList = getHeadersList(this[kHeaders]);
				const headers = init.headers !== void 0 ? init.headers : new HeadersList(headersList);
				headersList.clear();
				if (headers instanceof HeadersList) {
					for (const { name, value } of headers.rawValues()) headersList.append(name, value, false);
					headersList.cookies = headers.cookies;
				} else fillHeaders(this[kHeaders], headers);
			}
			const inputBody = input instanceof Request ? input[kState].body : null;
			if ((init.body != null || inputBody != null) && (request.method === "GET" || request.method === "HEAD")) throw new TypeError("Request with GET/HEAD method cannot have body.");
			let initBody = null;
			if (init.body != null) {
				const [extractedBody, contentType] = extractBody(init.body, request.keepalive);
				initBody = extractedBody;
				if (contentType && !getHeadersList(this[kHeaders]).contains("content-type", true)) this[kHeaders].append("content-type", contentType);
			}
			const inputOrInitBody = initBody ?? inputBody;
			if (inputOrInitBody != null && inputOrInitBody.source == null) {
				if (initBody != null && init.duplex == null) throw new TypeError("RequestInit: duplex option is required when sending a body.");
				if (request.mode !== "same-origin" && request.mode !== "cors") throw new TypeError("If request is made from ReadableStream, mode should be \"same-origin\" or \"cors\"");
				request.useCORSPreflightFlag = true;
			}
			let finalBody = inputOrInitBody;
			if (initBody == null && inputBody != null) {
				if (bodyUnusable(input)) throw new TypeError("Cannot construct a Request with a Request object that has already been used.");
				const identityTransform = new TransformStream();
				inputBody.stream.pipeThrough(identityTransform);
				finalBody = {
					source: inputBody.source,
					length: inputBody.length,
					stream: identityTransform.readable
				};
			}
			this[kState].body = finalBody;
		}
		get method() {
			webidl.brandCheck(this, Request);
			return this[kState].method;
		}
		get url() {
			webidl.brandCheck(this, Request);
			return URLSerializer(this[kState].url);
		}
		get headers() {
			webidl.brandCheck(this, Request);
			return this[kHeaders];
		}
		get destination() {
			webidl.brandCheck(this, Request);
			return this[kState].destination;
		}
		get referrer() {
			webidl.brandCheck(this, Request);
			if (this[kState].referrer === "no-referrer") return "";
			if (this[kState].referrer === "client") return "about:client";
			return this[kState].referrer.toString();
		}
		get referrerPolicy() {
			webidl.brandCheck(this, Request);
			return this[kState].referrerPolicy;
		}
		get mode() {
			webidl.brandCheck(this, Request);
			return this[kState].mode;
		}
		get credentials() {
			return this[kState].credentials;
		}
		get cache() {
			webidl.brandCheck(this, Request);
			return this[kState].cache;
		}
		get redirect() {
			webidl.brandCheck(this, Request);
			return this[kState].redirect;
		}
		get integrity() {
			webidl.brandCheck(this, Request);
			return this[kState].integrity;
		}
		get keepalive() {
			webidl.brandCheck(this, Request);
			return this[kState].keepalive;
		}
		get isReloadNavigation() {
			webidl.brandCheck(this, Request);
			return this[kState].reloadNavigation;
		}
		get isHistoryNavigation() {
			webidl.brandCheck(this, Request);
			return this[kState].historyNavigation;
		}
		get signal() {
			webidl.brandCheck(this, Request);
			return this[kSignal];
		}
		get body() {
			webidl.brandCheck(this, Request);
			return this[kState].body ? this[kState].body.stream : null;
		}
		get bodyUsed() {
			webidl.brandCheck(this, Request);
			return !!this[kState].body && util.isDisturbed(this[kState].body.stream);
		}
		get duplex() {
			webidl.brandCheck(this, Request);
			return "half";
		}
		clone() {
			webidl.brandCheck(this, Request);
			if (bodyUnusable(this)) throw new TypeError("unusable");
			const clonedRequest = cloneRequest(this[kState]);
			const ac = new AbortController();
			if (this.signal.aborted) ac.abort(this.signal.reason);
			else {
				let list = dependentControllerMap.get(this.signal);
				if (list === void 0) {
					list = /* @__PURE__ */ new Set();
					dependentControllerMap.set(this.signal, list);
				}
				const acRef = new WeakRef(ac);
				list.add(acRef);
				util.addAbortListener(ac.signal, buildAbort(acRef));
			}
			return fromInnerRequest(clonedRequest, ac.signal, getHeadersGuard(this[kHeaders]));
		}
		[nodeUtil.inspect.custom](depth, options) {
			if (options.depth === null) options.depth = 2;
			options.colors ??= true;
			const properties = {
				method: this.method,
				url: this.url,
				headers: this.headers,
				destination: this.destination,
				referrer: this.referrer,
				referrerPolicy: this.referrerPolicy,
				mode: this.mode,
				credentials: this.credentials,
				cache: this.cache,
				redirect: this.redirect,
				integrity: this.integrity,
				keepalive: this.keepalive,
				isReloadNavigation: this.isReloadNavigation,
				isHistoryNavigation: this.isHistoryNavigation,
				signal: this.signal
			};
			return `Request ${nodeUtil.formatWithOptions(options, properties)}`;
		}
	};
	mixinBody(Request);
	function makeRequest(init) {
		return {
			method: init.method ?? "GET",
			localURLsOnly: init.localURLsOnly ?? false,
			unsafeRequest: init.unsafeRequest ?? false,
			body: init.body ?? null,
			client: init.client ?? null,
			reservedClient: init.reservedClient ?? null,
			replacesClientId: init.replacesClientId ?? "",
			window: init.window ?? "client",
			keepalive: init.keepalive ?? false,
			serviceWorkers: init.serviceWorkers ?? "all",
			initiator: init.initiator ?? "",
			destination: init.destination ?? "",
			priority: init.priority ?? null,
			origin: init.origin ?? "client",
			policyContainer: init.policyContainer ?? "client",
			referrer: init.referrer ?? "client",
			referrerPolicy: init.referrerPolicy ?? "",
			mode: init.mode ?? "no-cors",
			useCORSPreflightFlag: init.useCORSPreflightFlag ?? false,
			credentials: init.credentials ?? "same-origin",
			useCredentials: init.useCredentials ?? false,
			cache: init.cache ?? "default",
			redirect: init.redirect ?? "follow",
			integrity: init.integrity ?? "",
			cryptoGraphicsNonceMetadata: init.cryptoGraphicsNonceMetadata ?? "",
			parserMetadata: init.parserMetadata ?? "",
			reloadNavigation: init.reloadNavigation ?? false,
			historyNavigation: init.historyNavigation ?? false,
			userActivation: init.userActivation ?? false,
			taintedOrigin: init.taintedOrigin ?? false,
			redirectCount: init.redirectCount ?? 0,
			responseTainting: init.responseTainting ?? "basic",
			preventNoCacheCacheControlHeaderModification: init.preventNoCacheCacheControlHeaderModification ?? false,
			done: init.done ?? false,
			timingAllowFailed: init.timingAllowFailed ?? false,
			urlList: init.urlList,
			url: init.urlList[0],
			headersList: init.headersList ? new HeadersList(init.headersList) : new HeadersList()
		};
	}
	function cloneRequest(request) {
		const newRequest = makeRequest({
			...request,
			body: null
		});
		if (request.body != null) newRequest.body = cloneBody(newRequest, request.body);
		return newRequest;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#request-create
	* @param {any} innerRequest
	* @param {AbortSignal} signal
	* @param {'request' | 'immutable' | 'request-no-cors' | 'response' | 'none'} guard
	* @returns {Request}
	*/
	function fromInnerRequest(innerRequest, signal, guard) {
		const request = new Request(kConstruct);
		request[kState] = innerRequest;
		request[kSignal] = signal;
		request[kHeaders] = new Headers(kConstruct);
		setHeadersList(request[kHeaders], innerRequest.headersList);
		setHeadersGuard(request[kHeaders], guard);
		return request;
	}
	Object.defineProperties(Request.prototype, {
		method: kEnumerableProperty,
		url: kEnumerableProperty,
		headers: kEnumerableProperty,
		redirect: kEnumerableProperty,
		clone: kEnumerableProperty,
		signal: kEnumerableProperty,
		duplex: kEnumerableProperty,
		destination: kEnumerableProperty,
		body: kEnumerableProperty,
		bodyUsed: kEnumerableProperty,
		isHistoryNavigation: kEnumerableProperty,
		isReloadNavigation: kEnumerableProperty,
		keepalive: kEnumerableProperty,
		integrity: kEnumerableProperty,
		cache: kEnumerableProperty,
		credentials: kEnumerableProperty,
		attribute: kEnumerableProperty,
		referrerPolicy: kEnumerableProperty,
		referrer: kEnumerableProperty,
		mode: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "Request",
			configurable: true
		}
	});
	webidl.converters.Request = webidl.interfaceConverter(Request);
	webidl.converters.RequestInfo = function(V, prefix, argument) {
		if (typeof V === "string") return webidl.converters.USVString(V, prefix, argument);
		if (V instanceof Request) return webidl.converters.Request(V, prefix, argument);
		return webidl.converters.USVString(V, prefix, argument);
	};
	webidl.converters.AbortSignal = webidl.interfaceConverter(AbortSignal);
	webidl.converters.RequestInit = webidl.dictionaryConverter([
		{
			key: "method",
			converter: webidl.converters.ByteString
		},
		{
			key: "headers",
			converter: webidl.converters.HeadersInit
		},
		{
			key: "body",
			converter: webidl.nullableConverter(webidl.converters.BodyInit)
		},
		{
			key: "referrer",
			converter: webidl.converters.USVString
		},
		{
			key: "referrerPolicy",
			converter: webidl.converters.DOMString,
			allowedValues: referrerPolicy
		},
		{
			key: "mode",
			converter: webidl.converters.DOMString,
			allowedValues: requestMode
		},
		{
			key: "credentials",
			converter: webidl.converters.DOMString,
			allowedValues: requestCredentials
		},
		{
			key: "cache",
			converter: webidl.converters.DOMString,
			allowedValues: requestCache
		},
		{
			key: "redirect",
			converter: webidl.converters.DOMString,
			allowedValues: requestRedirect
		},
		{
			key: "integrity",
			converter: webidl.converters.DOMString
		},
		{
			key: "keepalive",
			converter: webidl.converters.boolean
		},
		{
			key: "signal",
			converter: webidl.nullableConverter((signal) => webidl.converters.AbortSignal(signal, "RequestInit", "signal", { strict: false }))
		},
		{
			key: "window",
			converter: webidl.converters.any
		},
		{
			key: "duplex",
			converter: webidl.converters.DOMString,
			allowedValues: requestDuplex
		},
		{
			key: "dispatcher",
			converter: webidl.converters.any
		}
	]);
	module.exports = {
		Request,
		makeRequest,
		fromInnerRequest,
		cloneRequest
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fetch/index.js
var require_fetch = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { makeNetworkError, makeAppropriateNetworkError, filterResponse, makeResponse, fromInnerResponse } = require_response();
	var { HeadersList } = require_headers$1();
	var { Request, cloneRequest } = require_request();
	var zlib = __require("node:zlib");
	var { bytesMatch, makePolicyContainer, clonePolicyContainer, requestBadPort, TAOCheck, appendRequestOriginHeader, responseLocationURL, requestCurrentURL, setRequestReferrerPolicyOnRedirect, tryUpgradeRequestToAPotentiallyTrustworthyURL, createOpaqueTimingInfo, appendFetchMetadata, corsCheck, crossOriginResourcePolicyCheck, determineRequestsReferrer, coarsenedSharedCurrentTime, createDeferredPromise, isBlobLike, sameOrigin, isCancelled, isAborted, isErrorLike, fullyReadBody, readableStreamClose, isomorphicEncode, urlIsLocal, urlIsHttpHttpsScheme, urlHasHttpsScheme, clampAndCoarsenConnectionTimingInfo, simpleRangeHeaderValue, buildContentRange, createInflate, extractMimeType } = require_util$7();
	var { kState, kDispatcher } = require_symbols$3();
	var assert$4 = __require("node:assert");
	var { safelyExtractBody, extractBody } = require_body();
	var { redirectStatusSet, nullBodyStatus, safeMethodsSet, requestBodyHeader, subresourceSet } = require_constants$3();
	var EE = __require("node:events");
	var { Readable: Readable$1, pipeline: pipeline$1, finished } = __require("node:stream");
	var { addAbortListener, isErrored, isReadable, bufferToLowerCasedHeaderName } = require_util$8();
	var { dataURLProcessor, serializeAMimeType, minimizeSupportedMimeType } = require_data_url();
	var { getGlobalDispatcher } = require_global();
	var { webidl } = require_webidl();
	var { STATUS_CODES } = __require("node:http");
	var GET_OR_HEAD = ["GET", "HEAD"];
	var defaultUserAgent = typeof __UNDICI_IS_NODE__ !== "undefined" || typeof esbuildDetection !== "undefined" ? "node" : "undici";
	/** @type {import('buffer').resolveObjectURL} */
	var resolveObjectURL;
	var Fetch = class extends EE {
		constructor(dispatcher) {
			super();
			this.dispatcher = dispatcher;
			this.connection = null;
			this.dump = false;
			this.state = "ongoing";
		}
		terminate(reason) {
			if (this.state !== "ongoing") return;
			this.state = "terminated";
			this.connection?.destroy(reason);
			this.emit("terminated", reason);
		}
		abort(error) {
			if (this.state !== "ongoing") return;
			this.state = "aborted";
			if (!error) error = new DOMException("The operation was aborted.", "AbortError");
			this.serializedAbortReason = error;
			this.connection?.destroy(error);
			this.emit("terminated", error);
		}
	};
	function handleFetchDone(response) {
		finalizeAndReportTiming(response, "fetch");
	}
	function fetch(input, init = void 0) {
		webidl.argumentLengthCheck(arguments, 1, "globalThis.fetch");
		let p = createDeferredPromise();
		let requestObject;
		try {
			requestObject = new Request(input, init);
		} catch (e) {
			p.reject(e);
			return p.promise;
		}
		const request = requestObject[kState];
		if (requestObject.signal.aborted) {
			abortFetch(p, request, null, requestObject.signal.reason);
			return p.promise;
		}
		if (request.client.globalObject?.constructor?.name === "ServiceWorkerGlobalScope") request.serviceWorkers = "none";
		let responseObject = null;
		let locallyAborted = false;
		let controller = null;
		addAbortListener(requestObject.signal, () => {
			locallyAborted = true;
			assert$4(controller != null);
			controller.abort(requestObject.signal.reason);
			const realResponse = responseObject?.deref();
			abortFetch(p, request, realResponse, requestObject.signal.reason);
		});
		const processResponse = (response) => {
			if (locallyAborted) return;
			if (response.aborted) {
				abortFetch(p, request, responseObject, controller.serializedAbortReason);
				return;
			}
			if (response.type === "error") {
				p.reject(new TypeError("fetch failed", { cause: response.error }));
				return;
			}
			responseObject = new WeakRef(fromInnerResponse(response, "immutable"));
			p.resolve(responseObject.deref());
			p = null;
		};
		controller = fetching({
			request,
			processResponseEndOfBody: handleFetchDone,
			processResponse,
			dispatcher: requestObject[kDispatcher]
		});
		return p.promise;
	}
	function finalizeAndReportTiming(response, initiatorType = "other") {
		if (response.type === "error" && response.aborted) return;
		if (!response.urlList?.length) return;
		const originalURL = response.urlList[0];
		let timingInfo = response.timingInfo;
		let cacheState = response.cacheState;
		if (!urlIsHttpHttpsScheme(originalURL)) return;
		if (timingInfo === null) return;
		if (!response.timingAllowPassed) {
			timingInfo = createOpaqueTimingInfo({ startTime: timingInfo.startTime });
			cacheState = "";
		}
		timingInfo.endTime = coarsenedSharedCurrentTime();
		response.timingInfo = timingInfo;
		markResourceTiming(timingInfo, originalURL.href, initiatorType, globalThis, cacheState);
	}
	var markResourceTiming = performance.markResourceTiming;
	function abortFetch(p, request, responseObject, error) {
		if (p) p.reject(error);
		if (request.body != null && isReadable(request.body?.stream)) request.body.stream.cancel(error).catch((err) => {
			if (err.code === "ERR_INVALID_STATE") return;
			throw err;
		});
		if (responseObject == null) return;
		const response = responseObject[kState];
		if (response.body != null && isReadable(response.body?.stream)) response.body.stream.cancel(error).catch((err) => {
			if (err.code === "ERR_INVALID_STATE") return;
			throw err;
		});
	}
	function fetching({ request, processRequestBodyChunkLength, processRequestEndOfBody, processResponse, processResponseEndOfBody, processResponseConsumeBody, useParallelQueue = false, dispatcher = getGlobalDispatcher() }) {
		assert$4(dispatcher);
		let taskDestination = null;
		let crossOriginIsolatedCapability = false;
		if (request.client != null) {
			taskDestination = request.client.globalObject;
			crossOriginIsolatedCapability = request.client.crossOriginIsolatedCapability;
		}
		const timingInfo = createOpaqueTimingInfo({ startTime: coarsenedSharedCurrentTime(crossOriginIsolatedCapability) });
		const fetchParams = {
			controller: new Fetch(dispatcher),
			request,
			timingInfo,
			processRequestBodyChunkLength,
			processRequestEndOfBody,
			processResponse,
			processResponseConsumeBody,
			processResponseEndOfBody,
			taskDestination,
			crossOriginIsolatedCapability
		};
		assert$4(!request.body || request.body.stream);
		if (request.window === "client") request.window = request.client?.globalObject?.constructor?.name === "Window" ? request.client : "no-window";
		if (request.origin === "client") request.origin = request.client.origin;
		if (request.policyContainer === "client") {
			if (request.client != null) request.policyContainer = clonePolicyContainer(request.client.policyContainer);
			else request.policyContainer = makePolicyContainer();
		}
		if (!request.headersList.contains("accept", true)) request.headersList.append("accept", "*/*", true);
		if (!request.headersList.contains("accept-language", true)) request.headersList.append("accept-language", "*", true);
		if (request.priority === null) {}
		if (subresourceSet.has(request.destination)) {}
		mainFetch(fetchParams).catch((err) => {
			fetchParams.controller.terminate(err);
		});
		return fetchParams.controller;
	}
	async function mainFetch(fetchParams, recursive = false) {
		const request = fetchParams.request;
		let response = null;
		if (request.localURLsOnly && !urlIsLocal(requestCurrentURL(request))) response = makeNetworkError("local URLs only");
		tryUpgradeRequestToAPotentiallyTrustworthyURL(request);
		if (requestBadPort(request) === "blocked") response = makeNetworkError("bad port");
		if (request.referrerPolicy === "") request.referrerPolicy = request.policyContainer.referrerPolicy;
		if (request.referrer !== "no-referrer") request.referrer = determineRequestsReferrer(request);
		if (response === null) response = await (async () => {
			const currentURL = requestCurrentURL(request);
			if (sameOrigin(currentURL, request.url) && request.responseTainting === "basic" || currentURL.protocol === "data:" || request.mode === "navigate" || request.mode === "websocket") {
				request.responseTainting = "basic";
				return await schemeFetch(fetchParams);
			}
			if (request.mode === "same-origin") return makeNetworkError("request mode cannot be \"same-origin\"");
			if (request.mode === "no-cors") {
				if (request.redirect !== "follow") return makeNetworkError("redirect mode cannot be \"follow\" for \"no-cors\" request");
				request.responseTainting = "opaque";
				return await schemeFetch(fetchParams);
			}
			if (!urlIsHttpHttpsScheme(requestCurrentURL(request))) return makeNetworkError("URL scheme must be a HTTP(S) scheme");
			request.responseTainting = "cors";
			return await httpFetch(fetchParams);
		})();
		if (recursive) return response;
		if (response.status !== 0 && !response.internalResponse) {
			if (request.responseTainting === "cors") {}
			if (request.responseTainting === "basic") response = filterResponse(response, "basic");
			else if (request.responseTainting === "cors") response = filterResponse(response, "cors");
			else if (request.responseTainting === "opaque") response = filterResponse(response, "opaque");
			else assert$4(false);
		}
		let internalResponse = response.status === 0 ? response : response.internalResponse;
		if (internalResponse.urlList.length === 0) internalResponse.urlList.push(...request.urlList);
		if (!request.timingAllowFailed) response.timingAllowPassed = true;
		if (response.type === "opaque" && internalResponse.status === 206 && internalResponse.rangeRequested && !request.headers.contains("range", true)) response = internalResponse = makeNetworkError();
		if (response.status !== 0 && (request.method === "HEAD" || request.method === "CONNECT" || nullBodyStatus.includes(internalResponse.status))) {
			internalResponse.body = null;
			fetchParams.controller.dump = true;
		}
		if (request.integrity) {
			const processBodyError = (reason) => fetchFinale(fetchParams, makeNetworkError(reason));
			if (request.responseTainting === "opaque" || response.body == null) {
				processBodyError(response.error);
				return;
			}
			const processBody = (bytes) => {
				if (!bytesMatch(bytes, request.integrity)) {
					processBodyError("integrity mismatch");
					return;
				}
				response.body = safelyExtractBody(bytes)[0];
				fetchFinale(fetchParams, response);
			};
			await fullyReadBody(response.body, processBody, processBodyError);
		} else fetchFinale(fetchParams, response);
	}
	function schemeFetch(fetchParams) {
		if (isCancelled(fetchParams) && fetchParams.request.redirectCount === 0) return Promise.resolve(makeAppropriateNetworkError(fetchParams));
		const { request } = fetchParams;
		const { protocol: scheme } = requestCurrentURL(request);
		switch (scheme) {
			case "about:": return Promise.resolve(makeNetworkError("about scheme is not supported"));
			case "blob:": {
				if (!resolveObjectURL) resolveObjectURL = __require("node:buffer").resolveObjectURL;
				const blobURLEntry = requestCurrentURL(request);
				if (blobURLEntry.search.length !== 0) return Promise.resolve(makeNetworkError("NetworkError when attempting to fetch resource."));
				const blob = resolveObjectURL(blobURLEntry.toString());
				if (request.method !== "GET" || !isBlobLike(blob)) return Promise.resolve(makeNetworkError("invalid method"));
				const response = makeResponse();
				const fullLength = blob.size;
				const serializedFullLength = isomorphicEncode(`${fullLength}`);
				const type = blob.type;
				if (!request.headersList.contains("range", true)) {
					const bodyWithType = extractBody(blob);
					response.statusText = "OK";
					response.body = bodyWithType[0];
					response.headersList.set("content-length", serializedFullLength, true);
					response.headersList.set("content-type", type, true);
				} else {
					response.rangeRequested = true;
					const rangeValue = simpleRangeHeaderValue(request.headersList.get("range", true), true);
					if (rangeValue === "failure") return Promise.resolve(makeNetworkError("failed to fetch the data URL"));
					let { rangeStartValue: rangeStart, rangeEndValue: rangeEnd } = rangeValue;
					if (rangeStart === null) {
						rangeStart = fullLength - rangeEnd;
						rangeEnd = rangeStart + rangeEnd - 1;
					} else {
						if (rangeStart >= fullLength) return Promise.resolve(makeNetworkError("Range start is greater than the blob's size."));
						if (rangeEnd === null || rangeEnd >= fullLength) rangeEnd = fullLength - 1;
					}
					const slicedBlob = blob.slice(rangeStart, rangeEnd, type);
					response.body = extractBody(slicedBlob)[0];
					const serializedSlicedLength = isomorphicEncode(`${slicedBlob.size}`);
					const contentRange = buildContentRange(rangeStart, rangeEnd, fullLength);
					response.status = 206;
					response.statusText = "Partial Content";
					response.headersList.set("content-length", serializedSlicedLength, true);
					response.headersList.set("content-type", type, true);
					response.headersList.set("content-range", contentRange, true);
				}
				return Promise.resolve(response);
			}
			case "data:": {
				const dataURLStruct = dataURLProcessor(requestCurrentURL(request));
				if (dataURLStruct === "failure") return Promise.resolve(makeNetworkError("failed to fetch the data URL"));
				const mimeType = serializeAMimeType(dataURLStruct.mimeType);
				return Promise.resolve(makeResponse({
					statusText: "OK",
					headersList: [["content-type", {
						name: "Content-Type",
						value: mimeType
					}]],
					body: safelyExtractBody(dataURLStruct.body)[0]
				}));
			}
			case "file:": return Promise.resolve(makeNetworkError("not implemented... yet..."));
			case "http:":
			case "https:": return httpFetch(fetchParams).catch((err) => makeNetworkError(err));
			default: return Promise.resolve(makeNetworkError("unknown scheme"));
		}
	}
	function finalizeResponse(fetchParams, response) {
		fetchParams.request.done = true;
		if (fetchParams.processResponseDone != null) queueMicrotask(() => fetchParams.processResponseDone(response));
	}
	function fetchFinale(fetchParams, response) {
		let timingInfo = fetchParams.timingInfo;
		const processResponseEndOfBody = () => {
			const unsafeEndTime = Date.now();
			if (fetchParams.request.destination === "document") fetchParams.controller.fullTimingInfo = timingInfo;
			fetchParams.controller.reportTimingSteps = () => {
				if (fetchParams.request.url.protocol !== "https:") return;
				timingInfo.endTime = unsafeEndTime;
				let cacheState = response.cacheState;
				const bodyInfo = response.bodyInfo;
				if (!response.timingAllowPassed) {
					timingInfo = createOpaqueTimingInfo(timingInfo);
					cacheState = "";
				}
				let responseStatus = 0;
				if (fetchParams.request.mode !== "navigator" || !response.hasCrossOriginRedirects) {
					responseStatus = response.status;
					const mimeType = extractMimeType(response.headersList);
					if (mimeType !== "failure") bodyInfo.contentType = minimizeSupportedMimeType(mimeType);
				}
				if (fetchParams.request.initiatorType != null) markResourceTiming(timingInfo, fetchParams.request.url.href, fetchParams.request.initiatorType, globalThis, cacheState, bodyInfo, responseStatus);
			};
			const processResponseEndOfBodyTask = () => {
				fetchParams.request.done = true;
				if (fetchParams.processResponseEndOfBody != null) queueMicrotask(() => fetchParams.processResponseEndOfBody(response));
				if (fetchParams.request.initiatorType != null) fetchParams.controller.reportTimingSteps();
			};
			queueMicrotask(() => processResponseEndOfBodyTask());
		};
		if (fetchParams.processResponse != null) queueMicrotask(() => {
			fetchParams.processResponse(response);
			fetchParams.processResponse = null;
		});
		const internalResponse = response.type === "error" ? response : response.internalResponse ?? response;
		if (internalResponse.body == null) processResponseEndOfBody();
		else finished(internalResponse.body.stream, () => {
			processResponseEndOfBody();
		});
	}
	async function httpFetch(fetchParams) {
		const request = fetchParams.request;
		let response = null;
		let actualResponse = null;
		const timingInfo = fetchParams.timingInfo;
		if (request.serviceWorkers === "all") {}
		if (response === null) {
			if (request.redirect === "follow") request.serviceWorkers = "none";
			actualResponse = response = await httpNetworkOrCacheFetch(fetchParams);
			if (request.responseTainting === "cors" && corsCheck(request, response) === "failure") return makeNetworkError("cors failure");
			if (TAOCheck(request, response) === "failure") request.timingAllowFailed = true;
		}
		if ((request.responseTainting === "opaque" || response.type === "opaque") && crossOriginResourcePolicyCheck(request.origin, request.client, request.destination, actualResponse) === "blocked") return makeNetworkError("blocked");
		if (redirectStatusSet.has(actualResponse.status)) {
			if (request.redirect !== "manual") fetchParams.controller.connection.destroy(void 0, false);
			if (request.redirect === "error") response = makeNetworkError("unexpected redirect");
			else if (request.redirect === "manual") response = actualResponse;
			else if (request.redirect === "follow") response = await httpRedirectFetch(fetchParams, response);
			else assert$4(false);
		}
		response.timingInfo = timingInfo;
		return response;
	}
	function httpRedirectFetch(fetchParams, response) {
		const request = fetchParams.request;
		const actualResponse = response.internalResponse ? response.internalResponse : response;
		let locationURL;
		try {
			locationURL = responseLocationURL(actualResponse, requestCurrentURL(request).hash);
			if (locationURL == null) return response;
		} catch (err) {
			return Promise.resolve(makeNetworkError(err));
		}
		if (!urlIsHttpHttpsScheme(locationURL)) return Promise.resolve(makeNetworkError("URL scheme must be a HTTP(S) scheme"));
		if (request.redirectCount === 20) return Promise.resolve(makeNetworkError("redirect count exceeded"));
		request.redirectCount += 1;
		if (request.mode === "cors" && (locationURL.username || locationURL.password) && !sameOrigin(request, locationURL)) return Promise.resolve(makeNetworkError("cross origin not allowed for request mode \"cors\""));
		if (request.responseTainting === "cors" && (locationURL.username || locationURL.password)) return Promise.resolve(makeNetworkError("URL cannot contain credentials for request mode \"cors\""));
		if (actualResponse.status !== 303 && request.body != null && request.body.source == null) return Promise.resolve(makeNetworkError());
		if ([301, 302].includes(actualResponse.status) && request.method === "POST" || actualResponse.status === 303 && !GET_OR_HEAD.includes(request.method)) {
			request.method = "GET";
			request.body = null;
			for (const headerName of requestBodyHeader) request.headersList.delete(headerName);
		}
		if (!sameOrigin(requestCurrentURL(request), locationURL)) {
			request.headersList.delete("authorization", true);
			request.headersList.delete("proxy-authorization", true);
			request.headersList.delete("cookie", true);
			request.headersList.delete("host", true);
		}
		if (request.body != null) {
			assert$4(request.body.source != null);
			request.body = safelyExtractBody(request.body.source)[0];
		}
		const timingInfo = fetchParams.timingInfo;
		timingInfo.redirectEndTime = timingInfo.postRedirectStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
		if (timingInfo.redirectStartTime === 0) timingInfo.redirectStartTime = timingInfo.startTime;
		request.urlList.push(locationURL);
		setRequestReferrerPolicyOnRedirect(request, actualResponse);
		return mainFetch(fetchParams, true);
	}
	async function httpNetworkOrCacheFetch(fetchParams, isAuthenticationFetch = false, isNewConnectionFetch = false) {
		const request = fetchParams.request;
		let httpFetchParams = null;
		let httpRequest = null;
		let response = null;
		if (request.window === "no-window" && request.redirect === "error") {
			httpFetchParams = fetchParams;
			httpRequest = request;
		} else {
			httpRequest = cloneRequest(request);
			httpFetchParams = { ...fetchParams };
			httpFetchParams.request = httpRequest;
		}
		const includeCredentials = request.credentials === "include" || request.credentials === "same-origin" && request.responseTainting === "basic";
		const contentLength = httpRequest.body ? httpRequest.body.length : null;
		let contentLengthHeaderValue = null;
		if (httpRequest.body == null && ["POST", "PUT"].includes(httpRequest.method)) contentLengthHeaderValue = "0";
		if (contentLength != null) contentLengthHeaderValue = isomorphicEncode(`${contentLength}`);
		if (contentLengthHeaderValue != null) httpRequest.headersList.append("content-length", contentLengthHeaderValue, true);
		if (contentLength != null && httpRequest.keepalive) {}
		if (httpRequest.referrer instanceof URL) httpRequest.headersList.append("referer", isomorphicEncode(httpRequest.referrer.href), true);
		appendRequestOriginHeader(httpRequest);
		appendFetchMetadata(httpRequest);
		if (!httpRequest.headersList.contains("user-agent", true)) httpRequest.headersList.append("user-agent", defaultUserAgent);
		if (httpRequest.cache === "default" && (httpRequest.headersList.contains("if-modified-since", true) || httpRequest.headersList.contains("if-none-match", true) || httpRequest.headersList.contains("if-unmodified-since", true) || httpRequest.headersList.contains("if-match", true) || httpRequest.headersList.contains("if-range", true))) httpRequest.cache = "no-store";
		if (httpRequest.cache === "no-cache" && !httpRequest.preventNoCacheCacheControlHeaderModification && !httpRequest.headersList.contains("cache-control", true)) httpRequest.headersList.append("cache-control", "max-age=0", true);
		if (httpRequest.cache === "no-store" || httpRequest.cache === "reload") {
			if (!httpRequest.headersList.contains("pragma", true)) httpRequest.headersList.append("pragma", "no-cache", true);
			if (!httpRequest.headersList.contains("cache-control", true)) httpRequest.headersList.append("cache-control", "no-cache", true);
		}
		if (httpRequest.headersList.contains("range", true)) httpRequest.headersList.append("accept-encoding", "identity", true);
		if (!httpRequest.headersList.contains("accept-encoding", true)) {
			if (urlHasHttpsScheme(requestCurrentURL(httpRequest))) httpRequest.headersList.append("accept-encoding", "br, gzip, deflate", true);
			else httpRequest.headersList.append("accept-encoding", "gzip, deflate", true);
		}
		httpRequest.headersList.delete("host", true);
		if (includeCredentials) {}
		httpRequest.cache = "no-store";
		if (httpRequest.cache !== "no-store" && httpRequest.cache !== "reload") {}
		if (response == null) {
			if (httpRequest.cache === "only-if-cached") return makeNetworkError("only if cached");
			const forwardResponse = await httpNetworkFetch(httpFetchParams, includeCredentials, isNewConnectionFetch);
			if (!safeMethodsSet.has(httpRequest.method) && forwardResponse.status >= 200 && forwardResponse.status <= 399) {}
			if (response == null) response = forwardResponse;
		}
		response.urlList = [...httpRequest.urlList];
		if (httpRequest.headersList.contains("range", true)) response.rangeRequested = true;
		response.requestIncludesCredentials = includeCredentials;
		if (response.status === 407) {
			if (request.window === "no-window") return makeNetworkError();
			if (isCancelled(fetchParams)) return makeAppropriateNetworkError(fetchParams);
			return makeNetworkError("proxy authentication required");
		}
		if (response.status === 421 && !isNewConnectionFetch && (request.body == null || request.body.source != null)) {
			if (isCancelled(fetchParams)) return makeAppropriateNetworkError(fetchParams);
			fetchParams.controller.connection.destroy();
			response = await httpNetworkOrCacheFetch(fetchParams, isAuthenticationFetch, true);
		}
		if (isAuthenticationFetch) {}
		return response;
	}
	async function httpNetworkFetch(fetchParams, includeCredentials = false, forceNewConnection = false) {
		assert$4(!fetchParams.controller.connection || fetchParams.controller.connection.destroyed);
		fetchParams.controller.connection = {
			abort: null,
			destroyed: false,
			destroy(err, abort = true) {
				if (!this.destroyed) {
					this.destroyed = true;
					if (abort) this.abort?.(err ?? new DOMException("The operation was aborted.", "AbortError"));
				}
			}
		};
		const request = fetchParams.request;
		let response = null;
		const timingInfo = fetchParams.timingInfo;
		request.cache = "no-store";
		if (request.mode === "websocket") {}
		let requestBody = null;
		if (request.body == null && fetchParams.processRequestEndOfBody) queueMicrotask(() => fetchParams.processRequestEndOfBody());
		else if (request.body != null) {
			const processBodyChunk = async function* (bytes) {
				if (isCancelled(fetchParams)) return;
				yield bytes;
				fetchParams.processRequestBodyChunkLength?.(bytes.byteLength);
			};
			const processEndOfBody = () => {
				if (isCancelled(fetchParams)) return;
				if (fetchParams.processRequestEndOfBody) fetchParams.processRequestEndOfBody();
			};
			const processBodyError = (e) => {
				if (isCancelled(fetchParams)) return;
				if (e.name === "AbortError") fetchParams.controller.abort();
				else fetchParams.controller.terminate(e);
			};
			requestBody = (async function* () {
				try {
					for await (const bytes of request.body.stream) yield* processBodyChunk(bytes);
					processEndOfBody();
				} catch (err) {
					processBodyError(err);
				}
			})();
		}
		try {
			const { body, status, statusText, headersList, socket } = await dispatch({ body: requestBody });
			if (socket) response = makeResponse({
				status,
				statusText,
				headersList,
				socket
			});
			else {
				const iterator = body[Symbol.asyncIterator]();
				fetchParams.controller.next = () => iterator.next();
				response = makeResponse({
					status,
					statusText,
					headersList
				});
			}
		} catch (err) {
			if (err.name === "AbortError") {
				fetchParams.controller.connection.destroy();
				return makeAppropriateNetworkError(fetchParams, err);
			}
			return makeNetworkError(err);
		}
		const pullAlgorithm = async () => {
			await fetchParams.controller.resume();
		};
		const cancelAlgorithm = (reason) => {
			if (!isCancelled(fetchParams)) fetchParams.controller.abort(reason);
		};
		const stream = new ReadableStream({
			async start(controller) {
				fetchParams.controller.controller = controller;
			},
			async pull(controller) {
				await pullAlgorithm(controller);
			},
			async cancel(reason) {
				await cancelAlgorithm(reason);
			},
			type: "bytes"
		});
		response.body = {
			stream,
			source: null,
			length: null
		};
		fetchParams.controller.onAborted = onAborted;
		fetchParams.controller.on("terminated", onAborted);
		fetchParams.controller.resume = async () => {
			while (true) {
				let bytes;
				let isFailure;
				try {
					const { done, value } = await fetchParams.controller.next();
					if (isAborted(fetchParams)) break;
					bytes = done ? void 0 : value;
				} catch (err) {
					if (fetchParams.controller.ended && !timingInfo.encodedBodySize) bytes = void 0;
					else {
						bytes = err;
						isFailure = true;
					}
				}
				if (bytes === void 0) {
					readableStreamClose(fetchParams.controller.controller);
					finalizeResponse(fetchParams, response);
					return;
				}
				timingInfo.decodedBodySize += bytes?.byteLength ?? 0;
				if (isFailure) {
					fetchParams.controller.terminate(bytes);
					return;
				}
				const buffer = new Uint8Array(bytes);
				if (buffer.byteLength) fetchParams.controller.controller.enqueue(buffer);
				if (isErrored(stream)) {
					fetchParams.controller.terminate();
					return;
				}
				if (fetchParams.controller.controller.desiredSize <= 0) return;
			}
		};
		function onAborted(reason) {
			if (isAborted(fetchParams)) {
				response.aborted = true;
				if (isReadable(stream)) fetchParams.controller.controller.error(fetchParams.controller.serializedAbortReason);
			} else if (isReadable(stream)) fetchParams.controller.controller.error(new TypeError("terminated", { cause: isErrorLike(reason) ? reason : void 0 }));
			fetchParams.controller.connection.destroy();
		}
		return response;
		function dispatch({ body }) {
			const url = requestCurrentURL(request);
			/** @type {import('../..').Agent} */
			const agent = fetchParams.controller.dispatcher;
			return new Promise((resolve, reject) => agent.dispatch({
				path: url.pathname + url.search,
				origin: url.origin,
				method: request.method,
				body: agent.isMockActive ? request.body && (request.body.source || request.body.stream) : body,
				headers: request.headersList.entries,
				maxRedirections: 0,
				upgrade: request.mode === "websocket" ? "websocket" : void 0
			}, {
				body: null,
				abort: null,
				onConnect(abort) {
					const { connection } = fetchParams.controller;
					timingInfo.finalConnectionTimingInfo = clampAndCoarsenConnectionTimingInfo(void 0, timingInfo.postRedirectStartTime, fetchParams.crossOriginIsolatedCapability);
					if (connection.destroyed) abort(new DOMException("The operation was aborted.", "AbortError"));
					else {
						fetchParams.controller.on("terminated", abort);
						this.abort = connection.abort = abort;
					}
					timingInfo.finalNetworkRequestStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
				},
				onResponseStarted() {
					timingInfo.finalNetworkResponseStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
				},
				onHeaders(status, rawHeaders, resume, statusText) {
					if (status < 200) return;
					let location = "";
					const headersList = new HeadersList();
					for (let i = 0; i < rawHeaders.length; i += 2) headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString("latin1"), true);
					location = headersList.get("location", true);
					this.body = new Readable$1({ read: resume });
					const decoders = [];
					const willFollow = location && request.redirect === "follow" && redirectStatusSet.has(status);
					if (request.method !== "HEAD" && request.method !== "CONNECT" && !nullBodyStatus.includes(status) && !willFollow) {
						const contentEncoding = headersList.get("content-encoding", true);
						/** @type {string[]} */
						const codings = contentEncoding ? contentEncoding.toLowerCase().split(",") : [];
						const maxContentEncodings = 5;
						if (codings.length > maxContentEncodings) {
							reject(/* @__PURE__ */ new Error(`too many content-encodings in response: ${codings.length}, maximum allowed is ${maxContentEncodings}`));
							return true;
						}
						for (let i = codings.length - 1; i >= 0; --i) {
							const coding = codings[i].trim();
							if (coding === "x-gzip" || coding === "gzip") decoders.push(zlib.createGunzip({
								flush: zlib.constants.Z_SYNC_FLUSH,
								finishFlush: zlib.constants.Z_SYNC_FLUSH
							}));
							else if (coding === "deflate") decoders.push(createInflate({
								flush: zlib.constants.Z_SYNC_FLUSH,
								finishFlush: zlib.constants.Z_SYNC_FLUSH
							}));
							else if (coding === "br") decoders.push(zlib.createBrotliDecompress({
								flush: zlib.constants.BROTLI_OPERATION_FLUSH,
								finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
							}));
							else {
								decoders.length = 0;
								break;
							}
						}
					}
					const onError = this.onError.bind(this);
					resolve({
						status,
						statusText,
						headersList,
						body: decoders.length ? pipeline$1(this.body, ...decoders, (err) => {
							if (err) this.onError(err);
						}).on("error", onError) : this.body.on("error", onError)
					});
					return true;
				},
				onData(chunk) {
					if (fetchParams.controller.dump) return;
					const bytes = chunk;
					timingInfo.encodedBodySize += bytes.byteLength;
					return this.body.push(bytes);
				},
				onComplete() {
					if (this.abort) fetchParams.controller.off("terminated", this.abort);
					if (fetchParams.controller.onAborted) fetchParams.controller.off("terminated", fetchParams.controller.onAborted);
					fetchParams.controller.ended = true;
					this.body.push(null);
				},
				onError(error) {
					if (this.abort) fetchParams.controller.off("terminated", this.abort);
					this.body?.destroy(error);
					fetchParams.controller.terminate(error);
					reject(error);
				},
				onUpgrade(status, rawHeaders, socket) {
					if (status !== 101) return;
					const headersList = new HeadersList();
					for (let i = 0; i < rawHeaders.length; i += 2) headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString("latin1"), true);
					resolve({
						status,
						statusText: STATUS_CODES[status],
						headersList,
						socket
					});
					return true;
				}
			}));
		}
	}
	module.exports = {
		fetch,
		Fetch,
		fetching,
		finalizeAndReportTiming
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fileapi/symbols.js
var require_symbols$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kState: Symbol("FileReader state"),
		kResult: Symbol("FileReader result"),
		kError: Symbol("FileReader error"),
		kLastProgressEventFired: Symbol("FileReader last progress event fired timestamp"),
		kEvents: Symbol("FileReader events"),
		kAborted: Symbol("FileReader aborted")
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fileapi/progressevent.js
var require_progressevent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { webidl } = require_webidl();
	var kState = Symbol("ProgressEvent state");
	/**
	* @see https://xhr.spec.whatwg.org/#progressevent
	*/
	var ProgressEvent = class ProgressEvent extends Event {
		constructor(type, eventInitDict = {}) {
			type = webidl.converters.DOMString(type, "ProgressEvent constructor", "type");
			eventInitDict = webidl.converters.ProgressEventInit(eventInitDict ?? {});
			super(type, eventInitDict);
			this[kState] = {
				lengthComputable: eventInitDict.lengthComputable,
				loaded: eventInitDict.loaded,
				total: eventInitDict.total
			};
		}
		get lengthComputable() {
			webidl.brandCheck(this, ProgressEvent);
			return this[kState].lengthComputable;
		}
		get loaded() {
			webidl.brandCheck(this, ProgressEvent);
			return this[kState].loaded;
		}
		get total() {
			webidl.brandCheck(this, ProgressEvent);
			return this[kState].total;
		}
	};
	webidl.converters.ProgressEventInit = webidl.dictionaryConverter([
		{
			key: "lengthComputable",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "loaded",
			converter: webidl.converters["unsigned long long"],
			defaultValue: () => 0
		},
		{
			key: "total",
			converter: webidl.converters["unsigned long long"],
			defaultValue: () => 0
		},
		{
			key: "bubbles",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "cancelable",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "composed",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		}
	]);
	module.exports = { ProgressEvent };
}));
//#endregion
//#region node_modules/undici/lib/web/fileapi/encoding.js
var require_encoding = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* @see https://encoding.spec.whatwg.org/#concept-encoding-get
	* @param {string|undefined} label
	*/
	function getEncoding(label) {
		if (!label) return "failure";
		switch (label.trim().toLowerCase()) {
			case "unicode-1-1-utf-8":
			case "unicode11utf8":
			case "unicode20utf8":
			case "utf-8":
			case "utf8":
			case "x-unicode20utf8": return "UTF-8";
			case "866":
			case "cp866":
			case "csibm866":
			case "ibm866": return "IBM866";
			case "csisolatin2":
			case "iso-8859-2":
			case "iso-ir-101":
			case "iso8859-2":
			case "iso88592":
			case "iso_8859-2":
			case "iso_8859-2:1987":
			case "l2":
			case "latin2": return "ISO-8859-2";
			case "csisolatin3":
			case "iso-8859-3":
			case "iso-ir-109":
			case "iso8859-3":
			case "iso88593":
			case "iso_8859-3":
			case "iso_8859-3:1988":
			case "l3":
			case "latin3": return "ISO-8859-3";
			case "csisolatin4":
			case "iso-8859-4":
			case "iso-ir-110":
			case "iso8859-4":
			case "iso88594":
			case "iso_8859-4":
			case "iso_8859-4:1988":
			case "l4":
			case "latin4": return "ISO-8859-4";
			case "csisolatincyrillic":
			case "cyrillic":
			case "iso-8859-5":
			case "iso-ir-144":
			case "iso8859-5":
			case "iso88595":
			case "iso_8859-5":
			case "iso_8859-5:1988": return "ISO-8859-5";
			case "arabic":
			case "asmo-708":
			case "csiso88596e":
			case "csiso88596i":
			case "csisolatinarabic":
			case "ecma-114":
			case "iso-8859-6":
			case "iso-8859-6-e":
			case "iso-8859-6-i":
			case "iso-ir-127":
			case "iso8859-6":
			case "iso88596":
			case "iso_8859-6":
			case "iso_8859-6:1987": return "ISO-8859-6";
			case "csisolatingreek":
			case "ecma-118":
			case "elot_928":
			case "greek":
			case "greek8":
			case "iso-8859-7":
			case "iso-ir-126":
			case "iso8859-7":
			case "iso88597":
			case "iso_8859-7":
			case "iso_8859-7:1987":
			case "sun_eu_greek": return "ISO-8859-7";
			case "csiso88598e":
			case "csisolatinhebrew":
			case "hebrew":
			case "iso-8859-8":
			case "iso-8859-8-e":
			case "iso-ir-138":
			case "iso8859-8":
			case "iso88598":
			case "iso_8859-8":
			case "iso_8859-8:1988":
			case "visual": return "ISO-8859-8";
			case "csiso88598i":
			case "iso-8859-8-i":
			case "logical": return "ISO-8859-8-I";
			case "csisolatin6":
			case "iso-8859-10":
			case "iso-ir-157":
			case "iso8859-10":
			case "iso885910":
			case "l6":
			case "latin6": return "ISO-8859-10";
			case "iso-8859-13":
			case "iso8859-13":
			case "iso885913": return "ISO-8859-13";
			case "iso-8859-14":
			case "iso8859-14":
			case "iso885914": return "ISO-8859-14";
			case "csisolatin9":
			case "iso-8859-15":
			case "iso8859-15":
			case "iso885915":
			case "iso_8859-15":
			case "l9": return "ISO-8859-15";
			case "iso-8859-16": return "ISO-8859-16";
			case "cskoi8r":
			case "koi":
			case "koi8":
			case "koi8-r":
			case "koi8_r": return "KOI8-R";
			case "koi8-ru":
			case "koi8-u": return "KOI8-U";
			case "csmacintosh":
			case "mac":
			case "macintosh":
			case "x-mac-roman": return "macintosh";
			case "iso-8859-11":
			case "iso8859-11":
			case "iso885911":
			case "tis-620":
			case "windows-874": return "windows-874";
			case "cp1250":
			case "windows-1250":
			case "x-cp1250": return "windows-1250";
			case "cp1251":
			case "windows-1251":
			case "x-cp1251": return "windows-1251";
			case "ansi_x3.4-1968":
			case "ascii":
			case "cp1252":
			case "cp819":
			case "csisolatin1":
			case "ibm819":
			case "iso-8859-1":
			case "iso-ir-100":
			case "iso8859-1":
			case "iso88591":
			case "iso_8859-1":
			case "iso_8859-1:1987":
			case "l1":
			case "latin1":
			case "us-ascii":
			case "windows-1252":
			case "x-cp1252": return "windows-1252";
			case "cp1253":
			case "windows-1253":
			case "x-cp1253": return "windows-1253";
			case "cp1254":
			case "csisolatin5":
			case "iso-8859-9":
			case "iso-ir-148":
			case "iso8859-9":
			case "iso88599":
			case "iso_8859-9":
			case "iso_8859-9:1989":
			case "l5":
			case "latin5":
			case "windows-1254":
			case "x-cp1254": return "windows-1254";
			case "cp1255":
			case "windows-1255":
			case "x-cp1255": return "windows-1255";
			case "cp1256":
			case "windows-1256":
			case "x-cp1256": return "windows-1256";
			case "cp1257":
			case "windows-1257":
			case "x-cp1257": return "windows-1257";
			case "cp1258":
			case "windows-1258":
			case "x-cp1258": return "windows-1258";
			case "x-mac-cyrillic":
			case "x-mac-ukrainian": return "x-mac-cyrillic";
			case "chinese":
			case "csgb2312":
			case "csiso58gb231280":
			case "gb2312":
			case "gb_2312":
			case "gb_2312-80":
			case "gbk":
			case "iso-ir-58":
			case "x-gbk": return "GBK";
			case "gb18030": return "gb18030";
			case "big5":
			case "big5-hkscs":
			case "cn-big5":
			case "csbig5":
			case "x-x-big5": return "Big5";
			case "cseucpkdfmtjapanese":
			case "euc-jp":
			case "x-euc-jp": return "EUC-JP";
			case "csiso2022jp":
			case "iso-2022-jp": return "ISO-2022-JP";
			case "csshiftjis":
			case "ms932":
			case "ms_kanji":
			case "shift-jis":
			case "shift_jis":
			case "sjis":
			case "windows-31j":
			case "x-sjis": return "Shift_JIS";
			case "cseuckr":
			case "csksc56011987":
			case "euc-kr":
			case "iso-ir-149":
			case "korean":
			case "ks_c_5601-1987":
			case "ks_c_5601-1989":
			case "ksc5601":
			case "ksc_5601":
			case "windows-949": return "EUC-KR";
			case "csiso2022kr":
			case "hz-gb-2312":
			case "iso-2022-cn":
			case "iso-2022-cn-ext":
			case "iso-2022-kr":
			case "replacement": return "replacement";
			case "unicodefffe":
			case "utf-16be": return "UTF-16BE";
			case "csunicode":
			case "iso-10646-ucs-2":
			case "ucs-2":
			case "unicode":
			case "unicodefeff":
			case "utf-16":
			case "utf-16le": return "UTF-16LE";
			case "x-user-defined": return "x-user-defined";
			default: return "failure";
		}
	}
	module.exports = { getEncoding };
}));
//#endregion
//#region node_modules/undici/lib/web/fileapi/util.js
var require_util$5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kState, kError, kResult, kAborted, kLastProgressEventFired } = require_symbols$2();
	var { ProgressEvent } = require_progressevent();
	var { getEncoding } = require_encoding();
	var { serializeAMimeType, parseMIMEType } = require_data_url();
	var { types: types$1 } = __require("node:util");
	var { StringDecoder } = __require("string_decoder");
	var { btoa } = __require("node:buffer");
	/** @type {PropertyDescriptor} */
	var staticPropertyDescriptors = {
		enumerable: true,
		writable: false,
		configurable: false
	};
	/**
	* @see https://w3c.github.io/FileAPI/#readOperation
	* @param {import('./filereader').FileReader} fr
	* @param {import('buffer').Blob} blob
	* @param {string} type
	* @param {string?} encodingName
	*/
	function readOperation(fr, blob, type, encodingName) {
		if (fr[kState] === "loading") throw new DOMException("Invalid state", "InvalidStateError");
		fr[kState] = "loading";
		fr[kResult] = null;
		fr[kError] = null;
		const reader = blob.stream().getReader();
		/** @type {Uint8Array[]} */
		const bytes = [];
		let chunkPromise = reader.read();
		let isFirstChunk = true;
		(async () => {
			while (!fr[kAborted]) try {
				const { done, value } = await chunkPromise;
				if (isFirstChunk && !fr[kAborted]) queueMicrotask(() => {
					fireAProgressEvent("loadstart", fr);
				});
				isFirstChunk = false;
				if (!done && types$1.isUint8Array(value)) {
					bytes.push(value);
					if ((fr[kLastProgressEventFired] === void 0 || Date.now() - fr[kLastProgressEventFired] >= 50) && !fr[kAborted]) {
						fr[kLastProgressEventFired] = Date.now();
						queueMicrotask(() => {
							fireAProgressEvent("progress", fr);
						});
					}
					chunkPromise = reader.read();
				} else if (done) {
					queueMicrotask(() => {
						fr[kState] = "done";
						try {
							const result = packageData(bytes, type, blob.type, encodingName);
							if (fr[kAborted]) return;
							fr[kResult] = result;
							fireAProgressEvent("load", fr);
						} catch (error) {
							fr[kError] = error;
							fireAProgressEvent("error", fr);
						}
						if (fr[kState] !== "loading") fireAProgressEvent("loadend", fr);
					});
					break;
				}
			} catch (error) {
				if (fr[kAborted]) return;
				queueMicrotask(() => {
					fr[kState] = "done";
					fr[kError] = error;
					fireAProgressEvent("error", fr);
					if (fr[kState] !== "loading") fireAProgressEvent("loadend", fr);
				});
				break;
			}
		})();
	}
	/**
	* @see https://w3c.github.io/FileAPI/#fire-a-progress-event
	* @see https://dom.spec.whatwg.org/#concept-event-fire
	* @param {string} e The name of the event
	* @param {import('./filereader').FileReader} reader
	*/
	function fireAProgressEvent(e, reader) {
		const event = new ProgressEvent(e, {
			bubbles: false,
			cancelable: false
		});
		reader.dispatchEvent(event);
	}
	/**
	* @see https://w3c.github.io/FileAPI/#blob-package-data
	* @param {Uint8Array[]} bytes
	* @param {string} type
	* @param {string?} mimeType
	* @param {string?} encodingName
	*/
	function packageData(bytes, type, mimeType, encodingName) {
		switch (type) {
			case "DataURL": {
				let dataURL = "data:";
				const parsed = parseMIMEType(mimeType || "application/octet-stream");
				if (parsed !== "failure") dataURL += serializeAMimeType(parsed);
				dataURL += ";base64,";
				const decoder = new StringDecoder("latin1");
				for (const chunk of bytes) dataURL += btoa(decoder.write(chunk));
				dataURL += btoa(decoder.end());
				return dataURL;
			}
			case "Text": {
				let encoding = "failure";
				if (encodingName) encoding = getEncoding(encodingName);
				if (encoding === "failure" && mimeType) {
					const type = parseMIMEType(mimeType);
					if (type !== "failure") encoding = getEncoding(type.parameters.get("charset"));
				}
				if (encoding === "failure") encoding = "UTF-8";
				return decode(bytes, encoding);
			}
			case "ArrayBuffer": return combineByteSequences(bytes).buffer;
			case "BinaryString": {
				let binaryString = "";
				const decoder = new StringDecoder("latin1");
				for (const chunk of bytes) binaryString += decoder.write(chunk);
				binaryString += decoder.end();
				return binaryString;
			}
		}
	}
	/**
	* @see https://encoding.spec.whatwg.org/#decode
	* @param {Uint8Array[]} ioQueue
	* @param {string} encoding
	*/
	function decode(ioQueue, encoding) {
		const bytes = combineByteSequences(ioQueue);
		const BOMEncoding = BOMSniffing(bytes);
		let slice = 0;
		if (BOMEncoding !== null) {
			encoding = BOMEncoding;
			slice = BOMEncoding === "UTF-8" ? 3 : 2;
		}
		const sliced = bytes.slice(slice);
		return new TextDecoder(encoding).decode(sliced);
	}
	/**
	* @see https://encoding.spec.whatwg.org/#bom-sniff
	* @param {Uint8Array} ioQueue
	*/
	function BOMSniffing(ioQueue) {
		const [a, b, c] = ioQueue;
		if (a === 239 && b === 187 && c === 191) return "UTF-8";
		else if (a === 254 && b === 255) return "UTF-16BE";
		else if (a === 255 && b === 254) return "UTF-16LE";
		return null;
	}
	/**
	* @param {Uint8Array[]} sequences
	*/
	function combineByteSequences(sequences) {
		const size = sequences.reduce((a, b) => {
			return a + b.byteLength;
		}, 0);
		let offset = 0;
		return sequences.reduce((a, b) => {
			a.set(b, offset);
			offset += b.byteLength;
			return a;
		}, new Uint8Array(size));
	}
	module.exports = {
		staticPropertyDescriptors,
		readOperation,
		fireAProgressEvent
	};
}));
//#endregion
//#region node_modules/undici/lib/web/fileapi/filereader.js
var require_filereader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { staticPropertyDescriptors, readOperation, fireAProgressEvent } = require_util$5();
	var { kState, kError, kResult, kEvents, kAborted } = require_symbols$2();
	var { webidl } = require_webidl();
	var { kEnumerableProperty } = require_util$8();
	var FileReader = class FileReader extends EventTarget {
		constructor() {
			super();
			this[kState] = "empty";
			this[kResult] = null;
			this[kError] = null;
			this[kEvents] = {
				loadend: null,
				error: null,
				abort: null,
				load: null,
				progress: null,
				loadstart: null
			};
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dfn-readAsArrayBuffer
		* @param {import('buffer').Blob} blob
		*/
		readAsArrayBuffer(blob) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsArrayBuffer");
			blob = webidl.converters.Blob(blob, { strict: false });
			readOperation(this, blob, "ArrayBuffer");
		}
		/**
		* @see https://w3c.github.io/FileAPI/#readAsBinaryString
		* @param {import('buffer').Blob} blob
		*/
		readAsBinaryString(blob) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsBinaryString");
			blob = webidl.converters.Blob(blob, { strict: false });
			readOperation(this, blob, "BinaryString");
		}
		/**
		* @see https://w3c.github.io/FileAPI/#readAsDataText
		* @param {import('buffer').Blob} blob
		* @param {string?} encoding
		*/
		readAsText(blob, encoding = void 0) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsText");
			blob = webidl.converters.Blob(blob, { strict: false });
			if (encoding !== void 0) encoding = webidl.converters.DOMString(encoding, "FileReader.readAsText", "encoding");
			readOperation(this, blob, "Text", encoding);
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dfn-readAsDataURL
		* @param {import('buffer').Blob} blob
		*/
		readAsDataURL(blob) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsDataURL");
			blob = webidl.converters.Blob(blob, { strict: false });
			readOperation(this, blob, "DataURL");
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dfn-abort
		*/
		abort() {
			if (this[kState] === "empty" || this[kState] === "done") {
				this[kResult] = null;
				return;
			}
			if (this[kState] === "loading") {
				this[kState] = "done";
				this[kResult] = null;
			}
			this[kAborted] = true;
			fireAProgressEvent("abort", this);
			if (this[kState] !== "loading") fireAProgressEvent("loadend", this);
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dom-filereader-readystate
		*/
		get readyState() {
			webidl.brandCheck(this, FileReader);
			switch (this[kState]) {
				case "empty": return this.EMPTY;
				case "loading": return this.LOADING;
				case "done": return this.DONE;
			}
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dom-filereader-result
		*/
		get result() {
			webidl.brandCheck(this, FileReader);
			return this[kResult];
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dom-filereader-error
		*/
		get error() {
			webidl.brandCheck(this, FileReader);
			return this[kError];
		}
		get onloadend() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].loadend;
		}
		set onloadend(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].loadend) this.removeEventListener("loadend", this[kEvents].loadend);
			if (typeof fn === "function") {
				this[kEvents].loadend = fn;
				this.addEventListener("loadend", fn);
			} else this[kEvents].loadend = null;
		}
		get onerror() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].error;
		}
		set onerror(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].error) this.removeEventListener("error", this[kEvents].error);
			if (typeof fn === "function") {
				this[kEvents].error = fn;
				this.addEventListener("error", fn);
			} else this[kEvents].error = null;
		}
		get onloadstart() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].loadstart;
		}
		set onloadstart(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].loadstart) this.removeEventListener("loadstart", this[kEvents].loadstart);
			if (typeof fn === "function") {
				this[kEvents].loadstart = fn;
				this.addEventListener("loadstart", fn);
			} else this[kEvents].loadstart = null;
		}
		get onprogress() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].progress;
		}
		set onprogress(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].progress) this.removeEventListener("progress", this[kEvents].progress);
			if (typeof fn === "function") {
				this[kEvents].progress = fn;
				this.addEventListener("progress", fn);
			} else this[kEvents].progress = null;
		}
		get onload() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].load;
		}
		set onload(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].load) this.removeEventListener("load", this[kEvents].load);
			if (typeof fn === "function") {
				this[kEvents].load = fn;
				this.addEventListener("load", fn);
			} else this[kEvents].load = null;
		}
		get onabort() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].abort;
		}
		set onabort(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].abort) this.removeEventListener("abort", this[kEvents].abort);
			if (typeof fn === "function") {
				this[kEvents].abort = fn;
				this.addEventListener("abort", fn);
			} else this[kEvents].abort = null;
		}
	};
	FileReader.EMPTY = FileReader.prototype.EMPTY = 0;
	FileReader.LOADING = FileReader.prototype.LOADING = 1;
	FileReader.DONE = FileReader.prototype.DONE = 2;
	Object.defineProperties(FileReader.prototype, {
		EMPTY: staticPropertyDescriptors,
		LOADING: staticPropertyDescriptors,
		DONE: staticPropertyDescriptors,
		readAsArrayBuffer: kEnumerableProperty,
		readAsBinaryString: kEnumerableProperty,
		readAsText: kEnumerableProperty,
		readAsDataURL: kEnumerableProperty,
		abort: kEnumerableProperty,
		readyState: kEnumerableProperty,
		result: kEnumerableProperty,
		error: kEnumerableProperty,
		onloadstart: kEnumerableProperty,
		onprogress: kEnumerableProperty,
		onload: kEnumerableProperty,
		onabort: kEnumerableProperty,
		onerror: kEnumerableProperty,
		onloadend: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "FileReader",
			writable: false,
			enumerable: false,
			configurable: true
		}
	});
	Object.defineProperties(FileReader, {
		EMPTY: staticPropertyDescriptors,
		LOADING: staticPropertyDescriptors,
		DONE: staticPropertyDescriptors
	});
	module.exports = { FileReader };
}));
//#endregion
//#region node_modules/undici/lib/web/cache/symbols.js
var require_symbols$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = { kConstruct: require_symbols$4().kConstruct };
}));
//#endregion
//#region node_modules/undici/lib/web/cache/util.js
var require_util$4 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var assert$3 = __require("node:assert");
	var { URLSerializer } = require_data_url();
	var { isValidHeaderName } = require_util$7();
	/**
	* @see https://url.spec.whatwg.org/#concept-url-equals
	* @param {URL} A
	* @param {URL} B
	* @param {boolean | undefined} excludeFragment
	* @returns {boolean}
	*/
	function urlEquals(A, B, excludeFragment = false) {
		return URLSerializer(A, excludeFragment) === URLSerializer(B, excludeFragment);
	}
	/**
	* @see https://github.com/chromium/chromium/blob/694d20d134cb553d8d89e5500b9148012b1ba299/content/browser/cache_storage/cache_storage_cache.cc#L260-L262
	* @param {string} header
	*/
	function getFieldValues(header) {
		assert$3(header !== null);
		const values = [];
		for (let value of header.split(",")) {
			value = value.trim();
			if (isValidHeaderName(value)) values.push(value);
		}
		return values;
	}
	module.exports = {
		urlEquals,
		getFieldValues
	};
}));
//#endregion
//#region node_modules/undici/lib/web/cache/cache.js
var require_cache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kConstruct } = require_symbols$1();
	var { urlEquals, getFieldValues } = require_util$4();
	var { kEnumerableProperty, isDisturbed } = require_util$8();
	var { webidl } = require_webidl();
	var { Response, cloneResponse, fromInnerResponse } = require_response();
	var { Request, fromInnerRequest } = require_request();
	var { kState } = require_symbols$3();
	var { fetching } = require_fetch();
	var { urlIsHttpHttpsScheme, createDeferredPromise, readAllBytes } = require_util$7();
	var assert$2 = __require("node:assert");
	/**
	* @see https://w3c.github.io/ServiceWorker/#dfn-cache-batch-operation
	* @typedef {Object} CacheBatchOperation
	* @property {'delete' | 'put'} type
	* @property {any} request
	* @property {any} response
	* @property {import('../../types/cache').CacheQueryOptions} options
	*/
	/**
	* @see https://w3c.github.io/ServiceWorker/#dfn-request-response-list
	* @typedef {[any, any][]} requestResponseList
	*/
	var Cache = class Cache {
		/**
		* @see https://w3c.github.io/ServiceWorker/#dfn-relevant-request-response-list
		* @type {requestResponseList}
		*/
		#relevantRequestResponseList;
		constructor() {
			if (arguments[0] !== kConstruct) webidl.illegalConstructor();
			webidl.util.markAsUncloneable(this);
			this.#relevantRequestResponseList = arguments[1];
		}
		async match(request, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.match";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			const p = this.#internalMatchAll(request, options, 1);
			if (p.length === 0) return;
			return p[0];
		}
		async matchAll(request = void 0, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.matchAll";
			if (request !== void 0) request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			return this.#internalMatchAll(request, options);
		}
		async add(request) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.add";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			const requests = [request];
			return await this.addAll(requests);
		}
		async addAll(requests) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.addAll";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			const responsePromises = [];
			const requestList = [];
			for (let request of requests) {
				if (request === void 0) throw webidl.errors.conversionFailed({
					prefix,
					argument: "Argument 1",
					types: ["undefined is not allowed"]
				});
				request = webidl.converters.RequestInfo(request);
				if (typeof request === "string") continue;
				const r = request[kState];
				if (!urlIsHttpHttpsScheme(r.url) || r.method !== "GET") throw webidl.errors.exception({
					header: prefix,
					message: "Expected http/s scheme when method is not GET."
				});
			}
			/** @type {ReturnType<typeof fetching>[]} */
			const fetchControllers = [];
			for (const request of requests) {
				const r = new Request(request)[kState];
				if (!urlIsHttpHttpsScheme(r.url)) throw webidl.errors.exception({
					header: prefix,
					message: "Expected http/s scheme."
				});
				r.initiator = "fetch";
				r.destination = "subresource";
				requestList.push(r);
				const responsePromise = createDeferredPromise();
				fetchControllers.push(fetching({
					request: r,
					processResponse(response) {
						if (response.type === "error" || response.status === 206 || response.status < 200 || response.status > 299) responsePromise.reject(webidl.errors.exception({
							header: "Cache.addAll",
							message: "Received an invalid status code or the request failed."
						}));
						else if (response.headersList.contains("vary")) {
							const fieldValues = getFieldValues(response.headersList.get("vary"));
							for (const fieldValue of fieldValues) if (fieldValue === "*") {
								responsePromise.reject(webidl.errors.exception({
									header: "Cache.addAll",
									message: "invalid vary field value"
								}));
								for (const controller of fetchControllers) controller.abort();
								return;
							}
						}
					},
					processResponseEndOfBody(response) {
						if (response.aborted) {
							responsePromise.reject(new DOMException("aborted", "AbortError"));
							return;
						}
						responsePromise.resolve(response);
					}
				}));
				responsePromises.push(responsePromise.promise);
			}
			const responses = await Promise.all(responsePromises);
			const operations = [];
			let index = 0;
			for (const response of responses) {
				/** @type {CacheBatchOperation} */
				const operation = {
					type: "put",
					request: requestList[index],
					response
				};
				operations.push(operation);
				index++;
			}
			const cacheJobPromise = createDeferredPromise();
			let errorData = null;
			try {
				this.#batchCacheOperations(operations);
			} catch (e) {
				errorData = e;
			}
			queueMicrotask(() => {
				if (errorData === null) cacheJobPromise.resolve(void 0);
				else cacheJobPromise.reject(errorData);
			});
			return cacheJobPromise.promise;
		}
		async put(request, response) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.put";
			webidl.argumentLengthCheck(arguments, 2, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			response = webidl.converters.Response(response, prefix, "response");
			let innerRequest = null;
			if (request instanceof Request) innerRequest = request[kState];
			else innerRequest = new Request(request)[kState];
			if (!urlIsHttpHttpsScheme(innerRequest.url) || innerRequest.method !== "GET") throw webidl.errors.exception({
				header: prefix,
				message: "Expected an http/s scheme when method is not GET"
			});
			const innerResponse = response[kState];
			if (innerResponse.status === 206) throw webidl.errors.exception({
				header: prefix,
				message: "Got 206 status"
			});
			if (innerResponse.headersList.contains("vary")) {
				const fieldValues = getFieldValues(innerResponse.headersList.get("vary"));
				for (const fieldValue of fieldValues) if (fieldValue === "*") throw webidl.errors.exception({
					header: prefix,
					message: "Got * vary field value"
				});
			}
			if (innerResponse.body && (isDisturbed(innerResponse.body.stream) || innerResponse.body.stream.locked)) throw webidl.errors.exception({
				header: prefix,
				message: "Response body is locked or disturbed"
			});
			const clonedResponse = cloneResponse(innerResponse);
			const bodyReadPromise = createDeferredPromise();
			if (innerResponse.body != null) readAllBytes(innerResponse.body.stream.getReader()).then(bodyReadPromise.resolve, bodyReadPromise.reject);
			else bodyReadPromise.resolve(void 0);
			/** @type {CacheBatchOperation[]} */
			const operations = [];
			/** @type {CacheBatchOperation} */
			const operation = {
				type: "put",
				request: innerRequest,
				response: clonedResponse
			};
			operations.push(operation);
			const bytes = await bodyReadPromise.promise;
			if (clonedResponse.body != null) clonedResponse.body.source = bytes;
			const cacheJobPromise = createDeferredPromise();
			let errorData = null;
			try {
				this.#batchCacheOperations(operations);
			} catch (e) {
				errorData = e;
			}
			queueMicrotask(() => {
				if (errorData === null) cacheJobPromise.resolve();
				else cacheJobPromise.reject(errorData);
			});
			return cacheJobPromise.promise;
		}
		async delete(request, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.delete";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			/**
			* @type {Request}
			*/
			let r = null;
			if (request instanceof Request) {
				r = request[kState];
				if (r.method !== "GET" && !options.ignoreMethod) return false;
			} else {
				assert$2(typeof request === "string");
				r = new Request(request)[kState];
			}
			/** @type {CacheBatchOperation[]} */
			const operations = [];
			/** @type {CacheBatchOperation} */
			const operation = {
				type: "delete",
				request: r,
				options
			};
			operations.push(operation);
			const cacheJobPromise = createDeferredPromise();
			let errorData = null;
			let requestResponses;
			try {
				requestResponses = this.#batchCacheOperations(operations);
			} catch (e) {
				errorData = e;
			}
			queueMicrotask(() => {
				if (errorData === null) cacheJobPromise.resolve(!!requestResponses?.length);
				else cacheJobPromise.reject(errorData);
			});
			return cacheJobPromise.promise;
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#dom-cache-keys
		* @param {any} request
		* @param {import('../../types/cache').CacheQueryOptions} options
		* @returns {Promise<readonly Request[]>}
		*/
		async keys(request = void 0, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.keys";
			if (request !== void 0) request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			let r = null;
			if (request !== void 0) {
				if (request instanceof Request) {
					r = request[kState];
					if (r.method !== "GET" && !options.ignoreMethod) return [];
				} else if (typeof request === "string") r = new Request(request)[kState];
			}
			const promise = createDeferredPromise();
			const requests = [];
			if (request === void 0) for (const requestResponse of this.#relevantRequestResponseList) requests.push(requestResponse[0]);
			else {
				const requestResponses = this.#queryCache(r, options);
				for (const requestResponse of requestResponses) requests.push(requestResponse[0]);
			}
			queueMicrotask(() => {
				const requestList = [];
				for (const request of requests) {
					const requestObject = fromInnerRequest(request, new AbortController().signal, "immutable");
					requestList.push(requestObject);
				}
				promise.resolve(Object.freeze(requestList));
			});
			return promise.promise;
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#batch-cache-operations-algorithm
		* @param {CacheBatchOperation[]} operations
		* @returns {requestResponseList}
		*/
		#batchCacheOperations(operations) {
			const cache = this.#relevantRequestResponseList;
			const backupCache = [...cache];
			const addedItems = [];
			const resultList = [];
			try {
				for (const operation of operations) {
					if (operation.type !== "delete" && operation.type !== "put") throw webidl.errors.exception({
						header: "Cache.#batchCacheOperations",
						message: "operation type does not match \"delete\" or \"put\""
					});
					if (operation.type === "delete" && operation.response != null) throw webidl.errors.exception({
						header: "Cache.#batchCacheOperations",
						message: "delete operation should not have an associated response"
					});
					if (this.#queryCache(operation.request, operation.options, addedItems).length) throw new DOMException("???", "InvalidStateError");
					let requestResponses;
					if (operation.type === "delete") {
						requestResponses = this.#queryCache(operation.request, operation.options);
						if (requestResponses.length === 0) return [];
						for (const requestResponse of requestResponses) {
							const idx = cache.indexOf(requestResponse);
							assert$2(idx !== -1);
							cache.splice(idx, 1);
						}
					} else if (operation.type === "put") {
						if (operation.response == null) throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "put operation should have an associated response"
						});
						const r = operation.request;
						if (!urlIsHttpHttpsScheme(r.url)) throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "expected http or https scheme"
						});
						if (r.method !== "GET") throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "not get method"
						});
						if (operation.options != null) throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "options must not be defined"
						});
						requestResponses = this.#queryCache(operation.request);
						for (const requestResponse of requestResponses) {
							const idx = cache.indexOf(requestResponse);
							assert$2(idx !== -1);
							cache.splice(idx, 1);
						}
						cache.push([operation.request, operation.response]);
						addedItems.push([operation.request, operation.response]);
					}
					resultList.push([operation.request, operation.response]);
				}
				return resultList;
			} catch (e) {
				this.#relevantRequestResponseList.length = 0;
				this.#relevantRequestResponseList = backupCache;
				throw e;
			}
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#query-cache
		* @param {any} requestQuery
		* @param {import('../../types/cache').CacheQueryOptions} options
		* @param {requestResponseList} targetStorage
		* @returns {requestResponseList}
		*/
		#queryCache(requestQuery, options, targetStorage) {
			/** @type {requestResponseList} */
			const resultList = [];
			const storage = targetStorage ?? this.#relevantRequestResponseList;
			for (const requestResponse of storage) {
				const [cachedRequest, cachedResponse] = requestResponse;
				if (this.#requestMatchesCachedItem(requestQuery, cachedRequest, cachedResponse, options)) resultList.push(requestResponse);
			}
			return resultList;
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#request-matches-cached-item-algorithm
		* @param {any} requestQuery
		* @param {any} request
		* @param {any | null} response
		* @param {import('../../types/cache').CacheQueryOptions | undefined} options
		* @returns {boolean}
		*/
		#requestMatchesCachedItem(requestQuery, request, response = null, options) {
			const queryURL = new URL(requestQuery.url);
			const cachedURL = new URL(request.url);
			if (options?.ignoreSearch) {
				cachedURL.search = "";
				queryURL.search = "";
			}
			if (!urlEquals(queryURL, cachedURL, true)) return false;
			if (response == null || options?.ignoreVary || !response.headersList.contains("vary")) return true;
			const fieldValues = getFieldValues(response.headersList.get("vary"));
			for (const fieldValue of fieldValues) {
				if (fieldValue === "*") return false;
				if (request.headersList.get(fieldValue) !== requestQuery.headersList.get(fieldValue)) return false;
			}
			return true;
		}
		#internalMatchAll(request, options, maxResponses = Infinity) {
			let r = null;
			if (request !== void 0) {
				if (request instanceof Request) {
					r = request[kState];
					if (r.method !== "GET" && !options.ignoreMethod) return [];
				} else if (typeof request === "string") r = new Request(request)[kState];
			}
			const responses = [];
			if (request === void 0) for (const requestResponse of this.#relevantRequestResponseList) responses.push(requestResponse[1]);
			else {
				const requestResponses = this.#queryCache(r, options);
				for (const requestResponse of requestResponses) responses.push(requestResponse[1]);
			}
			const responseList = [];
			for (const response of responses) {
				const responseObject = fromInnerResponse(response, "immutable");
				responseList.push(responseObject.clone());
				if (responseList.length >= maxResponses) break;
			}
			return Object.freeze(responseList);
		}
	};
	Object.defineProperties(Cache.prototype, {
		[Symbol.toStringTag]: {
			value: "Cache",
			configurable: true
		},
		match: kEnumerableProperty,
		matchAll: kEnumerableProperty,
		add: kEnumerableProperty,
		addAll: kEnumerableProperty,
		put: kEnumerableProperty,
		delete: kEnumerableProperty,
		keys: kEnumerableProperty
	});
	var cacheQueryOptionConverters = [
		{
			key: "ignoreSearch",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "ignoreMethod",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "ignoreVary",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		}
	];
	webidl.converters.CacheQueryOptions = webidl.dictionaryConverter(cacheQueryOptionConverters);
	webidl.converters.MultiCacheQueryOptions = webidl.dictionaryConverter([...cacheQueryOptionConverters, {
		key: "cacheName",
		converter: webidl.converters.DOMString
	}]);
	webidl.converters.Response = webidl.interfaceConverter(Response);
	webidl.converters["sequence<RequestInfo>"] = webidl.sequenceConverter(webidl.converters.RequestInfo);
	module.exports = { Cache };
}));
//#endregion
//#region node_modules/undici/lib/web/cache/cachestorage.js
var require_cachestorage = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kConstruct } = require_symbols$1();
	var { Cache } = require_cache();
	var { webidl } = require_webidl();
	var { kEnumerableProperty } = require_util$8();
	var CacheStorage = class CacheStorage {
		/**
		* @see https://w3c.github.io/ServiceWorker/#dfn-relevant-name-to-cache-map
		* @type {Map<string, import('./cache').requestResponseList}
		*/
		#caches = /* @__PURE__ */ new Map();
		constructor() {
			if (arguments[0] !== kConstruct) webidl.illegalConstructor();
			webidl.util.markAsUncloneable(this);
		}
		async match(request, options = {}) {
			webidl.brandCheck(this, CacheStorage);
			webidl.argumentLengthCheck(arguments, 1, "CacheStorage.match");
			request = webidl.converters.RequestInfo(request);
			options = webidl.converters.MultiCacheQueryOptions(options);
			if (options.cacheName != null) {
				if (this.#caches.has(options.cacheName)) return await new Cache(kConstruct, this.#caches.get(options.cacheName)).match(request, options);
			} else for (const cacheList of this.#caches.values()) {
				const response = await new Cache(kConstruct, cacheList).match(request, options);
				if (response !== void 0) return response;
			}
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#cache-storage-has
		* @param {string} cacheName
		* @returns {Promise<boolean>}
		*/
		async has(cacheName) {
			webidl.brandCheck(this, CacheStorage);
			const prefix = "CacheStorage.has";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
			return this.#caches.has(cacheName);
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#dom-cachestorage-open
		* @param {string} cacheName
		* @returns {Promise<Cache>}
		*/
		async open(cacheName) {
			webidl.brandCheck(this, CacheStorage);
			const prefix = "CacheStorage.open";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
			if (this.#caches.has(cacheName)) return new Cache(kConstruct, this.#caches.get(cacheName));
			const cache = [];
			this.#caches.set(cacheName, cache);
			return new Cache(kConstruct, cache);
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#cache-storage-delete
		* @param {string} cacheName
		* @returns {Promise<boolean>}
		*/
		async delete(cacheName) {
			webidl.brandCheck(this, CacheStorage);
			const prefix = "CacheStorage.delete";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
			return this.#caches.delete(cacheName);
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#cache-storage-keys
		* @returns {Promise<string[]>}
		*/
		async keys() {
			webidl.brandCheck(this, CacheStorage);
			return [...this.#caches.keys()];
		}
	};
	Object.defineProperties(CacheStorage.prototype, {
		[Symbol.toStringTag]: {
			value: "CacheStorage",
			configurable: true
		},
		match: kEnumerableProperty,
		has: kEnumerableProperty,
		open: kEnumerableProperty,
		delete: kEnumerableProperty,
		keys: kEnumerableProperty
	});
	module.exports = { CacheStorage };
}));
//#endregion
//#region node_modules/undici/lib/web/cookies/constants.js
var require_constants$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		maxAttributeValueSize: 1024,
		maxNameValuePairSize: 4096
	};
}));
//#endregion
//#region node_modules/undici/lib/web/cookies/util.js
var require_util$3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* @param {string} value
	* @returns {boolean}
	*/
	function isCTLExcludingHtab(value) {
		for (let i = 0; i < value.length; ++i) {
			const code = value.charCodeAt(i);
			if (code >= 0 && code <= 8 || code >= 10 && code <= 31 || code === 127) return true;
		}
		return false;
	}
	/**
	CHAR           = <any US-ASCII character (octets 0 - 127)>
	token          = 1*<any CHAR except CTLs or separators>
	separators     = "(" | ")" | "<" | ">" | "@"
	| "," | ";" | ":" | "\" | <">
	| "/" | "[" | "]" | "?" | "="
	| "{" | "}" | SP | HT
	* @param {string} name
	*/
	function validateCookieName(name) {
		for (let i = 0; i < name.length; ++i) {
			const code = name.charCodeAt(i);
			if (code < 33 || code > 126 || code === 34 || code === 40 || code === 41 || code === 60 || code === 62 || code === 64 || code === 44 || code === 59 || code === 58 || code === 92 || code === 47 || code === 91 || code === 93 || code === 63 || code === 61 || code === 123 || code === 125) throw new Error("Invalid cookie name");
		}
	}
	/**
	cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
	cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
	; US-ASCII characters excluding CTLs,
	; whitespace DQUOTE, comma, semicolon,
	; and backslash
	* @param {string} value
	*/
	function validateCookieValue(value) {
		let len = value.length;
		let i = 0;
		if (value[0] === "\"") {
			if (len === 1 || value[len - 1] !== "\"") throw new Error("Invalid cookie value");
			--len;
			++i;
		}
		while (i < len) {
			const code = value.charCodeAt(i++);
			if (code < 33 || code > 126 || code === 34 || code === 44 || code === 59 || code === 92) throw new Error("Invalid cookie value");
		}
	}
	/**
	* path-value        = <any CHAR except CTLs or ";">
	* @param {string} path
	*/
	function validateCookiePath(path) {
		for (let i = 0; i < path.length; ++i) {
			const code = path.charCodeAt(i);
			if (code < 32 || code > 126 || code === 59) throw new Error("Invalid cookie path");
		}
	}
	/**
	* <let-dig> ::= <letter> | <digit>
	*
	* <letter> ::= any one of the 52 alphabetic characters A through Z in
	* upper case and a through z in lower case
	*
	* <digit> ::= any one of the ten digits 0 through 9r
	*
	* @see https://www.rfc-editor.org/rfc/rfc1034#section-3.5
	* @param {number} code
	*/
	function isLetterOrDigit(code) {
		return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
	}
	/**
	* Validates a cookie domain against the "preferred name syntax".
	*
	* <domain>      ::= <subdomain> | " "
	* <subdomain>   ::= <label> | <subdomain> "." <label>
	* <label>       ::= <let-dig> [ [ <ldh-str> ] <let-dig> ]
	* <ldh-str>     ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
	* <let-dig-hyp> ::= <let-dig> | "-"
	*
	* @see https://www.rfc-editor.org/rfc/rfc1034#section-3.5
	* @see https://www.rfc-editor.org/rfc/rfc1123#section-2.1
	* @see https://www.rfc-editor.org/rfc/rfc1035#section-2.3.4
	* @param {string} domain
	*/
	function validateCookieDomain(domain) {
		if (domain === " ") return;
		if (domain.length > 255) throw new Error("Invalid cookie domain");
		let labelLength = 0;
		for (let i = 0; i < domain.length; ++i) {
			const code = domain.charCodeAt(i);
			if (code === 46) {
				if (labelLength === 0) throw new Error("Invalid cookie domain");
				if (domain.charCodeAt(i - 1) === 45) throw new Error("Invalid cookie domain");
				labelLength = 0;
				continue;
			}
			if (labelLength === 0 && !isLetterOrDigit(code)) throw new Error("Invalid cookie domain");
			if (!isLetterOrDigit(code) && code !== 45) throw new Error("Invalid cookie domain");
			if (++labelLength > 63) throw new Error("Invalid cookie domain");
		}
		if (labelLength === 0 || domain.charCodeAt(domain.length - 1) === 45) throw new Error("Invalid cookie domain");
	}
	var IMFDays = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	];
	var IMFMonths = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	var IMFPaddedNumbers = Array(61).fill(0).map((_, i) => i.toString().padStart(2, "0"));
	/**
	* @see https://www.rfc-editor.org/rfc/rfc7231#section-7.1.1.1
	* @param {number|Date} date
	IMF-fixdate  = day-name "," SP date1 SP time-of-day SP GMT
	; fixed length/zone/capitalization subset of the format
	; see Section 3.3 of [RFC5322]
	
	day-name     = %x4D.6F.6E ; "Mon", case-sensitive
	/ %x54.75.65 ; "Tue", case-sensitive
	/ %x57.65.64 ; "Wed", case-sensitive
	/ %x54.68.75 ; "Thu", case-sensitive
	/ %x46.72.69 ; "Fri", case-sensitive
	/ %x53.61.74 ; "Sat", case-sensitive
	/ %x53.75.6E ; "Sun", case-sensitive
	date1        = day SP month SP year
	; e.g., 02 Jun 1982
	
	day          = 2DIGIT
	month        = %x4A.61.6E ; "Jan", case-sensitive
	/ %x46.65.62 ; "Feb", case-sensitive
	/ %x4D.61.72 ; "Mar", case-sensitive
	/ %x41.70.72 ; "Apr", case-sensitive
	/ %x4D.61.79 ; "May", case-sensitive
	/ %x4A.75.6E ; "Jun", case-sensitive
	/ %x4A.75.6C ; "Jul", case-sensitive
	/ %x41.75.67 ; "Aug", case-sensitive
	/ %x53.65.70 ; "Sep", case-sensitive
	/ %x4F.63.74 ; "Oct", case-sensitive
	/ %x4E.6F.76 ; "Nov", case-sensitive
	/ %x44.65.63 ; "Dec", case-sensitive
	year         = 4DIGIT
	
	GMT          = %x47.4D.54 ; "GMT", case-sensitive
	
	time-of-day  = hour ":" minute ":" second
	; 00:00:00 - 23:59:60 (leap second)
	
	hour         = 2DIGIT
	minute       = 2DIGIT
	second       = 2DIGIT
	*/
	function toIMFDate(date) {
		if (typeof date === "number") date = new Date(date);
		return `${IMFDays[date.getUTCDay()]}, ${IMFPaddedNumbers[date.getUTCDate()]} ${IMFMonths[date.getUTCMonth()]} ${date.getUTCFullYear()} ${IMFPaddedNumbers[date.getUTCHours()]}:${IMFPaddedNumbers[date.getUTCMinutes()]}:${IMFPaddedNumbers[date.getUTCSeconds()]} GMT`;
	}
	/**
	max-age-av        = "Max-Age=" non-zero-digit *DIGIT
	; In practice, both expires-av and max-age-av
	; are limited to dates representable by the
	; user agent.
	* @param {number} maxAge
	*/
	function validateCookieMaxAge(maxAge) {
		if (maxAge < 0) throw new Error("Invalid cookie max-age");
	}
	/**
	* @see https://www.rfc-editor.org/rfc/rfc6265#section-4.1.1
	* @param {import('./index').Cookie} cookie
	*/
	function stringify(cookie) {
		if (cookie.name.length === 0) return null;
		validateCookieName(cookie.name);
		validateCookieValue(cookie.value);
		const out = [`${cookie.name}=${cookie.value}`];
		if (cookie.name.startsWith("__Secure-")) cookie.secure = true;
		if (cookie.name.startsWith("__Host-")) {
			cookie.secure = true;
			cookie.domain = null;
			cookie.path = "/";
		}
		if (cookie.secure) out.push("Secure");
		if (cookie.httpOnly) out.push("HttpOnly");
		if (typeof cookie.maxAge === "number") {
			validateCookieMaxAge(cookie.maxAge);
			out.push(`Max-Age=${cookie.maxAge}`);
		}
		if (cookie.domain) {
			validateCookieDomain(cookie.domain);
			out.push(`Domain=${cookie.domain}`);
		}
		if (cookie.path) {
			validateCookiePath(cookie.path);
			out.push(`Path=${cookie.path}`);
		}
		if (cookie.expires && cookie.expires.toString() !== "Invalid Date") out.push(`Expires=${toIMFDate(cookie.expires)}`);
		if (cookie.sameSite) out.push(`SameSite=${cookie.sameSite}`);
		for (const part of cookie.unparsed) {
			if (!part.includes("=")) throw new Error("Invalid unparsed");
			const [key, ...value] = part.split("=");
			const trimmedKey = key.trim();
			const joinedValue = value.join("=");
			validateCookieName(trimmedKey);
			validateCookieValue(joinedValue);
			out.push(`${trimmedKey}=${joinedValue}`);
		}
		return out.join("; ");
	}
	module.exports = {
		isCTLExcludingHtab,
		validateCookieName,
		validateCookiePath,
		validateCookieValue,
		toIMFDate,
		stringify
	};
}));
//#endregion
//#region node_modules/undici/lib/web/cookies/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { maxNameValuePairSize, maxAttributeValueSize } = require_constants$2();
	var { isCTLExcludingHtab } = require_util$3();
	var { collectASequenceOfCodePointsFast } = require_data_url();
	var assert$1 = __require("node:assert");
	/**
	* @description Parses the field-value attributes of a set-cookie header string.
	* @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4
	* @param {string} header
	* @returns if the header is invalid, null will be returned
	*/
	function parseSetCookie(header) {
		if (isCTLExcludingHtab(header)) return null;
		let nameValuePair = "";
		let unparsedAttributes = "";
		let name = "";
		let value = "";
		if (header.includes(";")) {
			const position = { position: 0 };
			nameValuePair = collectASequenceOfCodePointsFast(";", header, position);
			unparsedAttributes = header.slice(position.position);
		} else nameValuePair = header;
		if (!nameValuePair.includes("=")) value = nameValuePair;
		else {
			const position = { position: 0 };
			name = collectASequenceOfCodePointsFast("=", nameValuePair, position);
			value = nameValuePair.slice(position.position + 1);
		}
		name = name.trim();
		value = value.trim();
		if (name.length + value.length > maxNameValuePairSize) return null;
		return {
			name,
			value,
			...parseUnparsedAttributes(unparsedAttributes)
		};
	}
	/**
	* Parses the remaining attributes of a set-cookie header
	* @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4
	* @param {string} unparsedAttributes
	* @param {[Object.<string, unknown>]={}} cookieAttributeList
	*/
	function parseUnparsedAttributes(unparsedAttributes, cookieAttributeList = {}) {
		if (unparsedAttributes.length === 0) return cookieAttributeList;
		assert$1(unparsedAttributes[0] === ";");
		unparsedAttributes = unparsedAttributes.slice(1);
		let cookieAv = "";
		if (unparsedAttributes.includes(";")) {
			cookieAv = collectASequenceOfCodePointsFast(";", unparsedAttributes, { position: 0 });
			unparsedAttributes = unparsedAttributes.slice(cookieAv.length);
		} else {
			cookieAv = unparsedAttributes;
			unparsedAttributes = "";
		}
		let attributeName = "";
		let attributeValue = "";
		if (cookieAv.includes("=")) {
			const position = { position: 0 };
			attributeName = collectASequenceOfCodePointsFast("=", cookieAv, position);
			attributeValue = cookieAv.slice(position.position + 1);
		} else attributeName = cookieAv;
		attributeName = attributeName.trim();
		attributeValue = attributeValue.trim();
		if (attributeValue.length > maxAttributeValueSize) return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
		const attributeNameLowercase = attributeName.toLowerCase();
		if (attributeNameLowercase === "expires") cookieAttributeList.expires = new Date(attributeValue);
		else if (attributeNameLowercase === "max-age") {
			const charCode = attributeValue.charCodeAt(0);
			if ((charCode < 48 || charCode > 57) && attributeValue[0] !== "-") return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
			if (!/^\d+$/.test(attributeValue)) return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
			cookieAttributeList.maxAge = Number(attributeValue);
		} else if (attributeNameLowercase === "domain") {
			let cookieDomain = attributeValue;
			if (cookieDomain[0] === ".") cookieDomain = cookieDomain.slice(1);
			cookieDomain = cookieDomain.toLowerCase();
			cookieAttributeList.domain = cookieDomain;
		} else if (attributeNameLowercase === "path") {
			let cookiePath = "";
			if (attributeValue.length === 0 || attributeValue[0] !== "/") cookiePath = "/";
			else cookiePath = attributeValue;
			cookieAttributeList.path = cookiePath;
		} else if (attributeNameLowercase === "secure") cookieAttributeList.secure = true;
		else if (attributeNameLowercase === "httponly") cookieAttributeList.httpOnly = true;
		else if (attributeNameLowercase === "samesite") {
			const attributeValueLowercase = attributeValue.toLowerCase();
			if (attributeValueLowercase === "none") cookieAttributeList.sameSite = "None";
			else if (attributeValueLowercase === "strict") cookieAttributeList.sameSite = "Strict";
			else if (attributeValueLowercase === "lax") cookieAttributeList.sameSite = "Lax";
		} else {
			cookieAttributeList.unparsed ??= [];
			cookieAttributeList.unparsed.push(`${attributeName}=${attributeValue}`);
		}
		return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
	}
	module.exports = {
		parseSetCookie,
		parseUnparsedAttributes
	};
}));
//#endregion
//#region node_modules/undici/lib/web/cookies/index.js
var require_cookies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { parseSetCookie } = require_parse();
	var { stringify } = require_util$3();
	var { webidl } = require_webidl();
	var { Headers } = require_headers$1();
	/**
	* @typedef {Object} Cookie
	* @property {string} name
	* @property {string} value
	* @property {Date|number|undefined} expires
	* @property {number|undefined} maxAge
	* @property {string|undefined} domain
	* @property {string|undefined} path
	* @property {boolean|undefined} secure
	* @property {boolean|undefined} httpOnly
	* @property {'Strict'|'Lax'|'None'} sameSite
	* @property {string[]} unparsed
	*/
	/**
	* @param {Headers} headers
	* @returns {Record<string, string>}
	*/
	function getCookies(headers) {
		webidl.argumentLengthCheck(arguments, 1, "getCookies");
		webidl.brandCheck(headers, Headers, { strict: false });
		const cookie = headers.get("cookie");
		const out = {};
		if (!cookie) return out;
		for (const piece of cookie.split(";")) {
			const [name, ...value] = piece.split("=");
			out[name.trim()] = value.join("=");
		}
		return out;
	}
	/**
	* @param {Headers} headers
	* @param {string} name
	* @param {{ path?: string, domain?: string }|undefined} attributes
	* @returns {void}
	*/
	function deleteCookie(headers, name, attributes) {
		webidl.brandCheck(headers, Headers, { strict: false });
		const prefix = "deleteCookie";
		webidl.argumentLengthCheck(arguments, 2, prefix);
		name = webidl.converters.DOMString(name, prefix, "name");
		attributes = webidl.converters.DeleteCookieAttributes(attributes);
		setCookie(headers, {
			name,
			value: "",
			expires: /* @__PURE__ */ new Date(0),
			...attributes
		});
	}
	/**
	* @param {Headers} headers
	* @returns {Cookie[]}
	*/
	function getSetCookies(headers) {
		webidl.argumentLengthCheck(arguments, 1, "getSetCookies");
		webidl.brandCheck(headers, Headers, { strict: false });
		const cookies = headers.getSetCookie();
		if (!cookies) return [];
		return cookies.map((pair) => parseSetCookie(pair));
	}
	/**
	* @param {Headers} headers
	* @param {Cookie} cookie
	* @returns {void}
	*/
	function setCookie(headers, cookie) {
		webidl.argumentLengthCheck(arguments, 2, "setCookie");
		webidl.brandCheck(headers, Headers, { strict: false });
		cookie = webidl.converters.Cookie(cookie);
		const str = stringify(cookie);
		if (str) headers.append("Set-Cookie", str);
	}
	webidl.converters.DeleteCookieAttributes = webidl.dictionaryConverter([{
		converter: webidl.nullableConverter(webidl.converters.DOMString),
		key: "path",
		defaultValue: () => null
	}, {
		converter: webidl.nullableConverter(webidl.converters.DOMString),
		key: "domain",
		defaultValue: () => null
	}]);
	webidl.converters.Cookie = webidl.dictionaryConverter([
		{
			converter: webidl.converters.DOMString,
			key: "name"
		},
		{
			converter: webidl.converters.DOMString,
			key: "value"
		},
		{
			converter: webidl.nullableConverter((value) => {
				if (typeof value === "number") return webidl.converters["unsigned long long"](value);
				return new Date(value);
			}),
			key: "expires",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters["long long"]),
			key: "maxAge",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.DOMString),
			key: "domain",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.DOMString),
			key: "path",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.boolean),
			key: "secure",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.boolean),
			key: "httpOnly",
			defaultValue: () => null
		},
		{
			converter: webidl.converters.USVString,
			key: "sameSite",
			allowedValues: [
				"Strict",
				"Lax",
				"None"
			]
		},
		{
			converter: webidl.sequenceConverter(webidl.converters.DOMString),
			key: "unparsed",
			defaultValue: () => new Array(0)
		}
	]);
	module.exports = {
		getCookies,
		deleteCookie,
		getSetCookies,
		setCookie
	};
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/events.js
var require_events = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { webidl } = require_webidl();
	var { kEnumerableProperty } = require_util$8();
	var { kConstruct } = require_symbols$4();
	var { MessagePort } = __require("node:worker_threads");
	/**
	* @see https://html.spec.whatwg.org/multipage/comms.html#messageevent
	*/
	var MessageEvent = class MessageEvent extends Event {
		#eventInit;
		constructor(type, eventInitDict = {}) {
			if (type === kConstruct) {
				super(arguments[1], arguments[2]);
				webidl.util.markAsUncloneable(this);
				return;
			}
			const prefix = "MessageEvent constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			type = webidl.converters.DOMString(type, prefix, "type");
			eventInitDict = webidl.converters.MessageEventInit(eventInitDict, prefix, "eventInitDict");
			super(type, eventInitDict);
			this.#eventInit = eventInitDict;
			webidl.util.markAsUncloneable(this);
		}
		get data() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.data;
		}
		get origin() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.origin;
		}
		get lastEventId() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.lastEventId;
		}
		get source() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.source;
		}
		get ports() {
			webidl.brandCheck(this, MessageEvent);
			if (!Object.isFrozen(this.#eventInit.ports)) Object.freeze(this.#eventInit.ports);
			return this.#eventInit.ports;
		}
		initMessageEvent(type, bubbles = false, cancelable = false, data = null, origin = "", lastEventId = "", source = null, ports = []) {
			webidl.brandCheck(this, MessageEvent);
			webidl.argumentLengthCheck(arguments, 1, "MessageEvent.initMessageEvent");
			return new MessageEvent(type, {
				bubbles,
				cancelable,
				data,
				origin,
				lastEventId,
				source,
				ports
			});
		}
		static createFastMessageEvent(type, init) {
			const messageEvent = new MessageEvent(kConstruct, type, init);
			messageEvent.#eventInit = init;
			messageEvent.#eventInit.data ??= null;
			messageEvent.#eventInit.origin ??= "";
			messageEvent.#eventInit.lastEventId ??= "";
			messageEvent.#eventInit.source ??= null;
			messageEvent.#eventInit.ports ??= [];
			return messageEvent;
		}
	};
	var { createFastMessageEvent } = MessageEvent;
	delete MessageEvent.createFastMessageEvent;
	/**
	* @see https://websockets.spec.whatwg.org/#the-closeevent-interface
	*/
	var CloseEvent = class CloseEvent extends Event {
		#eventInit;
		constructor(type, eventInitDict = {}) {
			const prefix = "CloseEvent constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			type = webidl.converters.DOMString(type, prefix, "type");
			eventInitDict = webidl.converters.CloseEventInit(eventInitDict);
			super(type, eventInitDict);
			this.#eventInit = eventInitDict;
			webidl.util.markAsUncloneable(this);
		}
		get wasClean() {
			webidl.brandCheck(this, CloseEvent);
			return this.#eventInit.wasClean;
		}
		get code() {
			webidl.brandCheck(this, CloseEvent);
			return this.#eventInit.code;
		}
		get reason() {
			webidl.brandCheck(this, CloseEvent);
			return this.#eventInit.reason;
		}
	};
	var ErrorEvent = class ErrorEvent extends Event {
		#eventInit;
		constructor(type, eventInitDict) {
			const prefix = "ErrorEvent constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			super(type, eventInitDict);
			webidl.util.markAsUncloneable(this);
			type = webidl.converters.DOMString(type, prefix, "type");
			eventInitDict = webidl.converters.ErrorEventInit(eventInitDict ?? {});
			this.#eventInit = eventInitDict;
		}
		get message() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.message;
		}
		get filename() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.filename;
		}
		get lineno() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.lineno;
		}
		get colno() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.colno;
		}
		get error() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.error;
		}
	};
	Object.defineProperties(MessageEvent.prototype, {
		[Symbol.toStringTag]: {
			value: "MessageEvent",
			configurable: true
		},
		data: kEnumerableProperty,
		origin: kEnumerableProperty,
		lastEventId: kEnumerableProperty,
		source: kEnumerableProperty,
		ports: kEnumerableProperty,
		initMessageEvent: kEnumerableProperty
	});
	Object.defineProperties(CloseEvent.prototype, {
		[Symbol.toStringTag]: {
			value: "CloseEvent",
			configurable: true
		},
		reason: kEnumerableProperty,
		code: kEnumerableProperty,
		wasClean: kEnumerableProperty
	});
	Object.defineProperties(ErrorEvent.prototype, {
		[Symbol.toStringTag]: {
			value: "ErrorEvent",
			configurable: true
		},
		message: kEnumerableProperty,
		filename: kEnumerableProperty,
		lineno: kEnumerableProperty,
		colno: kEnumerableProperty,
		error: kEnumerableProperty
	});
	webidl.converters.MessagePort = webidl.interfaceConverter(MessagePort);
	webidl.converters["sequence<MessagePort>"] = webidl.sequenceConverter(webidl.converters.MessagePort);
	var eventInit = [
		{
			key: "bubbles",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "cancelable",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "composed",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		}
	];
	webidl.converters.MessageEventInit = webidl.dictionaryConverter([
		...eventInit,
		{
			key: "data",
			converter: webidl.converters.any,
			defaultValue: () => null
		},
		{
			key: "origin",
			converter: webidl.converters.USVString,
			defaultValue: () => ""
		},
		{
			key: "lastEventId",
			converter: webidl.converters.DOMString,
			defaultValue: () => ""
		},
		{
			key: "source",
			converter: webidl.nullableConverter(webidl.converters.MessagePort),
			defaultValue: () => null
		},
		{
			key: "ports",
			converter: webidl.converters["sequence<MessagePort>"],
			defaultValue: () => new Array(0)
		}
	]);
	webidl.converters.CloseEventInit = webidl.dictionaryConverter([
		...eventInit,
		{
			key: "wasClean",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "code",
			converter: webidl.converters["unsigned short"],
			defaultValue: () => 0
		},
		{
			key: "reason",
			converter: webidl.converters.USVString,
			defaultValue: () => ""
		}
	]);
	webidl.converters.ErrorEventInit = webidl.dictionaryConverter([
		...eventInit,
		{
			key: "message",
			converter: webidl.converters.DOMString,
			defaultValue: () => ""
		},
		{
			key: "filename",
			converter: webidl.converters.USVString,
			defaultValue: () => ""
		},
		{
			key: "lineno",
			converter: webidl.converters["unsigned long"],
			defaultValue: () => 0
		},
		{
			key: "colno",
			converter: webidl.converters["unsigned long"],
			defaultValue: () => 0
		},
		{
			key: "error",
			converter: webidl.converters.any
		}
	]);
	module.exports = {
		MessageEvent,
		CloseEvent,
		ErrorEvent,
		createFastMessageEvent
	};
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/constants.js
var require_constants$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		uid: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
		sentCloseFrameState: {
			NOT_SENT: 0,
			PROCESSING: 1,
			SENT: 2
		},
		staticPropertyDescriptors: {
			enumerable: true,
			writable: false,
			configurable: false
		},
		states: {
			CONNECTING: 0,
			OPEN: 1,
			CLOSING: 2,
			CLOSED: 3
		},
		opcodes: {
			CONTINUATION: 0,
			TEXT: 1,
			BINARY: 2,
			CLOSE: 8,
			PING: 9,
			PONG: 10
		},
		maxUnsigned16Bit: 2 ** 16 - 1,
		parserStates: {
			INFO: 0,
			PAYLOADLENGTH_16: 2,
			PAYLOADLENGTH_64: 3,
			READ_DATA: 4
		},
		emptyBuffer: Buffer.allocUnsafe(0),
		sendHints: {
			string: 1,
			typedArray: 2,
			arrayBuffer: 3,
			blob: 4
		}
	};
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/symbols.js
var require_symbols = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kWebSocketURL: Symbol("url"),
		kReadyState: Symbol("ready state"),
		kController: Symbol("controller"),
		kResponse: Symbol("response"),
		kBinaryType: Symbol("binary type"),
		kSentClose: Symbol("sent close"),
		kReceivedClose: Symbol("received close"),
		kByteParser: Symbol("byte parser")
	};
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/util.js
var require_util$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kReadyState, kController, kResponse, kBinaryType, kWebSocketURL } = require_symbols();
	var { states, opcodes } = require_constants$1();
	var { ErrorEvent, createFastMessageEvent } = require_events();
	var { isUtf8 } = __require("node:buffer");
	var { collectASequenceOfCodePointsFast, removeHTTPWhitespace } = require_data_url();
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isConnecting(ws) {
		return ws[kReadyState] === states.CONNECTING;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isEstablished(ws) {
		return ws[kReadyState] === states.OPEN;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isClosing(ws) {
		return ws[kReadyState] === states.CLOSING;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isClosed(ws) {
		return ws[kReadyState] === states.CLOSED;
	}
	/**
	* @see https://dom.spec.whatwg.org/#concept-event-fire
	* @param {string} e
	* @param {EventTarget} target
	* @param {(...args: ConstructorParameters<typeof Event>) => Event} eventFactory
	* @param {EventInit | undefined} eventInitDict
	*/
	function fireEvent(e, target, eventFactory = (type, init) => new Event(type, init), eventInitDict = {}) {
		const event = eventFactory(e, eventInitDict);
		target.dispatchEvent(event);
	}
	/**
	* @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	* @param {import('./websocket').WebSocket} ws
	* @param {number} type Opcode
	* @param {Buffer} data application data
	*/
	function websocketMessageReceived(ws, type, data) {
		if (ws[kReadyState] !== states.OPEN) return;
		let dataForEvent;
		if (type === opcodes.TEXT) try {
			dataForEvent = utf8Decode(data);
		} catch {
			failWebsocketConnection(ws, "Received invalid UTF-8 in text frame.");
			return;
		}
		else if (type === opcodes.BINARY) {
			if (ws[kBinaryType] === "blob") dataForEvent = new Blob([data]);
			else dataForEvent = toArrayBuffer(data);
		}
		fireEvent("message", ws, createFastMessageEvent, {
			origin: ws[kWebSocketURL].origin,
			data: dataForEvent
		});
	}
	function toArrayBuffer(buffer) {
		if (buffer.byteLength === buffer.buffer.byteLength) return buffer.buffer;
		return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	}
	/**
	* @see https://datatracker.ietf.org/doc/html/rfc6455
	* @see https://datatracker.ietf.org/doc/html/rfc2616
	* @see https://bugs.chromium.org/p/chromium/issues/detail?id=398407
	* @param {string} protocol
	*/
	function isValidSubprotocol(protocol) {
		if (protocol.length === 0) return false;
		for (let i = 0; i < protocol.length; ++i) {
			const code = protocol.charCodeAt(i);
			if (code < 33 || code > 126 || code === 34 || code === 40 || code === 41 || code === 44 || code === 47 || code === 58 || code === 59 || code === 60 || code === 61 || code === 62 || code === 63 || code === 64 || code === 91 || code === 92 || code === 93 || code === 123 || code === 125) return false;
		}
		return true;
	}
	/**
	* @see https://datatracker.ietf.org/doc/html/rfc6455#section-7-4
	* @param {number} code
	*/
	function isValidStatusCode(code) {
		if (code >= 1e3 && code < 1015) return code !== 1004 && code !== 1005 && code !== 1006;
		return code >= 3e3 && code <= 4999;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @param {string|undefined} reason
	*/
	function failWebsocketConnection(ws, reason) {
		const { [kController]: controller, [kResponse]: response } = ws;
		controller.abort();
		if (response?.socket && !response.socket.destroyed) response.socket.destroy();
		if (reason) fireEvent("error", ws, (type, init) => new ErrorEvent(type, init), {
			error: new Error(reason),
			message: reason
		});
	}
	/**
	* @see https://datatracker.ietf.org/doc/html/rfc6455#section-5.5
	* @param {number} opcode
	*/
	function isControlFrame(opcode) {
		return opcode === opcodes.CLOSE || opcode === opcodes.PING || opcode === opcodes.PONG;
	}
	function isContinuationFrame(opcode) {
		return opcode === opcodes.CONTINUATION;
	}
	function isTextBinaryFrame(opcode) {
		return opcode === opcodes.TEXT || opcode === opcodes.BINARY;
	}
	function isValidOpcode(opcode) {
		return isTextBinaryFrame(opcode) || isContinuationFrame(opcode) || isControlFrame(opcode);
	}
	/**
	* Parses a Sec-WebSocket-Extensions header value.
	* @param {string} extensions
	* @returns {Map<string, string>}
	*/
	function parseExtensions(extensions) {
		const position = { position: 0 };
		const extensionList = /* @__PURE__ */ new Map();
		while (position.position < extensions.length) {
			const [name, value = ""] = collectASequenceOfCodePointsFast(";", extensions, position).split("=");
			extensionList.set(removeHTTPWhitespace(name, true, false), removeHTTPWhitespace(value, false, true));
			position.position++;
		}
		return extensionList;
	}
	/**
	* @see https://www.rfc-editor.org/rfc/rfc7692#section-7.1.2.2
	* @description "client-max-window-bits = 1*DIGIT"
	* @param {string} value
	*/
	function isValidClientWindowBits(value) {
		if (value.length === 0) return false;
		for (let i = 0; i < value.length; i++) {
			const byte = value.charCodeAt(i);
			if (byte < 48 || byte > 57) return false;
		}
		const num = Number.parseInt(value, 10);
		return num >= 8 && num <= 15;
	}
	var hasIntl = typeof process.versions.icu === "string";
	var fatalDecoder = hasIntl ? new TextDecoder("utf-8", { fatal: true }) : void 0;
	/**
	* Converts a Buffer to utf-8, even on platforms without icu.
	* @param {Buffer} buffer
	*/
	var utf8Decode = hasIntl ? fatalDecoder.decode.bind(fatalDecoder) : function(buffer) {
		if (isUtf8(buffer)) return buffer.toString("utf-8");
		throw new TypeError("Invalid utf-8 received.");
	};
	module.exports = {
		isConnecting,
		isEstablished,
		isClosing,
		isClosed,
		fireEvent,
		isValidSubprotocol,
		isValidStatusCode,
		failWebsocketConnection,
		websocketMessageReceived,
		utf8Decode,
		isControlFrame,
		isContinuationFrame,
		isTextBinaryFrame,
		isValidOpcode,
		parseExtensions,
		isValidClientWindowBits
	};
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/frame.js
var require_frame = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { maxUnsigned16Bit } = require_constants$1();
	var BUFFER_SIZE = 16386;
	/** @type {import('crypto')} */
	var crypto;
	var buffer = null;
	var bufIdx = BUFFER_SIZE;
	try {
		crypto = __require("node:crypto");
	} catch {
		crypto = { randomFillSync: function randomFillSync(buffer, _offset, _size) {
			for (let i = 0; i < buffer.length; ++i) buffer[i] = Math.random() * 255 | 0;
			return buffer;
		} };
	}
	function generateMask() {
		if (bufIdx === BUFFER_SIZE) {
			bufIdx = 0;
			crypto.randomFillSync(buffer ??= Buffer.allocUnsafe(BUFFER_SIZE), 0, BUFFER_SIZE);
		}
		return [
			buffer[bufIdx++],
			buffer[bufIdx++],
			buffer[bufIdx++],
			buffer[bufIdx++]
		];
	}
	var WebsocketFrameSend = class {
		/**
		* @param {Buffer|undefined} data
		*/
		constructor(data) {
			this.frameData = data;
		}
		createFrame(opcode) {
			const frameData = this.frameData;
			const maskKey = generateMask();
			const bodyLength = frameData?.byteLength ?? 0;
			/** @type {number} */
			let payloadLength = bodyLength;
			let offset = 6;
			if (bodyLength > maxUnsigned16Bit) {
				offset += 8;
				payloadLength = 127;
			} else if (bodyLength > 125) {
				offset += 2;
				payloadLength = 126;
			}
			const buffer = Buffer.allocUnsafe(bodyLength + offset);
			buffer[0] = buffer[1] = 0;
			buffer[0] |= 128;
			buffer[0] = (buffer[0] & 240) + opcode;
			/*! ws. MIT License. Einar Otto Stangvik <einaros@gmail.com> */
			buffer[offset - 4] = maskKey[0];
			buffer[offset - 3] = maskKey[1];
			buffer[offset - 2] = maskKey[2];
			buffer[offset - 1] = maskKey[3];
			buffer[1] = payloadLength;
			if (payloadLength === 126) buffer.writeUInt16BE(bodyLength, 2);
			else if (payloadLength === 127) {
				buffer[2] = buffer[3] = 0;
				buffer.writeUIntBE(bodyLength, 4, 6);
			}
			buffer[1] |= 128;
			for (let i = 0; i < bodyLength; ++i) buffer[offset + i] = frameData[i] ^ maskKey[i & 3];
			return buffer;
		}
	};
	module.exports = { WebsocketFrameSend };
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/connection.js
var require_connection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { uid, states, sentCloseFrameState, emptyBuffer, opcodes } = require_constants$1();
	var { kReadyState, kSentClose, kByteParser, kReceivedClose, kResponse } = require_symbols();
	var { fireEvent, failWebsocketConnection, isClosing, isClosed, isEstablished, parseExtensions } = require_util$2();
	var { channels } = require_diagnostics();
	var { CloseEvent } = require_events();
	var { makeRequest } = require_request();
	var { fetching } = require_fetch();
	var { Headers, getHeadersList } = require_headers$1();
	var { getDecodeSplit } = require_util$7();
	var { WebsocketFrameSend } = require_frame();
	/** @type {import('crypto')} */
	var crypto;
	try {
		crypto = __require("node:crypto");
	} catch {}
	/**
	* @see https://websockets.spec.whatwg.org/#concept-websocket-establish
	* @param {URL} url
	* @param {string|string[]} protocols
	* @param {import('./websocket').WebSocket} ws
	* @param {(response: any, extensions: string[] | undefined) => void} onEstablish
	* @param {Partial<import('../../types/websocket').WebSocketInit>} options
	*/
	function establishWebSocketConnection(url, protocols, client, ws, onEstablish, options) {
		const requestURL = url;
		requestURL.protocol = url.protocol === "ws:" ? "http:" : "https:";
		const request = makeRequest({
			urlList: [requestURL],
			client,
			serviceWorkers: "none",
			referrer: "no-referrer",
			mode: "websocket",
			credentials: "include",
			cache: "no-store",
			redirect: "error"
		});
		if (options.headers) request.headersList = getHeadersList(new Headers(options.headers));
		const keyValue = crypto.randomBytes(16).toString("base64");
		request.headersList.append("sec-websocket-key", keyValue);
		request.headersList.append("sec-websocket-version", "13");
		for (const protocol of protocols) request.headersList.append("sec-websocket-protocol", protocol);
		request.headersList.append("sec-websocket-extensions", "permessage-deflate; client_max_window_bits");
		return fetching({
			request,
			useParallelQueue: true,
			dispatcher: options.dispatcher,
			processResponse(response) {
				if (response.type === "error" || response.status !== 101) {
					failWebsocketConnection(ws, "Received network error or non-101 status code.");
					return;
				}
				if (protocols.length !== 0 && !response.headersList.get("Sec-WebSocket-Protocol")) {
					failWebsocketConnection(ws, "Server did not respond with sent protocols.");
					return;
				}
				if (response.headersList.get("Upgrade")?.toLowerCase() !== "websocket") {
					failWebsocketConnection(ws, "Server did not set Upgrade header to \"websocket\".");
					return;
				}
				if (response.headersList.get("Connection")?.toLowerCase() !== "upgrade") {
					failWebsocketConnection(ws, "Server did not set Connection header to \"upgrade\".");
					return;
				}
				if (response.headersList.get("Sec-WebSocket-Accept") !== crypto.createHash("sha1").update(keyValue + uid).digest("base64")) {
					failWebsocketConnection(ws, "Incorrect hash received in Sec-WebSocket-Accept header.");
					return;
				}
				const secExtension = response.headersList.get("Sec-WebSocket-Extensions");
				let extensions;
				if (secExtension !== null) {
					extensions = parseExtensions(secExtension);
					if (!extensions.has("permessage-deflate")) {
						failWebsocketConnection(ws, "Sec-WebSocket-Extensions header does not match.");
						return;
					}
				}
				const secProtocol = response.headersList.get("Sec-WebSocket-Protocol");
				if (secProtocol !== null) {
					const requestProtocols = getDecodeSplit("sec-websocket-protocol", request.headersList);
					if (requestProtocols === null || !requestProtocols.includes(secProtocol)) {
						failWebsocketConnection(ws, "Protocol was not set in the opening handshake.");
						return;
					}
				}
				response.socket.on("data", onSocketData);
				response.socket.on("close", onSocketClose);
				response.socket.on("error", onSocketError);
				if (channels.open.hasSubscribers) channels.open.publish({
					address: response.socket.address(),
					protocol: secProtocol,
					extensions: secExtension
				});
				onEstablish(response, extensions);
			}
		});
	}
	function closeWebSocketConnection(ws, code, reason, reasonByteLength) {
		if (isClosing(ws) || isClosed(ws)) {} else if (!isEstablished(ws)) {
			failWebsocketConnection(ws, "Connection was closed before it was established.");
			ws[kReadyState] = states.CLOSING;
		} else if (ws[kSentClose] === sentCloseFrameState.NOT_SENT) {
			ws[kSentClose] = sentCloseFrameState.PROCESSING;
			const frame = new WebsocketFrameSend();
			if (code !== void 0 && reason === void 0) {
				frame.frameData = Buffer.allocUnsafe(2);
				frame.frameData.writeUInt16BE(code, 0);
			} else if (code !== void 0 && reason !== void 0) {
				frame.frameData = Buffer.allocUnsafe(2 + reasonByteLength);
				frame.frameData.writeUInt16BE(code, 0);
				frame.frameData.write(reason, 2, "utf-8");
			} else frame.frameData = emptyBuffer;
			ws[kResponse].socket.write(frame.createFrame(opcodes.CLOSE));
			ws[kSentClose] = sentCloseFrameState.SENT;
			ws[kReadyState] = states.CLOSING;
		} else ws[kReadyState] = states.CLOSING;
	}
	/**
	* @param {Buffer} chunk
	*/
	function onSocketData(chunk) {
		if (!this.ws[kByteParser].write(chunk)) this.pause();
	}
	/**
	* @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	* @see https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.4
	*/
	function onSocketClose() {
		const { ws } = this;
		const { [kResponse]: response } = ws;
		response.socket.off("data", onSocketData);
		response.socket.off("close", onSocketClose);
		response.socket.off("error", onSocketError);
		const wasClean = ws[kSentClose] === sentCloseFrameState.SENT && ws[kReceivedClose];
		let code = 1005;
		let reason = "";
		const result = ws[kByteParser].closingInfo;
		if (result && !result.error) {
			code = result.code ?? 1005;
			reason = result.reason;
		} else if (!ws[kReceivedClose]) code = 1006;
		ws[kReadyState] = states.CLOSED;
		fireEvent("close", ws, (type, init) => new CloseEvent(type, init), {
			wasClean,
			code,
			reason
		});
		if (channels.close.hasSubscribers) channels.close.publish({
			websocket: ws,
			code,
			reason
		});
	}
	function onSocketError(error) {
		const { ws } = this;
		ws[kReadyState] = states.CLOSING;
		if (channels.socketError.hasSubscribers) channels.socketError.publish(error);
		this.destroy();
	}
	module.exports = {
		establishWebSocketConnection,
		closeWebSocketConnection
	};
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/permessage-deflate.js
var require_permessage_deflate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { createInflateRaw, Z_DEFAULT_WINDOWBITS } = __require("node:zlib");
	var { isValidClientWindowBits } = require_util$2();
	var { MessageSizeExceededError } = require_errors$1();
	var tail = Buffer.from([
		0,
		0,
		255,
		255
	]);
	var kBuffer = Symbol("kBuffer");
	var kLength = Symbol("kLength");
	var PerMessageDeflate = class {
		/** @type {import('node:zlib').InflateRaw} */
		#inflate;
		#options = {};
		#maxPayloadSize = 0;
		/**
		* @param {Map<string, string>} extensions
		*/
		constructor(extensions, options) {
			this.#options.serverNoContextTakeover = extensions.has("server_no_context_takeover");
			this.#options.serverMaxWindowBits = extensions.get("server_max_window_bits");
			this.#maxPayloadSize = options.maxPayloadSize;
		}
		/**
		* Decompress a compressed payload.
		* @param {Buffer} chunk Compressed data
		* @param {boolean} fin Final fragment flag
		* @param {Function} callback Callback function
		*/
		decompress(chunk, fin, callback) {
			if (!this.#inflate) {
				let windowBits = Z_DEFAULT_WINDOWBITS;
				if (this.#options.serverMaxWindowBits) {
					if (!isValidClientWindowBits(this.#options.serverMaxWindowBits)) {
						callback(/* @__PURE__ */ new Error("Invalid server_max_window_bits"));
						return;
					}
					windowBits = Number.parseInt(this.#options.serverMaxWindowBits);
				}
				try {
					this.#inflate = createInflateRaw({ windowBits });
				} catch (err) {
					callback(err);
					return;
				}
				this.#inflate[kBuffer] = [];
				this.#inflate[kLength] = 0;
				this.#inflate.on("data", (data) => {
					this.#inflate[kLength] += data.length;
					if (this.#maxPayloadSize > 0 && this.#inflate[kLength] > this.#maxPayloadSize) {
						callback(new MessageSizeExceededError());
						this.#inflate.removeAllListeners();
						this.#inflate.destroy();
						this.#inflate = null;
						return;
					}
					this.#inflate[kBuffer].push(data);
				});
				this.#inflate.on("error", (err) => {
					this.#inflate = null;
					callback(err);
				});
			}
			this.#inflate.write(chunk);
			if (fin) this.#inflate.write(tail);
			this.#inflate.flush(() => {
				if (!this.#inflate) return;
				const full = Buffer.concat(this.#inflate[kBuffer], this.#inflate[kLength]);
				this.#inflate[kBuffer].length = 0;
				this.#inflate[kLength] = 0;
				callback(null, full);
			});
		}
	};
	module.exports = { PerMessageDeflate };
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/receiver.js
var require_receiver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Writable } = __require("node:stream");
	var assert = __require("node:assert");
	var { parserStates, opcodes, states, emptyBuffer, sentCloseFrameState } = require_constants$1();
	var { kReadyState, kSentClose, kResponse, kReceivedClose } = require_symbols();
	var { channels } = require_diagnostics();
	var { isValidStatusCode, isValidOpcode, failWebsocketConnection, websocketMessageReceived, utf8Decode, isControlFrame, isTextBinaryFrame, isContinuationFrame } = require_util$2();
	var { WebsocketFrameSend } = require_frame();
	var { closeWebSocketConnection } = require_connection();
	var { PerMessageDeflate } = require_permessage_deflate();
	var { MessageSizeExceededError } = require_errors$1();
	function failWebsocketConnectionWithCode(ws, code, reason) {
		closeWebSocketConnection(ws, code, reason, Buffer.byteLength(reason));
		failWebsocketConnection(ws, reason);
	}
	var ByteParser = class extends Writable {
		#buffers = [];
		#fragmentsBytes = 0;
		#byteOffset = 0;
		#loop = false;
		#state = parserStates.INFO;
		#info = {};
		#fragments = [];
		/** @type {Map<string, PerMessageDeflate>} */
		#extensions;
		/** @type {number} */
		#maxFragments;
		/** @type {number} */
		#maxPayloadSize;
		/**
		* @param {import('./websocket').WebSocket} ws
		* @param {Map<string, string>|null} extensions
		* @param {{ maxFragments?: number, maxPayloadSize?: number }} [options]
		*/
		constructor(ws, extensions, options = {}) {
			super();
			this.ws = ws;
			this.#extensions = extensions == null ? /* @__PURE__ */ new Map() : extensions;
			this.#maxFragments = options.maxFragments ?? 0;
			this.#maxPayloadSize = options.maxPayloadSize ?? 0;
			if (this.#extensions.has("permessage-deflate")) this.#extensions.set("permessage-deflate", new PerMessageDeflate(extensions, options));
		}
		/**
		* @param {Buffer} chunk
		* @param {() => void} callback
		*/
		_write(chunk, _, callback) {
			this.#buffers.push(chunk);
			this.#byteOffset += chunk.length;
			this.#loop = true;
			this.run(callback);
		}
		#validatePayloadLength() {
			if (this.#maxPayloadSize > 0 && !isControlFrame(this.#info.opcode) && this.#info.payloadLength + this.#fragmentsBytes > this.#maxPayloadSize) {
				failWebsocketConnectionWithCode(this.ws, 1009, "Payload size exceeds maximum allowed size");
				return false;
			}
			return true;
		}
		/**
		* Runs whenever a new chunk is received.
		* Callback is called whenever there are no more chunks buffering,
		* or not enough bytes are buffered to parse.
		*/
		run(callback) {
			while (this.#loop) if (this.#state === parserStates.INFO) {
				if (this.#byteOffset < 2) return callback();
				const buffer = this.consume(2);
				const fin = (buffer[0] & 128) !== 0;
				const opcode = buffer[0] & 15;
				const masked = (buffer[1] & 128) === 128;
				const fragmented = !fin && opcode !== opcodes.CONTINUATION;
				const payloadLength = buffer[1] & 127;
				const rsv1 = buffer[0] & 64;
				const rsv2 = buffer[0] & 32;
				const rsv3 = buffer[0] & 16;
				if (!isValidOpcode(opcode)) {
					failWebsocketConnection(this.ws, "Invalid opcode received");
					return callback();
				}
				if (masked) {
					failWebsocketConnection(this.ws, "Frame cannot be masked");
					return callback();
				}
				if (rsv1 !== 0 && !this.#extensions.has("permessage-deflate")) {
					failWebsocketConnection(this.ws, "Expected RSV1 to be clear.");
					return;
				}
				if (rsv2 !== 0 || rsv3 !== 0) {
					failWebsocketConnection(this.ws, "RSV1, RSV2, RSV3 must be clear");
					return;
				}
				if (fragmented && !isTextBinaryFrame(opcode)) {
					failWebsocketConnection(this.ws, "Invalid frame type was fragmented.");
					return;
				}
				if (isTextBinaryFrame(opcode) && this.#fragments.length > 0) {
					failWebsocketConnection(this.ws, "Expected continuation frame");
					return;
				}
				if (this.#info.fragmented && fragmented) {
					failWebsocketConnection(this.ws, "Fragmented frame exceeded 125 bytes.");
					return;
				}
				if ((payloadLength > 125 || fragmented) && isControlFrame(opcode)) {
					failWebsocketConnection(this.ws, "Control frame either too large or fragmented");
					return;
				}
				if (isContinuationFrame(opcode) && this.#fragments.length === 0 && !this.#info.compressed) {
					failWebsocketConnection(this.ws, "Unexpected continuation frame");
					return;
				}
				if (payloadLength <= 125) {
					this.#info.payloadLength = payloadLength;
					this.#state = parserStates.READ_DATA;
					if (!this.#validatePayloadLength()) return;
				} else if (payloadLength === 126) this.#state = parserStates.PAYLOADLENGTH_16;
				else if (payloadLength === 127) this.#state = parserStates.PAYLOADLENGTH_64;
				if (isTextBinaryFrame(opcode)) {
					this.#info.binaryType = opcode;
					this.#info.compressed = rsv1 !== 0;
				}
				this.#info.opcode = opcode;
				this.#info.masked = masked;
				this.#info.fin = fin;
				this.#info.fragmented = fragmented;
			} else if (this.#state === parserStates.PAYLOADLENGTH_16) {
				if (this.#byteOffset < 2) return callback();
				const buffer = this.consume(2);
				this.#info.payloadLength = buffer.readUInt16BE(0);
				this.#state = parserStates.READ_DATA;
				if (!this.#validatePayloadLength()) return;
			} else if (this.#state === parserStates.PAYLOADLENGTH_64) {
				if (this.#byteOffset < 8) return callback();
				const buffer = this.consume(8);
				const upper = buffer.readUInt32BE(0);
				const lower = buffer.readUInt32BE(4);
				if (upper !== 0 || lower > 2 ** 31 - 1) {
					failWebsocketConnection(this.ws, "Received payload length > 2^31 bytes.");
					return;
				}
				this.#info.payloadLength = lower;
				this.#state = parserStates.READ_DATA;
				if (!this.#validatePayloadLength()) return;
			} else if (this.#state === parserStates.READ_DATA) {
				if (this.#byteOffset < this.#info.payloadLength) return callback();
				const body = this.consume(this.#info.payloadLength);
				if (isControlFrame(this.#info.opcode)) {
					this.#loop = this.parseControlFrame(body);
					this.#state = parserStates.INFO;
				} else if (!this.#info.compressed) {
					if (!this.writeFragments(body)) return;
					if (this.#maxPayloadSize > 0 && this.#fragmentsBytes > this.#maxPayloadSize) {
						failWebsocketConnectionWithCode(this.ws, 1009, new MessageSizeExceededError().message);
						return;
					}
					if (!this.#info.fragmented && this.#info.fin) websocketMessageReceived(this.ws, this.#info.binaryType, this.consumeFragments());
					this.#state = parserStates.INFO;
				} else {
					this.#extensions.get("permessage-deflate").decompress(body, this.#info.fin, (error, data) => {
						if (error) {
							const code = error instanceof MessageSizeExceededError ? 1009 : 1007;
							failWebsocketConnectionWithCode(this.ws, code, error.message);
							return;
						}
						if (!this.writeFragments(data)) return;
						if (this.#maxPayloadSize > 0 && this.#fragmentsBytes > this.#maxPayloadSize) {
							failWebsocketConnectionWithCode(this.ws, 1009, new MessageSizeExceededError().message);
							return;
						}
						if (!this.#info.fin) {
							this.#state = parserStates.INFO;
							this.#loop = true;
							this.run(callback);
							return;
						}
						websocketMessageReceived(this.ws, this.#info.binaryType, this.consumeFragments());
						this.#loop = true;
						this.#state = parserStates.INFO;
						this.run(callback);
					});
					this.#loop = false;
					break;
				}
			}
		}
		/**
		* Take n bytes from the buffered Buffers
		* @param {number} n
		* @returns {Buffer}
		*/
		consume(n) {
			if (n > this.#byteOffset) throw new Error("Called consume() before buffers satiated.");
			else if (n === 0) return emptyBuffer;
			if (this.#buffers[0].length === n) {
				this.#byteOffset -= this.#buffers[0].length;
				return this.#buffers.shift();
			}
			const buffer = Buffer.allocUnsafe(n);
			let offset = 0;
			while (offset !== n) {
				const next = this.#buffers[0];
				const { length } = next;
				if (length + offset === n) {
					buffer.set(this.#buffers.shift(), offset);
					break;
				} else if (length + offset > n) {
					buffer.set(next.subarray(0, n - offset), offset);
					this.#buffers[0] = next.subarray(n - offset);
					break;
				} else {
					buffer.set(this.#buffers.shift(), offset);
					offset += next.length;
				}
			}
			this.#byteOffset -= n;
			return buffer;
		}
		writeFragments(fragment) {
			if (this.#maxFragments > 0 && this.#fragments.length === this.#maxFragments) {
				failWebsocketConnectionWithCode(this.ws, 1008, "Too many message fragments");
				return false;
			}
			this.#fragmentsBytes += fragment.length;
			this.#fragments.push(fragment);
			return true;
		}
		consumeFragments() {
			const fragments = this.#fragments;
			if (fragments.length === 1) {
				this.#fragmentsBytes = 0;
				return fragments.shift();
			}
			const output = Buffer.concat(fragments, this.#fragmentsBytes);
			this.#fragments = [];
			this.#fragmentsBytes = 0;
			return output;
		}
		parseCloseBody(data) {
			assert(data.length !== 1);
			/** @type {number|undefined} */
			let code;
			if (data.length >= 2) code = data.readUInt16BE(0);
			if (code !== void 0 && !isValidStatusCode(code)) return {
				code: 1002,
				reason: "Invalid status code",
				error: true
			};
			/** @type {Buffer} */
			let reason = data.subarray(2);
			if (reason[0] === 239 && reason[1] === 187 && reason[2] === 191) reason = reason.subarray(3);
			try {
				reason = utf8Decode(reason);
			} catch {
				return {
					code: 1007,
					reason: "Invalid UTF-8",
					error: true
				};
			}
			return {
				code,
				reason,
				error: false
			};
		}
		/**
		* Parses control frames.
		* @param {Buffer} body
		*/
		parseControlFrame(body) {
			const { opcode, payloadLength } = this.#info;
			if (opcode === opcodes.CLOSE) {
				if (payloadLength === 1) {
					failWebsocketConnection(this.ws, "Received close frame with a 1-byte body.");
					return false;
				}
				this.#info.closeInfo = this.parseCloseBody(body);
				if (this.#info.closeInfo.error) {
					const { code, reason } = this.#info.closeInfo;
					closeWebSocketConnection(this.ws, code, reason, reason.length);
					failWebsocketConnection(this.ws, reason);
					return false;
				}
				if (this.ws[kSentClose] !== sentCloseFrameState.SENT) {
					let body = emptyBuffer;
					if (this.#info.closeInfo.code) {
						body = Buffer.allocUnsafe(2);
						body.writeUInt16BE(this.#info.closeInfo.code, 0);
					}
					const closeFrame = new WebsocketFrameSend(body);
					this.ws[kResponse].socket.write(closeFrame.createFrame(opcodes.CLOSE), (err) => {
						if (!err) this.ws[kSentClose] = sentCloseFrameState.SENT;
					});
				}
				this.ws[kReadyState] = states.CLOSING;
				this.ws[kReceivedClose] = true;
				return false;
			} else if (opcode === opcodes.PING) {
				if (!this.ws[kReceivedClose]) {
					const frame = new WebsocketFrameSend(body);
					this.ws[kResponse].socket.write(frame.createFrame(opcodes.PONG));
					if (channels.ping.hasSubscribers) channels.ping.publish({ payload: body });
				}
			} else if (opcode === opcodes.PONG) {
				if (channels.pong.hasSubscribers) channels.pong.publish({ payload: body });
			}
			return true;
		}
		get closingInfo() {
			return this.#info.closeInfo;
		}
	};
	module.exports = { ByteParser };
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/sender.js
var require_sender = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { WebsocketFrameSend } = require_frame();
	var { opcodes, sendHints } = require_constants$1();
	var FixedQueue = require_fixed_queue();
	/** @type {typeof Uint8Array} */
	var FastBuffer = Buffer[Symbol.species];
	/**
	* @typedef {object} SendQueueNode
	* @property {Promise<void> | null} promise
	* @property {((...args: any[]) => any)} callback
	* @property {Buffer | null} frame
	*/
	var SendQueue = class {
		/**
		* @type {FixedQueue}
		*/
		#queue = new FixedQueue();
		/**
		* @type {boolean}
		*/
		#running = false;
		/** @type {import('node:net').Socket} */
		#socket;
		constructor(socket) {
			this.#socket = socket;
		}
		add(item, cb, hint) {
			if (hint !== sendHints.blob) {
				const frame = createFrame(item, hint);
				if (!this.#running) this.#socket.write(frame, cb);
				else {
					/** @type {SendQueueNode} */
					const node = {
						promise: null,
						callback: cb,
						frame
					};
					this.#queue.push(node);
				}
				return;
			}
			/** @type {SendQueueNode} */
			const node = {
				promise: item.arrayBuffer().then((ab) => {
					node.promise = null;
					node.frame = createFrame(ab, hint);
				}),
				callback: cb,
				frame: null
			};
			this.#queue.push(node);
			if (!this.#running) this.#run();
		}
		async #run() {
			this.#running = true;
			const queue = this.#queue;
			while (!queue.isEmpty()) {
				const node = queue.shift();
				if (node.promise !== null) await node.promise;
				this.#socket.write(node.frame, node.callback);
				node.callback = node.frame = null;
			}
			this.#running = false;
		}
	};
	function createFrame(data, hint) {
		return new WebsocketFrameSend(toBuffer(data, hint)).createFrame(hint === sendHints.string ? opcodes.TEXT : opcodes.BINARY);
	}
	function toBuffer(data, hint) {
		switch (hint) {
			case sendHints.string: return Buffer.from(data);
			case sendHints.arrayBuffer:
			case sendHints.blob: return new FastBuffer(data);
			case sendHints.typedArray: return new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
		}
	}
	module.exports = { SendQueue };
}));
//#endregion
//#region node_modules/undici/lib/web/websocket/websocket.js
var require_websocket = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { webidl } = require_webidl();
	var { URLSerializer } = require_data_url();
	var { environmentSettingsObject } = require_util$7();
	var { staticPropertyDescriptors, states, sentCloseFrameState, sendHints } = require_constants$1();
	var { kWebSocketURL, kReadyState, kController, kBinaryType, kResponse, kSentClose, kByteParser } = require_symbols();
	var { isConnecting, isEstablished, isClosing, isValidSubprotocol, fireEvent } = require_util$2();
	var { establishWebSocketConnection, closeWebSocketConnection } = require_connection();
	var { ByteParser } = require_receiver();
	var { kEnumerableProperty, isBlobLike } = require_util$8();
	var { getGlobalDispatcher } = require_global();
	var { types } = __require("node:util");
	var { ErrorEvent, CloseEvent } = require_events();
	var { SendQueue } = require_sender();
	var WebSocket = class WebSocket extends EventTarget {
		#events = {
			open: null,
			error: null,
			close: null,
			message: null
		};
		#bufferedAmount = 0;
		#protocol = "";
		#extensions = "";
		/** @type {SendQueue} */
		#sendQueue;
		/**
		* @param {string} url
		* @param {string|string[]} protocols
		*/
		constructor(url, protocols = []) {
			super();
			webidl.util.markAsUncloneable(this);
			const prefix = "WebSocket constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			const options = webidl.converters["DOMString or sequence<DOMString> or WebSocketInit"](protocols, prefix, "options");
			url = webidl.converters.USVString(url, prefix, "url");
			protocols = options.protocols;
			const baseURL = environmentSettingsObject.settingsObject.baseUrl;
			let urlRecord;
			try {
				urlRecord = new URL(url, baseURL);
			} catch (e) {
				throw new DOMException(e, "SyntaxError");
			}
			if (urlRecord.protocol === "http:") urlRecord.protocol = "ws:";
			else if (urlRecord.protocol === "https:") urlRecord.protocol = "wss:";
			if (urlRecord.protocol !== "ws:" && urlRecord.protocol !== "wss:") throw new DOMException(`Expected a ws: or wss: protocol, got ${urlRecord.protocol}`, "SyntaxError");
			if (urlRecord.hash || urlRecord.href.endsWith("#")) throw new DOMException("Got fragment", "SyntaxError");
			if (typeof protocols === "string") protocols = [protocols];
			if (protocols.length !== new Set(protocols.map((p) => p.toLowerCase())).size) throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
			if (protocols.length > 0 && !protocols.every((p) => isValidSubprotocol(p))) throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
			this[kWebSocketURL] = new URL(urlRecord.href);
			const client = environmentSettingsObject.settingsObject;
			this[kController] = establishWebSocketConnection(urlRecord, protocols, client, this, (response, extensions) => this.#onConnectionEstablished(response, extensions), options);
			this[kReadyState] = WebSocket.CONNECTING;
			this[kSentClose] = sentCloseFrameState.NOT_SENT;
			this[kBinaryType] = "blob";
		}
		/**
		* @see https://websockets.spec.whatwg.org/#dom-websocket-close
		* @param {number|undefined} code
		* @param {string|undefined} reason
		*/
		close(code = void 0, reason = void 0) {
			webidl.brandCheck(this, WebSocket);
			const prefix = "WebSocket.close";
			if (code !== void 0) code = webidl.converters["unsigned short"](code, prefix, "code", { clamp: true });
			if (reason !== void 0) reason = webidl.converters.USVString(reason, prefix, "reason");
			if (code !== void 0) {
				if (code !== 1e3 && (code < 3e3 || code > 4999)) throw new DOMException("invalid code", "InvalidAccessError");
			}
			let reasonByteLength = 0;
			if (reason !== void 0) {
				reasonByteLength = Buffer.byteLength(reason);
				if (reasonByteLength > 123) throw new DOMException(`Reason must be less than 123 bytes; received ${reasonByteLength}`, "SyntaxError");
			}
			closeWebSocketConnection(this, code, reason, reasonByteLength);
		}
		/**
		* @see https://websockets.spec.whatwg.org/#dom-websocket-send
		* @param {NodeJS.TypedArray|ArrayBuffer|Blob|string} data
		*/
		send(data) {
			webidl.brandCheck(this, WebSocket);
			const prefix = "WebSocket.send";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			data = webidl.converters.WebSocketSendData(data, prefix, "data");
			if (isConnecting(this)) throw new DOMException("Sent before connected.", "InvalidStateError");
			if (!isEstablished(this) || isClosing(this)) return;
			if (typeof data === "string") {
				const length = Buffer.byteLength(data);
				this.#bufferedAmount += length;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= length;
				}, sendHints.string);
			} else if (types.isArrayBuffer(data)) {
				this.#bufferedAmount += data.byteLength;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= data.byteLength;
				}, sendHints.arrayBuffer);
			} else if (ArrayBuffer.isView(data)) {
				this.#bufferedAmount += data.byteLength;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= data.byteLength;
				}, sendHints.typedArray);
			} else if (isBlobLike(data)) {
				this.#bufferedAmount += data.size;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= data.size;
				}, sendHints.blob);
			}
		}
		get readyState() {
			webidl.brandCheck(this, WebSocket);
			return this[kReadyState];
		}
		get bufferedAmount() {
			webidl.brandCheck(this, WebSocket);
			return this.#bufferedAmount;
		}
		get url() {
			webidl.brandCheck(this, WebSocket);
			return URLSerializer(this[kWebSocketURL]);
		}
		get extensions() {
			webidl.brandCheck(this, WebSocket);
			return this.#extensions;
		}
		get protocol() {
			webidl.brandCheck(this, WebSocket);
			return this.#protocol;
		}
		get onopen() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.open;
		}
		set onopen(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.open) this.removeEventListener("open", this.#events.open);
			if (typeof fn === "function") {
				this.#events.open = fn;
				this.addEventListener("open", fn);
			} else this.#events.open = null;
		}
		get onerror() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.error;
		}
		set onerror(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.error) this.removeEventListener("error", this.#events.error);
			if (typeof fn === "function") {
				this.#events.error = fn;
				this.addEventListener("error", fn);
			} else this.#events.error = null;
		}
		get onclose() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.close;
		}
		set onclose(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.close) this.removeEventListener("close", this.#events.close);
			if (typeof fn === "function") {
				this.#events.close = fn;
				this.addEventListener("close", fn);
			} else this.#events.close = null;
		}
		get onmessage() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.message;
		}
		set onmessage(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.message) this.removeEventListener("message", this.#events.message);
			if (typeof fn === "function") {
				this.#events.message = fn;
				this.addEventListener("message", fn);
			} else this.#events.message = null;
		}
		get binaryType() {
			webidl.brandCheck(this, WebSocket);
			return this[kBinaryType];
		}
		set binaryType(type) {
			webidl.brandCheck(this, WebSocket);
			if (type !== "blob" && type !== "arraybuffer") this[kBinaryType] = "blob";
			else this[kBinaryType] = type;
		}
		/**
		* @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
		*/
		#onConnectionEstablished(response, parsedExtensions) {
			this[kResponse] = response;
			const webSocketOptions = this[kController]?.dispatcher?.webSocketOptions;
			const maxFragments = webSocketOptions?.maxFragments;
			const maxPayloadSize = webSocketOptions?.maxPayloadSize;
			const parser = new ByteParser(this, parsedExtensions, {
				maxFragments,
				maxPayloadSize
			});
			parser.on("drain", onParserDrain);
			parser.on("error", onParserError.bind(this));
			response.socket.ws = this;
			this[kByteParser] = parser;
			this.#sendQueue = new SendQueue(response.socket);
			this[kReadyState] = states.OPEN;
			const extensions = response.headersList.get("sec-websocket-extensions");
			if (extensions !== null) this.#extensions = extensions;
			const protocol = response.headersList.get("sec-websocket-protocol");
			if (protocol !== null) this.#protocol = protocol;
			fireEvent("open", this);
		}
	};
	WebSocket.CONNECTING = WebSocket.prototype.CONNECTING = states.CONNECTING;
	WebSocket.OPEN = WebSocket.prototype.OPEN = states.OPEN;
	WebSocket.CLOSING = WebSocket.prototype.CLOSING = states.CLOSING;
	WebSocket.CLOSED = WebSocket.prototype.CLOSED = states.CLOSED;
	Object.defineProperties(WebSocket.prototype, {
		CONNECTING: staticPropertyDescriptors,
		OPEN: staticPropertyDescriptors,
		CLOSING: staticPropertyDescriptors,
		CLOSED: staticPropertyDescriptors,
		url: kEnumerableProperty,
		readyState: kEnumerableProperty,
		bufferedAmount: kEnumerableProperty,
		onopen: kEnumerableProperty,
		onerror: kEnumerableProperty,
		onclose: kEnumerableProperty,
		close: kEnumerableProperty,
		onmessage: kEnumerableProperty,
		binaryType: kEnumerableProperty,
		send: kEnumerableProperty,
		extensions: kEnumerableProperty,
		protocol: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "WebSocket",
			writable: false,
			enumerable: false,
			configurable: true
		}
	});
	Object.defineProperties(WebSocket, {
		CONNECTING: staticPropertyDescriptors,
		OPEN: staticPropertyDescriptors,
		CLOSING: staticPropertyDescriptors,
		CLOSED: staticPropertyDescriptors
	});
	webidl.converters["sequence<DOMString>"] = webidl.sequenceConverter(webidl.converters.DOMString);
	webidl.converters["DOMString or sequence<DOMString>"] = function(V, prefix, argument) {
		if (webidl.util.Type(V) === "Object" && Symbol.iterator in V) return webidl.converters["sequence<DOMString>"](V);
		return webidl.converters.DOMString(V, prefix, argument);
	};
	webidl.converters.WebSocketInit = webidl.dictionaryConverter([
		{
			key: "protocols",
			converter: webidl.converters["DOMString or sequence<DOMString>"],
			defaultValue: () => new Array(0)
		},
		{
			key: "dispatcher",
			converter: webidl.converters.any,
			defaultValue: () => getGlobalDispatcher()
		},
		{
			key: "headers",
			converter: webidl.nullableConverter(webidl.converters.HeadersInit)
		}
	]);
	webidl.converters["DOMString or sequence<DOMString> or WebSocketInit"] = function(V) {
		if (webidl.util.Type(V) === "Object" && !(Symbol.iterator in V)) return webidl.converters.WebSocketInit(V);
		return { protocols: webidl.converters["DOMString or sequence<DOMString>"](V) };
	};
	webidl.converters.WebSocketSendData = function(V) {
		if (webidl.util.Type(V) === "Object") {
			if (isBlobLike(V)) return webidl.converters.Blob(V, { strict: false });
			if (ArrayBuffer.isView(V) || types.isArrayBuffer(V)) return webidl.converters.BufferSource(V);
		}
		return webidl.converters.USVString(V);
	};
	function onParserDrain() {
		this.ws[kResponse].socket.resume();
	}
	function onParserError(err) {
		let message;
		let code;
		if (err instanceof CloseEvent) {
			message = err.reason;
			code = err.code;
		} else message = err.message;
		fireEvent("error", this, () => new ErrorEvent("error", {
			error: err,
			message
		}));
		closeWebSocketConnection(this, code);
	}
	module.exports = { WebSocket };
}));
//#endregion
//#region node_modules/undici/lib/web/eventsource/util.js
var require_util$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if the given value is a valid LastEventId.
	* @param {string} value
	* @returns {boolean}
	*/
	function isValidLastEventId(value) {
		return value.indexOf("\0") === -1;
	}
	/**
	* Checks if the given value is a base 10 digit.
	* @param {string} value
	* @returns {boolean}
	*/
	function isASCIINumber(value) {
		if (value.length === 0) return false;
		for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) < 48 || value.charCodeAt(i) > 57) return false;
		return true;
	}
	function delay(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms).unref();
		});
	}
	module.exports = {
		isValidLastEventId,
		isASCIINumber,
		delay
	};
}));
//#endregion
//#region node_modules/undici/lib/web/eventsource/eventsource-stream.js
var require_eventsource_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Transform } = __require("node:stream");
	var { isASCIINumber, isValidLastEventId } = require_util$1();
	/**
	* @type {number[]} BOM
	*/
	var BOM = [
		239,
		187,
		191
	];
	/**
	* @type {10} LF
	*/
	var LF = 10;
	/**
	* @type {13} CR
	*/
	var CR = 13;
	/**
	* @type {58} COLON
	*/
	var COLON = 58;
	/**
	* @type {32} SPACE
	*/
	var SPACE = 32;
	var DATA = Buffer.from("data");
	var EVENT = Buffer.from("event");
	var ID = Buffer.from("id");
	var RETRY = Buffer.from("retry");
	function isASCIINumberBytes(buffer, start) {
		if (start >= buffer.length) return false;
		for (let i = start; i < buffer.length; i++) if (buffer[i] < 48 || buffer[i] > 57) return false;
		return true;
	}
	function isValidLastEventIdBytes(buffer, start) {
		for (let i = start; i < buffer.length; i++) if (buffer[i] === 0) return false;
		return true;
	}
	function isFieldName(line, length, field) {
		if (length !== field.length) return false;
		for (let i = 0; i < length; i++) if (line[i] !== field[i]) return false;
		return true;
	}
	/**
	* @typedef {object} EventSourceStreamEvent
	* @type {object}
	* @property {string} [event] The event type.
	* @property {string} [data] The data of the message.
	* @property {string} [id] A unique ID for the event.
	* @property {string} [retry] The reconnection time, in milliseconds.
	*/
	/**
	* @typedef eventSourceSettings
	* @type {object}
	* @property {string} lastEventId The last event ID received from the server.
	* @property {string} origin The origin of the event source.
	* @property {number} reconnectionTime The reconnection time, in milliseconds.
	*/
	var EventSourceStream = class extends Transform {
		/**
		* @type {eventSourceSettings}
		*/
		state = null;
		/**
		* Leading byte-order-mark check.
		* @type {boolean}
		*/
		checkBOM = true;
		/**
		* @type {boolean}
		*/
		crlfCheck = false;
		/**
		* @type {boolean}
		*/
		eventEndCheck = false;
		/**
		* @type {Buffer[]}
		*/
		chunks = [];
		chunkIndex = 0;
		pos = 0;
		lineChunkIndex = 0;
		linePos = 0;
		event = {
			data: void 0,
			event: void 0,
			id: void 0,
			retry: void 0
		};
		/**
		* @param {object} options
		* @param {eventSourceSettings} options.eventSourceSettings
		* @param {Function} [options.push]
		*/
		constructor(options = {}) {
			options.readableObjectMode = true;
			super(options);
			this.state = options.eventSourceSettings || {};
			if (options.push) this.push = options.push;
		}
		/**
		* @param {Buffer} chunk
		* @param {string} _encoding
		* @param {Function} callback
		* @returns {void}
		*/
		_transform(chunk, _encoding, callback) {
			if (chunk.length === 0) {
				callback();
				return;
			}
			this.chunks.push(chunk);
			if (this.checkBOM) {
				if (this.handleBOM()) {
					callback();
					return;
				}
			}
			while (this.hasCurrentByte()) {
				const byte = this.currentByte();
				if (this.eventEndCheck) {
					if (this.crlfCheck) {
						if (byte === LF) {
							this.crlfCheck = false;
							this.consumeCurrentByte();
							continue;
						}
						this.crlfCheck = false;
					}
					if (byte === LF || byte === CR) {
						if (byte === CR) this.crlfCheck = true;
						this.consumeCurrentByte();
						if (this.hasPendingEvent()) this.processEvent(this.event);
						this.clearEvent();
						continue;
					}
					this.eventEndCheck = false;
					continue;
				}
				if (byte === LF || byte === CR) {
					if (byte === CR) this.crlfCheck = true;
					this.parseLine(this.readLine(), this.event);
					this.consumeCurrentByte();
					this.eventEndCheck = true;
					continue;
				}
				this.advanceCursor();
			}
			callback();
		}
		/**
		* @param {Buffer} line
		* @param {EventStreamEvent} event
		*/
		parseLine(line, event) {
			if (line.length === 0) return;
			const colonPosition = line.indexOf(COLON);
			if (colonPosition === 0) return;
			let fieldLength = line.length;
			let valueStart = line.length;
			if (colonPosition !== -1) {
				fieldLength = colonPosition;
				valueStart = colonPosition + 1;
				if (line[valueStart] === SPACE) ++valueStart;
			}
			if (isFieldName(line, fieldLength, DATA)) {
				const value = line.toString("utf8", valueStart);
				if (event.data === void 0) event.data = value;
				else event.data += `\n${value}`;
				return;
			}
			if (isFieldName(line, fieldLength, RETRY)) {
				if (isASCIINumberBytes(line, valueStart)) event.retry = line.toString("utf8", valueStart);
				return;
			}
			if (isFieldName(line, fieldLength, ID)) {
				if (isValidLastEventIdBytes(line, valueStart)) event.id = line.toString("utf8", valueStart);
				return;
			}
			if (isFieldName(line, fieldLength, EVENT)) {
				const value = line.toString("utf8", valueStart);
				if (value.length > 0) event.event = value;
			}
		}
		/**
		* @param {EventSourceStreamEvent} event
		*/
		processEvent(event) {
			if (event.retry && isASCIINumber(event.retry)) this.state.reconnectionTime = parseInt(event.retry, 10);
			if (event.id && isValidLastEventId(event.id)) this.state.lastEventId = event.id;
			if (event.data !== void 0) this.push({
				type: event.event || "message",
				options: {
					data: event.data,
					lastEventId: this.state.lastEventId,
					origin: this.state.origin
				}
			});
		}
		clearEvent() {
			this.event.data = void 0;
			this.event.event = void 0;
			this.event.id = void 0;
			this.event.retry = void 0;
		}
		hasPendingEvent() {
			return this.event.data !== void 0 || this.event.event !== void 0 || this.event.id !== void 0 || this.event.retry !== void 0;
		}
		hasCurrentByte() {
			return this.chunkIndex < this.chunks.length && this.pos < this.chunks[this.chunkIndex].length;
		}
		currentByte() {
			return this.chunks[this.chunkIndex][this.pos];
		}
		consumeCurrentByte() {
			this.advanceCursor();
			this.syncLineStartToCursor();
		}
		advanceCursor() {
			this.pos++;
			while (this.chunkIndex < this.chunks.length && this.pos >= this.chunks[this.chunkIndex].length) {
				this.chunkIndex++;
				this.pos = 0;
			}
		}
		syncLineStartToCursor() {
			this.lineChunkIndex = this.chunkIndex;
			this.linePos = this.pos;
			this.dropConsumedChunks();
		}
		dropConsumedChunks() {
			while (this.lineChunkIndex > 0) {
				this.chunks.shift();
				this.lineChunkIndex--;
				this.chunkIndex--;
			}
			if (this.chunkIndex === this.chunks.length) {
				this.chunks.length = 0;
				this.chunkIndex = 0;
				this.pos = 0;
				this.lineChunkIndex = 0;
				this.linePos = 0;
			}
		}
		readLine() {
			if (this.lineChunkIndex === this.chunkIndex) return this.chunks[this.chunkIndex].subarray(this.linePos, this.pos);
			const chunks = [];
			let length = 0;
			for (let i = this.lineChunkIndex; i <= this.chunkIndex; i++) {
				const chunk = this.chunks[i];
				const start = i === this.lineChunkIndex ? this.linePos : 0;
				const end = i === this.chunkIndex ? this.pos : chunk.length;
				const slice = chunk.subarray(start, end);
				length += slice.length;
				chunks.push(slice);
			}
			return Buffer.concat(chunks, length);
		}
		peekBufferedByte(offset) {
			let chunkIndex = this.lineChunkIndex;
			let pos = this.linePos;
			while (chunkIndex < this.chunks.length) {
				const chunk = this.chunks[chunkIndex];
				const remaining = chunk.length - pos;
				if (offset < remaining) return chunk[pos + offset];
				offset -= remaining;
				chunkIndex++;
				pos = 0;
			}
		}
		discardLeadingBytes(count) {
			while (count > 0 && this.lineChunkIndex < this.chunks.length) {
				const remaining = this.chunks[this.lineChunkIndex].length - this.linePos;
				if (count < remaining) {
					this.linePos += count;
					count = 0;
				} else {
					count -= remaining;
					this.lineChunkIndex++;
					this.linePos = 0;
				}
			}
			this.chunkIndex = this.lineChunkIndex;
			this.pos = this.linePos;
			this.dropConsumedChunks();
		}
		handleBOM() {
			const first = this.peekBufferedByte(0);
			const second = this.peekBufferedByte(1);
			const third = this.peekBufferedByte(2);
			if (second === void 0) {
				if (first === BOM[0]) return true;
				this.checkBOM = false;
				return true;
			}
			if (third === void 0) {
				if (first === BOM[0] && second === BOM[1]) return true;
				this.checkBOM = false;
				return false;
			}
			if (first === BOM[0] && second === BOM[1] && third === BOM[2]) this.discardLeadingBytes(3);
			this.checkBOM = false;
			return !this.hasCurrentByte();
		}
	};
	module.exports = { EventSourceStream };
}));
//#endregion
//#region node_modules/undici/lib/web/eventsource/eventsource.js
var require_eventsource = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { pipeline } = __require("node:stream");
	var { fetching } = require_fetch();
	var { makeRequest } = require_request();
	var { webidl } = require_webidl();
	var { EventSourceStream } = require_eventsource_stream();
	var { parseMIMEType } = require_data_url();
	var { createFastMessageEvent } = require_events();
	var { isNetworkError } = require_response();
	var { delay } = require_util$1();
	var { kEnumerableProperty } = require_util$8();
	var { environmentSettingsObject } = require_util$7();
	var experimentalWarned = false;
	/**
	* A reconnection time, in milliseconds. This must initially be an implementation-defined value,
	* probably in the region of a few seconds.
	*
	* In Comparison:
	* - Chrome uses 3000ms.
	* - Deno uses 5000ms.
	*
	* @type {3000}
	*/
	var defaultReconnectionTime = 3e3;
	/**
	* The readyState attribute represents the state of the connection.
	* @enum
	* @readonly
	* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#dom-eventsource-readystate-dev
	*/
	/**
	* The connection has not yet been established, or it was closed and the user
	* agent is reconnecting.
	* @type {0}
	*/
	var CONNECTING = 0;
	/**
	* The user agent has an open connection and is dispatching events as it
	* receives them.
	* @type {1}
	*/
	var OPEN = 1;
	/**
	* The connection is not open, and the user agent is not trying to reconnect.
	* @type {2}
	*/
	var CLOSED = 2;
	/**
	* Requests for the element will have their mode set to "cors" and their credentials mode set to "same-origin".
	* @type {'anonymous'}
	*/
	var ANONYMOUS = "anonymous";
	/**
	* Requests for the element will have their mode set to "cors" and their credentials mode set to "include".
	* @type {'use-credentials'}
	*/
	var USE_CREDENTIALS = "use-credentials";
	/**
	* The EventSource interface is used to receive server-sent events. It
	* connects to a server over HTTP and receives events in text/event-stream
	* format without closing the connection.
	* @extends {EventTarget}
	* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
	* @api public
	*/
	var EventSource = class EventSource extends EventTarget {
		#events = {
			open: null,
			error: null,
			message: null
		};
		#url = null;
		#withCredentials = false;
		#readyState = CONNECTING;
		#request = null;
		#controller = null;
		#dispatcher;
		/**
		* @type {import('./eventsource-stream').eventSourceSettings}
		*/
		#state;
		/**
		* Creates a new EventSource object.
		* @param {string} url
		* @param {EventSourceInit} [eventSourceInitDict]
		* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#the-eventsource-interface
		*/
		constructor(url, eventSourceInitDict = {}) {
			super();
			webidl.util.markAsUncloneable(this);
			const prefix = "EventSource constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			if (!experimentalWarned) {
				experimentalWarned = true;
				process.emitWarning("EventSource is experimental, expect them to change at any time.", { code: "UNDICI-ES" });
			}
			url = webidl.converters.USVString(url, prefix, "url");
			eventSourceInitDict = webidl.converters.EventSourceInitDict(eventSourceInitDict, prefix, "eventSourceInitDict");
			this.#dispatcher = eventSourceInitDict.dispatcher;
			this.#state = {
				lastEventId: "",
				reconnectionTime: defaultReconnectionTime
			};
			const settings = environmentSettingsObject;
			let urlRecord;
			try {
				urlRecord = new URL(url, settings.settingsObject.baseUrl);
				this.#state.origin = urlRecord.origin;
			} catch (e) {
				throw new DOMException(e, "SyntaxError");
			}
			this.#url = urlRecord.href;
			let corsAttributeState = ANONYMOUS;
			if (eventSourceInitDict.withCredentials) {
				corsAttributeState = USE_CREDENTIALS;
				this.#withCredentials = true;
			}
			const initRequest = {
				redirect: "follow",
				keepalive: true,
				mode: "cors",
				credentials: corsAttributeState === "anonymous" ? "same-origin" : "omit",
				referrer: "no-referrer"
			};
			initRequest.client = environmentSettingsObject.settingsObject;
			initRequest.headersList = [["accept", {
				name: "accept",
				value: "text/event-stream"
			}]];
			initRequest.cache = "no-store";
			initRequest.initiator = "other";
			initRequest.urlList = [new URL(this.#url)];
			this.#request = makeRequest(initRequest);
			this.#connect();
		}
		/**
		* Returns the state of this EventSource object's connection. It can have the
		* values described below.
		* @returns {0|1|2}
		* @readonly
		*/
		get readyState() {
			return this.#readyState;
		}
		/**
		* Returns the URL providing the event stream.
		* @readonly
		* @returns {string}
		*/
		get url() {
			return this.#url;
		}
		/**
		* Returns a boolean indicating whether the EventSource object was
		* instantiated with CORS credentials set (true), or not (false, the default).
		*/
		get withCredentials() {
			return this.#withCredentials;
		}
		#connect() {
			if (this.#readyState === CLOSED) return;
			this.#readyState = CONNECTING;
			const fetchParams = {
				request: this.#request,
				dispatcher: this.#dispatcher
			};
			const processEventSourceEndOfBody = (response) => {
				if (isNetworkError(response)) {
					this.dispatchEvent(new Event("error"));
					this.close();
				}
				this.#reconnect();
			};
			fetchParams.processResponseEndOfBody = processEventSourceEndOfBody;
			fetchParams.processResponse = (response) => {
				if (isNetworkError(response)) {
					if (response.aborted) {
						this.close();
						this.dispatchEvent(new Event("error"));
						return;
					} else {
						this.#reconnect();
						return;
					}
				}
				const contentType = response.headersList.get("content-type", true);
				const mimeType = contentType !== null ? parseMIMEType(contentType) : "failure";
				const contentTypeValid = mimeType !== "failure" && mimeType.essence === "text/event-stream";
				if (response.status !== 200 || contentTypeValid === false) {
					this.close();
					this.dispatchEvent(new Event("error"));
					return;
				}
				this.#readyState = OPEN;
				this.dispatchEvent(new Event("open"));
				this.#state.origin = response.urlList[response.urlList.length - 1].origin;
				const eventSourceStream = new EventSourceStream({
					eventSourceSettings: this.#state,
					push: (event) => {
						this.dispatchEvent(createFastMessageEvent(event.type, event.options));
					}
				});
				pipeline(response.body.stream, eventSourceStream, (error) => {
					if (error?.aborted === false) {
						this.close();
						this.dispatchEvent(new Event("error"));
					}
				});
			};
			this.#controller = fetching(fetchParams);
		}
		/**
		* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#sse-processing-model
		* @returns {Promise<void>}
		*/
		async #reconnect() {
			if (this.#readyState === CLOSED) return;
			this.#readyState = CONNECTING;
			this.dispatchEvent(new Event("error"));
			await delay(this.#state.reconnectionTime);
			if (this.#readyState !== CONNECTING) return;
			if (this.#state.lastEventId.length) this.#request.headersList.set("last-event-id", this.#state.lastEventId, true);
			this.#connect();
		}
		/**
		* Closes the connection, if any, and sets the readyState attribute to
		* CLOSED.
		*/
		close() {
			webidl.brandCheck(this, EventSource);
			if (this.#readyState === CLOSED) return;
			this.#readyState = CLOSED;
			this.#controller.abort();
			this.#request = null;
		}
		get onopen() {
			return this.#events.open;
		}
		set onopen(fn) {
			if (this.#events.open) this.removeEventListener("open", this.#events.open);
			if (typeof fn === "function") {
				this.#events.open = fn;
				this.addEventListener("open", fn);
			} else this.#events.open = null;
		}
		get onmessage() {
			return this.#events.message;
		}
		set onmessage(fn) {
			if (this.#events.message) this.removeEventListener("message", this.#events.message);
			if (typeof fn === "function") {
				this.#events.message = fn;
				this.addEventListener("message", fn);
			} else this.#events.message = null;
		}
		get onerror() {
			return this.#events.error;
		}
		set onerror(fn) {
			if (this.#events.error) this.removeEventListener("error", this.#events.error);
			if (typeof fn === "function") {
				this.#events.error = fn;
				this.addEventListener("error", fn);
			} else this.#events.error = null;
		}
	};
	var constantsPropertyDescriptors = {
		CONNECTING: {
			__proto__: null,
			configurable: false,
			enumerable: true,
			value: CONNECTING,
			writable: false
		},
		OPEN: {
			__proto__: null,
			configurable: false,
			enumerable: true,
			value: OPEN,
			writable: false
		},
		CLOSED: {
			__proto__: null,
			configurable: false,
			enumerable: true,
			value: CLOSED,
			writable: false
		}
	};
	Object.defineProperties(EventSource, constantsPropertyDescriptors);
	Object.defineProperties(EventSource.prototype, constantsPropertyDescriptors);
	Object.defineProperties(EventSource.prototype, {
		close: kEnumerableProperty,
		onerror: kEnumerableProperty,
		onmessage: kEnumerableProperty,
		onopen: kEnumerableProperty,
		readyState: kEnumerableProperty,
		url: kEnumerableProperty,
		withCredentials: kEnumerableProperty
	});
	webidl.converters.EventSourceInitDict = webidl.dictionaryConverter([{
		key: "withCredentials",
		converter: webidl.converters.boolean,
		defaultValue: () => false
	}, {
		key: "dispatcher",
		converter: webidl.converters.any
	}]);
	module.exports = {
		EventSource,
		defaultReconnectionTime
	};
}));
//#endregion
//#region node_modules/undici/index.js
var require_undici = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Client = require_client();
	var Dispatcher = require_dispatcher();
	var Pool = require_pool();
	var BalancedPool = require_balanced_pool();
	var Agent = require_agent();
	var ProxyAgent = require_proxy_agent();
	var EnvHttpProxyAgent = require_env_http_proxy_agent();
	var RetryAgent = require_retry_agent();
	var errors = require_errors$1();
	var util = require_util$8();
	var { InvalidArgumentError } = errors;
	var api = require_api();
	var buildConnector = require_connect();
	var MockClient = require_mock_client();
	var MockAgent = require_mock_agent();
	var MockPool = require_mock_pool();
	var mockErrors = require_mock_errors();
	var RetryHandler = require_retry_handler();
	var { getGlobalDispatcher, setGlobalDispatcher } = require_global();
	var DecoratorHandler = require_decorator_handler();
	var RedirectHandler = require_redirect_handler();
	var createRedirectInterceptor = require_redirect_interceptor();
	Object.assign(Dispatcher.prototype, api);
	module.exports.Dispatcher = Dispatcher;
	module.exports.Client = Client;
	module.exports.Pool = Pool;
	module.exports.BalancedPool = BalancedPool;
	module.exports.Agent = Agent;
	module.exports.ProxyAgent = ProxyAgent;
	module.exports.EnvHttpProxyAgent = EnvHttpProxyAgent;
	module.exports.RetryAgent = RetryAgent;
	module.exports.RetryHandler = RetryHandler;
	module.exports.DecoratorHandler = DecoratorHandler;
	module.exports.RedirectHandler = RedirectHandler;
	module.exports.createRedirectInterceptor = createRedirectInterceptor;
	module.exports.interceptors = {
		redirect: require_redirect(),
		retry: require_retry(),
		dump: require_dump(),
		dns: require_dns()
	};
	module.exports.buildConnector = buildConnector;
	module.exports.errors = errors;
	module.exports.util = {
		parseHeaders: util.parseHeaders,
		headerNameToString: util.headerNameToString
	};
	function makeDispatcher(fn) {
		return (url, opts, handler) => {
			if (typeof opts === "function") {
				handler = opts;
				opts = null;
			}
			if (!url || typeof url !== "string" && typeof url !== "object" && !(url instanceof URL)) throw new InvalidArgumentError("invalid url");
			if (opts != null && typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (opts && opts.path != null) {
				if (typeof opts.path !== "string") throw new InvalidArgumentError("invalid opts.path");
				let path = opts.path;
				if (!opts.path.startsWith("/")) path = `/${path}`;
				url = new URL(util.parseOrigin(url).origin + path);
			} else {
				if (!opts) opts = typeof url === "object" ? url : {};
				url = util.parseURL(url);
			}
			const { agent, dispatcher = getGlobalDispatcher() } = opts;
			if (agent) throw new InvalidArgumentError("unsupported opts.agent. Did you mean opts.client?");
			return fn.call(dispatcher, {
				...opts,
				origin: url.origin,
				path: url.search ? `${url.pathname}${url.search}` : url.pathname,
				method: opts.method || (opts.body ? "PUT" : "GET")
			}, handler);
		};
	}
	module.exports.setGlobalDispatcher = setGlobalDispatcher;
	module.exports.getGlobalDispatcher = getGlobalDispatcher;
	var fetchImpl = require_fetch().fetch;
	module.exports.fetch = async function fetch(init, options = void 0) {
		try {
			return await fetchImpl(init, options);
		} catch (err) {
			if (err && typeof err === "object") Error.captureStackTrace(err);
			throw err;
		}
	};
	module.exports.Headers = require_headers$1().Headers;
	module.exports.Response = require_response().Response;
	module.exports.Request = require_request().Request;
	module.exports.FormData = require_formdata().FormData;
	module.exports.File = globalThis.File ?? __require("node:buffer").File;
	module.exports.FileReader = require_filereader().FileReader;
	var { setGlobalOrigin, getGlobalOrigin } = require_global$1();
	module.exports.setGlobalOrigin = setGlobalOrigin;
	module.exports.getGlobalOrigin = getGlobalOrigin;
	var { CacheStorage } = require_cachestorage();
	var { kConstruct } = require_symbols$1();
	module.exports.caches = new CacheStorage(kConstruct);
	var { deleteCookie, getCookies, getSetCookies, setCookie } = require_cookies();
	module.exports.deleteCookie = deleteCookie;
	module.exports.getCookies = getCookies;
	module.exports.getSetCookies = getSetCookies;
	module.exports.setCookie = setCookie;
	var { parseMIMEType, serializeAMimeType } = require_data_url();
	module.exports.parseMIMEType = parseMIMEType;
	module.exports.serializeAMimeType = serializeAMimeType;
	var { CloseEvent, ErrorEvent, MessageEvent } = require_events();
	module.exports.WebSocket = require_websocket().WebSocket;
	module.exports.CloseEvent = CloseEvent;
	module.exports.ErrorEvent = ErrorEvent;
	module.exports.MessageEvent = MessageEvent;
	module.exports.request = makeDispatcher(api.request);
	module.exports.stream = makeDispatcher(api.stream);
	module.exports.pipeline = makeDispatcher(api.pipeline);
	module.exports.connect = makeDispatcher(api.connect);
	module.exports.upgrade = makeDispatcher(api.upgrade);
	module.exports.MockClient = MockClient;
	module.exports.MockPool = MockPool;
	module.exports.MockAgent = MockAgent;
	module.exports.mockErrors = mockErrors;
	var { EventSource } = require_eventsource();
	module.exports.EventSource = EventSource;
}));
//#endregion
//#region node_modules/@actions/http-client/lib/index.js
var import_tunnel = /* @__PURE__ */ __toESM(require_tunnel(), 1);
var import_undici = require_undici();
var __awaiter$9 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var HttpCodes;
(function(HttpCodes) {
	HttpCodes[HttpCodes["OK"] = 200] = "OK";
	HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
	HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
	HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
	HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
	HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
	HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
	HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
	HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
	HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
	HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
	HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
	HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
	HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
	HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
	HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
	HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
	HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
	HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
	HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
	HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
	HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
	HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
	HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
	HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
	HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
	HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes || (HttpCodes = {}));
var Headers;
(function(Headers) {
	Headers["Accept"] = "accept";
	Headers["ContentType"] = "content-type";
})(Headers || (Headers = {}));
var MediaTypes;
(function(MediaTypes) {
	MediaTypes["ApplicationJson"] = "application/json";
})(MediaTypes || (MediaTypes = {}));
var HttpRedirectCodes = [
	HttpCodes.MovedPermanently,
	HttpCodes.ResourceMoved,
	HttpCodes.SeeOther,
	HttpCodes.TemporaryRedirect,
	HttpCodes.PermanentRedirect
];
var HttpResponseRetryCodes = [
	HttpCodes.BadGateway,
	HttpCodes.ServiceUnavailable,
	HttpCodes.GatewayTimeout
];
var RetryableHttpVerbs = [
	"OPTIONS",
	"GET",
	"DELETE",
	"HEAD"
];
var ExponentialBackoffCeiling = 10;
var ExponentialBackoffTimeSlice = 5;
var HttpClientError = class HttpClientError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.name = "HttpClientError";
		this.statusCode = statusCode;
		Object.setPrototypeOf(this, HttpClientError.prototype);
	}
};
var HttpClientResponse = class {
	constructor(message) {
		this.message = message;
	}
	readBody() {
		return __awaiter$9(this, void 0, void 0, function* () {
			return new Promise((resolve) => __awaiter$9(this, void 0, void 0, function* () {
				let output = Buffer.alloc(0);
				this.message.on("data", (chunk) => {
					output = Buffer.concat([output, chunk]);
				});
				this.message.on("end", () => {
					resolve(output.toString());
				});
			}));
		});
	}
	readBodyBuffer() {
		return __awaiter$9(this, void 0, void 0, function* () {
			return new Promise((resolve) => __awaiter$9(this, void 0, void 0, function* () {
				const chunks = [];
				this.message.on("data", (chunk) => {
					chunks.push(chunk);
				});
				this.message.on("end", () => {
					resolve(Buffer.concat(chunks));
				});
			}));
		});
	}
};
var HttpClient = class {
	constructor(userAgent, handlers, requestOptions) {
		this._ignoreSslError = false;
		this._allowRedirects = true;
		this._allowRedirectDowngrade = false;
		this._maxRedirects = 50;
		this._allowRetries = false;
		this._maxRetries = 1;
		this._keepAlive = false;
		this._disposed = false;
		this.userAgent = this._getUserAgentWithOrchestrationId(userAgent);
		this.handlers = handlers || [];
		this.requestOptions = requestOptions;
		if (requestOptions) {
			if (requestOptions.ignoreSslError != null) this._ignoreSslError = requestOptions.ignoreSslError;
			this._socketTimeout = requestOptions.socketTimeout;
			if (requestOptions.allowRedirects != null) this._allowRedirects = requestOptions.allowRedirects;
			if (requestOptions.allowRedirectDowngrade != null) this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
			if (requestOptions.maxRedirects != null) this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
			if (requestOptions.keepAlive != null) this._keepAlive = requestOptions.keepAlive;
			if (requestOptions.allowRetries != null) this._allowRetries = requestOptions.allowRetries;
			if (requestOptions.maxRetries != null) this._maxRetries = requestOptions.maxRetries;
		}
	}
	options(requestUrl, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("OPTIONS", requestUrl, null, additionalHeaders || {});
		});
	}
	get(requestUrl, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("GET", requestUrl, null, additionalHeaders || {});
		});
	}
	del(requestUrl, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("DELETE", requestUrl, null, additionalHeaders || {});
		});
	}
	post(requestUrl, data, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("POST", requestUrl, data, additionalHeaders || {});
		});
	}
	patch(requestUrl, data, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("PATCH", requestUrl, data, additionalHeaders || {});
		});
	}
	put(requestUrl, data, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("PUT", requestUrl, data, additionalHeaders || {});
		});
	}
	head(requestUrl, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request("HEAD", requestUrl, null, additionalHeaders || {});
		});
	}
	sendStream(verb, requestUrl, stream, additionalHeaders) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return this.request(verb, requestUrl, stream, additionalHeaders);
		});
	}
	/**
	* Gets a typed object from an endpoint
	* Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
	*/
	getJson(requestUrl_1) {
		return __awaiter$9(this, arguments, void 0, function* (requestUrl, additionalHeaders = {}) {
			additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
			const res = yield this.get(requestUrl, additionalHeaders);
			return this._processResponse(res, this.requestOptions);
		});
	}
	postJson(requestUrl_1, obj_1) {
		return __awaiter$9(this, arguments, void 0, function* (requestUrl, obj, additionalHeaders = {}) {
			const data = JSON.stringify(obj, null, 2);
			additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
			additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultContentTypeHeader(additionalHeaders, MediaTypes.ApplicationJson);
			const res = yield this.post(requestUrl, data, additionalHeaders);
			return this._processResponse(res, this.requestOptions);
		});
	}
	putJson(requestUrl_1, obj_1) {
		return __awaiter$9(this, arguments, void 0, function* (requestUrl, obj, additionalHeaders = {}) {
			const data = JSON.stringify(obj, null, 2);
			additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
			additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultContentTypeHeader(additionalHeaders, MediaTypes.ApplicationJson);
			const res = yield this.put(requestUrl, data, additionalHeaders);
			return this._processResponse(res, this.requestOptions);
		});
	}
	patchJson(requestUrl_1, obj_1) {
		return __awaiter$9(this, arguments, void 0, function* (requestUrl, obj, additionalHeaders = {}) {
			const data = JSON.stringify(obj, null, 2);
			additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
			additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultContentTypeHeader(additionalHeaders, MediaTypes.ApplicationJson);
			const res = yield this.patch(requestUrl, data, additionalHeaders);
			return this._processResponse(res, this.requestOptions);
		});
	}
	/**
	* Makes a raw http request.
	* All other methods such as get, post, patch, and request ultimately call this.
	* Prefer get, del, post and patch
	*/
	request(verb, requestUrl, data, headers) {
		return __awaiter$9(this, void 0, void 0, function* () {
			if (this._disposed) throw new Error("Client has already been disposed.");
			const parsedUrl = new URL(requestUrl);
			let info = this._prepareRequest(verb, parsedUrl, headers);
			const maxTries = this._allowRetries && RetryableHttpVerbs.includes(verb) ? this._maxRetries + 1 : 1;
			let numTries = 0;
			let response;
			do {
				response = yield this.requestRaw(info, data);
				if (response && response.message && response.message.statusCode === HttpCodes.Unauthorized) {
					let authenticationHandler;
					for (const handler of this.handlers) if (handler.canHandleAuthentication(response)) {
						authenticationHandler = handler;
						break;
					}
					if (authenticationHandler) return authenticationHandler.handleAuthentication(this, info, data);
					else return response;
				}
				let redirectsRemaining = this._maxRedirects;
				while (response.message.statusCode && HttpRedirectCodes.includes(response.message.statusCode) && this._allowRedirects && redirectsRemaining > 0) {
					const redirectUrl = response.message.headers["location"];
					if (!redirectUrl) break;
					const parsedRedirectUrl = new URL(redirectUrl);
					if (parsedUrl.protocol === "https:" && parsedUrl.protocol !== parsedRedirectUrl.protocol && !this._allowRedirectDowngrade) throw new Error("Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.");
					yield response.readBody();
					if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
						for (const header in headers) if (header.toLowerCase() === "authorization") delete headers[header];
					}
					info = this._prepareRequest(verb, parsedRedirectUrl, headers);
					response = yield this.requestRaw(info, data);
					redirectsRemaining--;
				}
				if (!response.message.statusCode || !HttpResponseRetryCodes.includes(response.message.statusCode)) return response;
				numTries += 1;
				if (numTries < maxTries) {
					yield response.readBody();
					yield this._performExponentialBackoff(numTries);
				}
			} while (numTries < maxTries);
			return response;
		});
	}
	/**
	* Needs to be called if keepAlive is set to true in request options.
	*/
	dispose() {
		if (this._agent) this._agent.destroy();
		this._disposed = true;
	}
	/**
	* Raw request.
	* @param info
	* @param data
	*/
	requestRaw(info, data) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return new Promise((resolve, reject) => {
				function callbackForResult(err, res) {
					if (err) reject(err);
					else if (!res) reject(/* @__PURE__ */ new Error("Unknown error"));
					else resolve(res);
				}
				this.requestRawWithCallback(info, data, callbackForResult);
			});
		});
	}
	/**
	* Raw request with callback.
	* @param info
	* @param data
	* @param onResult
	*/
	requestRawWithCallback(info, data, onResult) {
		if (typeof data === "string") {
			if (!info.options.headers) info.options.headers = {};
			info.options.headers["Content-Length"] = Buffer.byteLength(data, "utf8");
		}
		let callbackCalled = false;
		function handleResult(err, res) {
			if (!callbackCalled) {
				callbackCalled = true;
				onResult(err, res);
			}
		}
		const req = info.httpModule.request(info.options, (msg) => {
			handleResult(void 0, new HttpClientResponse(msg));
		});
		let socket;
		req.on("socket", (sock) => {
			socket = sock;
		});
		req.setTimeout(this._socketTimeout || 18e4, () => {
			if (socket) socket.end();
			handleResult(/* @__PURE__ */ new Error(`Request timeout: ${info.options.path}`));
		});
		req.on("error", function(err) {
			handleResult(err);
		});
		if (data && typeof data === "string") req.write(data, "utf8");
		if (data && typeof data !== "string") {
			data.on("close", function() {
				req.end();
			});
			data.pipe(req);
		} else req.end();
	}
	/**
	* Gets an http agent. This function is useful when you need an http agent that handles
	* routing through a proxy server - depending upon the url and proxy environment variables.
	* @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
	*/
	getAgent(serverUrl) {
		const parsedUrl = new URL(serverUrl);
		return this._getAgent(parsedUrl);
	}
	getAgentDispatcher(serverUrl) {
		const parsedUrl = new URL(serverUrl);
		const proxyUrl = getProxyUrl(parsedUrl);
		if (!(proxyUrl && proxyUrl.hostname)) return;
		return this._getProxyAgentDispatcher(parsedUrl, proxyUrl);
	}
	_prepareRequest(method, requestUrl, headers) {
		const info = {};
		info.parsedUrl = requestUrl;
		const usingSsl = info.parsedUrl.protocol === "https:";
		info.httpModule = usingSsl ? https : http;
		const defaultPort = usingSsl ? 443 : 80;
		info.options = {};
		info.options.host = info.parsedUrl.hostname;
		info.options.port = info.parsedUrl.port ? parseInt(info.parsedUrl.port) : defaultPort;
		info.options.path = (info.parsedUrl.pathname || "") + (info.parsedUrl.search || "");
		info.options.method = method;
		info.options.headers = this._mergeHeaders(headers);
		if (this.userAgent != null) info.options.headers["user-agent"] = this.userAgent;
		info.options.agent = this._getAgent(info.parsedUrl);
		if (this.handlers) for (const handler of this.handlers) handler.prepareRequest(info.options);
		return info;
	}
	_mergeHeaders(headers) {
		if (this.requestOptions && this.requestOptions.headers) return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers || {}));
		return lowercaseKeys(headers || {});
	}
	/**
	* Gets an existing header value or returns a default.
	* Handles converting number header values to strings since HTTP headers must be strings.
	* Note: This returns string | string[] since some headers can have multiple values.
	* For headers that must always be a single string (like Content-Type), use the
	* specialized _getExistingOrDefaultContentTypeHeader method instead.
	*/
	_getExistingOrDefaultHeader(additionalHeaders, header, _default) {
		let clientHeader;
		if (this.requestOptions && this.requestOptions.headers) {
			const headerValue = lowercaseKeys(this.requestOptions.headers)[header];
			if (headerValue) clientHeader = typeof headerValue === "number" ? headerValue.toString() : headerValue;
		}
		const additionalValue = additionalHeaders[header];
		if (additionalValue !== void 0) return typeof additionalValue === "number" ? additionalValue.toString() : additionalValue;
		if (clientHeader !== void 0) return clientHeader;
		return _default;
	}
	/**
	* Specialized version of _getExistingOrDefaultHeader for Content-Type header.
	* Always returns a single string (not an array) since Content-Type should be a single value.
	* Converts arrays to comma-separated strings and numbers to strings to ensure type safety.
	* This was split from _getExistingOrDefaultHeader to provide stricter typing for callers
	* that assign the result to places expecting a string (e.g., additionalHeaders[Headers.ContentType]).
	*/
	_getExistingOrDefaultContentTypeHeader(additionalHeaders, _default) {
		let clientHeader;
		if (this.requestOptions && this.requestOptions.headers) {
			const headerValue = lowercaseKeys(this.requestOptions.headers)[Headers.ContentType];
			if (headerValue) {
				if (typeof headerValue === "number") clientHeader = String(headerValue);
				else if (Array.isArray(headerValue)) clientHeader = headerValue.join(", ");
				else clientHeader = headerValue;
			}
		}
		const additionalValue = additionalHeaders[Headers.ContentType];
		if (additionalValue !== void 0) {
			if (typeof additionalValue === "number") return String(additionalValue);
			else if (Array.isArray(additionalValue)) return additionalValue.join(", ");
			else return additionalValue;
		}
		if (clientHeader !== void 0) return clientHeader;
		return _default;
	}
	_getAgent(parsedUrl) {
		let agent;
		const proxyUrl = getProxyUrl(parsedUrl);
		const useProxy = proxyUrl && proxyUrl.hostname;
		if (this._keepAlive && useProxy) agent = this._proxyAgent;
		if (!useProxy) agent = this._agent;
		if (agent) return agent;
		const usingSsl = parsedUrl.protocol === "https:";
		let maxSockets = 100;
		if (this.requestOptions) maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
		if (proxyUrl && proxyUrl.hostname) {
			const agentOptions = {
				maxSockets,
				keepAlive: this._keepAlive,
				proxy: Object.assign(Object.assign({}, (proxyUrl.username || proxyUrl.password) && { proxyAuth: `${proxyUrl.username}:${proxyUrl.password}` }), {
					host: proxyUrl.hostname,
					port: proxyUrl.port
				})
			};
			let tunnelAgent;
			const overHttps = proxyUrl.protocol === "https:";
			if (usingSsl) tunnelAgent = overHttps ? import_tunnel.httpsOverHttps : import_tunnel.httpsOverHttp;
			else tunnelAgent = overHttps ? import_tunnel.httpOverHttps : import_tunnel.httpOverHttp;
			agent = tunnelAgent(agentOptions);
			this._proxyAgent = agent;
		}
		if (!agent) {
			const options = {
				keepAlive: this._keepAlive,
				maxSockets
			};
			agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
			this._agent = agent;
		}
		if (usingSsl && this._ignoreSslError) agent.options = Object.assign(agent.options || {}, { rejectUnauthorized: false });
		return agent;
	}
	_getProxyAgentDispatcher(parsedUrl, proxyUrl) {
		let proxyAgent;
		if (this._keepAlive) proxyAgent = this._proxyAgentDispatcher;
		if (proxyAgent) return proxyAgent;
		const usingSsl = parsedUrl.protocol === "https:";
		proxyAgent = new import_undici.ProxyAgent(Object.assign({
			uri: proxyUrl.href,
			pipelining: !this._keepAlive ? 0 : 1
		}, (proxyUrl.username || proxyUrl.password) && { token: `Basic ${Buffer.from(`${proxyUrl.username}:${proxyUrl.password}`).toString("base64")}` }));
		this._proxyAgentDispatcher = proxyAgent;
		if (usingSsl && this._ignoreSslError) proxyAgent.options = Object.assign(proxyAgent.options.requestTls || {}, { rejectUnauthorized: false });
		return proxyAgent;
	}
	_getUserAgentWithOrchestrationId(userAgent) {
		const baseUserAgent = userAgent || "actions/http-client";
		const orchId = process.env["ACTIONS_ORCHESTRATION_ID"];
		if (orchId) return `${baseUserAgent} actions_orchestration_id/${orchId.replace(/[^a-z0-9_.-]/gi, "_")}`;
		return baseUserAgent;
	}
	_performExponentialBackoff(retryNumber) {
		return __awaiter$9(this, void 0, void 0, function* () {
			retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
			const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
			return new Promise((resolve) => setTimeout(() => resolve(), ms));
		});
	}
	_processResponse(res, options) {
		return __awaiter$9(this, void 0, void 0, function* () {
			return new Promise((resolve, reject) => __awaiter$9(this, void 0, void 0, function* () {
				const statusCode = res.message.statusCode || 0;
				const response = {
					statusCode,
					result: null,
					headers: {}
				};
				if (statusCode === HttpCodes.NotFound) resolve(response);
				function dateTimeDeserializer(key, value) {
					if (typeof value === "string") {
						const a = new Date(value);
						if (!isNaN(a.valueOf())) return a;
					}
					return value;
				}
				let obj;
				let contents;
				try {
					contents = yield res.readBody();
					if (contents && contents.length > 0) {
						if (options && options.deserializeDates) obj = JSON.parse(contents, dateTimeDeserializer);
						else obj = JSON.parse(contents);
						response.result = obj;
					}
					response.headers = res.message.headers;
				} catch (err) {}
				if (statusCode > 299) {
					let msg;
					if (obj && obj.message) msg = obj.message;
					else if (contents && contents.length > 0) msg = contents;
					else msg = `Failed request: (${statusCode})`;
					const err = new HttpClientError(msg, statusCode);
					err.result = response.result;
					reject(err);
				} else resolve(response);
			}));
		});
	}
};
var lowercaseKeys = (obj) => Object.keys(obj).reduce((c, k) => (c[k.toLowerCase()] = obj[k], c), {});
//#endregion
//#region node_modules/@actions/http-client/lib/auth.js
var __awaiter$8 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var BearerCredentialHandler = class {
	constructor(token) {
		this.token = token;
	}
	prepareRequest(options) {
		if (!options.headers) throw Error("The request has no headers");
		options.headers["Authorization"] = `Bearer ${this.token}`;
	}
	canHandleAuthentication() {
		return false;
	}
	handleAuthentication() {
		return __awaiter$8(this, void 0, void 0, function* () {
			throw new Error("not implemented");
		});
	}
};
//#endregion
//#region node_modules/@actions/core/lib/oidc-utils.js
var __awaiter$7 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var OidcClient = class OidcClient {
	static createHttpClient(allowRetry = true, maxRetry = 10) {
		const requestOptions = {
			allowRetries: allowRetry,
			maxRetries: maxRetry
		};
		return new HttpClient("actions/oidc-client", [new BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
	}
	static getRequestToken() {
		const token = process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
		if (!token) throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable");
		return token;
	}
	static getIDTokenUrl() {
		const runtimeUrl = process.env["ACTIONS_ID_TOKEN_REQUEST_URL"];
		if (!runtimeUrl) throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable");
		return runtimeUrl;
	}
	static getCall(id_token_url) {
		return __awaiter$7(this, void 0, void 0, function* () {
			var _a;
			const id_token = (_a = (yield OidcClient.createHttpClient().getJson(id_token_url).catch((error) => {
				throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.message}`);
			})).result) === null || _a === void 0 ? void 0 : _a.value;
			if (!id_token) throw new Error("Response json body do not have ID Token field");
			return id_token;
		});
	}
	static getIDToken(audience) {
		return __awaiter$7(this, void 0, void 0, function* () {
			try {
				let id_token_url = OidcClient.getIDTokenUrl();
				if (audience) id_token_url = `${id_token_url}&audience=${encodeURIComponent(audience)}`;
				debug(`ID token url is ${id_token_url}`);
				const id_token = yield OidcClient.getCall(id_token_url);
				setSecret(id_token);
				return id_token;
			} catch (error) {
				throw new Error(`Error message: ${error.message}`);
			}
		});
	}
};
//#endregion
//#region node_modules/@actions/core/lib/summary.js
var __awaiter$6 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
var { access, appendFile, writeFile } = promises;
var SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
var Summary = class {
	constructor() {
		this._buffer = "";
	}
	/**
	* Finds the summary file path from the environment, rejects if env var is not found or file does not exist
	* Also checks r/w permissions.
	*
	* @returns step summary file path
	*/
	filePath() {
		return __awaiter$6(this, void 0, void 0, function* () {
			if (this._filePath) return this._filePath;
			const pathFromEnv = process.env[SUMMARY_ENV_VAR];
			if (!pathFromEnv) throw new Error(`Unable to find environment variable for $${SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
			try {
				yield access(pathFromEnv, constants.R_OK | constants.W_OK);
			} catch (_a) {
				throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
			}
			this._filePath = pathFromEnv;
			return this._filePath;
		});
	}
	/**
	* Wraps content in an HTML tag, adding any HTML attributes
	*
	* @param {string} tag HTML tag to wrap
	* @param {string | null} content content within the tag
	* @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
	*
	* @returns {string} content wrapped in HTML element
	*/
	wrap(tag, content, attrs = {}) {
		const htmlAttrs = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
		if (!content) return `<${tag}${htmlAttrs}>`;
		return `<${tag}${htmlAttrs}>${content}</${tag}>`;
	}
	/**
	* Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
	*
	* @param {SummaryWriteOptions} [options] (optional) options for write operation
	*
	* @returns {Promise<Summary>} summary instance
	*/
	write(options) {
		return __awaiter$6(this, void 0, void 0, function* () {
			const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
			const filePath = yield this.filePath();
			yield (overwrite ? writeFile : appendFile)(filePath, this._buffer, { encoding: "utf8" });
			return this.emptyBuffer();
		});
	}
	/**
	* Clears the summary buffer and wipes the summary file
	*
	* @returns {Summary} summary instance
	*/
	clear() {
		return __awaiter$6(this, void 0, void 0, function* () {
			return this.emptyBuffer().write({ overwrite: true });
		});
	}
	/**
	* Returns the current summary buffer as a string
	*
	* @returns {string} string of summary buffer
	*/
	stringify() {
		return this._buffer;
	}
	/**
	* If the summary buffer is empty
	*
	* @returns {boolen} true if the buffer is empty
	*/
	isEmptyBuffer() {
		return this._buffer.length === 0;
	}
	/**
	* Resets the summary buffer without writing to summary file
	*
	* @returns {Summary} summary instance
	*/
	emptyBuffer() {
		this._buffer = "";
		return this;
	}
	/**
	* Adds raw text to the summary buffer
	*
	* @param {string} text content to add
	* @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
	*
	* @returns {Summary} summary instance
	*/
	addRaw(text, addEOL = false) {
		this._buffer += text;
		return addEOL ? this.addEOL() : this;
	}
	/**
	* Adds the operating system-specific end-of-line marker to the buffer
	*
	* @returns {Summary} summary instance
	*/
	addEOL() {
		return this.addRaw(EOL);
	}
	/**
	* Adds an HTML codeblock to the summary buffer
	*
	* @param {string} code content to render within fenced code block
	* @param {string} lang (optional) language to syntax highlight code
	*
	* @returns {Summary} summary instance
	*/
	addCodeBlock(code, lang) {
		const attrs = Object.assign({}, lang && { lang });
		const element = this.wrap("pre", this.wrap("code", code), attrs);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML list to the summary buffer
	*
	* @param {string[]} items list of items to render
	* @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
	*
	* @returns {Summary} summary instance
	*/
	addList(items, ordered = false) {
		const tag = ordered ? "ol" : "ul";
		const listItems = items.map((item) => this.wrap("li", item)).join("");
		const element = this.wrap(tag, listItems);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML table to the summary buffer
	*
	* @param {SummaryTableCell[]} rows table rows
	*
	* @returns {Summary} summary instance
	*/
	addTable(rows) {
		const tableBody = rows.map((row) => {
			const cells = row.map((cell) => {
				if (typeof cell === "string") return this.wrap("td", cell);
				const { header, data, colspan, rowspan } = cell;
				const tag = header ? "th" : "td";
				const attrs = Object.assign(Object.assign({}, colspan && { colspan }), rowspan && { rowspan });
				return this.wrap(tag, data, attrs);
			}).join("");
			return this.wrap("tr", cells);
		}).join("");
		const element = this.wrap("table", tableBody);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds a collapsable HTML details element to the summary buffer
	*
	* @param {string} label text for the closed state
	* @param {string} content collapsable content
	*
	* @returns {Summary} summary instance
	*/
	addDetails(label, content) {
		const element = this.wrap("details", this.wrap("summary", label) + content);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML image tag to the summary buffer
	*
	* @param {string} src path to the image you to embed
	* @param {string} alt text description of the image
	* @param {SummaryImageOptions} options (optional) addition image attributes
	*
	* @returns {Summary} summary instance
	*/
	addImage(src, alt, options) {
		const { width, height } = options || {};
		const attrs = Object.assign(Object.assign({}, width && { width }), height && { height });
		const element = this.wrap("img", null, Object.assign({
			src,
			alt
		}, attrs));
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML section heading element
	*
	* @param {string} text heading text
	* @param {number | string} [level=1] (optional) the heading level, default: 1
	*
	* @returns {Summary} summary instance
	*/
	addHeading(text, level) {
		const tag = `h${level}`;
		const allowedTag = [
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6"
		].includes(tag) ? tag : "h1";
		const element = this.wrap(allowedTag, text);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML thematic break (<hr>) to the summary buffer
	*
	* @returns {Summary} summary instance
	*/
	addSeparator() {
		const element = this.wrap("hr", null);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML line break (<br>) to the summary buffer
	*
	* @returns {Summary} summary instance
	*/
	addBreak() {
		const element = this.wrap("br", null);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML blockquote to the summary buffer
	*
	* @param {string} text quote text
	* @param {string} cite (optional) citation url
	*
	* @returns {Summary} summary instance
	*/
	addQuote(text, cite) {
		const attrs = Object.assign({}, cite && { cite });
		const element = this.wrap("blockquote", text, attrs);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML anchor tag to the summary buffer
	*
	* @param {string} text link text/content
	* @param {string} href hyperlink
	*
	* @returns {Summary} summary instance
	*/
	addLink(text, href) {
		const element = this.wrap("a", text, { href });
		return this.addRaw(element).addEOL();
	}
};
var summary = new Summary();
var { chmod, copyFile, lstat, mkdir, open, readdir: readdir$1, rename, rm, rmdir, stat, symlink, unlink } = fs$1.promises;
process.platform;
fs$1.constants.O_RDONLY;
process.platform;
events.EventEmitter;
events.EventEmitter;
os.platform();
os.arch();
//#endregion
//#region node_modules/@actions/core/lib/core.js
var __awaiter = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
/**
* The code to exit an action
*/
var ExitCode;
(function(ExitCode) {
	/**
	* A code indicating that the action was successful
	*/
	ExitCode[ExitCode["Success"] = 0] = "Success";
	/**
	* A code indicating that the action was a failure
	*/
	ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode || (ExitCode = {}));
/**
* Registers a secret which will get masked from logs
*
* @param secret - Value of the secret to be masked
* @remarks
* This function instructs the Actions runner to mask the specified value in any
* logs produced during the workflow run. Once registered, the secret value will
* be replaced with asterisks (***) whenever it appears in console output, logs,
* or error messages.
*
* This is useful for protecting sensitive information such as:
* - API keys
* - Access tokens
* - Authentication credentials
* - URL parameters containing signatures (SAS tokens)
*
* Note that masking only affects future logs; any previous appearances of the
* secret in logs before calling this function will remain unmasked.
*
* @example
* ```typescript
* // Register an API token as a secret
* const apiToken = "abc123xyz456";
* setSecret(apiToken);
*
* // Now any logs containing this value will show *** instead
* console.log(`Using token: ${apiToken}`); // Outputs: "Using token: ***"
* ```
*/
function setSecret(secret) {
	issueCommand("add-mask", {}, secret);
}
/**
* Sets the action status to failed.
* When the action exits it will be with an exit code of 1
* @param message add error issue message
*/
function setFailed(message) {
	process.exitCode = ExitCode.Failure;
	error(message);
}
/**
* Writes debug message to user log
* @param message debug message
*/
function debug(message) {
	issueCommand("debug", {}, message);
}
/**
* Adds an error issue
* @param message error issue message. Errors will be converted to string via toString()
* @param properties optional properties to add to the annotation.
*/
function error(message, properties = {}) {
	issueCommand("error", toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
/**
* Adds a warning issue
* @param message warning issue message. Errors will be converted to string via toString()
* @param properties optional properties to add to the annotation.
*/
function warning(message, properties = {}) {
	issueCommand("warning", toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
/**
* Writes info to log with console.log.
* @param message info message
*/
function info(message) {
	process.stdout.write(message + os$1.EOL);
}
function getIDToken(aud) {
	return __awaiter(this, void 0, void 0, function* () {
		return yield OidcClient.getIDToken(aud);
	});
}
//#endregion
//#region node_modules/commander/lib/error.js
/**
* CommanderError class
*/
var CommanderError = class extends Error {
	/**
	* Constructs the CommanderError class
	* @param {number} exitCode suggested exit code which could be used with process.exit
	* @param {string} code an id string representing the error
	* @param {string} message human-readable description of the error
	*/
	constructor(exitCode, code, message) {
		super(message);
		Error.captureStackTrace(this, this.constructor);
		this.name = this.constructor.name;
		this.code = code;
		this.exitCode = exitCode;
		this.nestedError = void 0;
	}
};
/**
* InvalidArgumentError class
*/
var InvalidArgumentError = class extends CommanderError {
	/**
	* Constructs the InvalidArgumentError class
	* @param {string} [message] explanation of why argument is invalid
	*/
	constructor(message) {
		super(1, "commander.invalidArgument", message);
		Error.captureStackTrace(this, this.constructor);
		this.name = this.constructor.name;
	}
};
//#endregion
//#region node_modules/commander/lib/argument.js
var Argument = class {
	/**
	* Initialize a new command argument with the given name and description.
	* The default is that the argument is required, and you can explicitly
	* indicate this with <> around the name. Put [] around the name for an optional argument.
	*
	* @param {string} name
	* @param {string} [description]
	*/
	constructor(name, description) {
		this.description = description || "";
		this.variadic = false;
		this.parseArg = void 0;
		this.defaultValue = void 0;
		this.defaultValueDescription = void 0;
		this.argChoices = void 0;
		switch (name[0]) {
			case "<":
				this.required = true;
				this._name = name.slice(1, -1);
				break;
			case "[":
				this.required = false;
				this._name = name.slice(1, -1);
				break;
			default:
				this.required = true;
				this._name = name;
		}
		if (this._name.endsWith("...")) {
			this.variadic = true;
			this._name = this._name.slice(0, -3);
		}
	}
	/**
	* Return argument name.
	*
	* @return {string}
	*/
	name() {
		return this._name;
	}
	/**
	* @package
	*/
	_collectValue(value, previous) {
		if (previous === this.defaultValue || !Array.isArray(previous)) return [value];
		previous.push(value);
		return previous;
	}
	/**
	* Set the default value, and optionally supply the description to be displayed in the help.
	*
	* @param {*} value
	* @param {string} [description]
	* @return {Argument}
	*/
	default(value, description) {
		this.defaultValue = value;
		this.defaultValueDescription = description;
		return this;
	}
	/**
	* Set the custom handler for processing CLI command arguments into argument values.
	*
	* @param {Function} [fn]
	* @return {Argument}
	*/
	argParser(fn) {
		this.parseArg = fn;
		return this;
	}
	/**
	* Only allow argument value to be one of choices.
	*
	* @param {string[]} values
	* @return {Argument}
	*/
	choices(values) {
		this.argChoices = values.slice();
		this.parseArg = (arg, previous) => {
			if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
			if (this.variadic) return this._collectValue(arg, previous);
			return arg;
		};
		return this;
	}
	/**
	* Make argument required.
	*
	* @returns {Argument}
	*/
	argRequired() {
		this.required = true;
		return this;
	}
	/**
	* Make argument optional.
	*
	* @returns {Argument}
	*/
	argOptional() {
		this.required = false;
		return this;
	}
};
/**
* Takes an argument and returns its human readable equivalent for help usage.
*
* @param {Argument} arg
* @return {string}
* @private
*/
function humanReadableArgName(arg) {
	const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
	return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
}
//#endregion
//#region node_modules/commander/lib/help.js
/**
* TypeScript import types for JSDoc, used by Visual Studio Code IntelliSense and `npm run typescript-checkJS`
* https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#import-types
* @typedef { import("./argument.js").Argument } Argument
* @typedef { import("./command.js").Command } Command
* @typedef { import("./option.js").Option } Option
*/
var Help = class {
	constructor() {
		this.helpWidth = void 0;
		this.minWidthToWrap = 40;
		this.sortSubcommands = false;
		this.sortOptions = false;
		this.showGlobalOptions = false;
	}
	/**
	* prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
	* and just before calling `formatHelp()`.
	*
	* Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
	*
	* @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
	*/
	prepareContext(contextOptions) {
		this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
	}
	/**
	* Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
	*
	* @param {Command} cmd
	* @returns {Command[]}
	*/
	visibleCommands(cmd) {
		const visibleCommands = cmd.commands.filter((cmd) => !cmd._hidden);
		const helpCommand = cmd._getHelpCommand();
		if (helpCommand && !helpCommand._hidden) visibleCommands.push(helpCommand);
		if (this.sortSubcommands) visibleCommands.sort((a, b) => {
			return a.name().localeCompare(b.name());
		});
		return visibleCommands;
	}
	/**
	* Compare options for sort.
	*
	* @param {Option} a
	* @param {Option} b
	* @returns {number}
	*/
	compareOptions(a, b) {
		const getSortKey = (option) => {
			return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
		};
		return getSortKey(a).localeCompare(getSortKey(b));
	}
	/**
	* Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
	*
	* @param {Command} cmd
	* @returns {Option[]}
	*/
	visibleOptions(cmd) {
		const visibleOptions = cmd.options.filter((option) => !option.hidden);
		const helpOption = cmd._getHelpOption();
		if (helpOption && !helpOption.hidden) {
			const removeShort = helpOption.short && cmd._findOption(helpOption.short);
			const removeLong = helpOption.long && cmd._findOption(helpOption.long);
			if (!removeShort && !removeLong) visibleOptions.push(helpOption);
			else if (helpOption.long && !removeLong) visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
			else if (helpOption.short && !removeShort) visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
		}
		if (this.sortOptions) visibleOptions.sort(this.compareOptions);
		return visibleOptions;
	}
	/**
	* Get an array of the visible global options. (Not including help.)
	*
	* @param {Command} cmd
	* @returns {Option[]}
	*/
	visibleGlobalOptions(cmd) {
		if (!this.showGlobalOptions) return [];
		const globalOptions = [];
		for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
			const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
			globalOptions.push(...visibleOptions);
		}
		if (this.sortOptions) globalOptions.sort(this.compareOptions);
		return globalOptions;
	}
	/**
	* Get an array of the arguments if any have a description.
	*
	* @param {Command} cmd
	* @returns {Argument[]}
	*/
	visibleArguments(cmd) {
		if (cmd._argsDescription) cmd.registeredArguments.forEach((argument) => {
			argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
		});
		if (cmd.registeredArguments.find((argument) => argument.description)) return cmd.registeredArguments;
		return [];
	}
	/**
	* Get the command term to show in the list of subcommands.
	*
	* @param {Command} cmd
	* @returns {string}
	*/
	subcommandTerm(cmd) {
		const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
		return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
	}
	/**
	* Get the option term to show in the list of options.
	*
	* @param {Option} option
	* @returns {string}
	*/
	optionTerm(option) {
		return option.flags;
	}
	/**
	* Get the argument term to show in the list of arguments.
	*
	* @param {Argument} argument
	* @returns {string}
	*/
	argumentTerm(argument) {
		return argument.name();
	}
	/**
	* Get the longest command term length.
	*
	* @param {Command} cmd
	* @param {Help} helper
	* @returns {number}
	*/
	longestSubcommandTermLength(cmd, helper) {
		return helper.visibleCommands(cmd).reduce((max, command) => {
			return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
		}, 0);
	}
	/**
	* Get the longest option term length.
	*
	* @param {Command} cmd
	* @param {Help} helper
	* @returns {number}
	*/
	longestOptionTermLength(cmd, helper) {
		return helper.visibleOptions(cmd).reduce((max, option) => {
			return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
		}, 0);
	}
	/**
	* Get the longest global option term length.
	*
	* @param {Command} cmd
	* @param {Help} helper
	* @returns {number}
	*/
	longestGlobalOptionTermLength(cmd, helper) {
		return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
			return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
		}, 0);
	}
	/**
	* Get the longest argument term length.
	*
	* @param {Command} cmd
	* @param {Help} helper
	* @returns {number}
	*/
	longestArgumentTermLength(cmd, helper) {
		return helper.visibleArguments(cmd).reduce((max, argument) => {
			return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
		}, 0);
	}
	/**
	* Get the command usage to be displayed at the top of the built-in help.
	*
	* @param {Command} cmd
	* @returns {string}
	*/
	commandUsage(cmd) {
		let cmdName = cmd._name;
		if (cmd._aliases[0]) cmdName = cmdName + "|" + cmd._aliases[0];
		let ancestorCmdNames = "";
		for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
		return ancestorCmdNames + cmdName + " " + cmd.usage();
	}
	/**
	* Get the description for the command.
	*
	* @param {Command} cmd
	* @returns {string}
	*/
	commandDescription(cmd) {
		return cmd.description();
	}
	/**
	* Get the subcommand summary to show in the list of subcommands.
	* (Fallback to description for backwards compatibility.)
	*
	* @param {Command} cmd
	* @returns {string}
	*/
	subcommandDescription(cmd) {
		return cmd.summary() || cmd.description();
	}
	/**
	* Get the option description to show in the list of options.
	*
	* @param {Option} option
	* @return {string}
	*/
	optionDescription(option) {
		const extraInfo = [];
		if (option.argChoices) extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
		if (option.defaultValue !== void 0) {
			if (option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean") extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
		}
		if (option.presetArg !== void 0 && option.optional) extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
		if (option.envVar !== void 0) extraInfo.push(`env: ${option.envVar}`);
		if (extraInfo.length > 0) {
			const extraDescription = `(${extraInfo.join(", ")})`;
			if (option.description) return `${option.description} ${extraDescription}`;
			return extraDescription;
		}
		return option.description;
	}
	/**
	* Get the argument description to show in the list of arguments.
	*
	* @param {Argument} argument
	* @return {string}
	*/
	argumentDescription(argument) {
		const extraInfo = [];
		if (argument.argChoices) extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
		if (argument.defaultValue !== void 0) extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
		if (extraInfo.length > 0) {
			const extraDescription = `(${extraInfo.join(", ")})`;
			if (argument.description) return `${argument.description} ${extraDescription}`;
			return extraDescription;
		}
		return argument.description;
	}
	/**
	* Format a list of items, given a heading and an array of formatted items.
	*
	* @param {string} heading
	* @param {string[]} items
	* @param {Help} helper
	* @returns string[]
	*/
	formatItemList(heading, items, helper) {
		if (items.length === 0) return [];
		return [
			helper.styleTitle(heading),
			...items,
			""
		];
	}
	/**
	* Group items by their help group heading.
	*
	* @param {Command[] | Option[]} unsortedItems
	* @param {Command[] | Option[]} visibleItems
	* @param {Function} getGroup
	* @returns {Map<string, Command[] | Option[]>}
	*/
	groupItems(unsortedItems, visibleItems, getGroup) {
		const result = /* @__PURE__ */ new Map();
		unsortedItems.forEach((item) => {
			const group = getGroup(item);
			if (!result.has(group)) result.set(group, []);
		});
		visibleItems.forEach((item) => {
			const group = getGroup(item);
			if (!result.has(group)) result.set(group, []);
			result.get(group).push(item);
		});
		return result;
	}
	/**
	* Generate the built-in help text.
	*
	* @param {Command} cmd
	* @param {Help} helper
	* @returns {string}
	*/
	formatHelp(cmd, helper) {
		const termWidth = helper.padWidth(cmd, helper);
		const helpWidth = helper.helpWidth ?? 80;
		function callFormatItem(term, description) {
			return helper.formatItem(term, termWidth, description, helper);
		}
		let output = [`${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`, ""];
		const commandDescription = helper.commandDescription(cmd);
		if (commandDescription.length > 0) output = output.concat([helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth), ""]);
		const argumentList = helper.visibleArguments(cmd).map((argument) => {
			return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
		});
		output = output.concat(this.formatItemList("Arguments:", argumentList, helper));
		this.groupItems(cmd.options, helper.visibleOptions(cmd), (option) => option.helpGroupHeading ?? "Options:").forEach((options, group) => {
			const optionList = options.map((option) => {
				return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
			});
			output = output.concat(this.formatItemList(group, optionList, helper));
		});
		if (helper.showGlobalOptions) {
			const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
				return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
			});
			output = output.concat(this.formatItemList("Global Options:", globalOptionList, helper));
		}
		this.groupItems(cmd.commands, helper.visibleCommands(cmd), (sub) => sub.helpGroup() || "Commands:").forEach((commands, group) => {
			const commandList = commands.map((sub) => {
				return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(sub)), helper.styleSubcommandDescription(helper.subcommandDescription(sub)));
			});
			output = output.concat(this.formatItemList(group, commandList, helper));
		});
		return output.join("\n");
	}
	/**
	* Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
	*
	* @param {string} str
	* @returns {number}
	*/
	displayWidth(str) {
		return stripVTControlCharacters(str).length;
	}
	/**
	* Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
	*
	* @param {string} str
	* @returns {string}
	*/
	styleTitle(str) {
		return str;
	}
	styleUsage(str) {
		return str.split(" ").map((word) => {
			if (word === "[options]") return this.styleOptionText(word);
			if (word === "[command]") return this.styleSubcommandText(word);
			if (word[0] === "[" || word[0] === "<") return this.styleArgumentText(word);
			return this.styleCommandText(word);
		}).join(" ");
	}
	styleCommandDescription(str) {
		return this.styleDescriptionText(str);
	}
	styleOptionDescription(str) {
		return this.styleDescriptionText(str);
	}
	styleSubcommandDescription(str) {
		return this.styleDescriptionText(str);
	}
	styleArgumentDescription(str) {
		return this.styleDescriptionText(str);
	}
	styleDescriptionText(str) {
		return str;
	}
	styleOptionTerm(str) {
		return this.styleOptionText(str);
	}
	styleSubcommandTerm(str) {
		return str.split(" ").map((word) => {
			if (word === "[options]") return this.styleOptionText(word);
			if (word[0] === "[" || word[0] === "<") return this.styleArgumentText(word);
			return this.styleSubcommandText(word);
		}).join(" ");
	}
	styleArgumentTerm(str) {
		return this.styleArgumentText(str);
	}
	styleOptionText(str) {
		return str;
	}
	styleArgumentText(str) {
		return str;
	}
	styleSubcommandText(str) {
		return str;
	}
	styleCommandText(str) {
		return str;
	}
	/**
	* Calculate the pad width from the maximum term length.
	*
	* @param {Command} cmd
	* @param {Help} helper
	* @returns {number}
	*/
	padWidth(cmd, helper) {
		return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
	}
	/**
	* Detect manually wrapped and indented strings by checking for line break followed by whitespace.
	*
	* @param {string} str
	* @returns {boolean}
	*/
	preformatted(str) {
		return /\n[^\S\r\n]/.test(str);
	}
	/**
	* Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
	*
	* So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
	*   TTT  DDD DDDD
	*        DD DDD
	*
	* @param {string} term
	* @param {number} termWidth
	* @param {string} description
	* @param {Help} helper
	* @returns {string}
	*/
	formatItem(term, termWidth, description, helper) {
		const itemIndent = 2;
		const itemIndentStr = " ".repeat(itemIndent);
		if (!description) return itemIndentStr + term;
		const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
		const spacerWidth = 2;
		const remainingWidth = (this.helpWidth ?? 80) - termWidth - spacerWidth - itemIndent;
		let formattedDescription;
		if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) formattedDescription = description;
		else formattedDescription = helper.boxWrap(description, remainingWidth).replace(/\n/g, "\n" + " ".repeat(termWidth + spacerWidth));
		return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `\n${itemIndentStr}`);
	}
	/**
	* Wrap a string at whitespace, preserving existing line breaks.
	* Wrapping is skipped if the width is less than `minWidthToWrap`.
	*
	* @param {string} str
	* @param {number} width
	* @returns {string}
	*/
	boxWrap(str, width) {
		if (width < this.minWidthToWrap) return str;
		const rawLines = str.split(/\r\n|\n/);
		const chunkPattern = /[\s]*[^\s]+/g;
		const wrappedLines = [];
		rawLines.forEach((line) => {
			const chunks = line.match(chunkPattern);
			if (chunks === null) {
				wrappedLines.push("");
				return;
			}
			let sumChunks = [chunks.shift()];
			let sumWidth = this.displayWidth(sumChunks[0]);
			chunks.forEach((chunk) => {
				const visibleWidth = this.displayWidth(chunk);
				if (sumWidth + visibleWidth <= width) {
					sumChunks.push(chunk);
					sumWidth += visibleWidth;
					return;
				}
				wrappedLines.push(sumChunks.join(""));
				const nextChunk = chunk.trimStart();
				sumChunks = [nextChunk];
				sumWidth = this.displayWidth(nextChunk);
			});
			wrappedLines.push(sumChunks.join(""));
		});
		return wrappedLines.join("\n");
	}
};
//#endregion
//#region node_modules/commander/lib/option.js
var Option = class {
	/**
	* Initialize a new `Option` with the given `flags` and `description`.
	*
	* @param {string} flags
	* @param {string} [description]
	*/
	constructor(flags, description) {
		this.flags = flags;
		this.description = description || "";
		this.required = flags.includes("<");
		this.optional = flags.includes("[");
		this.variadic = /\w\.\.\.[>\]]$/.test(flags);
		this.mandatory = false;
		const optionFlags = splitOptionFlags(flags);
		this.short = optionFlags.shortFlag;
		this.long = optionFlags.longFlag;
		this.negate = false;
		if (this.long) this.negate = this.long.startsWith("--no-");
		this.defaultValue = void 0;
		this.defaultValueDescription = void 0;
		this.presetArg = void 0;
		this.envVar = void 0;
		this.parseArg = void 0;
		this.hidden = false;
		this.argChoices = void 0;
		this.conflictsWith = [];
		this.implied = void 0;
		this.helpGroupHeading = void 0;
	}
	/**
	* Set the default value, and optionally supply the description to be displayed in the help.
	*
	* @param {*} value
	* @param {string} [description]
	* @return {Option}
	*/
	default(value, description) {
		this.defaultValue = value;
		this.defaultValueDescription = description;
		return this;
	}
	/**
	* Preset to use when option used without option-argument, especially optional but also boolean and negated.
	* The custom processing (parseArg) is called.
	*
	* @example
	* new Option('--color').default('GREYSCALE').preset('RGB');
	* new Option('--donate [amount]').preset('20').argParser(parseFloat);
	*
	* @param {*} arg
	* @return {Option}
	*/
	preset(arg) {
		this.presetArg = arg;
		return this;
	}
	/**
	* Add option name(s) that conflict with this option.
	* An error will be displayed if conflicting options are found during parsing.
	*
	* @example
	* new Option('--rgb').conflicts('cmyk');
	* new Option('--js').conflicts(['ts', 'jsx']);
	*
	* @param {(string | string[])} names
	* @return {Option}
	*/
	conflicts(names) {
		this.conflictsWith = this.conflictsWith.concat(names);
		return this;
	}
	/**
	* Specify implied option values for when this option is set and the implied options are not.
	*
	* The custom processing (parseArg) is not called on the implied values.
	*
	* @example
	* program
	*   .addOption(new Option('--log', 'write logging information to file'))
	*   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
	*
	* @param {object} impliedOptionValues
	* @return {Option}
	*/
	implies(impliedOptionValues) {
		let newImplied = impliedOptionValues;
		if (typeof impliedOptionValues === "string") newImplied = { [impliedOptionValues]: true };
		this.implied = Object.assign(this.implied || {}, newImplied);
		return this;
	}
	/**
	* Set environment variable to check for option value.
	*
	* An environment variable is only used if when processed the current option value is
	* undefined, or the source of the current value is 'default' or 'config' or 'env'.
	*
	* @param {string} name
	* @return {Option}
	*/
	env(name) {
		this.envVar = name;
		return this;
	}
	/**
	* Set the custom handler for processing CLI option arguments into option values.
	*
	* @param {Function} [fn]
	* @return {Option}
	*/
	argParser(fn) {
		this.parseArg = fn;
		return this;
	}
	/**
	* Whether the option is mandatory and must have a value after parsing.
	*
	* @param {boolean} [mandatory=true]
	* @return {Option}
	*/
	makeOptionMandatory(mandatory = true) {
		this.mandatory = !!mandatory;
		return this;
	}
	/**
	* Hide option in help.
	*
	* @param {boolean} [hide=true]
	* @return {Option}
	*/
	hideHelp(hide = true) {
		this.hidden = !!hide;
		return this;
	}
	/**
	* @package
	*/
	_collectValue(value, previous) {
		if (previous === this.defaultValue || !Array.isArray(previous)) return [value];
		previous.push(value);
		return previous;
	}
	/**
	* Only allow option value to be one of choices.
	*
	* @param {string[]} values
	* @return {Option}
	*/
	choices(values) {
		this.argChoices = values.slice();
		this.parseArg = (arg, previous) => {
			if (!this.argChoices.includes(arg)) throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
			if (this.variadic) return this._collectValue(arg, previous);
			return arg;
		};
		return this;
	}
	/**
	* Return option name.
	*
	* @return {string}
	*/
	name() {
		if (this.long) return this.long.replace(/^--/, "");
		return this.short.replace(/^-/, "");
	}
	/**
	* Return option name, in a camelcase format that can be used
	* as an object attribute key.
	*
	* @return {string}
	*/
	attributeName() {
		if (this.negate) return camelcase(this.name().replace(/^no-/, ""));
		return camelcase(this.name());
	}
	/**
	* Set the help group heading.
	*
	* @param {string} heading
	* @return {Option}
	*/
	helpGroup(heading) {
		this.helpGroupHeading = heading;
		return this;
	}
	/**
	* Check if `arg` matches the short or long flag.
	*
	* @param {string} arg
	* @return {boolean}
	* @package
	*/
	is(arg) {
		return this.short === arg || this.long === arg;
	}
	/**
	* Return whether a boolean option.
	*
	* Options are one of boolean, negated, required argument, or optional argument.
	*
	* @return {boolean}
	* @package
	*/
	isBoolean() {
		return !this.required && !this.optional && !this.negate;
	}
};
/**
* This class is to make it easier to work with dual options, without changing the existing
* implementation. We support separate dual options for separate positive and negative options,
* like `--build` and `--no-build`, which share a single option value. This works nicely for some
* use cases, but is tricky for others where we want separate behaviours despite
* the single shared option value.
*/
var DualOptions = class {
	/**
	* @param {Option[]} options
	*/
	constructor(options) {
		this.positiveOptions = /* @__PURE__ */ new Map();
		this.negativeOptions = /* @__PURE__ */ new Map();
		this.dualOptions = /* @__PURE__ */ new Set();
		options.forEach((option) => {
			if (option.negate) this.negativeOptions.set(option.attributeName(), option);
			else this.positiveOptions.set(option.attributeName(), option);
		});
		this.negativeOptions.forEach((value, key) => {
			if (this.positiveOptions.has(key)) this.dualOptions.add(key);
		});
	}
	/**
	* Did the value come from the option, and not from possible matching dual option?
	*
	* @param {*} value
	* @param {Option} option
	* @returns {boolean}
	*/
	valueFromOption(value, option) {
		const optionKey = option.attributeName();
		if (!this.dualOptions.has(optionKey)) return true;
		const preset = this.negativeOptions.get(optionKey).presetArg;
		const negativeValue = preset !== void 0 ? preset : false;
		return option.negate === (negativeValue === value);
	}
};
/**
* Convert string from kebab-case to camelCase.
*
* @param {string} str
* @return {string}
* @private
*/
function camelcase(str) {
	return str.split("-").reduce((str, word) => {
		return str + word[0].toUpperCase() + word.slice(1);
	});
}
/**
* Split the short and long flag out of something like '-m,--mixed <value>'
*
* @private
*/
function splitOptionFlags(flags) {
	let shortFlag;
	let longFlag;
	const shortFlagExp = /^-[^-]$/;
	const longFlagExp = /^--[^-]/;
	const flagParts = flags.split(/[ |,]+/).concat("guard");
	if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
	if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
	if (!shortFlag && shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
	if (!shortFlag && longFlagExp.test(flagParts[0])) {
		shortFlag = longFlag;
		longFlag = flagParts.shift();
	}
	if (flagParts[0].startsWith("-")) {
		const unsupportedFlag = flagParts[0];
		const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
		if (/^-[^-][^-]/.test(unsupportedFlag)) throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
		if (shortFlagExp.test(unsupportedFlag)) throw new Error(`${baseError}
- too many short flags`);
		if (longFlagExp.test(unsupportedFlag)) throw new Error(`${baseError}
- too many long flags`);
		throw new Error(`${baseError}
- unrecognised flag format`);
	}
	if (shortFlag === void 0 && longFlag === void 0) throw new Error(`option creation failed due to no flags found in '${flags}'.`);
	return {
		shortFlag,
		longFlag
	};
}
//#endregion
//#region node_modules/commander/lib/suggestSimilar.js
var maxDistance = 3;
function editDistance(a, b) {
	if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);
	const d = [];
	for (let i = 0; i <= a.length; i++) d[i] = [i];
	for (let j = 0; j <= b.length; j++) d[0][j] = j;
	for (let j = 1; j <= b.length; j++) for (let i = 1; i <= a.length; i++) {
		let cost;
		if (a[i - 1] === b[j - 1]) cost = 0;
		else cost = 1;
		d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
		if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
	}
	return d[a.length][b.length];
}
/**
* Find close matches, restricted to same number of edits.
*
* @param {string} word
* @param {string[]} candidates
* @returns {string}
*/
function suggestSimilar(word, candidates) {
	if (!candidates || candidates.length === 0) return "";
	candidates = Array.from(new Set(candidates));
	const searchingOptions = word.startsWith("--");
	if (searchingOptions) {
		word = word.slice(2);
		candidates = candidates.map((candidate) => candidate.slice(2));
	}
	let similar = [];
	let bestDistance = maxDistance;
	const minSimilarity = .4;
	candidates.forEach((candidate) => {
		if (candidate.length <= 1) return;
		const distance = editDistance(word, candidate);
		const length = Math.max(word.length, candidate.length);
		if ((length - distance) / length > minSimilarity) {
			if (distance < bestDistance) {
				bestDistance = distance;
				similar = [candidate];
			} else if (distance === bestDistance) similar.push(candidate);
		}
	});
	similar.sort((a, b) => a.localeCompare(b));
	if (searchingOptions) similar = similar.map((candidate) => `--${candidate}`);
	if (similar.length > 1) return `\n(Did you mean one of ${similar.join(", ")}?)`;
	if (similar.length === 1) return `\n(Did you mean ${similar[0]}?)`;
	return "";
}
//#endregion
//#region node_modules/commander/lib/command.js
var Command = class Command extends EventEmitter {
	/**
	* Initialize a new `Command`.
	*
	* @param {string} [name]
	*/
	constructor(name) {
		super();
		/** @type {Command[]} */
		this.commands = [];
		/** @type {Option[]} */
		this.options = [];
		this.parent = null;
		this._allowUnknownOption = false;
		this._allowExcessArguments = false;
		/** @type {Argument[]} */
		this.registeredArguments = [];
		this._args = this.registeredArguments;
		/** @type {string[]} */
		this.args = [];
		this.rawArgs = [];
		this.processedArgs = [];
		this._scriptPath = null;
		this._name = name || "";
		this._optionValues = {};
		this._optionValueSources = {};
		this._storeOptionsAsProperties = false;
		this._actionHandler = null;
		this._executableHandler = false;
		this._executableFile = null;
		this._executableDir = null;
		this._defaultCommandName = null;
		this._exitCallback = null;
		this._aliases = [];
		this._combineFlagAndOptionalValue = true;
		this._description = "";
		this._summary = "";
		this._argsDescription = void 0;
		this._enablePositionalOptions = false;
		this._passThroughOptions = false;
		this._lifeCycleHooks = {};
		/** @type {(boolean | string)} */
		this._showHelpAfterError = false;
		this._showSuggestionAfterError = true;
		this._savedState = null;
		this._outputConfiguration = {
			writeOut: (str) => process$1.stdout.write(str),
			writeErr: (str) => process$1.stderr.write(str),
			outputError: (str, write) => write(str),
			getOutHelpWidth: () => process$1.stdout.isTTY ? process$1.stdout.columns : void 0,
			getErrHelpWidth: () => process$1.stderr.isTTY ? process$1.stderr.columns : void 0,
			getOutHasColors: () => useColor() ?? (process$1.stdout.isTTY && process$1.stdout.hasColors?.()),
			getErrHasColors: () => useColor() ?? (process$1.stderr.isTTY && process$1.stderr.hasColors?.()),
			stripColor: (str) => stripVTControlCharacters(str)
		};
		this._hidden = false;
		/** @type {(Option | null | undefined)} */
		this._helpOption = void 0;
		this._addImplicitHelpCommand = void 0;
		/** @type {Command} */
		this._helpCommand = void 0;
		this._helpConfiguration = {};
		/** @type {string | undefined} */
		this._helpGroupHeading = void 0;
		/** @type {string | undefined} */
		this._defaultCommandGroup = void 0;
		/** @type {string | undefined} */
		this._defaultOptionGroup = void 0;
	}
	/**
	* Copy settings that are useful to have in common across root command and subcommands.
	*
	* (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
	*
	* @param {Command} sourceCommand
	* @return {Command} `this` command for chaining
	*/
	copyInheritedSettings(sourceCommand) {
		this._outputConfiguration = sourceCommand._outputConfiguration;
		this._helpOption = sourceCommand._helpOption;
		this._helpCommand = sourceCommand._helpCommand;
		this._helpConfiguration = sourceCommand._helpConfiguration;
		this._exitCallback = sourceCommand._exitCallback;
		this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
		this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
		this._allowExcessArguments = sourceCommand._allowExcessArguments;
		this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
		this._showHelpAfterError = sourceCommand._showHelpAfterError;
		this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
		return this;
	}
	/**
	* @returns {Command[]}
	* @private
	*/
	_getCommandAndAncestors() {
		const result = [];
		for (let command = this; command; command = command.parent) result.push(command);
		return result;
	}
	/**
	* Define a command.
	*
	* There are two styles of command: pay attention to where to put the description.
	*
	* @example
	* // Command implemented using action handler (description is supplied separately to `.command`)
	* program
	*   .command('clone <source> [destination]')
	*   .description('clone a repository into a newly created directory')
	*   .action((source, destination) => {
	*     console.log('clone command called');
	*   });
	*
	* // Command implemented using separate executable file (description is second parameter to `.command`)
	* program
	*   .command('start <service>', 'start named service')
	*   .command('stop [service]', 'stop named service, or all if no name supplied');
	*
	* @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
	* @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
	* @param {object} [execOpts] - configuration options (for executable)
	* @return {Command} returns new command for action handler, or `this` for executable command
	*/
	command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
		let desc = actionOptsOrExecDesc;
		let opts = execOpts;
		if (typeof desc === "object" && desc !== null) {
			opts = desc;
			desc = null;
		}
		opts = opts || {};
		const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
		const cmd = this.createCommand(name);
		if (desc) {
			cmd.description(desc);
			cmd._executableHandler = true;
		}
		if (opts.isDefault) this._defaultCommandName = cmd._name;
		cmd._hidden = !!(opts.noHelp || opts.hidden);
		cmd._executableFile = opts.executableFile || null;
		if (args) cmd.arguments(args);
		this._registerCommand(cmd);
		cmd.parent = this;
		cmd.copyInheritedSettings(this);
		if (desc) return this;
		return cmd;
	}
	/**
	* Factory routine to create a new unattached command.
	*
	* See .command() for creating an attached subcommand, which uses this routine to
	* create the command. You can override createCommand to customise subcommands.
	*
	* @param {string} [name]
	* @return {Command} new command
	*/
	createCommand(name) {
		return new Command(name);
	}
	/**
	* You can customise the help with a subclass of Help by overriding createHelp,
	* or by overriding Help properties using configureHelp().
	*
	* @return {Help}
	*/
	createHelp() {
		return Object.assign(new Help(), this.configureHelp());
	}
	/**
	* You can customise the help by overriding Help properties using configureHelp(),
	* or with a subclass of Help by overriding createHelp().
	*
	* @param {object} [configuration] - configuration options
	* @return {(Command | object)} `this` command for chaining, or stored configuration
	*/
	configureHelp(configuration) {
		if (configuration === void 0) return this._helpConfiguration;
		this._helpConfiguration = configuration;
		return this;
	}
	/**
	* The default output goes to stdout and stderr. You can customise this for special
	* applications. You can also customise the display of errors by overriding outputError.
	*
	* The configuration properties are all functions:
	*
	*     // change how output being written, defaults to stdout and stderr
	*     writeOut(str)
	*     writeErr(str)
	*     // change how output being written for errors, defaults to writeErr
	*     outputError(str, write) // used for displaying errors and not used for displaying help
	*     // specify width for wrapping help
	*     getOutHelpWidth()
	*     getErrHelpWidth()
	*     // color support, currently only used with Help
	*     getOutHasColors()
	*     getErrHasColors()
	*     stripColor() // used to remove ANSI escape codes if output does not have colors
	*
	* @param {object} [configuration] - configuration options
	* @return {(Command | object)} `this` command for chaining, or stored configuration
	*/
	configureOutput(configuration) {
		if (configuration === void 0) return this._outputConfiguration;
		this._outputConfiguration = {
			...this._outputConfiguration,
			...configuration
		};
		return this;
	}
	/**
	* Display the help or a custom message after an error occurs.
	*
	* @param {(boolean|string)} [displayHelp]
	* @return {Command} `this` command for chaining
	*/
	showHelpAfterError(displayHelp = true) {
		if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
		this._showHelpAfterError = displayHelp;
		return this;
	}
	/**
	* Display suggestion of similar commands for unknown commands, or options for unknown options.
	*
	* @param {boolean} [displaySuggestion]
	* @return {Command} `this` command for chaining
	*/
	showSuggestionAfterError(displaySuggestion = true) {
		this._showSuggestionAfterError = !!displaySuggestion;
		return this;
	}
	/**
	* Add a prepared subcommand.
	*
	* See .command() for creating an attached subcommand which inherits settings from its parent.
	*
	* @param {Command} cmd - new subcommand
	* @param {object} [opts] - configuration options
	* @return {Command} `this` command for chaining
	*/
	addCommand(cmd, opts) {
		if (!cmd._name) throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
		opts = opts || {};
		if (opts.isDefault) this._defaultCommandName = cmd._name;
		if (opts.noHelp || opts.hidden) cmd._hidden = true;
		this._registerCommand(cmd);
		cmd.parent = this;
		cmd._checkForBrokenPassThrough();
		return this;
	}
	/**
	* Factory routine to create a new unattached argument.
	*
	* See .argument() for creating an attached argument, which uses this routine to
	* create the argument. You can override createArgument to return a custom argument.
	*
	* @param {string} name
	* @param {string} [description]
	* @return {Argument} new argument
	*/
	createArgument(name, description) {
		return new Argument(name, description);
	}
	/**
	* Define argument syntax for command.
	*
	* The default is that the argument is required, and you can explicitly
	* indicate this with <> around the name. Put [] around the name for an optional argument.
	*
	* @example
	* program.argument('<input-file>');
	* program.argument('[output-file]');
	*
	* @param {string} name
	* @param {string} [description]
	* @param {(Function|*)} [parseArg] - custom argument processing function or default value
	* @param {*} [defaultValue]
	* @return {Command} `this` command for chaining
	*/
	argument(name, description, parseArg, defaultValue) {
		const argument = this.createArgument(name, description);
		if (typeof parseArg === "function") argument.default(defaultValue).argParser(parseArg);
		else argument.default(parseArg);
		this.addArgument(argument);
		return this;
	}
	/**
	* Define argument syntax for command, adding multiple at once (without descriptions).
	*
	* See also .argument().
	*
	* @example
	* program.arguments('<cmd> [env]');
	*
	* @param {string} names
	* @return {Command} `this` command for chaining
	*/
	arguments(names) {
		names.trim().split(/ +/).forEach((detail) => {
			this.argument(detail);
		});
		return this;
	}
	/**
	* Define argument syntax for command, adding a prepared argument.
	*
	* @param {Argument} argument
	* @return {Command} `this` command for chaining
	*/
	addArgument(argument) {
		const previousArgument = this.registeredArguments.slice(-1)[0];
		if (previousArgument?.variadic) throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
		if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
		this.registeredArguments.push(argument);
		return this;
	}
	/**
	* Customise or override default help command. By default a help command is automatically added if your command has subcommands.
	*
	* @example
	*    program.helpCommand('help [cmd]');
	*    program.helpCommand('help [cmd]', 'show help');
	*    program.helpCommand(false); // suppress default help command
	*    program.helpCommand(true); // add help command even if no subcommands
	*
	* @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
	* @param {string} [description] - custom description
	* @return {Command} `this` command for chaining
	*/
	helpCommand(enableOrNameAndArgs, description) {
		if (typeof enableOrNameAndArgs === "boolean") {
			this._addImplicitHelpCommand = enableOrNameAndArgs;
			if (enableOrNameAndArgs && this._defaultCommandGroup) this._initCommandGroup(this._getHelpCommand());
			return this;
		}
		const [, helpName, helpArgs] = (enableOrNameAndArgs ?? "help [command]").match(/([^ ]+) *(.*)/);
		const helpDescription = description ?? "display help for command";
		const helpCommand = this.createCommand(helpName);
		helpCommand.helpOption(false);
		if (helpArgs) helpCommand.arguments(helpArgs);
		if (helpDescription) helpCommand.description(helpDescription);
		this._addImplicitHelpCommand = true;
		this._helpCommand = helpCommand;
		if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
		return this;
	}
	/**
	* Add prepared custom help command.
	*
	* @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
	* @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
	* @return {Command} `this` command for chaining
	*/
	addHelpCommand(helpCommand, deprecatedDescription) {
		if (typeof helpCommand !== "object") {
			this.helpCommand(helpCommand, deprecatedDescription);
			return this;
		}
		this._addImplicitHelpCommand = true;
		this._helpCommand = helpCommand;
		this._initCommandGroup(helpCommand);
		return this;
	}
	/**
	* Lazy create help command.
	*
	* @return {(Command|null)}
	* @package
	*/
	_getHelpCommand() {
		if (this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"))) {
			if (this._helpCommand === void 0) this.helpCommand(void 0, void 0);
			return this._helpCommand;
		}
		return null;
	}
	/**
	* Add hook for life cycle event.
	*
	* @param {string} event
	* @param {Function} listener
	* @return {Command} `this` command for chaining
	*/
	hook(event, listener) {
		const allowedValues = [
			"preSubcommand",
			"preAction",
			"postAction"
		];
		if (!allowedValues.includes(event)) throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
		if (this._lifeCycleHooks[event]) this._lifeCycleHooks[event].push(listener);
		else this._lifeCycleHooks[event] = [listener];
		return this;
	}
	/**
	* Register callback to use as replacement for calling process.exit.
	*
	* @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
	* @return {Command} `this` command for chaining
	*/
	exitOverride(fn) {
		if (fn) this._exitCallback = fn;
		else this._exitCallback = (err) => {
			if (err.code !== "commander.executeSubCommandAsync") throw err;
		};
		return this;
	}
	/**
	* Call process.exit, and _exitCallback if defined.
	*
	* @param {number} exitCode exit code for using with process.exit
	* @param {string} code an id string representing the error
	* @param {string} message human-readable description of the error
	* @return never
	* @private
	*/
	_exit(exitCode, code, message) {
		if (this._exitCallback) this._exitCallback(new CommanderError(exitCode, code, message));
		process$1.exit(exitCode);
	}
	/**
	* Register callback `fn` for the command.
	*
	* @example
	* program
	*   .command('serve')
	*   .description('start service')
	*   .action(function() {
	*      // do work here
	*   });
	*
	* @param {Function} fn
	* @return {Command} `this` command for chaining
	*/
	action(fn) {
		const listener = (args) => {
			const expectedArgsCount = this.registeredArguments.length;
			const actionArgs = args.slice(0, expectedArgsCount);
			if (this._storeOptionsAsProperties) actionArgs[expectedArgsCount] = this;
			else actionArgs[expectedArgsCount] = this.opts();
			actionArgs.push(this);
			return fn.apply(this, actionArgs);
		};
		this._actionHandler = listener;
		return this;
	}
	/**
	* Factory routine to create a new unattached option.
	*
	* See .option() for creating an attached option, which uses this routine to
	* create the option. You can override createOption to return a custom option.
	*
	* @param {string} flags
	* @param {string} [description]
	* @return {Option} new option
	*/
	createOption(flags, description) {
		return new Option(flags, description);
	}
	/**
	* Wrap parseArgs to catch 'commander.invalidArgument'.
	*
	* @param {(Option | Argument)} target
	* @param {string} value
	* @param {*} previous
	* @param {string} invalidArgumentMessage
	* @private
	*/
	_callParseArg(target, value, previous, invalidArgumentMessage) {
		try {
			return target.parseArg(value, previous);
		} catch (err) {
			if (err.code === "commander.invalidArgument") {
				const message = `${invalidArgumentMessage} ${err.message}`;
				this.error(message, {
					exitCode: err.exitCode,
					code: err.code
				});
			}
			throw err;
		}
	}
	/**
	* Check for option flag conflicts.
	* Register option if no conflicts found, or throw on conflict.
	*
	* @param {Option} option
	* @private
	*/
	_registerOption(option) {
		const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
		if (matchingOption) {
			const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
			throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
		}
		this._initOptionGroup(option);
		this.options.push(option);
	}
	/**
	* Check for command name and alias conflicts with existing commands.
	* Register command if no conflicts found, or throw on conflict.
	*
	* @param {Command} command
	* @private
	*/
	_registerCommand(command) {
		const knownBy = (cmd) => {
			return [cmd.name()].concat(cmd.aliases());
		};
		const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
		if (alreadyUsed) {
			const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
			const newCmd = knownBy(command).join("|");
			throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
		}
		this._initCommandGroup(command);
		this.commands.push(command);
	}
	/**
	* Add an option.
	*
	* @param {Option} option
	* @return {Command} `this` command for chaining
	*/
	addOption(option) {
		this._registerOption(option);
		const oname = option.name();
		const name = option.attributeName();
		if (option.defaultValue !== void 0) this.setOptionValueWithSource(name, option.defaultValue, "default");
		const handleOptionValue = (val, invalidValueMessage, valueSource) => {
			if (val == null && option.presetArg !== void 0) val = option.presetArg;
			const oldValue = this.getOptionValue(name);
			if (val !== null && option.parseArg) val = this._callParseArg(option, val, oldValue, invalidValueMessage);
			else if (val !== null && option.variadic) val = option._collectValue(val, oldValue);
			if (val == null) {
				if (option.negate) val = false;
				else if (option.isBoolean() || option.optional) val = true;
				else val = "";
			}
			this.setOptionValueWithSource(name, val, valueSource);
		};
		this.on("option:" + oname, (val) => {
			const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
			handleOptionValue(val, invalidValueMessage, "cli");
		});
		if (option.envVar) this.on("optionEnv:" + oname, (val) => {
			const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
			handleOptionValue(val, invalidValueMessage, "env");
		});
		return this;
	}
	/**
	* Internal implementation shared by .option() and .requiredOption()
	*
	* @return {Command} `this` command for chaining
	* @private
	*/
	_optionEx(config, flags, description, fn, defaultValue) {
		if (typeof flags === "object" && flags instanceof Option) throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
		const option = this.createOption(flags, description);
		option.makeOptionMandatory(!!config.mandatory);
		if (typeof fn === "function") option.default(defaultValue).argParser(fn);
		else if (fn instanceof RegExp) {
			const regex = fn;
			fn = (val, def) => {
				const m = regex.exec(val);
				return m ? m[0] : def;
			};
			option.default(defaultValue).argParser(fn);
		} else option.default(fn);
		return this.addOption(option);
	}
	/**
	* Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
	*
	* The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
	* option-argument is indicated by `<>` and an optional option-argument by `[]`.
	*
	* See the README for more details, and see also addOption() and requiredOption().
	*
	* @example
	* program
	*     .option('-p, --pepper', 'add pepper')
	*     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
	*     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
	*     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
	*
	* @param {string} flags
	* @param {string} [description]
	* @param {(Function|*)} [parseArg] - custom option processing function or default value
	* @param {*} [defaultValue]
	* @return {Command} `this` command for chaining
	*/
	option(flags, description, parseArg, defaultValue) {
		return this._optionEx({}, flags, description, parseArg, defaultValue);
	}
	/**
	* Add a required option which must have a value after parsing. This usually means
	* the option must be specified on the command line. (Otherwise the same as .option().)
	*
	* The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
	*
	* @param {string} flags
	* @param {string} [description]
	* @param {(Function|*)} [parseArg] - custom option processing function or default value
	* @param {*} [defaultValue]
	* @return {Command} `this` command for chaining
	*/
	requiredOption(flags, description, parseArg, defaultValue) {
		return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
	}
	/**
	* Alter parsing of short flags with optional values.
	*
	* @example
	* // for `.option('-f,--flag [value]'):
	* program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
	* program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
	*
	* @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
	* @return {Command} `this` command for chaining
	*/
	combineFlagAndOptionalValue(combine = true) {
		this._combineFlagAndOptionalValue = !!combine;
		return this;
	}
	/**
	* Allow unknown options on the command line.
	*
	* @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
	* @return {Command} `this` command for chaining
	*/
	allowUnknownOption(allowUnknown = true) {
		this._allowUnknownOption = !!allowUnknown;
		return this;
	}
	/**
	* Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
	*
	* @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
	* @return {Command} `this` command for chaining
	*/
	allowExcessArguments(allowExcess = true) {
		this._allowExcessArguments = !!allowExcess;
		return this;
	}
	/**
	* Enable positional options. Positional means global options are specified before subcommands which lets
	* subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
	* The default behaviour is non-positional and global options may appear anywhere on the command line.
	*
	* @param {boolean} [positional]
	* @return {Command} `this` command for chaining
	*/
	enablePositionalOptions(positional = true) {
		this._enablePositionalOptions = !!positional;
		return this;
	}
	/**
	* Pass through options that come after command-arguments rather than treat them as command-options,
	* so actual command-options come before command-arguments. Turning this on for a subcommand requires
	* positional options to have been enabled on the program (parent commands).
	* The default behaviour is non-positional and options may appear before or after command-arguments.
	*
	* @param {boolean} [passThrough] for unknown options.
	* @return {Command} `this` command for chaining
	*/
	passThroughOptions(passThrough = true) {
		this._passThroughOptions = !!passThrough;
		this._checkForBrokenPassThrough();
		return this;
	}
	/**
	* @private
	*/
	_checkForBrokenPassThrough() {
		if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
	}
	/**
	* Whether to store option values as properties on command object,
	* or store separately (specify false). In both cases the option values can be accessed using .opts().
	*
	* @param {boolean} [storeAsProperties=true]
	* @return {Command} `this` command for chaining
	*/
	storeOptionsAsProperties(storeAsProperties = true) {
		if (this.options.length) throw new Error("call .storeOptionsAsProperties() before adding options");
		if (Object.keys(this._optionValues).length) throw new Error("call .storeOptionsAsProperties() before setting option values");
		this._storeOptionsAsProperties = !!storeAsProperties;
		return this;
	}
	/**
	* Retrieve option value.
	*
	* @param {string} key
	* @return {object} value
	*/
	getOptionValue(key) {
		if (this._storeOptionsAsProperties) return this[key];
		return this._optionValues[key];
	}
	/**
	* Store option value.
	*
	* @param {string} key
	* @param {object} value
	* @return {Command} `this` command for chaining
	*/
	setOptionValue(key, value) {
		return this.setOptionValueWithSource(key, value, void 0);
	}
	/**
	* Store option value and where the value came from.
	*
	* @param {string} key
	* @param {object} value
	* @param {string} source - expected values are default/config/env/cli/implied
	* @return {Command} `this` command for chaining
	*/
	setOptionValueWithSource(key, value, source) {
		if (this._storeOptionsAsProperties) this[key] = value;
		else this._optionValues[key] = value;
		this._optionValueSources[key] = source;
		return this;
	}
	/**
	* Get source of option value.
	* Expected values are default | config | env | cli | implied
	*
	* @param {string} key
	* @return {string}
	*/
	getOptionValueSource(key) {
		return this._optionValueSources[key];
	}
	/**
	* Get source of option value. See also .optsWithGlobals().
	* Expected values are default | config | env | cli | implied
	*
	* @param {string} key
	* @return {string}
	*/
	getOptionValueSourceWithGlobals(key) {
		let source;
		this._getCommandAndAncestors().forEach((cmd) => {
			if (cmd.getOptionValueSource(key) !== void 0) source = cmd.getOptionValueSource(key);
		});
		return source;
	}
	/**
	* Get user arguments from implied or explicit arguments.
	* Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
	*
	* @private
	*/
	_prepareUserArgs(argv, parseOptions) {
		if (argv !== void 0 && !Array.isArray(argv)) throw new Error("first parameter to parse must be array or undefined");
		parseOptions = parseOptions || {};
		if (argv === void 0 && parseOptions.from === void 0) {
			if (process$1.versions?.electron) parseOptions.from = "electron";
			const execArgv = process$1.execArgv ?? [];
			if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) parseOptions.from = "eval";
		}
		if (argv === void 0) argv = process$1.argv;
		this.rawArgs = argv.slice();
		let userArgs;
		switch (parseOptions.from) {
			case void 0:
			case "node":
				this._scriptPath = argv[1];
				userArgs = argv.slice(2);
				break;
			case "electron":
				if (process$1.defaultApp) {
					this._scriptPath = argv[1];
					userArgs = argv.slice(2);
				} else userArgs = argv.slice(1);
				break;
			case "user":
				userArgs = argv.slice(0);
				break;
			case "eval":
				userArgs = argv.slice(1);
				break;
			default: throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
		}
		if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
		this._name = this._name || "program";
		return userArgs;
	}
	/**
	* Parse `argv`, setting options and invoking commands when defined.
	*
	* Use parseAsync instead of parse if any of your action handlers are async.
	*
	* Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
	*
	* Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
	* - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
	* - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
	* - `'user'`: just user arguments
	*
	* @example
	* program.parse(); // parse process.argv and auto-detect electron and special node flags
	* program.parse(process.argv); // assume argv[0] is app and argv[1] is script
	* program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
	*
	* @param {string[]} [argv] - optional, defaults to process.argv
	* @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
	* @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
	* @return {Command} `this` command for chaining
	*/
	parse(argv, parseOptions) {
		this._prepareForParse();
		const userArgs = this._prepareUserArgs(argv, parseOptions);
		this._parseCommand([], userArgs);
		return this;
	}
	/**
	* Parse `argv`, setting options and invoking commands when defined.
	*
	* Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
	*
	* Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
	* - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
	* - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
	* - `'user'`: just user arguments
	*
	* @example
	* await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
	* await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
	* await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
	*
	* @param {string[]} [argv]
	* @param {object} [parseOptions]
	* @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
	* @return {Promise}
	*/
	async parseAsync(argv, parseOptions) {
		this._prepareForParse();
		const userArgs = this._prepareUserArgs(argv, parseOptions);
		await this._parseCommand([], userArgs);
		return this;
	}
	_prepareForParse() {
		if (this._savedState === null) {
			this.options.filter((option) => option.negate && option.defaultValue === void 0 && this.getOptionValue(option.attributeName()) === void 0).forEach((option) => {
				const positiveLongFlag = option.long.replace(/^--no-/, "--");
				if (!this._findOption(positiveLongFlag)) this.setOptionValueWithSource(option.attributeName(), true, "default");
			});
			this.saveStateBeforeParse();
		} else this.restoreStateBeforeParse();
	}
	/**
	* Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
	* Not usually called directly, but available for subclasses to save their custom state.
	*
	* This is called in a lazy way. Only commands used in parsing chain will have state saved.
	*/
	saveStateBeforeParse() {
		this._savedState = {
			_name: this._name,
			_optionValues: { ...this._optionValues },
			_optionValueSources: { ...this._optionValueSources }
		};
	}
	/**
	* Restore state before parse for calls after the first.
	* Not usually called directly, but available for subclasses to save their custom state.
	*
	* This is called in a lazy way. Only commands used in parsing chain will have state restored.
	*/
	restoreStateBeforeParse() {
		if (this._storeOptionsAsProperties) throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
		this._name = this._savedState._name;
		this._scriptPath = null;
		this.rawArgs = [];
		this._optionValues = { ...this._savedState._optionValues };
		this._optionValueSources = { ...this._savedState._optionValueSources };
		this.args = [];
		this.processedArgs = [];
	}
	/**
	* Throw if expected executable is missing. Add lots of help for author.
	*
	* @param {string} executableFile
	* @param {string} executableDir
	* @param {string} subcommandName
	*/
	_checkForMissingExecutable(executableFile, executableDir, subcommandName) {
		if (fs.existsSync(executableFile)) return;
		const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory"}`;
		throw new Error(executableMissing);
	}
	/**
	* Execute a sub-command executable.
	*
	* @private
	*/
	_executeSubCommand(subcommand, args) {
		args = args.slice();
		const sourceExt = [
			".js",
			".ts",
			".tsx",
			".mjs",
			".cjs"
		];
		function findFile(baseDir, baseName) {
			const localBin = path.resolve(baseDir, baseName);
			if (fs.existsSync(localBin)) return localBin;
			if (sourceExt.includes(path.extname(baseName))) return void 0;
			const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
			if (foundExt) return `${localBin}${foundExt}`;
		}
		this._checkForMissingMandatoryOptions();
		this._checkForConflictingOptions();
		let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
		let executableDir = this._executableDir || "";
		if (this._scriptPath) {
			let resolvedScriptPath;
			try {
				resolvedScriptPath = fs.realpathSync(this._scriptPath);
			} catch {
				resolvedScriptPath = this._scriptPath;
			}
			executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
		}
		if (executableDir) {
			let localFile = findFile(executableDir, executableFile);
			if (!localFile && !subcommand._executableFile && this._scriptPath) {
				const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
				if (legacyName !== this._name) localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
			}
			executableFile = localFile || executableFile;
		}
		const launchWithNode = sourceExt.includes(path.extname(executableFile));
		let proc;
		if (process$1.platform !== "win32") {
			if (launchWithNode) {
				args.unshift(executableFile);
				args = incrementNodeInspectorPort(process$1.execArgv).concat(args);
				proc = childProcess.spawn(process$1.argv[0], args, { stdio: "inherit" });
			} else proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
		} else {
			this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
			args.unshift(executableFile);
			args = incrementNodeInspectorPort(process$1.execArgv).concat(args);
			proc = childProcess.spawn(process$1.execPath, args, { stdio: "inherit" });
		}
		if (!proc.killed) [
			"SIGUSR1",
			"SIGUSR2",
			"SIGTERM",
			"SIGINT",
			"SIGHUP"
		].forEach((signal) => {
			process$1.on(signal, () => {
				if (proc.killed === false && proc.exitCode === null) proc.kill(signal);
			});
		});
		const exitCallback = this._exitCallback;
		proc.on("close", (code) => {
			code = code ?? 1;
			if (!exitCallback) process$1.exit(code);
			else exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
		});
		proc.on("error", (err) => {
			if (err.code === "ENOENT") this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
			else if (err.code === "EACCES") throw new Error(`'${executableFile}' not executable`);
			if (!exitCallback) process$1.exit(1);
			else {
				const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
				wrappedError.nestedError = err;
				exitCallback(wrappedError);
			}
		});
		this.runningCommand = proc;
	}
	/**
	* @private
	*/
	_dispatchSubcommand(commandName, operands, unknown) {
		const subCommand = this._findCommand(commandName);
		if (!subCommand) this.help({ error: true });
		subCommand._prepareForParse();
		let promiseChain;
		promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
		promiseChain = this._chainOrCall(promiseChain, () => {
			if (subCommand._executableHandler) this._executeSubCommand(subCommand, operands.concat(unknown));
			else return subCommand._parseCommand(operands, unknown);
		});
		return promiseChain;
	}
	/**
	* Invoke help directly if possible, or dispatch if necessary.
	* e.g. help foo
	*
	* @private
	*/
	_dispatchHelpCommand(subcommandName) {
		if (!subcommandName) this.help();
		const subCommand = this._findCommand(subcommandName);
		if (subCommand && !subCommand._executableHandler) subCommand.help();
		return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
	}
	/**
	* Check this.args against expected this.registeredArguments.
	*
	* @private
	*/
	_checkNumberOfArguments() {
		this.registeredArguments.forEach((arg, i) => {
			if (arg.required && this.args[i] == null) this.missingArgument(arg.name());
		});
		if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) return;
		if (this.args.length > this.registeredArguments.length) this._excessArguments(this.args);
	}
	/**
	* Process this.args using this.registeredArguments and save as this.processedArgs!
	*
	* @private
	*/
	_processArguments() {
		const myParseArg = (argument, value, previous) => {
			let parsedValue = value;
			if (value !== null && argument.parseArg) {
				const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
				parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
			}
			return parsedValue;
		};
		this._checkNumberOfArguments();
		const processedArgs = [];
		this.registeredArguments.forEach((declaredArg, index) => {
			let value = declaredArg.defaultValue;
			if (declaredArg.variadic) {
				if (index < this.args.length) {
					value = this.args.slice(index);
					if (declaredArg.parseArg) value = value.reduce((processed, v) => {
						return myParseArg(declaredArg, v, processed);
					}, declaredArg.defaultValue);
				} else if (value === void 0) value = [];
			} else if (index < this.args.length) {
				value = this.args[index];
				if (declaredArg.parseArg) value = myParseArg(declaredArg, value, declaredArg.defaultValue);
			}
			processedArgs[index] = value;
		});
		this.processedArgs = processedArgs;
	}
	/**
	* Once we have a promise we chain, but call synchronously until then.
	*
	* @param {(Promise|undefined)} promise
	* @param {Function} fn
	* @return {(Promise|undefined)}
	* @private
	*/
	_chainOrCall(promise, fn) {
		if (promise?.then && typeof promise.then === "function") return promise.then(() => fn());
		return fn();
	}
	/**
	*
	* @param {(Promise|undefined)} promise
	* @param {string} event
	* @return {(Promise|undefined)}
	* @private
	*/
	_chainOrCallHooks(promise, event) {
		let result = promise;
		const hooks = [];
		this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
			hookedCommand._lifeCycleHooks[event].forEach((callback) => {
				hooks.push({
					hookedCommand,
					callback
				});
			});
		});
		if (event === "postAction") hooks.reverse();
		hooks.forEach((hookDetail) => {
			result = this._chainOrCall(result, () => {
				return hookDetail.callback(hookDetail.hookedCommand, this);
			});
		});
		return result;
	}
	/**
	*
	* @param {(Promise|undefined)} promise
	* @param {Command} subCommand
	* @param {string} event
	* @return {(Promise|undefined)}
	* @private
	*/
	_chainOrCallSubCommandHook(promise, subCommand, event) {
		let result = promise;
		if (this._lifeCycleHooks[event] !== void 0) this._lifeCycleHooks[event].forEach((hook) => {
			result = this._chainOrCall(result, () => {
				return hook(this, subCommand);
			});
		});
		return result;
	}
	/**
	* Process arguments in context of this command.
	* Returns action result, in case it is a promise.
	*
	* @private
	*/
	_parseCommand(operands, unknown) {
		const parsed = this.parseOptions(unknown);
		this._parseOptionsEnv();
		this._parseOptionsImplied();
		operands = operands.concat(parsed.operands);
		unknown = parsed.unknown;
		this.args = operands.concat(unknown);
		if (operands && this._findCommand(operands[0])) return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
		if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) return this._dispatchHelpCommand(operands[1]);
		if (this._defaultCommandName) {
			this._outputHelpIfRequested(unknown);
			return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
		}
		if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) this.help({ error: true });
		this._outputHelpIfRequested(parsed.unknown);
		this._checkForMissingMandatoryOptions();
		this._checkForConflictingOptions();
		const checkForUnknownOptions = () => {
			if (parsed.unknown.length > 0) this.unknownOption(parsed.unknown[0]);
		};
		const commandEvent = `command:${this.name()}`;
		if (this._actionHandler) {
			checkForUnknownOptions();
			this._processArguments();
			let promiseChain;
			promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
			promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
			if (this.parent) promiseChain = this._chainOrCall(promiseChain, () => {
				this.parent.emit(commandEvent, operands, unknown);
			});
			promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
			return promiseChain;
		}
		if (this.parent?.listenerCount(commandEvent)) {
			checkForUnknownOptions();
			this._processArguments();
			this.parent.emit(commandEvent, operands, unknown);
		} else if (operands.length) {
			if (this._findCommand("*")) return this._dispatchSubcommand("*", operands, unknown);
			if (this.listenerCount("command:*")) this.emit("command:*", operands, unknown);
			else if (this.commands.length) this.unknownCommand();
			else {
				checkForUnknownOptions();
				this._processArguments();
			}
		} else if (this.commands.length) {
			checkForUnknownOptions();
			this.help({ error: true });
		} else {
			checkForUnknownOptions();
			this._processArguments();
		}
	}
	/**
	* Find matching command.
	*
	* @private
	* @return {Command | undefined}
	*/
	_findCommand(name) {
		if (!name) return void 0;
		return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
	}
	/**
	* Return an option matching `arg` if any.
	*
	* @param {string} arg
	* @return {Option}
	* @package
	*/
	_findOption(arg) {
		return this.options.find((option) => option.is(arg));
	}
	/**
	* Display an error message if a mandatory option does not have a value.
	* Called after checking for help flags in leaf subcommand.
	*
	* @private
	*/
	_checkForMissingMandatoryOptions() {
		this._getCommandAndAncestors().forEach((cmd) => {
			cmd.options.forEach((anOption) => {
				if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) cmd.missingMandatoryOptionValue(anOption);
			});
		});
	}
	/**
	* Display an error message if conflicting options are used together in this.
	*
	* @private
	*/
	_checkForConflictingLocalOptions() {
		const definedNonDefaultOptions = this.options.filter((option) => {
			const optionKey = option.attributeName();
			if (this.getOptionValue(optionKey) === void 0) return false;
			return this.getOptionValueSource(optionKey) !== "default";
		});
		definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0).forEach((option) => {
			const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
			if (conflictingAndDefined) this._conflictingOption(option, conflictingAndDefined);
		});
	}
	/**
	* Display an error message if conflicting options are used together.
	* Called after checking for help flags in leaf subcommand.
	*
	* @private
	*/
	_checkForConflictingOptions() {
		this._getCommandAndAncestors().forEach((cmd) => {
			cmd._checkForConflictingLocalOptions();
		});
	}
	/**
	* Parse options from `argv` removing known options,
	* and return argv split into operands and unknown arguments.
	*
	* Side effects: modifies command by storing options. Does not reset state if called again.
	*
	* Examples:
	*
	*     argv => operands, unknown
	*     --known kkk op => [op], []
	*     op --known kkk => [op], []
	*     sub --unknown uuu op => [sub], [--unknown uuu op]
	*     sub -- --unknown uuu op => [sub --unknown uuu op], []
	*
	* @param {string[]} args
	* @return {{operands: string[], unknown: string[]}}
	*/
	parseOptions(args) {
		const operands = [];
		const unknown = [];
		let dest = operands;
		function maybeOption(arg) {
			return arg.length > 1 && arg[0] === "-";
		}
		const negativeNumberArg = (arg) => {
			if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
			return !this._getCommandAndAncestors().some((cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short)));
		};
		let activeVariadicOption = null;
		let activeGroup = null;
		let i = 0;
		while (i < args.length || activeGroup) {
			const arg = activeGroup ?? args[i++];
			activeGroup = null;
			if (arg === "--") {
				if (dest === unknown) dest.push(arg);
				dest.push(...args.slice(i));
				break;
			}
			if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
				this.emit(`option:${activeVariadicOption.name()}`, arg);
				continue;
			}
			activeVariadicOption = null;
			if (maybeOption(arg)) {
				const option = this._findOption(arg);
				if (option) {
					if (option.required) {
						const value = args[i++];
						if (value === void 0) this.optionMissingArgument(option);
						this.emit(`option:${option.name()}`, value);
					} else if (option.optional) {
						let value = null;
						if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) value = args[i++];
						this.emit(`option:${option.name()}`, value);
					} else this.emit(`option:${option.name()}`);
					activeVariadicOption = option.variadic ? option : null;
					continue;
				}
			}
			if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
				const option = this._findOption(`-${arg[1]}`);
				if (option) {
					if (option.required || option.optional && this._combineFlagAndOptionalValue) this.emit(`option:${option.name()}`, arg.slice(2));
					else {
						this.emit(`option:${option.name()}`);
						activeGroup = `-${arg.slice(2)}`;
					}
					continue;
				}
			}
			if (/^--[^=]+=/.test(arg)) {
				const index = arg.indexOf("=");
				const option = this._findOption(arg.slice(0, index));
				if (option && (option.required || option.optional)) {
					this.emit(`option:${option.name()}`, arg.slice(index + 1));
					continue;
				}
			}
			if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) dest = unknown;
			if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
				if (this._findCommand(arg)) {
					operands.push(arg);
					unknown.push(...args.slice(i));
					break;
				} else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
					operands.push(arg, ...args.slice(i));
					break;
				} else if (this._defaultCommandName) {
					unknown.push(arg, ...args.slice(i));
					break;
				}
			}
			if (this._passThroughOptions) {
				dest.push(arg, ...args.slice(i));
				break;
			}
			dest.push(arg);
		}
		return {
			operands,
			unknown
		};
	}
	/**
	* Return an object containing local option values as key-value pairs.
	*
	* @return {object}
	*/
	opts() {
		if (this._storeOptionsAsProperties) {
			const result = {};
			const len = this.options.length;
			for (let i = 0; i < len; i++) {
				const key = this.options[i].attributeName();
				result[key] = key === this._versionOptionName ? this._version : this[key];
			}
			return result;
		}
		return this._optionValues;
	}
	/**
	* Return an object containing merged local and global option values as key-value pairs.
	*
	* @return {object}
	*/
	optsWithGlobals() {
		return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
	}
	/**
	* Display error message and exit (or call exitOverride).
	*
	* @param {string} message
	* @param {object} [errorOptions]
	* @param {string} [errorOptions.code] - an id string representing the error
	* @param {number} [errorOptions.exitCode] - used with process.exit
	*/
	error(message, errorOptions) {
		this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
		if (typeof this._showHelpAfterError === "string") this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
		else if (this._showHelpAfterError) {
			this._outputConfiguration.writeErr("\n");
			this.outputHelp({ error: true });
		}
		const config = errorOptions || {};
		const exitCode = config.exitCode || 1;
		const code = config.code || "commander.error";
		this._exit(exitCode, code, message);
	}
	/**
	* Apply any option related environment variables, if option does
	* not have a value from cli or client code.
	*
	* @private
	*/
	_parseOptionsEnv() {
		this.options.forEach((option) => {
			if (option.envVar && option.envVar in process$1.env) {
				const optionKey = option.attributeName();
				if (this.getOptionValue(optionKey) === void 0 || [
					"default",
					"config",
					"env"
				].includes(this.getOptionValueSource(optionKey))) {
					if (option.required || option.optional) this.emit(`optionEnv:${option.name()}`, process$1.env[option.envVar]);
					else this.emit(`optionEnv:${option.name()}`);
				}
			}
		});
	}
	/**
	* Apply any implied option values, if option is undefined or default value.
	*
	* @private
	*/
	_parseOptionsImplied() {
		const dualHelper = new DualOptions(this.options);
		const hasCustomOptionValue = (optionKey) => {
			return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
		};
		this.options.filter((option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
			Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
				this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
			});
		});
	}
	/**
	* Argument `name` is missing.
	*
	* @param {string} name
	* @private
	*/
	missingArgument(name) {
		const message = `error: missing required argument '${name}'`;
		this.error(message, { code: "commander.missingArgument" });
	}
	/**
	* `Option` is missing an argument.
	*
	* @param {Option} option
	* @private
	*/
	optionMissingArgument(option) {
		const message = `error: option '${option.flags}' argument missing`;
		this.error(message, { code: "commander.optionMissingArgument" });
	}
	/**
	* `Option` does not have a value, and is a mandatory option.
	*
	* @param {Option} option
	* @private
	*/
	missingMandatoryOptionValue(option) {
		const message = `error: required option '${option.flags}' not specified`;
		this.error(message, { code: "commander.missingMandatoryOptionValue" });
	}
	/**
	* `Option` conflicts with another option.
	*
	* @param {Option} option
	* @param {Option} conflictingOption
	* @private
	*/
	_conflictingOption(option, conflictingOption) {
		const findBestOptionFromValue = (option) => {
			const optionKey = option.attributeName();
			const optionValue = this.getOptionValue(optionKey);
			const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
			const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
			if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) return negativeOption;
			return positiveOption || option;
		};
		const getErrorMessage = (option) => {
			const bestOption = findBestOptionFromValue(option);
			const optionKey = bestOption.attributeName();
			if (this.getOptionValueSource(optionKey) === "env") return `environment variable '${bestOption.envVar}'`;
			return `option '${bestOption.flags}'`;
		};
		const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
		this.error(message, { code: "commander.conflictingOption" });
	}
	/**
	* Unknown option `flag`.
	*
	* @param {string} flag
	* @private
	*/
	unknownOption(flag) {
		if (this._allowUnknownOption) return;
		let suggestion = "";
		if (flag.startsWith("--") && this._showSuggestionAfterError) {
			let candidateFlags = [];
			let command = this;
			do {
				const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
				candidateFlags = candidateFlags.concat(moreFlags);
				command = command.parent;
			} while (command && !command._enablePositionalOptions);
			suggestion = suggestSimilar(flag, candidateFlags);
		}
		const message = `error: unknown option '${flag}'${suggestion}`;
		this.error(message, { code: "commander.unknownOption" });
	}
	/**
	* Excess arguments, more than expected.
	*
	* @param {string[]} receivedArgs
	* @private
	*/
	_excessArguments(receivedArgs) {
		if (this._allowExcessArguments) return;
		const expected = this.registeredArguments.length;
		const s = expected === 1 ? "" : "s";
		const received = receivedArgs.length;
		const message = `error: too many arguments${this.parent ? ` for '${this.name()}'` : ""}. Expected ${expected} argument${s} but got ${received}: ${receivedArgs.join(", ")}.`;
		this.error(message, { code: "commander.excessArguments" });
	}
	/**
	* Unknown command.
	*
	* @private
	*/
	unknownCommand() {
		const unknownName = this.args[0];
		let suggestion = "";
		if (this._showSuggestionAfterError) {
			const candidateNames = [];
			this.createHelp().visibleCommands(this).forEach((command) => {
				candidateNames.push(command.name());
				if (command.alias()) candidateNames.push(command.alias());
			});
			suggestion = suggestSimilar(unknownName, candidateNames);
		}
		const message = `error: unknown command '${unknownName}'${suggestion}`;
		this.error(message, { code: "commander.unknownCommand" });
	}
	/**
	* Get or set the program version.
	*
	* This method auto-registers the "-V, --version" option which will print the version number.
	*
	* You can optionally supply the flags and description to override the defaults.
	*
	* @param {string} [str]
	* @param {string} [flags]
	* @param {string} [description]
	* @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
	*/
	version(str, flags, description) {
		if (str === void 0) return this._version;
		this._version = str;
		flags = flags || "-V, --version";
		description = description || "output the version number";
		const versionOption = this.createOption(flags, description);
		this._versionOptionName = versionOption.attributeName();
		this._registerOption(versionOption);
		this.on("option:" + versionOption.name(), () => {
			this._outputConfiguration.writeOut(`${str}\n`);
			this._exit(0, "commander.version", str);
		});
		return this;
	}
	/**
	* Set the description.
	*
	* @param {string} [str]
	* @param {object} [argsDescription]
	* @return {(string|Command)}
	*/
	description(str, argsDescription) {
		if (str === void 0 && argsDescription === void 0) return this._description;
		this._description = str;
		if (argsDescription) this._argsDescription = argsDescription;
		return this;
	}
	/**
	* Set the summary. Used when listed as subcommand of parent.
	*
	* @param {string} [str]
	* @return {(string|Command)}
	*/
	summary(str) {
		if (str === void 0) return this._summary;
		this._summary = str;
		return this;
	}
	/**
	* Set an alias for the command.
	*
	* You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
	*
	* @param {string} [alias]
	* @return {(string|Command)}
	*/
	alias(alias) {
		if (alias === void 0) return this._aliases[0];
		/** @type {Command} */
		let command = this;
		if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) command = this.commands[this.commands.length - 1];
		if (alias === command._name) throw new Error("Command alias can't be the same as its name");
		const matchingCommand = this.parent?._findCommand(alias);
		if (matchingCommand) {
			const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
			throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
		}
		command._aliases.push(alias);
		return this;
	}
	/**
	* Set aliases for the command.
	*
	* Only the first alias is shown in the auto-generated help.
	*
	* @param {string[]} [aliases]
	* @return {(string[]|Command)}
	*/
	aliases(aliases) {
		if (aliases === void 0) return this._aliases;
		aliases.forEach((alias) => this.alias(alias));
		return this;
	}
	/**
	* Set / get the command usage `str`.
	*
	* @param {string} [str]
	* @return {(string|Command)}
	*/
	usage(str) {
		if (str === void 0) {
			if (this._usage) return this._usage;
			const args = this.registeredArguments.map((arg) => {
				return humanReadableArgName(arg);
			});
			return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
		}
		this._usage = str;
		return this;
	}
	/**
	* Get or set the name of the command.
	*
	* @param {string} [str]
	* @return {(string|Command)}
	*/
	name(str) {
		if (str === void 0) return this._name;
		this._name = str;
		return this;
	}
	/**
	* Set/get the help group heading for this subcommand in parent command's help.
	*
	* @param {string} [heading]
	* @return {Command | string}
	*/
	helpGroup(heading) {
		if (heading === void 0) return this._helpGroupHeading ?? "";
		this._helpGroupHeading = heading;
		return this;
	}
	/**
	* Set/get the default help group heading for subcommands added to this command.
	* (This does not override a group set directly on the subcommand using .helpGroup().)
	*
	* @example
	* program.commandsGroup('Development Commands:);
	* program.command('watch')...
	* program.command('lint')...
	* ...
	*
	* @param {string} [heading]
	* @returns {Command | string}
	*/
	commandsGroup(heading) {
		if (heading === void 0) return this._defaultCommandGroup ?? "";
		this._defaultCommandGroup = heading;
		return this;
	}
	/**
	* Set/get the default help group heading for options added to this command.
	* (This does not override a group set directly on the option using .helpGroup().)
	*
	* @example
	* program
	*   .optionsGroup('Development Options:')
	*   .option('-d, --debug', 'output extra debugging')
	*   .option('-p, --profile', 'output profiling information')
	*
	* @param {string} [heading]
	* @returns {Command | string}
	*/
	optionsGroup(heading) {
		if (heading === void 0) return this._defaultOptionGroup ?? "";
		this._defaultOptionGroup = heading;
		return this;
	}
	/**
	* @param {Option} option
	* @private
	*/
	_initOptionGroup(option) {
		if (this._defaultOptionGroup && !option.helpGroupHeading) option.helpGroup(this._defaultOptionGroup);
	}
	/**
	* @param {Command} cmd
	* @private
	*/
	_initCommandGroup(cmd) {
		if (this._defaultCommandGroup && !cmd.helpGroup()) cmd.helpGroup(this._defaultCommandGroup);
	}
	/**
	* Set the name of the command from script filename, such as process.argv[1],
	* or import.meta.filename.
	*
	* (Used internally and public although not documented in README.)
	*
	* @example
	* program.nameFromFilename(import.meta.filename);
	*
	* @param {string} filename
	* @return {Command}
	*/
	nameFromFilename(filename) {
		this._name = path.basename(filename, path.extname(filename));
		return this;
	}
	/**
	* Get or set the directory for searching for executable subcommands of this command.
	*
	* @example
	* program.executableDir(import.meta.dirname);
	* // or
	* program.executableDir('subcommands');
	*
	* @param {string} [path]
	* @return {(string|null|Command)}
	*/
	executableDir(path) {
		if (path === void 0) return this._executableDir;
		this._executableDir = path;
		return this;
	}
	/**
	* Return program help documentation.
	*
	* @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
	* @return {string}
	*/
	helpInformation(contextOptions) {
		const helper = this.createHelp();
		const context = this._getOutputContext(contextOptions);
		helper.prepareContext({
			error: context.error,
			helpWidth: context.helpWidth,
			outputHasColors: context.hasColors
		});
		const text = helper.formatHelp(this, helper);
		if (context.hasColors) return text;
		return this._outputConfiguration.stripColor(text);
	}
	/**
	* @typedef HelpContext
	* @type {object}
	* @property {boolean} error
	* @property {number} helpWidth
	* @property {boolean} hasColors
	* @property {function} write - includes stripColor if needed
	*
	* @returns {HelpContext}
	* @private
	*/
	_getOutputContext(contextOptions) {
		contextOptions = contextOptions || {};
		const error = !!contextOptions.error;
		let baseWrite;
		let hasColors;
		let helpWidth;
		if (error) {
			baseWrite = (str) => this._outputConfiguration.writeErr(str);
			hasColors = this._outputConfiguration.getErrHasColors();
			helpWidth = this._outputConfiguration.getErrHelpWidth();
		} else {
			baseWrite = (str) => this._outputConfiguration.writeOut(str);
			hasColors = this._outputConfiguration.getOutHasColors();
			helpWidth = this._outputConfiguration.getOutHelpWidth();
		}
		const write = (str) => {
			if (!hasColors) str = this._outputConfiguration.stripColor(str);
			return baseWrite(str);
		};
		return {
			error,
			write,
			hasColors,
			helpWidth
		};
	}
	/**
	* Output help information for this command.
	*
	* Outputs built-in help, and custom text added using `.addHelpText()`.
	*
	* @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
	*/
	outputHelp(contextOptions) {
		let deprecatedCallback;
		if (typeof contextOptions === "function") {
			deprecatedCallback = contextOptions;
			contextOptions = void 0;
		}
		const outputContext = this._getOutputContext(contextOptions);
		/** @type {HelpTextEventContext} */
		const eventContext = {
			error: outputContext.error,
			write: outputContext.write,
			command: this
		};
		this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
		this.emit("beforeHelp", eventContext);
		let helpInformation = this.helpInformation({ error: outputContext.error });
		if (deprecatedCallback) {
			helpInformation = deprecatedCallback(helpInformation);
			if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) throw new Error("outputHelp callback must return a string or a Buffer");
		}
		outputContext.write(helpInformation);
		if (this._getHelpOption()?.long) this.emit(this._getHelpOption().long);
		this.emit("afterHelp", eventContext);
		this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
	}
	/**
	* You can pass in flags and a description to customise the built-in help option.
	* Pass in false to disable the built-in help option.
	*
	* @example
	* program.helpOption('-?, --help' 'show help'); // customise
	* program.helpOption(false); // disable
	*
	* @param {(string | boolean)} flags
	* @param {string} [description]
	* @return {Command} `this` command for chaining
	*/
	helpOption(flags, description) {
		if (typeof flags === "boolean") {
			if (flags) {
				if (this._helpOption === null) this._helpOption = void 0;
				if (this._defaultOptionGroup) this._initOptionGroup(this._getHelpOption());
			} else this._helpOption = null;
			return this;
		}
		this._helpOption = this.createOption(flags ?? "-h, --help", description ?? "display help for command");
		if (flags || description) this._initOptionGroup(this._helpOption);
		return this;
	}
	/**
	* Lazy create help option.
	* Returns null if has been disabled with .helpOption(false).
	*
	* @returns {(Option | null)} the help option
	* @package
	*/
	_getHelpOption() {
		if (this._helpOption === void 0) this.helpOption(void 0, void 0);
		return this._helpOption;
	}
	/**
	* Supply your own option to use for the built-in help option.
	* This is an alternative to using helpOption() to customise the flags and description etc.
	*
	* @param {Option} option
	* @return {Command} `this` command for chaining
	*/
	addHelpOption(option) {
		this._helpOption = option;
		this._initOptionGroup(option);
		return this;
	}
	/**
	* Output help information and exit.
	*
	* Outputs built-in help, and custom text added using `.addHelpText()`.
	*
	* @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
	*/
	help(contextOptions) {
		this.outputHelp(contextOptions);
		let exitCode = Number(process$1.exitCode ?? 0);
		if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) exitCode = 1;
		this._exit(exitCode, "commander.help", "(outputHelp)");
	}
	/**
	* // Do a little typing to coordinate emit and listener for the help text events.
	* @typedef HelpTextEventContext
	* @type {object}
	* @property {boolean} error
	* @property {Command} command
	* @property {function} write
	*/
	/**
	* Add additional text to be displayed with the built-in help.
	*
	* Position is 'before' or 'after' to affect just this command,
	* and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
	*
	* @param {string} position - before or after built-in help
	* @param {(string | Function)} text - string to add, or a function returning a string
	* @return {Command} `this` command for chaining
	*/
	addHelpText(position, text) {
		const allowedValues = [
			"beforeAll",
			"before",
			"after",
			"afterAll"
		];
		if (!allowedValues.includes(position)) throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
		const helpEvent = `${position}Help`;
		this.on(helpEvent, (context) => {
			let helpStr;
			if (typeof text === "function") helpStr = text({
				error: context.error,
				command: context.command
			});
			else helpStr = text;
			if (helpStr) context.write(`${helpStr}\n`);
		});
		return this;
	}
	/**
	* Output help information if help flags specified
	*
	* @param {Array} args - array of options to search for help flags
	* @private
	*/
	_outputHelpIfRequested(args) {
		const helpOption = this._getHelpOption();
		if (helpOption && args.find((arg) => helpOption.is(arg))) {
			this.outputHelp();
			this._exit(0, "commander.helpDisplayed", "(outputHelp)");
		}
	}
};
/**
* Scan arguments and increment port number for inspect calls (to avoid conflicts when spawning new command).
*
* @param {string[]} args - array of arguments from node.execArgv
* @returns {string[]}
* @private
*/
function incrementNodeInspectorPort(args) {
	return args.map((arg) => {
		if (!arg.startsWith("--inspect")) return arg;
		let debugOption;
		let debugHost = "127.0.0.1";
		let debugPort = "9229";
		let match;
		if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) debugOption = match[1];
		else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
			debugOption = match[1];
			if (/^\d+$/.test(match[3])) debugPort = match[3];
			else debugHost = match[3];
		} else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
			debugOption = match[1];
			debugHost = match[3];
			debugPort = match[4];
		}
		if (debugOption && debugPort !== "0") return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
		return arg;
	});
}
/**
* Exported for using from tests, not otherwise used outside this file.
*
* @returns {boolean | undefined}
* @package
*/
function useColor() {
	if (process$1.env.NO_COLOR || process$1.env.FORCE_COLOR === "0" || process$1.env.FORCE_COLOR === "false") return false;
	if (process$1.env.FORCE_COLOR || process$1.env.CLICOLOR_FORCE !== void 0) return true;
}
new Command();
//#endregion
//#region node_modules/adm-zip/util/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		LOCHDR: 30,
		LOCSIG: 67324752,
		LOCVER: 4,
		LOCFLG: 6,
		LOCHOW: 8,
		LOCTIM: 10,
		LOCCRC: 14,
		LOCSIZ: 18,
		LOCLEN: 22,
		LOCNAM: 26,
		LOCEXT: 28,
		EXTSIG: 134695760,
		EXTHDR: 16,
		EXTCRC: 4,
		EXTSIZ: 8,
		EXTLEN: 12,
		CENHDR: 46,
		CENSIG: 33639248,
		CENVEM: 4,
		CENVER: 6,
		CENFLG: 8,
		CENHOW: 10,
		CENTIM: 12,
		CENCRC: 16,
		CENSIZ: 20,
		CENLEN: 24,
		CENNAM: 28,
		CENEXT: 30,
		CENCOM: 32,
		CENDSK: 34,
		CENATT: 36,
		CENATX: 38,
		CENOFF: 42,
		ENDHDR: 22,
		ENDSIG: 101010256,
		ENDSUB: 8,
		ENDTOT: 10,
		ENDSIZ: 12,
		ENDOFF: 16,
		ENDCOM: 20,
		END64HDR: 20,
		END64SIG: 117853008,
		END64START: 4,
		END64OFF: 8,
		END64NUMDISKS: 16,
		ZIP64SIG: 101075792,
		ZIP64HDR: 56,
		ZIP64LEAD: 12,
		ZIP64SIZE: 4,
		ZIP64VEM: 12,
		ZIP64VER: 14,
		ZIP64DSK: 16,
		ZIP64DSKDIR: 20,
		ZIP64SUB: 24,
		ZIP64TOT: 32,
		ZIP64SIZB: 40,
		ZIP64OFF: 48,
		ZIP64EXTRA: 56,
		STORED: 0,
		SHRUNK: 1,
		REDUCED1: 2,
		REDUCED2: 3,
		REDUCED3: 4,
		REDUCED4: 5,
		IMPLODED: 6,
		DEFLATED: 8,
		ENHANCED_DEFLATED: 9,
		PKWARE: 10,
		BZIP2: 12,
		LZMA: 14,
		IBM_TERSE: 18,
		IBM_LZ77: 19,
		AES_ENCRYPT: 99,
		FLG_ENC: 1,
		FLG_COMP1: 2,
		FLG_COMP2: 4,
		FLG_DESC: 8,
		FLG_ENH: 16,
		FLG_PATCH: 32,
		FLG_STR: 64,
		FLG_EFS: 2048,
		FLG_MSK: 4096,
		FILE: 2,
		BUFFER: 1,
		NONE: 0,
		EF_ID: 0,
		EF_SIZE: 2,
		ID_ZIP64: 1,
		ID_AVINFO: 7,
		ID_PFS: 8,
		ID_OS2: 9,
		ID_NTFS: 10,
		ID_OPENVMS: 12,
		ID_UNIX: 13,
		ID_FORK: 14,
		ID_PATCH: 15,
		ID_X509_PKCS7: 20,
		ID_X509_CERTID_F: 21,
		ID_X509_CERTID_C: 22,
		ID_STRONGENC: 23,
		ID_RECORD_MGT: 24,
		ID_X509_PKCS7_RL: 25,
		ID_IBM1: 101,
		ID_IBM2: 102,
		ID_POSZIP: 18064,
		EF_ZIP64_OR_32: 4294967295,
		EF_ZIP64_OR_16: 65535,
		EF_ZIP64_SUNCOMP: 0,
		EF_ZIP64_SCOMP: 8,
		EF_ZIP64_RHO: 16,
		EF_ZIP64_DSN: 24
	};
}));
//#endregion
//#region node_modules/adm-zip/util/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
	var errors = {
		INVALID_LOC: "Invalid LOC header (bad signature)",
		INVALID_CEN: "Invalid CEN header (bad signature)",
		INVALID_END: "Invalid END header (bad signature)",
		DESCRIPTOR_NOT_EXIST: "No descriptor present",
		DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
		DESCRIPTOR_FAULTY: "Descriptor data is malformed",
		NO_DATA: "Nothing to decompress",
		BAD_CRC: "CRC32 checksum failed {0}",
		MAX_OUTPUT_EXCEEDED: "Decompressed data exceeds the declared uncompressed size",
		FILE_IN_THE_WAY: "There is a file in the way: {0}",
		UNKNOWN_METHOD: "Invalid/unsupported compression method",
		AVAIL_DATA: "inflate::Available inflate data did not terminate",
		INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
		TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
		INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
		INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
		INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
		INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
		INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
		INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
		INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
		CANT_EXTRACT_FILE: "Could not extract the file",
		CANT_OVERRIDE: "Target file already exists",
		DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
		NO_ZIP: "No zip file was loaded",
		NO_ENTRY: "Entry doesn't exist",
		DUPLICATE_ENTRY: "Duplicate entry name {0}",
		DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
		FILE_NOT_FOUND: "File not found: \"{0}\"",
		NOT_IMPLEMENTED: "Not implemented",
		INVALID_FILENAME: "Invalid filename",
		INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
		ZIP64_VALUE_TOO_LARGE: "Zip64 value exceeds the maximum safe integer",
		INVALID_PASS_PARAM: "Incompatible password parameter",
		WRONG_PASSWORD: "Wrong Password",
		COMMENT_TOO_LONG: "Comment is too long",
		EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
	};
	function E(message) {
		return function(...args) {
			if (args.length) message = message.replace(/\{(\d)\}/g, (_, n) => args[n] || "");
			return /* @__PURE__ */ new Error("ADM-ZIP: " + message);
		};
	}
	for (const msg of Object.keys(errors)) exports[msg] = E(errors[msg]);
}));
//#endregion
//#region node_modules/adm-zip/util/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fsystem = __require("fs");
	var pth$2 = __require("path");
	var Constants = require_constants();
	var Errors = require_errors();
	var isWin = typeof process === "object" && "win32" === process.platform;
	var is_Obj = (obj) => typeof obj === "object" && obj !== null;
	var crcTable = (/* @__PURE__ */ new Uint32Array(256)).map((t, c) => {
		for (let k = 0; k < 8; k++) if ((c & 1) !== 0) c = 3988292384 ^ c >>> 1;
		else c >>>= 1;
		return c >>> 0;
	});
	function Utils(opts) {
		this.sep = pth$2.sep;
		this.fs = fsystem;
		if (is_Obj(opts)) {
			if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") this.fs = opts.fs;
		}
	}
	module.exports = Utils;
	Utils.prototype.makeDir = function(folder) {
		const self = this;
		function mkdirSync(fpath) {
			let resolvedPath = fpath.split(self.sep)[0];
			fpath.split(self.sep).forEach(function(name) {
				if (!name || name.substr(-1, 1) === ":") return;
				resolvedPath += self.sep + name;
				var stat;
				try {
					stat = self.fs.statSync(resolvedPath);
				} catch (e) {
					if (e.message && e.message.startsWith("ENOENT")) self.fs.mkdirSync(resolvedPath);
					else throw e;
				}
				if (stat && stat.isFile()) throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
			});
		}
		mkdirSync(folder);
	};
	Utils.prototype.writeFileTo = function(path, content, overwrite, attr) {
		const self = this;
		if (self.fs.existsSync(path)) {
			if (!overwrite) return false;
			if (self.fs.statSync(path).isDirectory()) return false;
		}
		var folder = pth$2.dirname(path);
		if (!self.fs.existsSync(folder)) self.makeDir(folder);
		var fd;
		try {
			fd = self.fs.openSync(path, "w", 438);
		} catch (e) {
			self.fs.chmodSync(path, 438);
			fd = self.fs.openSync(path, "w", 438);
		}
		if (fd) try {
			self.fs.writeSync(fd, content, 0, content.length, 0);
		} finally {
			self.fs.closeSync(fd);
		}
		self.fs.chmodSync(path, attr || 438);
		return true;
	};
	Utils.prototype.writeFileToAsync = function(path, content, overwrite, attr, callback) {
		if (typeof attr === "function") {
			callback = attr;
			attr = void 0;
		}
		const self = this;
		self.fs.exists(path, function(exist) {
			if (exist && !overwrite) return callback(false);
			self.fs.stat(path, function(err, stat) {
				if (exist && stat && stat.isDirectory()) return callback(false);
				var folder = pth$2.dirname(path);
				self.fs.exists(folder, function(exists) {
					if (!exists) try {
						self.makeDir(folder);
					} catch (e) {
						return callback(false);
					}
					const writeToFd = function(fd) {
						self.fs.write(fd, content, 0, content.length, 0, function(writeErr) {
							self.fs.close(fd, function() {
								if (writeErr) return callback(false);
								self.fs.chmod(path, attr || 438, function() {
									callback(true);
								});
							});
						});
					};
					self.fs.open(path, "w", 438, function(err, fd) {
						if (err) self.fs.chmod(path, 438, function() {
							self.fs.open(path, "w", 438, function(retryErr, fd) {
								if (retryErr || !fd) return callback(false);
								writeToFd(fd);
							});
						});
						else if (fd) writeToFd(fd);
						else callback(false);
					});
				});
			});
		});
	};
	Utils.prototype.assertPathSafe = function(root, target) {
		const self = this;
		if (typeof self.fs.lstatSync !== "function") return;
		const resolvedRoot = pth$2.resolve(root);
		const resolvedTarget = pth$2.resolve(target);
		if (resolvedTarget === resolvedRoot) return;
		const rel = pth$2.relative(resolvedRoot, resolvedTarget);
		if (!rel || rel === ".." || rel.startsWith(".." + pth$2.sep) || pth$2.isAbsolute(rel)) return;
		let cur = resolvedRoot;
		for (const part of rel.split(pth$2.sep)) {
			if (!part || part === ".") continue;
			cur = pth$2.join(cur, part);
			let stat;
			try {
				stat = self.fs.lstatSync(cur);
			} catch (e) {
				break;
			}
			if (stat.isSymbolicLink()) throw Errors.FILE_IN_THE_WAY(`"${cur}"`);
		}
	};
	Utils.prototype.findFiles = function(path) {
		const self = this;
		const canLstat = typeof self.fs.lstatSync === "function";
		const rootReal = self.fs.realpathSync(path);
		function escapesRoot(p) {
			if (!canLstat) return false;
			if (!self.fs.lstatSync(p).isSymbolicLink()) return false;
			let real;
			try {
				real = self.fs.realpathSync(p);
			} catch (e) {
				return true;
			}
			return !(real === rootReal || real.startsWith(rootReal + pth$2.sep));
		}
		function findSync(dir, pattern, recursive, visited) {
			if (typeof pattern === "boolean") {
				recursive = pattern;
				pattern = void 0;
			}
			let files = [];
			self.fs.readdirSync(dir).forEach(function(file) {
				const path = pth$2.join(dir, file);
				if (escapesRoot(path)) return;
				const stat = self.fs.statSync(path);
				if (!pattern || pattern.test(path)) files.push(pth$2.normalize(path) + (stat.isDirectory() ? self.sep : ""));
				if (stat.isDirectory() && recursive) {
					const realDir = self.fs.realpathSync(path);
					if (!visited.has(realDir)) {
						visited.add(realDir);
						files = files.concat(findSync(path, pattern, recursive, visited));
					}
				}
			});
			return files;
		}
		return findSync(path, void 0, true, /* @__PURE__ */ new Set([rootReal]));
	};
	/**
	* Callback for showing if everything was done.
	*
	* @callback filelistCallback
	* @param {Error} err - Error object
	* @param {string[]} list - was request fully completed
	*/
	/**
	*
	* @param {string} dir
	* @param {filelistCallback} cb
	*/
	Utils.prototype.findFilesAsync = function(dir, cb) {
		const self = this;
		const results = [];
		let finished = false;
		const finish = function(err) {
			if (finished) return;
			finished = true;
			cb(err, err ? void 0 : results);
		};
		const canLstat = typeof self.fs.lstat === "function";
		let rootReal = null;
		const escapesRoot = function(file, cb) {
			if (!canLstat) return cb(null, false);
			self.fs.lstat(file, function(err, lst) {
				if (err) return cb(err);
				if (!lst || !lst.isSymbolicLink()) return cb(null, false);
				self.fs.realpath(file, function(err, real) {
					if (err) return cb(null, true);
					cb(null, !(real === rootReal || real.startsWith(rootReal + pth$2.sep)));
				});
			});
		};
		const walk = function(dir, visited, done) {
			self.fs.readdir(dir, function(err, list) {
				if (err) return done(err);
				let pending = list.length;
				if (!pending) return done();
				list.forEach(function(name) {
					const file = pth$2.join(dir, name);
					escapesRoot(file, function(err, escapes) {
						if (err) return done(err);
						if (escapes) {
							if (!--pending) done();
							return;
						}
						self.fs.stat(file, function(err, stat) {
							if (err) return done(err);
							if (!stat) {
								if (!--pending) done();
								return;
							}
							results.push(pth$2.normalize(file) + (stat.isDirectory() ? self.sep : ""));
							if (!stat.isDirectory()) {
								if (!--pending) done();
								return;
							}
							self.fs.realpath(file, function(err, realDir) {
								if (err) return done(err);
								if (visited.has(realDir)) {
									if (!--pending) done();
									return;
								}
								visited.add(realDir);
								walk(file, visited, function(err) {
									if (err) return done(err);
									if (!--pending) done();
								});
							});
						});
					});
				});
			});
		};
		self.fs.realpath(dir, function(err, realDir) {
			if (err) return finish(err);
			rootReal = realDir;
			walk(dir, /* @__PURE__ */ new Set([realDir]), finish);
		});
	};
	Utils.prototype.getAttributes = function() {};
	Utils.prototype.setAttributes = function() {};
	Utils.crc32update = function(crc, byte) {
		return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
	};
	Utils.crc32 = function(buf) {
		if (typeof buf === "string") buf = Buffer.from(buf, "utf8");
		let len = buf.length;
		let crc = -1;
		for (let off = 0; off < len;) crc = Utils.crc32update(crc, buf[off++]);
		return ~crc >>> 0;
	};
	Utils.methodToString = function(method) {
		switch (method) {
			case Constants.STORED: return "STORED (" + method + ")";
			case Constants.DEFLATED: return "DEFLATED (" + method + ")";
			default: return "UNSUPPORTED (" + method + ")";
		}
	};
	/**
	* removes ".." style path elements
	* @param {string} path - fixable path
	* @returns string - fixed filepath
	*/
	Utils.canonical = function(path) {
		if (!path) return "";
		const safeSuffix = pth$2.posix.normalize("/" + path.split("\\").join("/"));
		return pth$2.join(".", safeSuffix);
	};
	/**
	* fix file names in achive
	* @param {string} path - fixable path
	* @returns string - fixed filepath
	*/
	Utils.zipnamefix = function(path) {
		if (!path) return "";
		const safeSuffix = pth$2.posix.normalize("/" + path.split("\\").join("/"));
		return pth$2.posix.join(".", safeSuffix);
	};
	/**
	*
	* @param {Array} arr
	* @param {function} callback
	* @returns
	*/
	Utils.findLast = function(arr, callback) {
		if (!Array.isArray(arr)) throw new TypeError("arr is not array");
		const len = arr.length >>> 0;
		for (let i = len - 1; i >= 0; i--) if (callback(arr[i], i, arr)) return arr[i];
	};
	Utils.sanitize = function(prefix, name) {
		prefix = pth$2.resolve(pth$2.normalize(prefix));
		var parts = name.split("/");
		for (var i = 0, l = parts.length; i < l; i++) {
			var path = pth$2.normalize(pth$2.join(prefix, parts.slice(i, l).join(pth$2.sep)));
			if (path === prefix || path.startsWith(prefix + pth$2.sep)) return path;
		}
		return pth$2.normalize(pth$2.join(prefix, pth$2.basename(name)));
	};
	Utils.toBuffer = function toBuffer(input, encoder) {
		if (Buffer.isBuffer(input)) return input;
		else if (input instanceof Uint8Array) return Buffer.from(input);
		else return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
	};
	Utils.readBigUInt64LE = function(buffer, index) {
		const lo = buffer.readUInt32LE(index);
		const value = buffer.readUInt32LE(index + 4) * 4294967296 + lo;
		if (value > Number.MAX_SAFE_INTEGER) throw Errors.ZIP64_VALUE_TOO_LARGE();
		return value;
	};
	Utils.writeBigUInt64LE = function(buffer, value, index) {
		const lo = value >>> 0;
		const hi = Math.floor(value / 4294967296) >>> 0;
		buffer.writeUInt32LE(lo, index);
		buffer.writeUInt32LE(hi, index + 4);
	};
	Utils.fromDOS2Date = function(val) {
		return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
	};
	Utils.fromDate2DOS = function(val) {
		let date = 0;
		let time = 0;
		if (val.getFullYear() > 1979) {
			date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
			time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
		}
		return date << 16 | time;
	};
	Utils.isWin = isWin;
	Utils.crcTable = crcTable;
}));
//#endregion
//#region node_modules/adm-zip/util/fattr.js
var require_fattr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var pth$1 = __require("path");
	module.exports = function(path, { fs }) {
		var _path = path || "", _obj = newAttr(), _stat = null;
		function newAttr() {
			return {
				directory: false,
				readonly: false,
				hidden: false,
				executable: false,
				mtime: 0,
				atime: 0
			};
		}
		if (_path && fs.existsSync(_path)) {
			_stat = fs.statSync(_path);
			_obj.directory = _stat.isDirectory();
			_obj.mtime = _stat.mtime;
			_obj.atime = _stat.atime;
			_obj.executable = (73 & _stat.mode) !== 0;
			_obj.readonly = (128 & _stat.mode) === 0;
			_obj.hidden = pth$1.basename(_path)[0] === ".";
		} else console.warn("Invalid path: " + _path);
		return {
			get directory() {
				return _obj.directory;
			},
			get readOnly() {
				return _obj.readonly;
			},
			get hidden() {
				return _obj.hidden;
			},
			get mtime() {
				return _obj.mtime;
			},
			get atime() {
				return _obj.atime;
			},
			get executable() {
				return _obj.executable;
			},
			decodeAttributes: function() {},
			encodeAttributes: function() {},
			toJSON: function() {
				return {
					path: _path,
					isDirectory: _obj.directory,
					isReadOnly: _obj.readonly,
					isHidden: _obj.hidden,
					isExecutable: _obj.executable,
					mTime: _obj.mtime,
					aTime: _obj.atime
				};
			},
			toString: function() {
				return JSON.stringify(this.toJSON(), null, "	");
			}
		};
	};
}));
//#endregion
//#region node_modules/adm-zip/util/decoder.js
var require_decoder = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		efs: true,
		encode: (data) => Buffer.from(data, "utf8"),
		decode: (data) => data.toString("utf8")
	};
}));
//#endregion
//#region node_modules/adm-zip/util/index.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_utils();
	module.exports.Constants = require_constants();
	module.exports.Errors = require_errors();
	module.exports.FileAttr = require_fattr();
	module.exports.decoder = require_decoder();
}));
//#endregion
//#region node_modules/adm-zip/headers/entryHeader.js
var require_entryHeader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Utils = require_util();
	var Constants = Utils.Constants;
	module.exports = function() {
		var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
		_verMade |= Utils.isWin ? 2560 : 768;
		_flags |= Constants.FLG_EFS;
		const _localHeader = { extraLen: 0 };
		const uint32 = (val) => Math.max(0, val) >>> 0;
		const uint8 = (val) => Math.max(0, val) & 255;
		_time = Utils.fromDate2DOS(/* @__PURE__ */ new Date());
		return {
			get made() {
				return _verMade;
			},
			set made(val) {
				_verMade = val;
			},
			get version() {
				return _version;
			},
			set version(val) {
				_version = val;
			},
			get flags() {
				return _flags;
			},
			set flags(val) {
				_flags = val;
			},
			get flags_efs() {
				return (_flags & Constants.FLG_EFS) > 0;
			},
			set flags_efs(val) {
				if (val) _flags |= Constants.FLG_EFS;
				else _flags &= ~Constants.FLG_EFS;
			},
			get flags_desc() {
				return (_flags & Constants.FLG_DESC) > 0;
			},
			set flags_desc(val) {
				if (val) _flags |= Constants.FLG_DESC;
				else _flags &= ~Constants.FLG_DESC;
			},
			get method() {
				return _method;
			},
			set method(val) {
				switch (val) {
					case Constants.STORED:
						this.version = 10;
						break;
					case Constants.DEFLATED:
					default: this.version = 20;
				}
				_method = val;
			},
			get time() {
				return Utils.fromDOS2Date(this.timeval);
			},
			set time(val) {
				val = new Date(val);
				this.timeval = Utils.fromDate2DOS(val);
			},
			get timeval() {
				return _time;
			},
			set timeval(val) {
				_time = uint32(val);
			},
			get timeHighByte() {
				return uint8(_time >>> 8);
			},
			get crc() {
				return _crc;
			},
			set crc(val) {
				_crc = uint32(val);
			},
			get compressedSize() {
				return _compressedSize;
			},
			set compressedSize(val) {
				_compressedSize = uint32(val);
			},
			get size() {
				return _size;
			},
			set size(val) {
				_size = uint32(val);
			},
			get fileNameLength() {
				return _fnameLen;
			},
			set fileNameLength(val) {
				_fnameLen = val;
			},
			get extraLength() {
				return _extraLen;
			},
			set extraLength(val) {
				_extraLen = val;
			},
			get extraLocalLength() {
				return _localHeader.extraLen;
			},
			set extraLocalLength(val) {
				_localHeader.extraLen = val;
			},
			get commentLength() {
				return _comLen;
			},
			set commentLength(val) {
				_comLen = val;
			},
			get diskNumStart() {
				return _diskStart;
			},
			set diskNumStart(val) {
				_diskStart = uint32(val);
			},
			get inAttr() {
				return _inattr;
			},
			set inAttr(val) {
				_inattr = uint32(val);
			},
			get attr() {
				return _attr;
			},
			set attr(val) {
				_attr = uint32(val);
			},
			get fileAttr() {
				return (_attr || 0) >> 16 & 511;
			},
			get offset() {
				return _offset;
			},
			set offset(val) {
				_offset = uint32(val);
			},
			get encrypted() {
				return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
			},
			get centralHeaderSize() {
				return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
			},
			get realDataOffset() {
				return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
			},
			get localHeader() {
				return _localHeader;
			},
			loadLocalHeaderFromBinary: function(input) {
				if (_offset < 0 || _offset + Constants.LOCHDR > input.length) throw Utils.Errors.INVALID_LOC();
				var data = input.slice(_offset, _offset + Constants.LOCHDR);
				if (data.readUInt32LE(0) !== Constants.LOCSIG) throw Utils.Errors.INVALID_LOC();
				_localHeader.version = data.readUInt16LE(Constants.LOCVER);
				_localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
				_localHeader.flags_desc = (_localHeader.flags & Constants.FLG_DESC) > 0;
				_localHeader.method = data.readUInt16LE(Constants.LOCHOW);
				_localHeader.time = data.readUInt32LE(Constants.LOCTIM);
				_localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
				_localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
				_localHeader.size = data.readUInt32LE(Constants.LOCLEN);
				_localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
				_localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
				const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
				const extraEnd = extraStart + _localHeader.extraLen;
				return input.slice(extraStart, extraEnd);
			},
			loadFromBinary: function(data) {
				if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) throw Utils.Errors.INVALID_CEN();
				_verMade = data.readUInt16LE(Constants.CENVEM);
				_version = data.readUInt16LE(Constants.CENVER);
				_flags = data.readUInt16LE(Constants.CENFLG);
				_method = data.readUInt16LE(Constants.CENHOW);
				_time = data.readUInt32LE(Constants.CENTIM);
				_crc = data.readUInt32LE(Constants.CENCRC);
				_compressedSize = data.readUInt32LE(Constants.CENSIZ);
				_size = data.readUInt32LE(Constants.CENLEN);
				_fnameLen = data.readUInt16LE(Constants.CENNAM);
				_extraLen = data.readUInt16LE(Constants.CENEXT);
				_comLen = data.readUInt16LE(Constants.CENCOM);
				_diskStart = data.readUInt16LE(Constants.CENDSK);
				_inattr = data.readUInt16LE(Constants.CENATT);
				_attr = data.readUInt32LE(Constants.CENATX);
				_offset = data.readUInt32LE(Constants.CENOFF);
			},
			localHeaderToBinary: function() {
				var data = Buffer.alloc(Constants.LOCHDR);
				data.writeUInt32LE(Constants.LOCSIG, 0);
				data.writeUInt16LE(_version, Constants.LOCVER);
				data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.LOCFLG);
				data.writeUInt16LE(_method, Constants.LOCHOW);
				data.writeUInt32LE(_time, Constants.LOCTIM);
				data.writeUInt32LE(_crc, Constants.LOCCRC);
				data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
				data.writeUInt32LE(_size, Constants.LOCLEN);
				data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
				data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
				return data;
			},
			centralHeaderToBinary: function() {
				var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
				data.writeUInt32LE(Constants.CENSIG, 0);
				data.writeUInt16LE(_verMade, Constants.CENVEM);
				data.writeUInt16LE(_version, Constants.CENVER);
				data.writeUInt16LE(_flags & ~Constants.FLG_DESC, Constants.CENFLG);
				data.writeUInt16LE(_method, Constants.CENHOW);
				data.writeUInt32LE(_time, Constants.CENTIM);
				data.writeUInt32LE(_crc, Constants.CENCRC);
				data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
				data.writeUInt32LE(_size, Constants.CENLEN);
				data.writeUInt16LE(_fnameLen, Constants.CENNAM);
				data.writeUInt16LE(_extraLen, Constants.CENEXT);
				data.writeUInt16LE(_comLen, Constants.CENCOM);
				data.writeUInt16LE(_diskStart, Constants.CENDSK);
				data.writeUInt16LE(_inattr, Constants.CENATT);
				data.writeUInt32LE(_attr, Constants.CENATX);
				data.writeUInt32LE(_offset, Constants.CENOFF);
				return data;
			},
			toJSON: function() {
				const bytes = function(nr) {
					return nr + " bytes";
				};
				return {
					made: _verMade,
					version: _version,
					flags: _flags,
					method: Utils.methodToString(_method),
					time: this.time,
					crc: "0x" + _crc.toString(16).toUpperCase(),
					compressedSize: bytes(_compressedSize),
					size: bytes(_size),
					fileNameLength: bytes(_fnameLen),
					extraLength: bytes(_extraLen),
					commentLength: bytes(_comLen),
					diskNumStart: _diskStart,
					inAttr: _inattr,
					attr: _attr,
					offset: _offset,
					centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
				};
			},
			toString: function() {
				return JSON.stringify(this.toJSON(), null, "	");
			}
		};
	};
}));
//#endregion
//#region node_modules/adm-zip/headers/mainHeader.js
var require_mainHeader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Utils = require_util();
	var Constants = Utils.Constants;
	module.exports = function() {
		var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
		const needsZip64 = () => _volumeEntries > Constants.EF_ZIP64_OR_16 || _totalEntries > Constants.EF_ZIP64_OR_16 || _size > Constants.EF_ZIP64_OR_32 || _offset > Constants.EF_ZIP64_OR_32;
		return {
			get diskEntries() {
				return _volumeEntries;
			},
			set diskEntries(val) {
				_volumeEntries = _totalEntries = val;
			},
			get totalEntries() {
				return _totalEntries;
			},
			set totalEntries(val) {
				_totalEntries = _volumeEntries = val;
			},
			get size() {
				return _size;
			},
			set size(val) {
				_size = val;
			},
			get offset() {
				return _offset;
			},
			set offset(val) {
				_offset = val;
			},
			get commentLength() {
				return _commentLength;
			},
			set commentLength(val) {
				_commentLength = val;
			},
			get mainHeaderSize() {
				return (needsZip64() ? Constants.ZIP64HDR + Constants.END64HDR : 0) + Constants.ENDHDR + _commentLength;
			},
			loadFromBinary: function(data) {
				if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) throw Utils.Errors.INVALID_END();
				if (data.readUInt32LE(0) === Constants.ENDSIG) {
					_volumeEntries = data.readUInt16LE(Constants.ENDSUB);
					_totalEntries = data.readUInt16LE(Constants.ENDTOT);
					_size = data.readUInt32LE(Constants.ENDSIZ);
					_offset = data.readUInt32LE(Constants.ENDOFF);
					_commentLength = data.readUInt16LE(Constants.ENDCOM);
				} else {
					_volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
					_totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
					_size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZB);
					_offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
					_commentLength = 0;
				}
			},
			toBinary: function() {
				if (!needsZip64()) {
					var b = Buffer.alloc(Constants.ENDHDR + _commentLength);
					b.writeUInt32LE(Constants.ENDSIG, 0);
					b.writeUInt32LE(0, 4);
					b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
					b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
					b.writeUInt32LE(_size, Constants.ENDSIZ);
					b.writeUInt32LE(_offset, Constants.ENDOFF);
					b.writeUInt16LE(_commentLength, Constants.ENDCOM);
					b.fill(" ", Constants.ENDHDR);
					return b;
				}
				var b = Buffer.alloc(this.mainHeaderSize);
				let offset = 0;
				b.writeUInt32LE(Constants.ZIP64SIG, offset);
				Utils.writeBigUInt64LE(b, Constants.ZIP64HDR - Constants.ZIP64LEAD, offset + Constants.ZIP64SIZE);
				b.writeUInt16LE(45, offset + Constants.ZIP64VEM);
				b.writeUInt16LE(45, offset + Constants.ZIP64VER);
				b.writeUInt32LE(0, offset + Constants.ZIP64DSK);
				b.writeUInt32LE(0, offset + Constants.ZIP64DSKDIR);
				Utils.writeBigUInt64LE(b, _volumeEntries, offset + Constants.ZIP64SUB);
				Utils.writeBigUInt64LE(b, _totalEntries, offset + Constants.ZIP64TOT);
				Utils.writeBigUInt64LE(b, _size, offset + Constants.ZIP64SIZB);
				Utils.writeBigUInt64LE(b, _offset, offset + Constants.ZIP64OFF);
				const zip64EndOffset = _offset + _size;
				offset += Constants.ZIP64HDR;
				b.writeUInt32LE(Constants.END64SIG, offset);
				b.writeUInt32LE(0, offset + Constants.END64START);
				Utils.writeBigUInt64LE(b, zip64EndOffset, offset + Constants.END64OFF);
				b.writeUInt32LE(1, offset + Constants.END64NUMDISKS);
				offset += Constants.END64HDR;
				b.writeUInt32LE(Constants.ENDSIG, offset);
				b.writeUInt32LE(0, offset + 4);
				b.writeUInt16LE(Math.min(_volumeEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDSUB);
				b.writeUInt16LE(Math.min(_totalEntries, Constants.EF_ZIP64_OR_16), offset + Constants.ENDTOT);
				b.writeUInt32LE(Math.min(_size, Constants.EF_ZIP64_OR_32), offset + Constants.ENDSIZ);
				b.writeUInt32LE(Math.min(_offset, Constants.EF_ZIP64_OR_32), offset + Constants.ENDOFF);
				b.writeUInt16LE(_commentLength, offset + Constants.ENDCOM);
				b.fill(" ", offset + Constants.ENDHDR);
				return b;
			},
			toJSON: function() {
				const offset = function(nr, len) {
					let offs = nr.toString(16).toUpperCase();
					while (offs.length < len) offs = "0" + offs;
					return "0x" + offs;
				};
				return {
					diskEntries: _volumeEntries,
					totalEntries: _totalEntries,
					size: _size + " bytes",
					offset: offset(_offset, 4),
					commentLength: _commentLength
				};
			},
			toString: function() {
				return JSON.stringify(this.toJSON(), null, "	");
			}
		};
	};
}));
//#endregion
//#region node_modules/adm-zip/headers/index.js
var require_headers = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.EntryHeader = require_entryHeader();
	exports.MainHeader = require_mainHeader();
}));
//#endregion
//#region node_modules/adm-zip/methods/deflater.js
var require_deflater = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(inbuf) {
		var zlib = __require("zlib");
		var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
		return {
			deflate: function() {
				return zlib.deflateRawSync(inbuf, opts);
			},
			deflateAsync: function(callback) {
				var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
				tmp.on("data", function(data) {
					parts.push(data);
					total += data.length;
				});
				tmp.on("end", function() {
					var buf = Buffer.alloc(total), written = 0;
					buf.fill(0);
					for (var i = 0; i < parts.length; i++) {
						var part = parts[i];
						part.copy(buf, written);
						written += part.length;
					}
					callback && callback(buf);
				});
				tmp.end(inbuf);
			}
		};
	};
}));
//#endregion
//#region node_modules/adm-zip/methods/inflater.js
var require_inflater = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var version = +(process?.versions?.node ?? "").split(".")[0] || 0;
	var Errors = require_errors();
	module.exports = function(inbuf, expectedLength) {
		var zlib = __require("zlib");
		const maxOutputLength = expectedLength > 0 ? expectedLength : 1;
		const option = version >= 15 ? { maxOutputLength } : {};
		return {
			inflate: function() {
				return zlib.inflateRawSync(inbuf, option);
			},
			inflateAsync: function(callback) {
				var tmp = zlib.createInflateRaw(option), parts = [], total = 0, done = false;
				const fail = function(err) {
					if (done) return;
					done = true;
					tmp.destroy();
					callback && callback(Buffer.alloc(0), err);
				};
				tmp.on("error", function(err) {
					fail(err);
				});
				tmp.on("data", function(data) {
					if (done) return;
					total += data.length;
					if (total > maxOutputLength) return fail(Errors.MAX_OUTPUT_EXCEEDED());
					parts.push(data);
				});
				tmp.on("end", function() {
					if (done) return;
					done = true;
					var buf = Buffer.alloc(total), written = 0;
					buf.fill(0);
					for (var i = 0; i < parts.length; i++) {
						var part = parts[i];
						part.copy(buf, written);
						written += part.length;
					}
					callback && callback(buf);
				});
				tmp.end(inbuf);
			}
		};
	};
}));
//#endregion
//#region node_modules/adm-zip/methods/zipcrypto.js
var require_zipcrypto = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { randomFillSync } = __require("crypto");
	var Errors = require_errors();
	var crctable = (/* @__PURE__ */ new Uint32Array(256)).map((t, crc) => {
		for (let j = 0; j < 8; j++) if (0 !== (crc & 1)) crc = crc >>> 1 ^ 3988292384;
		else crc >>>= 1;
		return crc >>> 0;
	});
	var uMul = (a, b) => Math.imul(a, b) >>> 0;
	var crc32update = (pCrc32, bval) => {
		return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
	};
	var genSalt = () => {
		if ("function" === typeof randomFillSync) return randomFillSync(Buffer.alloc(12));
		else return genSalt.node();
	};
	genSalt.node = () => {
		const salt = Buffer.alloc(12);
		const len = salt.length;
		for (let i = 0; i < len; i++) salt[i] = Math.random() * 256 & 255;
		return salt;
	};
	var config = { genSalt };
	function Initkeys(pw) {
		const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
		this.keys = new Uint32Array([
			305419896,
			591751049,
			878082192
		]);
		for (let i = 0; i < pass.length; i++) this.updateKeys(pass[i]);
	}
	Initkeys.prototype.updateKeys = function(byteValue) {
		const keys = this.keys;
		keys[0] = crc32update(keys[0], byteValue);
		keys[1] += keys[0] & 255;
		keys[1] = uMul(keys[1], 134775813) + 1;
		keys[2] = crc32update(keys[2], keys[1] >>> 24);
		return byteValue;
	};
	Initkeys.prototype.next = function() {
		const k = (this.keys[2] | 2) >>> 0;
		return uMul(k, k ^ 1) >> 8 & 255;
	};
	function make_decrypter(pwd) {
		const keys = new Initkeys(pwd);
		return function(data) {
			const result = Buffer.alloc(data.length);
			let pos = 0;
			for (let c of data) result[pos++] = keys.updateKeys(c ^ keys.next());
			return result;
		};
	}
	function make_encrypter(pwd) {
		const keys = new Initkeys(pwd);
		return function(data, result, pos = 0) {
			if (!result) result = Buffer.alloc(data.length);
			for (let c of data) {
				const k = keys.next();
				result[pos++] = c ^ k;
				keys.updateKeys(c);
			}
			return result;
		};
	}
	function decrypt(data, header, pwd) {
		if (!data || !Buffer.isBuffer(data) || data.length < 12) return Buffer.alloc(0);
		const decrypter = make_decrypter(pwd);
		const salt = decrypter(data.slice(0, 12));
		const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
		if (salt[11] !== verifyByte) throw Errors.WRONG_PASSWORD();
		return decrypter(data.slice(12));
	}
	function _salter(data) {
		if (Buffer.isBuffer(data) && data.length >= 12) config.genSalt = function() {
			return data.slice(0, 12);
		};
		else if (data === "node") config.genSalt = genSalt.node;
		else config.genSalt = genSalt;
	}
	function encrypt(data, header, pwd, oldlike = false) {
		if (data == null) data = Buffer.alloc(0);
		if (!Buffer.isBuffer(data)) data = Buffer.from(data.toString());
		const encrypter = make_encrypter(pwd);
		const salt = config.genSalt();
		salt[11] = header.crc >>> 24 & 255;
		if (oldlike) salt[10] = header.crc >>> 16 & 255;
		const result = Buffer.alloc(data.length + 12);
		encrypter(salt, result);
		return encrypter(data, result, 12);
	}
	module.exports = {
		decrypt,
		encrypt,
		_salter
	};
}));
//#endregion
//#region node_modules/adm-zip/methods/index.js
var require_methods = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.Deflater = require_deflater();
	exports.Inflater = require_inflater();
	exports.ZipCrypto = require_zipcrypto();
}));
//#endregion
//#region node_modules/adm-zip/zipEntry.js
var require_zipEntry = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Utils = require_util();
	var Headers = require_headers();
	var Constants = Utils.Constants;
	var Methods = require_methods();
	module.exports = function(options, input) {
		var _centralHeader = new Headers.EntryHeader(), _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
		const opts = options;
		const decoder = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
		_efs = decoder.hasOwnProperty("efs") ? decoder.efs : false;
		function getCompressedDataFromZip() {
			if (!input || !(input instanceof Uint8Array)) return Buffer.alloc(0);
			_extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
			const dataOffset = _centralHeader.realDataOffset;
			const dataEnd = dataOffset + _centralHeader.compressedSize;
			if (dataOffset < 0 || dataEnd < dataOffset || dataEnd > input.length) throw Utils.Errors.INVALID_LOC();
			return input.slice(dataOffset, dataEnd);
		}
		function crc32OK(data) {
			const expectedCrc = _centralHeader.flags_desc || _centralHeader.localHeader.flags_desc ? _centralHeader.crc : _centralHeader.localHeader.crc;
			return Utils.crc32(data) === expectedCrc;
		}
		function decompress(async, callback, pass) {
			if (typeof callback === "undefined" && typeof async === "string") {
				pass = async;
				async = void 0;
			}
			if (_isDirectory) {
				if (async && callback) callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
				return Buffer.alloc(0);
			}
			var compressedData;
			try {
				compressedData = getCompressedDataFromZip();
				if (compressedData.length === 0) {
					if (async && callback) callback(compressedData);
					return compressedData;
				}
				if (_centralHeader.encrypted) {
					if ("string" !== typeof pass && !Buffer.isBuffer(pass)) throw Utils.Errors.INVALID_PASS_PARAM();
					compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
				}
			} catch (err) {
				if (async && callback) {
					callback(Buffer.alloc(0), err);
					return Buffer.alloc(0);
				}
				throw err;
			}
			var data;
			switch (_centralHeader.method) {
				case Utils.Constants.STORED:
					data = Buffer.alloc(compressedData.length);
					compressedData.copy(data);
					if (!crc32OK(data)) {
						if (async && callback) callback(data, Utils.Errors.BAD_CRC());
						throw Utils.Errors.BAD_CRC();
					} else {
						if (async && callback) callback(data);
						return data;
					}
				case Utils.Constants.DEFLATED:
					var inflater = new Methods.Inflater(compressedData, _centralHeader.size);
					if (!async) {
						data = inflater.inflate();
						if (!crc32OK(data)) throw Utils.Errors.BAD_CRC(`"${decoder.decode(_entryName)}"`);
						return data;
					} else inflater.inflateAsync(function(result, err) {
						if (!callback) return;
						if (err) callback(Buffer.alloc(0), err);
						else if (!crc32OK(result)) callback(result, Utils.Errors.BAD_CRC());
						else callback(result);
					});
					break;
				default:
					if (async && callback) callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
					throw Utils.Errors.UNKNOWN_METHOD();
			}
		}
		function compress(async, callback) {
			if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
				if (async && callback) callback(getCompressedDataFromZip());
				return getCompressedDataFromZip();
			}
			if (uncompressedData.length && !_isDirectory) {
				var compressedData;
				switch (_centralHeader.method) {
					case Utils.Constants.STORED:
						_centralHeader.compressedSize = _centralHeader.size;
						compressedData = Buffer.alloc(uncompressedData.length);
						uncompressedData.copy(compressedData);
						if (async && callback) callback(compressedData);
						return compressedData;
					default:
					case Utils.Constants.DEFLATED:
						var deflater = new Methods.Deflater(uncompressedData);
						if (!async) {
							var deflated = deflater.deflate();
							_centralHeader.compressedSize = deflated.length;
							return deflated;
						} else deflater.deflateAsync(function(data) {
							compressedData = Buffer.alloc(data.length);
							_centralHeader.compressedSize = data.length;
							data.copy(compressedData);
							callback && callback(compressedData);
						});
						deflater = null;
				}
			} else if (async && callback) callback(Buffer.alloc(0));
			else return Buffer.alloc(0);
		}
		function readUInt64LE(buffer, offset) {
			return Utils.readBigUInt64LE(buffer, offset);
		}
		function parseExtra(data) {
			try {
				var offset = 0;
				var signature, size, part;
				while (offset + 4 < data.length) {
					signature = data.readUInt16LE(offset);
					offset += 2;
					size = data.readUInt16LE(offset);
					offset += 2;
					part = data.slice(offset, offset + size);
					offset += size;
					if (Constants.ID_ZIP64 === signature) parseZip64ExtendedInformation(part);
				}
			} catch (error) {
				throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
			}
		}
		function parseZip64ExtendedInformation(data) {
			var size, compressedSize, offset, diskNumStart;
			if (data.length >= Constants.EF_ZIP64_SCOMP) {
				size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
				if (_centralHeader.size === Constants.EF_ZIP64_OR_32) _centralHeader.size = size;
			}
			if (data.length >= Constants.EF_ZIP64_RHO) {
				compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
				if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) _centralHeader.compressedSize = compressedSize;
			}
			if (data.length >= Constants.EF_ZIP64_DSN) {
				offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
				if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) _centralHeader.offset = offset;
			}
			if (data.length >= Constants.EF_ZIP64_DSN + 4) {
				diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
				if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) _centralHeader.diskNumStart = diskNumStart;
			}
		}
		return {
			get entryName() {
				return decoder.decode(_entryName);
			},
			get rawEntryName() {
				return _entryName;
			},
			set entryName(val) {
				_entryName = Utils.toBuffer(val, decoder.encode);
				var lastChar = _entryName[_entryName.length - 1];
				_isDirectory = lastChar === 47 || lastChar === 92;
				_centralHeader.fileNameLength = _entryName.length;
			},
			get efs() {
				if (typeof _efs === "function") return _efs(this.entryName);
				else return _efs;
			},
			get extra() {
				return _extra;
			},
			set extra(val) {
				_extra = val;
				_centralHeader.extraLength = val.length;
				parseExtra(val);
			},
			get comment() {
				return decoder.decode(_comment);
			},
			set comment(val) {
				_comment = Utils.toBuffer(val, decoder.encode);
				_centralHeader.commentLength = _comment.length;
				if (_comment.length > 65535) throw Utils.Errors.COMMENT_TOO_LONG();
			},
			get name() {
				const n = decoder.decode(_entryName);
				return _isDirectory ? n.replace(/[/\\]$/, "").split("/").pop() : n.split("/").pop();
			},
			get isDirectory() {
				return _isDirectory;
			},
			getCompressedData: function() {
				return compress(false, null);
			},
			getCompressedDataAsync: function(callback) {
				compress(true, callback);
			},
			setData: function(value) {
				uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
				if (!_isDirectory && uncompressedData.length) {
					_centralHeader.size = uncompressedData.length;
					_centralHeader.method = Utils.Constants.DEFLATED;
					_centralHeader.crc = Utils.crc32(value);
					_centralHeader.changed = true;
				} else _centralHeader.method = Utils.Constants.STORED;
			},
			getData: function(pass) {
				if (_centralHeader.changed) return uncompressedData;
				else return decompress(false, null, pass);
			},
			getDataAsync: function(callback, pass) {
				if (_centralHeader.changed) callback(uncompressedData);
				else decompress(true, callback, pass);
			},
			set attr(attr) {
				_centralHeader.attr = attr;
			},
			get attr() {
				return _centralHeader.attr;
			},
			set header(data) {
				_centralHeader.loadFromBinary(data);
			},
			get header() {
				return _centralHeader;
			},
			packCentralHeader: function() {
				_centralHeader.flags_efs = this.efs;
				_centralHeader.extraLength = _extra.length;
				var header = _centralHeader.centralHeaderToBinary();
				var addpos = Utils.Constants.CENHDR;
				_entryName.copy(header, addpos);
				addpos += _entryName.length;
				_extra.copy(header, addpos);
				addpos += _centralHeader.extraLength;
				_comment.copy(header, addpos);
				return header;
			},
			packLocalHeader: function() {
				let addpos = 0;
				_centralHeader.flags_efs = this.efs;
				_centralHeader.extraLocalLength = _extralocal.length;
				const localHeaderBuf = _centralHeader.localHeaderToBinary();
				const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
				localHeaderBuf.copy(localHeader, addpos);
				addpos += localHeaderBuf.length;
				_entryName.copy(localHeader, addpos);
				addpos += _entryName.length;
				_extralocal.copy(localHeader, addpos);
				addpos += _extralocal.length;
				return localHeader;
			},
			toJSON: function() {
				const bytes = function(nr) {
					return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
				};
				return {
					entryName: this.entryName,
					name: this.name,
					comment: this.comment,
					isDirectory: this.isDirectory,
					header: _centralHeader.toJSON(),
					compressedData: bytes(input),
					data: bytes(uncompressedData)
				};
			},
			toString: function() {
				return JSON.stringify(this.toJSON(), null, "	");
			}
		};
	};
}));
//#endregion
//#region node_modules/adm-zip/zipFile.js
var require_zipFile = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var ZipEntry = require_zipEntry();
	var Headers = require_headers();
	var Utils = require_util();
	module.exports = function(inBuffer, options) {
		var entryList = [], entryTable = Object.create(null), _comment = Buffer.alloc(0), mainHeader = new Headers.MainHeader(), loadedEntries = false;
		const temporary = /* @__PURE__ */ new Set();
		const opts = options;
		const { noSort, decoder } = opts;
		if (inBuffer) readMainHeader(opts.readEntries);
		else loadedEntries = true;
		function makeTemporaryFolders() {
			const foldersList = /* @__PURE__ */ new Set();
			for (const elem of Object.keys(entryTable)) {
				const elements = elem.split("/");
				elements.pop();
				if (!elements.length) continue;
				for (let i = 0; i < elements.length; i++) {
					const sub = elements.slice(0, i + 1).join("/") + "/";
					foldersList.add(sub);
				}
			}
			for (const elem of foldersList) if (!(elem in entryTable)) {
				const tempfolder = new ZipEntry(opts);
				tempfolder.entryName = elem;
				tempfolder.attr = 16;
				tempfolder.temporary = true;
				entryList.push(tempfolder);
				entryTable[tempfolder.entryName] = tempfolder;
				temporary.add(tempfolder);
			}
		}
		function readEntries() {
			loadedEntries = true;
			entryTable = Object.create(null);
			if (mainHeader.diskEntries > (inBuffer.length - mainHeader.offset) / Utils.Constants.CENHDR) throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
			entryList = new Array(mainHeader.diskEntries);
			var index = mainHeader.offset;
			for (var i = 0; i < entryList.length; i++) {
				var tmp = index, entry = new ZipEntry(opts, inBuffer);
				entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
				entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
				if (entry.header.extraLength) entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
				if (entry.header.commentLength) entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
				index += entry.header.centralHeaderSize;
				if (entry.entryName in entryTable) throw Utils.Errors.DUPLICATE_ENTRY(`"${entry.entryName}"`);
				entryList[i] = entry;
				entryTable[entry.entryName] = entry;
			}
			temporary.clear();
			makeTemporaryFolders();
		}
		function readMainHeader(readNow) {
			var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
			if (typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false) max = 0;
			for (; i >= n; i--) {
				if (inBuffer[i] !== 80) continue;
				if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
					endOffset = i;
					commentEnd = i;
					endStart = i + Utils.Constants.ENDHDR;
					n = i - Utils.Constants.END64HDR;
					continue;
				}
				if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
					n = max;
					continue;
				}
				if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
					endOffset = i;
					endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
					break;
				}
			}
			if (endOffset == -1) throw Utils.Errors.INVALID_FORMAT();
			mainHeader.loadFromBinary(inBuffer.slice(endOffset, endStart));
			if (mainHeader.commentLength) _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
			if (readNow) readEntries();
		}
		function sortEntries() {
			if (entryList.length > 1 && !noSort) entryList = entryList.map((entry) => ({
				entry,
				key: entry.entryName.toLowerCase()
			})).sort((a, b) => a.key.localeCompare(b.key)).map((pair) => pair.entry);
		}
		return {
			/**
			* Returns an array of ZipEntry objects existent in the current opened archive
			* @return Array
			*/
			get entries() {
				if (!loadedEntries) readEntries();
				return entryList.filter((e) => !temporary.has(e));
			},
			/**
			* Archive comment
			* @return {String}
			*/
			get comment() {
				return decoder.decode(_comment);
			},
			set comment(val) {
				_comment = Utils.toBuffer(val, decoder.encode);
				mainHeader.commentLength = _comment.length;
			},
			getEntryCount: function() {
				if (!loadedEntries) return mainHeader.diskEntries;
				return entryList.length;
			},
			forEach: function(callback) {
				this.entries.forEach(callback);
			},
			/**
			* Returns a reference to the entry with the given name or null if entry is inexistent
			*
			* @param entryName
			* @return ZipEntry
			*/
			getEntry: function(entryName) {
				if (!loadedEntries) readEntries();
				return entryTable[entryName] || null;
			},
			/**
			* Adds the given entry to the entry list
			*
			* @param entry
			*/
			setEntry: function(entry) {
				if (!loadedEntries) readEntries();
				entryList.push(entry);
				entryTable[entry.entryName] = entry;
				mainHeader.totalEntries = entryList.length;
			},
			/**
			* Removes the file with the given name from the entry list.
			*
			* If the entry is a directory, then all nested files and directories will be removed
			* @param entryName
			* @returns {void}
			*/
			deleteFile: function(entryName, withsubfolders = true) {
				if (!loadedEntries) readEntries();
				const entry = entryTable[entryName];
				this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName).forEach(this.deleteEntry);
			},
			/**
			* Removes the entry with the given name from the entry list.
			*
			* @param {string} entryName
			* @returns {void}
			*/
			deleteEntry: function(entryName) {
				if (!loadedEntries) readEntries();
				const entry = entryTable[entryName];
				const index = entryList.indexOf(entry);
				if (index >= 0) {
					entryList.splice(index, 1);
					delete entryTable[entryName];
					mainHeader.totalEntries = entryList.length;
				}
			},
			/**
			*  Iterates and returns all nested files and directories of the given entry
			*
			* @param entry
			* @return Array
			*/
			getEntryChildren: function(entry, subfolders = true) {
				if (!loadedEntries) readEntries();
				if (typeof entry === "object") {
					if (entry.isDirectory && subfolders) {
						const list = [];
						const name = entry.entryName;
						for (const zipEntry of entryList) if (zipEntry.entryName.startsWith(name)) list.push(zipEntry);
						return list;
					} else return [entry];
				}
				return [];
			},
			/**
			*  How many child elements entry has
			*
			* @param {ZipEntry} entry
			* @return {integer}
			*/
			getChildCount: function(entry) {
				if (entry && entry.isDirectory) {
					const list = this.getEntryChildren(entry);
					return list.includes(entry) ? list.length - 1 : list.length;
				}
				return 0;
			},
			/**
			* Returns the zip file
			*
			* @return Buffer
			*/
			compressToBuffer: function() {
				if (!loadedEntries) readEntries();
				sortEntries();
				const dataBlock = [];
				const headerBlocks = [];
				let totalSize = 0;
				let dindex = 0;
				mainHeader.size = 0;
				mainHeader.offset = 0;
				let totalEntries = 0;
				for (const entry of this.entries) {
					const compressedData = entry.getCompressedData();
					entry.header.offset = dindex;
					const localHeader = entry.packLocalHeader();
					const dataLength = localHeader.length + compressedData.length;
					dindex += dataLength;
					dataBlock.push(localHeader);
					dataBlock.push(compressedData);
					const centralHeader = entry.packCentralHeader();
					headerBlocks.push(centralHeader);
					mainHeader.size += centralHeader.length;
					totalSize += dataLength + centralHeader.length;
					totalEntries++;
				}
				totalSize += mainHeader.mainHeaderSize;
				mainHeader.offset = dindex;
				mainHeader.totalEntries = totalEntries;
				dindex = 0;
				const outBuffer = Buffer.alloc(totalSize);
				for (const content of dataBlock) {
					content.copy(outBuffer, dindex);
					dindex += content.length;
				}
				for (const content of headerBlocks) {
					content.copy(outBuffer, dindex);
					dindex += content.length;
				}
				const mh = mainHeader.toBinary();
				if (_comment) _comment.copy(mh, mh.length - _comment.length);
				mh.copy(outBuffer, dindex);
				inBuffer = outBuffer;
				loadedEntries = false;
				return outBuffer;
			},
			toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
				try {
					if (!loadedEntries) readEntries();
					sortEntries();
					const dataBlock = [];
					const centralHeaders = [];
					let totalSize = 0;
					let dindex = 0;
					let totalEntries = 0;
					mainHeader.size = 0;
					mainHeader.offset = 0;
					const compress2Buffer = function(entryLists) {
						if (entryLists.length > 0) {
							const entry = entryLists.shift();
							const name = entry.entryName + entry.extra.toString();
							if (onItemStart) onItemStart(name);
							entry.getCompressedDataAsync(function(compressedData) {
								if (onItemEnd) onItemEnd(name);
								entry.header.offset = dindex;
								const localHeader = entry.packLocalHeader();
								const dataLength = localHeader.length + compressedData.length;
								dindex += dataLength;
								dataBlock.push(localHeader);
								dataBlock.push(compressedData);
								const centalHeader = entry.packCentralHeader();
								centralHeaders.push(centalHeader);
								mainHeader.size += centalHeader.length;
								totalSize += dataLength + centalHeader.length;
								totalEntries++;
								compress2Buffer(entryLists);
							});
						} else {
							totalSize += mainHeader.mainHeaderSize;
							mainHeader.offset = dindex;
							mainHeader.totalEntries = totalEntries;
							dindex = 0;
							const outBuffer = Buffer.alloc(totalSize);
							dataBlock.forEach(function(content) {
								content.copy(outBuffer, dindex);
								dindex += content.length;
							});
							centralHeaders.forEach(function(content) {
								content.copy(outBuffer, dindex);
								dindex += content.length;
							});
							const mh = mainHeader.toBinary();
							if (_comment) _comment.copy(mh, mh.length - _comment.length);
							mh.copy(outBuffer, dindex);
							inBuffer = outBuffer;
							loadedEntries = false;
							onSuccess(outBuffer);
						}
					};
					compress2Buffer(Array.from(this.entries));
				} catch (e) {
					onFail(e);
				}
			}
		};
	};
}));
//#endregion
//#region src/lib/docs.js
var import_adm_zip = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Utils = require_util();
	var pth = __require("path");
	var ZipEntry = require_zipEntry();
	var ZipFile = require_zipFile();
	var get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
	var get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
	var get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
	var defaultOptions = {
		noSort: false,
		readEntries: false,
		method: Utils.Constants.NONE,
		fs: null
	};
	module.exports = function(input, options) {
		let inBuffer = null;
		const opts = Object.assign(Object.create(null), defaultOptions);
		if (input && "object" === typeof input) {
			if (!(input instanceof Uint8Array)) {
				Object.assign(opts, input);
				input = opts.input ? opts.input : void 0;
				if (opts.input) delete opts.input;
			}
			if (Buffer.isBuffer(input)) {
				inBuffer = input;
				opts.method = Utils.Constants.BUFFER;
				input = void 0;
			}
		}
		Object.assign(opts, options);
		const filetools = new Utils(opts);
		const applyDirAttributes = (dirEntries) => {
			dirEntries.filter((d) => d.attr).sort((a, b) => b.path.length - a.path.length).forEach((d) => filetools.fs.chmodSync(d.path, d.attr));
		};
		if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") opts.decoder = Utils.decoder;
		if (input && "string" === typeof input) {
			if (filetools.fs.existsSync(input)) {
				opts.method = Utils.Constants.FILE;
				opts.filename = input;
				inBuffer = filetools.fs.readFileSync(input);
			} else throw Utils.Errors.INVALID_FILENAME();
		}
		const _zip = new ZipFile(inBuffer, opts);
		const { canonical, sanitize, zipnamefix } = Utils;
		function getEntry(entry) {
			if (entry && _zip) {
				var item;
				if (typeof entry === "string") item = _zip.getEntry(pth.posix.normalize(entry));
				if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined") item = _zip.getEntry(entry.entryName);
				if (item) return item;
			}
			return null;
		}
		function fixPath(zipPath) {
			const { join, normalize, sep } = pth.posix;
			return join(pth.isAbsolute(zipPath) ? "/" : ".", normalize(sep + zipPath.split("\\").join(sep) + sep));
		}
		function filenameFilter(filterfn) {
			if (filterfn instanceof RegExp) return (function(rx) {
				return function(filename) {
					return rx.test(filename);
				};
			})(filterfn);
			else if ("function" !== typeof filterfn) return () => true;
			return filterfn;
		}
		const relativePath = (local, entry) => {
			let lastChar = entry.slice(-1);
			lastChar = lastChar === filetools.sep ? filetools.sep : "";
			return pth.relative(local, entry) + lastChar;
		};
		return {
			/**
			* Extracts the given entry from the archive and returns the content as a Buffer object
			* @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
			* @param {Buffer|string} [pass] - password
			* @return Buffer or Null in case of error
			*/
			readFile: function(entry, pass) {
				var item = getEntry(entry);
				return item && item.getData(pass) || null;
			},
			/**
			* Returns how many child elements has on entry (directories) on files it is always 0
			* @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
			* @returns {integer}
			*/
			childCount: function(entry) {
				const item = getEntry(entry);
				if (item) return _zip.getChildCount(item);
			},
			/**
			* Asynchronous readFile
			* @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
			* @param {callback} callback
			*
			* @return Buffer or Null in case of error
			*/
			readFileAsync: function(entry, callback) {
				var item = getEntry(entry);
				if (item) item.getDataAsync(callback);
				else callback(null, "getEntry failed for:" + entry);
			},
			/**
			* Extracts the given entry from the archive and returns the content as plain text in the given encoding
			* @param {ZipEntry|string} entry - ZipEntry object or String with the full path of the entry
			* @param {string} encoding - Optional. If no encoding is specified utf8 is used
			*
			* @return String
			*/
			readAsText: function(entry, encoding) {
				var item = getEntry(entry);
				if (item) {
					var data = item.getData();
					if (data && data.length) return data.toString(encoding || "utf8");
				}
				return "";
			},
			/**
			* Asynchronous readAsText
			* @param {ZipEntry|string} entry ZipEntry object or String with the full path of the entry
			* @param {callback} callback
			* @param {string} [encoding] - Optional. If no encoding is specified utf8 is used
			*
			* @return String
			*/
			readAsTextAsync: function(entry, callback, encoding) {
				var item = getEntry(entry);
				if (item) item.getDataAsync(function(data, err) {
					if (err) {
						callback(data, err);
						return;
					}
					if (data && data.length) callback(data.toString(encoding || "utf8"));
					else callback("");
				});
				else callback("");
			},
			/**
			* Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
			*
			* @param {ZipEntry|string} entry
			* @param {boolean} withsubfolders
			* @returns {void}
			*/
			deleteFile: function(entry, withsubfolders = true) {
				var item = getEntry(entry);
				if (item) _zip.deleteFile(item.entryName, withsubfolders);
			},
			/**
			* Remove the entry from the file or directory without affecting any nested entries
			*
			* @param {ZipEntry|string} entry
			* @returns {void}
			*/
			deleteEntry: function(entry) {
				var item = getEntry(entry);
				if (item) _zip.deleteEntry(item.entryName);
			},
			/**
			* Adds a comment to the zip. The zip must be rewritten after adding the comment.
			*
			* @param {string} comment
			*/
			addZipComment: function(comment) {
				_zip.comment = comment;
			},
			/**
			* Returns the zip comment
			*
			* @return String
			*/
			getZipComment: function() {
				return _zip.comment || "";
			},
			/**
			* Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
			* The comment cannot exceed 65535 characters in length
			*
			* @param {ZipEntry} entry
			* @param {string} comment
			*/
			addZipEntryComment: function(entry, comment) {
				var item = getEntry(entry);
				if (item) item.comment = comment;
			},
			/**
			* Returns the comment of the specified entry
			*
			* @param {ZipEntry} entry
			* @return String
			*/
			getZipEntryComment: function(entry) {
				var item = getEntry(entry);
				if (item) return item.comment || "";
				return "";
			},
			/**
			* Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
			*
			* @param {ZipEntry} entry
			* @param {Buffer} content
			*/
			updateFile: function(entry, content) {
				var item = getEntry(entry);
				if (item) item.setData(content);
			},
			/**
			* Adds a file from the disk to the archive
			*
			* @param {string} localPath File to add to zip
			* @param {string} [zipPath] Optional path inside the zip
			* @param {string} [zipName] Optional name for the file
			* @param {string} [comment] Optional file comment
			*/
			addLocalFile: function(localPath, zipPath, zipName, comment) {
				if (filetools.fs.existsSync(localPath)) {
					zipPath = zipPath ? fixPath(zipPath) : "";
					const p = pth.win32.basename(pth.win32.normalize(localPath));
					zipPath += zipName ? zipName : p;
					const _attr = filetools.fs.statSync(localPath);
					const data = _attr.isFile() ? filetools.fs.readFileSync(localPath) : Buffer.alloc(0);
					if (_attr.isDirectory()) zipPath += filetools.sep;
					this.addFile(zipPath, data, comment, _attr);
				} else throw Utils.Errors.FILE_NOT_FOUND(localPath);
			},
			/**
			* Callback for showing if everything was done.
			*
			* @callback doneCallback
			* @param {Error} err - Error object
			* @param {boolean} done - was request fully completed
			*/
			/**
			* Adds a file from the disk to the archive
			*
			* @param {(object|string)} options - options object, if it is string it us used as localPath.
			* @param {string} options.localPath - Local path to the file.
			* @param {string} [options.comment] - Optional file comment.
			* @param {string} [options.zipPath] - Optional path inside the zip
			* @param {string} [options.zipName] - Optional name for the file
			* @param {doneCallback} callback - The callback that handles the response.
			*/
			addLocalFileAsync: function(options, callback) {
				options = typeof options === "object" ? options : { localPath: options };
				const localPath = pth.resolve(options.localPath);
				const { comment } = options;
				let { zipPath, zipName } = options;
				const self = this;
				filetools.fs.stat(localPath, function(err, stats) {
					if (err) return callback(err, false);
					zipPath = zipPath ? fixPath(zipPath) : "";
					const p = pth.win32.basename(pth.win32.normalize(localPath));
					zipPath += zipName ? zipName : p;
					if (stats.isFile()) filetools.fs.readFile(localPath, function(err, data) {
						if (err) return callback(err, false);
						self.addFile(zipPath, data, comment, stats);
						return setImmediate(callback, void 0, true);
					});
					else if (stats.isDirectory()) {
						zipPath += filetools.sep;
						self.addFile(zipPath, Buffer.alloc(0), comment, stats);
						return setImmediate(callback, void 0, true);
					}
				});
			},
			/**
			* Adds a local directory and all its nested files and directories to the archive
			*
			* @param {string} localPath - local path to the folder
			* @param {string} [zipPath] - optional path inside zip
			* @param {(RegExp|function)} [filter] - optional RegExp or Function if files match will be included.
			*/
			addLocalFolder: function(localPath, zipPath, filter) {
				filter = filenameFilter(filter);
				zipPath = zipPath ? fixPath(zipPath) : "";
				localPath = pth.normalize(localPath);
				if (filetools.fs.existsSync(localPath)) {
					const items = filetools.findFiles(localPath);
					const self = this;
					if (items.length) for (const filepath of items) {
						const p = pth.join(zipPath, relativePath(localPath, filepath));
						if (filter(p)) self.addLocalFile(filepath, pth.dirname(p));
					}
				} else throw Utils.Errors.FILE_NOT_FOUND(localPath);
			},
			/**
			* Asynchronous addLocalFolder
			* @param {string} localPath
			* @param {callback} callback
			* @param {string} [zipPath] optional path inside zip
			* @param {RegExp|function} [filter] optional RegExp or Function if files match will
			*               be included.
			*/
			addLocalFolderAsync: function(localPath, callback, zipPath, filter) {
				filter = filenameFilter(filter);
				zipPath = zipPath ? fixPath(zipPath) : "";
				localPath = pth.normalize(localPath);
				var self = this;
				filetools.fs.open(localPath, "r", function(err) {
					if (err && err.code === "ENOENT") callback(void 0, Utils.Errors.FILE_NOT_FOUND(localPath));
					else if (err) callback(void 0, err);
					else {
						var items = filetools.findFiles(localPath);
						var i = -1;
						var next = function() {
							i += 1;
							if (i < items.length) {
								var filepath = items[i];
								var p = relativePath(localPath, filepath).split("\\").join("/");
								p = p.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
								if (filter(p)) filetools.fs.stat(filepath, function(er0, stats) {
									if (er0) callback(void 0, er0);
									if (stats.isFile()) filetools.fs.readFile(filepath, function(er1, data) {
										if (er1) callback(void 0, er1);
										else {
											self.addFile(zipPath + p, data, "", stats);
											next();
										}
									});
									else {
										self.addFile(zipPath + p + "/", Buffer.alloc(0), "", stats);
										next();
									}
								});
								else process.nextTick(() => {
									next();
								});
							} else callback(true, void 0);
						};
						next();
					}
				});
			},
			/**
			* Adds a local directory and all its nested files and directories to the archive
			*
			* @param {object | string} options - options object, if it is string it us used as localPath.
			* @param {string} options.localPath - Local path to the folder.
			* @param {string} [options.zipPath] - optional path inside zip.
			* @param {RegExp|function} [options.filter] - optional RegExp or Function if files match will be included.
			* @param {function|string} [options.namefix] - optional function to help fix filename
			* @param {doneCallback} callback - The callback that handles the response.
			*
			*/
			addLocalFolderAsync2: function(options, callback) {
				const self = this;
				options = typeof options === "object" ? options : { localPath: options };
				const localPath = pth.resolve(options.localPath);
				let { zipPath, filter, namefix } = options;
				if (filter instanceof RegExp) filter = (function(rx) {
					return function(filename) {
						return rx.test(filename);
					};
				})(filter);
				else if ("function" !== typeof filter) filter = function() {
					return true;
				};
				zipPath = zipPath ? fixPath(zipPath) : "";
				if (namefix === "latin1") namefix = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
				if (typeof namefix !== "function") namefix = (str) => str;
				const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
				const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
				filetools.fs.open(localPath, "r", function(err) {
					if (err && err.code === "ENOENT") callback(Utils.Errors.FILE_NOT_FOUND(localPath), false);
					else if (err) callback(err, false);
					else filetools.findFilesAsync(localPath, function(err, fileEntries) {
						if (err) return callback(err, false);
						fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
						if (!fileEntries.length) return callback(void 0, true);
						setImmediate(fileEntries.reverse().reduce(function(next, entry) {
							return function(err, done) {
								if (err || done === false) return setImmediate(next, err, false);
								self.addLocalFileAsync({
									localPath: entry,
									zipPath: pth.dirname(relPathFix(entry)),
									zipName: fileNameFix(entry)
								}, next);
							};
						}, callback));
					});
				});
			},
			/**
			* Adds a local directory and all its nested files and directories to the archive
			*
			* @param {string} localPath - path where files will be extracted
			* @param {object} props - optional properties
			* @param {string} [props.zipPath] - optional path inside zip
			* @param {RegExp|function} [props.filter] - optional RegExp or Function if files match will be included.
			* @param {function|string} [props.namefix] - optional function to help fix filename
			*/
			addLocalFolderPromise: function(localPath, props) {
				return new Promise((resolve, reject) => {
					this.addLocalFolderAsync2(Object.assign({ localPath }, props), (err, done) => {
						if (err) return reject(err);
						if (done) resolve(this);
					});
				});
			},
			/**
			* Allows you to create a entry (file or directory) in the zip file.
			* If you want to create a directory the entryName must end in / and a null buffer should be provided.
			* Comment and attributes are optional
			*
			* @param {string} entryName
			* @param {Buffer | string} content - file content as buffer or utf8 coded string
			* @param {string} [comment] - file comment
			* @param {number | object} [attr] - number as unix file permissions, object as filesystem Stats object
			*/
			addFile: function(entryName, content, comment, attr) {
				entryName = zipnamefix(entryName);
				let entry = getEntry(entryName);
				const update = entry != null;
				if (!update) {
					entry = new ZipEntry(opts);
					entry.entryName = entryName;
				}
				entry.comment = comment || "";
				const isStat = "object" === typeof attr && attr instanceof filetools.fs.Stats;
				if (isStat) entry.header.time = attr.mtime;
				var fileattr = entry.isDirectory ? 16 : 0;
				let unix = entry.isDirectory ? 16384 : 32768;
				if (isStat) unix |= 4095 & attr.mode;
				else if ("number" === typeof attr) unix |= 4095 & attr;
				else unix |= entry.isDirectory ? 493 : 420;
				fileattr = (fileattr | unix << 16) >>> 0;
				entry.attr = fileattr;
				entry.setData(content);
				if (!update) _zip.setEntry(entry);
				return entry;
			},
			/**
			* Returns an array of ZipEntry objects representing the files and folders inside the archive
			*
			* @param {string} [password]
			* @returns Array
			*/
			getEntries: function(password) {
				_zip.password = password;
				return _zip ? _zip.entries : [];
			},
			/**
			* Returns a ZipEntry object representing the file or folder specified by ``name``.
			*
			* @param {string} name
			* @return ZipEntry
			*/
			getEntry: function(name) {
				return getEntry(name);
			},
			getEntryCount: function() {
				return _zip.getEntryCount();
			},
			forEach: function(callback) {
				return _zip.forEach(callback);
			},
			/**
			* Extracts the given entry to the given targetPath
			* If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
			*
			* @param {string|ZipEntry} entry - ZipEntry object or String with the full path of the entry
			* @param {string} targetPath - Target folder where to write the file
			* @param {boolean} [maintainEntryPath=true] - If maintainEntryPath is true and the entry is inside a folder, the entry folder will be created in targetPath as well. Default is TRUE
			* @param {boolean} [overwrite=false] - If the file already exists at the target path, the file will be overwriten if this is true.
			* @param {boolean} [keepOriginalPermission=false] - The file will be set as the permission from the entry if this is true.
			* @param {string} [outFileName] - String If set will override the filename of the extracted file (Only works if the entry is a file)
			*
			* @return Boolean
			*/
			extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
				overwrite = get_Bool(false, overwrite);
				keepOriginalPermission = get_Bool(false, keepOriginalPermission);
				maintainEntryPath = get_Bool(true, maintainEntryPath);
				outFileName = get_Str(keepOriginalPermission, outFileName);
				var item = getEntry(entry);
				if (!item) throw Utils.Errors.NO_ENTRY();
				var entryName = canonical(item.entryName);
				var target = sanitize(targetPath, outFileName && !item.isDirectory ? canonical(outFileName) : maintainEntryPath ? entryName : pth.basename(entryName));
				if (item.isDirectory) {
					_zip.getEntryChildren(item).forEach(function(child) {
						if (child.isDirectory) return;
						var content = child.getData();
						if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
						var name = canonical(maintainEntryPath ? child.entryName : child.entryName.substring(item.entryName.length));
						var childName = sanitize(targetPath, name);
						filetools.assertPathSafe(targetPath, childName);
						const fileAttr = keepOriginalPermission ? child.header.fileAttr : void 0;
						filetools.writeFileTo(childName, content, overwrite, fileAttr);
					});
					return true;
				}
				var content = item.getData(_zip.password);
				if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
				filetools.assertPathSafe(targetPath, target);
				if (filetools.fs.existsSync(target) && !overwrite) throw Utils.Errors.CANT_OVERRIDE();
				const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
				filetools.writeFileTo(target, content, overwrite, fileAttr);
				return true;
			},
			/**
			* Test the archive
			* @param {string} [pass]
			*/
			test: function(pass) {
				if (!_zip) return false;
				for (var entry of _zip.entries) try {
					if (entry.isDirectory) continue;
					if (!entry.getData(pass)) return false;
				} catch (err) {
					return false;
				}
				return true;
			},
			/**
			* Extracts the entire archive to the given location
			*
			* @param {string} targetPath Target location
			* @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
			*                  Default is FALSE
			* @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
			*                  Default is FALSE
			* @param {string|Buffer} [pass] password
			*/
			extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
				keepOriginalPermission = get_Bool(false, keepOriginalPermission);
				pass = get_Str(keepOriginalPermission, pass);
				overwrite = get_Bool(false, overwrite);
				if (!_zip) throw Utils.Errors.NO_ZIP();
				const dirEntries = [];
				_zip.entries.forEach(function(entry) {
					var entryName = sanitize(targetPath, canonical(entry.entryName));
					filetools.assertPathSafe(targetPath, entryName);
					if (entry.isDirectory) {
						filetools.makeDir(entryName);
						if (keepOriginalPermission) dirEntries.push({
							path: entryName,
							attr: entry.header.fileAttr
						});
						return;
					}
					var content = entry.getData(pass);
					if (!content) throw Utils.Errors.CANT_EXTRACT_FILE();
					const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
					filetools.writeFileTo(entryName, content, overwrite, fileAttr);
					try {
						filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
					} catch (err) {}
				});
				applyDirAttributes(dirEntries);
			},
			/**
			* Asynchronous extractAllTo
			*
			* @param {string} targetPath Target location
			* @param {boolean} [overwrite=false] If the file already exists at the target path, the file will be overwriten if this is true.
			*                  Default is FALSE
			* @param {boolean} [keepOriginalPermission=false] The file will be set as the permission from the entry if this is true.
			*                  Default is FALSE
			* @param {function} callback The callback will be executed when all entries are extracted successfully or any error is thrown.
			*/
			extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
				callback = get_Fun(overwrite, keepOriginalPermission, callback);
				keepOriginalPermission = get_Bool(false, keepOriginalPermission);
				overwrite = get_Bool(false, overwrite);
				if (!callback) return new Promise((resolve, reject) => {
					this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
						if (err) reject(err);
						else resolve(this);
					});
				});
				if (!_zip) {
					callback(Utils.Errors.NO_ZIP());
					return;
				}
				targetPath = pth.resolve(targetPath);
				const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
				const getError = (msg, file) => /* @__PURE__ */ new Error(msg + ": \"" + file + "\"");
				const dirEntries = [];
				const fileEntries = [];
				_zip.entries.forEach((e) => {
					if (e.isDirectory) dirEntries.push(e);
					else fileEntries.push(e);
				});
				const deferredDirAttr = [];
				for (const entry of dirEntries) {
					const dirPath = getPath(entry);
					const dirAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
					try {
						filetools.assertPathSafe(targetPath, dirPath);
						filetools.makeDir(dirPath);
					} catch (er) {
						callback(getError("Unable to create folder", dirPath));
						continue;
					}
					if (dirAttr) deferredDirAttr.push({
						path: dirPath,
						attr: dirAttr
					});
					try {
						filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
					} catch (er) {}
				}
				const done = (err) => {
					if (!err) try {
						applyDirAttributes(deferredDirAttr);
					} catch (er) {
						return callback(getError("Unable to set folder permissions", er.path || ""));
					}
					callback(err);
				};
				fileEntries.reverse().reduce(function(next, entry) {
					return function(err) {
						if (err) next(err);
						else {
							const entryName = pth.normalize(canonical(entry.entryName));
							const filePath = sanitize(targetPath, entryName);
							try {
								filetools.assertPathSafe(targetPath, filePath);
							} catch (er) {
								return next(er);
							}
							entry.getDataAsync(function(content, err_1) {
								if (err_1) next(err_1);
								else if (!content) next(Utils.Errors.CANT_EXTRACT_FILE());
								else {
									const fileAttr = keepOriginalPermission ? entry.header.fileAttr : void 0;
									filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
										if (!succ) return next(getError("Unable to write file", filePath));
										filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function() {
											next();
										});
									});
								}
							});
						}
					};
				}, done)();
			},
			/**
			* Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
			*
			* @param {string} targetFileName
			* @param {function} callback
			*/
			writeZip: function(targetFileName, callback) {
				if (arguments.length === 1) {
					if (typeof targetFileName === "function") {
						callback = targetFileName;
						targetFileName = "";
					}
				}
				if (!targetFileName && opts.filename) targetFileName = opts.filename;
				if (!targetFileName) return;
				var zipData = _zip.compressToBuffer();
				if (zipData) {
					var ok = filetools.writeFileTo(targetFileName, zipData, true);
					if (typeof callback === "function") callback(!ok ? /* @__PURE__ */ new Error("failed") : null, "");
				}
			},
			/**
			*
			* @param {string} targetFileName
			* @param {object} [props]
			* @param {boolean} [props.overwrite=true] If the file already exists at the target path, the file will be overwriten if this is true.
			* @param {boolean} [props.perm] The file will be set as the permission from the entry if this is true.
			
			* @returns {Promise<void>}
			*/
			writeZipPromise: function(targetFileName, props) {
				const { overwrite, perm } = Object.assign({ overwrite: true }, props);
				return new Promise((resolve, reject) => {
					if (!targetFileName && opts.filename) targetFileName = opts.filename;
					if (!targetFileName) reject("ADM-ZIP: ZIP File Name Missing");
					this.toBufferPromise().then((zipData) => {
						const ret = (done) => done ? resolve(done) : reject("ADM-ZIP: Wasn't able to write zip file");
						filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
					}, reject);
				});
			},
			/**
			* @returns {Promise<Buffer>} A promise to the Buffer.
			*/
			toBufferPromise: function() {
				return new Promise((resolve, reject) => {
					_zip.toAsyncBuffer(resolve, reject);
				});
			},
			/**
			* Returns the content of the entire zip file as a Buffer object
			*
			* @prop {function} [onSuccess]
			* @prop {function} [onFail]
			* @prop {function} [onItemStart]
			* @prop {function} [onItemEnd]
			* @returns {Buffer}
			*/
			toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
				if (typeof onSuccess === "function") {
					_zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
					return null;
				}
				return _zip.compressToBuffer();
			}
		};
	};
})))(), 1);
/** The most a page of docs can hold, in bytes. */
var PAGE_LIMIT = 512e3;
var TRUNCATED_NOTE = Buffer.from("\n\n> This page was truncated: it is longer than 500 KB.\n");
/** The markdown files below the folder, as paths relative to it with `/` between the folders. */
async function pagePaths(folder) {
	return (await readdir(folder, {
		recursive: true,
		withFileTypes: true
	})).filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => relative(folder, join(entry.parentPath, entry.name)).split(sep).join("/")).sort();
}
/** The page, cut at the limit on a whole character, with a note at its end that it was. */
function truncate(path, content) {
	if (content.length <= PAGE_LIMIT) return content;
	warning(`${path} is longer than 500 KB and is truncated`);
	let end = PAGE_LIMIT - TRUNCATED_NOTE.length;
	while ((content[end] & 192) === 128) end--;
	return Buffer.concat([content.subarray(0, end), TRUNCATED_NOTE]);
}
/** The zip of the markdown pages in the folder, with its size, which the registry asks for. */
async function zipDocs(folder) {
	const paths = await pagePaths(folder);
	if (paths.length === 0) throw new Error(`There are no markdown pages in ${folder}`);
	const zip = new import_adm_zip.default();
	for (const path of paths) {
		const page = truncate(path, await readFile(join(folder, path)));
		info(`  ${path} (${page.length} bytes)`);
		zip.addFile(path, page);
	}
	const content = zip.toBuffer();
	return {
		content,
		pages: paths.length,
		size: content.length
	};
}
//#endregion
//#region src/lib/inputs.js
/**
* The inputs of the action, which its step passes as JSON in `INPUTS` with `${{ toJSON(inputs) }}`. Run outside a job,
* set `INPUTS` to the same JSON.
*/
function inputs() {
	const json = process.env.INPUTS;
	if (!json) throw new Error("INPUTS is not set: the step of the action passes its inputs there as JSON");
	return JSON.parse(json);
}
//#endregion
//#region src/lib/registry.js
var USER_AGENT = "steward-gh-actions";
/** The calls that publish a plugin to the registry, with the OIDC token of the job. */
var Registry = class {
	constructor(address, pluginId, token) {
		this.plugin = `${address.replace(/\/+$/, "")}/plugins/${pluginId}`;
		this.client = new HttpClient(USER_AGENT, [new BearerCredentialHandler(token)]);
	}
	/** Announces the zip of a version and is given the URL to upload it to. */
	async begin(announcement) {
		return this.#post(`${this.plugin}/uploads`, announcement);
	}
	/** Uploads the zip to the URL that begin gave, which is not the registry and takes no token. */
	async upload(url, content) {
		const response = await new HttpClient(USER_AGENT).sendStream("PUT", url, Readable.from(content), { "Content-Length": content.length });
		const body = await response.readBody();
		if (response.message.statusCode >= 300) throw new Error(`Uploading the zip failed with ${response.message.statusCode}: ${body.trim()}`);
	}
	/** Says the zip is uploaded, which has the registry process it. Returns the publication. */
	async finish(announcement) {
		return this.#post(`${this.plugin}/versions`, announcement);
	}
	/** The address where the outcome of the publication is read. */
	status(publication) {
		return `${this.plugin}/publications/${publication.ulid}`;
	}
	/** Posts the object as JSON. The client rejects an error response with the message of the registry. */
	async #post(url, object) {
		const response = await this.client.postJson(url, object);
		if (response.statusCode === 404) throw new Error(`${url} was not found`);
		return response.result;
	}
};
//#endregion
//#region src/commands/plugin/publish.js
/** What the job was started by must be a push of the tag `v<version>`: the registry checks it against the token too. */
function versionFromTag() {
	const { GITHUB_REF_TYPE: type, GITHUB_REF_NAME: name = "" } = process.env;
	if (type !== "tag" || !name.startsWith("v")) throw new Error(`Publish from a tag named v<version>, not from ${process.env.GITHUB_REF}`);
	return name.slice(1);
}
async function publish() {
	const { "plugin-id": pluginId, docs, registry: address, audience } = inputs();
	if (!pluginId) throw new Error("The plugin-id input is required");
	const version = versionFromTag();
	info(`Publishing version ${version} of plugin ${pluginId} to ${address}`);
	const zip = await zipDocs(docs);
	info(`Zipped ${zip.pages} pages from ${docs}: ${zip.size} bytes`);
	info(`Asking GitHub for an OIDC token for ${audience}`);
	const registry = new Registry(address, pluginId, await getIDToken(audience));
	const announcement = {
		version,
		size: zip.size
	};
	info("Announcing the zip to the registry");
	const begun = await registry.begin(announcement);
	if (begun.published) {
		const status = registry.status(begun.publication);
		info(`Version ${version} is published already from this commit, so there is nothing to send. Status: ${status}`);
		await summary.addRaw(`Version ${version} is published already from this commit. [Status](${status})`).write();
		return;
	}
	info("The registry accepted the announcement and gave an upload URL. Uploading the zip");
	await registry.upload(begun.url, zip.content);
	info("Uploaded. Asking the registry to process the zip");
	const publication = await registry.finish(announcement);
	const status = registry.status(publication);
	info(`The registry queued publication ${publication.ulid} (${publication.state}). Status: ${status}`);
	await summary.addRaw(`Sent ${version} to the registry. [Status](${status})`).write();
}
/** Adds `publish` to `plugin`. It reads the inputs of the action. */
function addPublish(plugin) {
	plugin.command("publish").description("Zip the docs of a plugin and send them to the registry with the OIDC token of the job").action(publish);
}
//#endregion
//#region src/commands/plugin/index.js
/** Adds `plugin`, the commands for the plugins of the registry. */
function addPlugin(program) {
	addPublish(program.command("plugin").description("Work with a plugin of the registry"));
}
//#endregion
//#region src/main.js
var program = new Command("steward-actions").description("The actions of Steward, which also run from a terminal");
addPlugin(program);
program.parseAsync().catch((error) => setFailed(error));
//#endregion
export {};
