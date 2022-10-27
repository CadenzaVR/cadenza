# ARCHITECTURE
Rhythm games generally have a lot in common, so much so that many of them may as well be essentially the same game but with different skins/settings/input peripherals.
With this in mind, Cadenza was designed with the aim of laying the foundation for a general purpose rhythm game framework/platform.

## Overview
Core classes and interfaces handle the base architecture and implementation details common across any rhythm game.
Modules more specific to Cadenza either extend these directly or ultimately interface with them in some way.
[AFrame](https://aframe.io/)/[Three.js](https://threejs.org/) is used to build the graphical aspects and as the ECS library that puts everything together.

### General Application Structure

Scene
 - Game
    - Graphics
    - Audio
    - GameState
    - Input
 - Menu/UI Elements
 - Virtual Input Devices
 - Systems
    - Physics/Collision Detection
    - Settings
