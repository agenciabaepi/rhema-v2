import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Favoritos from '../favoritos';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import LottieView from 'lottie-react-native';

const Drawer = createDrawerNavigator();
const PRIMARY_COLOR = '#D68536';

function TabsNavigator({ userData }: { userData: any }) {
  const navigation = useNavigation();

  const [temNotificacao, setTemNotificacao] = useState(false);
  const [animarNotificacao, setAnimarNotificacao] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimarNotificacao(true);
      setTemNotificacao(true);
      setTimeout(() => {
        setAnimarNotificacao(false);
        setTemNotificacao(false);
      }, 5000); // anima por 5 segundos
    }, 20000); // a cada 20 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginLeft: 16 }}>
            <Ionicons name="menu" size={28} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginRight: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('notifications')}>
              <View>
                <LottieView
                  source={require('../../assets/animations/notification.json')}
                  autoPlay={animarNotificacao}
                  loop={animarNotificacao}
                  style={{ width: 36, height: 36 }}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('perfil')}>
              {userData?.photoURL ? (
                <Image source={{ uri: userData.photoURL }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              ) : (
                <Ionicons name="person-circle-outline" size={32} color={PRIMARY_COLOR} />
              )}
            </TouchableOpacity>
          </View>
        ),
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 12, marginTop: -2 },
        tabBarStyle: {
          height: 90,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 0,
          position: 'absolute',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'index':
              iconName = 'home-outline';
              break;
            case 'bible':
              iconName = 'book-outline';
              break;
            case 'devocionais':
              iconName = 'calendar-outline';
              break;
            case 'testemunhos':
              iconName = 'chatbox-outline';
              break;
            case 'anuncios':
              iconName = 'megaphone-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="bible" options={{ title: 'Bíblia' }} />
      <Tabs.Screen name="devocionais" options={{ title: 'Devocionais' }} />
      <Tabs.Screen name="testemunhos" options={{ title: 'Testemunhos' }} />
      <Tabs.Screen name="anuncios" options={{ title: 'Anúncios' }} />
    </Tabs>
  );
}

export default function AppLayout() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData({ uid: user.uid, ...docSnap.data() });
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: '#fafafa' }}>
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={80} color="#ccc" />
              </View>
            )}
            <Text style={styles.username}>{userData?.nome ?? 'Usuário'}</Text>
            <Text style={styles.level}>{userData?.nivel ?? ''}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('index', { screen: 'bible' })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="home-outline" size={20} color="#333" style={{ marginRight: 12 }} />
              <Text style={styles.menuText}>Início</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('favoritos')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="bookmark-outline" size={20} color="#333" style={{ marginRight: 12 }} />
              <Text style={styles.menuText}>Favoritos</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { marginTop: 'auto', marginBottom: 30 }]}
            onPress={() => {
              signOut(auth).then(() => {
                props.navigation.reset({
                  index: 0,
                  routes: [{ name: 'index' }],
                });
              });
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="exit-outline" size={20} color="#d11a2a" style={{ marginRight: 12 }} />
              <Text style={[styles.menuText, { color: '#d11a2a', fontWeight: 'bold' }]}>Sair</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="home">
        {() => <TabsNavigator userData={userData} />}
      </Drawer.Screen>
      <Drawer.Screen name="favoritos" component={Favoritos} options={{ title: 'Favoritos' }} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarText: {
    color: '#aaa',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  level: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  menuText: {
    fontSize: 17,
    color: '#333',
  },
});
