import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createStackNavigator } from '@react-navigation/stack';
import SignIn from '../screens/SignIn';
import Signup from '../screens/Signup';
import SplashScreen from '../screens/Splash';
import Home from '../screens/Home';
import Payment from '../screens/Payment';
import CreatePost from '../screens/CreatePost';
import ShowAllUpdates from '../screens/ShowAllUpdates';
import FolderScreen from '../screens/FolderScreen';
import EditPost from '../screens/EditPost';
import ShowAllPackages from '../screens/AdminPackageManagement';
import AdminPackageManagement from '../screens/AdminPackageManagement';
import Profile from '../screens/Profile';

const Stack = createStackNavigator();

const AppNavigation = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Navigator initialRouteName="SplashScreen">
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={Signup}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Payment" component={Payment} />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="CreatePost" component={CreatePost} />
        <Stack.Screen name="ShowAllUpdates" component={ShowAllUpdates} />
        <Stack.Screen name="FolderScreen" component={FolderScreen} />
        <Stack.Screen name="EditPost" component={EditPost} />
        <Stack.Screen
          name="AdminPackageManagement"
          component={AdminPackageManagement}
          options={{
            headerShown: true,
            headerTitle: "Create New Package", // Set the desired header title here
          }}
        />
        <Stack.Screen name="Profile" component={Profile} />




      </Stack.Navigator>
    </GestureHandlerRootView>
  );
};

export default AppNavigation;
