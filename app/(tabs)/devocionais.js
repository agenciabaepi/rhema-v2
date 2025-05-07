import React, { useRef } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Platform, Alert, Animated, TextInput } from 'react-native';
import { Image as ExpoImage } from 'react-native';
import { useState, useEffect } from 'react';
import bibliaCompleta from '../../assets/data/nvi.json';import Constants from 'expo-constants';
import { getFirestore, collection, addDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../../services/firebaseConfig'; // ajuste o caminho conforme sua estrutura
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FlatList } from 'react-native';
import ModalAudioDevocional from '../../components/ModalAudioDevocional';










export default function Devocional() {
  const router = useRouter();
  const [indexAtual, setIndexAtual] = useState(0);
  const flatListRef = useRef(null);
  // Animated opacity for modal header
  // Estado para o dia selecionado nos botões da semana
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [devocionalSelecionado, setDevocionalSelecionado] = useState(null);
  const [concluidos, setConcluidos] = useState([]);
  const [devocionalDoDia, setDevocionalDoDia] = useState(null);
  const [emojiPopupVisible, setEmojiPopupVisible] = useState(false);
  const [emojiPopupPosition, setEmojiPopupPosition] = useState({ x: 0, y: 0 });
  const [devocionalReagido, setDevocionalReagido] = useState(null);
  const [reacoes, setReacoes] = useState({});
  const [cardFocadoId, setCardFocadoId] = useState(null);
  // Estado para controlar se o usuário é moderador ou master
  const [isModeradorOuMaster, setIsModeradorOuMaster] = useState(false);
  // Estado para controle da modal de cadastro e campos do formulário
  const [modalCadastroVisible, setModalCadastroVisible] = useState(false);
  const [novoDevocional, setNovoDevocional] = useState({
    titulo: '',
    reflexao: '',
  });
  // Estados de check para validação dos campos do cadastro
  const [checkTitulo, setCheckTitulo] = useState(false);
  const [checkReflexao, setCheckReflexao] = useState(false);
  const [checkLivro, setCheckLivro] = useState(false);
  const [checkCapitulo, setCheckCapitulo] = useState(false);
  const [checkVersiculo, setCheckVersiculo] = useState(false);
  // Estados para seleção de versículo da bíblia
  const [livros, setLivros] = useState([]);
  const [capitulos, setCapitulos] = useState([]);
  const [versiculos, setVersiculos] = useState([]);
  const [livroSelecionado, setLivroSelecionado] = useState('');
  const [capituloSelecionado, setCapituloSelecionado] = useState('');
  // Novo: intervalo de versículos
  const [versiculoInicio, setVersiculoInicio] = useState('');
  const [versiculoFim, setVersiculoFim] = useState('');
  // Modais customizadas para seleção
  const [modalLivroVisible, setModalLivroVisible] = useState(false);
  const [modalCapituloVisible, setModalCapituloVisible] = useState(false);
  const [modalVersiculoVisible, setModalVersiculoVisible] = useState(false);
  // Animated values for modals
  const fadeLivroAnim = useRef(new Animated.Value(0)).current;
  const fadeCapituloAnim = useRef(new Animated.Value(0)).current;
  const fadeVersiculoAnim = useRef(new Animated.Value(0)).current;
  const [imagemSelecionada, setImagemSelecionada] = useState(null);

  // Estado para controle de carregamento das imagens dos cards/modal
  const [imagemCarregada, setImagemCarregada] = useState({});
  const [devocionais, setDevocionais] = useState([]);
  // Estado para barra de progresso da modal de leitura
  const [scrollProgress, setScrollProgress] = useState(0);
  // Estado para tipo da modal (devocional ou versiculo)
  const [modalTipo, setModalTipo] = useState(null);
  // Estado para mostrar header fixo na modal de leitura
  const [mostrarHeaderFixo, setMostrarHeaderFixo] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [modalAudioVisible, setModalAudioVisible] = useState(false);








  // Função para escolher imagem (corrigida para estar dentro do componente)
  const escolherImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Você precisa permitir acesso à galeria para selecionar imagens.');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
  
    if (!result.canceled && result.assets?.length > 0) {
      setImagemSelecionada(result.assets[0].uri);
    }
  };


  // Animated scale values for cards
  const escalaCards = useRef({}).current;
  // Fade animation for card focus
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Função para salvar devocional no Firestore com busca do nome/foto do usuário e upload correto da imagem
  const salvarDevocionalNoFirestore = async () => {
    // Validação dos campos obrigatórios
    if (
      novoDevocional.titulo.length < 10 ||
      novoDevocional.reflexao.length < 10 ||
      !livroSelecionado ||
      !capituloSelecionado ||
      !versiculoInicio ||
      !versiculoFim
    ) {
      Alert.alert('Preencha todos os campos obrigatórios corretamente.');
      return;
    }
    setCarregando(true);
    try {
      const db = getFirestore(app);
      const storage = getStorage(app);
      const auth = getAuth(app);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setCarregando(false);
        Alert.alert('Você precisa estar logado para cadastrar um devocional.');
        return;
      }

      // Buscar dados extras do usuário no Firestore
      let nomeAutor = currentUser.email;
      let fotoAutor = 'https://via.placeholder.com/100';

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.nome) nomeAutor = data.nome;
          if (data.foto) {
            fotoAutor = data.foto;
          } else if (data.photoURL) {
            fotoAutor = data.photoURL;
          }
        }
      } catch (e) {
        console.warn('Não foi possível carregar os dados do usuário no Firestore:', e);
      }

      let urlImagem = '';

      if (imagemSelecionada) {
        const response = await fetch(imagemSelecionada);
        const blob = await response.blob();
        const nomeArquivo = `devocionais/${Date.now()}.jpg`;
        const storageRef = ref(storage, nomeArquivo);
        await uploadBytes(storageRef, blob);
        urlImagem = await getDownloadURL(storageRef);
      }

      // Montar versículoBase e versículoCompleto a partir da seleção de intervalo
      const versiculoBase = `${livroSelecionado} ${capituloSelecionado}:${versiculoInicio}-${versiculoFim}`;
      const livro = bibliaCompleta.find(l => l.name === livroSelecionado);
      const capitulo = livro?.chapters[capituloSelecionado - 1] || [];
      const versiculoCompleto = capitulo.slice(
        Number(versiculoInicio) - 1,
        Number(versiculoFim)
      ).join('\n');

      const devocionalRef = collection(db, 'devocionais');
      await addDoc(devocionalRef, {
        titulo: novoDevocional.titulo,
        versiculoBase,
        versiculoCompleto,
        reflexao: novoDevocional.reflexao,
        autor: nomeAutor,
        fotoAutor: fotoAutor,
        imagem: urlImagem,
        data: new Date().toLocaleDateString('pt-BR'),
        criadoEm: Timestamp.now(),
        uid: currentUser.uid,
      });

      Alert.alert('Devocional cadastrado com sucesso!');
      setModalCadastroVisible(false);
      setNovoDevocional({
        titulo: '',
        reflexao: '',
      });
      setLivroSelecionado('');
      setCapituloSelecionado('');
      setVersiculoInicio('');
      setVersiculoFim('');
      setImagemSelecionada(null);
      setCheckTitulo(false);
      setCheckReflexao(false);
      setCheckLivro(false);
      setCheckCapitulo(false);
      setCheckVersiculo(false);
      setCarregando(false);
    } catch (error) {
      setCarregando(false);
      console.error('Erro ao salvar devocional:', error);
      Alert.alert('Erro ao salvar devocional.');
    }
  };
  // Carregar livros da bíblia ao abrir modal de cadastro
  useEffect(() => {
    if (modalCadastroVisible) {
      if (bibliaCompleta) {
        const nomesLivros = bibliaCompleta.map((livro) => ({
          nome: livro.name,
          capitulos: livro.chapters,
        }));
        setLivros(nomesLivros);
      }
    }
  }, [modalCadastroVisible]);

  // Carregar capítulos ao selecionar livro
  useEffect(() => {
    if (livroSelecionado) {
      const livro = bibliaCompleta.find(l => l.name === livroSelecionado);
      if (livro) {
        setCapitulos(livro.chapters.map((_, idx) => idx + 1));
      } else {
        setCapitulos([]);
      }
      setCapituloSelecionado('');
      setVersiculos([]);
      setVersiculoInicio('');
      setVersiculoFim('');
    }
  }, [livroSelecionado]);

  // Carregar versículos ao selecionar capítulo
  useEffect(() => {
    if (livroSelecionado && capituloSelecionado) {
      const livro = bibliaCompleta.find(l => l.name === livroSelecionado);
      const vers = livro?.chapters[capituloSelecionado - 1]?.map((_, index) => index + 1) || [];
      setVersiculos(vers);
      setVersiculoInicio('');
      setVersiculoFim('');
    }
  }, [capituloSelecionado]);

  const animarCard = (id) => {
    if (!escalaCards[id]) {
      escalaCards[id] = new Animated.Value(1);
    }
    Animated.spring(escalaCards[id], {
      toValue: 1.03,
      useNativeDriver: true,
      friction: 5,
    }).start(() => {
      setTimeout(() => {
        Animated.spring(escalaCards[id], {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }, 1500);
    });
  };

  const mostrarReacoes = (event, id) => {
    const { pageX, pageY } = event.nativeEvent;
    setEmojiPopupPosition({ x: pageX, y: pageY });
    setDevocionalReagido(id);
    animarCard(id);
    setEmojiPopupVisible(true);
    setCardFocadoId(null);
    setCardFocadoId(id);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
  };

    // Carrega o nível do usuário logado e define a permissão para cadastrar devocional
    useEffect(() => {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (currentUser) {
        const db = getFirestore(app);
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            const nivel = docSnap.data().nivel;
            if (['moderador', 'master'].includes(nivel)) {
              setIsModeradorOuMaster(true);
            }
          }
        });
      }
    }, []);

  // Carrega devocionais do Firestore em tempo real

useEffect(() => {
  const db = getFirestore(app);
  const unsubscribe = onSnapshot(
    collection(db, 'devocionais'),
    async (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Pré-carrega imagens (salva em cache)
      setDevocionais(lista); // Primeiro exibe os dados

// Depois tenta pré-carregar em background, sem travar a UI
      lista.forEach(dev => {
        if (dev.imagem) {
          ExpoImage.prefetch(dev.imagem).catch(err => {
            console.warn('Erro ao pré-carregar imagem:', err);
          });
        }
      });

      setDevocionais(lista);
    },
    (error) => {
      console.error('Erro ao buscar devocionais:', error);
    }
  );
  return () => unsubscribe();
}, []);

  // Seleciona o devocional mais recente como destaque E marca o dia selecionado como o dia atual
  useEffect(() => {
    if (devocionais.length > 0) {
      const maisRecente = [...devocionais].sort((a, b) => {
        const dataA = a.criadoEm?.seconds || 0;
        const dataB = b.criadoEm?.seconds || 0;
        return dataB - dataA;
      })[0];
      if (maisRecente) {
        setDevocionalDoDia(maisRecente.id);
      }
      const hoje = new Date();
      const hojeStr = hoje.toLocaleDateString('pt-BR');
      setDiaSelecionado(hojeStr);
    }
  }, [devocionais]);

  const concluirDevocional = async (id) => {
    try {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore(app);
      const docRef = doc(db, 'users', currentUser.uid, 'devocionaisConcluidos', id);
      await setDoc(docRef, {
        concluidoEm: Timestamp.now(),
      });

      setConcluidos((prev) => [...prev, id]);
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao marcar como concluído:', error);
    }
  };

  // Função para marcar versículo diário como concluído (igual estilo do concluirDevocional)
  const concluirVersiculo = async (id) => {
    try {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore(app);
      const docRef = doc(db, 'users', currentUser.uid, 'versiculosConcluidos', id);
      await setDoc(docRef, {
        concluidoEm: Timestamp.now(),
      });

      setConcluidos((prev) => [...prev, id]);
    } catch (error) {
      console.error('Erro ao marcar versículo como concluído:', error);
    }
  };

  // Adiciona o efeito para marcar o versículo como concluído ao voltar da tela de versiculo-diario
  const params = useLocalSearchParams();
  useEffect(() => {
    if (params?.versiculoConcluido) {
      const id = params.versiculoConcluido;
      setConcluidos((prev) => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
    }
  }, [params?.versiculoConcluido]);
  // useEffect para animar expansão/retração dos cards do devocional do dia
  useEffect(() => {
    if (cardFocadoId && escalaCards[cardFocadoId]) {
      Animated.timing(escalaCards[cardFocadoId], {
        toValue: 230,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Object.entries(escalaCards).forEach(([id, anim]) => {
        Animated.timing(anim, {
          toValue: 160,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [cardFocadoId]);

  // Adicionando variáveis hoje e hojeStr para uso no efeito do devocional do dia
  const hoje = new Date();
  const hojeStr = hoje.toLocaleDateString('pt-BR');
  // Efeito para selecionar automaticamente o devocional do dia
  // (Removido: seleção automática duplicada, já está no useEffect acima)

  useEffect(() => {
    const buscarConcluidos = async () => {
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore(app);
      const snapDevocionais = await getDocs(collection(db, 'users', currentUser.uid, 'devocionaisConcluidos'));
      const snapVersiculos = await getDocs(collection(db, 'users', currentUser.uid, 'versiculosConcluidos'));

      const ids = [
        ...snapDevocionais.docs.map(doc => doc.id),
        ...snapVersiculos.docs.map(doc => doc.id),
      ];

      setConcluidos(ids);
    };
    buscarConcluidos();
  }, []);

  useEffect(() => {
    const unsubscribeBlur = router.addListener?.('blur', () => {
      setCardFocadoId(null);
      setModalVisible(false);
    });

    const unsubscribeFocus = router.addListener?.('focus', () => {
      setCardFocadoId(null);
    });

    return () => {
      unsubscribeBlur?.();
      unsubscribeFocus?.();
    };
  }, [router]);

  useEffect(() => {
    if (modalCadastroVisible) {
      setCardFocadoId(null);
    }
  }, [modalCadastroVisible]);

  return (
    <>
      <View style={styles.container}>
        <View style={{ paddingHorizontal: 16 }}>
          {isModeradorOuMaster && (
            <TouchableOpacity style={styles.botaoCadastrar} onPress={() => setModalCadastroVisible(true)}>
              <Text style={styles.botaoCadastrarTexto}>Cadastrar Devocional do Dia</Text>
            </TouchableOpacity>
          )}
          <View style={{ marginTop: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {/* Bolinhas dos dias da semana */}
              {(() => {
                const hoje = new Date();
                const hojeStr = hoje.toLocaleDateString('pt-BR');
                return (
                  [...Array(7)].map((_, index) => {
                    const data = new Date();
                    data.setHours(0,0,0,0);
                    data.setDate(hoje.getDate() - (hoje.getDay() - index)); // calcula data exata de cada dia da semana
                    const dia = data.getDate();
                    const mes = data.getMonth() + 1;
                    const diaStr = `${('0'+dia).slice(-2)}/${('0'+mes).slice(-2)}/${data.getFullYear()}`;
                    // Mostrar apenas a inicial do dia da semana
                    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().charAt(0);
                    const encontrado = devocionais.find(d => d.data === diaStr);
                    const selecionado = diaStr === diaSelecionado;
                    // Comparação de datas: data (Date) e hoje (Date), ambos zerados hora/min/seg/ms
                    const dataCmp = new Date(data.getFullYear(), data.getMonth(), data.getDate());
                    const hojeCmp = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
                    // Lógica de progresso para barra linear
                    const progresso = (() => {
                      if (!encontrado) return 0;
                      let total = 0;
                      if (concluidos.includes(encontrado.id)) total += 0.5;
                      if (concluidos.includes(`${encontrado.id}-versiculo`)) total += 0.5;
                      return total;
                    })();
                    // Lógica para determinar as cores do anel de progresso
                    let borderColors = {
                      borderTopColor: progresso > 0 ? '#d68536' : 'transparent',
                      borderRightColor: 'transparent',
                      borderBottomColor: 'transparent',
                      borderLeftColor: 'transparent',
                    };
                    if (progresso >= 0.5) {
                      borderColors.borderRightColor = '#d68536';
                    }
                    if (progresso === 1) {
                      borderColors.borderBottomColor = '#d68536';
                      borderColors.borderLeftColor = '#d68536';
                    }
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          if (encontrado && dataCmp <= hojeCmp) {
                            setDevocionalDoDia(encontrado.id);
                            setDiaSelecionado(diaStr);
                          }
                        }}
                        style={{ alignItems: 'center', justifyContent: 'center' }}
                      >
                        <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {/* Anel de progresso externo */}
                          <View
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              borderWidth: 3,
                              borderColor: '#E5E7EB',
                              borderTopColor: borderColors.borderTopColor,
                              borderRightColor: borderColors.borderRightColor,
                              borderBottomColor: borderColors.borderBottomColor,
                              borderLeftColor: borderColors.borderLeftColor,
                              zIndex: 2,
                            }}
                          />
                         <View
                           style={{
                             width: 44,
                             height: 44,
                             borderRadius: 22,
                             borderWidth: 2,
                             borderColor: '#E5E7EB',
                             backgroundColor: selecionado ? '#ffefd5' : (dataCmp > hojeCmp ? '#F3F4F6' : 'white'),
                             alignItems: 'center',
                             justifyContent: 'center',
                             position: 'relative',
                             zIndex: 1, // garantir que o círculo principal fique sobre o anel
                           }}
                         >
                           {dataCmp > hojeCmp ? (
                             <Feather name="lock" size={16} color="#9CA3AF" />
                           ) : (
                             <Text style={{ color: selecionado ? '#333' : '#9CA3AF', fontWeight: 'bold', fontSize: 17 }}>
                               {diaSemana}
                             </Text>
                           )}
                         </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                );
              })()}
            </View>
          </View>
        </View>
        <Pressable
          onPressOut={(e) => {
            if (cardFocadoId) {
              setCardFocadoId(null);
            }
          }}
          style={{ flex: 1 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 0 }}
          >
            {/* Cards Devocional e Versículo Diário agrupados em um único container vertical */}
            {devocionalDoDia && (() => {
              const dev = devocionais.find((d) => d.id === devocionalDoDia);
              if (!dev) return null;

              const alturaAnimada = escalaCards[dev.id] || new Animated.Value(160);
              escalaCards[dev.id] = alturaAnimada;

              const handleExpandCard = (id) => {
                setCardFocadoId(prev => (prev === id ? null : id));
              };

              return (
                <View
                  key={dev.id + '-cards'}
                  style={{
                    backgroundColor: '#f6f1e6',
                    paddingVertical: 24,
                    paddingHorizontal: 24,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    width: '100%',
                    flex: 1,
                    minHeight: '100%',
                    alignSelf: 'stretch',
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 4 }}>{dev.data}</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 16 }}>
                    {dev.titulo}
                  </Text>

                  {/* CARD 1 - Devocional */}
                  <Animated.View
                    style={{
                      height: alturaAnimada,
                      overflow: 'hidden',
                      marginBottom: -60,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => handleExpandCard(dev.id)}
                    >
                      <View style={[styles.cardDia]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="message-circle" size={22} color="#d68536" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#d68536' }}>Devocional</Text>
                          </View>
                          {concluidos.includes(dev.id) && (
                            <LottieView
                              source={require('../../assets/animations/checkmark.json')}
                              autoPlay
                              loop={false}
                              style={{ width: 36, height: 36, backgroundColor: 'transparent' }}
                            />
                          )}
                        </View>

                        {cardFocadoId === dev.id && (
                          <>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#111' }}>
                              {dev.versiculoBase}
                            </Text>
                            <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  backgroundColor: '#111827',
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                }}
                                onPress={() => {
                                  setDevocionalSelecionado({
                                    ...dev,
                                    versiculosArray: Array.isArray(dev.versiculoCompleto)
                                      ? dev.versiculoCompleto
                                      : (dev?.versiculoCompleto?.split('\n').filter(v => v.trim()) || []),
                                    versiculoBase: dev.versiculoBase,
                                    id: dev.id,
                                    titulo: dev.titulo,
                                    autor: dev.autor,
                                    reflexao: dev.reflexao,
                                    imagem: dev.imagem,
                                    fotoAutor: dev.fotoAutor
                                  });
                                  setModalTipo('devocional');
                                  setModalVisible(true);
                                }}
                              >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>LER</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  backgroundColor: '#111827',
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  alignItems: 'center',
                                }}
                                onPress={() => {
                                  Alert.alert('Em breve!', 'O player de áudio está em construção. Aguarde novidades!');
                                }}
                              >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>OUVIR</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* CARD 2 - Versículo Diário */}
                  <Animated.View
                    style={{
                      height: cardFocadoId === dev.id + '-versiculo' ? 230 : 160,
                      overflow: 'hidden',
                      marginBottom: 0,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setCardFocadoId(prev => (prev === dev.id + '-versiculo' ? null : dev.id + '-versiculo'));
                      }}
                    >
                      <View style={[styles.cardDia]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="book-open" size={22} color="#d68536" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#d68536' }}>Versículo Diário</Text>
                          </View>
                          {/* Mostra o checkmark se o versículo foi concluído, usando dev.id como base */}
                          {concluidos.includes(`${dev.id}-versiculo`) && (
                            <LottieView
                              source={require('../../assets/animations/checkmark.json')}
                              autoPlay
                              loop={false}
                              style={{ width: 36, height: 36, backgroundColor: 'transparent' }}
                            />
                          )}
                        </View>
                        {cardFocadoId === dev.id + '-versiculo' && (
                          <>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#111' }}>
                              {dev.versiculoBase}
                            </Text>
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#d68536',
                            paddingVertical: 10,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            setDevocionalSelecionado({
                              ...dev,
                              versiculosArray: Array.isArray(dev.versiculoCompleto)
                                ? dev.versiculoCompleto
                                : (dev?.versiculoCompleto?.split('\n').filter(v => v.trim()) || []),
                              versiculoBase: dev.versiculoBase,
                              versiculoId: `${dev.id}-versiculo`,
                              titulo: dev.titulo,
                              livro: dev.versiculoBase?.split(' ')[0],
                              capitulo: dev.versiculoBase?.split(' ')[1]?.split(':')[0],
                              inicio: dev.versiculoBase?.split(':')[1]?.split('-')[0],
                            });
                            setModalTipo('versiculo');
                            setModalVisible(true);
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>ABRIR VERSÍCULO</Text>
                        </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              );
            })()}
          </ScrollView>
        </Pressable>

        <Modal
          animationType="slide"
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            {/* Header fixo com fade-in/fade-out, aparece após rolar 150px */}
            {mostrarHeaderFixo && (
              <Animated.View style={{
                opacity: headerOpacity,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
                backgroundColor: '#F9FAFB',
                paddingTop: 30,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 20,
              }}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={{ fontSize: 40, fontWeight: 'bold' }}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, height: 4, backgroundColor: '#E5E7EB', marginLeft: 12 }}>
                  <View style={{ height: '100%', backgroundColor: '#d68536', width: `${scrollProgress * 100}%` }} />
                </View>
              </Animated.View>
            )}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                contentContainerStyle={[styles.modalContent, { paddingBottom: 130 }]}
                onScroll={(e) => {
                  const contentHeight = e.nativeEvent.contentSize.height;
                  const scrollY = e.nativeEvent.contentOffset.y;
                  const visibleHeight = e.nativeEvent.layoutMeasurement.height;
                  const progress = Math.min(scrollY / (contentHeight - visibleHeight), 1);
                  setScrollProgress(progress);

                  if (scrollY > 150 && !mostrarHeaderFixo) {
                    setMostrarHeaderFixo(true);
                    Animated.timing(headerOpacity, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    }).start();
                  } else if (scrollY <= 150 && mostrarHeaderFixo) {
                    Animated.timing(headerOpacity, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => setMostrarHeaderFixo(false));
                  }
                }}
                scrollEventThrottle={16}
              >
                {/* Antiga barra de progresso removida, pois agora está no header fixo */}
                <Pressable onPress={() => setModalVisible(false)} style={styles.backButton}>
                  <Text style={{ fontSize: 30, fontWeight: 'bold' }}>←</Text>
                </Pressable>
                {modalTipo === 'devocional' && devocionalSelecionado && (
                  <>
                    {devocionalSelecionado?.versiculoCompleto ? (
                      <>
                        <View style={{ position: 'relative' }}>
                          {!imagemCarregada[devocionalSelecionado?.id] && (
                            <LottieView
                              source={require('../../assets/animations/loading.json')}
                              autoPlay
                              loop
                              style={styles.loadingImagemCard}
                            />
                          )}
                          {devocionalSelecionado.imagem && (
                            <ExpoImage
                              source={{ uri: devocionalSelecionado.imagem }}
                              style={[styles.modalImage, !imagemCarregada[devocionalSelecionado?.id] && styles.imagemPlaceholder]}
                              onLoadEnd={() => setImagemCarregada(prev => ({ ...prev, [devocionalSelecionado.id]: true }))}
                              contentFit="cover"
                              transition={300}
                            />
                          )}
                        </View>
                        <Text style={styles.modalTitle}>{devocionalSelecionado.titulo}</Text>
                        <Text style={styles.modalVerse}>{devocionalSelecionado.versiculoBase}</Text>
                        <Text style={styles.modalVerseText}>"{devocionalSelecionado.versiculoCompleto}"</Text>

                        <View style={{ marginVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} />

                        <Text style={[styles.modalTitle, { fontSize: 18, marginBottom: 4 }]}>Reflexão do Dia</Text>
                        <Text style={styles.modalBody}>{devocionalSelecionado.reflexao}</Text>
                        <TouchableOpacity
                          style={[
                            styles.concluirButton,
                            concluidos.includes(devocionalSelecionado.id) && { backgroundColor: '#9CA3AF' }
                          ]}
                          onPress={() => concluirDevocional(devocionalSelecionado.id)}
                          disabled={concluidos.includes(devocionalSelecionado.id)}
                        >
                          <Text style={styles.concluirText}>
                            {concluidos.includes(devocionalSelecionado.id) ? 'Devocional já concluído' : 'Concluir Devocional'}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.autorContainer}>
                          {devocionalSelecionado.fotoAutor && (
                            <ExpoImage
                              source={{ uri: devocionalSelecionado.fotoAutor }}
                              style={[styles.autorFoto, styles.imagemPlaceholder]}
                              contentFit="cover"
                              transition={200}
                            />
                          )}
                          <View>
                            <Text style={styles.autorLabel}>Autor(a)</Text>
                            <Text style={styles.autorNome}>{devocionalSelecionado.autor}</Text>
                          </View>
                        </View>
                      </>
                    ) : (
                      <Text style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>Conteúdo indisponível para este devocional.</Text>
                    )}
                  </>
                )}
                {/* VERSÍCULO MODAL - stories/flatlist */}
                {modalTipo === 'versiculo' && devocionalSelecionado && (
                  <>
                    {/* Barra de progresso */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16 }}>
                      {(devocionalSelecionado?.versiculosArray || []).map((_, idx) => (
                        <View
                          key={idx}
                          style={{
                            flex: 1,
                            height: 4,
                            marginHorizontal: 2,
                            borderRadius: 10,
                            backgroundColor: idx <= indexAtual ? '#d68536' : '#e5e7eb',
                          }}
                        />
                      ))}
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#666', marginTop: 16 }}>
                      {devocionalSelecionado.livro} {devocionalSelecionado.capitulo}:{Number(devocionalSelecionado.inicio) + indexAtual}
                    </Text>
                    <View style={{ minHeight: 300, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#d68536', marginBottom: 8 }}>
                        {Number(devocionalSelecionado.inicio) + indexAtual} "
                      </Text>
                      {Array.isArray(devocionalSelecionado?.versiculosArray) &&
                        devocionalSelecionado.versiculosArray[indexAtual] && (
                          <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', lineHeight: 36 }}>
                            {devocionalSelecionado.versiculosArray[indexAtual]}
                          </Text>
                      )}
                    </View>
                    {/* Botões de navegação */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 }}>
                      <TouchableOpacity
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: indexAtual === 0 ? '#E5E7EB' : '#d68536',
                          opacity: indexAtual === 0 ? 0.5 : 1,
                        }}
                        onPress={() => {
                          if (indexAtual > 0) setIndexAtual(indexAtual - 1);
                        }}
                        disabled={indexAtual === 0}
                      >
                        <Feather name="chevron-left" size={24} color="#fff" />
                      </TouchableOpacity>
                      {indexAtual < devocionalSelecionado.versiculosArray.length - 1 ? (
                        <TouchableOpacity
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: '#d68536',
                          }}
                          onPress={() => {
                            if (indexAtual < devocionalSelecionado.versiculosArray.length - 1)
                              setIndexAtual(indexAtual + 1);
                          }}
                        >
                          <Feather name="chevron-right" size={24} color="#fff" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    {/* Botão de concluir versículo - agora dentro do ScrollView, logo após os versículos */}
                    {modalTipo === 'versiculo' && devocionalSelecionado && indexAtual === devocionalSelecionado.versiculosArray.length - 1 && (
                      <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
                        {concluidos.includes(devocionalSelecionado.versiculoId) ? (
                          <View style={{
                            backgroundColor: '#ccc',
                            paddingVertical: 16,
                            borderRadius: 30,
                            alignItems: 'center',
                          }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                              VERSÍCULO DO DIA CONCLUÍDO
                            </Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#d68536',
                              paddingVertical: 16,
                              borderRadius: 30,
                              alignItems: 'center',
                            }}
                            onPress={async () => {
                              const auth = getAuth(app);
                              const user = auth.currentUser;
                              if (!user) return;
                              try {
                                const ref = doc(getFirestore(app), 'users', user.uid, 'versiculosConcluidos', devocionalSelecionado.versiculoId);
                                await setDoc(ref, {
                                  concluidoEm: Timestamp.now(),
                                });
                                setConcluidos(prev => [...prev, devocionalSelecionado.versiculoId]);
                                setModalVisible(false);
                              } catch (e) {
                                console.error('Erro ao concluir versículo:', e);
                              }
                            }}
                          >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                              CONCLUIR VERSÍCULO
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </TouchableWithoutFeedback>

          </KeyboardAvoidingView>
        </Modal>
        {emojiPopupVisible && !cardFocadoId && (
          <Pressable style={styles.emojiBackdrop} onPress={() => setEmojiPopupVisible(false)}>
            <View style={styles.emojiPopupCentered}>
              {['👍', '❤️', '😮', '😢', '🙏'].map((emoji) => (
                <Text
                  key={emoji}
                  style={styles.emojiOption}
                  onPress={() => {
                    setReacoes((prev) => ({
                      ...prev,
                      [devocionalReagido]: emoji,
                    }));
                    setEmojiPopupVisible(false);
                  }}
                >
                  {emoji}
                </Text>
              ))}
            </View>
          </Pressable>
        )}
        {/* Removido: card especial expandido com celebration.json */}
      </View>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalCadastroVisible}
        onRequestClose={() => setModalCadastroVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={[styles.modalContent, { paddingBottom: 120 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Pressable onPress={() => setModalCadastroVisible(false)} style={styles.backButton}>
                <Text style={{ fontSize: 40, fontWeight: 'bold' }}>←</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Cadastrar Devocional</Text>

              {/* Campo Título com contador regressivo e check */}
              <View style={{ position: 'relative' }}>
                {/*
                  O contador começa em 10 e vai diminuindo enquanto digita.
                  O check animado só aparece quando chega a 0 ou menor.
                */}
                {(() => {
                  const tituloRestante = Math.max(0, 10 - novoDevocional.titulo.length);
                  return (
                    <>
                      <TextInput
                        placeholder="Título"
                        value={novoDevocional.titulo}
                        onChangeText={(text) => {
                          setNovoDevocional({ ...novoDevocional, titulo: text });
                          setCheckTitulo(text.length >= 10);
                        }}
                        style={styles.input}
                      />
                      <Text style={{ position: 'absolute', right: 48, top: 14, fontSize: 12, color: '#9CA3AF' }}>
                        {tituloRestante}
                      </Text>
                      {tituloRestante <= 0 && (
                        <LottieView
                          source={require('../../assets/animations/checkmark.json')}
                          autoPlay
                          loop={false}
                          style={{ width: 24, height: 24, position: 'absolute', right: 16, top: 12, backgroundColor: 'transparent', }}
                        />
                      )}
                    </>
                  );
                })()}
              </View>

              <Text style={styles.modalTitle}>Selecionar Versículo</Text>
              {/* BOTÃO SELECIONAR LIVRO */}
              <View style={{ position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    setModalLivroVisible(true);
                    fadeLivroAnim.setValue(0);
                    Animated.timing(fadeLivroAnim, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: true,
                    }).start();
                  }}
                  style={styles.selectBox}
                >
                  <Text>{livroSelecionado || 'Selecionar Livro'}</Text>
                </TouchableOpacity>
                {checkLivro && (
                  <LottieView
                    source={require('../../assets/animations/checkmark.json')}
                    autoPlay
                    loop={false}
                    style={{ width: 24, height: 24, position: 'absolute', right: 16, top: 12, backgroundColor: 'transparent', }}
                  />
                )}
              </View>
              {/* BOTÃO SELECIONAR CAPÍTULO */}
              {capitulos.length > 0 && (
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setModalCapituloVisible(true);
                      fadeCapituloAnim.setValue(0);
                      Animated.timing(fadeCapituloAnim, {
                        toValue: 1,
                        duration: 250,
                        useNativeDriver: true,
                      }).start();
                    }}
                    style={styles.selectBox}
                    disabled={!livroSelecionado}
                  >
                    <Text>
                      {capituloSelecionado
                        ? `Capítulo ${capituloSelecionado}`
                        : 'Selecionar Capítulo'}
                    </Text>
                  </TouchableOpacity>
                  {checkCapitulo && (
                    <LottieView
                      source={require('../../assets/animations/checkmark.json')}
                      autoPlay
                      loop={false}
                      style={{ width: 24, height: 24, position: 'absolute', right: 16, top: 12, backgroundColor: 'transparent' }}
                    />
                  )}
                </View>
              )}
              {/* SELEÇÃO DE INTERVALO DE VERSÍCULOS */}
              {versiculos.length > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Versículo Inicial</Text>
                    <TouchableOpacity
                      style={styles.selectBox}
                      onPress={() => {
                        setModalVersiculoVisible(true);
                        fadeVersiculoAnim.setValue(0);
                        Animated.timing(fadeVersiculoAnim, {
                          toValue: 1,
                          duration: 250,
                          useNativeDriver: true,
                        }).start();
                      }}
                    >
                      <Text>{versiculoInicio || 'Selecionar'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Versículo Final</Text>
                    <TouchableOpacity
                      style={styles.selectBox}
                      onPress={() => {
                        setModalVersiculoVisible(true);
                        fadeVersiculoAnim.setValue(0);
                        Animated.timing(fadeVersiculoAnim, {
                          toValue: 1,
                          duration: 250,
                          useNativeDriver: true,
                        }).start();
                      }}
                    >
                      <Text>{versiculoFim || 'Selecionar'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {versiculoInicio && versiculoFim ? (
                <Text style={styles.modalVerseText}>
                  {
                    (() => {
                      const livro = bibliaCompleta.find(l => l.name === livroSelecionado);
                      const capitulo = livro?.chapters[capituloSelecionado - 1] || [];
                      const versos = capitulo.slice(
                        Number(versiculoInicio) - 1,
                        Number(versiculoFim)
                      );
                      return versos.length > 0 ? versos.join('\n') : '';
                    })()
                  }
                </Text>
              ) : null}
      {/* MODAL LIVRO */}
      <Modal
        visible={modalLivroVisible}
        transparent
        animationType="none"
        onRequestClose={() => setModalLivroVisible(false)}
      >
        <Pressable style={styles.modalPickerBackdrop} onPress={() => setModalLivroVisible(false)}>
          <Animated.View
            style={[
              styles.modalPickerContainer,
              {
                opacity: fadeLivroAnim,
                transform: [
                  {
                    translateY: fadeLivroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.modalPickerTitle}>Selecione o Livro</Text>
            <FlatList
              data={livros}
              keyExtractor={(item) => item.nome}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setLivroSelecionado(item.nome);
                    setCapitulos(item.capitulos.map((_, index) => index + 1));
                    setModalLivroVisible(false);
                    setCheckLivro(true);
                    setCheckCapitulo(false);
                    setCheckVersiculo(false);
                    setCapituloSelecionado('');
                  }}
                >
                  <Text>{item.nome}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </Pressable>
      </Modal>
      {/* MODAL CAPÍTULO */}
      <Modal
        visible={modalCapituloVisible}
        transparent
        animationType="none"
        onRequestClose={() => setModalCapituloVisible(false)}
      >
        <Pressable style={styles.modalPickerBackdrop} onPress={() => setModalCapituloVisible(false)}>
          <Animated.View
            style={[
              styles.modalPickerContainer,
              {
                opacity: fadeCapituloAnim,
                transform: [
                  {
                    translateY: fadeCapituloAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.modalPickerTitle}>Selecione o Capítulo</Text>
            <FlatList
              data={capitulos}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setCapituloSelecionado(item);
                    setModalCapituloVisible(false);
                    setCheckCapitulo(true);
                    setCheckVersiculo(false);
                  }}
                >
                  <Text>{`Capítulo ${item}`}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </Pressable>
      </Modal>

      {/* MODAL VERSÍCULO: seleção visual de versículo inicial/final */}
      <Modal
        visible={modalVersiculoVisible}
        transparent
        animationType="none"
        onRequestClose={() => setModalVersiculoVisible(false)}
      >
        <Pressable style={styles.modalPickerBackdrop} onPress={() => setModalVersiculoVisible(false)}>
          <Animated.View
            style={[
              styles.modalPickerContainer,
              {
                opacity: fadeVersiculoAnim,
                transform: [
                  {
                    translateY: fadeVersiculoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.modalPickerTitle}>Selecione o Versículo</Text>
            <FlatList
              data={versiculos}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    if (!versiculoInicio) {
                      setVersiculoInicio(item.toString());
                    } else {
                      setVersiculoFim(item.toString());
                      setCheckVersiculo(true);
                    }
                    setModalVersiculoVisible(false);
                  }}
                >
                  <Text>{`Versículo ${item}`}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </Pressable>
      </Modal>

              {/* Campo Reflexão com contador regressivo e check */}
              <View style={{ position: 'relative' }}>
                {/*
                  O contador começa em 50 e vai diminuindo enquanto digita.
                  O check animado só aparece quando chega a 0 ou menor.
                */}
                {(() => {
                  const reflexaoRestante = Math.max(0, 50 - novoDevocional.reflexao.length);
                  return (
                    <>
                      <TextInput
                        placeholder="Reflexão"
                        value={novoDevocional.reflexao}
                        onChangeText={(text) => {
                          setNovoDevocional({ ...novoDevocional, reflexao: text });
                          setCheckReflexao(text.length >= 50);
                        }}
                        multiline
                        style={styles.textArea}
                      />
                      <Text style={{ position: 'absolute', right: 48, top: 14, fontSize: 12, color: '#9CA3AF' }}>
                        {reflexaoRestante}
                      </Text>
                      {reflexaoRestante <= 0 && (
                        <LottieView
                          source={require('../../assets/animations/checkmark.json')}
                          autoPlay
                          loop={false}
                          style={{ width: 24, height: 24, position: 'absolute', right: 16, top: 12, backgroundColor: 'transparent', }}
                        />
                      )}
                    </>
                  );
                })()}
              </View>

              <TouchableOpacity style={styles.concluirButton} onPress={escolherImagem}>
                <Text style={styles.concluirText}>Selecionar Imagem</Text>
              </TouchableOpacity>

              {imagemSelecionada && (
                <View style={{ position: 'relative', marginBottom: 12 }}>
                  {imagemSelecionada && (
                    <ExpoImage source={{ uri: imagemSelecionada }} style={styles.cardImageGrande} contentFit="cover" transition={300} />
                  )}
                  <LottieView
                    source={require('../../assets/animations/checkmark.json')}
                    autoPlay
                    loop={false}
                    style={{ width: 40, height: 40, position: 'absolute', bottom: 10, right: 10, backgroundColor: 'transparent', }}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.concluirButton}
                onPress={salvarDevocionalNoFirestore}
                disabled={carregando}
              >
                {carregando ? (
                  <LottieView
                    source={require('../../assets/animations/loading.json')}
                    autoPlay
                    loop
                    style={{ width: 40, height: 40 }}
                  />
                ) : (
                  <Text style={styles.concluirText}>Postar Devocional</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
          {/* Spinner de carregamento centralizado enquanto o devocional está sendo salvo */}
          {carregando && (
            <View style={styles.loadingOverlay}>
              <LottieView
                source={require('../../assets/animations/loading.json')}
                autoPlay
                loop
                style={{ width: 80, height: 80 }}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

            <ModalAudioDevocional
        visible={modalAudioVisible}
        onClose={() => setModalAudioVisible(false)}
        devocional={devocionalSelecionado}
      />
  </>
  );
}

const styles = StyleSheet.create({
  imagemPlaceholder: {
    backgroundColor: '#E5E7EB', // cinza claro
  },
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'left',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkMark: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  destaqueDia: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#d68536',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#d68536',
    marginBottom: 4,
  },
  cardVerse: {
    fontFamily: 'Georgia-Italic',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardResumo: {
    fontFamily: 'Georgia-Italic',
    fontSize: 15,
    color: '#4B5563',
  },
  cardData: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalContent: {
    padding: 20,
    marginTop: 80,
  },
  backButton: {
    marginBottom: 12,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#d68536',
    marginBottom: 8,
  },
  modalVerse: {
    fontFamily: 'Georgia-Italic',
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  modalVerseText: {
    fontFamily: 'Georgia-Regular',
    fontSize: 16,
    color: '#111',
    marginBottom: 12,
  },
  modalBody: {
    fontFamily: 'Georgia-Regular',
    fontSize: 16,
    color: '#111',
  },
  reacoesContainer: {
    marginTop: 20,
    marginBottom: 12,
  },
  reacoesTitulo: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  reacoesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  reacao: {
    fontSize: 24,
  },
  concluirButton: {
    backgroundColor: '#d68536',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  concluirText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  autorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
  },
  autorFoto: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },
  autorLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  autorNome: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  cardDia: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#d68536',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    borderWidth: 0,
    position: 'relative',
  },
  cardImageGrande: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardMenor: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaSemana: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  outrosTitulo: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginVertical: 12,
  },
  emojiPopup: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  emojiBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.0)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  emojiPopupCentered: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiOption: {
    fontSize: 24,
    marginHorizontal: 6,
    marginVertical: 4,
  },
  reacoesFixas: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reacaoItem: {
    fontSize: 14,
  },
  // cardExpandido removido
  cardFocusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  cardFocusWrapper: {
    width: '80%',
    maxWidth: 400,
  },
  emojiPopupFixed: {
    marginTop: 12,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  botaoCadastrar: {
    backgroundColor: '#d68536',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  botaoCadastrarTexto: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Georgia-Italic',
    height: 100,
    textAlignVertical: 'top',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingImagemCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
    zIndex: 10,
  },
  checkAnimado: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    zIndex: 10,
  },
  animacaoCheck: {
    width: 40,
    height: 40,
  },

  selectBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  modalPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: '60%',
    minHeight: 150,
    elevation: 10,
  },
  modalPickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#d68536',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },








});

 
