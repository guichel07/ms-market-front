import { AppEvent } from '../../constants';
import { EventBus } from '../../EventBus';

/**
 * Construit le squelette DOM une seule fois, au login — c'est le SEUL endroit
 * qui définit cette structure (contrairement à ms-front-brain où index.html
 * ET AppAssembler définissaient chacun une version légèrement différente du
 * même squelette, l'un des deux étant systématiquement obsolète).
 */
export class AppAssembler {
  static buildAppLayout(): void {
    const app = document.querySelector<HTMLDivElement>('#app');
    if (!app) return;
    app.innerHTML = `
      <div id="app-screen">
        <div class="screen-header" id="screen-header"></div>
        <div class="screen-tabbar" id="screen-tabbar"></div>
        <div class="body-wrap" id="body-wrap">
          <div id="screen-nav"></div>
          <main class="tab-panel visible catalog-area" id="panel-products">
            <div id="container-client-bar"></div>
            <div id="container-catalogue-page"></div>
          </main>
          <div id="panel-cart-contenair"></div>
        </div>
        <div class="screen-footer" id="screen-footer"></div>
      </div>
      <div id="menu-mobile"></div>
      <div id="add-overlay-container"></div>
      <div id="container-recap-overlay"></div>
      <div id="container-qr-overlay"></div>
      <div id="confirm-screen" style="display:none">
        <div id="container-confirm-screen"></div>
      </div>
    `;
    // tek-ms-ds livre #app-screen en display:none par défaut (masqué tant que
    // le login n'est pas passé) — rien d'autre ne le repasse à 'flex'.
    const appScreen = app.querySelector<HTMLDivElement>('#app-screen');
    if (appScreen) appScreen.style.display = 'flex';
  }

  static init(): void {
    EventBus.getInstance().on(AppEvent.Connected, () => {
      AppAssembler.buildAppLayout();
    });
  }
}
