const oracledb = require("oracledb");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  externalAuth  : false,
  walletLocation : '../Wallet_orahacks',
  walletPassword : 'Or@hacks123'
};

async function getConnection() {
  try {
    return await oracledb.getConnection(dbConfig);
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

module.exports = getConnection;
