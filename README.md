# Cadenza!!
An open source WebXR rhythm game designed to be easily customizable and extended with new virtual input devices and game modes.

Made with [A-Frame](https://aframe.io/) and [Three.js](https://threejs.org/)

## Demo
[![Cadenza!!](https://img.youtube.com/vi/x6BnU4sGa_o/0.jpg)](https://www.youtube.com/shorts/x6BnU4sGa_o)

## Features

- 3 game modes: keyboard, taiko drum, trombone
- Supports XR controller, XR-hand tracking, and keyboard + mouse controls 
- Load custom beatmaps (currently supports Osu! mania and taiko, MIDI files)
- Save custom beatmaps locally to IndexedDB so you don't need to load them every time

## Development
```
npm install
npm run dev
```

See the [Architecture](ARCHITECTURE.md) doc for more info

### Tips
- Use the [A-Frame inspector](https://aframe.io/docs/1.5.0/introduction/visual-inspector-and-dev-tools.html#a-frame-inspector) `CTRL+ALT+I` (or `CTRL+OPTION+I` on mac) to visually experiment with scene modifications
- Use the [WebXR Emulator browser extension](https://github.com/meta-quest/immersive-web-emulator) for testing XR interactions in browser without an XR headset
