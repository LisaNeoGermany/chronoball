/**
 * ChronoballHUD - Persistent HUD overlay
 */

import { ChronoballState } from '../scripts/state.js';
import { ChronoballUtils } from '../scripts/utils.js';

export class ChronoballHUD {
  static element = null;
  static isMounted = false;
  
  static initialize() {
    ChronoballUtils.log('Chronoball | HUD initialized');
    
    // Listen for state changes
    Hooks.on('chronoball.stateChanged', () => {
      this.render();
    });
  }
  
  /**
   * Mount HUD to DOM
   */
  static mount() {
    if (this.isMounted) return;
    
    this.element = document.createElement('div');
    this.element.id = 'chronoball-hud';
    this.element.className = 'chronoball-hud';
    
    document.body.appendChild(this.element);
    
    this.isMounted = true;
    this.render();
    
    ChronoballUtils.log('Chronoball | HUD mounted');
  }
  
  /**
   * Update HUD visibility based on state
   */
  static updateVisibility() {
    if (!this.element) return;

    if (ChronoballState.isMatchActiveOnCurrentScene()) {
      this.element.classList.add('visible');
    } else {
      this.element.classList.remove('visible');
    }
  }
  
  /**
   * Render HUD content
   */
  static render() {
    if (!this.element) return;
    
    const state = ChronoballState.getMatchState();
    const carrier = ChronoballState.getCarrierToken();
    const rules = ChronoballState.getRules();
    
    // Calculate max distances for progress bars
    const limits = ChronoballState.getMovementLimits();
    const maxMove = limits.move;
    const maxThrow = limits.throw;
    
    const movePercent = maxMove > 0 ? (state.remainingMove / maxMove) * 100 : 0;
    const throwPercent = maxThrow > 0 ? (state.remainingThrow / maxThrow) * 100 : 0;
    
    // Team colors: Team A = Blue, Team B = Red (always)
    const teamAColor = '#2196F3';
    const teamBColor = '#f44336';
    
    // Get attacking and defending team names with their respective colors
    const attackingTeamName = state.attackingTeam === 'A' ? state.teamAName : state.teamBName;
    const defendingTeamName = state.defendingTeam === 'A' ? state.teamAName : state.teamBName;
    const attackingTeamColor = state.attackingTeam === 'A' ? teamAColor : teamBColor;
    const defendingTeamColor = state.defendingTeam === 'A' ? teamAColor : teamBColor;
    
    // Build movement rows HTML - only show if > 0
    let movementRowsHTML = '';
    
    if (maxMove > 0) {
      movementRowsHTML += `
        <div class="hud-row remaining-move">
          <span class="hud-label">${game.i18n.localize('CHRONOBALL.HUD.RemainingMove')}:</span>
          <div class="remaining-bar">
            <div class="remaining-fill" style="width: ${movePercent}%"></div>
          </div>
          <span class="remaining-text">${state.remainingMove.toFixed(1)} ${game.i18n.localize('CHRONOBALL.HUD.Feet')}</span>
        </div>
      `;
    }
    
    if (maxThrow > 0) {
      movementRowsHTML += `
        <div class="hud-row remaining-throw">
          <span class="hud-label">${game.i18n.localize('CHRONOBALL.HUD.RemainingThrow')}:</span>
          <div class="remaining-bar">
            <div class="remaining-fill" style="width: ${throwPercent}%"></div>
          </div>
          <span class="remaining-text">${state.remainingThrow.toFixed(1)} ${game.i18n.localize('CHRONOBALL.HUD.Feet')}</span>
        </div>
      `;
    }
    
    const html = `
      <div class="hud-header">
        <div class="team-info">
          <div class="team-name" style="color: ${teamAColor}; font-weight: bold;">${foundry.utils.escapeHTML(state.teamAName)}</div>
          <div class="team-score">${state.teamAScore}</div>
        </div>
        <div class="vs-separator">VS</div>
        <div class="team-info">
          <div class="team-name" style="color: ${teamBColor}; font-weight: bold;">${foundry.utils.escapeHTML(state.teamBName)}</div>
          <div class="team-score">${state.teamBScore}</div>
        </div>
      </div>
      
      <div class="hud-body">
        <div class="hud-row">
          <span class="hud-label">${game.i18n.localize('CHRONOBALL.HUD.Attacking')}:</span>
          <span class="hud-value" style="color: ${attackingTeamColor}; font-weight: bold;">${attackingTeamName}</span>
        </div>
        
        <div class="hud-row">
          <span class="hud-label">${game.i18n.localize('CHRONOBALL.HUD.Defending')}:</span>
          <span class="hud-value" style="color: ${defendingTeamColor}; font-weight: bold;">${defendingTeamName}</span>
        </div>
        
        <div class="hud-row">
          <span class="hud-label">${game.i18n.localize('CHRONOBALL.HUD.BallCarrier')}:</span>
          <span class="hud-value">${carrier ? carrier.name : game.i18n.localize('CHRONOBALL.Errors.NoCarrier')}</span>
        </div>
        
        ${movementRowsHTML}
      </div>
    `;
    
    this.element.innerHTML = html;
  }
}