import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!globalThis.firebaseAdmin) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '', 'base64').toString()
  );
  
  globalThis.firebaseAdmin = initializeApp({
    credential: cert(serviceAccount)
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { action, idToken, uid, data } = req.body;
  
  try {
    const auth = getAuth();
    
    switch (action) {
      case 'verifyToken':
        if (!idToken) {
          return res.status(400).json({ error: 'ID token is required' });
        }
        
        const decodedToken = await auth.verifyIdToken(idToken);
        return res.status(200).json({ uid: decodedToken.uid });
        
      case 'getUserInfo':
        if (!uid) {
          return res.status(400).json({ error: 'User ID is required' });
        }
        
        const userRecord = await auth.getUser(uid);
        return res.status(200).json({
          uid: userRecord.uid,
          displayName: userRecord.displayName,
          email: userRecord.email,
          photoURL: userRecord.photoURL
        });
        
      case 'updateProfile':
        if (!uid || !data) {
          return res.status(400).json({ error: 'User ID and profile data are required' });
        }
        
        await auth.updateUser(uid, {
          displayName: data.displayName,
          photoURL: data.photoURL
        });
        
        return res.status(200).json({ message: 'Profile updated successfully' });
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}