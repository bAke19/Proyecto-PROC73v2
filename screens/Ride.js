import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  Alert,
  KeyboardAvoidingView,
  ToastAndroid
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from '../config';

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");

export default class RideScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bikeId: "",  
      bikeType:"",
      bikeAssigned:"",
      userId: "",
      userName: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false
    };
  }


  getCameraPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" es true cuando el usuario ha concedido permiso
          status === "granted" es false cuando el usuario no ha concedido permiso
        */
      hasCameraPermissions: status === "granted",
      domState: "scanner",
      scanned: false
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    this.setState({
      bikeId: data,
      domState: "normal",
      scanned: true
    });
  };

  handleTransaction = async () => {
    var { bikeId, userId } = this.state;
    await this.getBikeDetails(bikeId);
    await this.getUserDetails(userId);

    db.collection("bicycles")
      .doc(bikeId)
      .get()
      .then(doc => {
        var bike = doc.data();
        if (bike.is_bike_available) {
          var { bikeType, userName } = this.state;
          this.assignBike(bikeId, userId, bikeType, userName);
          //  Solo para usuarios Android

           ToastAndroid.show(
            'Has rentado la bicicleta durante la próxima hora. ¡Disfruta tu viaje',
            ToastAndroid.SHORT
          );

          this.setState({
            bikeAssigned: true,
          });
          } else {
            var { bikeType, userName } = this.state;

          this.returnBike(bikeId, userId, bikeType, userName);

          //Solo para usuarios Android
          ToastAndroid.show(
            'Esperamos que hayas disfrutado de tu viaje',
            ToastAndroid.SHORT
          );

          this.setState({
            bikeAssigned: false,
          });
          }
      });
  };

  getBikeDetails = (bikeId) => {
    bikeId = bikeId.trim();
    db.collection('bicycles')
      .where('id', '==', bikeId)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            bikeType: doc.data().byke_type,
          });
        });
      });
  };

  getUserDetails = (userId) => {
    db.collection('users')
      .where('id', '==', userId)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            userName: doc.data().name,
            userId: doc.data().id,
            bikeAssigned: doc.data().bike_assigned,
          });

          // this.setState(
          //   userName: doc.data().name,
          //   userId: doc.data().id,
          //   bikeAssigned: doc.data().bike_assigned
          // );

          // this.setState({
          //   userName= doc.data().name,
          //   userId= doc.data().id,
          //   bikeAssigned= doc.data().bike_assigned
          // });

          // this.setState({
          //   userName: doc.data().name
          //   userId: doc.data().id
          //   bikeAssigned: doc.data().bike_assigned
          // });

          // this.setState({
          //   userName: doc.data().name,
          //   userId: doc.data().id,
          //   bikeAssigned: doc.data().bike_assigned
          // });

        });
      });
  };

    checkBikeAvailability = async bikeId => {
    const bikeRef = await db
      .collection("bicycles")
      .where("id", "==", bikeId)
      .get();

    var transactionType = "";
    if (bikeRef.docs.length == 0) {
      transactionType = false;
    } else {
      bikeRef.docs.map(doc => {
        if (!doc.data().under_maintenance) {
          //si la bicicleta está disponible entonces el tipo de transacción será rented de otro modo será return

          transactionType = doc.data().is_bike_available ?
          "rented" : "return";

        /*transactionType = doc.data().is_bike_available :
        "rented" ? "return";*/

        /*transactionType === doc.data().is_bike_available ?
        "rented" : "return";*/

        /*transactionType = doc.data().is_bike_available 
        "rented"  "return";*/


        } else {
          transactionType = "under_maintenance";
          Alert.alert(doc.data().maintenance_message);
        }
      });
    }

    return transactionType;
  };

  checkUserEligibilityForStartRide = async userId => {
    const userRef = await db
      .collection("users")
      .where("id", "==", userId)
      .get();

    var isUserEligible = false;
    if (userRef.docs.length == 0) {
      this.setState({
        bikeId: ""
      });
      isUserEligible = false;
      Alert.alert("ID de usuario onválido");
    } else {
      userRef.docs.map(doc => {
        if (!doc.data().bike_assigned) {
          isUserEligible = true;
        } else {
          isUserEligible = false;
          Alert.alert("Finaliza el viaje actual para rentar otra bicicleta.");
          this.setState({
            bikeId: ""
          });
        }
      });
    }

    return isUserEligible;
  };

  checkUserEligibilityForEndRide = async (bikeId, userId) => {
    const transactionRef = await db
      .collection("transactions")
      .where("bike_id", "==", bikeId)
      .limit(1)
      .get();
    var isUserEligible = "";
    transactionRef.docs.map(doc => {
      var lastBikeTransaction = doc.data();
      if (lastBikeTransaction.user_id === userId) {
        isUserEligible = true;
      } else {
        isUserEligible = false;
        Alert.alert("La bicicleta está rentada por otro usuario");
        this.setState({
          bikeId: ""
        });
      }
    });
    return isUserEligible;
  };

  assignBike = async (bikeId, userId, bikeType, userName) => {
    //agrega una transacción
    var time = new Date();

    db.collection('transactions').add({
      user_id: userId,
      user_name: userName,
      bike_id: bikeId,
      bike_type: bikeType,
      date: time,
      transaction_type: 'rented',
    });
    //cambia el estado de la bicicleta
    db.collection('bicycles').doc(bikeId).update({
      is_bike_available: false,
    });
    //cambia el valor de la bicicleta asignado al usuario
    db.collection('users').doc(userId).update({
      bike_assigned: true,
    });

    // actualiza el estado local
    this.setState({
      bikeId: '',
    });
  };

  returnBike = async (bikeId, userId, bikeType, userName) => {
    var time = new Date();

    //agrega una transacción
    db.collection('transactions').add({
      user_id: userId,
      user_name: userName,
      bike_id: bikeId,
      bike_type: bikeType,
      date: time,
      transaction_type: 'return',
    });
    //cambia el estado de la bicicleta
    db.collection('bicycles').doc(bikeId).update({
      is_bike_available: true,
    });
    //cambia el valor de la bicicleta asignado al usuario
    db.collection('users').doc(userId).update({
      bike_assigned: false,
    });

    // Actualizando el estado local
    this.setState({
      bikeId: '',
    });
  };

  render() {
    const { bikeId, userId, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView style={styles.container}>
        <View style={styles.upperContainer}>
          <Image source={appIcon} style={styles.appIcon} />
          <Text style={styles.title}>Travesía digital</Text>
          <Text style={styles.subtitle}>Un viaje ecológico</Text>
        </View>
        <View style={styles.lowerContainer}>
          <View style={styles.textinputContainer}>
            <TextInput
              style={[styles.textinput, { width: "82%" }]}
              placeholder={"Id del usuario"}
              placeholderTextColor={"#FFFFFF"}
              value={userId}
              onChangeText={text => this.setState({userId: text})}
            />
          </View>
          <View style={[styles.textinputContainer, { marginTop: 25 }]}>

            <TextInput
              style={styles.textinput}
              placeholder={"Id de la bicicleta"}
              placeholderTextColor={"#FFFFFF"}
              value={bikeId}
              onChangeText={text => this.setState({bikeId: text})}
            />

            <TouchableOpacity
              style={styles.scanbutton}
             onPress={() => this.getCameraPermissions()}
            >
              <Text style={styles.scanbuttonText}>Escanear</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity  
            style={styles.unlockButton}
            onPress={this.handleTransaction}>
            <Text style={styles.scanbuttonText}>Desbloquear</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D0E6F0"
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center"
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center"
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80
  },
  title: {
    fontSize: 40,
    fontFamily: "Rajdhani_600SemiBold",
    paddingTop: 20,
    color: "#4C5D70"
  },
  subtitle: {
    fontSize: 20,
    fontFamily: "Rajdhani_600SemiBold",
    color: "#4C5D70"
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center"
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    marginTop: 25,
    flexDirection: "row",
    backgroundColor: "#4C5D70",
    borderColor: "#4C5D70"
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#4C5D70",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#F88379",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF"
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#FBE5C0",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center"
  },
  scanbuttonText: {
    fontSize: 24,
    color: "#4C5D70",
    fontFamily: "Rajdhani_600SemiBold"
  },
  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBE5C0",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4C5D70"
  },
  buttonText: {
    fontSize: 24,
    color: "#4C5D70",
    fontFamily: "Rajdhani_600SemiBold"
  },
  unlockButton:{
    width:"60%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBE5C0",
    marginTop: 25, 
    borderRadius:10,
  }
});
