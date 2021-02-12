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

function createTextButton(width, text) {
  const textElem = createTextElement(width);
  textElem.setAttribute("value", text);
  const buttonElem = document.createElement("a-entity");
  buttonElem.setAttribute("geometry", {
    primitive: "roundedRect",
    width: 0.04 * text.length,
    height: 0.07,
  });
  buttonElem.setAttribute("material", {
    shader: "flat",
    color: "#aaa",
  });
  buttonElem.setAttribute("button", "");
  buttonElem.setAttribute("clickable", "");
  buttonElem.object3D.position.set(0, -0.02, 0);
  textElem.appendChild(buttonElem);
  return {
    object3D: textElem.object3D,
    textEl: textElem,
    buttonEl: buttonElem,
  };
}

function createTriangleButton(width, height) {
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
    color: "#aaa",
  });
  buttonElem.setAttribute("button", "");
  buttonElem.setAttribute("clickable", {
    activationTime: 1,
    showProgressRing: false,
    repeatOnHold: true,
  });
  return buttonElem;
}

export { createTextElement, createTextButton, createTriangleButton };
