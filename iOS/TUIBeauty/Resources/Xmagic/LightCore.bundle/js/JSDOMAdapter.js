// 实现light.on()的机制
light.configure = function(entityManager, eventManager, scriptSystem) {
    light.emit("configure", entityManager, eventManager, scriptSystem);
};

var currentTimeStamp = 0;

light.update = function(time, entityManager, eventManager) {
    light.emit("update", time, entityManager, eventManager);
    currentTimeStamp = time;
}

var touchIdentifier = 0;

function wxTouch(event) {
    if (event.getAction() == light.TouchEvent.ACTION_DOWN) {
        touchIdentifier ++;
    }
    this.identifier = touchIdentifier;
    this.pageX = event.getX();
    this.pageY = event.getY();
    this.clientX = event.getX();
    this.clientY = event.getY();
    this.force = 1;
}

light.receive = function (event) {
    if (event.type() === "TouchEvent") {
        let action = event.getAction();
        if (action === light.TouchEvent.ACTION_DOWN) {
           light.emit("touchstart", event);
           var touch = new wxTouch(event);
           light.emit("wx_touchstart", {
               touches: [touch],
               changedTouches: [touch],
               timestamp: currentTimeStamp,
           });
        }
        if (action === light.TouchEvent.ACTION_MOVE) {
            var touch = new wxTouch(event);
            light.emit("wx_touchmove", {
                touches: [touch],
                changedTouches: [touch],
                timestamp: currentTimeStamp,
            });
        }
        if (action === light.TouchEvent.ACTION_UP) {
           light.emit("touchend", event);
           var touch = new wxTouch(event);
           light.emit("wx_touchend", {
                touches: [touch],
                changedTouches: [touch],
                timestamp: currentTimeStamp,
           });
           light.emit("wx_touchcancel", {
                touches: [touch],
                changedTouches: [touch],
                timestamp: currentTimeStamp,
           });
        }
    }
}

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

    var geolocation = null;
    // navigator 里也有部分信息拿不到
    window.navigator = {
        	language: "zh-CN", //ej.language,
        	userAgent: "light sdk", //ej.userAgent,
        	appVersion: "2.3.0", //ej.appVersion,
        	platform: "cross platform", //ej.platform,
    };

    window.location = {
        origin: ""
    }

    // Set up a "fake" HTMLElement
    window.HTMLElement = function (tagName) {
        this.tagName = tagName.toUpperCase();
        this.children = [];
        this.style = {};
    };

    HTMLElement.prototype.appendChild = function (element) {
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

    HTMLElement.prototype.addClass = function (name) {
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

    function HTMLCanvasElement() {
        this.canvas = getNativeCanvasImpl();
        this.tagName = "CANVAS";
        this.width_ = this.canvas.width;
        this.height_ = this.canvas.height;
    }

    HTMLCanvasElement.prototype = Object.create(HTMLElement.prototype);
    HTMLCanvasElement.prototype.offsetLeft = 0;
    HTMLCanvasElement.prototype.offsetTop = 0;
    HTMLCanvasElement.prototype.offsetWidth = 0;
    HTMLCanvasElement.prototype.offsetHeight = 0;
    HTMLCanvasElement.prototype.getContext = function() {
        return this.canvas.getContext(Array.prototype.slice.call(arguments));
    }

    Object.defineProperty(HTMLCanvasElement.prototype, 'constructor', {
        value: HTMLCanvasElement,
        enumerable: false,
        writable: true
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.width_;
        },
        set: function (value) {
        }
    });

    Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.height_;
        },
        set: function (value) {
        }
    });

    // Create the default screen canvas
    window.canvas = new HTMLCanvasElement();
    HTMLCanvasElement.prototype.addEventListener = window.addEventListener = function (type, callback, useCapture) {
       window.document.addEventListener(type, callback, useCapture);
    };
    HTMLCanvasElement.prototype.removeEventListener = window.removeEventListener = function (type, callback) {
        window.document.removeEventListener(type, callback);
    };
    HTMLImageElementInternal.prototype.addEventListener = function (type, callback, useCapture) {
        if (type === 'load') {
            this.onload = callback;
        }
    };
    HTMLImageElementInternal.prototype.removeEventListener = function (event, method, useCapture) {
        if (event === 'load') {
            this.onload = undefined;
        }
    }
    Object.defineProperty(HTMLImageElementInternal.prototype, 'src', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.getSrcInternal();
        },
        set: function (value) {
            if (value.startsWith(RootPathGetter())) {
                this.setSrcInternal(value);
            } else {
                this.setSrcInternal(RootPathGetter() + value);
            }
        }
    });

    function HTMLImageElement() {
        this.image = new HTMLImageElementInternal();
        this.addEventListener = function (type, callback, useCapture) {
            if (type === 'load') {
                this.image.onload = callback;
            }
        };
        this.removeEventListener = function (event, method, useCapture) {
            if (event === 'load') {
                this.image.onload = undefined;
            }
        }
    }

    HTMLImageElement.prototype = Object.create(HTMLElement.prototype);

    Object.defineProperty(HTMLImageElement.prototype, 'constructor', {
        value: HTMLImageElement,
        enumerable: false,
        writable: true
    });

    Object.defineProperty(HTMLImageElement.prototype, 'src', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.image.getSrcInternal();
        },
        set: function (value) {
            if (value.startsWith(RootPathGetter()) || value.startsWith("data:")) {
                this.image.setSrcInternal(value);
            } else {
                this.image.setSrcInternal(RootPathGetter() + value);
            }
        }
    });

    Object.defineProperty(HTMLImageElement.prototype, 'width', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.image.width;
        },
        set: function (value) {
            this.image.width = value;
        }
    });

    Object.defineProperty(HTMLImageElement.prototype, 'height', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.image.height;
        },
        set: function (value) {
            this.image.height = value;
        }
    });

    Object.defineProperty(HTMLImageElement.prototype, 'complete', {
        configurable: false,
        enumerable: true,
        get: function () {
            return this.image.complete;
        },
        set: function (value) {
            this.image.complete = value;
        }
    });

    Object.defineProperty(HTMLImageElement.prototype, 'onload', {
        configurable: false,
        enumerable: true,
        set: function (value) {
            this.image.onload = value;
        }
    });
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

    // native实现的require跟CommonJS规范的不同
    window.require = require;
    window.setTimeout = setTimeoutInDom;
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
    window.HTMLImageElementInternal = HTMLImageElementInternal;
    this.Image = HTMLImageElement;
    window.Audio = light.Audio;
    this.Audio = light.Audio;

    window.GetJsStacktrace = GetJsStacktrace;

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

    window.HTMLVideoElement = function() {
        this.canPlayType = function (type) {
            return true;
        }
    }

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
            if (name === 'canvas' || name === 'CANVAS') {
                return window.canvas;
            } else if (name == 'audio') {
            } else if (name == 'video') {
                return new HTMLVideoElement();
            } else if (name === 'img') {
                return new HTMLImageElement();
            } else if (name === 'input' || name === 'textarea') {
            }
            return new HTMLElement(name);
        },

        createElementNS: function (namespaceURI, qualifiedName) {
            return this.createElement(qualifiedName);
        },

        getElementById: function (id) {
            if (id === 'canvas' || id === 'CANVAS') {
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
        },

        querySelector: function (name) {
            return new HTMLElement("DIV");
        }
    };
}());
