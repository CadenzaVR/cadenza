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
      imageSrc: "images/beethoven.jpg",
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
      imageSrc: "images/beethoven.jpg",
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
      imageSrc: "images/debussy.jpg",
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
      imageSrc: "images/satie.jpg",
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
      imageSrc: "images/mozart.jpeg",
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
      imageSrc: "images/joplin.jpg",
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
        type: "7",
        language: "",
        genre: "",
        tags: [],
        srcFormat: "json",
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
    this.gameModeSelect = document.getElementById("game-mode-select");
    this.gameModeSelect.addEventListener("change", (event) => {
      const gameMode = event.detail.value;
      this.selectedGameMode = gameMode;
      this.el.dispatchEvent(
        new CustomEvent("game-mode-change", { detail: gameMode })
      );
      this.updateSongs();
    });

    this.songSelect = document.getElementById("song-select");

    this.difficultySelect = document.getElementById("difficulty-select");
    this.difficultySelect.addEventListener("change", (event) => {
      const currentSong =
        this.songs[
          this.songSelect.components["windowed-selector"].currentIndex
        ];
      const currentDifficulty = event.detail.value;
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

    // Selected song info display elements
    this.selectedSongTitle = document.getElementById("title-text");
    this.selectedSongArtist = document.getElementById("artist-text");
    this.selectedSongMapper = document.getElementById("mapper-text");

    this.songSelect.components["windowed-selector"].setSources(
      this.songs.map((song) => song.info.imageSrc)
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

    const mapUrls = new URLSearchParams(window.location.search).getAll(
      "beatmap"
    );

    mapUrls.forEach((url) => {
      this.loadBeatmapFromUrl(decodeURI(url));
    });

    this.selectCurrentSong();
  },

  loadBeatmapFromArrayBuffer: function (buffer, saveBeatmap=false) {
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

  loadBeatmapFromUrl: function (url, saveBeatmap=false) {
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

  selectCurrentSong: async function () {
    const currentSong =
      this.songs[this.songSelect.components["windowed-selector"].currentIndex];

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
      let audioSrc = currentSong.info.audioSrc;
      if (!isNaN(audioSrc)) {
        if (this.currentAudioObjectUrl) {
          URL.revokeObjectURL(this.currentAudioObjectUrl);
        }
        const song = await this.beatmapRepo.getSong(audioSrc);
        this.currentAudioObjectUrl = URL.createObjectURL(song.data);
        audioSrc = this.currentAudioObjectUrl;
      }
      this.audio.src = audioSrc;
      this.audio.currentTime = 3;
      if (this.playTimeout) {
        clearTimeout(this.playTimeout);
      }
      this.playTimeout = setTimeout(() => {
        try {
          this.audio.play();
        } catch (e) {
          console.error(e);
        }
      }, 200);
    }
  },

  shiftSongItemsLeft: function () {
    this.songSelect.components["windowed-selector"].shiftLeft();
    this.selectCurrentSong();
  },

  shiftSongItemsRight: function () {
    this.songSelect.components["windowed-selector"].shiftRight();
    this.selectCurrentSong();
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
