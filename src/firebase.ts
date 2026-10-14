import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Safe check
const isConfigValid = 
  firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId;

let app: any = null;
let db: any = null;
let auth: any = null;

if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      db = getFirestore(app, dbId);
    } else {
      db = getFirestore(app);
    }
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase failed to initialize:', error);
  }
} else {
  console.warn('Firebase configuration is missing or incomplete in firebase-applet-config.json');
}

export { app, db, auth };
export const hasFirebase = !!(db && auth);
