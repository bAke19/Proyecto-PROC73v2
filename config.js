// Import the functions you need from the SDKs you need
import firebase from "firebase";
require("@firebase/firestore");

//Incluye aqui tus credenciales
const firebaseConfig = {
  apiKey: "AIzaSyD8R-D6xF8jPsDrlvHTEZC4xd7Vi3o80XA",
  authDomain: "bicicletas-proyecto-71.firebaseapp.com",
  projectId: "bicicletas-proyecto-71",
  storageBucket: "bicicletas-proyecto-71.appspot.com",
  messagingSenderId: "863309406412",
  appId: "1:863309406412:web:b853197beb873c2b1be269"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();