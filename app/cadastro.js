// /app/cadastro.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { registerUserInFirestore } from '../utils/registerUser';

const PRIMARY_COLOR = '#D68536';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const router = useRouter();

  const handleCadastro = async () => {
    if (senha !== confirmarSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = userCredential.user.uid;

      await registerUserInFirestore(uid, {
        nome,
        cpf,
        whatsapp,
        nivel: 'membro'
      });

      router.replace('/login');
    } catch (error) {
      alert('Erro no cadastro: ' + error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={require('../assets/images/bg-login.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView scrollEnabled={false} contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backButton}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
              <Image source={require('../assets/images/logo.png')} style={styles.headerImage} />
            </View>

            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Join the Rhema community</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#aaa"
              value={nome}
              onChangeText={setNome}
            />

            <TextInput
              style={styles.input}
              placeholder="CPF"
              placeholderTextColor="#aaa"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="WhatsApp"
              placeholderTextColor="#aaa"
              value={whatsapp}
              onChangeText={setWhatsapp}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={true}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirmar senha"
              placeholderTextColor="#aaa"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry={true}
            />

            <TouchableOpacity style={styles.button} onPress={handleCadastro}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative'
  },
  backButton: {
    position: 'absolute',
    top: -10,
    left: 0
  },
  backArrow: {
    fontSize: 24,
    color: '#fff'
  },
  headerImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#fff'
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    color: '#D1D5DB',
    marginBottom: 24
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    fontSize: 16,
    color: '#111827'
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  or: {
    textAlign: 'center',
    color: '#D1D5DB',
    marginBottom: 16
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)'
  },
  socialText: {
    fontSize: 16,
    color: '#111827'
  }
});
