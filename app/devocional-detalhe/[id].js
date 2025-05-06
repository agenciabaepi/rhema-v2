import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Image as ExpoImage } from 'react-native';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import { app } from '../../services/firebaseConfig';
import LottieView from 'lottie-react-native';

export default function DevocionalDetalhe() {
  const { id } = useLocalSearchParams();
  const [devocional, setDevocional] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const fetchDevocional = async () => {
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'devocionais', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDevocional(docSnap.data());
        } else {
          Alert.alert('Devocional não encontrado.');
        }
      } catch (e) {
        Alert.alert('Erro ao carregar devocional.');
        console.error(e);
      } finally {
        setCarregando(false);
      }
    };
    fetchDevocional();
  }, [id]);

  if (carregando) {
    return (
      <View style={styles.centered}>
        <LottieView
          source={require('../../assets/animations/loading.json')}
          autoPlay
          loop
          style={{ width: 80, height: 80 }}
        />
      </View>
    );
  }

  if (!devocional) return null;

  return (
    <ScrollView style={styles.container}>
      {devocional.imagem && (
        <ExpoImage
          source={{ uri: devocional.imagem }}
          style={styles.imagem}
          contentFit="cover"
          transition={300}
        />
      )}

      <Text style={styles.titulo}>{devocional.titulo}</Text>
      <Text style={styles.versiculo}>{devocional.versiculoBase}</Text>
      <Text style={styles.textoBiblico}>
        "{devocional.versiculoCompleto}"
      </Text>

      <View style={{ marginVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} />

      <Text style={[styles.titulo, { fontSize: 18, marginBottom: 4 }]}>Reflexão do Dia</Text>
      <Text style={styles.reflexao}>{devocional.reflexao}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  titulo: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#d68536',
    marginBottom: 8,
  },
  versiculo: {
    fontFamily: 'Georgia-Italic',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  textoBiblico: {
    fontFamily: 'Georgia-Regular',
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
  },
  reflexao: {
    fontFamily: 'Georgia-Regular',
    fontSize: 16,
    color: '#111',
  },
  imagem: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});