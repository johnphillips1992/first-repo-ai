import React, { createContext, useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Mixtape, MixtapeFormData, Track } from '../types';

interface MixtapeContextProps {
  userMixtapes: Mixtape[];
  publicMixtapes: Mixtape[];
  currentMixtape: Mixtape | null;
  loading: boolean;
  error: string | null;
  fetchMixtape: (id: string) => Promise<void>;
  createMixtape: (data: MixtapeFormData, tracks: Track[]) => Promise<string>;
  updateMixtape: (id: string, data: Partial<MixtapeFormData>, tracks?: Track[]) => Promise<void>;
  deleteMixtape: (id: string) => Promise<void>;
  addTrackToMixtape: (mixtapeId: string, track: Track) => Promise<void>;
  removeTrackFromMixtape: (mixtapeId: string, trackId: string) => Promise<void>;
}

export const MixtapeContext = createContext<MixtapeContextProps>({
  userMixtapes: [],
  publicMixtapes: [],
  currentMixtape: null,
  loading: false,
  error: null,
  fetchMixtape: async () => {},
  createMixtape: async () => '',
  updateMixtape: async () => {},
  deleteMixtape: async () => {},
  addTrackToMixtape: async () => {},
  removeTrackFromMixtape: async () => {},
});

export const MixtapeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userMixtapes, setUserMixtapes] = useState<Mixtape[]>([]);
  const [publicMixtapes, setPublicMixtapes] = useState<Mixtape[]>([]);
  const [currentMixtape, setCurrentMixtape] = useState<Mixtape | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's mixtapes when user changes
  useEffect(() => {
    if (user) {
      fetchUserMixtapes();
    } else {
      setUserMixtapes([]);
    }
  }, [user]);

  // Fetch public mixtapes on component mount
  useEffect(() => {
    fetchPublicMixtapes();
  }, []);

  // Fetch user's mixtapes
  const fetchUserMixtapes = async (): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const mixtapesQuery = query(
        collection(db, 'mixtapes'), 
        where('createdBy', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(mixtapesQuery);
      const mixtapes: Mixtape[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mixtape[];
      
      setUserMixtapes(mixtapes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mixtapes');
      console.error('Error fetching user mixtapes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch public mixtapes
  const fetchPublicMixtapes = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const mixtapesQuery = query(
        collection(db, 'mixtapes'), 
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(mixtapesQuery);
      const mixtapes: Mixtape[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mixtape[];
      
      setPublicMixtapes(mixtapes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch public mixtapes');
      console.error('Error fetching public mixtapes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single mixtape by ID
  const fetchMixtape = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    setCurrentMixtape(null);
    
    try {
      const mixtapeDoc = await getDoc(doc(db, 'mixtapes', id));
      
      if (mixtapeDoc.exists()) {
        const mixtapeData = mixtapeDoc.data() as Omit<Mixtape, 'id'>;
        setCurrentMixtape({
          id: mixtapeDoc.id,
          ...mixtapeData
        });
      } else {
        setError('Mixtape not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mixtape');
      console.error('Error fetching mixtape:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new mixtape
  const createMixtape = async (data: MixtapeFormData, tracks: Track[]): Promise<string> => {
    if (!user) throw new Error('User must be authenticated to create a mixtape');
    
    setLoading(true);
    setError(null);
    
    try {
      // Upload cover image if provided
      let coverImageUrl = '';
      if (data.coverImage) {
        const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}_${data.coverImage.name}`);
        await uploadBytes(storageRef, data.coverImage);
        coverImageUrl = await getDownloadURL(storageRef);
      }
      
      // Create mixtape document
      const mixtapeData = {
        title: data.title,
        description: data.description,
        coverImage: coverImageUrl,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isPublic: data.isPublic,
        tracks,
        notes: data.notes,
      };
      
      const docRef = await addDoc(collection(db, 'mixtapes'), mixtapeData);
      
      // Refresh user mixtapes
      await fetchUserMixtapes();
      
      return docRef.id;
    } catch (err: any) {
      setError(err.message || 'Failed to create mixtape');
      console.error('Error creating mixtape:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing mixtape
  const updateMixtape = async (
    id: string, 
    data: Partial<MixtapeFormData>, 
    tracks?: Track[]
  ): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to update a mixtape');
    
    setLoading(true);
    setError(null);
    
    try {
      const mixtapeRef = doc(db, 'mixtapes', id);
      const mixtapeDoc = await getDoc(mixtapeRef);
      
      if (!mixtapeDoc.exists()) {
        throw new Error('Mixtape not found');
      }
      
      const mixtapeData = mixtapeDoc.data();
      
      // Verify ownership
      if (mixtapeData.createdBy !== user.uid) {
        throw new Error('You do not have permission to update this mixtape');
      }
      
      // Upload new cover image if provided
      let updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      
      if (data.coverImage) {
        const storageRef = ref(storage, `covers/${user.uid}/${Date.now()}_${data.coverImage.name}`);
        await uploadBytes(storageRef, data.coverImage);
        updateData.coverImage = await getDownloadURL(storageRef);
      }
      
      // Add tracks if provided
      if (tracks) {
        updateData.tracks = tracks;
      }
      
      // Remove coverImage file object as it can't be stored in Firestore
      if (updateData.coverImage instanceof File) {
        delete updateData.coverImage;
      }
      
      await updateDoc(mixtapeRef, updateData);
      
      // Refresh user mixtapes and current mixtape
      await fetchUserMixtapes();
      if (currentMixtape?.id === id) {
        await fetchMixtape(id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update mixtape');
      console.error('Error updating mixtape:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a mixtape
  const deleteMixtape = async (id: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to delete a mixtape');
    
    setLoading(true);
    setError(null);
    
    try {
      const mixtapeRef = doc(db, 'mixtapes', id);
      const mixtapeDoc = await getDoc(mixtapeRef);
      
      if (!mixtapeDoc.exists()) {
        throw new Error('Mixtape not found');
      }
      
      const mixtapeData = mixtapeDoc.data();
      
      // Verify ownership
      if (mixtapeData.createdBy !== user.uid) {
        throw new Error('You do not have permission to delete this mixtape');
      }
      
      await deleteDoc(mixtapeRef);
      
      // Update state by removing the deleted mixtape
      setUserMixtapes(prev => prev.filter(mixtape => mixtape.id !== id));
      
      // Clear current mixtape if it's the one being deleted
      if (currentMixtape?.id === id) {
        setCurrentMixtape(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete mixtape');
      console.error('Error deleting mixtape:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add a track to a mixtape
  const addTrackToMixtape = async (mixtapeId: string, track: Track): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to add tracks');
    
    setLoading(true);
    setError(null);
    
    try {
      const mixtapeRef = doc(db, 'mixtapes', mixtapeId);
      const mixtapeDoc = await getDoc(mixtapeRef);
      
      if (!mixtapeDoc.exists()) {
        throw new Error('Mixtape not found');
      }
      
      const mixtapeData = mixtapeDoc.data();
      
      // Verify ownership
      if (mixtapeData.createdBy !== user.uid) {
        throw new Error('You do not have permission to modify this mixtape');
      }
      
      // Add the new track to the tracks array
      const updatedTracks = [...(mixtapeData.tracks || []), track];
      
      await updateDoc(mixtapeRef, {
        tracks: updatedTracks,
        updatedAt: serverTimestamp()
      });
      
      // Refresh the current mixtape if it's the one being modified
      if (currentMixtape?.id === mixtapeId) {
        await fetchMixtape(mixtapeId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add track to mixtape');
      console.error('Error adding track to mixtape:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove a track from a mixtape
  const removeTrackFromMixtape = async (mixtapeId: string, trackId: string): Promise<void> => {
    if (!user) throw new Error('User must be authenticated to remove tracks');
    
    setLoading(true);
    setError(null);
    
    try {
      const mixtapeRef = doc(db, 'mixtapes', mixtapeId);
      const mixtapeDoc = await getDoc(mixtapeRef);
      
      if (!mixtapeDoc.exists()) {
        throw new Error('Mixtape not found');
      }
      
      const mixtapeData = mixtapeDoc.data();
      
      // Verify ownership
      if (mixtapeData.createdBy !== user.uid) {
        throw new Error('You do not have permission to modify this mixtape');
      }
      
      // Remove the track from the tracks array
      const updatedTracks = (mixtapeData.tracks || []).filter(track => track.id !== trackId);
      
      await updateDoc(mixtapeRef, {
        tracks: updatedTracks,
        updatedAt: serverTimestamp()
      });
      
      // Refresh the current mixtape if it's the one being modified
      if (currentMixtape?.id === mixtapeId) {
        await fetchMixtape(mixtapeId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove track from mixtape');
      console.error('Error removing track from mixtape:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    userMixtapes,
    publicMixtapes,
    currentMixtape,
    loading,
    error,
    fetchMixtape,
    createMixtape,
    updateMixtape,
    deleteMixtape,
    addTrackToMixtape,
    removeTrackFromMixtape,
  };

  return <MixtapeContext.Provider value={value}>{children}</MixtapeContext.Provider>;
};