# CMPM 121 D3 Project

## Goals

Creating a game that can be seen as a token base game where the player can:

- See cells all the way to the edge of the map, but can only interact with cells near them
- Pick up up to one token
- Create new items with those tokens

## Tasks D3.a

- [x] use Leaflet to center on the players location
- [x] Make grid cells on map
- [x] Shows the content/value of cells using `luck()`
- [x] Pick up and placCells cane tokens by clicking (Inventory)
- [x] Token spawned using spawn function
- [x] Game determines player has sufficient token values in hand.
- [x] Game enables player to double a token on a cell if holds token of same value and pays with it

## Progress

- Nov 6 – Created initial plan and task list for D3.a
- Nov 8 - Started on the actual coding on creating the grid
- Nov 9 - The game can:
  Player can pick up one coin at a time.
  Spawn token with luck()
  Combine equal tokens to double their value
  add a display to show how much the player's token has.
  Had the player only interact with cells close to them (up to 3 cells)
