import Beatmap from "../models/Beatmap";
import BeatmapInfo from "../models/BeatmapInfo";
import BeatmapSet from "../models/BeatmapSet";

const axios = require("axios").default;
const jsmediatags = require("jsmediatags");
const JSZip = require("jszip");
const OsuParser = require("osu-parser-web");

function convertOsuBeatmap(osuBeatmap) {
  const beatmap = {
    song: osuBeatmap.Title,
    songFile: osuBeatmap.AudioFilename,
    difficulty: osuBeatmap.OverallDifficulty,
    difficultyName: osuBeatmap.Version,
    tags: osuBeatmap.Tags.split(" "),
    mode: osuBeatmap.Mode,
    artist: osuBeatmap.Artist,
    mapper: osuBeatmap.Creator,
    image: osuBeatmap.bgFilename,
    sections: [
      {
        bpm: osuBeatmap.bpmMax,
        duration: osuBeatmap.totalTime, //seconds
        notes: [],
      },
    ],
  };

  let bpm = 0;
  let prevBpm;
  let prevOffset;
  let startTime = 0;
  for (let i = 0; i < osuBeatmap.timingPoints.length; i++) {
    const timingPoint = osuBeatmap.timingPoints[i];

    if (i != 0) {
      bpm += prevBpm * (timingPoint.offset - prevOffset);
    } else {
      startTime = timingPoint.offset;
    }

    if (i == osuBeatmap.timingPoints.length - 1) {
      bpm +=
        timingPoint.bpm * (osuBeatmap.totalTime * 1000 - timingPoint.offfset);
    }

    prevBpm = timingPoint.bpm;
    prevOffset = timingPoint.offfset;
  }
  bpm /= osuBeatmap.totalTime * 1000 - startTime;
  beatmap.sections[0].bpm = +(bpm / 1000).toFixed(2);

  let prevKat = null;
  osuBeatmap.hitObjects.forEach((hitObject) => {
    const note = [null, null, null, null];
    note[2] = hitObject.startTime;
    if (osuBeatmap.Mode == 1) {
      if (
        hitObject.objectName == "slider" ||
        hitObject.objectName == "spinner"
      ) {
        note[0] = 3;
        note[1] = 3;
        note[3] = 2;
        note.push(hitObject.endTime);
      } else {
        note[0] = 0;
        if (
          hitObject.soundTypes.indexOf("whistle") != -1 ||
          hitObject.soundTypes.indexOf("clap") != -1
        ) {
          // kat
          note[1] = prevKat == 5 ? 2 : 5;
          note[3] = 1;
          prevKat = note[1];
        } else {
          // don
          note[1] = 3;
          note[3] = 2;
          prevKat = null;
        }

        if (hitObject.soundTypes.indexOf("finish") != -1) {
          const note2 = note.slice();
          if (note[1] == 3) {
            //don
            note2[1] = 4;
            note[3] = 1;
            note2[3] = 1;
          } else {
            //kat
            note[1] = 2;
            note2[1] = 5;
          }
          beatmap.sections[0].notes.push(note2);
        }
      }
    } else if (osuBeatmap.Mode == 3) {
      note[0] = 0;
      note[1] = Math.floor(
        (hitObject.position[0] * osuBeatmap.CircleSize) / 512
      );
      note[3] = 1;
      if (hitObject.endTime) {
        note[0] = 2;
        note.push(hitObject.endTime);
      }
    }
    beatmap.sections[0].notes.push(note);
  });
  return beatmap;
}

async function loadBeatmap(zip) {
  const beatmapInfo = new BeatmapInfo();
  const beatmaps = [];
  const files = [];
  zip.forEach((path, file) => files.push(path));
  for (const path of files) {
    const file = zip.file(path);
    if (path.endsWith(".json")) {
      await file.async("text").then((text) => {
        const beatmap = JSON.parse(text);
        beatmap.mode = 7;
        beatmaps.push(beatmap);
      });
    } else if (path.endsWith(".osu")) {
      await file.async("text").then((text) => {
        const osuBeatmap = OsuParser.parseContent(text);
        if (osuBeatmap.Mode == 1 || osuBeatmap.Mode == 3) {
          //taiko maps work best
          beatmaps.push(convertOsuBeatmap(osuBeatmap));
        }
      });
    }
  }

  let beatmap = beatmaps[0];
  beatmapInfo.artist = beatmap.artist;
  beatmapInfo.creator = beatmap.mapper;
  beatmapInfo.mode = beatmap.mode;
  beatmapInfo.tags = beatmap.tags;
  beatmapInfo.name = beatmap.song.repeat(1);

  if (beatmap.image && beatmap.image.trim() != "") {
    await zip
      .file(beatmap.image)
      .async("blob")
      .then((blob) => {
        const image = new Image();
        image.id = "image-" + Date.now();
        image.src = URL.createObjectURL(blob);
        document.querySelector("a-assets").appendChild(image);
        beatmapInfo.imageSrc = "#" + image.id;
      });
  }
  let songBlob;
  await zip
    .file(beatmap.songFile)
    .async("blob")
    .then((blob) => {
      songBlob = blob;
      beatmapInfo.audioSrc = URL.createObjectURL(blob);
    });

  await new Promise((resolve, reject) => {
    jsmediatags.read(songBlob, {
      onSuccess: (result) => {
        const tags = result.tags;
        if (!beatmapInfo.name || beatmapInfo.name.trim() == "") {
          beatmapInfo.name = tags.title;
        }
        if (!beatmapInfo.artist || beatmapInfo.artist.trim() == "") {
          beatmapInfo.artist = tags.artist;
        }
        if (!beatmapInfo.imageSrc && tags.picture) {
          const { data, type } = tags.picture;
          const byteArray = new Uint8Array(data);
          const image = new Image();
          image.id = "image-" + Date.now();
          image.src = URL.createObjectURL(new Blob([byteArray], { type }));
          document.querySelector("a-assets").appendChild(image);
          beatmapInfo.imageSrc = "#" + image.id;
        }
        resolve();
      },
      onError: (err) => {
        console.error(err);
        resolve();
      },
    });
  });

  beatmaps.sort((a, b) => a.difficulty - b.difficulty);
  const beatmapSet = new BeatmapSet({
    beatmapInfo: beatmapInfo,
    beatmaps: [],
  });

  for (let i = 0; i < beatmaps.length; i++) {
    const beatmap = beatmaps[i];
    beatmap.song = beatmapInfo.audioSrc;
    beatmapSet.beatmaps.push(
      new Beatmap({
        beatmapInfo: new BeatmapInfo({
          creator: beatmap.mapper,
        }),
        difficulty: beatmap.difficulty,
        difficultyName: beatmap.difficultyName,
        mapSrc: URL.createObjectURL(
          new Blob([JSON.stringify(beatmap)], { type: "application/json" })
        ),
      })
    );
  }

  return beatmapSet;
}

export const BeatmapLoader = () => ({
  loadBeatmap: (data) => {
    return new Promise((resolve, reject) => {
      const zip = new JSZip();
      zip.loadAsync(data).then(() => {
        loadBeatmap(zip).then((song) => resolve(song));
      });
    });
  },

  loadBeatmapFromUrl: (url, onDownloadProgress) => {
    return new Promise((resolve, reject) => {
      axios
        .get(url, {
          onDownloadProgress: onDownloadProgress,
          responseType: "blob",
        })
        .then((res) => res.data)
        .then((file) => {
          const zip = new JSZip();
          zip.loadAsync(file).then(() => {
            loadBeatmap(zip).then((song) => resolve(song));
          });
        });
    });
  },
});
