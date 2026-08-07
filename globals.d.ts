// Next.js only ships type declarations for `*.module.css`, so plain CSS
// side-effect imports (e.g. `import "./globals.css"`) trip TS error 2882.
declare module "*.css";
