// vite.config.ts
import { defineConfig } from "file:///home/xavier/e-Transfer/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///home/xavier/e-Transfer/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nodePolyfills } from "file:///home/xavier/e-Transfer/frontend/node_modules/vite-plugin-node-polyfills/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        // can also be 'build', 'dev', or false
        global: true,
        process: true
      },
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS94YXZpZXIvZS1UcmFuc2Zlci9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUveGF2aWVyL2UtVHJhbnNmZXIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUveGF2aWVyL2UtVHJhbnNmZXIvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgbm9kZVBvbHlmaWxscyB9IGZyb20gXCJ2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxsc1wiO1xuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBzcGVjaWZpYyBnbG9iYWxzLlxuICAgICAgZ2xvYmFsczoge1xuICAgICAgICBCdWZmZXI6IHRydWUsIC8vIGNhbiBhbHNvIGJlICdidWlsZCcsICdkZXYnLCBvciBmYWxzZVxuICAgICAgICBnbG9iYWw6IHRydWUsXG4gICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICB9LFxuICAgICAgLy8gV2hldGhlciB0byBwb2x5ZmlsbCBgbm9kZTpgIHByb3RvY29sIGltcG9ydHMuXG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgfSksXG4gIF0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1IsU0FBUyxvQkFBb0I7QUFDL1MsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBRTlCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQTtBQUFBLE1BRVosU0FBUztBQUFBLFFBQ1AsUUFBUTtBQUFBO0FBQUEsUUFDUixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsTUFDWDtBQUFBO0FBQUEsTUFFQSxpQkFBaUI7QUFBQSxJQUNuQixDQUFDO0FBQUEsRUFDSDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
