import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '', 'base64').toString()
  );
  
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const auth = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Authenticate user
  let userId: string | null = null;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.substring(7);
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  
  // Handle mixtape requests
  const { id } = req.query;
  
  switch (req.method) {
    case 'GET':
      if (id) {
        return getMixtapeById(res, id as string, userId);
      } else {
        return getAllMixtapes(res, userId);
      }
      
    case 'POST':
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return createMixtape(req, res, userId);
      
    case 'PUT':
      if (!id || !userId) {
        return res.status(400).json({ error: 'Mixtape ID and authentication are required' });
      }
      return updateMixtape(req, res, id as string, userId);
      
    case 'DELETE':
      if (!id || !userId) {
        return res.status(400).json({ error: 'Mixtape ID and authentication are required' });
      }
      return deleteMixtape(res, id as string, userId);
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAllMixtapes(res: VercelResponse, userId: string | null) {
  try {
    let query = db.collection('mixtapes');
    
    // If user is authenticated, get their mixtapes and public mixtapes
    if (userId) {
      query = query.where(
        'createdBy', '==', userId
      );
    } else {
      // If not authenticated, only get public mixtapes
      query = query.where('isPublic', '==', true);
    }
    
    const snapshot = await query.get();
    const mixtapes: any[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      mixtapes.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString()
      });
    });
    
    return res.status(200).json(mixtapes);
  } catch (error) {
    console.error('Error getting mixtapes:', error);
    return res.status(500).json({ error: 'Failed to get mixtapes' });
  }
}

async function getMixtapeById(res: VercelResponse, id: string, userId: string | null) {
  try {
    const doc = await db.collection('mixtapes').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Mixtape not found' });
    }
    
    const data = doc.data();
    
    // Check if user has access to this mixtape
    if (!data?.isPublic && data?.createdBy !== userId && !(data?.collaborators || []).includes(userId)) {
      return res.status(403).json({ error: 'Access denied to this mixtape' });
    }
    
    return res.status(200).json({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt.toDate().toISOString()
    });
  } catch (error) {
    console.error('Error getting mixtape:', error);
    return res.status(500).json({ error: 'Failed to get mixtape' });
  }
}

async function createMixtape(req: VercelRequest, res: VercelResponse, userId: string) {
  try {
    const mixtapeData = req.body;
    
    // Validate required fields
    if (!mixtapeData.title || !mixtapeData.tracks) {
      return res.status(400).json({ error: 'Title and tracks are required' });
    }
    
    // Prepare mixtape data
    const newMixtape = {
      ...mixtapeData,
      createdBy: userId,
      createdAt: new Date(),
      collaborators: mixtapeData.collaborators || [],
      isPublic: mixtapeData.isPublic || false
    };
    
    const docRef = await db.collection('mixtapes').add(newMixtape);
    
    return res.status(201).json({
      id: docRef.id,
      ...newMixtape,
      createdAt: newMixtape.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Error creating mixtape:', error);
    return res.status(500).json({ error: 'Failed to create mixtape' });
  }
}

async function updateMixtape(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
  try {
    const mixtapeRef = db.collection('mixtapes').doc(id);
    const doc = await mixtapeRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Mixtape not found' });
    }
    
    const mixtapeData = doc.data();
    
    // Check if user has permission to update (owner or collaborator)
    if (mixtapeData?.createdBy !== userId && !(mixtapeData?.collaborators || []).includes(userId)) {
      return res.status(403).json({ error: 'You do not have permission to update this mixtape' });
    }
    
    // Update mixtape
    const updates = req.body;
    
    // Prevent updating certain fields if not the owner
    if (mixtapeData?.createdBy !== userId) {
      delete updates.title;
      delete updates.isPublic;
      delete updates.collaborators;
      delete updates.createdBy;
    }
    
    await mixtapeRef.update(updates);
    
    return res.status(200).json({ message: 'Mixtape updated successfully' });
  } catch (error) {
    console.error('Error updating mixtape:', error);
    return res.status(500).json({ error: 'Failed to update mixtape' });
  }
}

async function deleteMixtape(res: VercelResponse, id: string, userId: string) {
  try {
    const mixtapeRef = db.collection('mixtapes').doc(id);
    const doc = await mixtapeRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Mixtape not found' });
    }
    
    const mixtapeData = doc.data();
    
    // Only the owner can delete the mixtape
    if (mixtapeData?.createdBy !== userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this mixtape' });
    }
    
    await mixtapeRef.delete();
    
    return res.status(200).json({ message: 'Mixtape deleted successfully' });
  } catch (error) {
    console.error('Error deleting mixtape:', error);
    return res.status(500).json({ error: 'Failed to delete mixtape' });
  }
}