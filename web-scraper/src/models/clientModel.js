const oracledb = require('oracledb');  // <--- Add this line
const { getConnection } = require('../config/db');

/**
 * Add a new client and associate it with related records.
 */
async function addClient(clientData) {
  const { name, email, customers, labels, competitors, industries } = clientData;
  let connection;

  try {
    connection = await getConnection();

    // Insert client and get ID
    const result = await connection.execute(
      `INSERT INTO client (name, email) VALUES (:name, :email) RETURNING id INTO :id`,
      { name, email, id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
    );

    const clientId = result.outBinds.id[0];

    // Function to update related records
    async function insertRelatedData(column, table, values, clientId, connection) {
      if (!values) return;
      
      const ids = values.split(',').map(id => parseInt(id.trim(), 10));
    
      for (let id of ids) {
        // Check if the parent record exists
        const check = await connection.execute(
          `SELECT id FROM ${table} WHERE id = :id`,
          { id }
        );
    
        if (check.rows.length === 0) {
          console.error(`Error: ID ${id} not found in table ${table}`);
          throw new Error(`Foreign key error: ${column} ID ${id} does not exist in ${table}`);
        }
    
        // If ID exists, update client record
        await connection.execute(
          `UPDATE client SET ${column} = :id WHERE id = :clientId`,
          { id, clientId }
        );
      }
    }
    

    // Insert related data
    // Validate and insert related data
    await insertRelatedData('customer_id', 'customer', customers, clientId, connection);
    await insertRelatedData('label_id', 'label', labels, clientId, connection);
    await insertRelatedData('competitor_id', 'competitor', competitors, clientId, connection);
    await insertRelatedData('industry_id', 'industry', industries, clientId, connection);

    return { message: 'Client added successfully', clientId };
  } catch (err) {
    console.error('Database Error:', err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { addClient };

