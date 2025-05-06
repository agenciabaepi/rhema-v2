import React, { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import axios from 'axios';

export default function ModalAudioDevocional({ visible, onClose, devocional }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState(null);
  const [rate, setRate] = useState(1);

  const texto = devocional?.reflexao || '';
  const titulo = devocional?.titulo || '';
  const referencia = devocional?.referencia || '';

  const calcularTempoLeitura = (texto) => {
    const palavras = texto.trim().split(/\s+/).length;
    const minutos = Math.ceil(palavras / 200);
    return `${minutos} min`;
  };

  const tempoLeitura = texto && texto.trim().length > 0 ? calcularTempoLeitura(texto) : '0 min';

  const toggleSpeech = async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            return;
          } else {
            await sound.playAsync();
            setIsPlaying(true);
            return;
          }
        }
      } catch (e) {
        await sound.unloadAsync();
        setSound(null);
      }
    }
    // Tratamento para evitar "The Sound is already loaded."
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    const fileUri = FileSystem.cacheDirectory + 'devocional-audio.mp3';
    try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      try {
        const { sound: newSound, status: loadStatus } = await Audio.Sound.createAsync(
          { uri: fileUri },
          { shouldPlay: false }
        );
        if (!loadStatus.isLoaded) {
          throw new Error("Falha ao carregar áudio.");
        }
        await newSound.setVolumeAsync(1.0);
        await newSound.setIsMutedAsync(false);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        newSound.setOnPlaybackStatusUpdate((status) => {
          setStatus(status);
          if (status.didJustFinish && !status.isLooping) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
      } catch (e) {
        console.error("Erro ao criar e tocar áudio:", e);
      }
      return;
    }

      const response = await axios({
        method: 'post',
        url: 'https://api.elevenlabs.io/v1/text-to-speech/Yko7PKHZNXotIFUBG7I9',
        headers: {
          'xi-api-key': 'sk_bbcf87057ce0527053526040947f3b35a4b5f2676c738eec',
          'Content-Type': 'application/json'
        },
        data: {
          text: texto,
          model_id: 'eleven_monolingual_v1',
          voice_id: 'Yko7PKHZNXotIFUBG7I9',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0,
            use_speaker_boost: true
          }
        },
        responseType: 'arraybuffer'
      });

      await FileSystem.writeAsStringAsync(fileUri, Buffer.from(response.data).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64
      });
      const newFileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('Arquivo salvo em:', newFileInfo.uri);

      try {
        const { sound: newSound, status: loadStatus } = await Audio.Sound.createAsync(
          { uri: fileUri },
          { shouldPlay: false }
        );
        if (!loadStatus.isLoaded) {
          throw new Error("Falha ao carregar áudio.");
        }
        await newSound.setVolumeAsync(1.0);
        await newSound.setIsMutedAsync(false);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        newSound.setOnPlaybackStatusUpdate((status) => {
          setStatus(status);
          if (status.didJustFinish && !status.isLooping) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
          }
        });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);
      } catch (e) {
        console.error("Erro ao criar e tocar áudio:", e);
      }
    } catch (error) {
      if (error.response?.status === 429) {
        console.error('Limite de requisições atingido no ElevenLabs');
      } else {
        console.error('Erro ao gerar áudio:', error);
      }
    }
  };

  const toggleRate = () => {
    const newRate = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(newRate);
    if (sound) {
      sound.setRateAsync(newRate, true);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const openNativePlayer = () => {
    if (!devocional?.reflexao) return;
    const urlSafeText = encodeURIComponent(devocional.reflexao);
    const elevenUrl = `https://elevenlabs.io/app/audio-native?text=${urlSafeText}`;
    WebBrowser.openBrowserAsync(elevenUrl);
  };

useEffect(() => {
  return () => {
    if (sound) {
      sound.unloadAsync();
    }
  };
}, []);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.tempo}>{tempoLeitura}</Text>
          <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Texto devocional */}
        <ScrollView contentContainerStyle={styles.textContainer} showsVerticalScrollIndicator={false}>
          {texto && texto.trim().length > 0 ? (
            <>
              {referencia ? (
                <Text style={styles.referencia}>{referencia}</Text>
              ) : null}
              <Text style={styles.texto}>{texto}</Text>
            </>
          ) : (
            <Text style={styles.texto}>Nenhum texto disponível.</Text>
          )}
        </ScrollView>

        {/* Player */}
        <View style={styles.player}>
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{status ? formatTime(status.positionMillis) : '00:00'}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: status && status.durationMillis
                      ? `${(status.positionMillis / status.durationMillis) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
            <Text style={styles.timeText}>{status?.durationMillis ? formatTime(status.durationMillis) : '00:00'}</Text>
          </View>
          <View style={styles.playerButtons}>
            <TouchableOpacity onPress={toggleSpeech} style={styles.playerButton}>
              <Feather name={isPlaying ? 'pause-circle' : 'play-circle'} size={36} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleRate} style={styles.playerButton}>
              <Text style={styles.rateText}>{rate}x</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openNativePlayer} style={styles.playerButton}>
              <Feather name="external-link" size={24} color="#111" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    justifyContent: 'space-between',
    marginTop: 40,
  },
  titulo: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  tempo: {
    fontSize: 14,
    color: '#888',
  },
  closeButton: {
    padding: 4,
  },
  close: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
  },
  textContainer: {
    paddingHorizontal: 24,
    paddingBottom: 140,
    flexGrow: 1,
  },
  texto: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#111',
    lineHeight: 24,
  },
  player: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  playerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  playerButton: {
    paddingHorizontal: 12,
  },
  rateText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#111',
  },
  referencia: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 12,
    color: '#d68536',
    fontFamily: 'System',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#d68536',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    width: 40,
    textAlign: 'center',
  },
});
