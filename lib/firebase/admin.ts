// // lib/firebase/admin.ts
// import admin from 'firebase-admin';

// if (!admin.apps.length) {
//   const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
  
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.FIREBASE_DATABASE_URL
//   });
// }

// export const firebaseAdmin = admin;
// export const messaging = admin.messaging();
