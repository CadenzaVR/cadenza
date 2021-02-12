import { BeatmapLoader } from "../utils/BeatmapLoader";

const MenuState = Object.freeze({
  SONG_SELECT: 0,
  DIFFICULTY_SELECT: 1,
});

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
        beatmapInfo: {},
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/elise_easy.json",
      },
      {
        beatmapInfo: {},
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/elise.json",
      },
    ],
    isDefault: true,
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
        beatmapInfo: {},
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/moonlight_sonata.json",
      },
    ],
    isDefault: true,
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
        beatmapInfo: {},
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/clair_de_lune_easy.json",
      },
      {
        beatmapInfo: {},
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/clair_de_lune.json",
      },
    ],
    isDefault: true,
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
        beatmapInfo: {},
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/gymnopedie_1_easy.json",
      },
      {
        beatmapInfo: {},
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/gymnopedie_1.json",
      },
    ],
    isDefault: true,
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
        beatmapInfo: {},
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/rondo_alla_turca_easy.json",
      },
      {
        beatmapInfo: {},
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/rondo_alla_turca.json",
      },
      {
        beatmapInfo: {},
        difficulty: SongDifficulty.HARD,
        difficultyName: "Hard",
        mapSrc: "beatmaps/rondo_alla_turca_hard.json",
      },
    ],
    isDefault: true,
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
        beatmapInfo: {},
        difficulty: SongDifficulty.EASY,
        difficultyName: "Easy",
        mapSrc: "beatmaps/the_entertainer_easy.json",
      },
      {
        beatmapInfo: {},
        difficulty: SongDifficulty.MEDIUM,
        difficultyName: "Medium",
        mapSrc: "beatmaps/the_entertainer.json",
      },
    ],
    isDefault: true,
  },
].sort((a, b) => a.beatmapInfo.name.localeCompare(b.beatmapInfo.name));

AFRAME.registerComponent("menu", {
  init: function () {
    this.songs = songs;
    this.currentState = MenuState.SONG_SELECT;

    this.beatmapLoader = BeatmapLoader();
    this.customMapUrls = new Set([]);

    this.songSelect = document.getElementById("song-select");

    this.difficultySelect = document.getElementById("difficulty-select");
    this.difficultySelect.addEventListener("change", (event) => {
      const currentSong = this.songs[
        this.songSelect.components["windowed-selector"].currentIndex
      ];
      const currentDifficulty = event.detail.value;
      if (
        currentSong.beatmaps[currentDifficulty] &&
        currentSong.beatmaps[currentDifficulty].beatmapInfo.creator
      ) {
        this.selectedSongMapper.setAttribute(
          "value",
          "Mapped by: " +
            currentSong.beatmaps[currentDifficulty].beatmapInfo.creator
        );
      } else {
        this.selectedSongMapper.setAttribute(
          "value",
          "Mapped by: " + currentSong.beatmapInfo.creator
        );
      }
    });

    this.saveButton = document.getElementById("save-button");

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

    // Handle custom beatmap loading
    document.getElementById("beatmap-input").onchange = () => {
      const file = document.getElementById("beatmap-input").files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.beatmapLoader
          .loadBeatmap(reader.result)
          .then((song) => this.addNewSong(song));
      };
      reader.readAsArrayBuffer(file);
    };

    document.getElementById("url-input-button").onclick = () => {
      const url = document.getElementById("url-input").value;
      this.beatmapLoader
        .loadBeatmapFromUrl(url, this.dispatchProgressEvent)
        .then((song) => {
          this.el.dispatchEvent(new Event("downloadComplete"));
          this.addSongFromUrl(song, url);
        });
    };

    this.songSelect.components["windowed-selector"].setSources(
      this.songs.map((song) => song.beatmapInfo.imageSrc)
    );

    const mapUrls = new URLSearchParams(window.location.search).getAll(
      "beatmap"
    );

    mapUrls.forEach((url) => {
      const decodedUrl = decodeURI(url);
      this.beatmapLoader
        .loadBeatmapFromUrl(decodedUrl, this.dispatchProgressEvent)
        .then((song) => {
          this.el.dispatchEvent(new Event("downloadComplete"));
          this.addSongFromUrl(song, decodedUrl);
        });
    });

    this.selectCurrentSong();
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
    this.songs.push(song);
    this.songs.sort((a, b) =>
      a.beatmapInfo.name.localeCompare(b.beatmapInfo.name)
    );
    const targetIndex = this.songs.indexOf(song);
    this.songSelect.components["windowed-selector"].setSources(
      this.songs.map((song) => song.beatmapInfo.imageSrc)
    );
    while (
      this.songSelect.components["windowed-selector"].currentIndex < targetIndex
    ) {
      this.songSelect.components["windowed-selector"].shiftRight();
    }
    while (
      this.songSelect.components["windowed-selector"].currentIndex > targetIndex
    ) {
      this.songSelect.components["windowed-selector"].shiftLeft();
    }
    this.selectCurrentSong();
  },

  selectCurrentSong: function () {
    const currentSong = this.songs[
      this.songSelect.components["windowed-selector"].currentIndex
    ];

    this.saveButton.object3D.visible =
      !currentSong.isDefault && !currentSong.isSaved;

    this.selectedSongTitle.setAttribute("value", currentSong.beatmapInfo.name);
    this.selectedSongArtist.setAttribute(
      "value",
      currentSong.beatmapInfo.artist
    );
    this.selectedSongMapper.setAttribute(
      "value",
      "Mapped by: " + currentSong.beatmapInfo.creator
    );
    this.updateDifficulty();
    if (this.el.object3D.visible) {
      this.el.dispatchEvent(new Event("songSelected"));
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
    const currentSong = this.songs[
      this.songSelect.components["windowed-selector"].currentIndex
    ];

    this.difficultySelect.setAttribute(
      "spinner",
      "displayedValues",
      currentSong.beatmaps
        .map((song) =>
          song.difficultyName ? song.difficultyName : song.difficulty
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
