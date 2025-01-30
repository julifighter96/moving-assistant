const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

const PIPEDRIVE_API_URL = process.env.REACT_APP_PIPEDRIVE_API_URL;
const PIPEDRIVE_API_TOKEN = process.env.REACT_APP_PIPEDRIVE_API_TOKEN;

router.get('/deals/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;
    const response = await axios.get(`${PIPEDRIVE_API_URL}/deals/${dealId}`, {
      params: { api_token: PIPEDRIVE_API_TOKEN }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching deal from Pipedrive:', error);
    res.status(500).json({ error: 'Failed to fetch deal data' });
  }
});

router.post('/sync-deals', async (req, res) => {
  try {
    const { deals } = req.body;
    console.log('Syncing deals:', deals.length);
    
    // Prüfe Tabellen-Struktur vor dem Sync
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(move_executions)", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log('move_executions table structure:', tableInfo);
    
    await db.run('BEGIN TRANSACTION');

    for (const deal of deals) {
      console.log('Processing deal:', deal.id);
      // Deal einfügen/aktualisieren
      await db.run(`
        INSERT OR REPLACE INTO deals (
          id, 
          title,
          value,
          currency,
          org_name,
          move_date,
          origin_address,
          destination_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        deal.id,
        deal.title,
        deal.value,
        deal.currency,
        deal.org_name,
        deal['b9d01d5dcd86c878a57cb0febd336e4d390af900'], // move_date
        deal['07c3da8804f7b96210e45474fba35b8691211ddd'], // origin_address
        deal['9cb4de1018ec8404feeaaaf7ee9b293c78c44281']  // destination_address
      ]);

      // Prüfen ob der Deal erfolgreich eingefügt wurde
      const dealCheck = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM deals WHERE id = ?', [deal.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      console.log('Deal in database:', dealCheck);

      // Automatisch move_execution erstellen falls noch nicht vorhanden
      console.log('Creating move_execution for deal:', deal.id);
      
      // Erst prüfen ob schon eine execution existiert
      const existingExecution = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM move_executions WHERE deal_id = ?', [deal.id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      console.log('Existing execution:', existingExecution);
      
      if (!existingExecution) {
        // Direkt einfügen statt SELECT/INSERT
        try {
          console.log('Attempting to insert execution for deal:', deal.id);
          await db.run(`
            INSERT INTO move_executions (deal_id, status, start_time) 
            VALUES (?, 'pending', CURRENT_TIMESTAMP)
          `, [deal.id]);
          console.log('Insert query executed');
          
          // Prüfen ob Einfügen erfolgreich war
          const newExecution = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM move_executions WHERE deal_id = ?', [deal.id], (err, row) => {
              if (err) {
                console.error('Error checking new execution:', err);
                reject(err);
              } else {
                if (!row) {
                  console.error('No execution found after insert for deal:', deal.id);
                } else {
                  console.log('Successfully created execution:', row);
                }
                resolve(row);
              }
            });
          });
          console.log('New execution created:', newExecution);
        } catch (insertError) {
          console.error('Error inserting execution:', insertError);
          // Prüfen der Tabellen-Struktur
          const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(move_executions)", [], (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
          console.log('move_executions table structure:', tableInfo);
          throw insertError;
        }
      }
    }

    await db.run('COMMIT');
    
    // Final check
    const finalCheck = await new Promise((resolve, reject) => {
      db.all(`
        SELECT d.*, m.status, m.id as execution_id 
        FROM deals d 
        LEFT JOIN move_executions m ON d.id = m.deal_id
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    console.log('Final database state:', finalCheck);
    
    console.log('Sync completed successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error during sync:', error);
    await db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 