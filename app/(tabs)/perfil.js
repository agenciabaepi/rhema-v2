import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import { auth, db, app} from '../../services/firebaseConfig';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';


export default function Perfil() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/login');
    } catch (error) {
      console.log('Erro ao deslogar:', error);
    }
  };

  const handlePickImage = async () => {
    console.log('Avatar clicado');
  
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permissão para acessar a galeria é necessária!');
      return;
    }
  
    console.log('Permissão concedida');
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // <-- Correto agora
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      base64: false,
    });
  
    console.log('Resultado:', result);
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log('Iniciando upload...');
      uploadImage(result.assets[0].uri);
    } else {
      console.log('Nenhuma imagem selecionada');
    }
  };

  const uploadImage = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Usuário não autenticado.');
        return;
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      const storage = getStorage(app);
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      // Atualizar no Firestore
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, { photoURL: downloadURL });

      // Atualizar localmente
      setUserData((prev) => ({ ...prev, photoURL: downloadURL }));

      alert('Foto atualizada com sucesso!');
    } catch (error) {
      console.log('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload: ' + error.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        setLoading(true);
        try {
          const user = auth.currentUser;
          if (user) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              setUserData({ uid: user.uid, ...docSnap.data() });
            } else {
              console.log('Nenhum dado encontrado no Firestore.');
              setUserData(null);
            }
          } else {
            console.log('Nenhum usuário autenticado.');
            setUserData(null);
          }
        } catch (error) {
          console.log('Erro ao buscar dados do usuário:', error);
          setUserData(null);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }, [])
  );

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <ActivityIndicator size="large" color="#d68536" />
      </ScrollView>
    );
  }

  if (!userData) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nenhum dado encontrado.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileContainer}>
        <TouchableOpacity style={styles.avatarPlaceholder} onPress={handlePickImage}>
          {userData.photoURL ? (
            <Image
              source={{ uri: userData.photoURL }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>Foto</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.name}>{userData.nome}</Text>
        <Text style={styles.info}>WhatsApp: {userData.whatsapp}</Text>
        <Text style={styles.info}>CPF: {userData.cpf}</Text>
        <Text style={styles.info}>Nível: {userData.nivel}</Text>
      </View>

      <Text style={styles.label}>Versículos Favoritos:</Text>
      {userData.favoritos && userData.favoritos.length > 0 ? (
        <>
          {userData.favoritos.slice(0, 3).map((fav, index) => (
            <View key={index} style={styles.favoriteCard}>
              <View style={styles.favoriteHeader}>
                <Text style={styles.favoriteTitle}>{fav.livro} {fav.capitulo}:{fav.versiculo}</Text>
              </View>
              <Text style={styles.favoriteText}>{fav.texto}</Text>
            </View>
          ))}
          <Text
            style={styles.verTodosButton}
            onPress={() => router.push('/favoritos')}
          >
            Ver todos os favoritos
          </Text>
        </>
      ) : (
        <Text style={styles.noFavorites}>Nenhum favorito salvo.</Text>
      )}

     
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#d68536',
  },
  value: {
    fontSize: 16,
    marginTop: 4,
  },
  logoutButtonContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  logoutButton: {
    fontSize: 16,
    color: '#d68536',
    fontWeight: 'bold',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#d68536',
    borderRadius: 8,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    color: '#aaa',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginTop: 4,
    color: '#666',
  },
  favoriteCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteHeader: {
    marginBottom: 6,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d68536',
  },
  favoriteText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  noFavorites: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  verTodosButton: {
    marginTop: 8,
    fontSize: 16,
    color: '#d68536',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});