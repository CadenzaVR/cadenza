import MicroModal from "micromodal";

AFRAME.registerSystem("ui", {
  schema: {}, // System schema. Parses into `this.data`.

  init: function () {
    // Help button and upload button
    this.el.addEventListener("loaded", () => {
      const uiButtons = document.querySelector(".a-enter-vr");

      const helpButton = document.createElement("button");
      helpButton.classList.add("a-enter-vr-button", "help-button");
      helpButton.setAttribute(
        "style",
        "background-image: url(/images/help_icon.svg);"
      );
      helpButton.setAttribute("data-micromodal-trigger", "help-modal");
      helpButton.setAttribute("title", "How To Play");
      uiButtons.appendChild(helpButton);

      const loadFileButton = document.createElement("button");
      loadFileButton.classList.add("a-enter-vr-button", "load-file-button");
      loadFileButton.setAttribute(
        "style",
        "background-image: url(/images/file_upload_icon.svg);"
      );
      loadFileButton.setAttribute("data-micromodal-trigger", "load-file-modal");
      loadFileButton.setAttribute("title", "Load Beatmap");
      uiButtons.appendChild(loadFileButton);

      // Handle custom beatmap loading
    this.saveImportedBeatmapCheck = document.getElementById(
      "save-imported-check"
    );

    const menu = document.getElementById("menu") as any;
    document
      .getElementById("beatmap-input")
      .addEventListener("change", async () => {
        for (const file of (document.getElementById("beatmap-input") as HTMLInputElement).files) {
          if (file.name === "beatmaps.txt") {
            file.text().then(async (text: string) => {
              const urls = text.split(/\r?\n/);
              for (const url of urls) {
                await menu.components.menu.loadBeatmapFromUrl(url, this.saveImportedBeatmapCheck.checked);
              }
            });
          } else {
            await file.arrayBuffer().then((buffer: ArrayBuffer) => {
              menu.components.menu.loadBeatmapFromArrayBuffer(buffer, this.saveImportedBeatmapCheck.checked);
            });
          }
        }
      });

    document
      .getElementById("beatmap-folder-import-button")
      .addEventListener("click", async () => {
        const directoryHandle = await (window as any).showDirectoryPicker();
        for await (const entry of directoryHandle.values()) {
          if (entry.kind === "file" && entry.name.endsWith(".osz")) {
            const file = await entry.getFile();
            const buffer = await file.arrayBuffer();
            await menu.components.menu.loadBeatmapFromArrayBuffer(buffer, this.saveImportedBeatmapCheck.checked);
          }
        }
      });

    document
      .getElementById("url-input-button")
      .addEventListener("click", () => {
        const url = (document.getElementById("url-input") as HTMLInputElement).value;
        menu.components.menu.loadBeatmapFromUrl(url, this.saveImportedBeatmapCheck.checked);
      });
      MicroModal.init();
    });
  },
});
