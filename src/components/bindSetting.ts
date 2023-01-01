AFRAME.registerComponent("bind-setting", {
  schema: {
    settingName: { type: "string" },
    boundComponent: { type: "string" },
    boundComponentAttribute: { type: "string" },
  },
  init: function () {
    const settingsSystem = this.el.sceneEl.systems.setting;
    settingsSystem.settingsManager.addObserver(
      this.data.settingName,
      (newValue: string) => {
        this.el.setAttribute(
          this.data.boundComponent,
          this.data.boundComponentAttribute,
          newValue
        );
      }
    );
  },
});
