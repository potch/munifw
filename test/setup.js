import { vi } from "vitest";

const mockDoc = {
  createElementNS: vi.fn((ns, tagName) => ({
    append: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    nodeType: 1,
    tagName,
    ns,
  })),
  createElement: vi.fn((tagName) => ({
    append: vi.fn(),
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    nodeType: 1,
    tagName,
  })),
};

vi.stubGlobal("document", mockDoc);
