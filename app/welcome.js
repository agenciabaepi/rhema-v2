// /app/welcome.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video } from 'expo-av';

const PRIMARY_COLOR = '#D68536';

export default function Welcome() {  
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Video
        source={require('../assets/videos/bg-video.mp4')} // substitua com seu vídeo real
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        isLooping
        shouldPlay
        isMuted
        repeat
      />

      <View style={styles.overlay}>
        <ScrollView scrollEnabled={false}  contentContainerStyle={styles.innerContainer}>
          <View style={styles.header}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>Bem-vindo ao Rhema</Text>
          <Text style={styles.subtitle}>Compartilhe seus melhores momentos</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/cadastro')}>
            <Text style={styles.primaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
            <Text style={styles.secondaryText}>Login</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing in, you agree to our <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center'
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#fff',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#D1D5DB',
    marginBottom: 40
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 64,
    borderRadius: 12,
    marginBottom: 16
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 64,
    borderRadius: 12,
    marginBottom: 24
  },
  secondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 24
  },
  link: {
    color: '#fff',
    textDecorationLine: 'underline'
  }
});
