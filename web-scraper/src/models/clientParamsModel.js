const oracledb = require("oracledb");
const getConnection = require("../config/db");

class ClientParams {
  static async getClientParams(id) {
    let connection;
    try {
      connection = await getConnection();
      
      // 1. Get client basic details from the CLIENTS table.
      const clientSql = `
        SELECT 
          c.id, 
          c.client_name, 
          c.email
        FROM CLIENTS c
        WHERE c.id = :id
      `;
      const clientResult = await connection.execute(
        clientSql,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (clientResult.rows.length === 0) return null;
      let client = clientResult.rows[0];

      // 2. Get industries for the client from client_industry joined with industry.
      //    The resulting industry names will be used as "labels".
      const industrySql = `
        SELECT i.NAME 
        FROM client_industry ci
        JOIN industry i ON ci.industry_id = i.id
        WHERE ci.client_id = :id
        ORDER BY i.NAME ASC
      `;
      const industryResult = await connection.execute(
        industrySql,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const labelArray = industryResult.rows.map(row => row.NAME);

      // 3. Get assigned widget classifications from CLIENT_WIDGETS joined with WIDGETS.
      const widgetSql = `
        SELECT w.id, w.name
        FROM WIDGETS w
        INNER JOIN CLIENT_WIDGETS cw ON w.id = cw.widgets_id
        WHERE cw.client_id = :id
        ORDER BY w.name ASC
      `;
      const widgetResult = await connection.execute(
        widgetSql,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const classifications = widgetResult.rows.map(widget => widget.NAME);

      return {
        id: client.ID,
        client_name: client.CLIENT_NAME,
        email: client.EMAIL,
        label: labelArray,
        classifications
      };
    } catch (error) {
      console.error("Error in getClientParams:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }
}

module.exports = ClientParams;
