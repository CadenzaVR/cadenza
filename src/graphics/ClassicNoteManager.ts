import { Entity } from "aframe";
import { Euler, MathUtils, Matrix4, Vector3, Vector4 } from "three";
import Beatmap from "../beatmap/models/Beatmap";
import { createNote } from "../objects/note";

const COLOR_YELLOW = new Vector4(1, 1, 0, 1);
const COLOR_CYAN = new Vector4(0, 1, 1, 1);
const BASE_POSITION = new Vector3(0, 0.0001, 0);

export default class ClassicNoteManager {
  keyY = 1.595;
  baseNoteHeight = 0.05;
  baseNoteWidth = 0.12;
  keyLineWidth = 0.15;
  moveAmount = 8 / 3000;
  moveDirection = new Vector3(0, 0, 1);
  offsetY: number = null;
  hitNotes: Array<any> = [null];
  hitNotePools: Array<Array<any>> = [null, [], [], [], [], [], [], [], []];
  activeHitNotes: Array<Set<number>> = [
    null,
    new Set(),
    new Set(),
    new Set(),
    new Set(),
    new Set(),
    new Set(),
    new Set(),
    new Set(),
  ];
  holdNotes: Array<any> = [];
  holdNotePool: Array<any> = [];
  activeHoldNotes: Set<number> = new Set();
  slideNotes: any = null;
  slideNotePool: Array<any> = [];
  activeSlideNotes: Set<number> = new Set();
  rollNotes: Array<any> = [];
  rollNotePool: Array<any> = [];
  activeRollNotes: Set<number> = new Set();
  noteSpawnPoints: Array<Vector3> = [];
  instancedNoteSpawnPoints: Array<Vector3> = [];
  dummyMatrix = new Matrix4();

  constructor() {
    //TODO initialize variables
  }

  public init(parentEntity: Entity, keyboardHeight: number) {
    const keyZ = -4.29;
    const keyLineLength = 8;
    const keyLineAngle = MathUtils.degToRad(10);
    // direction notes will be travelling in
    this.moveDirection.applyEuler(new Euler(keyLineAngle, 0, 0));
    this.offsetY = (keyLineLength / 2) * Math.sin(keyLineAngle);
    const offsetZ = (keyLineLength / 2) * Math.cos(keyLineAngle);

    for (let i = 0; i < 8; i++) {
      this.noteSpawnPoints.push(
        new Vector3(
          -3.5 * this.keyLineWidth + this.keyLineWidth * i,
          this.keyY + this.offsetY,
          keyZ - offsetZ
        )
      );
      this.instancedNoteSpawnPoints.push(
        this.noteSpawnPoints[i]
          .clone()
          .applyAxisAngle(new Vector3(-1, 0, 0), keyLineAngle)
      );
    }

    // slide notes
    const numSlideNotes = 40;
    this.slideNotes = createNote(this.baseNoteWidth, 0.05, true, numSlideNotes);
    this.slideNotes.mesh.material.uniforms.color.value = COLOR_YELLOW;
    this.addNewNote(parentEntity, this.slideNotes, keyboardHeight);
    for (let i = 0; i < numSlideNotes; i++) {
      this.slideNotePool.push(i);
    }

    // hit notes
    const numHitNotes = [100, 40, 40, 40, 20, 20, 20, 20];
    for (let i = 0; i < 8; i++) {
      const newNote = createNote(
        this.baseNoteWidth + i * this.keyLineWidth,
        0.05,
        true,
        numHitNotes[i]
      );
      this.addNewNote(parentEntity, newNote, keyboardHeight);
      this.hitNotes.push(newNote);

      // add instance indices to pool
      for (let j = 0; j < numHitNotes[i]; j++) {
        this.hitNotePools[i + 1].push(j);
      }
    }

    // hold notes
    const numHoldNotes = 20;
    for (let i = 0; i < numHoldNotes; i++) {
      const newNote = createNote(this.baseNoteWidth, 0.05);
      newNote.object3D.visible = false;
      this.addNewNote(parentEntity, newNote, keyboardHeight);
      this.holdNotes.push(newNote);
      this.holdNotePool.push(i);
    }

    // roll notes
    const numRollNotes = 5;
    for (let i = 0; i < numRollNotes; i++) {
      const newNote = createNote(this.baseNoteWidth, 0.05);
      newNote.object3D.visible = false;
      newNote.mesh.material.uniforms.color.value = COLOR_CYAN;
      this.addNewNote(parentEntity, newNote, keyboardHeight);
      this.rollNotes.push(newNote);
      this.rollNotePool.push(i);
    }
  }

  private addNewNote(
    parentEntity: Entity,
    noteElem: any,
    keyboardHeight: number
  ) {
    const offset = keyboardHeight / 100;
    parentEntity.object3D.add(noteElem.object3D);
    noteElem.object3D.lookAt(this.moveDirection);
    noteElem.mesh.material.uniforms.maxY.value = 2.29 + offset;
    noteElem.mesh.material.uniforms.minY.value = 0.9 + offset;
  }

  public load(map: Beatmap) {
    //todo
  }

  public reset() {
    for (const id of this.activeHoldNotes) {
      this.deactivateHoldNote(id);
    }

    for (const id of this.activeSlideNotes) {
      this.deactivateSlideNote(id);
    }
    this.slideNotes.mesh.instanceMatrix.needsUpdate = true;

    for (let width = 1; width < 9; width++) {
      for (const id of this.activeHitNotes[width]) {
        this.deactivateHitNote(id, width);
      }
      this.hitNotes[width].mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public updateKeyboardHeight(newHeight: number) {
    for (let i = 0; i < this.noteSpawnPoints.length; i++) {
      this.noteSpawnPoints[i].y = this.keyY + this.offsetY + newHeight / 100;
      this.instancedNoteSpawnPoints[i] = this.noteSpawnPoints[i]
        .clone()
        .applyAxisAngle(new Vector3(-1, 0, 0), 10 * MathUtils.DEG2RAD);
    }
    this.holdNotes.forEach((note) => {
      note.mesh.material.uniforms.maxY.value = newHeight / 100 + 2.29;
      note.mesh.material.uniforms.minY.value = newHeight / 100 + 0.9;
    });

    this.rollNotes.forEach((note) => {
      note.mesh.material.uniforms.maxY.value = newHeight / 100 + 2.29;
      note.mesh.material.uniforms.minY.value = newHeight / 100 + 0.9;
    });

    this.hitNotes.forEach((note) => {
      if (note == null) {
        return;
      }
      note.mesh.material.uniforms.maxY.value = newHeight / 100 + 2.29;
      note.mesh.material.uniforms.minY.value = newHeight / 100 + 0.9;
    });
    this.slideNotes.mesh.material.uniforms.maxY.value = newHeight / 100 + 2.29;
    this.slideNotes.mesh.material.uniforms.minY.value = newHeight / 100 + 0.9;
  }

  deactivateHitNote(id: number, width: number) {
    if (this.activeHitNotes[width].delete(id)) {
      this.dummyMatrix.setPosition(BASE_POSITION);
      this.hitNotes[width].mesh.setMatrixAt(id, this.dummyMatrix);
      this.hitNotePools[width].push(id);
    }
  }

  deactivateHoldNote(id: number) {
    if (this.activeHoldNotes.delete(id)) {
      this.holdNotes[id].object3D.visible = false;
      this.holdNotePool.push(id);
    }
  }

  deactivateSlideNote(id: number) {
    if (this.activeSlideNotes.delete(id)) {
      this.dummyMatrix.setPosition(BASE_POSITION);
      this.slideNotes.mesh.setMatrixAt(id, this.dummyMatrix);
      this.slideNotePool.push(id);
    }
  }

  deactivateRollNote(id: number) {
    if (this.activeRollNotes.delete(id)) {
      this.rollNotes[id].object3D.visible = false;
      this.rollNotePool.push(id);
    }
  }

  public deactivateNote(type: number, id: number, width: number) {
    switch (type) {
      case 0:
        this.deactivateHitNote(id, width);
        break;
      case 1:
        this.deactivateSlideNote(id);
        break;
      case 2:
        this.deactivateHoldNote(id);
        break;
      case 3:
        this.deactivateRollNote(id);
        break;
    }
  }

  private spawnHitNote(width: number, key: number, spawnOffset: number) {
    const id = this.hitNotePools[width].pop();
    const spawnPoint = this.instancedNoteSpawnPoints[key];
    const xAdjust = (this.keyLineWidth / 2) * (width - 1);
    this.dummyMatrix.setPosition(
      new Vector3(
        spawnPoint.x + xAdjust,
        spawnPoint.y,
        spawnPoint.z + spawnOffset
      )
    );
    this.hitNotes[width].mesh.setMatrixAt(id, this.dummyMatrix);
    this.activeHitNotes[width].add(id);
    return id;
  }

  private spawnHoldNote(
    width: number,
    key: number,
    note: any,
    spawnOffset: number
  ) {
    const id = this.holdNotePool.pop();
    const spawnPoint = this.noteSpawnPoints[key];
    const newNote = this.holdNotes[id];
    // set the note object
    newNote.mesh.scale.x =
      (this.keyLineWidth * width - 0.02) / this.baseNoteWidth;
    const targetHeight =
      this.baseNoteHeight +
      this.moveAmount * (note["endTime"] - note["startTime"]);
    newNote.mesh.scale.z = targetHeight / this.baseNoteHeight;
    newNote.mesh.position.z = this.baseNoteHeight / 2 - targetHeight / 2;

    const xAdjust = (this.keyLineWidth / 2) * (width - 1);
    newNote.object3D.position.set(
      spawnPoint.x + xAdjust,
      spawnPoint.y,
      spawnPoint.z
    );
    newNote.object3D.translateZ(spawnOffset);
    newNote.object3D.visible = true;
    this.activeHoldNotes.add(id);
    return id;
  }

  private spawnRollNote(
    width: number,
    key: number,
    note: any,
    spawnOffset: number
  ) {
    const id = this.rollNotePool.pop();
    const spawnPoint = this.noteSpawnPoints[key];
    const newNote = this.rollNotes[id];
    // set the note object
    newNote.mesh.scale.x =
      (this.keyLineWidth * width - 0.02) / this.baseNoteWidth;
    const targetHeight =
      this.baseNoteHeight +
      this.moveAmount * (note["endTime"] - note["startTime"]);
    newNote.mesh.scale.z = targetHeight / this.baseNoteHeight;
    newNote.mesh.position.z = this.baseNoteHeight / 2 - targetHeight / 2;

    const xAdjust = (this.keyLineWidth / 2) * (width - 1);
    newNote.object3D.position.set(
      spawnPoint.x + xAdjust,
      spawnPoint.y,
      spawnPoint.z
    );
    newNote.object3D.translateZ(spawnOffset);
    newNote.object3D.visible = true;
    this.activeRollNotes.add(id);
    return id;
  }

  private spawnSlideNote(key: number, spawnOffset: number) {
    const id = this.slideNotePool.pop();
    const spawnPoint = this.instancedNoteSpawnPoints[key];
    this.dummyMatrix.setPosition(
      spawnPoint.x,
      spawnPoint.y,
      spawnPoint.z + spawnOffset
    );
    this.slideNotes.mesh.setMatrixAt(id, this.dummyMatrix);
    this.activeSlideNotes.add(id);
    return id;
  }

  public spawnNewNote(
    type: number,
    width: number,
    key: number,
    note: any,
    spawnOffset: number
  ) {
    switch (type) {
      case 0:
        return this.spawnHitNote(width, key, spawnOffset);
      case 1:
        return this.spawnSlideNote(key, spawnOffset);
      case 2:
        return this.spawnHoldNote(width, key, note, spawnOffset);
      case 3:
        return this.spawnRollNote(width, key, note, spawnOffset);
    }
  }

  public moveActiveNotesForwards(amount: number) {
    this.activeRollNotes.forEach((id) => {
      this.rollNotes[id].object3D.translateZ(amount);
    });

    this.activeHoldNotes.forEach((id) => {
      this.holdNotes[id].object3D.translateZ(amount);
    });

    // slide notes
    this.activeSlideNotes.forEach((id) => {
      this.slideNotes.mesh.getMatrixAt(id, this.dummyMatrix);
      const newPosition = new Vector3().setFromMatrixPosition(this.dummyMatrix);
      newPosition.z += amount;
      this.dummyMatrix.setPosition(newPosition);
      this.slideNotes.mesh.setMatrixAt(id, this.dummyMatrix);
    });

    // hit notes
    for (let i = 1; i < 9; i++) {
      this.activeHitNotes[i].forEach((id) => {
        this.hitNotes[i].mesh.getMatrixAt(id, this.dummyMatrix);
        const newPosition = new Vector3().setFromMatrixPosition(
          this.dummyMatrix
        );
        newPosition.z += amount;
        this.hitNotes[i].mesh.setMatrixAt(
          id,
          this.dummyMatrix.setPosition(newPosition)
        );
      });
      this.hitNotes[i].mesh.instanceMatrix.needsUpdate = true;
    }
    this.slideNotes.mesh.instanceMatrix.needsUpdate = true;
  }
}
