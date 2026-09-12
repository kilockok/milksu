import { beforeEach } from 'vitest'

// Existing component fixtures describe the backend as a collection of App
// methods. Adapt that test fixture shape to the Electron preload contract;
// product code has no Wails compatibility path.
beforeEach(() => {
	if (typeof window === 'undefined') return
  // jsdom does not implement matchMedia; xterm.js calls it unguarded while
  // product code guards `typeof window.matchMedia === 'function'`. Stub it so
  // deferred terminal mounts do not raise unhandled rejections.
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false
      },
    })
  }
  Object.defineProperty(window, 'milksu', {
    configurable: true,
    get() {
      const legacy = (window as unknown as {
        go?: { main?: { App?: Record<string, (...args: unknown[]) => unknown> } }
      }).go?.main?.App
      if (!legacy) return undefined
      return {
        invoke(method: string, args: unknown[]) {
          const operation = legacy[method]
          if (typeof operation !== 'function') {
            return Promise.reject(new Error(`unsupported desktop test method: ${method}`))
          }
          return Promise.resolve(operation(...args))
        },
        onEvent() {
          return () => undefined
        },
      }
    },
  })
})
