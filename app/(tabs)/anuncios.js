// /app/(tabs)/bible.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';


export default function Anuncios() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anuncios</Text>
      {/* Aqui virá a lista de livros, capítulos, etc. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Constants.statusBarHeight + 60, // <- isso aqui que dá o espaço
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
    fontSize: 30,
  },
  title: {
    fontSize: 32, // ou até 36 se quiser mais destaque
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'left'
  }
});
