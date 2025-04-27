// /app/(_tabs)/bible.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  SafeAreaView
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import bibleData from '../../assets/data/nvi.json';
import { auth, db } from '../../services/firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export default function BibleScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadFavoritesFromFirestore();
  }, []);

  const [selectedBook, setSelectedBook] = useState(bibleData[0]);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [favorites, setFavorites] = useState({});

  const loadFavoritesFromFirestore = async () => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const favs = userData.favoritos || [];
        const newFavorites = {};
        favs.forEach((fav) => {
          const key = `${fav.livro}-${fav.capitulo - 1}-${fav.versiculo - 1}`;
          newFavorites[key] = true;
        });
        setFavorites(newFavorites);
      }
    }
  };

  const chapterList = selectedBook.chapters.map((_, index) => index + 1);
  const verses = selectedBook.chapters[selectedChapter];

  const goToPreviousChapter = () => {
    if (selectedChapter > 0) {
      setSelectedChapter((prev) => prev - 1);
    }
  };

  const goToNextChapter = () => {
    if (selectedChapter < selectedBook.chapters.length - 1) {
      setSelectedChapter((prev) => prev + 1);
    }
  };

  const toggleFavorite = async (book, chapter, verseIndex, verseText) => {
    const key = `${book.abbrev}-${chapter}-${verseIndex}`;
    const isCurrentlyFavorite = !!favorites[key];

    const uid = auth.currentUser?.uid;
    if (uid) {
      const userRef = doc(db, 'users', uid);

      const favoriteData = {
        livro: book.abbrev, // <-- Salvar a sigla do livro
        capitulo: chapter + 1,
        versiculo: verseIndex + 1,
        texto: verseText,
      };

      try {
        if (isCurrentlyFavorite) {
          await updateDoc(userRef, {
            favoritos: arrayRemove(favoriteData)
          });
        } else {
          await updateDoc(userRef, {
            favoritos: arrayUnion(favoriteData)
          });
        }

        // Atualiza localmente o favorites também
        setFavorites(prev => ({
          ...prev,
          [key]: !isCurrentlyFavorite
        }));

      } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => setBookModalVisible(true)} style={styles.bookButton}>
        <Text style={styles.bookButtonText}>{selectedBook.name}</Text>
      </TouchableOpacity>

      <View>
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
              <Text style={selectedChapter === index ? styles.activeChapterText : styles.chapterText}>{chapter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.navigationBar}>
        <TouchableOpacity onPress={goToPreviousChapter}>
          <Text style={styles.navText}>Anterior</Text>
        </TouchableOpacity>
        <Text style={styles.chapterTitle}>{selectedBook.name + ' ' + (selectedChapter + 1)}</Text>
        <TouchableOpacity onPress={goToNextChapter}>
          <Text style={styles.navText}>Próximo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.verseContainer} contentContainerStyle={styles.verseContent} key={refreshKey}>
        {verses.map((verse, idx) => {
          const key = `${selectedBook.abbrev}-${selectedChapter}-${idx}`;
          const isFavorite = !!favorites[key];

          return (
            <View key={idx} style={styles.verseLine}>
              <TouchableOpacity onPress={() => toggleFavorite(selectedBook, selectedChapter, idx, verse)}>
                <AntDesign
                  name={isFavorite ? 'heart' : 'hearto'}
                  size={20}
                  color={isFavorite ? '#d68536' : '#ccc'}
                  style={styles.heartIcon}
                />
              </TouchableOpacity>
              <Text style={styles.verseText}>
                <Text style={styles.verseNumber}>{idx + 1} </Text>
                {verse}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={bookModalVisible}
        animationType="slide"
        onRequestClose={() => setBookModalVisible(false)}
        transparent={true}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB'
  },
  bookButton: {
    marginTop: 50,
    backgroundColor: '#d68536',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
    margin: 20
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  chapterList: {
    marginBottom: 0,
  },
  chapterListContainer: {
    paddingHorizontal: 4,
    alignItems: 'center'
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
    marginBottom: 10
  },
  activeChapterButton: {
    backgroundColor: '#d68536'
  },
  chapterText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center'
  },
  activeChapterText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center'
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 20,
    marginRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d68536'
  },
  navText: {
    fontSize: 16,
    color: '#d68536',
    fontWeight: '600',
    paddingBottom: 10,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  verseContainer: {
    flex: 1,
    margin: 20,
    marginTop: 10
  },
  verseContent: {
    paddingBottom: 60
  },
  verseText: {
    fontSize: 18,
    fontFamily: 'Georgia-Italic',
    marginBottom: 12,
    lineHeight: 28,
    flex: 1
  },
  verseNumber: {
    fontWeight: 'bold'
  },
  verseLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8
  },
  heartIcon: {
    paddingTop: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  modalContainer: {
    maxHeight: '90%',
    backgroundColor: 'white',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  modalHeader: {
    alignItems: 'flex-end',
    marginBottom: 12
  },
  closeText: {
    color: '#d68536',
    fontSize: 16
  },
  bookItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  bookText: {
    fontSize: 18
  }
});
