// fake enough DOM for the `dom()` function to work
// not even a little bit standards compliant

const voids =
  /^(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)$/;

const attributes = "attributes";
const pn = "parentNode";
const cn = "childNodes";
const obj = Object;
const mapCn = (el, fn) => el[cn].map(fn);

const nodeMock = {
  append(...nodes) {
    nodes.map((n) => {
      n = n?.nodeType ? n : _node(3, { textContent: "" + n });
      this[cn].push(n);
      n[pn] = this;
    });
  },
  replaceWith(node) {
    const parentNode = this[pn];
    if (parentNode) {
      parentNode[cn] = mapCn(parentNode, (n) => (n == this ? node : n));
      node[pn] = parentNode;
    }
  },
  replaceChildren(...nodes) {
    mapCn(this, (n) => n.remove());
    this.append(...nodes);
  },
  setAttribute(a, v) {
    this[attributes][a] = v;
  },
  getAttribute(a) {
    return this[attributes][a];
  },
  removeAttribute(a) {
    delete this[attributes][a];
  },
  remove() {
    const self = this;
    const parentNode = self[pn];
    if (parentNode) {
      parentNode[cn] = parentNode[cn].filter((n) => n != self);
      self[pn] = null;
    }
  },
  get outerHTML() {
    const self = this;
    const { tagName, nodeType } = self;
    if (nodeType == 1) {
      return (
        "<" +
        tagName +
        obj
          .entries(self[attributes])
          .map((a) => ` ${a[0]}="${a[1]}"`)
          .join("") +
        ">" +
        self.innerHTML +
        (voids.test(tagName) ? "" : `</${tagName}>`)
      );
    }
    if (nodeType == 3) {
      return self.textContent;
    }
    return "";
  },
  get innerHTML() {
    return mapCn(this, (n) => n.outerHTML).join("");
  },
};

const _node = (nodeType, props) =>
  obj.assign(obj.create(nodeMock), { nodeType }, props);

const createElement = (tagName) =>
  _node(1, {
    tagName: tagName.toLowerCase(),
    [attributes]: {},
    [cn]: [],
  });

export default {
  createElement,
  // used by ssr instead of getElementById
  find: (el, id) => {
    let current,
      stack = [el];
    do {
      current = stack.pop();
      if (current?.[attributes]?.id == id) return current;
      if (current) {
        stack.push(...current[cn]);
      }
    } while (stack.length);
  },
};
