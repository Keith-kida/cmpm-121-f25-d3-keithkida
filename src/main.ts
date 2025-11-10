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
  36.997936938057016,
  -122.05703507501151,
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

// Game state ------------------------------------------------------------------
let heldToken: number | null = null;
const tokens: Record<string, number> = {};

// Update functions ------------------------------------------------------------------
function updateStatusPanel(message: string) {
  statusPanelDiv.innerHTML = message;
}

function updateHeldTokenDisplay() {
  if (heldToken !== null) {
    heldTokenDisplay.innerHTML = `Holding token of value: ${heldToken}`;
    if (heldToken >= 16) {
      updateStatusPanel(`You have a powerful token (${heldToken})!`);
    }
  } else {
    heldTokenDisplay.innerHTML = "Not holding any token.";
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
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Add player marker
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip("Player");
playerMarker.addTo(map);

// function to create grid and token logic ------------------------------------------------------------------
function drawGrid(i: number, j: number) {
  const origin = CLASSROOM_LATLNG;
  const bounds = leaflet.latLngBounds([
    [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
    [origin.lat + (i + 1) * TILE_DEGREES, origin.lng + (j + 1) * TILE_DEGREES],
  ]);

  const zone = leaflet.rectangle(bounds, { color: "white", weight: 1 });
  zone.addTo(map);

  const key = `${i},${j}`;
  const distance = Math.max(Math.abs(i), Math.abs(j));
  if (distance > INTERACTION_RANGE) {
    zone.bindTooltip("???");
    return;
  }

  // Use luck() to determine if the cell has a token
  const value = Math.floor(luck(`${i},${j}`) * 10);

  if (value > 2) {
    tokens[key] = value;
    zone.bindTooltip(`Token: ${value}`);
  }

  zone.on("click", () => {
    const hasToken = tokens[key] !== undefined;

    if (heldToken === null && hasToken) {
      heldToken = tokens[key];
      delete tokens[key];
      zone.unbindTooltip();
      updateStatusPanel(`Picked up token of value ${heldToken}`);
      updateHeldTokenDisplay();
    } else if (heldToken !== null && hasToken && tokens[key] === heldToken) {
      tokens[key] = heldToken * 2;
      zone.bindTooltip(`Token: ${tokens[key]}`);
      updateStatusPanel(`Combined tokens! Created value ${tokens[key]}!`);
      heldToken = null;
      updateHeldTokenDisplay();
    } else {
      updateStatusPanel("No token to pick up here.");
      updateHeldTokenDisplay();
    }
  });
}

// Draw the grid ------------------------------------------------------------------

for (let i = -GRID_SIZE; i < GRID_SIZE; i++) {
  for (let j = -GRID_SIZE; j < GRID_SIZE; j++) {
    drawGrid(i, j);
  }
}
