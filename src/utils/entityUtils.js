function createTextElement(
  width,
  align = "center",
  font = "/fonts/SpaceMono-Regular-msdf.json",
  negate = false
) {
  const elem = document.createElement("a-text");
  elem.setAttribute("width", width);
  elem.setAttribute("font", font);
  elem.setAttribute("negate", negate);
  elem.setAttribute("align", align);
  return elem;
}

function createTriangleButton(
  width,
  height,
  color = "#aaa",
  opacity = 1,
  isTransparent = false,
  highlightColor = "#aaa",
  highlightOpacity = 1
) {
  const buttonElem = document.createElement("a-entity");
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  buttonElem.setAttribute("geometry", {
    primitive: "triangle",
    vertexB: -halfWidth + " " + halfHeight + " 0",
    vertexA: halfWidth + " 0 0",
    vertexC: -halfWidth + " " + -halfHeight + " 0",
  });
  buttonElem.setAttribute("material", {
    shader: "flat",
    color: color,
    opacity: opacity,
    transparent: isTransparent,
  });
  buttonElem.setAttribute("button", {
    highlightColor: highlightColor,
    highlightOpacity: highlightOpacity,
  });
  buttonElem.setAttribute("clickable", {
    activationTime: 1,
    showProgressRing: false,
    repeatOnHold: true,
  });
  buttonElem.setAttribute("collider", {
    group: "menu",
    static: true,
  });
  buttonElem.setAttribute("shape", {
    type: "rect",
  });
  return buttonElem;
}

export { createTextElement, createTriangleButton };
