import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const firebaseConfig = {

    apiKey: "AIzaSyCfSzNFaAl3fEe8DCwLse1f-OxXXufO_Kk",

    authDomain: "inventario-pro-9acde.firebaseapp.com",

    projectId: "inventario-pro-9acde",

    storageBucket: "inventario-pro-9acde.firebasestorage.app",

    messagingSenderId: "987898985060",

    appId: "1:987898985060:web:29cf410d0a0199199abd71"

};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


/*
==========================================================
AUTENTICACIÓN
==========================================================
*/

const autenticacion = signInAnonymously(auth)
    .then(() => {

        console.log("✅ Firebase autenticado");

    })
    .catch((error) => {

        console.error(
            "❌ Error de autenticación:",
            error
        );

        throw error;

    });


export {
    db,
    auth,
    autenticacion,

    collection,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp
};