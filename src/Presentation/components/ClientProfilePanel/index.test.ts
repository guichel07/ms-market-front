/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientProfilePanel } from '.';
import type { ClientDTO } from '../../../Domain/Client/Model';

describe('ClientProfilePanel', () => {
  let container: HTMLDivElement;
  let panel: ClientProfilePanel;

  const profiles: ClientDTO[] = [
    { id: 'anon-1', firstname: 'Client anonyme', lastname: 'ENFANT HOMME', phone: '', ageCategory: 'ENFANT', gender: 'HOMME', anonymous: true },
    { id: 'anon-2', firstname: 'Client anonyme', lastname: 'ENFANT FEMME', phone: '', ageCategory: 'ENFANT', gender: 'FEMME', anonymous: true },
    { id: 'anon-3', firstname: 'Client anonyme', lastname: 'ADO HOMME', phone: '', ageCategory: 'ADO', gender: 'HOMME', anonymous: true },
    { id: 'anon-4', firstname: 'Client anonyme', lastname: 'ADO FEMME', phone: '', ageCategory: 'ADO', gender: 'FEMME', anonymous: true },
    { id: 'anon-5', firstname: 'Client anonyme', lastname: 'ADULTE HOMME', phone: '', ageCategory: 'ADULTE', gender: 'HOMME', anonymous: true },
    { id: 'anon-6', firstname: 'Client anonyme', lastname: 'ADULTE FEMME', phone: '', ageCategory: 'ADULTE', gender: 'FEMME', anonymous: true },
  ];

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = new ClientProfilePanel(container);
  });

  it('affiche les 6 boutons profil', () => {
    panel.render({ profiles, onSelect: vi.fn() });

    const buttons = container.querySelectorAll('.profile-btn');
    expect(buttons).toHaveLength(6);
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels).toEqual(['Garçon', 'Fille', 'Ado', 'Adolescente', 'Homme', 'Femme']);
  });

  it("cliquer sur un bouton appelle onSelect avec le ClientDTO correspondant (id réel inclus)", () => {
    const onSelect = vi.fn();
    panel.render({ profiles, onSelect });

    const femmeButton = Array.from(container.querySelectorAll<HTMLButtonElement>('.profile-btn')).find(
      (b) => b.textContent?.trim() === 'Femme'
    );
    femmeButton?.click();

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'anon-6', ageCategory: 'ADULTE', gender: 'FEMME' })
    );
  });

  it("ne fait rien si le profil cliqué n'est pas dans le cache (pas encore synchronisé)", () => {
    const onSelect = vi.fn();
    panel.render({ profiles: [], onSelect });

    container.querySelector<HTMLButtonElement>('.profile-btn')?.click();

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clearSelection() puis un nouveau render() ne laisse aucun bouton actif', () => {
    const onSelect = vi.fn();
    panel.render({ profiles, onSelect });
    container.querySelector<HTMLButtonElement>('.profile-btn')?.click();

    panel.clearSelection();
    panel.render({ profiles, onSelect });

    const activeButtons = Array.from(container.querySelectorAll<HTMLButtonElement>('.profile-btn')).filter(
      (b) => b.style.background === 'var(--clay)'
    );
    expect(activeButtons).toHaveLength(0);
  });
});
