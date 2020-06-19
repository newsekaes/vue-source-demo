var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var KVue = /** @class */ (function () {
    function KVue(options) {
        this.$el = (typeof options.el === 'string') ? document.querySelector(options.el) : options.el;
        this.$options = options;
        this.$data = observe(this, options.data);
        this.$compile = new Compile(this.$el, this);
        if (options.created) {
            options.created.call(this);
        }
        if (options.methods) {
            Object.assign(this, options.methods);
        }
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
    function Watcher(vm, deps, cb) {
        var _this = this;
        this.$vm = vm;
        this.$cb = cb;
        this.update(deps.reduce(function (vm, key, index) {
            if (index === deps.length - 1) {
                Dep.target = _this;
            }
            return vm[key];
        }, this.$vm));
        Dep.target = null;
    }
    Watcher.prototype.update = function (val) {
        this.$cb.call(this.$vm, val);
    };
    return Watcher;
}());
function observe(vm, value, fullDeps) {
    if (fullDeps === void 0) { fullDeps = []; }
    if (value instanceof Object) {
        var observer_1 = {};
        Object.keys(value).forEach(function (key) {
            var _fullDeps = __spread(fullDeps, [key]);
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
var Compile = /** @class */ (function () {
    function Compile(el, vm) {
        this.$el = el;
        this.$vm = vm;
        this.$fragment = this.node2Fragment();
        this.compile(this.$fragment);
        this.$el.appendChild(this.$fragment);
    }
    Compile.prototype.node2Fragment = function () {
        var fragment = document.createDocumentFragment();
        while (this.$el.firstChild) {
            fragment.appendChild(this.$el.firstChild);
        }
        return fragment;
    };
    Compile.prototype.compile = function (el) {
        var _this = this;
        Array.prototype.forEach.call(el.childNodes, function (node) {
            if (node.nodeType === 1) {
                _this.compileElement(node);
            }
            else if (_this.isInter(node)) {
                _this.compileText(node, _this.getExp(node.textContent));
            }
            if (node.children && node.childNodes.length > 0) {
                _this.compile(node);
            }
        });
    };
    Compile.prototype.isInter = function (node) {
        return node.nodeType === 3 && /\{\{(.+)\}\}/.test(node.textContent);
    };
    Compile.prototype.getExp = function (str) {
        var result = str.match(/\{\{(.+)\}\}/);
        return result && result[1];
    };
    Compile.prototype.compileElement = function (node) {
        var attrs = node.getAttributeNames();
        var self = this;
        attrs.forEach(function (attrName) {
            if (attrName.indexOf('k-') === 0) {
                var dir = attrName.substr(2);
                var attrValue = node.getAttribute(attrName);
                var directiveName = "directive" + (dir[0].toUpperCase() + dir.substr(1));
                self[directiveName] && self[directiveName](node, attrValue);
            }
        });
    };
    Compile.prototype.compileText = function (node, exp) {
        this.update(node, exp.split('.'), 'text');
    };
    Compile.prototype.directiveText = function (node, exp) {
        this.update(node, exp.split('.'), 'text');
    };
    Compile.prototype.update = function (node, deps, type) {
        var self = this;
        new Watcher(this.$vm, deps, function (val) {
            self[type + 'Update'](node, val);
        });
    };
    Compile.prototype.textUpdate = function (node, val) {
        node.textContent = val;
    };
    return Compile;
}());
//# sourceMappingURL=kvue.js.map