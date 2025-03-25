import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

export interface Track {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  serviceId: string;
  service: 'spotify' | 'youtube' | 'applemusic';
}

export interface Mixtape {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  tracks: Track[];
  note: string;
  createdBy: string;
  createdAt: Date;
  collaborators: string[];
  isPublic: boolean;
}

interface PlaylistContextProps {
  mixtapes: Mixtape[];
  loading: boolean;
  createMixtape: (mixtape: Omit<Mixtape, 'id' | 'createdAt'>) => Promise<string>;
  updateMixtape: (id: string, updates: Partial<Mixtape>) => Promise<void>;
  deleteMixtape: (id: string) => Promise<void>;
  getMixtapeById: (id: string) => Promise<Mixtape | null>;
  getUserMixtapes: () => Promise<Mixtape[]>;
  addCollaborator: (mixtapeId: string, userId: string) => Promise<void>;
  removeCollaborator: (mixtapeId: string, userId: string) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextProps | undefined>(undefined);

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mixtapes, setMixtapes] = useState<Mixtape[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchUserMixtapes();
    } else {
      setMixtapes([]);
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUserMixtapes = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'mixtapes'),
        where('createdBy', '==', currentUser.uid)
      );
      
      const mixtapeSnapshot = await getDocs(q);
      const mixtapeList: Mixtape[] = [];
      
      mixtapeSnapshot.forEach((doc) => {
        const data = doc.data();
        mixtapeList.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          tracks: data.tracks,
          note: data.note,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
          collaborators: data.collaborators,
          isPublic: data.isPublic
        });
      });
      
      setMixtapes(mixtapeList);
    } catch (error) {
      console.error('Error fetching mixtapes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMixtape = async (mixtape: Omit<Mixtape, 'id' | 'createdAt'>) => {
    if (!currentUser) {
      throw new Error('User must be logged in to create a mixtape');
    }

    try {
      const docRef = await addDoc(collection(db, 'mixtapes'), {
        ...mixtape,
        createdAt: new Date(),
        createdBy: currentUser.uid
      });
      
      await fetchUserMixtapes();
      return docRef.id;
    } catch (error) {
      console.error('Error creating mixtape:', error);
      throw error;
    }
  };

  const updateMixtape = async (id: string, updates: Partial<Mixtape>) => {
    try {
      const mixtapeRef = doc(db, 'mixtapes', id);
      await updateDoc(mixtapeRef, updates);
      
      // Update mixtapes state with the updated mixtape
      setMixtapes((prevMixtapes) => 
        prevMixtapes.map((mixtape) => 
          mixtape.id === id ? { ...mixtape, ...updates } : mixtape
        )
      );
    } catch (error) {
      console.error('Error updating mixtape:', error);
      throw error;
    }
  };

  const deleteMixtape = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mixtapes', id));
      
      // Remove deleted mixtape from state
      setMixtapes((prevMixtapes) => 
        prevMixtapes.filter((mixtape) => mixtape.id !== id)
      );
    } catch (error) {
      console.error('Error deleting mixtape:', error);
      throw error;
    }
  };

  const getMixtapeById = async (id: string): Promise<Mixtape | null> => {
    try {
      const mixtapeRef = doc(db, 'mixtapes', id);
      const mixtapeSnap = await getDoc(mixtapeRef);
      
      if (mixtapeSnap.exists()) {
        const data = mixtapeSnap.data();
        return {
          id: mixtapeSnap.id,
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          tracks: data.tracks,
          note: data.note,
          createdBy: data.createdBy,
          createdAt: data.createdAt.toDate(),
          collaborators: data.collaborators,
          isPublic: data.isPublic
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting mixtape:', error);
      throw error;
    }
  };

  const getUserMixtapes = async (): Promise<Mixtape[]> => {
    if (!currentUser) {
      return [];
    }

    try {
      await fetchUserMixtapes();
      return mixtapes;
    } catch (error) {
      console.error('Error fetching user mixtapes:', error);
      throw error;
    }
  };

  const addCollaborator = async (mixtapeId: string, userId: string) => {
    try {
      const mixtapeRef = doc(db, 'mixtapes', mixtapeId);
      const mixtapeSnap = await getDoc(mixtapeRef);
      
      if (mixtapeSnap.exists()) {
        const data = mixtapeSnap.data();
        const collaborators = data.collaborators || [];
        
        if (!collaborators.includes(userId)) {
          await updateDoc(mixtapeRef, {
            collaborators: [...collaborators, userId]
          });
          
          // Update mixtapes state
          setMixtapes((prevMixtapes) => 
            prevMixtapes.map((mixtape) => 
              mixtape.id === mixtapeId 
                ? { ...mixtape, collaborators: [...mixtape.collaborators, userId] } 
                : mixtape
            )
          );
        }
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  };

  const removeCollaborator = async (mixtapeId: string, userId: string) => {
    try {
      const mixtapeRef = doc(db, 'mixtapes', mixtapeId);
      const mixtapeSnap = await getDoc(mixtapeRef);
      
      if (mixtapeSnap.exists()) {
        const data = mixtapeSnap.data();
        const collaborators = data.collaborators || [];
        
        if (collaborators.includes(userId)) {
          await updateDoc(mixtapeRef, {
            collaborators: collaborators.filter((id: string) => id !== userId)
          });
          
          // Update mixtapes state
          setMixtapes((prevMixtapes) => 
            prevMixtapes.map((mixtape) => 
              mixtape.id === mixtapeId 
                ? { 
                    ...mixtape, 
                    collaborators: mixtape.collaborators.filter(id => id !== userId) 
                  } 
                : mixtape
            )
          );
        }
      }
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  };

  const value = {
    mixtapes,
    loading,
    createMixtape,
    updateMixtape,
    deleteMixtape,
    getMixtapeById,
    getUserMixtapes,
    addCollaborator,
    removeCollaborator
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};