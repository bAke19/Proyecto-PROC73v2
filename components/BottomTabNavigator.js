import React, { Component } from "react";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

import RideScreen from "../screens/Ride";
import RideHistoryScreen from "../screens/RideHistory";

const Tab = createBottomTabNavigator();

export default class BottomTabNavigator extends Component {
  render() {
    return (
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === "Ride") {
                 iconName = "bicycle";
              } else if (route.name === "Ride History") {
                iconName = "time";
              }

              return (
                <Ionicons
                  name={iconName}
                  size={size}
                  color={color}
                />
              );
            },
            tabBarActiveTintColor: '#FBE5C0',
            tabBarInactiveTintColor: 'grey',
            tabBarLabelStyle: {
              fontSize: 20,
              fontFamily: "Rajdhani_600SemiBold",
            },
            tabBarLabelPosition: "below-icon",
            tabBarStyle: {
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#F88379",
              height: 70,
            },
            tabBarItemStyle: {
              marginBottom: 10,             
              backgroundColor: "#F88379"
          },
            headerShown: false
          })}
        >
          <Tab.Screen name="Ride" component={RideScreen} />
          <Tab.Screen name="Ride History" component={RideHistoryScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
}
