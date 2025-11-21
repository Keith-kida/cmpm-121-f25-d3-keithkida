// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets ------------------------------------------------------------------
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // student-controlled page style

// Fix missing marker images ------------------------------------------------------------------
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function ------------------------------------------------------------------
import luck from "./_luck.ts";

// Map zone constants ------------------------------------------------------------------
const CLASSROOM_LATLNG = leaflet.latLng(
  0,
  0,
);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const GRID_SIZE = 24;
const INTERACTION_RANGE = 3;

// UI Elements ------------------------------------------------------------------
const controlPanelDiv = document.createElement("div");
controlPanelDiv.id = "controlPanel";
document.body.append(controlPanelDiv);

const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const statusPanelDiv = document.createElement("div");
statusPanelDiv.id = "statusPanel";
document.body.append(statusPanelDiv);
statusPanelDiv.innerHTML = "no points";

const heldTokenDisplay = document.createElement("div");
heldTokenDisplay.id = "heldTokenDisplay";
controlPanelDiv.append(heldTokenDisplay);

const newGameButton = document.createElement("button");
newGameButton.innerText = "New Game";
newGameButton.onclick = () => {
  localStorage.removeItem("gameState");
  cellMemory.clear();
  heldToken = null;
  playerLat = 0;
  playerLng = 0;
  loadingSavedGame = false;

  const newPos = leaflet.latLng(playerLat, playerLng);
  playerMarker.setLatLng(newPos);
  map.setView(newPos);
  saveGameState();
  redrawGrid();
};
document.body.append(newGameButton);

let loadingSavedGame = false;

// player control ----------------------------------------------------------------

const movementInstructions = document.createElement("div");
movementInstructions.id = "movementInstructions";
movementInstructions.innerHTML = `
      <div style="
        display: grid;
        grid-template-columns: 60px 60px 60px;
        grid-template-rows: 60px 60px 60px;
        justify-content: center;
        align-items: center;
        gap: 5px;
      ">
        <button id="moveNorth" style="color: green; background-color: cyan; grid-column: 2; grid row: 1; width:60px; height:60px;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <span>↑</span>
            <span>North</span>
          </div>
        </button>


        <button id="moveWest" style="color: green; background-color: cyan; grid-column: 1; grid row: 2; width:60px; height:60px;">
          <div style="display: flex; flex-direction: row; align-items: center;">
            <span>←</span>
            <span>West</span>
          </div>
        </button>


        <button id="moveEast" style="color: green; background-color: cyan; grid-column: 3; grid row: 2; width:60px; height:60px;">
          <div style="display: flex; flex-direction: row; align-items: center;">
            <span>East</span>
            <span>→</span>
          </div>
        </button>


        <button id="moveSouth" style="color: green; background-color: cyan; grid-column: 2; grid row: 3; width:60px; height:60px;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <span>South</span>
            <span>↓</span>
          </div>
        </button>
      </div>
      <br/>
      Use the buttons to move your player marker around the map.`;
controlPanelDiv.append(movementInstructions);

// Player position ------------------------------------------------------------------

let playerLat = CLASSROOM_LATLNG.lat;
let playerLng = CLASSROOM_LATLNG.lng;

let lastCellI = 0;
let lastCellJ = 0;

// Game state ------------------------------------------------------------------
let heldToken: number | null = null;
const cellMemory = new Map<string, number | null>();

function saveGameState() {
  const state = {
    playerLat,
    playerLng,
    heldToken,
    cellMemory: Array.from(cellMemory.entries()),
  };
  localStorage.setItem("gameState", JSON.stringify(state));
}

function loadGameState() {
  const data = localStorage.getItem("gameState");
  if (!data) return;

  loadingSavedGame = true;

  const state = JSON.parse(data);
  playerLat = state.playerLat;
  playerLng = state.playerLng;
  heldToken = state.heldToken;
  cellMemory.clear();

  for (const [key, value] of state.cellMemory) {
    cellMemory.set(key, value);
  }

  const restoredPosition = leaflet.latLng(playerLat, playerLng);
  playerMarker.setLatLng(restoredPosition);
  map.setView(restoredPosition);
}

interface movementController {
  start(): void;
  stop(): void;
}

// Update functions ------------------------------------------------------------------
function updateStatusPanel(message: string) {
  statusPanelDiv.innerHTML = message;
}

function updateHeldTokenDisplay() {
  if (heldToken !== null) {
    heldTokenDisplay.innerHTML = `Holding token of value: ${heldToken}`;
    if (heldToken >= 16) {
      updateStatusPanel(`You have a powerful token ${heldToken}!`);
    }
    if (heldToken >= 32) {
      heldTokenDisplay.innerHTML = `
          <div style="font-size: 3rem; font-weight: 700; text-align: center;">
            🎉 VICTORY  You have an extremely powerful token (${heldToken})!🎉
          </div>
        `;
    }
  } else {
    heldTokenDisplay.innerHTML = "Not holding any token.";
  }
}

// player movement functions ------------------------------------------------------------------

function latLngToCell(lat: number, lng: number) {
  const cellI = Math.floor(lat / TILE_DEGREES);
  const cellJ = Math.floor(lng / TILE_DEGREES);
  return [cellI, cellJ];
}

function movePlayer(latOffset: number, lngOffset: number) {
  playerLat += latOffset * TILE_DEGREES;
  playerLng += lngOffset * TILE_DEGREES;

  const newPosition = leaflet.latLng(playerLat, playerLng);
  playerMarker.setLatLng(newPosition);
  map.setView(newPosition);
  redrawGrid();
  saveGameState();
}

function movePlayerTo(lat: number, lng: number) {
  playerLat = lat;
  playerLng = lng;

  const [cellI, cellJ] = latLngToCell(lat, lng);

  if (cellI !== lastCellI || cellJ !== lastCellJ) {
    lastCellI = cellI;
    lastCellJ = cellJ;
  }

  const newPosition = leaflet.latLng(playerLat, playerLng);
  playerMarker.setLatLng(newPosition);
  map.setView(newPosition);
  redrawGrid();
  saveGameState();
}

// Movement controllers ------------------------------------------------------------------

class buttonMovementController implements movementController {
  start() {
    document.getElementById("moveNorth")?.addEventListener(
      "click",
      () => movePlayer(1, 0),
    );
    document.getElementById("moveSouth")?.addEventListener(
      "click",
      () => movePlayer(-1, 0),
    );
    document.getElementById("moveEast")?.addEventListener(
      "click",
      () => movePlayer(0, 1),
    );
    document.getElementById("moveWest")?.addEventListener(
      "click",
      () => movePlayer(0, -1),
    );
  }

  stop() {}
}

class geoMovementController implements movementController {
  watchId: number | null = null;

  constructor(private moveToFn: (lat: number, lng: number) => void) {}

  start() {
    if (!navigator.geolocation) {
      updateStatusPanel("Geolocation is not supported by your browser.");
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        movePlayerTo(lat, lng);
        map.panTo([lat, lng]);
        redrawGrid();
        saveGameState();
      },
      (error) => {
        updateStatusPanel(`Geo error: ${error.message}`);
      },
      { enableHighAccuracy: true },
    );
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }
}

// Initialize the map ------------------------------------------------------------------
const mapElement = document.getElementById("map");
if (!mapElement) {
  throw new Error("Map element not found");
}

const map = leaflet.map(mapElement, {
  center: CLASSROOM_LATLNG,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Add base tile layer
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Add player marker ------------------------------------------------------------------

const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("Player");
playerMarker.addTo(map);

map.on("moveend", () => {
  redrawGrid();
});

// center map on player movement --------------------------------------------------------------

function chooseMovementController(): movementController {
  const urlParams = new URLSearchParams(globalThis.location.search);
  const controllerType = urlParams.get("movement");

  if (controllerType === "geo") {
    return new geoMovementController(movePlayerTo);
  } else {
    return new buttonMovementController();
  }
}

// function to create grid and token logic ------------------------------------------------------------------
const gridLayer = leaflet.layerGroup().addTo(map);

function drawGrid(i: number, j: number) {
  const origin = leaflet.latLng(playerLat, playerLng);
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  const zone = leaflet.rectangle(bounds, { color: "white", weight: 1 });
  zone.addTo(gridLayer);

  const cellI = Math.floor(playerLat / TILE_DEGREES) + i;
  const cellJ = Math.floor(playerLng / TILE_DEGREES) + j;
  const key = `${cellI},${cellJ}`;
  const distance = Math.max(Math.abs(i), Math.abs(j));

  // Outside range = hidden

  if (!cellMemory.has(key)) {
    const newValue = Math.floor(luck(`${cellI},${cellJ}`) * 10);
    if (newValue > 2) {
      cellMemory.set(key, newValue);
    } else {
      cellMemory.set(key, null);
    }

    if (!loadingSavedGame) saveGameState();
  }

  const stored = cellMemory.get(key);

  // Outside range → hide contents
  if (distance > INTERACTION_RANGE) {
    zone.bindTooltip("???");
    return;
  }

  // Inside range → show real contents
  if (stored === null) {
    zone.bindTooltip("Empty");
  } else {
    zone.bindTooltip(`${stored}`, { permanent: true, direction: "center" });
  }

  // Interaction logic
  zone.on("click", () => {
    const currentValue = cellMemory.get(key) ?? null;

    // generate token using luck()
    if (currentValue === null && heldToken === null) {
      const newValue = Math.floor(luck(`${cellI},${cellJ}`) * 10);
      if (newValue > 2) {
        cellMemory.set(key, newValue);
        zone.bindTooltip(`${newValue}`, {
          permanent: true,
          direction: "center",
        });
        saveGameState();
      }
      return;
    }

    // pick up token
    if (heldToken === null && currentValue !== null) {
      heldToken = currentValue;
      cellMemory.set(key, null);
      zone.unbindTooltip();
      updateHeldTokenDisplay();
      updateStatusPanel(`Picked up token of value ${heldToken}`);
      saveGameState();
      return;
    }

    // combine tokens
    if (heldToken !== null && currentValue === heldToken) {
      const combined = heldToken * 2;
      cellMemory.set(key, combined);
      zone.bindTooltip(`${combined}`, { permanent: true, direction: "center" });
      heldToken = null;
      updateHeldTokenDisplay();
      updateStatusPanel(`Combined tokens! New value ${combined}`);
      saveGameState();
      return;
    }

    // drop token
    if (heldToken !== null && currentValue === null) {
      cellMemory.set(key, heldToken);
      zone.bindTooltip(`${heldToken}`, {
        permanent: true,
        direction: "center",
      });
      heldToken = null;
      updateHeldTokenDisplay();
      updateStatusPanel(`Dropped token.`);
      saveGameState();
      return;
    }

    updateStatusPanel("Cannot interact with this cell.");
  });
}

function redrawGrid() {
  gridLayer.clearLayers();

  for (let i = -GRID_SIZE; i < GRID_SIZE; i++) {
    for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
      drawGrid(i, j);
    }
  }
}

// Draw the grid ------------------------------------------------------------------

loadGameState();
redrawGrid();

const controller = chooseMovementController();
controller.start();
