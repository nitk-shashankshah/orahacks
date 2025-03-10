const oracledb = require("oracledb");
const getConnection = require("../config/db"); // Ensure this connects to your Oracle DB

class WidgetModel {
  static async getAllWidgets() {
    let connection;
    try {
      connection = await getConnection();
      const sql = `SELECT * FROM widgets ORDER BY name ASC`;
      const result = await connection.execute(sql, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return result.rows; // Returns an array of widgets
    } catch (error) {
      console.error("Error fetching widgets:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  static async assignWidgets(clientId, widgetIds) {
    let connection;
    try {
      connection = await getConnection();
      
      // Delete any existing assignments for the client
      const deleteSql = `
        DELETE FROM CLIENT_WIDGETS
        WHERE client_id = :clientId
      `;
      await connection.execute(deleteSql, { clientId }, { autoCommit: false });
      
      // Insert new assignments if widgetIds array is not empty
      if (widgetIds && widgetIds.length > 0) {
        const insertSql = `
          INSERT INTO CLIENT_WIDGETS (client_id, widgets_id)
          VALUES (:clientId, :widgetId)
        `;
        for (const widgetId of widgetIds) {
          await connection.execute(insertSql, { clientId, widgetId }, { autoCommit: false });
        }
      }
      
      await connection.commit();
      return { message: "Widget assignments updated successfully" };
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("Error during rollback:", rollbackError);
        }
      }
      console.error("Error assigning widgets:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  static async getWidgetsByClient(clientId) {
    let connection;
    try {
      connection = await getConnection();
      const sql = `
        SELECT w.id, w.name
        FROM widgets w
        INNER JOIN CLIENT_WIDGETS cw ON w.id = cw.widgets_id
        WHERE cw.client_id = :clientId
        ORDER BY w.name ASC
      `;
      const result = await connection.execute(
        sql,
        { clientId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      return result.rows;
    } catch (error) {
      console.error("Error fetching widgets for client:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }
}

module.exports = WidgetModel;
