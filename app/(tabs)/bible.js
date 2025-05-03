import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView,
  Share,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bibleData from '../../assets/data/nvi.json';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, getDocs, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';




export default function BibleScreen() {
  

  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedBook, setSelectedBook] = useState(bibleData[0]);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [verseModalVisible, setVerseModalVisible] = useState(false);
  const [favorites, setFavorites] = useState({});
  const [highlights, setHighlights] = useState({});
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedVerseForNote, setSelectedVerseForNote] = useState(null);
  const [annotatedVerses, setAnnotatedVerses] = useState({});
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [existingNotes, setExistingNotes] = useState([]);
  const [localToast, setLocalToast] = useState(null);
  const noteInputRef = useRef(null);

  useEffect(() => {
    Notifications.getExpoPushTokenAsync().then(token => {
      console.log('TOKEN:', token.data);
    }).catch(error => {
      console.log('Erro ao obter token:', error);
    });
  }, []);



  const fetchExistingNotes = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedVerseForNote) return;
  
    const notesRef = collection(db, 'users', uid, 'anotacoes');
    const snapshot = await getDocs(notesRef);
  
    const notesArray = [];
  
    snapshot.forEach((doc) => {
      const note = doc.data();
      if (
        note.livro === selectedVerseForNote.livro &&
        note.capitulo === selectedVerseForNote.capitulo &&
        note.versiculo === selectedVerseForNote.versiculo
      ) {
        notesArray.push({
          id: doc.id,
          anotacao: note.anotacao || '',
          criadoEm: note.criadoEm?.toDate?.() || new Date(0),
        });
      }
    });
  
    // Ordena por data (mais recentes primeiro)
    notesArray.sort((a, b) => b.criadoEm - a.criadoEm);
  
    setExistingNotes(notesArray);
  };
  
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus === 'granted') {
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          console.log('Expo push token:', token);
        }
      }
    }
  
    registerForPushNotificationsAsync();
  }, []);
  // Mantém o useEffect para chamar automaticamente ao abrir a modal
  useEffect(() => {
    fetchExistingNotes();
  }, [selectedVerseForNote]);

  const colorPalettes = [
    {
      nome: '',
      cores: ['#fdfd96', '#fffacd', '#ffecb3', '#ffd6a5', '#e0bbe4']
    },
    {
      nome: '',
      cores: ['#ffa07a', '#ff6347', '#ff4500', '#ff69b4', '#ff1493']
    },
    {
      nome: '',
      cores: ['#d3d3d3', '#c0c0c0', '#a9a9a9', '#808080', '#696969']
    },
    {
      nome: '',
      cores: ['#90ee90', '#98fb98', '#8fbc8f', '#00ff7f', '#228b22']
    },
    {
      nome: '',
      cores: ['#87cefa', '#add8e6', '#87ceeb', '#4682b4', '#1e90ff']
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const favs = userData.favoritos || [];
        const highlightsData = userData.coresDestacadas || [];

        const newFavorites = {};
        favs.forEach((fav) => {
          const key = `${fav.livro}-${fav.capitulo - 1}-${fav.versiculo - 1}`;
          newFavorites[key] = true;
        });
        setFavorites(newFavorites);

        const newHighlights = {};
        highlightsData.forEach((highlight) => {
          const key = `${highlight.livro}-${highlight.capitulo - 1}-${highlight.versiculo - 1}`;
          newHighlights[key] = highlight.highlightColor;
        });
        setHighlights(newHighlights);

        const notesSnapshot = await getDocs(collection(db, 'users', uid, 'anotacoes'));
        const notesData = {};
        notesSnapshot.forEach((doc) => {
          const data = doc.data();
          const bookAbbrev = bibleData.find(b => b.name === data.livro)?.abbrev;
          if (bookAbbrev) {
            const key = `${bookAbbrev}-${data.capitulo - 1}-${data.versiculo - 1}`;
            notesData[key] = true;
          }
        });
        setAnnotatedVerses(notesData);
      }
    }
    setIsLoading(false);

    const bookAbbrev = bibleData.find(b => b.name === data.livro)?.abbrev;
    if (bookAbbrev) {
      const key = `${bookAbbrev}-${data.capitulo - 1}-${data.versiculo - 1}`;
      notesData[key] = true;
    }
  };

  const chapterList = selectedBook.chapters.map((_, index) => index + 1);
  const verses = selectedBook.chapters[selectedChapter];

  const goToPreviousChapter = () => {
    if (selectedChapter > 0) setSelectedChapter((prev) => prev - 1);
  };

  const goToNextChapter = () => {
    if (selectedChapter < selectedBook.chapters.length - 1) setSelectedChapter((prev) => prev + 1);
  };

  const toggleFavorite = async (book, chapter, verseIndex, verseText) => {
    const key = `${book.abbrev}-${chapter}-${verseIndex}`;
    const isCurrentlyFavorite = favorites[key];

    const uid = auth.currentUser?.uid;
    if (uid) {
      const userRef = doc(db, 'users', uid);
      const favoriteData = {
        livro: book.abbrev,
        capitulo: chapter + 1,
        versiculo: verseIndex + 1,
        texto: verseText,
      };

      try {
        if (isCurrentlyFavorite) {
          await updateDoc(userRef, { favoritos: arrayRemove(favoriteData) });
        } else {
          await updateDoc(userRef, { favoritos: arrayUnion(favoriteData) });
        }
        setFavorites((prev) => ({
          ...prev,
          [key]: !isCurrentlyFavorite,
        }));
      } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
      }
    }
  };

  const handleHighlightColor = async (color) => {
    if (!selectedVerse) return;
    
    const key = `${selectedBook.abbrev}-${selectedChapter}-${selectedVerse.versiculo - 1}`;
    const currentColor = highlights[key];
  
    const uid = auth.currentUser?.uid;
    if (!uid) return;
  
    const userRef = doc(db, 'users', uid);
  
    const highlightData = {
      livro: selectedBook.abbrev,
      capitulo: selectedChapter + 1,
      versiculo: selectedVerse.versiculo,
      highlightColor: currentColor,
    };
  
    const newHighlightData = {
      livro: selectedBook.abbrev,
      capitulo: selectedChapter + 1,
      versiculo: selectedVerse.versiculo,
      highlightColor: color,
    };
  
    try {
      if (currentColor === color) {
        // Se clicou na mesma cor, remove o destaque
        await updateDoc(userRef, {
          coresDestacadas: arrayRemove(highlightData),
        });
        setHighlights((prev) => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      } else {
        // Se escolheu cor diferente, remove anterior e adiciona nova
        if (currentColor) {
          await updateDoc(userRef, {
            coresDestacadas: arrayRemove(highlightData),
          });
        }
        await updateDoc(userRef, {
          coresDestacadas: arrayUnion(newHighlightData),
        });
        setHighlights((prev) => ({
          ...prev,
          [key]: color,
        }));
      }
  
      setSelectedColor(color);
    } catch (error) {
      console.error('Erro ao atualizar destaque:', error);
    }
  };

  const handleVersePress = (verseIndex, verseText) => {
    const verse = {
      livro: selectedBook.name,
      capitulo: selectedChapter + 1,
      versiculo: verseIndex + 1,
      texto: verseText,
    };
    setSelectedVerse(verse);
    setSelectedColor(null);
    setVerseModalVisible(true);
  };

  const handleCopyVerse = async () => {
    if (selectedVerse) {
      const text = `${selectedVerse.livro} ${selectedVerse.capitulo}:${selectedVerse.versiculo} - ${selectedVerse.texto}`;
      await Clipboard.setStringAsync(text);
      alert('Versículo copiado!');
    }
  };

  const handleShareVerse = async () => {
    if (selectedVerse) {
      const text = `${selectedVerse.livro} ${selectedVerse.capitulo}:${selectedVerse.versiculo} - ${selectedVerse.texto}`;
      await Share.share({ message: text });
    }
  };


  const showLocalToast = (message, type = 'default') => {
    setLocalToast({ message, type });
    setTimeout(() => {
      setLocalToast(null);
    }, 2000);
  };



  const handleAddNote = () => {
    if (selectedVerse) {
      setSelectedVerseForNote(selectedVerse);
      setNoteText('');
      setVerseModalVisible(false); // FECHA a Modal de Versículo antes
      setNoteModalVisible(true);   // Depois ABRE a Modal de Anotação
    }
  };
  const handleDeleteNote = async (noteId) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !noteId) return;
  
    Alert.alert(
      'Excluir anotação',
      'Tem certeza que deseja excluir esta anotação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
              onPress: async () => {
              setDeletingNoteId(noteId);
              try {
                await deleteDoc(doc(db, 'users', uid, 'anotacoes', noteId));
                await fetchExistingNotes();
                const key = `${selectedBook.abbrev}-${selectedVerseForNote.capitulo - 1}-${selectedVerseForNote.versiculo - 1}`;
                if (existingNotes.length === 1) {
                  setAnnotatedVerses((prev) => {
                    const updated = { ...prev };
                    delete updated[key];
                    return updated;
                  });
                }
                setEditingNoteId(null);
                setNoteText('');
                showLocalToast('Anotação excluída!');
              } catch (error) {
                console.error('Erro ao excluir anotação:', error);
                alert('Erro ao excluir anotação.');
              } finally {
                setDeletingNoteId(null);
              }
            },
        },
      ],
      { cancelable: true }
    );
  };
 


  const saveNote = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !selectedVerseForNote) return;
  
    try {
      const notesRef = collection(db, 'users', uid, 'anotacoes');
      const snapshot = await getDocs(notesRef);
  
      let existingDocId = null;
  
      snapshot.forEach((docSnap) => {
        const note = docSnap.data();
        if (
          note.livro === selectedVerseForNote.livro &&
          note.capitulo === selectedVerseForNote.capitulo &&
          note.versiculo === selectedVerseForNote.versiculo
        ) {
          existingDocId = docSnap.id;
        }
      });
  
      if (editingNoteId) {
        const existingDocRef = doc(db, 'users', uid, 'anotacoes', editingNoteId);
        await updateDoc(existingDocRef, {
          anotacao: noteText,
          atualizadoEm: new Date(),
        });
      } else {
        await addDoc(notesRef, {
          livro: selectedVerseForNote.livro,
          capitulo: selectedVerseForNote.capitulo,
          versiculo: selectedVerseForNote.versiculo,
          texto: selectedVerseForNote.texto,
          anotacao: noteText,
          criadoEm: new Date(),
        });
      }
  
      const key = `${selectedBook.abbrev}-${selectedVerseForNote.capitulo - 1}-${selectedVerseForNote.versiculo - 1}`;
      setAnnotatedVerses((prev) => ({
        ...prev,
        [key]: true,
      }));
  
      await fetchExistingNotes(); // Atualiza lista na mesma tela
      setEditingNoteId(null);     // Reseta edição
      setNoteText('');            // ✅ Limpa o campo de texto
      showLocalToast(
        editingNoteId ? 'Anotação editada com sucesso!' : 'Anotação adicionada com sucesso!',
        editingNoteId ? 'edit' : 'add'
      );
    } catch (error) {
      showMessage('Erro ao editar!');  }
    
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setBookModalVisible(true)} style={styles.bookButton}>
          <Text style={styles.bookButtonText}>{selectedBook.name}</Text>
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chapterList}
          contentContainerStyle={styles.chapterListContainer}
        >
          {chapterList.map((chapter, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.chapterButton, selectedChapter === index && styles.activeChapterButton]}
              onPress={() => setSelectedChapter(index)}
            >
              <Text style={selectedChapter === index ? styles.activeChapterText : styles.chapterText}>
                {chapter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.navigationBar}>
        <TouchableOpacity onPress={goToPreviousChapter}>
          <Text style={styles.navText}>Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.chapterTitle}>
          {selectedBook.name} {selectedChapter + 1} - NVI
        </Text>
        <TouchableOpacity onPress={goToNextChapter}>
          <Text style={styles.navText}>Próximo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.verseContainer}
        contentContainerStyle={styles.verseContent}
        keyboardShouldPersistTaps="handled"
        key={refreshKey}
      >
{verses.map((verse, idx) => {
  const key = `${selectedBook.abbrev}-${selectedChapter}-${idx}`;
  const isFavorite = favorites[key];
  const verseColor = highlights[key] || '#4B5563';
  const isAnnotated = annotatedVerses[key];

  return (
    <View key={idx} style={styles.verseLine}>
        <TouchableOpacity onPress={() => handleVersePress(idx, verse)}>
          
        <Text style={[
          styles.verseText,
          isAnnotated && annotatedVerseStyle
         ]}>
      {/* Número do versículo e texto */}
      {isFavorite ? (
        <View style={styles.circleFavorite}>
          <Text style={styles.circleFavoriteText}>
            {idx + 1}
          </Text>
        </View>
      ) : (
        <Text style={[styles.verseNumber, { color: '#000' }]}>
          {idx + 1}
        </Text>
        
      )} <Text> </Text>

      <Text style={{ backgroundColor: verseColor !== '#4B5563' ? verseColor : 'transparent' }}>
        {verse}
      </Text>
    </Text>
  </TouchableOpacity>

    </View>
        );
      })}
    </ScrollView>

      {/* Modal de Livro */}
      <Modal
        visible={bookModalVisible}
        animationType="fade"
        onRequestClose={() => setBookModalVisible(false)}
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setBookModalVisible(false)}>
                <Text style={styles.closeText}>Fechar</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={bibleData}
              keyExtractor={(item) => item.abbrev}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBook(item);
                    setSelectedChapter(0);
                    setBookModalVisible(false);
                  }}
                  style={styles.bookItem}
                >
                  <Text style={styles.bookText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Versículo */}
      <Modal
          visible={verseModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setVerseModalVisible(false)}
        >
  <TouchableOpacity
    activeOpacity={1}
    style={styles.modalCenterOverlay}
    onPress={() => setVerseModalVisible(false)}
  >
    <TouchableOpacity
      activeOpacity={1}
      style={styles.modalCenterContainer}
      onPress={() => {}} // impede fechamento ao clicar dentro
    >
      {selectedVerse && (
        <>
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.modalTitle}>
              {selectedVerse.livro} {selectedVerse.capitulo}:{selectedVerse.versiculo}
            </Text>
            <Text style={styles.modalText}>{selectedVerse.texto}</Text>
          </View>

          <Text style={styles.highlightTitle}>Escolha uma cor para marcar o texto:</Text>
          <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.highlightPalette}
              >
                {highlights[`${selectedBook.abbrev}-${selectedChapter}-${selectedVerse?.versiculo - 1}`] && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: '600', marginBottom: 6 }}></Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[
                        styles.colorCircle,
                        {
                          backgroundColor: highlights[`${selectedBook.abbrev}-${selectedChapter}-${selectedVerse?.versiculo - 1}`],
                          borderColor: '#000',
                          borderWidth: 3,
                        }
                      ]}
                      onPress={() => {
                        handleHighlightColor(highlights[`${selectedBook.abbrev}-${selectedChapter}-${selectedVerse?.versiculo - 1}`]);
                        setVerseModalVisible(false);
                      }}
                    >
                      <Text style={{ color: '#000', fontSize:20, fontWeight: 'bold' }}>X</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}
              {colorPalettes.map((paleta, index) => (
                    <View key={index} style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: '600', marginBottom: 6 }}>{paleta.nome}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {paleta.cores.map((color, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.colorCircle,
                              { backgroundColor: color },
                              highlights[`${selectedBook.abbrev}-${selectedChapter}-${selectedVerse?.versiculo - 1}`] === color && {
                                
                                borderWidth: 3,
                              }
                            ]}
                            onPress={() => {
                              handleHighlightColor(color);
                              setVerseModalVisible(false);
                            }}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  ))}
              </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => {
              toggleFavorite(selectedBook, selectedChapter, selectedVerse.versiculo - 1, selectedVerse.texto);
              setVerseModalVisible(false);
            }}>
              <Ionicons
                name={favorites[`${selectedBook.abbrev}-${selectedChapter}-${selectedVerse.versiculo - 1}`]
                  ? 'bookmark'
                  : 'bookmark-outline'}
                size={26}
                color="#d68536"
              />
              <Text style={styles.actionText}>Salvar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleAddNote}>
              <Ionicons name="create-outline" size={26} color="#d68536" />
              <Text style={styles.actionText}>Anotar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleCopyVerse}>
              <Ionicons name="copy-outline" size={26} color="#d68536" />
              <Text style={styles.actionText}>Copiar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShareVerse}>
              <Ionicons name="share-social-outline" size={26} color="#d68536" />
              <Text style={styles.actionText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          
        </>
      )}
    </TouchableOpacity>
  </TouchableOpacity>
</Modal>




      <Modal
  visible={noteModalVisible}
  animationType="slide"
  transparent={false}
  onRequestClose={() => setNoteModalVisible(false)}
>
  
  <SafeAreaView style={styles.modalFullScreen}>
              {localToast && (
              <View style={{
                position: 'absolute',
                top: '90%',
                left: '10%',
                right: '10%',
                backgroundColor: localToast.type === 'edit' ? '#d1fae5' : '#fef3c7',
                padding: 16,
                borderRadius: 8,
                zIndex: 1000,
                alignItems: 'center',
              }}>
                <Text style={{
                  color: '#111',
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  {localToast.message}
                </Text>
              </View>
            )}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        <TouchableOpacity onPress={() => {
          setNoteText('');
          setEditingNoteId(null);
          setNoteModalVisible(false);
        }}>
          <Text style={{ fontSize: 18, color: '#d68536', fontWeight: '600' }}>Voltar</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Anotação</Text>
        <TouchableOpacity
          onPress={saveNote}
          disabled={!noteText.trim()}
        >
          <Text style={{ color: noteText.trim() ? '#d68536' : '#ccc', fontSize: 18, fontWeight: '600' }}>
            {editingNoteId ? 'Salvar Edição' : 'Adicionar'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        ref={noteInputRef}
        placeholder="O que você gostaria de dizer?"
        style={styles.noteInput}
        multiline
        value={noteText}
        onChangeText={setNoteText}
      />

      {selectedVerseForNote && (
        <View style={styles.noteVerseContainer}>
          <Text style={styles.noteVerseText}>{selectedVerseForNote.texto}</Text>
          <Text style={styles.noteVerseReference}>
            {selectedVerseForNote.livro} {selectedVerseForNote.capitulo}:{selectedVerseForNote.versiculo}
          </Text>
        </View>
      )}

      {existingNotes.length > 0 && (
        <View style={styles.existingNoteContainer}>
          <Text style={styles.existingNoteTitle}>Anotações anteriores:</Text>
          {existingNotes.map((note, index) => (
            <View key={index} style={styles.singleNoteBox}>
              <Text style={styles.existingNoteText}>• {note.anotacao}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
  <TouchableOpacity onPress={() => {
   setNoteText(note.anotacao);
   setEditingNoteId(note.id);
   setTimeout(() => {
     noteInputRef.current?.focus();
   }, 100);
  }}>
    <Text style={styles.editButton}>Editar</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => handleDeleteNote(note.id)} disabled={deletingNoteId === note.id}>
  {deletingNoteId === note.id ? (
    <ActivityIndicator size="small" color="#DC2626" />
  ) : (
    <Text style={styles.deleteButton}>Excluir</Text>
  )}
</TouchableOpacity>
</View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
</Modal>



    </SafeAreaView>
    
  );

}
async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Falha ao obter permissão para notificações!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Você precisa usar um dispositivo físico para notificações push');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
//ESSE CODIGO QUE COLOCA A LINHA EM VERSICULOS COM ANOTACOES
const annotatedVerseStyle = {
  textDecorationLine: 'underline',
  textDecorationStyle: 'solid',
  textDecorationColor: '#000',
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#d68536',
    fontWeight: '600',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 0,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  bookButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: '#d68536',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    width: 200,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  chapterList: {
    marginTop: 0,
    marginBottom: 0,
  },
  chapterListContainer: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  chapterButton: {
    minWidth: 36,
    height: 38,
    paddingHorizontal: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    marginBottom: 10,
  },
  activeChapterButton: {
    backgroundColor: '#d68536',
  },
  chapterText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  activeChapterText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 20,
    marginRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d68536',
  },
  navText: {
    fontSize: 16,
    color: '#d68536',
    fontWeight: '600',
    paddingBottom: 10,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom:10,
  },
  verseContainer: {
    flex: 1,
    margin: 10,
    marginTop: 10,
  },
  verseContent: {
    paddingBottom: 60,
  },
  verseLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  verseText: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 5,
    lineHeight: 28,
    flex: 1,
  },
  verseNumber: {
    fontWeight: 'bold',
    marginRight: 6,
  },
  favoriteVerseNumber: {
    color: '#d68536',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  closeText: {
    color: '#d68536',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookText: {
    fontSize: 18,
  },
  modalCenterOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // 👈 fazer a Modal aparecer embaixo
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
   // marginBottom: 40,
  },
  modalCenterContainer: {
    width: '100%', // 👈 largura total
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: -10,
  },
  highlightRow: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 16,
    marginTop: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#d68536',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  circleFavorite: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#d68536',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleFavoriteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noteInput: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    marginTop: 20,
    fontSize: 16,
    color: '#374151',
  },
  noteVerseContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    borderLeftColor: '#d68536',
    paddingLeft: 10,
    paddingVertical: 8,
    width: '100%',
  },
  noteVerseText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#111827',
  },
  noteVerseReference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  existingNoteContainer: {
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d68536',
  },
  existingNoteTitle: {
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 6,
  },
  existingNoteText: {
    fontSize: 16,
    color: '#374151',
  },
  singleNoteBox: {
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  editButton: {
    marginTop: 8,
    color: '#d68536',
    fontWeight: '600',
    textAlign: 'right',
  },
  deleteButton: {
    marginTop: 8,
    color: '#DC2626', // vermelho
    fontWeight: '600',
    textAlign: 'right',
  },
  highlightPalette: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 5,
  }
});
