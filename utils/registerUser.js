// utils/registerUser.js
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

/**
 * Registra o usuário no Firestore com os dados básicos.
 * @param {string} uid - ID do usuário do Firebase Auth
 * @param {Object} dados - Dados do usuário (nome, whatsapp, cpf, nivel)
 */
export async function registerUserInFirestore(uid, dados) {
  const userRef = doc(db, 'users', uid);

  try {
    await setDoc(userRef, {
      nome: dados.nome,
      whatsapp: dados.whatsapp,
      cpf: dados.cpf,
      nivel: dados.nivel || 'membro',
      favoritos: [],
    });
    console.log('Usuário salvo no Firestore com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar usuário no Firestore:', error);
    throw error;
  }
}
export default registerUserInFirestore;
