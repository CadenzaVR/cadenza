AFRAME.registerSystem("setting", {
  schema: {}, // System schema. Parses into `this.data`.

  init: function () {
    this.settings = {};
    const storedSettings = localStorage.getItem("settings");
    if (storedSettings) {
      this.settings = JSON.parse(storedSettings);
    }
  },

  registerSetting: function (settingName, settingEl, settingComponent) {
    settingEl.addEventListener("change", (e) => {
      this.settings[settingName] = e.detail.value;
      localStorage.setItem("settings", JSON.stringify(this.settings));
    });

    const storedValue = this.settings[settingName];
    if (storedValue) {
      settingEl.addEventListener("loaded", () => {
        settingEl.setAttribute(settingComponent, "value", storedValue);
      });
    } else {
      //trigger update to save initial values
      settingEl.addEventListener("loaded", () => {
        settingEl.components[settingComponent].update();
      });
    }
  },
});

AFRAME.registerComponent("setting", {
  schema: {
    name: { type: "string" },
    component: { type: "string" },
  },

  init: function () {
    this.system.registerSetting(this.data.name, this.el, this.data.component);
  },
});
