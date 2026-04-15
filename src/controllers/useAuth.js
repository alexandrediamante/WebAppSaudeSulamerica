import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        unsubscribe = onAuthStateChanged(auth, setUser);
      } catch (error) {
        console.error("Erro na autenticação:", error);
        setAuthError(true);
        setUser({ uid: "familia-diamante-dev" });
      }
    };
    initAuth();
    return () => unsubscribe();
  }, []);

  return { user, authError };
}
