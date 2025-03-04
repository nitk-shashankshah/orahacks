const oracledb = require('oracledb');  // <--- Add this line

const { addClient } = require('../models/clientModel');

async function createClient(req, res) {
  try {
    const clientData = req.body;

    if (!clientData.name || !clientData.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await addClient(clientData);
    res.status(201).json(result);
  } catch (err) {
    console.error('Controller Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = { createClient };




// Shashank Shah
// 2:37 PM
// CREATE SEQUENCE  "MY_SEQ"  
// MINVALUE 1 MAXVALUE 99999 INCREMENT BY 1 START WITH 1
// NOCACHE  NOORDER  NOCYCLE  NOKEEP  NOSCALE  GLOBAL ;  



// insert into CLIENT("ID","EMAIL","NAME") values(MY_SEQ.NEXTVAL,'a','v');