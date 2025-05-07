  // Função para limpar todos os arquivos .mp3 do cache
  const limparCacheDeAudios = async () => {
    const cacheDir = FileSystem.cacheDirectory;
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const audios = files.filter(f => f.endsWith('.mp3'));

    for (let file of audios) {
      await FileSystem.deleteAsync(cacheDir + file, { idempotent: true });
    }

    alert('Cache de áudio limpo com sucesso!');
  };
import React, { useState, useEffect } from 'react';
import { PanResponder } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Audio } from 'expo-av';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import axios from 'axios';


function md5(string) {
  function RotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function AddUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = lX & 0x80000000;
    lY8 = lY & 0x80000000;
    lX4 = lX & 0x40000000;
    lY4 = lY & 0x40000000;
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | (~z)); }
  function FF(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
    return AddUnsigned(RotateLeft(a, s), b);
  }
  function ConvertToWordArray(string) {
    var lWordCount;
    var lMessageLength = string.length;
    var lNumberOfWordsTemp1 = lMessageLength + 8;
    var lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function WordToHex(lValue) {
    var WordToHexValue = '', WordToHexValueTemp = '', lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      WordToHexValueTemp = '0' + lByte.toString(16);
      WordToHexValue += WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2);
    }
    return WordToHexValue;
  }
  var x = [], k, AA, BB, CC, DD, a, b, c, d;
  var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  string = unescape(encodeURIComponent(string));
  x = ConvertToWordArray(string);
  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = AddUnsigned(a, AA); b = AddUnsigned(b, BB);
    c = AddUnsigned(c, CC); d = AddUnsigned(d, DD);
  }
  return (WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d)).toLowerCase();
}

export default function ModalAudioDevocional({ visible, onClose, devocional }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState(null);
  const [rate, setRate] = useState(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Barra de progresso customizada com PanResponder
  const progressBarWidth = 250;
  const [dragging, setDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      setDragging(true);
    },
    onPanResponderMove: (_, gestureState) => {
      const newPos = Math.min(Math.max(0, dragPosition + gestureState.dx), progressBarWidth);
      setDragPosition(newPos);
    },
    onPanResponderRelease: async (_, gestureState) => {
      setDragging(false);
      const newPos = Math.min(Math.max(0, dragPosition + gestureState.dx), progressBarWidth);
      if (status?.durationMillis && sound) {
        const percent = newPos / progressBarWidth;
        const newPosition = status.durationMillis * percent;
        await sound.setPositionAsync(newPosition);
      }
    }
  });

  useEffect(() => {
    if (!dragging && status?.positionMillis && status?.durationMillis) {
      const percent = status.positionMillis / status.durationMillis;
      setDragPosition(percent * progressBarWidth);
    }
  }, [status, dragging]);

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
    setIsLoadingAudio(true);
    try {
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
      const hash = md5(texto + 'ZQe5CZNOzWyzPSCn5a3c');
      const fileUri = FileSystem.cacheDirectory + `${hash}.mp3`;
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
            // Audio mode já é configurado no useEffect
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
          url: 'https://api.elevenlabs.io/v1/text-to-speech/ZQe5CZNOzWyzPSCn5a3c',
          headers: {
            'xi-api-key': 'sk_bbcf87057ce0527053526040947f3b35a4b5f2676c738eec',
            'Content-Type': 'application/json'
          },
          data: {
            text: texto,
            model_id: 'eleven_multilingual_v2',
            voice_id: 'ZQe5CZNOzWyzPSCn5a3c',
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
          // Audio mode já é configurado no useEffect
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
    } finally {
      setIsLoadingAudio(false);
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
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

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
            <View style={[styles.progressBar, { width: progressBarWidth }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: dragging
                      ? dragPosition
                      : status && status.durationMillis
                        ? `${(status.positionMillis / status.durationMillis) * 100}%`
                        : '0%',
                  },
                ]}
              />
              <View
                pointerEvents="box-none"
                style={[
                  styles.thumb,
                  {
                    left: dragging
                      ? dragPosition - 8
                      : status && status.durationMillis
                        ? (status.positionMillis / status.durationMillis) * progressBarWidth - 8
                        : -8,
                  },
                ]}
                {...panResponder.panHandlers}
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
            <TouchableOpacity onPress={limparCacheDeAudios} style={styles.playerButton}>
              <Feather name="trash-2" size={24} color="#d68536" />
            </TouchableOpacity>
          </View>
          {isLoadingAudio && (
            <Text style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              Carregando áudio...
            </Text>
          )}
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
  thumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#d68536',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    width: 40,
    textAlign: 'center',
  },
});
