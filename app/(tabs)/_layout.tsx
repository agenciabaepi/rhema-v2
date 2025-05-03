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
import Toast from 'react-native-toast-message';


const Drawer = createDrawerNavigator();
const PRIMARY_COLOR = '#D68536';

function TabsNavigator() {
  const navigation = useNavigation();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginLeft: 16 }}>
            <Ionicons name="menu" size={28} color={PRIMARY_COLOR} />
          </TouchableOpacity>
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
              iconName = 'notifications-outline';
              break;
            case 'perfil':
              iconName = 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="bible" options={{ title: 'Bíblia' }} />
      <Tabs.Screen name="devocionais" options={{ title: 'Devocionais' }} />
      <Tabs.Screen name="testemunhos" options={{ title: 'Testemunhos' }} />
      <Tabs.Screen name="anuncios" options={{ title: 'Anúncios' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
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
        <View style={{ flex: 1, paddingTop: 40, backgroundColor: '#fff' }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>Foto</Text>
              </View>
            )}
            <Text style={styles.username}>{userData?.nome ?? 'Usuário'}</Text>
            <Text style={styles.level}>{userData?.nivel ?? ''}</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('inicio', { screen: 'bible' })}
          >
            <Text style={styles.menuText}>Início</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => props.navigation.navigate('favoritos')}
          >
            <Text style={styles.menuText}>Favoritos</Text>
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
            <Text style={[styles.menuText, { color: PRIMARY_COLOR }]}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="inicio" component={TabsNavigator} options={{ title: 'Início' }} />
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
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});
