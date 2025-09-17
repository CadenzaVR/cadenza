import { SUPPORTED_BEATMAP_TYPES } from "../game/GameModes";
import { BeatmapLoader } from "../utils/BeatmapLoader";

const SongDifficulty = Object.freeze({
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
});

const songs = [
  {
    beatmapInfo: {
      name: "Fur Elise",
      artist: "Ludwig van Beethoven",
      creator: "Oliver Fei",
      imageSrc: "#beethoven",
      audioSrc: "beatmaps/elise.ogg",
    },
    beatmaps: [
      {
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/elise_easy.json",
      },
      {
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/elise.json",
      },
    ],
  },
  {
    beatmapInfo: {
      name: "Moonlight Sonata",
      artist: "Ludwig van Beethoven",
      creator: "Oliver Fei",
      imageSrc: "#beethoven",
      audioSrc: "beatmaps/moonlight_sonata.ogg",
    },
    beatmaps: [
      {
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/moonlight_sonata.json",
      },
    ],
  },
  {
    beatmapInfo: {
      name: "Clair de Lune",
      artist: "Claude Debussy",
      creator: "Oliver Fei",
      imageSrc: "#debussy",
      audioSrc: "beatmaps/clair_de_lune.ogg",
    },
    beatmaps: [
      {
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/clair_de_lune_easy.json",
      },
      {
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/clair_de_lune.json",
      },
    ],
  },
  {
    beatmapInfo: {
      name: "Gymnopedie no 1",
      artist: "Eric Satie",
      creator: "Oliver Fei",
      imageSrc: "#satie",
      audioSrc: "beatmaps/gymnopedie_1.ogg",
    },
    beatmaps: [
      {
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/gymnopedie_1_easy.json",
      },
      {
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/gymnopedie_1.json",
      },
    ],
  },
  {
    beatmapInfo: {
      name: "Rondo Alla Turca",
      artist: "Wolfgang Amadeus Mozart",
      creator: "Oliver Fei",
      imageSrc: "#mozart",
      audioSrc: "beatmaps/rondo_alla_turca.ogg",
    },
    beatmaps: [
      {
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/rondo_alla_turca_easy.json",
      },
      {
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/rondo_alla_turca.json",
      },
      {
        difficulty: SongDifficulty.HARD,
        difficultyName: "Hard",
        mapSrc: "beatmaps/rondo_alla_turca_hard.json",
      },
    ],
  },
  {
    beatmapInfo: {
      name: "The Entertainer",
      artist: "Scott Joplin",
      creator: "Oliver Fei",
      imageSrc: "#joplin",
      audioSrc: "beatmaps/the_entertainer.ogg",
    },
    beatmaps: [
      {
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/the_entertainer_easy.json",
      },
      {
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/the_entertainer.json",
      },
    ],
  },
]
  .sort((a, b) => a.beatmapInfo.name.localeCompare(b.beatmapInfo.name))
  .map((data) => {
    const beatmapSet = {
      info: {
        song: data.beatmapInfo.name,
        artist: data.beatmapInfo.artist,
        creator: data.beatmapInfo.creator,
        imageSrc: data.beatmapInfo.imageSrc,
        audioSrc: data.beatmapInfo.audioSrc,
        type: data.beatmapInfo.type ? data.beatmapInfo.type : "7",
        language: "",
        genre: "",
        tags: [],
        srcFormat: data.beatmapInfo.srcFormat
          ? data.beatmapInfo.srcFormat
          : "json",
      },
      beatmaps: [],
      isDefault: true,
    };
    for (const map of data.beatmaps) {
      beatmapSet.beatmaps.push({
        id: map.mapSrc,
        info: {
          name: map.difficultyName,
          difficulty: map.difficulty,
          src: map.mapSrc,
        },
        notes: null,
        set: beatmapSet,
      });
    }
    return beatmapSet;
  });

const taikoSongs = [
  {
    info: {
      artist: "Namco",
      creator: "OnosakiHito",
      imageSrc: "#basic",
      song: "TBT Basic Pattern Training",
      srcFormat: "osuv14",
      tags: ["Taiko", "TBT"],
      type: "1",
    },
    beatmaps: [
      {
        info: {
          name: "1step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "2step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "3step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "4step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "5step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "6step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "7step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "8step [Basic]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "9step [Basic]",
          difficulty: "3",
        },
      },
    ],
  },
  {
    info: {
      artist: "Namco",
      creator: "OnosakiHito",
      imageSrc: "#intermediate",
      song: "TBT Intermediate Pattern Training",
      srcFormat: "osuv14",
      tags: ["Taiko", "TBT"],
      type: "1",
    },
    beatmaps: [
      {
        info: {
          name: "1step [Intermediate]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "9step [Intermediate]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "6step [Intermediate]",
          difficulty: "4",
        },
      },
      {
        info: {
          name: "2step [Intermediate]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "3step [Intermediate]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "4step [Intermediate]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "5step [Intermediate]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "7step [Intermediate]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "8step [Intermediate]",
          difficulty: "5",
        },
      },
    ],
  },
  {
    info: {
      artist: "Namco",
      creator: "OnosakiHito",
      imageSrc: "#advance",
      song: "TBT Advance Pattern Training",
      srcFormat: "osuv14",
      tags: ["Taiko", "TBT"],
      type: "1",
    },
    beatmaps: [
      {
        info: {
          name: "9step [Advance]",
          difficulty: "3",
        },
      },
      {
        info: {
          name: "1step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "2step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "3step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "4step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "5step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "6step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "7-2step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "7step [Advance]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "8step [Advance]",
          difficulty: "5",
        },
      },
    ],
  },
  {
    info: {
      artist: "Namco",
      creator: "OnosakiHito",
      imageSrc: "#extra",
      song: "TBT Extra Pattern Training",
      srcFormat: "osuv14",
      tags: ["Taiko", "TBT"],
      type: "1",
    },
    beatmaps: [
      {
        info: {
          name: "1step [Extra]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "2step [Extra]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "3step [Extra]",
          difficulty: "5",
        },
      },
      {
        info: {
          name: "4step [Extra]",
          difficulty: "5",
        },
      },
    ],
  },
];

for (const song of taikoSongs) {
  song.info.audioSrc =
    "https://beatmaps.cadenzavr.com/file/cadenza-beatmaps/SONG_WTOU150.mp3";
  for (const beatmap of song.beatmaps) {
    beatmap.set = song;
    beatmap.info.src =
      "beatmaps/taiko/" +
      `${song.info.artist} - ${song.info.song} (${song.info.creator}) [${beatmap.info.name}]` +
      ".osu";
    beatmap.id = beatmap.info.src;
  }
  song.isDefault = true;
  songs.push(song);
}

const tonoSongs = [
  {
    id: null,
    info: {
      song: "Air, from Suite No.3 in D",
      artist: "BachJS",
      creator: "",
      imageSrc: "",
      audioSrc: "/beatmaps/tono/air-tromb.mid",
      type: "8",
      language: "",
      genre: "",
      tags: [],
      srcFormat: "midi",
      src: "/beatmaps/tono/air-tromb.mid",
    },
    beatmaps: [
      { id: "1", info: { name: "alto", type: "8" }, notes: null, set: null },
      {
        id: "2",
        info: { name: "tenorOne", type: "8" },
        notes: null,
        set: null,
      },
      {
        id: "3",
        info: { name: "tenorTwo", type: "8" },
        notes: null,
        set: null,
      },
      { id: "4", info: { name: "bass", type: "8" }, notes: null, set: null },
    ],
  },
  {
    id: null,
    info: {
      song: "The Blue Danube Waltz (main theme)",
      artist: "StraussJJ",
      creator: "",
      imageSrc: "",
      audioSrc: "/beatmaps/tono/blue_danube.mid",
      type: "8",
      language: "",
      genre: "",
      tags: [],
      srcFormat: "midi",
      src: "/beatmaps/tono/blue_danube.mid",
    },
    beatmaps: [
      {
        id: "0",
        info: { name: "up:upper", type: "8" },
        notes: null,
        set: null,
      },
      {
        id: "1",
        info: { name: "down:lower", type: "10" },
        notes: null,
        set: null,
      },
    ],
  },
  {
    id: null,
    info: {
      song: "Canon per 3 Violini e Basso",
      artist: "PachelbelJ",
      creator: "",
      imageSrc: "",
      audioSrc: "/beatmaps/tono/canon_per_3_violini_e_basso.mid",
      type: "8",
      language: "",
      genre: "",
      tags: [],
      srcFormat: "midi",
      src: "/beatmaps/tono/canon_per_3_violini_e_basso.mid",
    },
    beatmaps: [
      {
        id: "0",
        info: { name: "violinI:", type: "8" },
        notes: null,
        set: null,
      },
      {
        id: "1",
        info: { name: "violinII:", type: "8" },
        notes: null,
        set: null,
      },
      {
        id: "2",
        info: { name: "violinIII:", type: "8" },
        notes: null,
        set: null,
      },
      {
        id: "3",
        info: { name: "violoncello:", type: "8" },
        notes: null,
        set: null,
      },
    ],
  },
  {
    id: null,
    info: {
      song: "The First Noel (hymntune)",
      artist: "Traditional",
      creator: "",
      imageSrc: "",
      audioSrc: "/beatmaps/tono/first_noel.mid",
      type: "8",
      language: "",
      genre: "",
      tags: [],
      srcFormat: "midi",
      src: "/beatmaps/tono/first_noel.mid",
    },
    beatmaps: [
      {
        id: "1",
        info: { name: "trombone1", type: "8" },
        notes: null,
        set: null,
      },
      { id: "2", info: { name: "lower", type: "10" }, notes: null, set: null },
      {
        id: "1",
        info: { name: "trombone2", type: "8" },
        notes: null,
        set: null,
      },
    ],
  },
];
const tonoKaraokeSongs = [
  {
    id: null,
    info: {
      song: "Greensleeves",
      artist: "Traditional",
      creator: "",
      imageSrc: "",
      audioSrc: "/beatmaps/tono/karaoke/greensleeves_guitar.mid",
      type: "9",
      language: "",
      genre: "",
      tags: [],
      srcFormat: "midi",
      src: "/beatmaps/tono/karaoke/greensleeves_guitar.mid",
    },
    beatmaps: [
      { id: "0", info: { name: "melody", type: "8" }, notes: null, set: null },
      {
        id: "1",
        info: { name: "acoustic guitar (nylon) 0", type: "10" },
        notes: null,
        set: null,
      },
      {
        id: "0",
        info: { name: "acoustic grand piano 0", type: "8" },
        notes: null,
        set: null,
      },
    ],
  },
];

tonoSongs.forEach((song) => {
  song.info.imageSrc = "/images/mutopia.jpg";
  song.beatmaps.forEach((beatmap) => {
    beatmap.set = song;
    beatmap.info.src = song.info.src;
  });
  song.isDefault = true;
  songs.push(song);
});
tonoKaraokeSongs.forEach((song) => {
  song.info.imageSrc = "/images/mutopia.jpg";
  song.beatmaps.forEach((beatmap) => {
    beatmap.set = song;
    beatmap.info.src = song.info.src;
  });
  song.isDefault = true;
  songs.push(song);
});

AFRAME.registerComponent("menu", {
  init: function () {
    this.beatmapRepo = this.el.sceneEl.systems["db"].beatmapSetRepository;
    this.songs = songs;
    this.audio = new Audio();
    this.audio.volume = 0.5;
    this.selectedGameMode = 0;

    this.beatmapLoader = BeatmapLoader();
    this.customMapUrls = new Set([]);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        this.onDocumentLoaded();
      });
    } else {
      this.onDocumentLoaded();
    }
  },

  onDocumentLoaded: async function () {
    // Selected song info display elements
    this.selectedSongTitle = document.getElementById("title-text");
    this.selectedSongArtist = document.getElementById("artist-text");
    this.selectedSongMapper = document.getElementById("mapper-text");

    const mapUrls = new URLSearchParams(window.location.search).getAll(
      "beatmap"
    );
    if (mapUrls.length > 0) {
      this.el.dispatchEvent(new Event("downloadStart"));
    }
    this.gameModeSelect = document.getElementById("game-mode-select");
    this.gameModeSelect.addEventListener("change", (event) => {
      const gameMode = event.detail.value;
      this.selectedGameMode = gameMode;
      this.updateSongs();
      this.el.dispatchEvent(
        new CustomEvent("game-mode-change", { detail: gameMode })
      );
    });

    this.songSelect = document.getElementById("song-select");

    this.difficultySelect = document.getElementById("difficulty-select");
    this.difficultySelect.addEventListener("change", (event) => {
      const currentSong =
        this.songs[
          this.songSelect.components["windowed-selector"].currentIndex
        ];
      const currentDifficulty = event.detail.value;
      this.el.dispatchEvent(
        new CustomEvent("difficulty-change", { detail: currentDifficulty })
      );
      if (
        currentSong.beatmaps[currentDifficulty] &&
        currentSong.beatmaps[currentDifficulty].info.creator
      ) {
        this.selectedSongMapper.setAttribute(
          "value",
          "Mapped by: " + currentSong.beatmaps[currentDifficulty].info.creator
        );
      } else {
        this.selectedSongMapper.setAttribute(
          "value",
          "Mapped by: " + currentSong.info.creator
        );
      }
    });

    this.saveButton = document.getElementById("save-button");
    this.saveButton.addEventListener("click", () => {
      const selectedBeatmapSet = this.getSelectedBeatmapSet();
      if (!selectedBeatmapSet.isDefault) {
        if (!selectedBeatmapSet.isSaved) {
          this.saveButton.object3D.visible = false;
          this.beatmapRepo.saveBeatmapSet(selectedBeatmapSet).then(() => {
            selectedBeatmapSet.isSaved = true;
          });
        } else {
          //todo
        }
      }
    });

    // Song shift buttons
    const shiftLeftButton = document.getElementById("shift-left-button");
    shiftLeftButton.components.button.registerClickHandler(() =>
      this.shiftSongItemsLeft()
    );

    const shiftRightButton = document.getElementById("shift-right-button");
    shiftRightButton.components.button.registerClickHandler(() =>
      this.shiftSongItemsRight()
    );

    await this.beatmapRepo.getBeatmapSets().then((beatmapSets) => {
      for (let item of beatmapSets) {
        const image = new Image();
        image.id = "image-saved-" + item.id;
        image.src = item.info.imageSrc;
        document.querySelector("a-assets").appendChild(image);
        item.info.imageSrc = "#" + image.id;

        this.addNewSong(item, true);
      }
    });

    mapUrls.forEach(async (url) => {
      await this.loadBeatmapFromUrl(decodeURI(url));
    });

    this.updateSongs();
  },

  loadBeatmapFromArrayBuffer: function (buffer, saveBeatmap = false) {
    return this.beatmapLoader.loadBeatmap(buffer).then((song) => {
      this.addNewSong(song);
      if (saveBeatmap) {
        this.saveButton.object3D.visible = false;
        this.beatmapRepo.saveBeatmapSet(song).then(() => {
          song.isSaved = true;
        });
      }
    });
  },

  loadBeatmapFromUrl: function (url, saveBeatmap = false) {
    return this.beatmapLoader
      .loadBeatmapFromUrl(url, this.dispatchProgressEvent)
      .then((song) => {
        this.el.dispatchEvent(new Event("downloadComplete"));
        this.addSongFromUrl(song, url);
        if (saveBeatmap) {
          this.saveButton.object3D.visible = false;
          this.beatmapRepo.saveBeatmapSet(song).then(() => {
            song.isSaved = true;
          });
        }
      });
  },

  dispatchProgressEvent: function (event) {
    let el = this.el;
    if (!el) {
      el = document.querySelector("#menu");
    }
    el.dispatchEvent(
      new ProgressEvent("progress", {
        lengthComputable: true,
        loaded: event.loaded,
        total: event.total,
      })
    );
  },

  addSongFromUrl: function (song, url) {
    this.addNewSong(song);
    this.customMapUrls.add(encodeURI(url));
    const updatedUrl =
      "/?beatmap=" + Array.from(this.customMapUrls).join("&beatmap=");
    history.replaceState({}, "", updatedUrl);
  },

  addNewSong: function (song, isSaved = false) {
    song.isSaved = isSaved;
    if (!isSaved) {
      const currentGameMode =
        this.gameModeSelect.components["spinner"].data.value;

      for (const i of Object.keys(SUPPORTED_BEATMAP_TYPES)) {
        const gameMode = parseInt(i);
        if (
          SUPPORTED_BEATMAP_TYPES[gameMode].primary.includes(
            parseInt(song.info.type)
          )
        ) {
          if (currentGameMode != gameMode) {
            this.gameModeSelect.setAttribute("spinner", "value", gameMode);
            this.gameModeSelect.components.spinner.update();
            this.selectedGameMode = gameMode;
          }
          break;
        }
      }
    }
    songs.push(song);
    this.updateSongs(song.info.imageSrc);
  },

  updateSongs: function (targetSource = null) {
    if (!targetSource) {
      targetSource =
        this.songSelect.components["windowed-selector"].sources[
          this.songSelect.components["windowed-selector"].currentIndex
        ];
    }

    this.songs = songs
      .filter((song) => {
        return (
          SUPPORTED_BEATMAP_TYPES[this.selectedGameMode].primary.indexOf(
            parseInt(song.info.type)
          ) !== -1 ||
          SUPPORTED_BEATMAP_TYPES[this.selectedGameMode].secondary.indexOf(
            parseInt(song.info.type)
          ) !== -1
        );
      })
      .sort((a, b) => a.info.song.localeCompare(b.info.song));
    this.songSelect.components["windowed-selector"].setSources(
      this.songs.map((song) => song.info.imageSrc)
    );
    this.songSelect.components["windowed-selector"].jumpToSource(targetSource);
    this.selectCurrentSong();
  },

  selectCurrentSong: async function (songChanged = true) {
    if (!songChanged) return;
    const currentSong =
      this.songs[this.songSelect.components["windowed-selector"].currentIndex];

    this.el.dispatchEvent(
      new CustomEvent("song-change", { detail: currentSong })
    );

    this.saveButton.object3D.visible =
      !currentSong.isDefault && !currentSong.isSaved;

    this.selectedSongTitle.setAttribute("value", currentSong.info.song);
    this.selectedSongArtist.setAttribute("value", currentSong.info.artist);
    this.selectedSongMapper.setAttribute(
      "value",
      "Mapped by: " + currentSong.info.creator
    );
    this.updateDifficulty();
    if (this.el.object3D.visible) {
      if (this.playTimeout) {
        clearTimeout(this.playTimeout);
      }
      this.playTimeout = setTimeout(async () => {
        let audioSrc = currentSong.info.audioSrc;
        this.audio.pause();
        this.el.sceneEl.systems["audio"].audioManager.midiPlayer.pause();
        if (!isNaN(audioSrc)) {
          if (this.currentAudioObjectUrl) {
            URL.revokeObjectURL(this.currentAudioObjectUrl);
          }
          const song = await this.beatmapRepo.getSong(audioSrc);
          this.currentAudioObjectUrl = URL.createObjectURL(song.data);
          audioSrc = this.currentAudioObjectUrl;
        }
        if (currentSong.info.srcFormat === "midi") {
          const midiPlayer =
            this.el.sceneEl.systems["audio"].audioManager.midiPlayer;
          await midiPlayer.loadArrayBuffer(
            await fetch(audioSrc).then((response) => response.arrayBuffer())
          );
          await midiPlayer.play();
        } else {
          this.audio.src = audioSrc;
          this.audio.currentTime = 3;
          try {
            this.audio.play();
          } catch (e) {
            console.error(e);
          }
        }
      }, 200);
    }
  },

  shiftSongItemsLeft: function () {
    this.selectCurrentSong(
      this.songSelect.components["windowed-selector"].shiftLeft()
    );
  },

  shiftSongItemsRight: function () {
    this.selectCurrentSong(
      this.songSelect.components["windowed-selector"].shiftRight()
    );
  },

  updateDifficulty: function () {
    const currentSong =
      this.songs[this.songSelect.components["windowed-selector"].currentIndex];

    this.difficultySelect.setAttribute(
      "spinner",
      "displayedValues",
      currentSong.beatmaps
        .map((beatmap) =>
          beatmap.info.name ? beatmap.info.name : beatmap.info.difficulty
        )
        .join("|")
    );
    this.difficultySelect.setAttribute(
      "spinner",
      "max",
      currentSong.beatmaps.length - 1
    );
  },

  getSelectedMap: function () {
    return this.songs[
      this.songSelect.components["windowed-selector"].currentIndex
    ].beatmaps[this.difficultySelect.components["spinner"].data.value];
  },

  getSelectedBeatmapSet: function () {
    return this.songs[
      this.songSelect.components["windowed-selector"].currentIndex
    ];
  },
});
