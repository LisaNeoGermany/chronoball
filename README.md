# Chronoball

Chronoball is a Foundry VTT minigame module for tactical, turn-based ball matches on the tabletop grid. It lets two teams compete in a structured ruleset with movement, throws, passes, interceptions, scoring zones, match phases, and a shared HUD so the whole table can follow the game state.

## Features

- Two-team tactical minigame played directly on the Foundry grid
- Distinct phases for movement, passing, interception, and scoring
- Ball carrying, dropping, throwing, fumbling, and interception mechanics
- Team setup from scene zones and match flow management from an in-game control panel
- Persistent match HUD visible on the active play scene
- Localization support for English and German
- Built for D&D 5e worlds

## What the module does

Chronoball turns a normal Foundry scene into a playable sports-style match.

A GM can define two play zones, assign teams from tokens on the field, start a match, and let players interact with the ball through controlled actions such as:

- setting a carrier
- throwing to a target location
- passing to another token
- reacting to interceptions
- scoring by entering or reaching the opposing zone

The module tracks match state, score, attacking and defending teams, movement and throw limits, and displays the current status in a dedicated HUD.

## Installation

1. Open Foundry VTT and navigate to **Add-on Modules**
2. Click **Install Module**
3. Paste the following manifest URL:
   ```
   https://github.com/LisaNeoGermany/chronoball/releases/latest/download/module.json
   ```
4. Click **Install**

## Compatibility

- **Foundry VTT:** tested for v13 and v14
- **Game System:** D&D 5e (dnd5e)

## Notes on compatibility

Chronoball is intended to work across Foundry v13 and v14. The current migration work specifically addressed:

- v14 manifest compatibility
- deprecated chat render hook usage
- HUD visibility on the active match scene
- interception distance behavior in the live test environment

There may still be system-side deprecation warnings from the current dnd5e roll pipeline, but the module itself is operational in the tested v14 setup.

## License

All rights reserved.
