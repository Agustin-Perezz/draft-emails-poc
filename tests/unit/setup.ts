import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom is missing the layout-observation APIs that base-ui / floating-ui rely
// on for positioning (Dialog, Sheet, DropdownMenu). Stub them so component
// tests can render open portals/menus without hanging.
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("ResizeObserver", ObserverStub);
vi.stubGlobal("IntersectionObserver", ObserverStub);

// matchMedia is not implemented in jsdom.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
