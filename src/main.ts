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

// Game state ------------------------------------------------------------------
let heldToken: number | null = null;
const cellMemory = new Map<string, number>();

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
      heldTokenDisplay.innerHTML =
        `🎉VICTOY🎉You have an extremely powerful token ${heldToken}!`;
    }
  } else {
    heldTokenDisplay.innerHTML = "Not holding any token.";
  }
}

// player movement functions ------------------------------------------------------------------

function movePlayer(latOffset: number, lngOffset: number) {
  playerLat += latOffset * TILE_DEGREES;
  playerLng += lngOffset * TILE_DEGREES;

  const newPosition = leaflet.latLng(playerLat, playerLng);
  playerMarker.setLatLng(newPosition);
  map.setView(newPosition);
  redrawGrid();
}

// create movement button event listeners

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

// center map on player movement --------------------------------------------------------------
map.on("moveend", () => {
  const center = map.getCenter();
  playerLat = center.lat;
  playerLng = center.lng;
  playerMarker.setLatLng(center);
  redrawGrid();
});

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

  // Use luck() to determine if the cell has a token
  const cellI = Math.floor(playerLat / TILE_DEGREES) + i;
  const cellJ = Math.floor(playerLng / TILE_DEGREES) + j;
  const key = `${cellI},${cellJ}`;
  const distance = Math.max(Math.abs(i), Math.abs(j));

  // If out of interaction range, show "???"
  if (distance > INTERACTION_RANGE) {
    zone.bindTooltip("???");
    return;
  }

  let value: number | null = null;
  if (cellMemory.has(key)) {
    value = cellMemory.get(key)!;
  } else {
    const newValue = Math.floor(luck(`${cellI},${cellJ}`) * 10);
    if (newValue > 2) {
      value = newValue;
      cellMemory.set(key, value);
    }
  }

  if (value !== null) {
    zone.bindTooltip(`${value}`, { permanent: true, direction: "center" });
  } else {
    zone.bindTooltip("Empty");
  }

  zone.on("click", () => {
    const currentValue = cellMemory.get(key) ?? null;

    if (heldToken === null && currentValue !== null) {
      heldToken = currentValue;
      cellMemory.delete(key);
      zone.unbindTooltip();
      updateStatusPanel(`Picked up token of value ${heldToken}`);
      updateHeldTokenDisplay();
      return;
    } else if (heldToken !== null && currentValue === heldToken) {
      const combined = heldToken * 2;
      cellMemory.set(key, combined);
      zone.bindTooltip(`${combined}`, { permanent: true, direction: "center" });
      updateStatusPanel(`Combined tokens! Created value ${combined}!`);
      heldToken = null;
      updateHeldTokenDisplay();
      if (combined >= 32) {
        updateStatusPanel(`You crafted a high-value token (${combined})!`);
      }
      return;
    } else if (heldToken !== null && currentValue === null) {
      cellMemory.set(key, heldToken);
      zone.bindTooltip(`${heldToken}`, {
        permanent: true,
        direction: "center",
      });
      updateStatusPanel(`Dropped token of value ${heldToken}`);
      heldToken = null;
      updateHeldTokenDisplay();
    } else {
      updateStatusPanel("No token to pick up here.");
      updateHeldTokenDisplay();
    }
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
redrawGrid();
