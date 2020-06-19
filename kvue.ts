type Data = Record<string, any>
interface KVueOptions<
    V extends KVue,
    Methods = { [key: string]: (this: V, ...args: any[]) => any }
    > {
    el: string | HTMLElement,
    data?: Data,
    methods?: Methods
    created?(this: V): any,
}
class KVue {
    $options: KVueOptions<KVue>
    $data: Data
    $methods: Record<string, (this: KVue, ...args: any[]) => any>
    $el: HTMLElement
    $compile: Compile
    constructor(options: KVueOptions<KVue>) {
        this.$el = (typeof options.el === 'string') ? document.querySelector(options.el) : options.el
        this.$options = options
        this.$data = observe(this, options.data)
        this.$compile = new Compile(this.$el, this)
        if (options.created) {
            options.created.call(this)
        }
        if (options.methods) {
            Object.assign(this, options.methods)
        }
    }
    proxyData(data: Data): void {
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key,{
                configurable: true,
                enumerable: true,
                set(val) {
                    this.$data[key] = val
                },
                get() {
                    return this.$data[key]
                }
            })
        })
    }
}

class Dep {
    watchers: Watcher[] = []
    static target: null | Watcher
    constructor() {
    }
    addWatcher(watcher) {
        this.watchers.push(watcher)
    }
    notify(val) {
        this.watchers.forEach(watcher => {
            watcher.update(val)
        })
    }
}

class Watcher {
    $vm: KVue
    $cb: (...args: any[]) => any
    constructor(vm, deps: string[], cb) {
        this.$vm = vm
        this.$cb = cb
        this.update(deps.reduce((vm, key, index) => {
            if (index === deps.length - 1) {
                Dep.target = this
            }
            return vm[key]
        }, this.$vm))
        Dep.target = null
    }
    update(val: string):void {
        this.$cb.call(this.$vm, val)
    }
}

function observe(vm: KVue, value: Data, fullDeps: string[] = []) {
    if (value instanceof Object) {
        const observer = {}
        Object.keys(value).forEach(key => {
            const _fullDeps = [...fullDeps, key]
            const deps = new Dep()
            value[key] = observe(vm, value[key], _fullDeps)
            Object.defineProperty(observer, key, {
                configurable: true,
                enumerable: true,
                set(val) {
                    value[key] = observe(vm, val, _fullDeps)
                    deps.notify(val)
                },
                get() {
                    if (Dep.target) { deps.addWatcher(Dep.target) }
                    return value[key]
                }
            })
        })
        if (fullDeps.length === 0) {
            vm.proxyData(observer)
        }
        return observer
    }
    return value
}

class Compile {
    $el: HTMLElement
    $vm: KVue
    $fragment: DocumentFragment
    constructor(el, vm) {
        this.$el = el
        this.$vm = vm
        this.$fragment = this.node2Fragment()
        this.compile(this.$fragment)
        this.$el.appendChild(this.$fragment)
    }
    node2Fragment():DocumentFragment {
        const fragment = document.createDocumentFragment()
        while (this.$el.firstChild) {
            fragment.appendChild(this.$el.firstChild)
        }
        return fragment
    }
    compile(el) {
        Array.prototype.forEach.call(el.childNodes, node => {
            if (node.nodeType === 1) {
                this.compileElement(node)
            } else if (this.isInter(node)) {
                this.compileText(node, this.getExp(node.textContent))
            }
            if (node.children && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }
    isInter(node: HTMLElement) {
        return node.nodeType === 3 && /\{\{(.+)\}\}/.test(node.textContent)
    }
    getExp(str: string): string {
        const result = str.match(/\{\{(.+)\}\}/)
        return  result && result[1]
    }
    compileElement(node: HTMLElement) {
        const attrs = node.getAttributeNames()
        const self = this
        attrs.forEach(attrName => {
            if (attrName.indexOf('k-') === 0) {
                const dir = attrName.substr(2)
                const attrValue = node.getAttribute(attrName)
                const directiveName = `directive${dir[0].toUpperCase() + dir.substr(1)}`
                self[directiveName] && self[directiveName](node, attrValue)
            }
        })
    }
    compileText(node, exp) {
        this.update(node, exp.split('.'), 'text')
    }
    directiveText (node: HTMLElement, exp: string) {
        this.update(node, exp.split('.'), 'text')
    }
    update(node, deps, type) {
        const self = this
        new Watcher(this.$vm, deps, (val) => {
            self[type + 'Update'](node, val)
        })
    }
    textUpdate(node, val) {
        node.textContent = val
    }
}
