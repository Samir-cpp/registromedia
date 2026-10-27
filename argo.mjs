// Destinazione pubblicata da https://argofamiglia.it/accesso/.
// Nessuna query con codice scuola, identificativi, token o credenziali.
export const ARGO_LOGIN_URL = 'https://www.portaleargo.it/famiglia/';

// La shell desktop può aprire esclusivamente questa destinazione nel browser.
// Il renderer non può passare URL arbitrari a shell.openExternal.
export function isOfficialArgoLogin(value) {
  return typeof value === 'string' && value === ARGO_LOGIN_URL;
}
