import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  streamingUrl?: string;
  imageUrl?: string;
}

export interface Mixtape {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  songs: Song[];
  notes: string;
  createdBy: string;
  createdAt: number;
  isPublic: boolean;
}

interface MixtapeContextType {
  userMixtapes: Mixtape[];
  loading: boolean;
  createMixtape: (mixtape: Omit<Mixtape, 'id' | 'createdAt'>) => Promise<string>;
  updateMixtape: (id: string, mixtapeData: Partial<Mixtape>) => Promise<void>;
  deleteMixtape: (id: string) => Promise<void>;
  getMixtape: (id: string) => Promise<Mixtape | null>;
  getPublicMixtapes: () => Promise<Mixtape[]>;
}

const MixtapeContext = createContext<MixtapeContextType | null>(null);

export const useMixtape = () => {
  const context = useContext(MixtapeContext);
  if (!context) {
    throw new Error('useMixtape must be used within a MixtapeProvider');
  }
  return context;
};

export const MixtapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userMixtapes, setUserMixtapes] = useState<Mixtape[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Fetch user's mixtapes when user auth state changes
  useEffect(() => {
    const fetchUserMixtapes = async () => {
      if (!currentUser) {
        setUserMixtapes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const mixtapesRef = collection(db, 'mixtapes');
        const q = query(mixtapesRef, where('createdBy', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const mixtapes: Mixtape[] = [];
        querySnapshot.forEach((doc) => {
          mixtapes.push({ id: doc.id, ...doc.data() } as Mixtape);
        });

        setUserMixtapes(mixtapes);
      } catch (error) {
        console.error('Error fetching mixtapes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMixtapes();
  }, [currentUser]);

  // Create a new mixtape
  const createMixtape = async (mixtapeData: Omit<Mixtape, 'id' | 'createdAt'>) => {
    if (!currentUser) throw new Error('User must be logged in to create a mixtape');

    const docRef = await addDoc(collection(db, 'mixtapes'), {
      ...mixtapeData,
      createdAt: Date.now(),
      createdBy: currentUser.uid
    });

    const newMixtape = {
      id: docRef.id,
      ...mixtapeData,
      createdAt: Date.now(),
      createdBy: currentUser.uid
    };

    setUserMixtapes((prev) => [...prev, newMixtape]);
    return docRef.id;
  };

  // Update an existing mixtape
  const updateMixtape = async (id: string, mixtapeData: Partial<Mixtape>) => {
    if (!currentUser) throw new Error('User must be logged in to update a mixtape');

    const mixtapeRef = doc(db, 'mixtapes', id);
    await updateDoc(mixtapeRef, mixtapeData);

    setUserMixtapes((prev) => 
      prev.map((mixtape) => 
        mixtape.id === id ? { ...mixtape, ...mixtapeData } : mixtape
      )
    );
  };

  // Delete a mixtape
  const deleteMixtape = async (id: string) => {
    if (!currentUser) throw new Error('User must be logged in to delete a mixtape');

    await deleteDoc(doc(db, 'mixtapes', id));
    setUserMixtapes((prev) => prev.filter((mixtape) => mixtape.id !== id));
  };

  // Get a specific mixtape by ID
  const getMixtape = async (id: string) => {
    try {
      const docRef = doc(db, 'mixtapes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Mixtape;
      }
      return null;
    } catch (error) {
      console.error('Error fetching mixtape:', error);
      return null;
    }
  };

  // Get all public mixtapes
  const getPublicMixtapes = async () => {
    try {
      const mixtapesRef = collection(db, 'mixtapes');
      const q = query(mixtapesRef, where('isPublic', '==', true));
      const querySnapshot = await getDocs(q);
      
      const mixtapes: Mixtape[] = [];
      querySnapshot.forEach((doc) => {
        mixtapes.push({ id: doc.id, ...doc.data() } as Mixtape);
      });

      return mixtapes;
    } catch (error) {
      console.error('Error fetching public mixtapes:', error);
      return [];
    }
  };

  const value = {
    userMixtapes,
    loading,
    createMixtape,
    updateMixtape,
    deleteMixtape,
    getMixtape,
    getPublicMixtapes
  };

  return (
    <MixtapeContext.Provider value={value}>
      {children}
    </MixtapeContext.Provider>
  );
};