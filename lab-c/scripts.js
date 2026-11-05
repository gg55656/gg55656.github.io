// Poprawki błędów, pomoc z niektórymi elementami, mała refaktoryzacja kodu aby był bardziej czytelny via GPT 6.1 Terra

const mapElement = document.querySelector("#map");
const locationButton = document.querySelector("#location-button");
const downloadButton = document.querySelector("#download-button");
const mapCanvas = document.querySelector("#map-canvas");
const piecesTray = document.querySelector("#pieces-tray");
const puzzleBoard = document.querySelector("#puzzle-board");

const GRID_SIZE = 4;
const PIECE_COUNT = GRID_SIZE * GRID_SIZE;
const PIECE_SIZE = 64;

let map;
let locationMarker;
let puzzleSolved = false;
let draggedPiece = null;

function initializeMap() {
  map = L.map(mapElement).setView([52.2297, 21.0122], 13);

  const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    crossOrigin: "anonymous",
    maxZoom: 19,
  });

  tiles.on("loading", () => downloadButton.disabled = true);
  tiles.on("load", () => downloadButton.disabled = false);
  tiles.addTo(map);
  window.addEventListener("resize", () => map.invalidateSize());
}

function showLocation() {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    console.log("Współrzędne:", lat, lng);
    map.flyTo([lat, lng], 15);

    if (locationMarker) {
      locationMarker.setLatLng([lat, lng]);
    } else {
      locationMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#2f7db4",
        fillOpacity: 1,
      }).addTo(map);
    }
  }, (error) => console.error("Błąd lokalizacji:", error));
}

function drawMap() {
  const mapRect = mapElement.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  mapCanvas.width = Math.round(mapRect.width * scale);
  mapCanvas.height = Math.round(mapRect.height * scale);
  const context = mapCanvas.getContext("2d");

  mapElement.querySelectorAll(".leaflet-tile-pane img.leaflet-tile").forEach((tile) => {
    const rect = tile.getBoundingClientRect();
    context.drawImage(tile, (rect.left - mapRect.left) * scale, (rect.top - mapRect.top) * scale,
      rect.width * scale, rect.height * scale);
  });

}

function createPuzzleImage() {
  const canvas = document.createElement("canvas");
  const size = Math.min(mapCanvas.width, mapCanvas.height);
  canvas.width = GRID_SIZE * PIECE_SIZE;
  canvas.height = GRID_SIZE * PIECE_SIZE;
  canvas.getContext("2d").drawImage(mapCanvas,
    (mapCanvas.width - size) / 2, (mapCanvas.height - size) / 2, size, size,
    0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function createSlots() {
  puzzleBoard.replaceChildren();
  for (let index = 0; index < PIECE_COUNT; index++) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = index;
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("drop", dropOnSlot);
    puzzleBoard.append(slot);
  }
}

function createPieces(image) {
  const pieces = [];
  piecesTray.replaceChildren();
  createSlots();
  puzzleSolved = false;

  for (let index = 0; index < PIECE_COUNT; index++) {
    const piece = document.createElement("div");
    piece.className = "puzzle-piece";
    piece.dataset.index = index;
    piece.style.backgroundImage = `url(${image})`;
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    piece.style.backgroundPosition = `${col * 100 / (GRID_SIZE - 1)}% ${row * 100 / (GRID_SIZE - 1)}%`;
    piece.draggable = true;
    piece.addEventListener("dragstart", () => draggedPiece = piece);
    piece.addEventListener("dragend", () => draggedPiece = null);
    pieces.push(piece);
  }

  for (let index = pieces.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pieces[index], pieces[randomIndex]] = [pieces[randomIndex], pieces[index]];
  }
  piecesTray.append(...pieces);
}

function dropOnSlot(event) {
  event.preventDefault();
  if (!draggedPiece) return;

  const slot = event.currentTarget;
  const oldPiece = slot.querySelector(".puzzle-piece");
  if (oldPiece && oldPiece !== draggedPiece) {
    piecesTray.append(oldPiece);
  }
  slot.append(draggedPiece);
  checkPuzzle();
}

function dropOnTray(event) {
  event.preventDefault();
  if (!draggedPiece) return;

  const before = event.target.closest(".puzzle-piece");
  if (before !== draggedPiece) {
    piecesTray.insertBefore(draggedPiece, before);
  }
  checkPuzzle();
}

function checkPuzzle() {
  const slots = [...puzzleBoard.querySelectorAll(".slot")];
  const allCorrect = slots.every((slot) => {
    const piece = slot.querySelector(".puzzle-piece");
    return piece && piece.dataset.index === slot.dataset.index;
  });

  if (allCorrect && !puzzleSolved) {
    console.debug("Puzzle ułożone poprawnie!");
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Brawo! Puzzle ułożone 🎉");
    }
  }
  puzzleSolved = allCorrect;
}

piecesTray.addEventListener("dragover", (event) => event.preventDefault());
piecesTray.addEventListener("drop", dropOnTray);
locationButton.addEventListener("click", showLocation);
downloadButton.addEventListener("click", () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
  drawMap();
  createPieces(createPuzzleImage());
});

initializeMap();
createSlots();
