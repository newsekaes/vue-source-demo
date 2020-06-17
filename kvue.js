var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var KVue = /** @class */ (function () {
    function KVue(options) {
        this.$el = document.querySelector(options.el);
        this.$options = options;
        this.$data = observe(this, options.data);
    }
    KVue.prototype.proxyData = function (data) {
        var _this = this;
        Object.keys(data).forEach(function (key) {
            Object.defineProperty(_this, key, {
                configurable: true,
                enumerable: true,
                set: function (val) {
                    this.$data[key] = val;
                },
                get: function () {
                    return this.$data[key];
                }
            });
        });
    };
    return KVue;
}());
var Dep = /** @class */ (function () {
    function Dep() {
        this.watchers = [];
    }
    Dep.prototype.addWatcher = function (watcher) {
        this.watchers.push(watcher);
    };
    Dep.prototype.notify = function (val) {
        this.watchers.forEach(function (watcher) {
            watcher.update(val);
        });
    };
    return Dep;
}());
var Watcher = /** @class */ (function () {
    function Watcher(vm, el, deps) {
        var _this = this;
        this.$el = el;
        this.$vm = vm;
        this.update(deps.reduce(function (vm, key, index) {
            if (index === deps.length - 1) {
                Dep.target = _this;
            }
            return vm[key];
        }, this.$vm));
        Dep.target = null;
    }
    Watcher.prototype.update = function (val) {
        this.$el.textContent = val;
    };
    return Watcher;
}());
function observe(vm, value, fullDeps) {
    if (fullDeps === void 0) { fullDeps = []; }
    if (value instanceof Object) {
        var observer_1 = {};
        Object.keys(value).forEach(function (key) {
            var _fullDeps = __spreadArrays(fullDeps, [key]);
            var deps = new Dep();
            value[key] = observe(vm, value[key], _fullDeps);
            Object.defineProperty(observer_1, key, {
                configurable: true,
                enumerable: true,
                set: function (val) {
                    value[key] = observe(vm, val, _fullDeps);
                    deps.notify(val);
                },
                get: function () {
                    if (Dep.target) {
                        deps.addWatcher(Dep.target);
                    }
                    return value[key];
                }
            });
        });
        if (fullDeps.length === 0) {
            vm.proxyData(observer_1);
        }
        return observer_1;
    }
    return value;
}
