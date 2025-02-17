import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

type UserRole = "admin" | "employee" | "customer";

interface AuthUser extends Omit<FirebaseUser, 'displayName'> {
  role?: UserRole;
  branchId?: number;
  displayName?: string | null;
  location?: string;
}

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, role: UserRole) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchUserData = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();

      if (userData) {
        setUser({
          ...firebaseUser,
          role: userData.role as UserRole,
          branchId: userData.branchId,
          location: userData.location,
          displayName: userData.displayName || firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(error as Error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await fetchUserData(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.data();
      
      if (userData) {
        setUser({
          ...userCredential.user,
          role: userData.role as UserRole,
          branchId: userData.branchId,
          location: userData.location,
          displayName: userData.displayName || userCredential.user.displayName,
        });
      }

      await setDoc(doc(db, "users", userCredential.user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, role: UserRole) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        displayName: email.split('@')[0],
        branchId: null,
        location: null
      });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      toast({
        title: "Logout failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}