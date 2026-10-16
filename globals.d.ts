// <ViewTransition> de React: Next lo trae en su React canary, los tipos estan
// en el entry "canary" de @types/react.
/// <reference types="react/canary" />

// Next.js only ships type declarations for `*.module.css`, so plain CSS
// side-effect imports (e.g. `import "./globals.css"`) trip TS error 2882.
declare module "*.css";
