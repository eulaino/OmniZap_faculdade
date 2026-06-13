import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, get } from 'firebase/database';
import { auth, database } from '@/config/firebase';


export async function buscarTelefoneFirebase() {
    const phoneStorage = await AsyncStorage.getItem("user_phone");

    if (phoneStorage) {
        return phoneStorage
    }

    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    const snapshot = await get(ref(database, `users/${user.uid}/name/phone`));

    if (!snapshot.exists()) {
        return null;
    }

    const phoneFirebase = snapshot.val();
    await AsyncStorage.setItem("user_phone", phoneFirebase);
    return phoneFirebase;
}