import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
} from '@firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicialização segura do Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// App Check: é a única peça desta lista que o Firebase aplica no servidor.
// As Security Rules dizem quem pode ler e escrever; o App Check diz se a
// chamada veio mesmo do site da casa, e não de um script automação.
//
// Só liga se houver uma site key configurada. Sem ela (e sem enforcement no
// console) o comportamento é exatamente o de antes.
const recaptchaSiteKey =
  (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined) ||
  firebaseConfig.recaptchaSiteKey ||
  '';

export const appCheckAtivo = Boolean(recaptchaSiteKey);

if (recaptchaSiteKey) {
  try {
    // Em desenvolvimento local o console exige um token de depuração.
    if (import.meta.env.DEV) {
      (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });

    if (import.meta.env.DEV) {
      getToken(appCheck, true)
        .then((r) => console.info('[App Check] token de depuração:', r.token))
        .catch(() => {});
    }
  } catch (erro) {
    console.warn('App Check não inicializou; seguindo sem ele:', erro);
  }
}

// Conectar ao Firestore usando o ID de banco provisionado
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Contas liberadas para o painel da portaria.
// Sem esta checagem, qualquer conta Google do mundo autenticava e recebia
// acesso administrativo completo. A barreira definitiva continua sendo as
// Firestore Security Rules — esta lista evita expor a interface a terceiros.
export const ADMIN_EMAILS_AUTORIZADOS: readonly string[] = [
  'ritamvbraga@hotmail.com',
  'benjaminbjp@gmail.com',
];

export function isEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const alvo = email.trim().toLowerCase();
  return ADMIN_EMAILS_AUTORIZADOS.some((e) => e.trim().toLowerCase() === alvo);
}

// Usado para desligar escutas do Firestore que só fazem sentido dentro do
// painel. Não substitui as Security Rules — evita só trabalho inútil e
// erros de permissão no console.
export function currentUserIsAdmin(): boolean {
  return isEmailAdmin(auth.currentUser?.email);
}

// Validação de Conexão com Firestore conforme especificação
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('🔥 Conexão com o Firebase Firestore estabelecida com sucesso!');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase está operando em cache local/offline.', error.message);
    }
  }
}

testConnection();

export default app;
