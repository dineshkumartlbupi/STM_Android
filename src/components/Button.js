import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import React from "react";
import { FONTS, COLORS } from "../constants/theme"; // Ensure that COLORS contains a reference to white

export default function Button({ title, containerStyle, onPress, textStyle }) {
    return (
        <TouchableOpacity
            style={[styles.button, containerStyle]}
            onPress={onPress}
        >
            <Text
                style={[styles.text, textStyle]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 100,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        width: "80%",
        alignSelf: "center",
        marginBottom: 10,
        marginTop: 10,
        borderWidth: 0.5,
        borderColor: '#E8E8E8',
        elevation: 5,
        backgroundColor: "blue", // Set the background color to blue
    },
    text: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "800",
    },
});
