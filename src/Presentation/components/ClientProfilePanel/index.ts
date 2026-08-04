import { ANONYMOUS_PROFILES, type ClientDTO } from '../../../Domain/Client/Model';

export interface ClientProfilePanelRenderProps {
  /** Les 6 fiches en cache local (chacune avec son id backend réel). */
  profiles: ClientDTO[];
  onSelect: (client: ClientDTO) => void;
}

/**
 * Remplace l'ancienne barre client (nom + téléphone, ms-clientbar) : anonymat total,
 * zéro saisie — juste 6 boutons de profil (voir Domain/Client/Model ANONYMOUS_PROFILES,
 * qui doit rester en phase avec les couples AgeCategory/Gender générés côté back).
 */
export class ClientProfilePanel {
  private el: HTMLElement;
  private selectedKey: string | null = null;

  constructor(mountPoint: HTMLElement) {
    this.el = mountPoint;
  }

  render({ profiles, onSelect }: ClientProfilePanelRenderProps): void {
    this.el.innerHTML = `
      <div class="profile-bar" id="profile-bar" style="display:flex; gap:8px; flex-wrap:wrap; background:#fff; border:1px solid var(--paper-line); border-radius:13px; padding:11px 14px; margin-bottom:12px;">
        ${ANONYMOUS_PROFILES.map((profile) => {
          const key = `${profile.ageCategory}_${profile.gender}`;
          const active = key === this.selectedKey;
          return `
            <button
              type="button"
              class="profile-btn"
              data-key="${key}"
              style="padding:8px 14px; border-radius:20px; border:1px solid var(--paper-line); background:${active ? 'var(--clay)' : '#fff'}; color:${active ? '#fff' : 'inherit'}; font-size:11.5px; font-weight:700; cursor:pointer;"
            >${profile.label}</button>
          `;
        }).join('')}
      </div>
    `;

    this.el.querySelectorAll<HTMLButtonElement>('.profile-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const client = profiles.find(
          (c) => `${c.ageCategory}_${c.gender}` === key
        );
        if (!client) return;
        this.selectedKey = key ?? null;
        onSelect(client);
        this.render({ profiles, onSelect });
      });
    });
  }

  clearSelection(): void {
    this.selectedKey = null;
  }
}
