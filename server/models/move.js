const db = require('../db');

class Move {
  static async getActive() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          m.*,
          d.title,
          d.address,
          d.origin_address,
          d.destination_address
        FROM move_executions m
        JOIN deals d ON m.deal_id = d.id
        WHERE m.status IN ('pending', 'in_progress', 'paused')
        ORDER BY m.created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async start(dealId, team) {
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Erstelle Umzugsdurchführung
      const execution = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO move_executions (deal_id, status, start_time)
          VALUES (?, 'in_progress', CURRENT_TIMESTAMP)
        `, [dealId], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });

      // Erstelle Zeiterfassungen für Team
      const timeRecordStmt = db.prepare(`
        INSERT INTO time_records (execution_id, employee_id, start_time)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);

      for (const employeeId of team) {
        await new Promise((resolve, reject) => {
          timeRecordStmt.run([execution, employeeId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      timeRecordStmt.finalize();
      await db.run('COMMIT');
      return { id: execution, status: 'in_progress' };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async togglePause(executionId, action) {
    await db.run('BEGIN TRANSACTION');
    
    try {
      const newStatus = action === 'pause' ? 'paused' : 'in_progress';
      
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE move_executions 
          SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [newStatus, executionId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      if (action === 'pause') {
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE time_records 
            SET break_start = CURRENT_TIMESTAMP
            WHERE execution_id = ? AND end_time IS NULL
          `, [executionId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE time_records 
            SET break_end = CURRENT_TIMESTAMP
            WHERE execution_id = ? AND break_start IS NOT NULL AND break_end IS NULL
          `, [executionId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }

      await db.run('COMMIT');
      return { status: newStatus };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  // ... weitere Methoden für complete() etc.
}

module.exports = Move; 