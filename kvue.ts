type Data = Record<string, any>
interface KVueOptions<
    V extends KVue,
    Methods = { [key: string]: (this: V, ...args: any[]) => any }
    > {
    el: string | HTMLElement,
    data?: Data,
    methods?: Methods
    created?(): void,
}
class KVue {
    $options: KVueOptions<KVue>
    $data: Data
    $methods: Record<string, (...args: any[]) => any>
    $el: HTMLElement
    constructor(options) {
        this.$el = document.querySelector(options.el)
        this.$options = options
        this.$data = observe(this, options.data)
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
    $el: HTMLElement
    $vm: KVue
    constructor(vm, el, deps) {
        this.$el = el
        this.$vm = vm
        this.update(deps.reduce((vm, key, index) => {
            if (index === deps.length - 1) {
                Dep.target = this
            }
            return vm[key]
        }, this.$vm))
        Dep.target = null
    }
    update(val: string):void {
        this.$el.textContent = val
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
