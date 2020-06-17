class Compile {
    constructor(el, vm) {
        this.$vm = vm;
        this.$el = document.querySelector(el);

        // 编译
        // 把模板中的内容移到片段中
        this.$fragment = this.node2Fragment(this.$el);
        // 执行编译
        this.compile(this.$fragment);
        // 放回el中
        this.$el.appendChild(this.$fragment)
    }
    node2Fragment (el) {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) {
            fragment.appendChild(el.firstChild)
        }
        return fragment
    }
    compile (el) {
        Array.from(el.childNodes).forEach(node => {
            if (node.nodeType === 1) {
                // 普通元素
                this.compileElement(node);
            } else if (this.isInter(node)) {
                // 编译插值
                this.compileText(node)
            }
            if (node.children && node.childNodes.length > 0) {
                this.compile(node);
            }
        })
    }
    isInter(node) {
        return node.nodeType === 3 && /^\{\{(.*)\}\}$/.test(node.textContent);
    }
    compileText(node) {
        const exp = RegExp.$1;
        node.textContent = this.$vm[exp]
        this.update(node, exp, 'text')
    }
    compileElement(node) {
        const nodeAttrs = node.attributes;
        const self = this;
        Array.from(nodeAttrs).forEach(attr => {
            const attrName = attr.name;
            const exp = attr.value;
            if (attrName.indexOf('k-') === 0) {
                const dir = attrName.substring(2);
                self[dir] && self[dir](node, exp);
            }
        })
    }
    update(node, exp, dir) {
        const updater = this[dir+'Updater']
        updater && updater(node, this.$vm[exp])
        const self = this;
        new Watcher(this.$vm, exp, function (value) {
            updater && updater(node, value)
        })
    }
    textUpdater(node, value) {
        node.textContent = value;
    }
    text(node, exp) {
        this.update(node, exp, 'text')
    }
}
