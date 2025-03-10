const oracledb = require("oracledb");
const getConnection = require("../config/db"); // Ensure this connects to your Oracle DB

class Industry {
  static async getAllIndustries() {
    let connection;
    try {
      connection = await getConnection();

      const sql = `SELECT id, name FROM industry ORDER BY name ASC`;
      const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

      return result.rows; // Returns an array of industries
    } catch (error) {
      console.error("Error fetching industries:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }
}

module.exports = Industry;
