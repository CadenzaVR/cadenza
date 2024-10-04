# ARCHITECTURE
Rhythm games generally have a lot in common, so much so that many of them may as well be essentially the same game but with different skins/settings/input peripherals.
With this in mind, Cadenza was designed with the aim of laying the foundation for a general purpose rhythm game framework/platform.

## Overview
Core classes and interfaces handle the base architecture and implementation details common across any rhythm game.
Modules more specific to Cadenza either extend these directly or ultimately interface with them in some way.
[A-Frame](https://aframe.io/)/[Three.js](https://threejs.org/) is used to build the graphical aspects and as the ECS library that puts everything together.

### High Level Application Structure
`/templates` - HTML files that define the A-Frame entities in the game scene along with the components attached to them

`/components` - contains the code for the custom A-Frame components. The `game` component manages the graphics and control of the different supported game modes.

`/systems` - contains the code for the custom A-Frame systems.

The `scene-controller` handles top level orchestration of different components and systems. In the future this may be refactored to use more of a global state + pub/sub approach

![image](https://github.com/user-attachments/assets/bdce1400-c055-4625-b8f6-4377b368fd29)


