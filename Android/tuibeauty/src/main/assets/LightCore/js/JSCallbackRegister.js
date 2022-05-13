(function (light) {
    var Callbacks = {};
    light.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var cbs = Callbacks[event];
        if (!cbs) return;
        cbs = cbs.concat();
        cbs.forEach(function (cb) {
            try {
                var thisObject = cb[1] || cb[0];
                cb[0].apply(thisObject, args);
            }
            catch (error) {
                console.error(error);
            }
        });
    };
    light.addListener = function (event, callback, thisObject) {
        if (!event || !callback) {
            return;
        }
        var cbs = Callbacks[event];
        if (!cbs) {
            cbs = [];
            Callbacks[event] = cbs;
        }
        cbs.push([callback, thisObject]);
    };
    light.on = light.addListener;
    light.removeListener = function (event, callback, thisObject) {
        if (!event || !callback) {
            return;
        }
        var cbs = Callbacks[event];
        if (!cbs) {
            return;
        }
        var removed = 0;
        for (var i = cbs.length - 1; i >= 0; i--) {
            if (cbs[i][0] === callback) {
                removed++;
                cbs.splice(i, 1);
            }
        }
        return removed;
    };
    light.removeAllListeners = function (event) {
        if (!event) {
            return;
        }
        Callbacks[event] = [];
    };
    light.once = function (event, callback, thisObject) {
        var newCallback = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            callback.apply(thisObject, args);
            light.removeListener(event, newCallback);
        };
        light.addListener(event, newCallback, thisObject);
    };
    light.BehaviorClasses = [];
    function rewriteSystemCallback(name) {
        var callbacks = [];
        if (light[name]) {
            callbacks.push(light[name]);
        }
        var newCallback = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (light['before' + name]) {
                light['before' + name].apply(light, args);
            }
            callbacks.forEach(function (cb) {
                try {
                    cb.apply(light, args);
                }
                catch (e) {
                    console.error(e);
                }
            });
            if (light['after' + name]) {
                light['after' + name].apply(light, args);
            }
        };
        Object.defineProperty(light, name, {
            get: function () {
                return newCallback;
            },
            set: function (cb) {
                if (cb) {
                    callbacks.push(cb);
                }
            },
            configurable: true,
            enumerable: true,
        });
    }
    // 兼容 light.update = function(){ } 被重复调用;
    rewriteSystemCallback('configure');
    rewriteSystemCallback('update');
    rewriteSystemCallback('receive');
    rewriteSystemCallback('dealloc');

    function patchEntity() {
        var proto = light.Entity.prototype;
        proto.getComponent = function (componentClazz) {
            if (!this.valid()) {
                return null;
            }
            if (!componentClazz) {
                return null;
            }
            var componentType;
            if (componentClazz.componentType) {
                componentType = componentClazz.componentType;
            }
            else if (typeof (componentClazz) == 'string') {
                componentType = componentClazz;
            }
            else {
                return null;
            }
            if (!this.hasComponent(componentType)) {
                return null;
            }
            var component = this["get" + componentType + "Component"]();
            return component;
        };
        Object.defineProperty(proto, 'transform', {
            get: function () {
                return this.getComponent(light.BasicTransform) || this.getComponent(light.ScreenTransform);
            },
            configurable: true,
            enumerable: false,
        });
        Object.defineProperty(proto, 'screenTransform', {
            get: function () {
                return this.getComponent(light.ScreenTransform);
            },
            configurable: true,
            enumerable: false,
        });
    }

    // Component Patch: Add `componentType` for all Component Classes
    var methods = Object.keys(light);
    for (var index = 0; index < methods.length; index++) {
        var method = methods[index];
        var componentType = method;
        // console.log("JS::Found Component:: " + componentType);
        var componentClass = light[componentType];
        if (componentClass) {
            componentClass.componentType = componentType;
        }
    }

    Object.defineProperty(Object.prototype, 'forEach', {
        value: function (callback) {
            var self = this;
            if (!self.size || !self.get) {
                return;
            }
            for (var index = 0; index < self.size(); index++) {
                var it = self.get(index);
                callback(it, index);
            }
        },
        enumerable: false,
        configurable: true,
    });

    patchEntity();
})(light);