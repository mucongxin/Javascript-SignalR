; (function (global, factory) {
    "use strict";
    if (typeof module !== "undefined" && module.exports) {
        module.exports = global.document ?
            factory(global, true) :
            function (w) {
                return factory(w);
            };
    } else if (typeof define === "function" && define.amd) {
        define(function () {
            return global.document ?
                factory(global, true) :
                function (w) {
                    return factory(w);
                };
        });
    } else {
        factory(global);
    }
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
    "use strict";
    var class2type = {};
    var toString = class2type.toString;
    var hasOwn = class2type.hasOwnProperty;
    var support = {};
    var
        version = "1.0.0",
        signalR = function () {
            return this;
        },
        DEFAULT_RETRY_DELAYS_IN_MILLISECONDS = [0, 2000, 10000, 30000, null],
        DEFAULT_TIMEOUT_IN_MS = 30 * 1000,
        DEFAULT_PING_INTERVAL_IN_MS = 15 * 1000,
        JSON_HUB_PROTOCOL_NAME = "json",
        LogLevel = {
            Trace: 0,
            Debug: 1,
            Information: 2,
            Warning: 3,
            Error: 4,
            Critical: 5,
            None: 6
        },
        LogLevelNameMapping = ["Trace", "Debug", "Information", "Warning", "Error", "Critical", "None"],
        TransferFormat = {
            Text: 0,
            Binary: 1
        },
        HttpTransportType = {
            /** Specifies no transport preference. */
            None: 0,
            /** Specifies the WebSockets transport. */
            WebSockets: 1,
            /** Specifies the Server-Sent Events transport. */
            ServerSentEvents: 2,
            /** Specifies the Long Polling transport. */
            LongPolling: 4
        },
        RecordSeparatorCode = 0x1e,
        RecordSeparator = String.fromCharCode(RecordSeparatorCode),
        TextMessageFormat = {
            write: function (output) {
                return output + RecordSeparator;
            }, parse: function (input) {
                if (input.charAt(input.length - 1) !== RecordSeparator) {
                    throw new Error("Message is incomplete.");
                }
                var messages = input.split(RecordSeparator);
                messages.pop();
                return messages;
            }
        },
        MessageType = {
            Invocation: 1,
            /** Indicates the message is a StreamItem message and implements the {@link @microsoft/signalr.StreamItemMessage} interface. */
            StreamItem: 2,
            /** Indicates the message is a Completion message and implements the {@link @microsoft/signalr.CompletionMessage} interface. */
            Completion: 3,
            /** Indicates the message is a Stream Invocation message and implements the {@link @microsoft/signalr.StreamInvocationMessage} interface. */
            StreamInvocation: 4,
            /** Indicates the message is a Cancel Invocation message and implements the {@link @microsoft/signalr.CancelInvocationMessage} interface. */
            CancelInvocation: 5,
            /** Indicates the message is a Ping message and implements the {@link @microsoft/signalr.PingMessage} interface. */
            Ping: 6,
            /** Indicates the message is a Close message and implements the {@link @microsoft/signalr.CloseMessage} interface. */
            Close: 7
        },
        HubConnectionState = {
            /** The hub connection is disconnected. */
            Disconnected: "Disconnected",
            /** The hub connection is connecting. */
            Connecting: "Connecting",
            /** The hub connection is connected. */
            Connected: "Connected",
            /** The hub connection is disconnecting. */
            Disconnecting: "Disconnecting",
            /** The hub connection is reconnecting. */
            Reconnecting: "Reconnecting"
        },
        ConnectionState = {
            Connecting: "Connecting",
            Connected: "Connected",
            Disconnected: "Disconnected",
            Disconnecting: "Disconnecting"
        },
        indexOf = function (arr, el, from) {
            var len = arr.length >>> 0;
            from = Number(from) || 0;
            from = from < 0 ? Math.ceil(from) : Math.floor(from);
            if (from < 0) {
                from += len;
            }
            for (; from < len; from++) {
                if (from in arr && arr[from] === el)
                    return from;
            }
            return -1;
        },
        log = function (msg, logLevel, logging) {
            logLevel = logLevel || LogLevel.Debug;
            if (logging === false) {
                return;
            }
            var m;
            if (typeof window.console === "undefined") {
                return;
            }
            m = "[" + new Date().toTimeString() + "] SignalR " + LogLevelNameMapping[logLevel] + ": " + msg;
            if (window.console.debug) {
                window.console.debug(m);
            } else if (window.console.log) {
                window.console.log(m);
            }
        };

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj) {
            return indexOf.call(this, obj);
        };
    }
    signalR.fn = signalR.prototype = {
        version: version,
        constructor: signalR
    };
    signalR.extend = signalR.fn.extend = function () {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;
        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            // skip the boolean and the target
            target = arguments[i] || {};
            i++;
        }
        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !signalR.isFunction(target)) {
            target = {};
        }
        // extend jQuery itself if only one argument is passed
        if (i === length) {
            target = this;
            i--;
        }
        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) !== null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }
                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (signalR.isPlainObject(copy) ||
                        (copyIsArray = signalR.isArray(copy)))) {

                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && signalR.isArray(src) ? src : [];

                        } else {
                            clone = src && signalR.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = signalR.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }
        // Return the modified object
        return target;
    };
    signalR.extend({
        isFunction: function (obj) {
            return signalR.type(obj) === "function";
        },
        isArray: Array.isArray || function (obj) {
            return signalR.type(obj) === "array";
        },
        isWindow: function (obj) {
            /* jshint eqeqeq: false */
            return obj !== null && obj === obj.window;
        },
        isNumeric: function (obj) {
            var realStringObj = obj && obj.toString();
            return !signalR.isArray(obj) && (realStringObj - parseFloat(realStringObj) + 1) >= 0;
        },
        isEmptyObject: function (obj) {
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        isPromise: function (obj) {
            return !!obj
                && (typeof obj === 'object' || typeof obj === 'function') // 初始promise 或 promise.then返回的
                && typeof obj.then === 'function';
        },
        isPlainObject: function (obj) {
            var key;
            if (!obj || signalR.type(obj) !== "object" || obj.nodeType || signalR.isWindow(obj)) {
                return false;
            }
            try {
                if (obj.constructor &&
                    !hasOwn.call(obj, "constructor") &&
                    !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                    return false;
                }
            } catch (e) {
                return false;
            }
            // Support: IE<9
            // Handle iteration over inherited properties before own properties.
            if (!support.ownFirst) {
                for (key in obj) {
                    return hasOwn.call(obj, key);
                }
            }
            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            for (key in obj) {
                log(key);
            }
            return key === undefined || hasOwn.call(obj, key);
        },
        isJSON: function isJSON(str) {
            if (/^\s*$/.test(str)) return false;
            str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
            str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
            str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
            return (/^[\],:{}\s]*$/).test(str);
        },
        fnReg: /^(function\s*)(\w*\b)/,
        compareFunction: function (a1, a2) {
            return a1.toString().replace(signalR.fnReg, '$1') === a2.toString().replace(signalR.fnReg, '$1');
        },
        type: function (obj) {
            if (obj === null) {
                return obj + "";
            }
            return typeof obj === "object" || typeof obj === "function" ?
                class2type[toString.call(obj)] || "object" :
                typeof obj;
        },
        each: function (obj, callback) {
            var length, i = 0;

            if (isArrayLike(obj)) {
                length = obj.length;
                for (; i < length; i++) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            } else {
                for (i in obj) {
                    if (callback.call(obj[i], i, obj[i]) === false) {
                        break;
                    }
                }
            }

            return obj;
        }
    });
    signalR.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase();
    });
    function isArrayLike(obj) {
        var length = !!obj && "length" in obj && obj.length,
            type = signalR.type(obj);
        if (type === "function" || signalR.isWindow(obj)) {
            return false;
        }
        return type === "array" || length === 0 ||
            typeof length === "number" && length > 0 && (length - 1) in obj;
    }

    function getDataDetail(data, includeContent) {
        var detail = "";
        if (isArrayBuffer(data)) {
            detail = "Binary data of length " + data.byteLength;
            if (includeContent) {
                detail += ". Content: '" + formatArrayBuffer(data) + "'";
            }
        }
        else if (typeof data === "string") {
            detail = "String data of length " + data.length;
            if (includeContent) {
                detail += ". Content: '" + data + "'";
            }
        }
        return detail;
    }
    function formatArrayBuffer(data) {
        if (typeof Uint8Array !== "undefined") {
            var view = new Uint8Array(data);
            // Uint8Array.map only supports returning another Uint8Array?
            var str = "";
            view.forEach(function (num) {
                var pad = num < 16 ? "0" : "";
                str += "0x" + pad + num.toString(16) + " ";
            });
            // Trim of trailing space.
            return str.substr(0, str.length - 1);
        }
        return data;
    }
    // Also in signalr-protocol-msgpack/Utils.ts
    function isArrayBuffer(val) {
        return val && typeof ArrayBuffer !== "undefined" &&
            (val instanceof ArrayBuffer ||
                // Sometimes we get an ArrayBuffer that doesn't satisfy instanceof
                (val.constructor && val.constructor.name === "ArrayBuffer"));
    }

    function NullLogger() { }
    NullLogger.prototype.log = function (_logLevel, _message) { };
    NullLogger.instance = new NullLogger();
    function ConsoleLogger(minimumLogLevel) {
        this.minimumLogLevel = minimumLogLevel;
    }
    ConsoleLogger.prototype.log = function (logLevel, message) {
        if (logLevel >= this.minimumLogLevel) {
            switch (logLevel) {
                case LogLevel.Critical:
                case LogLevel.Error:
                    log(message, logLevel);
                    break;
                case LogLevel.Warning:
                    log(message, logLevel);
                    break;
                case LogLevel.Information:
                    log(message, logLevel);
                    break;
                default:
                    // console.debug only goes to attached debuggers in Node, so we use console.log for Trace and Debug
                    log(message, logLevel);
                    break;
            }
        }
    };

    function createLogger(logger) {
        if (logger === undefined) {
            return new ConsoleLogger(LogLevel.Information);
        }
        if (logger === null) {
            return NullLogger.instance;
        }
        if (logger.log) {
            return logger;
        }
        return new ConsoleLogger(logger);
    }

    function AbortController() {
        this.isAborted = false;
        this.onabort = null;
    }
    AbortController.prototype.aborted = function () {
        return this.isAborted;
    };
    AbortController.prototype.signal = function () {
        return this;
    };
    AbortController.prototype.abort = function () {
        if (!this.isAborted) {
            this.isAborted = true;
            if (this.onabort) {
                this.onabort();
            }
        }
    };

    function XhrHttpClient(logger) {
        this.logger = logger;
    }
    XhrHttpClient.prototype.xhr = function () {
        var fn = [
            function () { return new XMLHttpRequest(); },
            function () { return typeof window.ActiveXObject !== "undefined" && new window.ActiveXObject('Msxml2.XMLHTTP.4.0'); },
            function () { return typeof window.ActiveXObject !== "undefined" && new window.ActiveXObject('Msxml2.XMLHTTP.3.0'); },
            function () { return typeof window.ActiveXObject !== "undefined" && new window.ActiveXObject('Msxml2.XMLHTTP.2.6'); },
            function () { return typeof window.ActiveXObject !== "undefined" && new window.ActiveXObject('Microsoft.XMLHTTP'); },
            function () { return typeof window.ActiveXObject !== "undefined" && new window.ActiveXObject('Msxml2.XMLHTTP'); }
        ];
        var returnValue;
        for (var i = 0, length = fn.length; i < length; i++) {
            var lambda = fn[i];
            try {
                returnValue = lambda();
                break;
            } catch (e) { log(e); }
        }
        return returnValue;
    };
    XhrHttpClient.prototype.send = function (request) {
        var _this = this;
        // Check that abort was not signaled before calling send
        if (request.abortSignal && request.abortSignal.aborted()) {
            return Promise.reject(new Error("AbortError"));
        }
        if (!request.method) {
            return Promise.reject(new Error("No method defined."));
        }
        if (!request.url) {
            return Promise.reject(new Error("No url defined."));
        }
        return new Promise(function (resolve, reject) {
            var xhr = _this.xhr();
            console.log(xhr.setRequestHeader);
            xhr.open(request.method, request.url, true);
            xhr.withCredentials = request.withCredentials === undefined ? true : request.withCredentials;
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            // Explicitly setting the Content-Type header for React Native on Android platform.
            xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
            var headers = request.headers;
            if (headers) {
                for (var header in headers) {
                    xhr.setRequestHeader(header, headers[header]);
                }
            }
            if (request.responseType) {
                xhr.responseType = request.responseType;
            }
            if (request.abortSignal) {
                request.abortSignal.onabort = function () {
                    xhr.abort();
                    reject(new Error("AbortError"));
                };
            }
            if (request.timeout) {
                xhr.timeout = request.timeout;
            }
            //      var callback = function (_, isAbort) {
            //          var status, statusText, responses;
            //// Was never called and is aborted or complete
            //          if (callback && (isAbort || xhr.readyState === 4)) {
            //          }
            //      };

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (request.abortSignal) {
                        request.abortSignal.onabort = null;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({
                            statusCode: xhr.status,
                            statusText: xhr.statusText,
                            content: xhr.response || xhr.responseText
                        });
                    }
                    else {
                        reject(new Error(xhr.statusText, xhr.status));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error(xhr.statusText, xhr.status));
            };
            xhr.ontimeout = function () {
                reject(new Error());
            };
            xhr.send(request.content || "");
        });
    };
    XhrHttpClient.prototype.get = function (url, options) {
        return this.send(signalR.extend({}, options, { method: "GET", url: url }));
    };
    XhrHttpClient.prototype.post = function (url, options) {
        return this.send(signalR.extend({}, options, { method: "POST", url: url }));
    };

    function HandshakeProtocol() { }
    HandshakeProtocol.prototype.writeHandshakeRequest = function (handshakeRequest) {
        return TextMessageFormat.write(JSON.stringify(handshakeRequest));
    };
    HandshakeProtocol.prototype.parseHandshakeResponse = function (data) {
        var responseMessage, messageData, remainingData;
        if (typeof data === "string") {
            var textData = data;
            var separatorIndex = textData.indexOf(RecordSeparator);
            if (separatorIndex === -1) {
                throw new Error("Message is incomplete.");
            }
            // content before separator is handshake response
            // optional content after is additional messages
            var responseLength = separatorIndex + 1;
            messageData = textData.substring(0, responseLength);
            remainingData = textData.length > responseLength ? textData.substring(responseLength) : null;
        }
        var messages = TextMessageFormat.parse(messageData);
        var response = JSON.parse(messages[0]);
        responseMessage = response;
        // multiple messages could have arrived with handshake
        // return additional data to be parsed as usual, or null if all parsed
        return [remainingData, responseMessage];
    };

    function JsonHubProtocol() {
        this.name = JSON_HUB_PROTOCOL_NAME;
        this.version = 1;
        this.transferFormat = TransferFormat.Text;
    }
    JsonHubProtocol.prototype.writeMessage = function (message) {
        return TextMessageFormat.write(JSON.stringify(message));
    };
    JsonHubProtocol.prototype.parseMessages = function (input) {
        if (typeof input !== "string") {
            throw new Error("Invalid input for JSON hub protocol. Expected a string.");
        }
        if (!input) {
            return [];
        }
        // Parse the messages
        var messages = TextMessageFormat.parse(input);
        var hubMessages = [];
        for (var i = 0; i < messages.length; i++) {
            var parsedMessage = JSON.parse(messages[i]);
            if (typeof parsedMessage.type !== "number") {
                throw new Error("Invalid payload.");
            }
            switch (parsedMessage.type) {
                case MessageType.Invocation:
                    this.isInvocationMessage(parsedMessage);
                    break;
                case MessageType.StreamItem:
                    this.isStreamItemMessage(parsedMessage);
                    break;
                case MessageType.Completion:
                    this.isCompletionMessage(parsedMessage);
                    break;
                case MessageType.Ping:
                    // Single value, no need to validate
                    break;
                case MessageType.Close:
                    // All optional values, no need to validate
                    break;
                default:
                    // Future protocol changes can add message types, old clients can ignore them
                    continue;
            }
            hubMessages.push(parsedMessage);
        }
        return hubMessages;
    };
    JsonHubProtocol.prototype.isInvocationMessage = function (message) {
        this.assertNotEmptyString(message.target, "Invalid payload for Invocation message.");
        if (message.invocationId !== undefined) {
            this.assertNotEmptyString(message.invocationId, "Invalid payload for Invocation message.");
        }
    };
    JsonHubProtocol.prototype.isStreamItemMessage = function (message) {
        this.assertNotEmptyString(message.invocationId, "Invalid payload for StreamItem message.");
        if (message.item === undefined) {
            throw new Error("Invalid payload for StreamItem message.");
        }
    };
    JsonHubProtocol.prototype.isCompletionMessage = function (message) {
        if (message.result && message.error) {
            throw new Error("Invalid payload for Completion message.");
        }
        if (!message.result && message.error) {
            this.assertNotEmptyString(message.error, "Invalid payload for Completion message.");
        }
        this.assertNotEmptyString(message.invocationId, "Invalid payload for Completion message.");
    };
    JsonHubProtocol.prototype.assertNotEmptyString = function (value, errorMessage) {
        if (typeof value !== "string" || value === "") {
            throw new Error(errorMessage);
        }
    };

    function DefaultReconnectPolicy(retryDelays) {
        this.retryDelays = retryDelays !== undefined ? retryDelays.concat([null]) : DEFAULT_RETRY_DELAYS_IN_MILLISECONDS;
    }
    DefaultReconnectPolicy.prototype.nextRetryDelayInMilliseconds = function (retryContext) {
        return this.retryDelays[retryContext.previousRetryCount];
    };

    function WebSocketTransport(httpClient, accessTokenFactory, logger, logMessageContent, webSocketConstructor, headers) {
        this.logger = logger;
        this.accessTokenFactory = accessTokenFactory;
        this.logMessageContent = logMessageContent;
        this.webSocketConstructor = webSocketConstructor;
        this.httpClient = httpClient;
        this.onreceive = null;
        this.onclose = null;
        this.headers = headers;
    }
    WebSocketTransport.prototype.connect = function (url, transferFormat) {
        var _this = this;
        this.logger.log(LogLevel.Trace, "(WebSockets transport) Connecting.");
        return this.getAccessToken().then(function (token) {
            if (token) {
                url += (url.indexOf("?") < 0 ? "?" : "&") + "access_token=" + encodeURIComponent(token);
            }
            return new Promise(function (resolve, reject) {
                url = url.replace(/^http/, "ws");
                var webSocket = undefined;
                var opened = false;
                if (!webSocket) {
                    // Chrome is not happy with passing 'undefined' as protocol
                    webSocket = new _this.webSocketConstructor(url);
                }
                if (transferFormat === TransferFormat.Binary) {
                    webSocket.binaryType = "arraybuffer";
                }
                // tslint:disable-next-line:variable-name
                webSocket.onopen = function (_event) {
                    _this.logger.log(LogLevel.Information, "WebSocket connected to " + url + ".");
                    _this.webSocket = webSocket;
                    opened = true;
                    resolve();
                };

                webSocket.onerror = function (event) {
                    var error = null;
                    // ErrorEvent is a browser only type we need to check if the type exists before using it
                    if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                        error = event.error;
                    }
                    else {
                        error = new Error("There was an error with the transport.");
                    }
                    reject(error);
                };

                webSocket.onmessage = function (message) {
                    //this.logger.log(LogLevel.Trace, `(WebSockets transport) data received. ${getDataDetail(message.data, this.logMessageContent)}.`);
                    if (_this.onreceive) {
                        try {
                            _this.onreceive(message.data);
                        } catch (error) {
                            _this.close(error);
                            return;
                        }
                    }
                };

                webSocket.onclose = function (event) {
                    // Don't call close handler if connection was never established
                    // We'll reject the connect call instead
                    if (opened) {
                        _this.close(event);
                    }
                    else {
                        var error = null;
                        // ErrorEvent is a browser only type we need to check if the type exists before using it
                        if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
                            error = event.error;
                        }
                        else {
                            error = new Error("There was an error with the transport.");
                        }
                        reject(error);
                    }
                };
            });
        });
    };
    WebSocketTransport.prototype.getAccessToken = function () {
        var token = null;
        if (this.accessTokenFactory) {
            if (signalR.isPromise(_this.accessTokenFactory)) {
                return _this.accessTokenFactory();
            } else {
                if (signalR.isFunction(_this.accessTokenFactory)) {
                    token = _this.accessTokenFactory();
                } else {
                    token = _this.accessTokenFactory;
                }
            }
        }
        return Promise.resolve(token);
    };
    WebSocketTransport.prototype.send = function (data) {
        if (this.webSocket && this.webSocket.readyState === this.webSocketConstructor.OPEN) {
            this.logger.log(LogLevel.Trace, "(WebSockets transport) sending data. " + getDataDetail(data, this.logMessageContent) + ".");
            this.webSocket.send(data);
            return Promise.resolve();
        }
        return Promise.reject("WebSocket is not in the OPEN state");
    };
    WebSocketTransport.prototype.stop = function () {
        if (this.webSocket) {
            // Manually invoke onclose callback inline so we know the HttpConnection was closed properly before returning
            // This also solves an issue where websocket.onclose could take 18+ seconds to trigger during network disconnects
            this.close(undefined);
        }
        return Promise.resolve();
    };
    WebSocketTransport.prototype.close = function (event) {
        // webSocket will be null if the transport did not start successfully
        if (this.webSocket) {
            // Clear websocket handlers because we are considering the socket closed now
            this.webSocket.onclose = function () { };
            this.webSocket.onmessage = function () { };
            this.webSocket.onerror = function () { };
            this.webSocket.close();
            this.webSocket = undefined;
        }
        this.logger.log(LogLevel.Trace, "(WebSockets transport) socket closed.");
        if (this.onclose) {
            if (this.isCloseEvent(event) && (event.wasClean === false || event.code !== 1000)) {
                this.onclose(new Error("WebSocket closed with status code: " + event.code + " (" + event.reason + ")."));
            }
            else if (event instanceof Error) {
                this.onclose(event);
            }
            else {
                this.onclose();
            }
        }
    };
    WebSocketTransport.prototype.isCloseEvent = function (event) {
        return event && typeof event.wasClean === "boolean" && typeof event.code === "number";
    };

    function LongPollingTransport(httpClient, accessTokenFactory, logger, withCredentials, headers) {
        this.httpClient = httpClient;
        this.logger = logger;
        this.accessTokenFactory = accessTokenFactory;
        this.pollAbort = new AbortController();
        this.withCredentials = withCredentials;
        this.headers = headers;
        this.running = false;
        this.onreceive = null;
        this.onclose = null;
    }
    LongPollingTransport.prototype.connect = function (url, transferFormat) {
        var _this = this;
        this.url = url;
        this.logger.log(LogLevel.Trace, "(LongPolling transport) Connecting.");
        // Allow binary format on Node and Browsers that support binary content (indicated by the presence of responseType property)
        if (transferFormat === TransferFormat.Binary &&
            (typeof XMLHttpRequest !== "undefined" && typeof new XMLHttpRequest().responseType !== "string")) {
            throw new Error("Binary protocols over XmlHttpRequest not implementing advanced features are not supported.");
        }
        var headers = this.headers;
        var pollOptions = {
            abortSignal: this.pollAbort.signal(),
            headers: headers,
            timeout: 100000,
            withCredentials: this.withCredentials
        };
        if (transferFormat === TransferFormat.Binary) {
            pollOptions.responseType = "arraybuffer";
        }
        return this.getAccessToken().then(function (token) {
            _this.updateHeaderToken(pollOptions, token);
            return Promise.resolve(pollOptions);
        }).then(function (pollOptions) {
            var pollUrl = url + "&_=" + Date.now();
            _this.logger.log(LogLevel.Trace, "(LongPolling transport) polling: " + pollUrl + ".");
            return _this.httpClient.get(pollUrl, pollOptions).then(function (response) {
                if (response.statusCode !== 200) {
                    _this.logger.log(LogLevel.Error, "(LongPolling transport) Unexpected response code: " + response.statusCode + ".");
                    //_this.closeError = new HttpError(response.statusText || "", response.statusCode);
                    _this.running = false;
                } else {
                    _this.running = true;
                }
                _this.receiving = _this.poll(_this.url, pollOptions);
            });
        });
    };
    LongPollingTransport.prototype.poll = function (url, pollOptions) {
        var _this = this;
        if (this.running) {
            return this.getAccessToken().then(function (token) {
                _this.updateHeaderToken(pollOptions, token);
                return Promise.resolve(pollOptions);
            }).then(function (pollOptions) {
                var pollUrl = url + "&_=" + Date.now();
                _this.logger.log(LogLevel.Trace, "(LongPolling transport) polling: " + pollUrl + ".");
                return _this.httpClient.get(pollUrl, pollOptions).then(function (response) {
                    if (response.statusCode === 204) {
                        _this.logger.log(LogLevel.Information, "(LongPolling transport) Poll terminated by server.");
                        _this.running = false;
                    } else if (response.statusCode !== 200) {
                        _this.logger.log(LogLevel.Error, "(LongPolling transport) Unexpected response code: " + response.statusCode + ".");
                        _this.running = false;
                    } else {
                        if (response.content) {
                            _this.logger.log(LogLevel.Trace, "(LongPolling transport) data received. " + response.content + ".");
                            if (_this.onreceive) {
                                _this.onreceive(response.content);
                            }
                        } else {
                            _this.logger.log(LogLevel.Trace, "(LongPolling transport) Poll timed out, reissuing.");
                        }
                        _this.poll(url, pollOptions);
                    }
                }, function (e) {
                    if (!_this.running) {
                        _this.logger.log(LogLevel.Trace, "(LongPolling transport) Poll errored after shutdown: " + e.message);
                    } else {
                        _this.closeError = e;
                        _this.running = false;
                    }
                });
            });
        } else {
            return Promise.resolve();
        }
    };
    LongPollingTransport.prototype.getAccessToken = function () {
        var token = null;
        if (this.accessTokenFactory) {
            if (signalR.isPromise(_this.accessTokenFactory)) {
                return _this.accessTokenFactory();
            } else {
                if (signalR.isFunction(_this.accessTokenFactory)) {
                    token = _this.accessTokenFactory();
                } else {
                    token = _this.accessTokenFactory;
                }
            }
        }
        return Promise.resolve(token);
    };
    LongPollingTransport.prototype.updateHeaderToken = function (request, token) {
        if (!request.headers) {
            request.headers = {};
        }
        if (token) {
            // tslint:disable-next-line:no-string-literal
            request.headers["Authorization"] = "Bearer " + token;
            return;
        }
        // tslint:disable-next-line:no-string-literal
        if (request.headers["Authorization"]) {
            // tslint:disable-next-line:no-string-literal
            delete request.headers["Authorization"];
        }
    };
    LongPollingTransport.prototype.send = function (data) {
        if (!this.running) {
            return Promise.reject(new Error("Cannot send until the transport is connected"));
        }
        var _this = this;
        var headers = this.headers;
        return this.getAccessToken().then(function (token) {
            if (token) {
                headers = signalR.extend({
                    Authorization: 'Bearer ' + token
                });
            }
            return Promise.resolve(headers);
        }).then(function (headers) {
            return _this.httpClient.post(_this.url, {
                content: data,
                headers: headers,
                responseType: "",
                withCredentials: _this.withCredentials
            });
        });
    };
    LongPollingTransport.prototype.stop = function () {
        // Tell receiving loop to stop, abort any current request, and then wait for it to finish
        this.running = false;
        this.pollAbort.abort();
        var _this = this;
        var headers = this.headers;
        var deleteOptions = {
            headers: headers,
            withCredentials: this.withCredentials,
            method: "DELETE"
        };
        return this.receiving.then(function () {
            return _this.getAccessToken();
        }).then(function (token) {
            _this.updateHeaderToken(deleteOptions, token);
            return Promise.resolve(deleteOptions);
        }).then(function (deleteOptions) {
            return _this.httpClient.send(_this.url, deleteOptions);
        });
    };


    function PromiseSource() {
        var _this = this;
        this.promise = new Promise(function (resolve, reject) {
            _this.resolver = resolve;
            _this.rejecter = reject;
        });
    }
    PromiseSource.prototype.resolve = function () {
        this.resolver();
    };
    PromiseSource.prototype.reject = function (reason) {
        this.rejecter(reason);
    };

    function TransportSendQueue(transport) {
        this.transport = transport;
        this.buffer = [];
        this.executing = true;
        this.sendBufferedData = new PromiseSource();
        this.transportResult = new PromiseSource();
        this.sendLoopPromise = this.sendLoop();
    }
    TransportSendQueue.prototype.send = function (data) {
        this.bufferData(data);
        if (!this.transportResult) {
            this.transportResult = new PromiseSource();
        }
        return this.transportResult.promise;
    };
    TransportSendQueue.prototype.stop = function () {
        this.executing = false;
        this.sendBufferedData.resolve();
        return this.sendLoopPromise;
    };
    TransportSendQueue.prototype.bufferData = function (data) {
        if (this.buffer.length && typeof (this.buffer[0]) !== typeof (data)) {
            throw new Error("Expected data to be of type " + typeof (this.buffer) + " but was of type " + typeof (data));
        }
        this.buffer.push(data);
        this.sendBufferedData.resolve();
    };
    TransportSendQueue.prototype.sendLoop = function () {
        var _this = this;
        return this.sendBufferedData.promise.then(function () {
            if (!_this.executing) {
                if (_this.transportResult) {
                    _this.transportResult.reject("Connection stopped.");
                }
                return;
            }
            _this.sendBufferedData = new PromiseSource();
            var transportResult = _this.transportResult;
            _this.transportResult = undefined;
            var data = typeof _this.buffer[0] === "string" ?
                _this.buffer.join("") :
                TransportSendQueue.concatBuffers(_this.buffer);
            _this.buffer.length = 0;
            _this.transport.send(data).then(function () {
                transportResult.resolve();
                _this.sendLoop();
            }, function (error) {
                transportResult.reject(error);
                _this.sendLoop();
            });
        });
    };
    TransportSendQueue.concatBuffers = function (arrayBuffers) {
        if (typeof Uint8Array !== "undefined") {
            var totalLength = arrayBuffers.map(function (b) {
                return b.byteLength;
            }).reduce(function (a, b) {
                return a + b;
            });
            var result = new Uint8Array(totalLength);
            var offset = 0;
            for (var _i = 0, arrayBuffers_1 = arrayBuffers; _i < arrayBuffers_1.length; _i++) {
                var item = arrayBuffers_1[_i];
                result.set(new Uint8Array(item), offset);
                offset += item.byteLength;
            }
            return result.buffer;
        }
        throw new Error("Binary are not supported.");
    };

    function HttpConnection(url, options) {
        this.features = {};
        this.logger = createLogger(options.logger);
        this.baseUrl = this.resolveUrl(url);
        this.negotiateVersion = 1;
        options = options || {};
        options.logMessageContent = options.logMessageContent === undefined ? false : options.logMessageContent;
        if (typeof options.withCredentials === "boolean" || options.withCredentials === undefined) {
            options.withCredentials = options.withCredentials === undefined ? true : options.withCredentials;
        }
        else {
            throw new Error("withCredentials option was not a 'boolean' or 'undefined' value");
        }
        if (window.WebSocket) {
            options.WebSocket = window.WebSocket;
        } else if (window.MozWebSocket) {
            options.WebSocket = window.MozWebSocket;
        }

        this.httpClient = new XhrHttpClient();
        this.connectionState = ConnectionState.Disconnected;
        this.connectionStarted = false;
        this.options = options;
        this.onreceive = null;
        this.onclose = null;
    }
    HttpConnection.prototype.send = function (data) {
        if (this.connectionState !== ConnectionState.Connected) {
            return Promise.reject(new Error("Cannot send data if the connection is not in the 'Connected' State."));
        }
        if (!this.sendQueue) {
            this.sendQueue = new TransportSendQueue(this.transport);
        }
        return this.sendQueue.send(data);
    };
    HttpConnection.prototype.createTransport = function (url, requestedTransport, negotiateResponse, requestedTransferFormat) {
        var _this = this;
        var connectUrl = this.createConnectUrl(url, negotiateResponse.connectionToken);
        //自定义requestedTransport
        if (this.isITransport(requestedTransport)) {
            this.transport = requestedTransport;
            return this.startTransport(connectUrl, requestedTransferFormat).then(function () {
                _this.connectionId = negotiateResponse.connectionId;
            });
        }
        var transportExceptions = [];
        var transports = negotiateResponse.availableTransports || [];
        var negotiate = negotiateResponse;
        var transportOrError = undefined;
        var transport = undefined;
        for (var i = 0; i < transports.length; i++) {
            var endpoint = transports[i];
            transportOrError = this.resolveTransportOrError(endpoint, requestedTransport, requestedTransferFormat);
            if (transportOrError instanceof Error) {
                // Store the error and continue, we don't want to cause a re-negotiate in these cases
                transportExceptions.push(endpoint.transport + " failed: " + transportOrError);
            } else {
                if (this.isITransport(transportOrError)) {
                    transport = transportOrError;
                    break;
                }
            }
        }
        if (transport) {
            this.transport = transport;
            return new Promise(function (resolve, reject) {
                if (!negotiate) {
                    _this.getNegotiationResponse(url).then(function (resp) {
                        negotiate = resp;
                        connectUrl = _this.createConnectUrl(url, negotiate.connectionToken);
                        resolve(connectUrl);
                    }, function (e) {
                        reject(e);
                    });
                } else {
                    resolve(connectUrl);
                }
            }).then(function (_connectUrl) {
                return _this.startTransport(_connectUrl, requestedTransferFormat).then(function () {
                    _this.connectionId = negotiate.connectionId;
                }, function (ex) {
                    negotiate = undefined;
                    //transportExceptions.push(endpoint.transport + " failed: " + ex);
                    if (_this.connectionState !== ConnectionState.Connecting) {
                        message = "Failed to select transport before stop() was called.";
                        _this.logger.log(LogLevel.Debug, message);
                        return Promise.reject(new Error(message));
                    }
                });
            });
        }
        if (transportExceptions.length > 0) {
            return Promise.reject(new Error("Unable to connect to the server with any of the available transports. " + transportExceptions.join(" ")));
        }
        return Promise.reject(new Error("None of the transports supported by the client are supported by the server."));
    };
    HttpConnection.prototype.constructTransport = function (transport) {
        switch (transport) {
            case HttpTransportType.WebSockets:
                if (!this.options.WebSocket) {
                    throw new Error("'WebSocket' is not supported in your environment.");
                }
                return new WebSocketTransport(this.httpClient, this.accessTokenFactory, this.logger, this.options.logMessageContent || false, this.options.WebSocket, this.options.headers || {});
            //case HttpTransportType.ServerSentEvents:
            //    if (!this.options.EventSource) {
            //        throw new Error("'EventSource' is not supported in your environment.");
            //    }
            //return new _ServerSentEventsTransport__WEBPACK_IMPORTED_MODULE_4__["ServerSentEventsTransport"](this.httpClient, this.accessTokenFactory, this.logger, this.options.logMessageContent || false, this.options.EventSource, this.options.withCredentials, this.options.headers || {});
            case HttpTransportType.LongPolling:
                return new LongPollingTransport(this.httpClient, this.accessTokenFactory, this.logger, this.options.logMessageContent || false, this.options.withCredentials, this.options.headers || {});
            default:
                throw new Error("Unknown transport: " + transport + ".");
        }
    };
    function transportMatches(requestedTransport, actualTransport) {
        return !requestedTransport || (actualTransport & requestedTransport) !== 0;
    }
    HttpConnection.prototype.resolveTransportOrError = function (endpoint, requestedTransport, requestedTransferFormat) {
        var transport = HttpTransportType[endpoint.transport];
        if (transport === null || transport === undefined) {
            return new Error("Skipping transport '" + endpoint.transport + "' because it is not supported by this client.");
        } else {
            if (transportMatches(requestedTransport, transport)) {
                var transferFormats = [];
                for (var i = 0; i < endpoint.transferFormats.length; i++) {
                    transferFormats.push(TransferFormat[endpoint.transferFormats[i]]);
                }
                if (transferFormats.indexOf(requestedTransferFormat) >= 0) {
                    if ((transport === HttpTransportType.WebSockets && !this.options.WebSocket) ||
                        (transport === HttpTransportType.ServerSentEvents && !this.options.EventSource)) {
                        this.logger.log(LogLevel.Debug, "Skipping transport '" + endpoint.transport + "' because it is not supported in your environment.'");
                        return new Error("'" + endpoint.transport + "' is not supported in your environment.");
                    }
                    else {
                        this.logger.log(LogLevel.Debug, "Selecting transport '" + endpoint.transport + "'.");
                        try {
                            return this.constructTransport(transport);
                        }
                        catch (ex) {
                            return ex;
                        }
                    }
                } else {
                    this.logger.log(LogLevel.Debug, "Skipping transport '" + endpoint.transport + "' because it does not support the requested transfer format '" + _ITransport__WEBPACK_IMPORTED_MODULE_2__["TransferFormat"][requestedTransferFormat] + "'.");
                }
            } else {
                this.logger.log(LogLevel.Debug, "Skipping transport '" + endpoint.transport + "' because it was disabled by the client.");
                return new Error("HttpTransportType " + endpoint.transport + " is disabled by the client.");
            }
        }
    };
    HttpConnection.prototype.startTransport = function (url, transferFormat) {
        var _this = this;
        this.transport.onreceive = this.onreceive;
        this.transport.onclose = function (e) { return _this.stopConnection(e); };
        return this.transport.connect(url, transferFormat);
    };
    HttpConnection.prototype.getNegotiationResponse = function (url) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var headers = {};
            if (_this.accessTokenFactory) {
                var token;
                if (signalR.isPromise(_this.accessTokenFactory)) {
                    return _this.accessTokenFactory().then(function (t) {
                        token = t;
                        if (token) {
                            headers['Authorization'] = 'Bearer ' + token;
                        }
                        return resolve(headers);
                    });
                } else {
                    if (signalR.isFunction(_this.accessTokenFactory)) {
                        token = _this.accessTokenFactory();
                    } else {
                        token = _this.accessTokenFactory;
                    }
                    if (token) {
                        headers['Authorization'] = 'Bearer ' + token;
                    }
                    return resolve(headers);
                }
            } else {
                return resolve(headers);
            }
        }).then(function (headers) {
            var negotiateUrl = _this.resolveNegotiateUrl(url);

            var httpHeaders = signalR.extend(headers, _this.options.headers);
            return _this.httpClient.post(negotiateUrl, {
                content: "",
                headers: httpHeaders,
                withCredentials: _this.options.withCredentials
            });
        }).then(function (response) {
            if (response.statusCode !== 200) {
                return Promise.reject(new Error("Unexpected status code returned from negotiate '" + response.statusCode + "'"));
            }
            var negotiateResponse = JSON.parse(response.content);
            if (!negotiateResponse.negotiateVersion || negotiateResponse.negotiateVersion < 1) {
                // Negotiate version 0 doesn't use connectionToken
                // So we set it equal to connectionId so all our logic can use connectionToken without being aware of the negotiate version
                negotiateResponse.connectionToken = negotiateResponse.connectionId;
            }
            return Promise.resolve(negotiateResponse);
        })["catch"](function (e) {
            _this.logger.log(LogLevel.Error, "Failed to complete negotiation with the server: " + e);
            return Promise.reject(e);
        });
    };
    HttpConnection.prototype.isITransport = function (transport) {
        return transport && typeof transport === "object" && "connect" in transport;
    };
    HttpConnection.prototype.createConnectUrl = function (url, connectionToken) {
        if (!connectionToken) {
            return url;
        }
        return url + (url.indexOf("?") === -1 ? "?" : "&") + 'id=' + connectionToken;
    };
    HttpConnection.prototype.resolveUrl = function (url) {
        if (url.lastIndexOf("https://", 0) === 0 || url.lastIndexOf("http://", 0) === 0) {
            return url;
        }
        if (!window.document) {
            throw new Error('Cannot resolve ' + url + '.');
        }
        var aTag = window.document.createElement("a");
        aTag.href = url;
        return aTag.href;
    };
    HttpConnection.prototype.resolveNegotiateUrl = function (url) {
        var index = url.indexOf("?");
        var negotiateUrl = url.substring(0, index === -1 ? url.length : index);
        if (negotiateUrl[negotiateUrl.length - 1] !== "/") {
            negotiateUrl += "/";
        }
        negotiateUrl += "negotiate";
        negotiateUrl += index === -1 ? "" : url.substring(index);
        if (negotiateUrl.indexOf("negotiateVersion") === -1) {
            negotiateUrl += index === -1 ? "?" : "&";
            negotiateUrl += "negotiateVersion=" + this.negotiateVersion;
        }
        return negotiateUrl;
    };
    HttpConnection.prototype.start = function (transferFormat) {
        var _this = this;
        var url = this.baseUrl;
        transferFormat = transferFormat || TransferFormat.Text;
        if (this.connectionState !== ConnectionState.Disconnected) {
            return Promise.reject(new Error("Cannot start an HttpConnection that is not in the 'Disconnected' state."));
        }
        this.connectionState = ConnectionState.Connecting;
        this.startInternalPromise = this.startInternal(transferFormat);
        return this.startInternalPromise.then(function () {
            var message;
            if (_this.connectionState === ConnectionState.Disconnecting) {
                message = "Failed to start the HttpConnection before stop() was called.";
                _this.logger.log(LogLevel.Error, message);
                return _this.stopPromise.then(function () {
                    return Promise.reject(new Error(message));
                });
            } else if (_this.connectionState !== ConnectionState.Connected) {
                message = "HttpConnection.startInternal completed gracefully but didn't enter the connection into the connected state!";
                _this.logger.log(LogLevel.Error, message);
                return Promise.reject(new Error(message));
            }
            _this.connectionStarted = true;
        });
    };
    HttpConnection.prototype.startInternal = function (transferFormat) {
        var _this = this;
        var url = this.baseUrl;
        this.accessTokenFactory = this.options.accessTokenFactory;
        var redirects = 0;
        try {
            if (this.options.skipNegotiation) {
                if (this.options.transport === HttpTransportType.WebSockets) {
                    // No need to add a connection ID in this case
                    //this.transport = this.constructTransport(HttpTransportType.WebSockets);
                    // We should just call connect directly in this case.
                    // No fallback or negotiate in this case.
                    //await this.startTransport(url, transferFormat);
                } else {
                    throw new Error("Negotiation can only be skipped when using the WebSocket transport directly.");
                }
            } else {
                var negotiateResponse = undefined;
                var callback = function (resp, _redirects) {
                    if (!resp || (resp && resp.url && _redirects < MAX_REDIRECTS)) {
                        return _this.getNegotiationResponse(url).then(function (response) {
                            negotiateResponse = response;
                            // the user tries to stop the connection when it is being started
                            if (_this.connectionState === ConnectionState.Disconnecting || _this.connectionState === ConnectionState.Disconnected) {
                                throw new Error("The connection was stopped during negotiation.");
                            }
                            if (negotiateResponse.error) {
                                throw new Error(negotiateResponse.error);
                            }
                            if (negotiateResponse.ProtocolVersion) {
                                throw new Error("Detected a connection attempt to an ASP.NET SignalR Server. This client only supports connecting to an ASP.NET Core SignalR Server. See https://aka.ms/signalr-core-differences for details.");
                            }
                            if (negotiateResponse.url) {
                                url = negotiateResponse.url;
                            }
                            if (negotiateResponse.accessToken) {
                                // Replace the current access token factory with one that uses
                                // the returned access token
                                var accessToken = negotiateResponse.accessToken;
                                _this.accessTokenFactory = function () {
                                    return accessToken;
                                };
                            }
                            redirects++;
                            return callback(response, redirects);
                        });
                    }
                    return Promise.resolve(resp);
                };
                return callback(negotiateResponse, redirects).then(function () {
                    return _this.createTransport(url, _this.options.transport, negotiateResponse, transferFormat).then(function () {
                        if (_this.transport instanceof LongPollingTransport) {
                            _this.features.inherentKeepAlive = true;
                        }
                        if (_this.connectionState === ConnectionState.Connecting) {
                            _this.logger.log(LogLevel.Debug, "The HttpConnection connected successfully.");
                            _this.connectionState = ConnectionState.Connected;
                        }
                    });
                });
            }
        } catch (e) {
            this.logger.log(LogLevel.Error, "Failed to start the connection: " + e);
            this.connectionState = ConnectionState.Disconnected;
            this.transport = undefined;
            return Promise.reject(e);
        }



    };
    HttpConnection.prototype.stop = function (error) {
        var _this = this;
        if (this.connectionState === ConnectionState.Disconnected) {
            this.logger.log(LogLevel.Debug, "Call to HttpConnection.stop(" + error + ") ignored because the connection is already in the disconnected state.");
            return Promise.resolve();
        }

        if (this.connectionState === ConnectionState.Disconnecting) {
            this.logger.log(LogLevel.Debug, "Call to HttpConnection.stop(" + error + ") ignored because the connection is already in the disconnected state.");
            return this.stopPromise;
        }

        this.connectionState = ConnectionState.Disconnecting;

        this.stopPromise = new Promise(function (resolve) {
            // Don't complete stop() until stopConnection() completes.
            _this.stopPromiseResolver = resolve;
        });
        return this.stopInternal(error).then(function () {
            return _this.stopPromise;
        });
    };
    HttpConnection.prototype.stopInternal = function (error) {
        var _this = this;
        this.stopError = error;
        return this.startInternalPromise.then(function () {
        }, function () {
        }).then(function () {
            if (_this.transport) {
                return _this.transport.stop().then(function () {
                    _this.transport = undefined;
                }, function (e) {
                    _this.logger.log(LogLevel.Error, "HttpConnection.transport.stop() threw error '" + e + "'.");
                    _this.stopConnection();
                    _this.transport = undefined;
                });
            } else {
                _this.logger.log(LogLevel.Debug, "HttpConnection.transport is undefined in HttpConnection.stop() because start() failed.");
                _this.stopConnection();
            }
        });

    };
    HttpConnection.prototype.stopConnection = function (error) {
        var _this = this;
        this.transport = undefined;
        // If we have a stopError, it takes precedence over the error from the transport
        error = this.stopError || error;
        this.stopError = undefined;
        if (this.connectionState === ConnectionState.Disconnected) {
            this.logger.log(LogLevel.Debug, "Call to HttpConnection.stopConnection(" + error + ") was ignored because the connection is already in the disconnected state.");
            return;
        }

        if (this.connectionState === ConnectionState.Connecting) {
            this.logger.log(LogLevel.Warning, "Call to HttpConnection.stopConnection(" + error + ") was ignored because the connection is still in the connecting state.");
            throw new Error("HttpConnection.stopConnection(" + error + ") was called while the connection is still in the connecting state.");
        }

        if (this.connectionState === ConnectionState.Disconnecting) {
            // A call to stop() induced this call to stopConnection and needs to be completed.
            // Any stop() awaiters will be scheduled to continue after the onclose callback fires.
            this.stopPromiseResolver();
        }
        if (error) {
            this.logger.log(LogLevel.Error, "Connection disconnected with error '" + error + "'.");
        }
        else {
            this.logger.log(LogLevel.Information, "Connection disconnected.");
        }
        if (this.sendQueue) {
            this.sendQueue.stop()["catch"](function (e) {
                _this.logger.log(LogLevel.Error, "TransportSendQueue.stop() threw error '" + e + "'.");
            });
            this.sendQueue = undefined;
        }

        this.connectionId = undefined;
        this.connectionState = ConnectionState.Disconnected;

        if (this.connectionStarted) {
            this.connectionStarted = false;
            try {
                if (this.onclose) {
                    this.onclose(error);
                }
            } catch (e) {
                this.logger.log(LogLevel.Error, "HttpConnection.onclose(" + error + ") threw error '" + e + "'.");
            }
        }
    };

    function HubConnection(connection, logger, protocol, reconnectPolicy) {
        var _this = this;
        this.serverTimeoutInMilliseconds = DEFAULT_TIMEOUT_IN_MS;
        this.keepAliveIntervalInMilliseconds = DEFAULT_PING_INTERVAL_IN_MS;
        this.protocol = protocol;
        this.connection = connection;
        this.logger = logger;
        this.connection.onreceive = function (data) {
            _this.processIncomingData(data);
        };
        this.connection.onclose = function (error) {
            _this.connectionClosed(error);
        };
        this.reconnectPolicy = reconnectPolicy;
        this.handshakeProtocol = new HandshakeProtocol();

        this.callbacks = {};
        this.methods = {};
        this.closedCallbacks = [];
        this.reconnectingCallbacks = [];
        this.reconnectedCallbacks = [];
        this.invocationId = 0;
        this.receivedHandshakeResponse = false;
        this.connectionState = HubConnectionState.Disconnected;
        this.connectionStarted = false;

        this.cachedPingMessage = this.protocol.writeMessage({ type: MessageType.Ping });

    }
    HubConnection.create = function (connection, logger, protocol, reconnectPolicy) {
        return new HubConnection(connection, logger, protocol, reconnectPolicy);
    };
    HubConnection.prototype.getNextRetryDelay = function (previousRetryCount, elapsedMilliseconds, retryReason) {
        try {
            return this.reconnectPolicy.nextRetryDelayInMilliseconds({
                elapsedMilliseconds: elapsedMilliseconds,
                previousRetryCount: previousRetryCount,
                retryReason: retryReason
            });
        }
        catch (e) {
            return null;
        }
    };
    signalR.extend(HubConnection.prototype = {
        start: function () {
            this.startPromise = this.startWithStateTransitions();
            return this.startPromise;
        },
        startWithStateTransitions: function () {
            var _this = this;
            if (this.connectionState !== HubConnectionState.Disconnected) {
                return Promise.reject(new Error("Cannot start a HubConnection that is not in the 'Disconnected' state."));
            }
            this.connectionState = HubConnectionState.Connecting;
            this.logger.log(LogLevel.Debug, "Starting HubConnection.");

            return this.startInternal().then(function () {
                _this.connectionState = HubConnectionState.Connected;
                _this.connectionStarted = true;
                _this.logger.log(LogLevel.Debug, "HubConnection connected successfully.");
            }, function (e) {
                _this.connectionState = HubConnectionState.Disconnected;
                return Promise.reject(e);
            });
        },
        startInternal: function () {
            var _this = this;
            this.stopDuringStartError = undefined;
            this.receivedHandshakeResponse = false;
            var handshakePromise = new Promise(function (resolve, reject) {
                _this.handshakeResolver = resolve;
                _this.handshakeRejecter = reject;
            });
            return this.connection.start(this.protocol.transferFormat).then(function () {
                var handshakeRequest = {
                    protocol: _this.protocol.name,
                    version: _this.protocol.version
                };
                _this.logger.log(LogLevel.Debug, "Sending handshake request.");
                return _this.sendMessage(_this.handshakeProtocol.writeHandshakeRequest(handshakeRequest)).then(function () {
                    _this.logger.log(LogLevel.Information, "Using HubProtocol '" + _this.protocol.name + "'.");
                    _this.cleanupTimeout();
                    _this.resetTimeoutPeriod();
                    _this.resetKeepAliveInterval();
                    return handshakePromise;
                    //_this.connectionState = HubConnectionState.Connected;
                    //_this.connectionStarted = true;
                }).then(function () {
                    // It's important to check the stopDuringStartError instead of just relying on the handshakePromise
                    // being rejected on close, because this continuation can run after both the handshake completed successfully
                    // and the connection was closed.
                    if (_this.stopDuringStartError) {
                        // It's important to throw instead of returning a rejected promise, because we don't want to allow any state
                        // transitions to occur between now and the calling code observing the exceptions. Returning a rejected promise
                        // will cause the calling continuation to get scheduled to run later.
                        throw _this.stopDuringStartError;
                    }
                })["catch"](function (e) {
                    _this.logger.log(LogLevel.Debug, "Hub handshake failed with error '" + e + "' during start(). Stopping HubConnection.");

                    _this.cleanupTimeout();
                    _this.cleanupPingTimer();

                    // HttpConnection.stop() should not complete until after the onclose callback is invoked.
                    // This will transition the HubConnection to the disconnected state before HttpConnection.stop() completes.
                    _this.connection.stop(e);
                    throw e;
                });
            })["catch"](function (e) {
                _this.logger.log(LogLevel.Warning, e);
            });
        },
        stop: function () {
            var _this = this;
            var startPromise = this.startPromise;
            this.stopPromise = this.stopInternal();
            return this.stopPromise.then(function () {
                return startPromise.then(function () { }, function (e) {
                    log(e);
                });
            });
        },
        stopInternal: function (error) {
            if (this.connectionState === HubConnectionState.Disconnected) {
                this.logger.log(LogLevel.Debug, "Call to HubConnection.stop(" + error + ") ignored because it is already in the disconnected state.");
                return Promise.resolve();
            }
            if (this.connectionState === HubConnectionState.Disconnecting) {
                this.logger.log(LogLevel.Debug, "Call to HttpConnection.stop(" + error + ") ignored because the connection is already in the disconnecting state.");
                return this.stopPromise;
            }
            this.connectionState = HubConnectionState.Disconnecting;
            this.logger.log(LogLevel.Debug, "Stopping HubConnection.");
            if (this.reconnectDelayHandle) {
                // We're in a reconnect delay which means the underlying connection is currently already stopped.
                // Just clear the handle to stop the reconnect loop (which no one is waiting on thankfully) and
                // fire the onclose callbacks.
                this.logger.log(LogLevel.Debug, "Connection stopped during reconnect delay. Done reconnecting.");
                clearTimeout(this.reconnectDelayHandle);
                this.reconnectDelayHandle = undefined;
                this.completeClose();
                return Promise.resolve();
            }
            this.cleanupTimeout();
            this.cleanupPingTimer();
            this.stopDuringStartError = error || new Error("The connection was stopped before the hub handshake could complete.");
            // HttpConnection.stop() should not complete until after either HttpConnection.start() fails
            // or the onclose callback is invoked. The onclose callback will transition the HubConnection
            // to the disconnected state if need be before HttpConnection.stop() completes.
            return this.connection.stop(error);
        },

        send: function (methodName) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var streamData = this.replaceStreamingParams(args);
            var streams = streamData[0], streamIds = streamData[1];
            var sendPromise = this.sendWithProtocol(this.createInvocation(methodName, args, true, streamIds));

            this.launchStreams(streams, sendPromise);

            return sendPromise;
        },
        invoke: function (methodName) {
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var _a = this.replaceStreamingParams(args), streams = _a[0], streamIds = _a[1];
            var invocationDescriptor = this.createInvocation(methodName, args, false, streamIds);
            return new Promise(function (resolve, reject) {
                // invocationId will always have a value for a non-blocking invocation
                _this.callbacks[invocationDescriptor.invocationId] = function (invocationEvent, error) {
                    if (error) {
                        reject(error);
                        return;
                    } else if (invocationEvent) {
                        // invocationEvent will not be null when an error is not passed to the callback
                        if (invocationEvent.type === MessageType.Completion) {
                            if (invocationEvent.error) {
                                reject(new Error(invocationEvent.error));
                            } else {
                                resolve(invocationEvent.result);
                            }
                        } else {
                            reject(new Error("Unexpected message type: " + invocationEvent.type));
                        }
                    }
                };
                var promiseQueue = _this.sendWithProtocol(invocationDescriptor)
                ["catch"](function (e) {
                    reject(e);
                    // invocationId will always have a value for a non-blocking invocation
                    delete _this.callbacks[invocationDescriptor.invocationId];
                });
                _this.launchStreams(streams, promiseQueue);
            });
        },
        sendMessage: function (message) {
            this.resetKeepAliveInterval();
            return this.connection.send(message);
        },
        sendWithProtocol: function (message) {
            return this.sendMessage(this.protocol.writeMessage(message));
        },
        replaceStreamingParams: function (args) {
            var streams = [];
            var streamIds = [];
            for (var i = 0; i < args.length; i++) {
                var argument = args[i];
                if (this.isObservable(argument)) {
                    var streamId = this.invocationId;
                    this.invocationId++;
                    // Store the stream for later use
                    streams[streamId] = argument;
                    streamIds.push(streamId.toString());

                    // remove stream from args
                    args.splice(i, 1);
                }
            }
            return [streams, streamIds];
        },
        isObservable: function (arg) {
            return arg && arg.subscribe && typeof arg.subscribe === "function";
        },
        createInvocation: function (methodName, args, nonblocking, streamIds) {
            if (nonblocking) {
                if (streamIds.length !== 0) {
                    return {
                        arguments: args,
                        streamIds: streamIds,
                        target: methodName,
                        type: MessageType.Invocation
                    };
                } else {
                    return {
                        arguments: args,
                        target: methodName,
                        type: MessageType.Invocation
                    };
                }
            } else {
                var invocationId = this.invocationId;
                this.invocationId++;

                if (streamIds.length !== 0) {
                    return {
                        arguments: args,
                        invocationId: invocationId.toString(),
                        streamIds: streamIds,
                        target: methodName,
                        type: MessageType.Invocation
                    };
                } else {
                    return {
                        arguments: args,
                        invocationId: invocationId.toString(),
                        target: methodName,
                        type: MessageType.Invocation
                    };
                }
            }
        },
        launchStreams: function (streams, promiseQueue) {
            var _this = this;
            if (streams.length === 0) {
                return;
            }

            // Synchronize stream data so they arrive in-order on the server
            if (!promiseQueue) {
                promiseQueue = Promise.resolve();
            }
            var loopStream = function (streamId) {
                streams[streamId].subscribe({
                    complete: function () {
                        promiseQueue = promiseQueue.then(function () { return _this.sendWithProtocol(_this.createCompletionMessage(streamId)); });
                    },
                    error: function (err) {
                        var message;
                        if (err instanceof Error) {
                            message = err.message;
                        }
                        else if (err && err.toString) {
                            message = err.toString();
                        }
                        else {
                            message = "Unknown error";
                        }
                        promiseQueue = promiseQueue.then(function () { return _this.sendWithProtocol(_this.createCompletionMessage(streamId, message)); });
                    },
                    next: function (item) {
                        promiseQueue = promiseQueue.then(function () { return _this.sendWithProtocol(_this.createStreamItemMessage(streamId, item)); });
                    }
                });
            };
            // We want to iterate over the keys, since the keys are the stream ids
            // tslint:disable-next-line:forin
            for (var streamId in streams) {
                loopStream(streamId);
            }
        },
        createStreamItemMessage: function (id, item) {
            return {
                invocationId: id,
                item: item,
                type: MessageType.StreamItem
            };
        },
        createCompletionMessage: function (id, error, result) {
            if (error) {
                return {
                    error: error,
                    invocationId: id,
                    type: MessageType.Completion
                };
            }
            return {
                invocationId: id,
                result: result,
                type: MessageType.Completion
            };
        },
        processIncomingData: function (data) {
            this.cleanupTimeout();
            if (!this.receivedHandshakeResponse) {
                data = this.processHandshakeResponse(data);
                this.receivedHandshakeResponse = true;
            }
            if (data) {
                var messages = this.protocol.parseMessages(data);
                for (var i = 0; i < messages.length; i++) {
                    var message = messages[i];
                    switch (message.type) {
                        case MessageType.Invocation:
                            this.invokeClientMethod(message);
                            break;
                        case MessageType.StreamItem:
                        case MessageType.Completion:
                            var callback = this.callbacks[message.invocationId];
                            if (callback) {
                                if (message.type === MessageType.Completion) {
                                    delete this.callbacks[message.invocationId];
                                }
                                callback(message);
                            }
                            break;
                        case MessageType.Ping:
                            // Don't care about pings
                            break;
                        case MessageType.Close:
                            this.logger.log(LogLevel.Information, "Close message received from server.");

                            var error = message.error ? new Error("Server returned an error on close: " + message.error) : undefined;

                            if (message.allowReconnect === true) {
                                // It feels wrong not to await connection.stop() here, but processIncomingData is called as part of an onreceive callback which is not async,
                                // this is already the behavior for serverTimeout(), and HttpConnection.Stop() should catch and log all possible exceptions.

                                // tslint:disable-next-line:no-floating-promises
                                this.connection.stop(error);
                            } else {
                                // We cannot await stopInternal() here, but subsequent calls to stop() will await this if stopInternal() is still ongoing.
                                this.stopPromise = this.stopInternal(error);
                            }

                            break;
                        default:
                            this.logger.log(LogLevel.Warning, "Invalid message type: " + message.type + ".");
                            break;
                    }
                }
            }
            this.resetTimeoutPeriod();
        },
        processHandshakeResponse: function (data) {
            var responseMessage, remainingData;
            try {
                var resp = this.handshakeProtocol.parseHandshakeResponse(data);

                remainingData = resp[0];
                responseMessage = resp[1];
            } catch (e) {
                var message = "Error parsing handshake response: " + e;
                var error = new Error(message);
                this.handshakeRejecter(error);
                throw error;
            }
            if (responseMessage.error) {
                var message2 = "Server returned handshake error: " + responseMessage.error;
                this.logger.log(LogLevel.Error, message2);

                var error2 = new Error(message2);
                this.handshakeRejecter(error2);
                throw error2;
            } else {
                this.logger.log(LogLevel.Debug, "Server handshake complete.");
            }
            this.handshakeResolver();
            return remainingData;
        },
        connectionClosed: function (error) {
            // Triggering this.handshakeRejecter is insufficient because it could already be resolved without the continuation having run yet.
            this.stopDuringStartError = this.stopDuringStartError || error || new Error("The underlying connection was closed before the hub handshake could complete.");

            // If the handshake is in progress, start will be waiting for the handshake promise, so we complete it.
            // If it has already completed, this should just noop.
            if (this.handshakeResolver) {
                this.handshakeResolver();
            }

            this.cancelCallbacksWithError(error || new Error("Invocation canceled due to the underlying connection being closed."));

            this.cleanupTimeout();
            this.cleanupPingTimer();
            console.log(this.connectionState, "this.connectionStatethis.connectionStatethis.connectionState")
            if (this.connectionState === HubConnectionState.Disconnecting) {
                this.completeClose(error);
            } else if (this.connectionState === HubConnectionState.Connected && this.reconnectPolicy) {
                // tslint:disable-next-line:no-floating-promises
                this.reconnect(error);
            } else if (this.connectionState === HubConnectionState.Connected) {
                this.completeClose(error);
            }
        },
        completeClose: function (error) {
            if (this.connectionStarted) {
                this.connectionState = HubConnectionState.Disconnected;
                this.connectionStarted = false;
                try {
                    for (var i = 0; i < this.closedCallbacks.length; i++) {
                        this.closedCallbacks[i].apply(this, [error]);
                    }
                } catch (e) {
                    this.logger.log(LogLevel.Information, 'An onclose callback called with error ' + error + ' threw error ' + e);
                }
            }
        },
        reconnect: function (error) {
            var _this = this;
            var reconnectStartTime = Date.now();
            var previousReconnectAttempts = 0;
            var retryError = error !== undefined ? error : new Error("Attempting to reconnect due to a unknown error.");
            var nextRetryDelay = this.getNextRetryDelay(previousReconnectAttempts++, 0, retryError);
            console.log(nextRetryDelay, "reconnect");
            if (nextRetryDelay === null) {
                this.completeClose(error);
                return;
            }
            this.connectionState = HubConnectionState.Reconnecting;
            if (this.onreconnecting) {
                try {
                    for (var i = 0; i < this.reconnectingCallbacks.length; i++) {
                        this.reconnectingCallbacks[i].apply(this, [error]);
                    }
                } catch (e) {
                    log('An onreconnecting callback called with error ' + error + ' threw error ' + e);
                }
                if (this.connectionState !== HubConnectionState.Reconnecting) {
                    return;
                }
            }
            var attemptReconnect = new Promise(function (resolve) {
                _this.reconnectDelayHandle = window.setTimeout(resolve, nextRetryDelay);
            }).then(function () {
                _this.reconnectDelayHandle = undefined;
                if (_this.connectionState !== HubConnectionState.Reconnecting) {
                    return Promise.resolve();
                } else {
                    return _this.startInternal().then(function () {
                        _this.connectionState = HubConnectionState.Connected;
                        try {
                            for (var i = 0; i < _this.reconnectingCallbacks.length; i++) {
                                _this.reconnectingCallbacks[i].apply(_this, [error]);
                            }
                        } catch (e) {
                            log('An onreconnecting callback called with error ' + error + ' threw error ' + e);
                        }
                    }, function (e) {
                        if (_this.connectionState !== HubConnectionState.Reconnecting) {
                            return;
                        }
                        retryError = e instanceof Error ? e : new Error(e.toString());
                        nextRetryDelay = _this.getNextRetryDelay(previousReconnectAttempts++, Date.now() - reconnectStartTime, retryError);
                        if (nextRetryDelay !== null) {
                            attemptReconnect();
                        }
                    });
                }
            });
            if (nextRetryDelay !== null) {
                return attemptReconnect;
            }
            this.completeClose();
        },
        onclose: function (callback) {
            if (callback) {
                this.closedCallbacks.push(callback);
            }
        },
        onreconnecting: function (callback) {
            if (callback) {
                this.reconnectingCallbacks.push(callback);
            }
        },
        onreconnected: function (callback) {
            if (callback) {
                this.reconnectedCallbacks.push(callback);
            }
        },
        resetKeepAliveInterval: function () {
            var _this = this;
            if (this.connection.features.inherentKeepAlive) {
                return;
            }
            this.cleanupPingTimer();
            this.pingServerHandle = setTimeout(function () {
                if (_this.connectionState === HubConnectionState.Connected) {
                    _this.sendMessage(_this.cachedPingMessage).then(function () {

                    }, function () {
                        _this.cleanupPingTimer();
                    });
                }
            }, this.keepAliveIntervalInMilliseconds);
        },
        cleanupPingTimer: function () {
            if (this.pingServerHandle) {
                clearTimeout(this.pingServerHandle);
            }
        },
        cleanupTimeout: function () {
            if (this.timeoutHandle) {
                clearTimeout(this.timeoutHandle);
            }
        },
        resetTimeoutPeriod: function () {
            var _this = this;
            if (!this.connection.features || !this.connection.features.inherentKeepAlive) {
                // Set the timeout timer
                this.timeoutHandle = setTimeout(function () {
                    _this.serverTimeout();
                }, this.serverTimeoutInMilliseconds);
            }
        },
        serverTimeout: function () {
            this.connection.stop(new Error("Server timeout elapsed without receiving a message from the server."));
        },
        cancelCallbacksWithError: function () {
            var callbacks = this.callbacks;
            this.callbacks = {};
            for (var key in callbacks) {
                var callback = callbacks[key];
                callback && callback(null, error);
            }
        },
        invokeClientMethod: function (invocationMessage) {
            var _this = this;
            var methods = this.methods[invocationMessage.target.toLowerCase()];
            if (methods) {
                try {
                    for (var i = 0; i < methods.length; i++) {
                        methods[i].apply(_this, invocationMessage.arguments);
                    }
                }
                catch (e) {
                    log("A callback for the method " + invocationMessage.target.toLowerCase() + " threw error '" + e + "'.");
                }
                if (invocationMessage.invocationId) {
                    // This is not supported in v1. So we return an error to avoid blocking the server waiting for the response.
                    var message = "Server requested a response, which is not supported in this version of the client.";
                    log(message);
                    // We don't want to wait on the stop itself.
                    this.stopPromise = this.stopInternal(new Error(message));
                }
            }
            else {
                log("No client method with the name '" + invocationMessage.target + "' found.");
            }
        },
        on: function (methodName, newMethod) {
            if (!methodName || !newMethod) {
                return;
            }
            methodName = methodName.toLowerCase();
            if (!this.methods[methodName]) {
                this.methods[methodName] = [];
            }
            // Preventing adding the same handler multiple times.
            if (this.methods[methodName].indexOf(newMethod) !== -1) {
                return;
            }
            this.methods[methodName].push(newMethod);
        }, off: function (methodName, method) {
            if (!methodName) {
                return;
            }
            methodName = methodName.toLowerCase();
            var handlers = this.methods[methodName];
            if (!handlers) {
                return;
            }
            if (method) {
                var removeIdx = handlers.indexOf(method);
                if (removeIdx !== -1) {
                    handlers.splice(removeIdx, 1);
                    if (handlers.length === 0) {
                        delete this.methods[methodName];
                    }
                }
            } else {
                delete this.methods[methodName];
            }
        }
    });
    function isLogger(logger) {
        return logger.log !== undefined;
    }
    function parseLogLevel(name) {
        // Case-insensitive matching via lower-casing
        // Yes, I know case-folding is a complicated problem in Unicode, but we only support
        // the ASCII strings defined in LogLevelNameMapping anyway, so it's fine -anurse.
        var mapping = LogLevel[name.toLowerCase()];
        if (typeof mapping !== "undefined") {
            return mapping;
        }
        else {
            throw new Error("Unknown log level: " + name);
        }
    }
    function HubConnectionBuilder() { }
    HubConnectionBuilder.prototype.withUrl = function (url, transportTypeOrOptions) {
        this.url = url;
        if (typeof transportTypeOrOptions === "object") {
            this.httpConnectionOptions = signalR.extend({}, this.httpConnectionOptions, transportTypeOrOptions);
        }
        else {
            this.httpConnectionOptions = signalR.extend({}, this.httpConnectionOptions, { transport: transportTypeOrOptions });
        }
        return this;
    };
    HubConnectionBuilder.prototype.configureLogging = function (logging) {
        if (isLogger(logging)) {
            this.logger = logging;
        } else if (typeof logging === "string") {
            var logLevel = parseLogLevel(logging);
            this.logger = new ConsoleLogger(logLevel);
        }
        else {
            this.logger = new ConsoleLogger(logging);
        }
        return this;
    };
    HubConnectionBuilder.prototype.withHubProtocol = function (protocol) {
        this.protocol = protocol;
        return this;
    };
    HubConnectionBuilder.prototype.withAutomaticReconnect = function (retryDelaysOrReconnectPolicy) {
        if (this.reconnectPolicy) {
            throw new Error("A reconnectPolicy has already been set.");
        }
        if (!retryDelaysOrReconnectPolicy) {
            this.reconnectPolicy = new DefaultReconnectPolicy();
        } else if (signalR.isArray(retryDelaysOrReconnectPolicy)) {
            this.reconnectPolicy = new DefaultReconnectPolicy(retryDelaysOrReconnectPolicy);
        } else {
            this.reconnectPolicy = retryDelaysOrReconnectPolicy;
        }
        return this;
    };
    HubConnectionBuilder.prototype.build = function () {
        var options = this.httpConnectionOptions || {};
        var logger = this.logger || NullLogger.instance;
        if (options.logger === undefined) {
            // If our logger is undefined or null, that's OK, the HttpConnection constructor will handle it.
            options.logger = logger;
        }
        if (!this.url) {
            throw new Error("The 'HubConnectionBuilder.withUrl' method must be called before building the connection.");
        }
        var connection = new HttpConnection(this.url, options);
        return HubConnection.create(connection, logger, this.protocol || new JsonHubProtocol(), this.reconnectPolicy);
    };
    signalR.extend({
        LogLevel: LogLevel,
        HubConnectionBuilder: HubConnectionBuilder,
        HubConnection: HubConnection
    });
    if (typeof noGlobal === "undefined") {
        window.signalR = signalR;
    }
    return signalR;
});
