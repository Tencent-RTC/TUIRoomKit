// 实现light.on()的机制
light.configure = function(entityManager, eventManager, scriptSystem) {
    console.log("webgl log, emit on configure");
    light.emit("configure", entityManager, eventManager, scriptSystem);
};

light.update = function(time, entityManager, eventManager) {
    light.emit("update", time, entityManager, eventManager);
}

light.receive = function (event) {
    if (event.type() === "TouchEvent") {
        let action = event.getAction();
        if (action === light.TouchEvent.ACTION_DOWN) {
           light.emit("touchstart", event);
        }
        if (action === light.TouchEvent.ACTION_UP) {
           light.emit("touchend", event);
        }
    }
}

// This file is always executed before the App's index.js. It sets up most of
// Ejecta's functionality. It initializes some global properties, such as window
// dimensions and the userAgent, provides global functions such as setInterval()
// and setTimeout() and the console object, emulates a tiny bit of DOM
// functionality and sets up handlers for Touch events and others.

// Make 'window' the global scope
self = window = this;
window.top = window.parent = window;

(function () {
    // 初始化为720 * 1280
    window.innerWidth = 720;
    window.innerHeight = 1280;

    window.screen = {
        availWidth: window.innerWidth,
        availHeight: window.innerHeight
    };

    // 注册一个configure回调，更新一下画布大小
    light.on("configure", function(entityManager){
        window.innerWidth = light.DeviceUtils.GetSurfaceWidth(entityManager);
        window.innerHeight = light.DeviceUtils.GetSurfaceHeight(entityManager);

        window.screen.availWidth = window.innerWidth;
        window.screen.availHeight = window.innerHeight;
    });

// 设备相关的信息，目前无法拿到
// window.devicePixelRatio = ej.devicePixelRatio;
// Object.defineProperty(window, 'orientation', {
    // get: function() {return ej.orientation; }
// });

    var geolocation = null;
    // navigator 里也有部分信息拿不到
    window.navigator = {
        	language: "zh-CN", //ej.language,
        	userAgent: "light sdk", //ej.userAgent,
        	appVersion: "2.3.0", //ej.appVersion,
        	platform: "cross platform", //ej.platform,
        // 	get onLine() { return ej.onLine; }, // re-evaluate on each get
        // 	get geolocation(){ // Lazily create geolocation instance
        // 		geolocation = geolocation || new Ejecta.Geolocation();
        // 		return geolocation;
        // 	}
    };

    // Create the default screen canvas
    window.canvas = getNativeCanvasImpl();
    HTMLCanvasElement.prototype.addEventListener = window.addEventListener = function (type, callback, useCapture) {
       window.document.addEventListener(type, callback, useCapture);
    };
    HTMLCanvasElement.prototype.removeEventListener = window.removeEventListener = function (type, callback) {
        window.document.removeEventListener(type, callback);
    };
    HTMLImageElement.prototype.addEventListener = function (type, callback, useCapture) {
        if (type === 'load') {
            this.onload = callback;
        }
    };
    HTMLImageElement.prototype.removeEventListener = function (event, method, useCapture) {
        if (event === 'load') {
            this.onload = undefined;
        }
    }
    window.canvas.getBoundingClientRect = function () {
        return {
            top: this.offsetTop, left: this.offsetLeft,
            width: this.offsetWidth, height: this.offsetHeight
        };
    };
    window.canvas.type = 'canvas';
    window.canvas.style = {
        width: window.canvas.width + 'px',
        height: window.canvas.height + 'px'
    };

    // 临时方案，解决 C++ 绑定到 JS 的方法无法使用 apply 的问题
    const webglContext = window.canvas.getContext('webgl');
    webglContext.compressedTexImage2D.__proto__ = Function.prototype;
    webglContext.texImage2D.__proto__ = Function.prototype;
    XMLHttpRequest.prototype.send.__proto__ = Function.prototype;
    // 空函数 setRequestHeader 只用于接口兼容，无实际作用
    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {};

    // The console object，
    window.console = console;
    // window.console.debug = function () { window.console._log('DEBUG', arguments); };			未实现
    // window.console.info = function () { window.console._log('INFO', arguments); };			未实现
    // window.console.warn = function () { window.console._log('WARN', arguments); };			未实现
    // window.console.error = function () { window.console._log('ERROR', arguments); };			已经实现
    // window.console.log = function () { window.console._log('LOG', arguments); };				已经实现
    // window.console.logJSON = function () { window.console._log('JSON', arguments, true); }	未实现
    // window.console.assert = xxxx																未实现

// var consoleTimers = {};
// console.time = function(name) {
// 	consoleTimers[name] = ej.performanceNow();
// };
//
// console.timeEnd = function(name) {
// 	var timeStart = consoleTimers[name];
// 	if( !timeStart ) {
// 		return;
// 	}
//
// 	var timeElapsed = ej.performanceNow() - timeStart;
// 	console.log(name + ": " + timeElapsed + "ms");
// 	delete consoleTimers[name];
// };


// CommonJS style require()
    window.require = require; // native实现的require貌似跟这里的不大一样
// var loadedModules = {};
// window.require = function( name ) {
// 	var id = name.replace(/\.js$/,'');
// 	if( !loadedModules[id] ) {
// 		var exports = {};
// 		var module = { id: id, uri: id + '.js', exports: exports };
// 		window.ejecta.requireModule( id, module, exports );
// 		// Some modules override module.exports, so use the module.exports
// 		// reference only after loading the module
// 		loadedModules[id] = module.exports;
// 	}
//
// 	return loadedModules[id];
// };

// Timers
// window.performance = {now: function() {return ej.performanceNow();} };
    window.setTimeout = setTimeout;
    window.setInterval = setInterval;
    window.clearTimeout = clearTimeout;
    window.clearInterval = clearInterval;
// 这里的回调有两种解决方案，一是用定时器，一是走update，目前先使用update
// 将cb丢回去，代替id，用于cancel操作
    window.requestAnimationFrame = function (cb, element) {
        light.once("update", cb.bind(this));
        return cb;
    };
// return value != undefined 时表明，remove成功了
    window.cancelAnimationFrame = function (id) {
        return light.removeListener("update", id);
    };

// The native Image, Audio, HttpRequest and LocalStorage class mimic the real elements
    window.Image = HTMLImageElement;
    this.Image = HTMLImageElement;
    window.Audio = light.Audio;
    this.Audio = light.Audio;
// window.Video = Ejecta.Video;
// window.XMLHttpRequest = Ejecta.HttpRequest;
// window.localStorage = new Ejecta.LocalStorage();
// window.WebSocket = Ejecta.WebSocket;

    window.Event = function (type) {
        this.type = type;
        this.cancelBubble = false;
        this.cancelable = false;
        this.target = null;
        this.timestamp = ej.performanceNow();

        this.initEvent = function (type, bubbles, cancelable) {
            this.type = type;
            this.cancelBubble = bubbles;
            this.cancelable = cancelable;
            this.timestamp = ej.performanceNow();
        };

        this.preventDefault = function () {
        };
        this.stopPropagation = function () {
        };
    };

// 这两个可能都不需要
// window.location = { href: 'index.js' };
// window.location.reload = function() {
// 	ejecta.load('index.js');
// }

// window.open = function(url) { ej.openURL(url); };


// Set up a "fake" HTMLElement
    HTMLElement = function (tagName) {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.style = {};
    };

    HTMLElement.prototype.appendChild = function (element) {
        this.children.push(element);

        // If the child is a script element, begin to load it or execute it
        if (element.tagName && element.tagName.toLowerCase() == 'script') {
            if (element.src) {
                // 这里好像还不支持
                ej.setTimeout(function () {
                    ej.include(element.src);
                    if (element.onload) {
                        element.onload({
                            type: 'load',
                            currentTarget: element
                        });
                    }
                }, 1);
            } else if (element.text) {
                window.eval(element.text);
            }
        }
    };

    HTMLElement.prototype.insertBefore = function (newElement, existingElement) {
        // Just append; we don't care about order here
        this.appendChild(newElement);
    };

    HTMLElement.prototype.removeChild = function (node) {
        for (var i = this.children.length; i--;) {
            if (this.children[i] === node) {
                this.children.splice(i, 1);
            }
        }
    };

    HTMLElement.prototype.getBoundingClientRect = function () {
        return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
    };

    HTMLElement.prototype.setAttribute = function (attr, value) {
        this[attr] = value;
    };

    HTMLElement.prototype.getAttribute = function (attr) {
        return this[attr];
    };

    HTMLElement.prototype.addEventListener = function (event, method) {
        if (event === 'load') {
            this.onload = method;
        }
    };

    HTMLElement.prototype.removeEventListener = function (event, method) {
        if (event === 'load') {
            this.onload = undefined;
        }
    };

    // The document object
    window.document = {
        readyState: 'complete',
        documentElement: window,
        location: window.location,
        visibilityState: 'visible',
        hidden: false,
        style: {},

        head: new HTMLElement('head'),
        body: new HTMLElement('body'),

        events: {},

        createElement: function (name) {
            if (name === 'canvas') {
                return window.canvas;
            } else if (name == 'audio') {
                // return new Ejecta.Audio();
            } else if (name == 'video') {
                // return new Ejecta.Video();
            } else if (name === 'img') {
                return new HTMLImageElement();
            } else if (name === 'input' || name === 'textarea') {
                // return new Ejecta.KeyInput();
            }
            return new HTMLElement(name);
        },

        createElementNS: function (namespaceURI, qualifiedName) {
            return this.createElement(qualifiedName);
        },

        getElementById: function (id) {
            if (id === 'canvas') {
                return window.canvas;
            }
            return null;
        },

        getElementsByTagName: function (tagName) {
            var elements = [], children, i;

            tagName = tagName.toLowerCase();

            if (tagName === 'head') {
                elements.push(document.head);
            } else if (tagName === 'body') {
                elements.push(document.body);
            } else {
                children = document.body.children;
                for (i = 0; i < children.length; i++) {
                    if (children[i].tagName.toLowerCase() === tagName) {
                        elements.push(children[i]);
                    }
                }
                children = undefined;
            }
            return elements;
        },

        createEvent: function (type) {
            return new window.Event(type);
        },

        addEventListener: function (type, callback, useCapture) {
            if (type == 'load') {
                light.on("configure", callback.bind(this));
                return;
            }
            if (type == 'touchstart') {
                light.on("touchstart", callback.bind(this));
                return;
            }
            if (type == 'touchend') {
                light.on("touchend", callback.bind(this));
                return;
            }
            if (!this.events[type]) {
                this.events[type] = [];

                // call the event initializer, if this is the first time we
                // bind to this event.
                if (typeof (this._eventInitializers[type]) == 'function') {
                    this._eventInitializers[type]();
                }
            }
            this.events[type].push(callback);
        },

        removeEventListener: function (type, callback) {
            var listeners = this.events[type];
            if (!listeners) {
                return;
            }

            for (var i = listeners.length; i--;) {
                if (listeners[i] === callback) {
                    listeners.splice(i, 1);
                }
            }
        },

        _eventInitializers: {},
        dispatchEvent: function (event) {
            var listeners = this.events[event.type];
            if (!listeners) {
                return;
            }

            for (var i = 0; i < listeners.length; i++) {
                listeners[i](event);
            }
        }
    };

    var eventInit = document._eventInitializers;


// Touch events

// Set touch event properties for feature detection
    window.ontouchstart = window.ontouchend = window.ontouchmove = null;
    document.ontouchstart = document.ontouchend = document.ontouchmove = null;

// Setting up the 'event' object for touch events in native code is quite
// a bit of work, so instead we do it here in JavaScript and have the native
// touch class just call a simple callback.
    var touchInput = null;
    var touchEvent = {
        type: 'touchstart',
        target: window.canvas,
        currentTarget: window.canvas,
        touches: null,
        targetTouches: null,
        changedTouches: null,
        timestamp: 0,
        preventDefault: function () {
        },
        stopPropagation: function () {
        }
    };

    var dispatchTouchEvent = function (type, all, changed, timestamp) {
        touchEvent.touches = all;
        touchEvent.targetTouches = all;
        touchEvent.changedTouches = changed;
        touchEvent.type = type;
        touchEvent.timestamp = timestamp;

        document.dispatchEvent(touchEvent);
    };
    eventInit.touchstart = eventInit.touchend = eventInit.touchmove = function () {
        if (touchInput) {
            return;
        }
        //touchInput = new Ejecta.TouchInput(window.canvas);
        //touchInput.ontouchstart = dispatchTouchEvent.bind(window, 'touchstart');
        //touchInput.ontouchend = dispatchTouchEvent.bind(window, 'touchend');
        //touchInput.ontouchmove = dispatchTouchEvent.bind(window, 'touchmove');
    };


// DeviceMotion and DeviceOrientation events

    var deviceMotion = null;
    var deviceMotionEvent = {
        type: 'devicemotion',
        target: window.canvas,
        currentTarget: window.canvas,
        interval: 16,
        acceleration: {x: 0, y: 0, z: 0},
        accelerationIncludingGravity: {x: 0, y: 0, z: 0},
        rotationRate: {alpha: 0, beta: 0, gamma: 0},
        timestamp: 0,
        preventDefault: function () {
        },
        stopPropagation: function () {
        }
    };

    var deviceOrientationEvent = {
        type: 'deviceorientation',
        target: window.canvas,
        currentTarget: window.canvas,
        alpha: null,
        beta: null,
        gamma: null,
        absolute: true,
        timestamp: 0,
        preventDefault: function () {
        },
        stopPropagation: function () {
        }
    };

    eventInit.deviceorientation = eventInit.devicemotion = function () {
        if (deviceMotion) {
            return;
        }

        /*deviceMotion = new Ejecta.DeviceMotion();
        deviceMotionEvent.interval = deviceMotion.interval;

        // Callback for Devices that have a Gyro
        deviceMotion.ondevicemotion = function (agx, agy, agz, ax, ay, az, rx, ry, rz, ox, oy, oz, timestamp) {
            deviceMotionEvent.accelerationIncludingGravity.x = agx;
            deviceMotionEvent.accelerationIncludingGravity.y = agy;
            deviceMotionEvent.accelerationIncludingGravity.z = agz;

            deviceMotionEvent.acceleration.x = ax;
            deviceMotionEvent.acceleration.y = ay;
            deviceMotionEvent.acceleration.z = az;

            deviceMotionEvent.rotationRate.alpha = rx;
            deviceMotionEvent.rotationRate.beta = ry;
            deviceMotionEvent.rotationRate.gamma = rz;

            deviceMotionEvent.timestamp = timestamp;

            document.dispatchEvent(deviceMotionEvent);


            deviceOrientationEvent.alpha = ox;
            deviceOrientationEvent.beta = oy;
            deviceOrientationEvent.gamma = oz;

            deviceOrientationEvent.timestamp = timestamp;

            document.dispatchEvent(deviceOrientationEvent);
        };

        // Callback for Devices that only have an accelerometer
        deviceMotion.onacceleration = function (agx, agy, agz, timestamp) {
            deviceMotionEvent.accelerationIncludingGravity.x = agx;
            deviceMotionEvent.accelerationIncludingGravity.y = agy;
            deviceMotionEvent.accelerationIncludingGravity.z = agz;

            deviceMotionEvent.acceleration = null;
            deviceMotionEvent.rotationRate = null;

            deviceMotionEvent.timestamp = timestamp;

            document.dispatchEvent(deviceMotionEvent);
        };*/
    };


// Window events (resize/pagehide/pageshow)

    var windowEvents = null;

    var lifecycleEvent = {
        type: 'pagehide',
        target: window.document,
        currentTarget: window.document,
        timestamp: 0,
        preventDefault: function () {
        },
        stopPropagation: function () {
        }
    };

    var resizeEvent = {
        type: 'resize',
        target: window,
        currentTarget: window,
        timestamp: 0,
        preventDefault: function () {
        },
        stopPropagation: function () {
        }
    };

    var visibilityEvent = {
        type: 'visibilitychange',
        target: window.document,
        currentTarget: window.document,
        timestamp: 0,
        preventDefault: function () {
        },
        stopPropagation: function () {
        }
    };

    eventInit.visibilitychange = eventInit.pagehide = eventInit.pageshow = eventInit.resize = function () {
        if (windowEvents) {
            return;
        }

        /*windowEvents = new Ejecta.WindowEvents();

        windowEvents.onpagehide = function () {
            document.hidden = true;
            document.visibilityState = 'hidden';
            visibilityEvent.timestamp = ej.performanceNow();
            document.dispatchEvent(visibilityEvent);

            lifecycleEvent.type = 'pagehide';
            document.dispatchEvent(lifecycleEvent);
        };

        windowEvents.onpageshow = function () {
            document.hidden = false;
            document.visibilityState = 'visible';
            visibilityEvent.timestamp = ej.performanceNow();
            document.dispatchEvent(visibilityEvent);

            lifecycleEvent.type = 'pageshow';
            document.dispatchEvent(lifecycleEvent);
        };

        windowEvents.onresize = function () {
            window.innerWidth = ej.screenWidth;
            window.innerHeight = ej.screenHeight;
            resizeEvent.timestamp = ej.performanceNow();
            document.dispatchEvent(resizeEvent);
        };*/
    };
}());
