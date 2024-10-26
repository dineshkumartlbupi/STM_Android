import { Dimensions } from "react-native";
import { Platform, StatusBar } from "react-native";
import { Image } from "react-native";
const { width, height } = Dimensions.get("window");

export const COLORS = {
  lightBlack: "#333333",
  white: "#FFFFFF",
  gray: "#666666",
  black: "#000000",
  green: "#3CB371",
  lightGray: "#666666",
  lightBlue: "#ADD8E6",
  blue:"#164863",
  pealBlue:"#A4E5E0",

  mainColor: "#111111",
  bodyTextColor: "#333333",
  secondaryTextColor: "#666666",
  btnColor: "#000000",

  pink: "#FF2DAB",

  shadowStartColor: "rgba(6, 38, 100, 0.03)",
  shadowFinalColor: "rgba(6, 38, 100, 0.0)",
  shadowDistance: 10,

  transparent: "transparent",
  transparentWhite1: "rgba(255, 255, 255, 0.1)",
};
export const SIZES = {
  width,
  height,

  borderRadius: 10,
};
export const FONTS = {
  H1: {
    fontFamily: "Spartan_700Bold",
    fontSize: 32,
  },
  H2: {
    fontFamily: "Spartan_600SemiBold",
    fontSize: 20,
  },
  H3: {
    fontFamily: "Lato_500Medium",
    fontSize: 16,
  },
  H4: {
    fontFamily: "Lato_700Bold",
    fontSize: 18,
  },
  H5: {
    fontFamily: "Lato_700Bold",
    fontSize: 16,
  },
  H6: {
    fontFamily: "Lato_700Bold",
    fontSize: 14,
  },
  Lato_Regular: {
    fontFamily: "Lato_400Regular",
  },
  Lato_400Regular: {
    fontFamily: "Lato_400Regular",
  },
  Lato_500Medium: {
    fontFamily: "Lato_500Medium",
  },
  Lato_600SemiBold: {
    fontFamily: "Lato_600SemiBold",
  },
  Lato_700Bold: {
    fontFamily: "Lato_700Bold",
  },
  Spartan_400Regular: {
    fontFamily: "Spartan_400Regular",
  },
  Spartan_500Medium: {
    fontFamily: "Spartan_500Medium",
  },
  Spartan_600SemiBold: {
    fontFamily: "Spartan_600SemiBold",
  },
  Spartan_700Bold: {
    fontFamily: "Spartan_700Bold",
  },
  Montserrat_Regular: {
    fontFamily: "Montserrat-Regular",
  },
  Montserrat_Bold: {
    fontFamily: "Montserrat-Bold",
  },
  Montserrat_SemiBold: {
    fontFamily: "Montserrat-SemiBold",
  },
  Montserrat_Medium: {
    fontFamily: "Montserrat-Medium",
  },
  BodyText: {
    fontFamily: "Lato_400Regular",
    fontSize: 16,
    lineHeight: 16 * 1.7,
  },
};

export const AREA = {
  AndroidSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    // backgroundColor: COLORS.white,
    // backgroundColor:'#FEEF90',

  },
  DefaultBackground: {
    flex: 1,
  },
};

export const AndroidSafeArea = {
  AndroidSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    // backgroundColor: COLORS.white,
    // backgroundColor: COLORS.transparent,
    // backgroundColor:'#FEEF90',

  },
  DefaultBackground: {
    flex: 1,
  },
};
