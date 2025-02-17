import { db } from "../firebase";
import { collection, addDoc, doc, setDoc, serverTimestamp, increment, getDocs, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { usersCollection, branchesCollection } from "./collections";

export async function createInitialAdmin() {
  try {
    // Check if admin already exists
    const adminQuery = query(usersCollection, where("email", "==", "admin@gamerentals.com"));
    const existingAdmin = await getDocs(adminQuery);

    if (!existingAdmin.empty) {
      console.log("Admin user already exists, skipping creation");
      const adminDoc = existingAdmin.docs[0];
      return { adminUid: adminDoc.id, branchId: adminDoc.data().branchId };
    }

    // Create admin user in Firebase Auth
    const adminCredential = await createUserWithEmailAndPassword(
      auth,
      "admin@gamerentals.com",
      "admin123"
    );

    // Add admin data to Firestore
    await setDoc(doc(db, "users", adminCredential.user.uid), {
      email: "admin@gamerentals.com",
      role: "admin",
      displayName: "System Admin",
      branchId: null,
      location: null,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    // Create main branch
    const branchRef = await addDoc(branchesCollection, {
      name: "Main Branch",
      location: "City Center",
      revenue: 0,
      activeGames: 0,
      totalGames: 0,
      createdAt: serverTimestamp()
    });

    // Update admin with branch reference
    await setDoc(doc(db, "users", adminCredential.user.uid), {
      branchId: branchRef.id
    }, { merge: true });

    return { adminUid: adminCredential.user.uid, branchId: branchRef.id };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Admin auth account already exists, attempting to continue with setup");
      const adminQuery = query(usersCollection, where("email", "==", "admin@gamerentals.com"));
      const existingAdmin = await getDocs(adminQuery);

      if (!existingAdmin.empty) {
        const adminDoc = existingAdmin.docs[0];
        return { adminUid: adminDoc.id, branchId: adminDoc.data().branchId };
      }
    }
    console.error("Error creating initial admin:", error);
    return null;
  }
}

export async function createEmployee(email: string, password: string, branchId: string, location: string) {
  try {
    // Check if employee exists
    const employeeQuery = query(usersCollection, where("email", "==", email));
    const existingEmployee = await getDocs(employeeQuery);

    if (!existingEmployee.empty) {
      console.log("Employee already exists");
      return existingEmployee.docs[0].id;
    }

    const employeeCredential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", employeeCredential.user.uid), {
      email,
      role: "employee",
      branchId,
      location,
      displayName: email.split("@")[0],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });

    return employeeCredential.user.uid;
  } catch (error) {
    console.error("Error creating employee:", error);
    return null;
  }
}

export async function addGame(name: string, branchId: string) {
  try {
    // Check if game exists
    const gameQuery = query(collection(db, "games"), where("name", "==", name), where("branchId", "==", branchId));
    const existingGame = await getDocs(gameQuery);

    if (!existingGame.empty) {
      console.log(`Game ${name} already exists in branch ${branchId}`);
      return existingGame.docs[0].id;
    }

    const gameRef = await addDoc(collection(db, "games"), {
      name,
      branchId,
      qrCode: `GAME-${Date.now()}-${branchId}`,
      status: "available",
      totalRentals: 0,
      revenue: 0,
      createdAt: serverTimestamp()
    });

    // Update branch stats
    const branchRef = doc(db, "branches", branchId);
    await setDoc(branchRef, {
      totalGames: increment(1),
      activeGames: increment(1)
    }, { merge: true });

    return gameRef.id;
  } catch (error) {
    console.error("Error adding game:", error);
    return null;
  }
}

export async function createInitialData() {
  try {
    // Create admin and main branch
    const initialData = await createInitialAdmin();
    if (!initialData) {
      throw new Error("Failed to create or find initial admin");
    }

    // Create a sample employee
    const employeeId = await createEmployee(
      "employee@gamerentals.com",
      "employee123",
      initialData.branchId,
      "City Center"
    );

    if (!employeeId) {
      console.log("Sample employee already exists or failed to create");
    }

    // Add some sample games
    const gameNames = ["Super Mario", "Zelda", "Pokemon", "Final Fantasy"];
    for (const name of gameNames) {
      await addGame(name, initialData.branchId);
    }

    return true;
  } catch (error) {
    console.error("Error creating initial data:", error);
    // Return true even if some parts fail, as long as we have an admin and branch
    return true;
  }
}