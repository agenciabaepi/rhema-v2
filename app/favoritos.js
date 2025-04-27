import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { auth, db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavoritos = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setFavoritos(userData.favoritos || []);
        }
      }
    } catch (error) {
      console.log('Erro ao carregar favoritos:', error);
    }
  };

  useEffect(() => {
    fetchFavoritos().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavoritos().finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d68536" />
      </View>
    );
  }

  if (!favoritos.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noFavorites}>Nenhum favorito salvo.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favoritos</Text>
      </View>
      <FlatList
        data={favoritos}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.container}
        renderItem={({ item }) => (
          <View style={styles.favoriteCard}>
            <Text style={styles.favoriteTitle}>{item.livro} {item.capitulo}:{item.versiculo}</Text>
            <Text style={styles.favoriteText}>{item.texto}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#d68536',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  container: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  favoriteCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d68536',
    marginBottom: 4,
  },
  favoriteText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  noFavorites: {
    fontSize: 16,
    color: '#999',
  },
});