import 'tek-ms-ds/dist/style.css';
import './style.css';

import { AuthController } from './Domain/Auth/Controller';
import { AuthState } from './Domain/Auth/State';
import { ArticleController } from './Domain/Article/Controller';
import { ClientController } from './Domain/Client/Controller';
import { OrderController } from './Domain/Order/Controller';
import { OrderState } from './Domain/Order/State';

import { LoginPage } from './Presentation/Pages/LoginPage';
import { AppAssembler } from './Presentation/AppAssembler';
import { HeaderViewManager } from './Presentation/components/HeaderViewManager';
import { FooterViewManager } from './Presentation/components/FooterViewManager';
import { NavbarViewManager } from './Presentation/components/NavbarViewManager';
import { MobileNavigationManager } from './Presentation/components/MobileNavigationManager';
import { CataloguePanel } from './Presentation/components/CataloguePanel';
import { RecapViewManager } from './Presentation/components/RecapViewManager';
import { ConfirmViewManager } from './Presentation/components/ConfirmViewManager';
import { RqViewManager } from './Presentation/components/RqViewManager';

// AppAssembler doit s'enregistrer sur Connected AVANT tout composant qui
// interroge le DOM (Header, CataloguePanel, ...) — l'ordre d'appel ici fixe
// l'ordre des listeners EventBus, donc l'ordre d'exécution.
AuthController.init();
LoginPage.init();
AppAssembler.init();

HeaderViewManager.init();
NavbarViewManager.init();
FooterViewManager.init();
MobileNavigationManager.init();

CataloguePanel.init();
RecapViewManager.init();
ConfirmViewManager.init();
RqViewManager.init();

ArticleController.init();
ClientController.init();
OrderController.init();
OrderState.init();

const seller = await AuthController.getInstance().getLocalSession();
if (seller) {
  AuthState.getInstance().transitionTo('CONNECTED', seller);
} else {
  AuthState.getInstance().transitionTo('DISCONNECTED', null);
}
