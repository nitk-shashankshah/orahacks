require('dotenv').config();
const oracledb = require('oracledb');

oracledb.autoCommit = true;

const dbConfig = {
  user: "ADMIN",
  password: "Or@hacks2025",
  connectionString:
    '(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1522)(host=adb.ap-mumbai-1.oraclecloud.com))(connect_data=(service_name=g6dd5b83783d7f9_orahacks_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes))(ssl_server_cert_dn="CN=adwc.uscom-east-1.oraclecloud.com, O=Oracle Corporation, L=Redwood City, ST=California, C=US"))',
  externalAuth: false,
  walletLocation: "../Wallet_orahacks",
  walletPassword: "Or@hacks123",
};

// Function to get a database connection
async function getConnection() {
  try {
    return await oracledb.getConnection(dbConfig);
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

module.exports = { getConnection };
