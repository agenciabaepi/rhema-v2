import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TouchableOpacity } from 'react-native';
import React, { useState, useCallback } from 'react';
import { useNavigation } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';

const mockNotificacoes = [
  {
    id: '1',
    tipo: 'devocional',
    titulo: 'Novo devocional disponível',
    data: '2025-05-08',
    visto: false,
  },
  {
    id: '2',
    tipo: 'interacao',
    titulo: 'João curtiu seu testemunho',
    data: '2025-05-07',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    visto: true,
  },
  {
    id: '3',
    tipo: 'aviso',
    titulo: 'Culto de Jovens amanhã às 19h',
    data: '2025-05-07',
    visto: false,
  },
  {
    id: '4',
    tipo: 'interacao',
    titulo: 'Maria comentou no seu testemunho',
    data: '2025-05-01',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    visto: true,
  },
];

function agruparPorPeriodo(lista) {
  const hoje = new Date().toISOString().split('T')[0];
  const semanaPassada = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const agrupado = {
    'Hoje': [],
    'Esta semana': [],
    'Semana passada': [],
  };

  lista.forEach(item => {
    if (item.data === hoje) {
      agrupado['Hoje'].push(item);
    } else if (item.data > semanaPassada) {
      agrupado['Esta semana'].push(item);
    } else {
      agrupado['Semana passada'].push(item);
    }
  });

  return Object.entries(agrupado).reduce((acc, [periodo, items]) => {
    if (items.length > 0) {
      acc.push({ id: periodo, tipo: 'titulo', titulo: periodo });
      acc.push(...items);
    }
    return acc;
  }, []);
}

export default function Notifications() {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const renderItem = ({ item }) => {
    if (item.tipo === 'titulo') {
      return <Text style={styles.separador}>{item.titulo}</Text>;
    }

    return (
      <View style={styles.card}>
        {item.avatar && <Image source={{ uri: item.avatar }} style={styles.avatar} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitulo}>{item.titulo}</Text>
          <Text style={styles.cardData}>
            {new Date(item.data).toLocaleDateString()}
          </Text>
        </View>
        {!item.visto && <View style={styles.bolinha} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Notificações</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={agruparPorPeriodo(mockNotificacoes)}
        keyExtractor={(item, index) => item.id + index}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d68536" />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <LottieView
            source={require('../assets/animations/loading.json')}
            autoPlay
            loop
            style={{ width: 100, height: 100, alignSelf: 'center', marginTop: 32 }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#333',
  },
  separador: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#888',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  cardTitulo: {
    fontSize: 16,
    fontFamily: 'Georgia',
    marginBottom: 2,
    color: '#111',
  },
  cardData: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'Georgia-Italic',
  },
  bolinha: {
    width: 10,
    height: 10,
    backgroundColor: '#3b82f6',
    borderRadius: 5,
    marginLeft: 8,
  },
});