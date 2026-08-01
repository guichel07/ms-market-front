# ms-market-front

Application point de vente (POS/vendeur) de l'écosystème Maman Solution — remplace `ms-front-brain`.

## Pourquoi une réécriture complète

`ms-front-brain` a été jugé trop compliqué à maintenir et abandonné (plus jamais retouché). Cette réécriture repart de zéro (Domain compris), pas seulement de la présentation, en corrigeant au passage des bugs réels découverts en comparant le code au contrat des vraies API (`ms-auth`, `ms-order-service`) :

- L'enregistrement de commande envoyait `customerPhone` au lieu de `clientId` (champ requis par `ms-order-service`) — la vente échouait en pratique.
- Le total du jour (`total-today`) était appelé avec un path param au lieu d'un query param.
- Les URLs d'API étaient codées en dur (`localhost`), sans indirection par variable d'environnement.

## Architecture

- **Domain** (`Auth`, `Article`, `Client`, `Order`, `DailySales`) : `Repository` (réseau) → `Service` → `Controller` (façade), avec cache IndexedDB par domaine pour le offline-first.
- **États centralisés** (`AuthState`, `OrderState`) : un seul point d'entrée `transitionTo()` qui fixe l'état ET émet lui-même l'événement associé — jamais émis séparément par un appelant. Même principe que `RouteState`/`AuthState` de `ms-front-admin`.
- **`CataloguePanel`** : façade unique qui possède ClientBar + Tabbar + Basket + AddSheet + Catalogue, avec un seul cycle de vie (montage/démontage au login/logout) au lieu de 5 composants indépendants dupliquant chacun leurs listeners `Connected`/`Disconnected`. Expose `sync()` pour rafraîchir le catalogue.

## Variables d'environnement (build-time)

Copier `.env.example` en `.env` avant `npm run build` — voir `mamansolution-doc/DEPLOYEMENT/deploiement-front-admin.md` §7.1.1 pour l'incident qui justifie de ne jamais oublier cette étape (ni en local, ni en CI).

## Déploiement

Port hôte `8110` (⚠️ ne pas réutiliser `8100`, déjà pris par `ms-front-admin` sur la même VPS). Pipeline CI/CD sur tag `v*`, voir `.github/workflows/ci_cd.yml`.
