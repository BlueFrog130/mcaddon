# Warning

mcaddon and GameTest as a whole is still in beta. Expect bugs and breaking changes!

## Overview

Super fast way to generate a Minecraft Addon project.

- ⚙ Generate Behavior Pack
- 💻 GameTest Integration
- 🔑 Full TypeScript Support
- 🎨 Generate Resource Pack
- ⚡ Incredibly fast builds

## Getting Started

Quickest way to get started:

```bash
npm init mcaddon my-addon
cd my-addon
npm install # or pnpm install, yarn, etc.
npm run dev
```

### Build

Builds and copies all assets over to `development_*_packs`.

```bash
npm run build
```

### Dev

Builds and copies all assets over to `development_*_packs`. Then watches for changes and rebuilds whenever any file gets changed.

```bash
npm run dev
```

### Package

Bundles behaviors and resources and packages them into an `.mcaddon` file.


```bash
npm run package
```

## Packages

| Package                           |
| --------------------------------- |
| [create-mcaddon](packages/create) |
| [@mcaddon/kit](packages/kit)      |

## TODO

- [x] Project generator
- [x] Automatic building/deployment to `development_*_packs`
- [x] GameTest integration
- [ ] Mac/Linux support
- [ ] Dedicated Server support
- [ ] Schema Support
- [ ] mcaddon lang (use JS/TS to create packs)

## License

[MIT](LICENSE)