import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import app from '../../services/firebaseConfig';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useAnimatedStyle } from 'react-native-reanimated';

let touchStartX = 0;

export default function TelaHome() {

  const { width } = Dimensions.get('window');

  const banners = [
    {
      titulo: 'Culto de Jovens',
      descricao: 'Sexta às 20h – Venha viver algo novo com Deus!',
      imagem: require('../../assets/banners/culto-jovens.jpg'),
    },
    {
      titulo: 'Culto da Ceia',
      descricao: 'Domingo às 18h – Celebre conosco a comunhão e a fé.',
      imagem: require('../../assets/banners/culto-ceia.jpg'),
    },
    {
      titulo: 'Culto de Jovens',
      descricao: 'Sexta às 20h – Venha viver algo novo com Deus!',
      imagem: require('../../assets/banners/culto-jovens.jpg'),
    },
    
  ];

  const [devocionalHoje, setDevocionalHoje] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({});
  const [activeIndex, setActiveIndex] = useState(0);

  const progressValue = useSharedValue(0);

  useEffect(() => {
    const carregarDevocional = async () => {
      try {
        const db = getFirestore(app);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const inicio = Timestamp.fromDate(hoje);

        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        const fim = Timestamp.fromDate(amanha);

        const q = query(
          collection(db, 'devocionais'),
          where('data', '>=', inicio),
          where('data', '<', fim)
        );

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          console.log('Devocional encontrado:', doc.data()); // Adicionado log para debug
          setDevocionalHoje(doc.data());
        }
      } catch (e) {
        console.error('Erro ao buscar devocional do dia:', e);
      }
    };

    carregarDevocional();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 15 }}>
        <Carousel
          loop
          width={width}
          height={180}
          autoPlay={false}
          data={banners}
          pagingEnabled
          scrollAnimationDuration={1000}
          mode="parallax"
          onProgressChange={(_, absoluteProgress) => {
            progressValue.value = absoluteProgress;
            const index = Math.round(absoluteProgress) % banners.length;
            setActiveIndex(index);
          }}
          renderItem={({ item }) => (
            <Pressable
              onPressIn={(e) => {
                touchStartX = e.nativeEvent.pageX;
              }}
              onPressOut={(e) => {
                const touchEndX = e.nativeEvent.pageX;
                const movement = Math.abs(touchEndX - touchStartX);
                if (movement < 10) {
                  setModalContent(item);
                  setModalVisible(true);
                }
              }}
              style={{
                width: width * 1,
                height: 180,
                borderRadius: 16,
                overflow: 'hidden',
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Image
                source={item.imagem}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                resizeMode="cover"
              />
            </Pressable>
          )}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 4, marginBottom: 10 }}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={{
                backgroundColor: index === activeIndex ? '#d68536' : '#ccc',
                width: index === activeIndex ? 8 : 6,
                height: index === activeIndex ? 8 : 6,
                borderRadius: 4,
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.header}>
        <Ionicons name="megaphone-outline" size={24} color="#d68536" />
        <Text style={styles.headerTitle}>Novidades no App</Text>
      </View>

      {devocionalHoje ? (
        <View style={styles.dailyDevotional}>
          <Text style={styles.sectionTitle}>📖 Devocional de Hoje</Text>
          <Text style={styles.devotionalText}>
            {devocionalHoje.versiculo || 'Versículo não informado'}
          </Text>
          <TouchableOpacity style={styles.readButton}>
            <Text style={styles.readButtonText}>Ler completo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📖 Página da Bíblia Melhorada</Text>
        <Text style={styles.cardText}>
          Agora você pode rolar para esconder o cabeçalho, facilitando a leitura completa dos versículos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧩 Novo Perfil do Usuário</Text>
        <Text style={styles.cardText}>
          Interface atualizada com opção de adicionar foto de capa e editar informações diretamente pelo app.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Calendário de Escalas</Text>
        <Text style={styles.cardText}>
          Visualização clara dos dias que você está escalado e seus colegas de ministério.
        </Text>
      </View>

      <View style={styles.espacoFinal} />

      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <Image
            source={modalContent.imagem}
            style={{ width: '100%', height: 240 }}
            resizeMode="cover"
          />
          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>
              {modalContent.titulo}
            </Text>
            <Text style={{ fontSize: 16, color: '#555' }}>
              {modalContent.descricao}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={{
              position: 'absolute',
              top: 40,
              right: 20,
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: 10,
              borderRadius: 20
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  bannerContainer: {
    marginBottom: 24,
  },
  banner: {
    backgroundColor: '#fff8ed',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 260,
    borderLeftWidth: 4,
    borderLeftColor: '#d68536',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },
  bannerText: {
    fontSize: 13,
    color: '#666',
  },
  dailyDevotional: {
    backgroundColor: '#fff3e6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#d68536',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  devotionalText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 10,
  },
  readButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#d68536',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  readButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#fdf6ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d68536',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  cardText: {
    fontSize: 14,
    color: '#555',
  },
  espacoFinal: {
    height: 60,
  },
  bannerImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 10,
    width: 360,
    height: 180,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  }
});
