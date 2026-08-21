import "@testing-library/jest-dom/vitest";

class ResizeObserverMock implements ResizeObserver {
  disconnect(): void {}

  observe(): void {}

  unobserve(): void {}
}

globalThis.ResizeObserver = ResizeObserverMock;

if (typeof window !== "undefined") {
  const getComputedStyle = window.getComputedStyle.bind(window);

  // jsdom no implementa pseudo-elementos; Ant Design sólo los consulta para medir layout.
  Object.defineProperty(window, "getComputedStyle", {
    configurable: true,
    value: (element: Element) => getComputedStyle(element),
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
