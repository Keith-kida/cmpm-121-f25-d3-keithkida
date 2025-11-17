# CMPM 121 D3 Project

## Goals

Creating a game that can be seen as a token base game where the player can:

- See cells all the way to the edge of the map, but can only interact with cells near them
- Pick up up to one token
- Create new items with those tokens
- Enables player to explore the map infinitely
- Use memory to store the token value
- Has a victory condition
- Allow player to restart and continue for where they left off

## Tasks D3.a

- [x] use Leaflet to center on the players location
- [x] Make grid cells on map
- [x] Shows the content/value of cells using `luck()`
- [x] Pick up and placCells cane tokens by clicking (Inventory)
- [x] Token spawned using spawn function
- [x] Game determines player has sufficient token values in hand.
- [x] Game enables player to double a token on a cell if holds token of same value and pays with it

## Tasks D3.b

- [x] Add movement buttons (North, South, East, West) that simulate player movement
- [x] Update visible grid dynamically as player moves (spawn/despawn as needed)
- [x] Center the map around the player’s current position instead of a fixed location
- [x] Use a coordinate system anchored at (0,0)
- [x] Allow player to move around the map and see new cells
- [x] Only cells near the player are interactive
- [x] Cells forget their state when they leave the screen (memoryless behavior)
- [x] Player can craft higher-value tokens than before
- [x] Game declares victory when player creates a token at or above a required threshold

## Tasks D3.c

- [x] Use the "Flyweight pattern" to make sure cells not visible on the map do not require memory for storage
- [x] Use the "Memento pattern" to preserve the state of modified cells when they scroll off-screen, and restore them when they return to view.
- [x] Rebuild visible cells dynamically when moving instead of keeping them all loaded
- [x] Have it maintain original game mechanics even after changing to memory storage

## Tasks D3.d

- [x] Use geolocation API to control player
- [x] Use localStorage API to persist game state across page loads
- [x] Player can continue gameplay from the same state by simply opening the page again, even if it was closed
- [x] The player can switch between button-based and geolocation-based movement.

## Progress

- Nov 6 – Created initial plan and task list for D3.a

- Nov 8 - Started on the actual coding on creating the grid

- Nov 9 - The game can:
  Player can pick up one coin at a time.
  Spawn token with luck()
  Combine equal tokens to double their value
  add a display to show how much the player's token has.
  Had the player only interact with cells close to them (up to 3 cells)

- Nov 11 - The game allows:

  - players to move up, down, left, and right.
  - the map will always center on the player
  - only interact with players with tokens near them
  - declare game winner

- Nov 13 - The game:
  - uses no memory for unused cells on the map using "Flyweight pattern"
  - preserve the state of modified cells when they scroll off-screen using "Memento pattern"

- Nov 15 -
