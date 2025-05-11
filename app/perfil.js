import React, { useState } from 'react';
import { View } from 'react-native';
import { Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { auth, db, app} from '../services/firebaseConfig';

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';



export default function Perfil() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    cpf: '',
    endereco: '',
    nascimento: '',
    ministerio: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [ministerios] = useState([
    'Louvor',
    'Boas-vindas',
    'Atalaia',
    'Zeladoria',
    'Ministério Infantil',
    'Artéria',
    'Comunicação',
    'Áudio',
    'Assistência Social',
  ]);
  const [showMinisterioOptions, setShowMinisterioOptions] = useState(false);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  // Função para upload da foto de capa
  const uploadCover = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Usuário não autenticado.');
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permissão para acessar a galeria é necessária!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [2, 1],
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storage = getStorage(app);
        const storageRef = ref(storage, `covers/${user.uid}.jpg`);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        // Atualizar no Firestore
        const userDoc = doc(db, 'users', user.uid);
        await updateDoc(userDoc, { coverURL: downloadURL });
        // Atualizar localmente
        setUserData((prev) => ({ ...prev, coverURL: downloadURL }));
        alert('Capa atualizada com sucesso!');
      } else {
        console.log('Nenhuma imagem selecionada para capa');
      }
    } catch (error) {
      console.log('Erro ao fazer upload da capa:', error);
      alert('Erro ao fazer upload da capa: ' + error.message);
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

  const handleSave = async () => {
    try {
      const ref = doc(db, 'users', userData.uid);
      await updateDoc(ref, formData);
      setUserData((prev) => ({ ...prev, ...formData }));
      setEditMode(false);
      alert('Dados atualizados com sucesso!');
    } catch (error) {
      alert('Erro ao salvar dados: ' + error.message);
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
              setFormData({
                nome: docSnap.data().nome || '',
                whatsapp: docSnap.data().whatsapp || '',
                cpf: docSnap.data().cpf || '',
                endereco: docSnap.data().endereco || '',
                nascimento: docSnap.data().nascimento || '',
                ministerio: docSnap.data().ministerio || '',
              });
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <ActivityIndicator size="large" color="#d68536" />
      </ScrollView>
    );
  }

  if (!userData) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nenhum dado encontrado.</Text>
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* Botão de seta para voltar */}
      <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 20, zIndex: 999 }}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      {/* Foto de capa com View relativa */}
      <View style={{ position: 'relative', height: 220, marginBottom: 60 }}>
        {userData.coverURL ? (
          <Image
            source={{ uri: userData.coverURL }}
            style={{
              width: '100%',
              height: 220,
              resizeMode: 'cover',
              borderRadius: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: -1,
            }}
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 220,
              backgroundColor: '#e8e8e8',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#999' }}>Adicionar capa</Text>
          </View>
        )}

        {/* Ícone de câmera para trocar a capa */}
        <TouchableOpacity
          onPress={uploadCover}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: '#fff',
            padding: 8,
            borderRadius: 30,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <Ionicons name="camera" size={20} color="#333" />
        </TouchableOpacity>

        {/* Imagem de perfil sobreposta */}
        <TouchableOpacity style={[styles.avatarPlaceholder, { position: 'absolute', bottom: -55, alignSelf: 'center', zIndex: 10 }]} onPress={handlePickImage}>
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
      </View>


      <View style={{ alignItems: 'center', marginBottom: 10, marginTop: 8 }}>
        <Text style={styles.profileName}>{userData.nome}</Text>
        <Text style={styles.profileSubtitle}>
          {userData.ministerio || 'Ministério não informado'} • {userData.nivel || 'Nível'}
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#d68536',
          paddingVertical: 6,
          paddingHorizontal: 14,
          borderRadius: 20,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="diamond" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '500' }}>Pontos: 320</Text>
        </View>
        </View>
        
      </View>

      {/* Botões de atalhos para modais */}
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={styles.profileOption}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.profileOptionText}>Informações do usuário</Text>
          <AntDesign name="right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileOption}
          onPress={() => alert('Abrir modal: Segurança')}
        >
          <Text style={styles.profileOptionText}>Segurança</Text>
          <AntDesign name="right" size={18} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileOption}
          onPress={() => alert('Abrir modal: Configurações')}
        >
          <Text style={styles.profileOptionText}>Configurações</Text>
          <AntDesign name="right" size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
    {modalVisible && (
      <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', zIndex: 99 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Informações do Usuário</Text>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '500', marginBottom: 6 }}>Nome</Text>
            <TextInput
              placeholder="Nome"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '500', marginBottom: 6 }}>Whatsapp</Text>
            <TextInput
              placeholder="Whatsapp"
              value={formData.whatsapp}
              onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '500', marginBottom: 6 }}>CPF</Text>
            <TextInput
              placeholder="CPF"
              value={formData.cpf}
              onChangeText={(text) => setFormData({ ...formData, cpf: text })}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '500', marginBottom: 6 }}>Endereço</Text>
            <TextInput
              placeholder="Endereço"
              value={formData.endereco}
              onChangeText={(text) => setFormData({ ...formData, endereco: text })}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '500', marginBottom: 6 }}>Nascimento</Text>
            <TextInput
              placeholder="Nascimento"
              value={formData.nascimento}
              onChangeText={(text) => setFormData({ ...formData, nascimento: text })}
              style={styles.input}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '500', marginBottom: 6 }}>Ministério</Text>
            <TouchableOpacity
              onPress={() => setShowMinisterioOptions(true)}
              style={{
                borderWidth: 1,
                borderColor: '#e0e0e0',
                borderRadius: 8,
                paddingVertical: 14,
                paddingHorizontal: 10,
                backgroundColor: '#fafafa',
              }}
            >
              <Text style={{ color: formData.ministerio ? '#333' : '#999' }}>
                {formData.ministerio || 'Selecione um ministério'}
              </Text>
            </TouchableOpacity>
          </View>

          {showMinisterioOptions && (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, marginTop: 10, padding: 10, elevation: 2 }}>
              {ministerios.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderBottomWidth: index !== ministerios.length - 1 ? 1 : 0,
                    borderBottomColor: '#eee',
                  }}
                  onPress={() => {
                    setFormData({ ...formData, ministerio: item });
                    setShowMinisterioOptions(false);
                  }}
                >
                  <Text style={{ fontSize: 16, color: '#333' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
            <TouchableOpacity
              onPress={async () => {
                await handleSave();
                setModalVisible(false);
              }}
              style={{
                backgroundColor: '#d68536',
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    marginTop: 0,
    paddingTop: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
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
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 90,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d68536',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  avatarText: {
    color: '#aaa',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  infoCard: {
    // Não será mais usado, mantido para compatibilidade
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
    flexShrink: 1,
  },
  info: {
    fontSize: 16,
    marginTop: 4,
    color: '#666',
  },
  favoriteCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#d68536',
  },
  favoriteHeader: {
    marginBottom: 6,
  },
  favoriteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  favoriteText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  noFavorites: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  // verTodosButton removido, agora é um link textual
  userInfoSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#eee',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    fontSize: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#fafafa',
    borderRadius: 6,
  },
  picker: {
    height: 40,
    color: '#333',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginTop: 8,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  profileOption: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});