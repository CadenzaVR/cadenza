/* eslint-disable @typescript-eslint/no-var-requires */

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
    tags: osuBeatmap.tagsArray,
    mode: osuBeatmap.Mode,
    artist: osuBeatmap.Artist,
    mapper: osuBeatmap.Creator,
    image: osuBeatmap.bgFilename,
    sections: [
      {
        bpm: osuBeatmap.bpmMax,
        duration: osuBeatmap.totalTime, //seconds
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
        timingPoint.bpm * (osuBeatmap.totalTime * 1000 - timingPoint.offset);
    }

    prevBpm = timingPoint.bpm;
    prevOffset = timingPoint.offset;
  }
  bpm /= osuBeatmap.totalTime * 1000 - startTime;
  beatmap.sections[0].bpm = +(bpm / 1000).toFixed(2);

  return beatmap;
}

async function loadBeatmap(zip) {
  const setInfo = {};
  const beatmaps = [];
  const files = [];
  zip.forEach((path, file) => files.push(path));
  for (const path of files) {
    const file = zip.file(path);
    if (path.endsWith(".json")) {
      setInfo.srcFormat = "jsonv1";
      await file.async("text").then((text) => {
        const beatmap = JSON.parse(text);
        beatmap.raw = text;
        beatmap.mode = 7;
        beatmaps.push(beatmap);
      });
    } else if (path.endsWith(".osu")) {
      await file.async("text").then((text) => {
        const osuBeatmap = OsuParser.parseContent(text);
        if (osuBeatmap.Mode == 1 || osuBeatmap.Mode == 3) {
          setInfo.srcFormat = "osu" + osuBeatmap.fileFormat;
          //taiko maps work best
          const beatmap = convertOsuBeatmap(osuBeatmap);
          beatmap.raw = text;
          beatmaps.push(beatmap);
        }
      });
    }
  }

  let beatmap = beatmaps[0];
  setInfo.song = beatmap.song.repeat(1);
  setInfo.artist = beatmap.artist;
  setInfo.creator = beatmap.mapper;
  setInfo.type = beatmap.mode;
  setInfo.tags = beatmap.tags;

  if (beatmap.image && beatmap.image.trim() != "") {
    await zip
      .file(beatmap.image)
      .async("blob")
      .then((blob) => {
        const image = new Image();
        image.id = "image-" + Date.now();
        image.src = URL.createObjectURL(blob);
        document.querySelector("a-assets").appendChild(image);
        setInfo.imageSrc = "#" + image.id;
      });
  }
  let songBlob;
  await zip
    .file(beatmap.songFile)
    .async("blob")
    .then((blob) => {
      songBlob = blob;
      setInfo.audioSrc = URL.createObjectURL(blob);
    });

  await new Promise((resolve, reject) => {
    jsmediatags.read(songBlob, {
      onSuccess: (result) => {
        const tags = result.tags;
        if (!setInfo.song || setInfo.song.trim() == "") {
          setInfo.song = tags.title;
        }
        if (!setInfo.artist || setInfo.artist.trim() == "") {
          setInfo.artist = tags.artist;
        }
        if (!setInfo.imageSrc && tags.picture) {
          const { data, type } = tags.picture;
          const byteArray = new Uint8Array(data);
          const image = new Image();
          image.id = "image-" + Date.now();
          image.src = URL.createObjectURL(new Blob([byteArray], { type }));
          document.querySelector("a-assets").appendChild(image);
          setInfo.imageSrc = "#" + image.id;
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
  const beatmapSet = {
    info: setInfo,
    beatmaps: [],
  };

  for (let i = 0; i < beatmaps.length; i++) {
    const beatmap = beatmaps[i];
    beatmapSet.beatmaps.push({
      id: null,
      info: {
        name: beatmap.difficultyName,
        creator: beatmap.mapper,
        difficulty: beatmap.difficulty,
        src: URL.createObjectURL(
          new Blob([beatmap.raw], { type: "text/plain" })
        ),
      },
      notes: null,
      set: beatmapSet,
    });
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
