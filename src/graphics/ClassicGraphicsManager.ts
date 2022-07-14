import { Entity, Scene } from "aframe";
import {
  AnimationMixer,
  BackSide,
  DataTexture,
  FrontSide,
  Group,
  LuminanceFormat,
  Material,
  Mesh,
  RedFormat,
  ShaderMaterial,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import AudioDataSource from "../audio/AudioDataSource";
import Beatmap from "../beatmap/models/Beatmap";
import CadenzaBeatmap from "../beatmap/models/CadenzaBeatmap";
import ClassicNote from "../beatmap/models/ClassicNote";
import Note from "../beatmap/models/Note";
import GameState, { GameStatus } from "../game/GameState";
import SettingsManager from "../settings/SettingsManager";
import ClassicNoteManager from "./ClassicNoteManager";
import GraphicsManager from "./GraphicsManager";

const NOTE_OFFSET = 3000; //milliseconds
const MOVE_AMOUNT = 8 / NOTE_OFFSET; //units per millisecond

export default class ClassicGraphicsManager implements GraphicsManager {
  noteManager: ClassicNoteManager;
  currentNote: number;
  previousTime: number;
  noteIDs: Map<Note, number>;
  scene: Scene;
  skysphere: Entity;
  defaultSkysphereMaterial: Material | Material[];
  customSkysphereMaterial: ShaderMaterial;
  gltfLoader: GLTFLoader;
  animationMixers: AnimationMixer[];
  audioMaterials: ShaderMaterial[];
  audioDataSource: AudioDataSource;
  loadedModels: Group[];

  constructor(
    noteManager: ClassicNoteManager,
    audioDataSource: AudioDataSource
  ) {
    this.noteManager = noteManager;
    this.currentNote = 0;
    this.previousTime = 0;
    this.noteIDs = new Map();
    this.audioDataSource = audioDataSource;
    this.animationMixers = [];
    this.audioMaterials = [];
    this.loadedModels = [];
  }

  init(scene: Scene, skysphere: Entity, settingsManager: SettingsManager) {
    this.scene = scene;
    this.skysphere = skysphere;
    this.gltfLoader = new GLTFLoader();
    this.noteManager.init(scene, 0);
    settingsManager.addObserver("keyboardHeightOffset", (value) => {
      this.noteManager.updateKeyboardHeight(value);
    });
  }

  onGameStart() {
    this.currentNote = 0;
    this.previousTime = 0;
  }

  onGameRestart() {
    this.currentNote = 0;
    this.previousTime = 0;
    this.noteManager.reset();
  }

  onReturnToMenu() {
    this.noteManager.reset();
    for (const mixer of this.animationMixers) {
      mixer.stopAllAction();
    }
    this.animationMixers.length = 0;

    if (this.defaultSkysphereMaterial) {
      (<Mesh>this.skysphere.object3D.children[0]).material =
        this.defaultSkysphereMaterial;
      this.defaultSkysphereMaterial = null;
      this.customSkysphereMaterial.dispose();
    }

    for (const model of this.loadedModels) {
      this.scene.object3D.remove(model);
    }
  }

  async loadBeatmap(beatmap: Beatmap) {
    this.noteManager.load(beatmap);
    if ((<CadenzaBeatmap>beatmap).skysphere) {
      await this.loadSkysphere((<CadenzaBeatmap>beatmap).skysphere);
    }

    if ((<CadenzaBeatmap>beatmap).models) {
      await this.loadModels((<CadenzaBeatmap>beatmap).models);
    }
  }

  async loadSkysphere(skysphere: any) {
    if (skysphere.fragmentShader && skysphere.vertexShader) {
      const fragmentShader = await fetch(skysphere.fragmentShader).then((res) =>
        res.text()
      );
      const vertexShader = await fetch(skysphere.vertexShader).then((res) =>
        res.text()
      );

      const material = new ShaderMaterial({
        fragmentShader: fragmentShader,
        vertexShader: vertexShader,
        side: BackSide,
      });

      this.customSkysphereMaterial = material;

      this.defaultSkysphereMaterial = (<Mesh>(
        this.skysphere.object3D.children[0]
      )).material;
      (<Mesh>this.skysphere.object3D.children[0]).material = material;
    }
  }

  async loadModels(models: any) {
    for (const model of models) {
      await new Promise<void>((resolve, reject) => {
        this.gltfLoader.load(model.file, async (gltf) => {
          if (model.vertexShader && model.fragmentShader) {
            const fragmentShader = await fetch(model.fragmentShader).then(
              (res) => res.text()
            );
            const vertexShader = await fetch(model.vertexShader).then((res) =>
              res.text()
            );

            let uniforms;

            if (this.audioDataSource.audioData) {
              const format = this.scene.renderer.capabilities.isWebGL2
                ? RedFormat
                : LuminanceFormat;

              uniforms = {
                time: { value: 0 },
                audioData: {
                  value: new DataTexture(
                    this.audioDataSource.audioData,
                    1024,
                    1,
                    format
                  ),
                },
              };
            } else {
              uniforms = {
                time: { value: 0 },
              };
            }

            const material = new ShaderMaterial({
              uniforms: uniforms,
              fragmentShader: fragmentShader,
              vertexShader: vertexShader,
              side: FrontSide,
            });
            this.audioMaterials.push(material);
            (<Mesh>gltf.scene.children[0]).material = material;
          }
          this.scene.object3D.add(gltf.scene);
          this.loadedModels.push(gltf.scene);
          const positionVector = model.position;
          if (positionVector) {
            gltf.scene.position.set(
              positionVector[0],
              positionVector[1],
              positionVector[2]
            );
          }
          if (gltf.animations.length > 0) {
            const mixer = new AnimationMixer(gltf.scene);
            mixer.clipAction(gltf.animations[0]).play();
            this.animationMixers.push(mixer);
          }
          resolve();
        });
      });
    }
  }

  update(gamestate: GameState, deltaTime: number): void {
    if (gamestate.status === GameStatus.PLAYING) {
      //const deltaTime = gamestate.currentSongTime - this.previousTime;
      const deltaSeconds = deltaTime / 1000;
      for (const hitEvent of gamestate.events) {
        const note = <ClassicNote>hitEvent.note;
        if (!note.isActive) {
          this.noteManager.deactivateNote(
            note.type,
            this.noteIDs.get(note),
            note.width
          );
        }
      }

      //shift the valid notes
      this.noteManager.moveActiveNotesForwards(deltaTime * MOVE_AMOUNT);

      // add new notes
      const offsetTime = gamestate.currentSongTime + NOTE_OFFSET;
      const notes = <Array<ClassicNote>>gamestate.beatmap.notes;
      let note = notes[this.currentNote];
      while (note != null && note.startTime < offsetTime) {
        const noteID = this.noteManager.spawnNewNote(
          note.type,
          note.width,
          note.key,
          note,
          MOVE_AMOUNT * (offsetTime - note.startTime)
        );
        this.noteIDs.set(note, noteID);
        note = notes[++this.currentNote];
      }

      // Update animation mixers
      for (const animationMixer of this.animationMixers) {
        animationMixer.update(deltaSeconds);
      }

      for (const audioMaterial of this.audioMaterials) {
        audioMaterial.uniforms.audioData.value.needsUpdate = true;
        audioMaterial.uniforms.time.value =
          audioMaterial.uniforms.time.value + deltaSeconds;
      }
    }
    this.previousTime = gamestate.currentSongTime;
  }
}
