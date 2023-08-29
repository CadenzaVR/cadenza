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

    this.activeItems = [];

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
        this.activeItems.push(imageItem);
      }
    }
    this.getSelectedItem().setAttribute("opacity", 1);
  },

  getSelectedItem: function () {
    let targetIndex = Math.floor(this.maxVisibleItems / 2);
    if (this.currentIndex < targetIndex) {
      targetIndex = this.currentIndex;
    } else if (this.currentIndex > this.sources.length - 1 - targetIndex) {
      targetIndex =
        this.activeItems.length - (this.sources.length - this.currentIndex);
    }
    return this.activeItems[targetIndex];
  },

  setSources: function (newSources) {
    this.sources = newSources;
    if (this.currentIndex >= this.sources.length) {
      this.currentIndex = this.sources.length / 2;
    }
    this.loadActiveImages();
  },

  loadActiveImages: function () {
    const startIndex = Math.max(
      this.currentIndex - Math.floor(this.maxVisibleItems / 2),
      0
    );
    for (let i = 0; i < this.activeItems.length; i++) {
      const item = this.activeItems[i];
      item.setAttribute("src", this.sources[startIndex + i]);
    }
  },

  jumpToSource: function (source) {
    let index = this.sources.indexOf(source);
    if (index < 0) {
      index = Math.floor(this.sources.length / 2);
    }
    this.jumpToIndex(index);
  },

  jumpToIndex: function (index) {
    index = Math.max(0, Math.min(index, this.sources.length - 1));
    if (index === this.currentIndex) return false;
    this.currentIndex = index;
    const indexOffset = Math.floor(this.maxVisibleItems / 2);
    const width = this.imageWidth + this.spacing;
    while (this.activeItems.length < this.maxVisibleItems) {
      this.activeItems.push(this.itemPool.pop());
    }
    for (let i = 0; i < this.maxVisibleItems; i++) {
      const sourceIndex = this.currentIndex + i - indexOffset;
      const item = this.activeItems.shift();
      item.object3D.position.set(width * (i - indexOffset), 0, 0);
      if (sourceIndex >= 0 && sourceIndex < this.sources.length) {
        this.activeItems.push(item);
        item.object3D.visible = true;
        item.setAttribute("opacity", i === indexOffset ? 1 : 0.25);
        item.setAttribute("src", this.sources[sourceIndex]);
      } else {
        item.object3D.visible = false;
        this.itemPool.push(item);
      }
    }
    return true;
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

    this.getSelectedItem().setAttribute("opacity", 0.25);

    const enteringImageItem = this.getEnteringItem(direction);
    if (enteringImageItem) {
      enteringImageItem.object3D.visible = true;
      if (direction === MoveDirection.RIGHT) {
        this.activeItems.push(enteringImageItem);
      } else if (direction === MoveDirection.LEFT) {
        this.activeItems.unshift(enteringImageItem);
      }
    }

    // add entering song items
    // move all active song items
    // remove leaving song items from active
    // update current index
    let leavingImageItem;

    this.shiftActiveItems(direction);
    if (direction === MoveDirection.RIGHT) {
      if (this.activeItems.length > this.maxVisibleItems) {
        leavingImageItem = this.activeItems.shift();
      }
      this.currentIndex += 1;
    } else if (direction === MoveDirection.LEFT) {
      if (this.activeItems.length > this.maxVisibleItems) {
        leavingImageItem = this.activeItems.pop();
      }
      this.currentIndex -= 1;
    }

    // hide leaving song item and add to the item pool
    if (leavingImageItem) {
      leavingImageItem.object3D.visible = false;
      this.itemPool.push(leavingImageItem);
    }

    // highlight selected item
    this.getSelectedItem().setAttribute("opacity", 1);

    return this.currentIndex;
  },

  shiftLeft: function () {
    return this.jumpToIndex(this.currentIndex - 1);
  },

  shiftRight: function () {
    return this.jumpToIndex(this.currentIndex + 1);
  },
});
