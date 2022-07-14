const MoveDirection = Object.freeze({
  LEFT: 0,
  RIGHT: 1,
});

AFRAME.registerComponent("windowed-selector", {
  schema: {
    maxVisibleItems: { type: "number", default: 1 },
    imageWidth: { type: "number", default: 1 },
    imageHeight: { type: "number", default: 1 },
    spacing: { type: "number", default: 0.1 },
  },

  init: function () {
    this.currentIndex = 0;
    this.sources = [];
    for (let child of this.el.children) {
      if (child.tagName == "img" && child.getAttribute("src") != null) {
        this.sources.push(child.getAttribute("src"));
      }
    }
    this.itemPool = [];

    this.imageWidth = this.data.imageWidth;
    this.imageHeight = this.data.imageHeight;
    this.spacing = this.data.spacing;
    this.maxVisibleItems = this.data.maxVisibleItems;

    this.activeItems = [].fill(null, 0, this.maxVisibleItems);

    // Initialize items starting from center and extending right
    const numVisible = Math.min(
      this.maxVisibleItems,
      Math.ceil(this.maxVisibleItems / 2)
    );
    const width = this.imageWidth + this.spacing;
    for (let i = 0; i <= this.maxVisibleItems; i++) {
      const imageItem = this.createImageItem();
      imageItem.object3D.position.set(width * i, 0, 0);

      if (i >= numVisible) {
        imageItem.object3D.visible = false;
        this.itemPool.push(imageItem);
      } else {
        this.activeItems[i + numVisible - 1] = imageItem;
      }
    }
    this.activeItems[Math.floor(this.maxVisibleItems / 2)].setAttribute(
      "opacity",
      1
    );
  },

  setSources: function (newSources) {
    this.sources = newSources;
    const indexOffset = Math.floor(this.maxVisibleItems / 2);
    for (let i = 0; i < this.maxVisibleItems; i++) {
      const sourceIndex = this.currentIndex + i - indexOffset;
      if (
        this.activeItems[i] &&
        sourceIndex >= 0 &&
        sourceIndex < this.sources.length
      ) {
        this.activeItems[i].setAttribute("src", this.sources[sourceIndex]);
      }
    }
  },

  createImageItem: function () {
    const imageItem = document.createElement("a-image");
    imageItem.setAttribute("width", this.imageWidth);
    imageItem.setAttribute("height", this.imageHeight);
    imageItem.setAttribute("opacity", 0.25);
    this.el.appendChild(imageItem);
    return imageItem;
  },

  getEnteringItem: function (direction) {
    const halfWindow = 1 + Math.floor(this.maxVisibleItems / 2);
    let enteringX = halfWindow * (this.imageWidth + this.spacing);
    let enteringIndex = this.currentIndex;
    if (direction === MoveDirection.RIGHT) {
      enteringIndex += halfWindow;
    } else if (direction === MoveDirection.LEFT) {
      enteringIndex -= halfWindow;
      enteringX *= -1;
    }

    if (enteringIndex < 0 || enteringIndex >= this.sources.length) return null;

    const imageItem = this.itemPool.pop();
    imageItem.setAttribute("src", this.sources[enteringIndex]);
    imageItem.object3D.position.setX(enteringX);
    return imageItem;
  },

  shiftActiveItems: function (direction) {
    let moveAmount = this.imageWidth + this.spacing;
    if (direction === MoveDirection.RIGHT) {
      moveAmount *= -1;
    }
    for (let imageItem of this.activeItems) {
      if (imageItem) {
        const initialX = imageItem.object3D.position.x;
        imageItem.object3D.position.setX(initialX + moveAmount);
      }
    }
  },

  shift: function (direction) {
    // if first, going left or last index going right, do nothing
    if (
      (this.currentIndex == 0 && direction == MoveDirection.LEFT) ||
      (this.currentIndex >= this.sources.length - 1 &&
        direction == MoveDirection.RIGHT)
    ) {
      return;
    }

    this.activeItems[Math.floor(this.maxVisibleItems / 2)].setAttribute(
      "opacity",
      0.25
    );

    const enteringImageItem = this.getEnteringItem(direction);
    if (enteringImageItem) {
      enteringImageItem.object3D.visible = true;
    }

    // add entering song items
    // move all active song items
    // remove leaving song items from active
    // update current index
    let leavingImageItem;

    if (direction === MoveDirection.RIGHT) {
      this.activeItems.push(enteringImageItem);
      this.shiftActiveItems(direction);
      leavingImageItem = this.activeItems.shift();
      this.currentIndex += 1;
    } else if (direction === MoveDirection.LEFT) {
      this.activeItems.unshift(enteringImageItem);
      this.shiftActiveItems(direction);
      leavingImageItem = this.activeItems.pop();
      this.currentIndex -= 1;
    }

    // hide leaving song item and add to the item pool
    if (leavingImageItem) {
      leavingImageItem.object3D.visible = false;
      this.itemPool.push(leavingImageItem);
    }

    // highlight selected item
    this.activeItems[Math.floor(this.maxVisibleItems / 2)].setAttribute(
      "opacity",
      1
    );

    return this.currentIndex;
  },

  shiftLeft: function () {
    return this.shift(MoveDirection.LEFT);
  },

  shiftRight: function () {
    return this.shift(MoveDirection.RIGHT);
  },
});
