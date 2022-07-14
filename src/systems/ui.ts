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
      MicroModal.init();
    });
  },
});
