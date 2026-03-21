/**
 * ChronoballSocket - Handles socket communication for authoritative actions.
 * Pure router — delegates all business logic to specialized modules.
 */

import { ChronoballUtils } from './utils.js';

export class ChronoballSocket {
  static SOCKET_NAME = 'module.chronoball';

  static initialize() {
    if (!game.socket) {
      ChronoballUtils.log('Chronoball | Socket not yet available, deferring to ready hook');
      Hooks.once('ready', () => this.initialize());
      return;
    }
    game.socket.on(this.SOCKET_NAME, this.onSocketMessage.bind(this));
    ChronoballUtils.log('Chronoball | Socket initialized');
  }

  /**
   * Handle incoming socket messages
   */
  static async onSocketMessage(data) {
    ChronoballUtils.log('Chronoball | Socket message received:', data);
    const { action, targetUserId } = data;

    // Route broadcast messages: show dialog only if this client controls the token
    if (!targetUserId) {
      if (action === 'interceptionRequest' || action === 'requestSaveType' || action === 'requestSaveRoll') {
        const ChronoballInterception = (await import('./interception.js')).ChronoballInterception;
        const tokenId = action === 'interceptionRequest' ? data.data.defenderId : data.data.tokenId;
        const controlled = canvas.tokens.controlled.find(t => t.id === tokenId);
        if (!controlled) return;

        if (action === 'interceptionRequest') return ChronoballInterception.showInterceptionDialog(data.data);
        if (action === 'requestSaveType') return ChronoballInterception.handleSaveTypeRequest(data.data);
        if (action === 'requestSaveRoll') return ChronoballInterception.handleSaveRollRequest(data.data);
      }
      if (action === 'requestFumbleSave') {
        const ChronoballFumble = (await import('./fumble.js')).ChronoballFumble;
        const tokenId = data.data.tokenId;
        const controlled = canvas.tokens.controlled.find(t => t.id === tokenId);
        if (controlled) return ChronoballFumble.handleFumbleSaveRequest(data);
        return;
      }
    }

    // Handle response messages (any client with pending request can handle these)
    const ChronoballInterception = (await import('./interception.js')).ChronoballInterception;
    const ChronoballFumble = (await import('./fumble.js')).ChronoballFumble;

    switch (action) {
      case 'stateChanged':
        return Hooks.callAll('chronoball.stateChanged', data.newState);
      case 'actionComplete':
        return Hooks.callAll('chronoball.actionComplete', data.completedAction);
      case 'interceptionResponse':
        return ChronoballInterception.handleInterceptionResponse(data.data.requestId, data.data.accepted);
      case 'saveTypeResponse':
        return ChronoballInterception.handleSaveTypeResponse(data.data);
      case 'saveRollResponse':
        return ChronoballInterception.handleSaveRollResponse(data.data);
      case 'fumbleSaveResponse':
        return ChronoballFumble.handleFumbleSaveResponse(data);
    }

    // Route GM-only messages
    // _localExecution flag is set by executeAsGM() for local dispatch (any GM)
    if (this.isPrimaryGM() || data._localExecution) {
      switch (action) {
        case 'throwBall':
          return this.executeThrowBall(data);
        case 'passBall':
          return this.executePassBall(data);
        case 'pickupBall':
          return this.executePickupBall(data);
        case 'dropBall':
          return this.executeDropBall(data);
        case 'setCarrier':
          return this.executeSetCarrier(data);
        case 'clearCarrier':
          return this.executeClearCarrier(data);
        case 'updateMatchState':
          return this.executeUpdateMatchState(data);
        case 'setTeamAssignment':
          return this.executeSetTeamAssignment(data);
        case 'clearTeamAssignment':
          return this.executeClearTeamAssignment(data);
        case 'fumbleBall':
          return this.executeFumbleBall(data);
        case 'handleCarrierDamage':
          return this.executeHandleCarrierDamage(data);
        case 'interceptionTurnover':
          return this.executeInterceptionTurnover(data);
        case 'startMatch':
          return this.executeStartMatch(data);
        case 'endMatch':
          return this.executeEndMatch(data);
        case 'playerMovedToken':
          return this.executePlayerMovedToken(data);
        case 'determineTeams':
          return this.executeDetermineTeams(data);

        default:
          if (!targetUserId) { // Avoid warning for messages intended for players
            console.warn('Chronoball | Unknown GM socket action:', action);
          }
      }
    }
  }

  /**
   * Emit a socket message
   */
  static emit(action, data = {}) {
    const payload = {
      action,
      ...data,
      userId: game.user.id,
      timestamp: Date.now()
    };

    ChronoballUtils.log('Chronoball | Emitting socket message:', payload);
    game.socket.emit(this.SOCKET_NAME, payload);
  }

  /**
   * Execute an action either locally (if GM) or via socket
   */
  static async executeAsGM(action, data = {}) {
    if (this.isPrimaryGM()) {
      // Execute directly — this user is the authoritative GM
      return await this.onSocketMessage({ action, ...data, _localExecution: true });
    } else {
      // Secondary GM or Player — send to primary GM via socket
      this.emit(action, data);
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          Hooks.off('chronoball.actionComplete', hook);
          ui.notifications.warn(game.i18n.localize('CHRONOBALL.Errors.GMTimeout'));
          resolve(false);
        }, 5000);
        const hook = Hooks.on('chronoball.actionComplete', (completedAction) => {
          if (completedAction === action) {
            clearTimeout(timeout);
            Hooks.off('chronoball.actionComplete', hook);
            resolve(true);
          }
        });
      });
    }
  }

  /**
   * Check if current user is primary GM
   */
  static isPrimaryGM() {
    if (!game.user?.isGM) return false;

    const primaryGMId = game.settings.get('chronoball', 'primaryGM');

    // Validate stored primary GM — must be an active GM, otherwise fall through to auto-detect
    if (primaryGMId) {
      const primaryUser = game.users.get(primaryGMId);
      if (primaryUser?.isGM && primaryUser.active) {
        ChronoballUtils.log(`Chronoball | isPrimaryGM: stored ID ${primaryGMId} is valid and active`);
        return game.user.id === primaryGMId;
      }
      ChronoballUtils.log(`Chronoball | isPrimaryGM: stored ID "${primaryGMId}" is invalid or offline, falling back to auto-detect`);
    }

    // Auto-detect: sort by ID for deterministic selection across all clients
    const activeGMs = game.users.filter(u => u.isGM && u.active);
    activeGMs.sort((a, b) => a.id.localeCompare(b.id));
    const result = activeGMs[0]?.id === game.user.id;
    ChronoballUtils.log(`Chronoball | isPrimaryGM auto-detect: ${result} (active GMs: ${activeGMs.map(u => u.name).join(', ')})`);
    return result;
  }

  /**
   * Get primary GM user
   */
  static getPrimaryGM() {
    const primaryGMId = game.settings.get('chronoball', 'primaryGM');

    if (primaryGMId) {
      const user = game.users.get(primaryGMId);
      if (user && user.isGM && user.active) return user;
    }

    // Fallback to first active GM
    return game.users.find(u => u.isGM && u.active);
  }

  /**
   * Broadcast actionComplete to all clients via Hook + Socket
   */
  static broadcastActionComplete(action) {
    Hooks.callAll('chronoball.actionComplete', action);
    this.emit('actionComplete', { completedAction: action });
  }

  // Execution methods — thin wrappers that delegate to specialized modules

  static async executeThrowBall(data) {
    const { tokenId, targetX, targetY, skill, distance, dc, rollTotal, success, modification } = data;
    const { ChronoballBallExecute } = await import('./ball-execute.js');
    await ChronoballBallExecute.executeThrow(tokenId, targetX, targetY, skill, distance, dc, rollTotal, success, modification);
    this.broadcastActionComplete('throwBall');
  }

  static async executePassBall(data) {
    const { tokenId, targetTokenId, skill, distance, dc, rollTotal, success, modification } = data;
    const { ChronoballBallExecute } = await import('./ball-execute.js');
    await ChronoballBallExecute.executePass(tokenId, targetTokenId, skill, distance, dc, rollTotal, success, modification);
    this.broadcastActionComplete('passBall');
  }

  static async executePickupBall(data) {
    const { tokenId } = data;
    const { ChronoballBallExecute } = await import('./ball-execute.js');
    await ChronoballBallExecute.executePickup(tokenId);
    this.broadcastActionComplete('pickupBall');
  }

  static async executeDropBall(data) {
    const { tokenId, dropX, dropY } = data;
    const { ChronoballBallExecute } = await import('./ball-execute.js');
    await ChronoballBallExecute.executeDrop(tokenId, dropX, dropY);
    this.broadcastActionComplete('dropBall');
  }

  static async executeSetCarrier(data) {
    const { tokenId } = data;
    const { ChronoballCarrier } = await import('./carrier.js');
    await ChronoballCarrier.executeSetCarrier(tokenId);
    this.broadcastActionComplete('setCarrier');
  }

  static async executeClearCarrier(data) {
    const { ChronoballCarrier } = await import('./carrier.js');
    await ChronoballCarrier.executeClearCarrier();
    this.broadcastActionComplete('clearCarrier');
  }

  static async executeUpdateMatchState(data) {
    const { updates } = data;
    const ChronoballState = (await import('./state.js')).ChronoballState;
    await ChronoballState.updateState(updates);
    this.broadcastActionComplete('updateMatchState');
  }

  static async executeFumbleBall(data) {
    const { tokenId } = data;
    const { ChronoballBallExecute } = await import('./ball-execute.js');
    await ChronoballBallExecute.executeFumble(tokenId);
    this.broadcastActionComplete('fumbleBall');
  }

  static async executeSetTeamAssignment(data) {
    const { actorId, team } = data;
    try {
      const { ChronoballState } = await import('./state.js');
      await ChronoballState.setTeamAssignment(actorId, team);
      this.broadcastActionComplete('setTeamAssignment');
    } catch (e) {
      console.error('Chronoball | Failed to set team assignment via GM:', e);
    }
  }

  static async executeClearTeamAssignment(data) {
    const { actorId } = data;
    try {
      const { ChronoballState } = await import('./state.js');
      await ChronoballState.clearTeamAssignment(actorId);
      this.broadcastActionComplete('clearTeamAssignment');
    } catch (e) {
      console.error('Chronoball | Failed to clear team assignment via GM:', e);
    }
  }

  static async executeHandleCarrierDamage(data) {
    const { actorId, damageTaken } = data;
    try {
      const actor = game.actors.get(actorId);
      if (!actor) {
        console.error(`Chronoball | Actor ${actorId} not found for damage handling`);
        return;
      }
      const { ChronoballFumble } = await import('./fumble.js');
      await ChronoballFumble.handleDamage(actor, damageTaken);
      ChronoballUtils.log(`Chronoball | GM handled carrier damage: ${damageTaken} for ${actor.name}`);
    } catch (e) {
      console.error('Chronoball | Failed to handle carrier damage via GM:', e);
    }
  }

  static async executeInterceptionTurnover(data) {
    const { interceptorId, interceptorTeam, location } = data;
    try {
      ChronoballUtils.log(`Chronoball | GM executing interception turnover at ${location}`);
      const { ChronoballState } = await import('./state.js');
      await ChronoballState.endPhase();
      ChronoballUtils.log(`Chronoball | Interception turnover completed successfully`);
      this.broadcastActionComplete('interceptionTurnover');
    } catch (e) {
      console.error('Chronoball | Failed to execute interception turnover via GM:', e);
    }
  }

  static async executeStartMatch(data) {
    try {
      ChronoballUtils.log(`Chronoball | GM executing start match`);
      const { ChronoballState } = await import('./state.js');
      const { ChronoballRoster } = await import('./roster.js');
      const { ChronoballBallExecute } = await import('./ball-execute.js');

      // Ensure combat exists
      await ChronoballState.ensureCombat();

      // Create or find ball token
      await ChronoballBallExecute.ensureBallToken();

      // Rebuild initiative with alternating teams
      await ChronoballRoster.rebuildInitiative();

      // Reset match state
      await ChronoballState.resetTurnDistances();

      // Mark scene as having an active match
      await canvas.scene.setFlag('chronoball', 'matchActive', true);

      ui.notifications.info('Match started! Combat tracker is ready.');
      this.broadcastActionComplete('startMatch');
      ChronoballUtils.log(`Chronoball | Start match completed successfully`);
    } catch (e) {
      console.error('Chronoball | Failed to execute start match via GM:', e);
      ui.notifications.error('Failed to start match. Check console for details.');
    }
  }

  static async executeEndMatch(data) {
    const { ChronoballBallExecute } = await import('./ball-execute.js');
    await ChronoballBallExecute.executeEndMatch(data);
  }

  static async executePlayerMovedToken(data) {
    const { tokenId, changes, oldPos } = data;
    const tokenDoc = canvas.scene.tokens.get(tokenId);
    if (tokenDoc) {
      const { Chronoball } = await import('../chronoball.js');
      Chronoball.handleTokenMovement(tokenDoc, changes, oldPos);
    }
  }

  static async executeDetermineTeams(data) {
    const { ChronoballRoster } = await import('./roster.js');
    await ChronoballRoster.determineTeamsFromEndzones();
    this.broadcastActionComplete('determineTeams');
  }

}
