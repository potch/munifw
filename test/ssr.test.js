import ssr from "../src/ssr.js";
vi.stubGlobal("document", ssr);
import { dom } from "../src/munifw.js";

describe("createElement", () => {
  it("makes tags", () => {
    const el = ssr.createElement("div");
    expect(el.tagName).toBe("div");
  });
  it("makes text", () => {
    const el = ssr.createElement("div");
    el.append("foo");
    const text = el.childNodes[0];
    expect(text.nodeType).toBe(3);
    expect(text.textContent).toBe("foo");
  });
  it("works with muni", () => {
    const spy = vi.spyOn(ssr, "createElement");
    const el = dom("div");
    expect(spy).toHaveBeenCalled();
    expect(el.tagName).toBe("div");
    expect(el.nodeType).toBe(1);
  });
});

describe("nodeMock", () => {
  it("attributes", () => {
    const el = ssr.createElement("div");
    el.setAttribute("foo", "bar");
    expect(el.getAttribute("foo")).toBe("bar");
    el.removeAttribute("foo");
    expect(el.getAttribute("foo")).toBeUndefined();
  });
  it("children", () => {
    const el = ssr.createElement("div");
    const h1 = ssr.createElement("h1");
    el.append(h1);
    expect(el.childNodes[0]).toBe(h1);
    expect(h1.parentNode).toBe(el);
    const h2 = ssr.createElement("h2");
    el.replaceChildren(h2);
    expect(el.childNodes.length).toBe(1);
    expect(el.childNodes[0]).toBe(h2);
    expect(h1.parentNode).toBeNull();
    el.append(h1);
    expect(el.childNodes.length).toBe(2);
    h2.remove();
    expect(el.childNodes[0]).toBe(h1);
    h1.replaceWith(h2);
    expect(el.childNodes[0]).toBe(h2);
  });
  it("serializes", () => {
    const el = ssr.createElement("div");
    const a = ssr.createElement("a");
    a.setAttribute("href", "foo");
    a.append("bar");
    el.append(a);
    el.append(ssr.createElement("img"));
    el.append(ssr.createElement("b"));
    expect(el.outerHTML).toBe('<div><a href="foo">bar</a><img><b></b></div>');
    expect(el.innerHTML).toBe('<a href="foo">bar</a><img><b></b>');
    expect(a.innerHTML).toBe("bar");
  });
});
