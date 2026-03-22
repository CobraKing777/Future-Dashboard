import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import fs from 'fs';

// Load Firebase config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Add New Account
  app.post("/api/accounts/add", async (req, res) => {
    try {
      const { name, size, type, propFirm, profitTarget, maxDrawdown, consistencyRule, userId, commissions } = req.body;

      // 1. Server-side Validation
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Account Name is required and must be a string.' });
      }
      if (!propFirm || typeof propFirm !== 'string' || propFirm.trim() === '') {
        return res.status(400).json({ error: 'Prop Firm is required and must be a string.' });
      }
      if (!size || typeof size !== 'number' || size <= 0) {
        return res.status(400).json({ error: 'Account Size must be a positive number.' });
      }
      if (!['Challenge', 'Funded', 'Failed'].includes(type)) {
        return res.status(400).json({ error: 'Account Type must be "Challenge", "Funded", or "Failed".' });
      }
      if (!profitTarget || typeof profitTarget !== 'number' || profitTarget <= 0) {
        return res.status(400).json({ error: 'Profit Target must be a positive number.' });
      }
      if (!maxDrawdown || typeof maxDrawdown !== 'number' || maxDrawdown <= 0) {
        return res.status(400).json({ error: 'Max Drawdown must be a positive number.' });
      }
      let normalizedConsistencyRule = consistencyRule;
      if (typeof normalizedConsistencyRule === 'number' && normalizedConsistencyRule > 1 && normalizedConsistencyRule <= 100) {
        normalizedConsistencyRule = normalizedConsistencyRule / 100;
      }

      if (normalizedConsistencyRule === undefined || typeof normalizedConsistencyRule !== 'number' || normalizedConsistencyRule < 0 || normalizedConsistencyRule > 1) {
        return res.status(400).json({ error: 'Consistency Rule must be a number between 0 and 1 (or 0% to 100%).' });
      }
      if (!commissions || typeof commissions !== 'object') {
        return res.status(400).json({ error: 'Commissions configuration is required.' });
      }

      // 2. Database Storage (Firestore)
      const initialBalance = size * 1000;
      const accountData = {
        name,
        size,
        type,
        propFirm,
        profitTarget,
        maxDrawdown,
        consistencyRule: normalizedConsistencyRule,
        commissions,
        userId: userId || 'initial-stage-user', // Fallback for initial stage
        initialBalance,
        currentBalance: initialBalance,
        maxBalance: initialBalance,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'accounts'), accountData);
      console.log('Account created successfully with ID:', docRef.id);

      // 3. Success Response
      res.status(201).json({ 
        success: true, 
        accountId: docRef.id,
        message: 'Account successfully created.' 
      });

    } catch (error: any) {
      console.error('Error adding account:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  });

  // API Route: Update Account
  app.put("/api/accounts/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, size, type, propFirm, profitTarget, maxDrawdown, consistencyRule, commissions } = req.body;

      if (!id) return res.status(400).json({ error: 'Account ID is required.' });

      // Validation
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Account Name is required.' });
      }

      let normalizedConsistencyRule = consistencyRule;
      if (typeof normalizedConsistencyRule === 'number' && normalizedConsistencyRule > 1 && normalizedConsistencyRule <= 100) {
        normalizedConsistencyRule = normalizedConsistencyRule / 100;
      }

      const accountRef = doc(db, 'accounts', id);
      await updateDoc(accountRef, {
        name,
        size,
        type,
        propFirm,
        profitTarget,
        maxDrawdown,
        consistencyRule: normalizedConsistencyRule,
        commissions,
        updatedAt: Timestamp.now(),
      });

      res.json({ success: true, message: 'Account updated successfully.' });
    } catch (error: any) {
      console.error('Error updating account:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
