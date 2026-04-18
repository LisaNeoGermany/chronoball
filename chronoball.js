/**
 * Chronoball - Main Entry Point
 * A minigame framework for turn-based ball competitions
 */

import { ChronoballSocket } from './scripts/socket.js';
import { ChronoballState } from './scripts/state.js';
import { ChronoballBall } from './scripts/ball.js';
import { ChronoballScoring } from './scripts/scoring.js';
import { ChronoballInterception } from './scripts/interception.js';
import { ChronoballRoster } from './scripts/roster.js';
import { ChronoballHUD } from './apps/hud.js';
import { ChronoballPlayerPanel } from './apps/player-panel.js';
import { ChronoballRulesPanel } from './apps/rules-panel.js';
import { ChronoballFumble } from './scripts/fumble.js';
import { ChronoballUtils } from './scripts/utils.js';

class Chronoball {
  static ID = 'chronoball';
  static SOCKET = `module.${Chronoball.ID}`;

  static initialize() {
    console.log('Chronoball | Initializing module');

    // Initialize subsystems with individual error handling
    const subsystems = [
      ['Socket', () => ChronoballSocket.initialize()],
      ['State', () => ChronoballState.initialize()],
      ['Ball', () => ChronoballBall.initialize()],
      ['Scoring', () => ChronoballScoring.initialize()],
      ['Interception', () => ChronoballInterception.initialize()],
      ['Roster', () => ChronoballRoster.initialize()],
      ['HUD', () => ChronoballHUD.initialize()],
      ['Fumble', () => ChronoballFumble.initialize()]
    ];

    for (const [name, initFn] of subsystems) {
      try {
        initFn();
      } catch (error) {
        console.error(`Chronoball | Failed to initialize ${name}:`, error);
      }
    }

    // Register settings
    this.registerSettings();

    // Setup hooks
    this.setupHooks();

    console.log('Chronoball | Module initialized');
  }
  
  static getPrimaryGMChoices() {
    const choices = { '': 'Auto (first active GM)' };
    const gmUsers = game.users?.filter(u => u.isGM) || [];

    for (const user of gmUsers) {
      const status = user.active ? '' : ' (offline)';
      choices[user.id] = `${user.name}${status}`;
    }

    return choices;
  }

  static refreshPrimaryGMSettingChoices() {
    const setting = game.settings.settings.get(`${Chronoball.ID}.primaryGM`);
    if (!setting) return;
    setting.choices = this.getPrimaryGMChoices();
  }

  static populatePrimaryGMSelect(html) {
    // Support both jQuery (v11/v12) and DOM element (v13 ApplicationV2)
    let selectEl;
    if (html?.find) {
      // jQuery object
      const $select = html.find(`select[name="${Chronoball.ID}.primaryGM"]`);
      selectEl = $select?.[0];
    }
    if (!selectEl && html?.querySelector) {
      selectEl = html.querySelector(`select[name="${Chronoball.ID}.primaryGM"]`);
    }
    if (!selectEl && html?.element?.querySelector) {
      selectEl = html.element.querySelector(`select[name="${Chronoball.ID}.primaryGM"]`);
    }
    if (!selectEl) return;

    this.refreshPrimaryGMSettingChoices();
    const choices = game.settings.settings.get(`${Chronoball.ID}.primaryGM`)?.choices ?? {};
    const currentValue = game.settings.get(Chronoball.ID, 'primaryGM') ?? '';

    selectEl.innerHTML = '';
    for (const [value, label] of Object.entries(choices)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      selectEl.appendChild(option);
    }

    selectEl.value = currentValue;
  }
  
  static registerSettings() {
    // Debug mode
    game.settings.register(Chronoball.ID, 'debugMode', {
      name: 'Debug Mode',
      hint: 'Enable debug logging in the browser console for troubleshooting',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: (value) => {
        console.log(`Chronoball | Debug mode ${value ? 'enabled' : 'disabled'}`);
      }
    });

    // Primary GM setting with choices
    game.settings.register(Chronoball.ID, 'primaryGM', {
      name: 'Primary GM',
      hint: 'Select the primary GM for authoritative actions. Leave as "Auto" to use the first active GM.',
      scope: 'world',
      config: true,
      type: String,
      default: '',
      choices: {
        '': 'Auto (first active GM)'
      },
      onChange: () => {}
    });

    // Setting to allow/disallow roll modification dialogs
    game.settings.register(Chronoball.ID, 'allowRollModification', {
      name: 'CHRONOBALL.Settings.AllowRollMod.Name',
      hint: 'CHRONOBALL.Settings.AllowRollMod.Hint',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true
    });

    // Max players per team
    game.settings.register(Chronoball.ID, 'maxPlayers', {
      name: 'Max Players per Team',
      hint: 'The maximum number of players allowed on each team (default is 3).',
      scope: 'world',
      config: true,
      type: Number,
      default: 3,
      onChange: () => {
        if (ChronoballSocket.isPrimaryGM()) {
          ChronoballRoster.rebuildInitiative();
        }
      }
    });

    // Hidden setting to store the ball actor ID
    game.settings.register(Chronoball.ID, 'ballActorId', {
      scope: 'world',
      config: false,
      type: String,
      default: ''
    });

    // Official settings menus (more reliable than HTML injection)
    game.settings.registerMenu(Chronoball.ID, 'playerPanel', {
      name: 'Player Control Panel',
      label: 'Open Player Panel',
      hint: 'Open the Chronoball player control panel to manage teams, rosters, and game flow',
      type: ChronoballPlayerPanel,
      restricted: false
    });

    game.settings.registerMenu(Chronoball.ID, 'rulesPanel', {
      name: 'Rules Configuration',
      label: 'Open Rules Panel',
      hint: 'Configure Chronoball game rules, endzones, movement limits, and scoring',
      type: ChronoballRulesPanel,
      restricted: true
    });
  }
  
  static _tokenPositions = {};

    static handleTokenMovement(tokenDoc, changes, oldPos) {
        if (!oldPos) return;

        const oldX = oldPos.x;
        const oldY = oldPos.y;

        const newX = changes.x ?? tokenDoc.x;
        const newY = changes.y ?? tokenDoc.y;

        if (oldX === newX && oldY === newY) return;

        delete Chronoball._tokenPositions[tokenDoc.id];

        const state = ChronoballState.getMatchState();
        const isCarrier = state.carrierId === tokenDoc.id;

        if (isCarrier) {
          const origin = {x: oldX, y: oldY};
          const destination = {x: newX, y: newY};
          const pathData = canvas.grid.measurePath([origin, destination]);
          const feetDistance = pathData.distance;

          if (feetDistance > 0) {
            ChronoballState.checkAndDeductCarrierMovement(tokenDoc, oldX, oldY, newX, newY, feetDistance);
          }
          ChronoballScoring.checkRunInScore(tokenDoc, newX, newY);
        }

        const isBall = state.ballTokenId === tokenDoc.id;
        if (isBall && !isCarrier) {
          if (!state.throwInProgress) {
            ChronoballScoring.checkThrowScore(tokenDoc, newX, newY);
          } else {
            ChronoballUtils.log('Chronoball | Ball moved but throwInProgress is true, skipping auto-scoring');
          }
        }
    }

  static setupHooks() {
    // Ready hook
    Hooks.on('ready', () => {
      console.log('Chronoball | Ready');
      ChronoballHUD.mount();
      this.createMacros();
      this.refreshPrimaryGMSettingChoices();
    });

    Hooks.on('renderSettingsConfig', (app, html) => {
      this.populatePrimaryGMSelect(html);
    });
    
    // Hide commentary when no match is active on current scene
    Hooks.on('renderChatMessageHTML', (message, html) => {
      if (!ChronoballState.isMatchActiveOnCurrentScene()) {
        const el = html instanceof HTMLElement ? html : html?.[0] || html;
        if (el?.querySelector?.('.chronoball-chat-message')) {
          el.style.display = 'none';
        }
      }
    });

    // Update HUD and chat visibility on match start/end
    Hooks.on('chronoball.actionComplete', (action) => {
      if (action === 'startMatch' || action === 'endMatch') {
        ChronoballHUD.updateVisibility();
        ui.chat.scrollBottom();
      }
    });

    // Canvas ready hook
    Hooks.on('canvasReady', () => {
      ChronoballHUD.updateVisibility();
    });
    
    // Hide HUD when combat is deleted (match end or manual cleanup)
    Hooks.on('deleteCombat', () => {
      ChronoballHUD.updateVisibility();
    });

    // Combat hooks
    Hooks.on('updateCombat', (combat, changed, options, userId) => {
      if (changed.round !== undefined && ChronoballSocket.isPrimaryGM()) {
        ChronoballState.updateState({ carrierDamageInRound: 0 });
        ChronoballUtils.log('Chronoball | New round, carrier damage reset.');
      }
      if (changed.turn !== undefined || changed.round !== undefined) {
        ChronoballState.onCombatTurnChange(combat);
        ChronoballHUD.render();
      }
    });

    // Use preUpdate to capture the state BEFORE the update
    Hooks.on('preUpdateToken', (tokenDoc, changes, options, userId) => {
        if (changes.x !== undefined || changes.y !== undefined) {
            Chronoball._tokenPositions[tokenDoc.id] = { x: tokenDoc.x, y: tokenDoc.y };
        }
    });
    
    // Token hooks
    Hooks.on('updateToken', (tokenDoc, changes, options, userId) => {
      if (options.chronoball_internal) return;

      if (changes.x !== undefined || changes.y !== undefined) {
        const oldPos = Chronoball._tokenPositions[tokenDoc.id];
        if (!oldPos) return;

        if (ChronoballSocket.isPrimaryGM()) {
          Chronoball.handleTokenMovement(tokenDoc, changes, oldPos);
        } else {
          ChronoballSocket.emit('playerMovedToken', {
            tokenId: tokenDoc.id,
            changes: changes,
            oldPos: oldPos,
          });
        }
      }
    });
    
    // Delete token hook
    Hooks.on('deleteToken', (tokenDoc, options, userId) => {
      const state = ChronoballState.getMatchState();
      if (state.carrierId === tokenDoc.id) {
        ChronoballBall.clearCarrier();
      }
      ChronoballRoster.onTokenDeleted(tokenDoc);
    });

    // Actor pre-update hook for damage detection
    Hooks.on('preUpdateActor', (actor, changes, options, userId) => {
      const flatChanges = foundry.utils.flattenObject(changes);
      const hpChanged = Object.keys(flatChanges).some(k => k.startsWith('system.attributes.hp'));
      if (!hpChanged) return;
      const state = ChronoballState.getMatchState();
      if (!state.carrierId) return;
      const carrierToken = canvas.tokens.get(state.carrierId);
      if (!carrierToken || actor.id !== carrierToken.actor.id) return;
      const oldHP = actor.system.attributes.hp;
      const oldTotalHP = (oldHP.value || 0) + (oldHP.temp || 0);
      const newHPValue = foundry.utils.getProperty(changes, 'system.attributes.hp.value') ?? oldHP.value;
      const newHPTemp = foundry.utils.getProperty(changes, 'system.attributes.hp.temp') ?? oldHP.temp;
      const newTotalHP = (newHPValue || 0) + (newHPTemp || 0);
      const damageTaken = oldTotalHP - newTotalHP;
      if (damageTaken > 0) {
        ChronoballUtils.log(`Chronoball | Carrier ${actor.name} is about to take ${damageTaken} damage. Handling fumble check.`);

        // If we're the Primary GM, handle damage directly
        // Otherwise, send to GM via socket
        if (ChronoballSocket.isPrimaryGM()) {
          ChronoballFumble.handleDamage(actor, damageTaken);
        } else {
          ChronoballUtils.log(`Chronoball | Non-GM detected damage, sending to GM via socket`);
          ChronoballSocket.emit('handleCarrierDamage', {
            actorId: actor.id,
            damageTaken: damageTaken
          });
        }
      }
    });
  }
  
  static async createMacros() {
    if (!game.user.isGM) return;
    
    const macros = [
      {
        name: 'Chronoball: Ball werfen',
        type: 'script',
        command: 'game.chronoball.throwBall();',
        img: 'modules/chronoball/assets/icons/chrono_throw.png'
      },
      {
        name: 'Chronoball: Pass',
        type: 'script',
        command: 'game.chronoball.passBall();',
        img: 'modules/chronoball/assets/icons/chrono_pass.png'
      },
      {
        name: 'Chronoball: Ball aufnehmen',
        type: 'script',
        command: 'game.chronoball.pickupBall();',
        img: 'modules/chronoball/assets/icons/chrono_pickup.png'
      },
      {
        name: 'Chronoball: Ball fallen lassen',
        type: 'script',
        command: 'game.chronoball.dropBall();',
        img: 'modules/chronoball/assets/icons/chrono_drop.png'
      }
    ];
    
    for (const macroData of macros) {
      const existing = game.macros.find(m => m.name === macroData.name);
      if (existing) {
        await existing.update(macroData);
      } else {
        await Macro.create(macroData);
      }
    }
    
    console.log('Chronoball | Macros created/updated');
  }
  
  // Public API
  static async throwBall() {
    return ChronoballBall.throwBall();
  }
  
  static async passBall() {
    return ChronoballBall.passBall();
  }
  
  static async pickupBall() {
    return ChronoballBall.pickupBall();
  }
  
  static async dropBall() {
    return ChronoballBall.dropBall();
  }
  
  static async setCarrier(tokenId) {
    return ChronoballBall.setCarrier(tokenId);
  }
  
  static async clearCarrier() {
    return ChronoballBall.clearCarrier();
  }
  
  static openPlayerPanel() {
    new ChronoballPlayerPanel().render(true);
  }
  
  static openRulesPanel() {
    new ChronoballRulesPanel().render(true);
  }

}

// Initialize on hook
Hooks.once('init', () => {
  Chronoball.initialize();
  
  // Expose API
  game.chronoball = Chronoball;
  
  console.log('Chronoball | API exposed as game.chronoball');
});

export { Chronoball };
