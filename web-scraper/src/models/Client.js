const oracledb = require("oracledb");
const getConnection = require("../config/db");

class Client {
  static async create(client) {
    let connection;
    try {
      connection = await getConnection();

      // Step 1: Check if client already exists
      const checkSql = `SELECT COUNT(*) AS count FROM clients WHERE client_name = :client_name OR email = :email`;
      const checkResult = await connection.execute(
        checkSql,
        { client_name: client.client_name, email: client.email },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (checkResult.rows[0].COUNT > 0) {
        return { error: "Client with the same name or email already exists" };
      }

      // Step 2: Insert new client
      const sql = `INSERT INTO clients (client_name, email, label, customer, competitor)
                   VALUES (:client_name, :email, :label, :customer, :competitor) 
                   RETURNING id INTO :id`;

      const binds = {
        client_name: client.client_name,
        email: client.email,
        label: client.label ? client.label.join(",") : "",
        customer: client.customer ? client.customer.join(",") : "",
        competitor: client.competitor ? client.competitor.join(",") : "",
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await connection.execute(sql, binds, { autoCommit: true });
      const clientId = result.outBinds.id[0];

      // Step 3: Insert industries into client_industry table
      if (Array.isArray(client.industry_id) && client.industry_id.length > 0) {
        const industrySql = `INSERT INTO client_industry (client_id, industry_id) VALUES (:client_id, :industry_id)`;
        const industryBinds = client.industry_id.map((industryId) => ({
          client_id: clientId,
          industry_id: industryId,
        }));

        await connection.executeMany(industrySql, industryBinds, {
          autoCommit: true,
        });
      }

      return { message: "Client created successfully", id: clientId };
    } catch (error) {
      console.error("Error in Client.create:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  static async getAll() {
    let connection;
    try {
      connection = await getConnection();
      const sql = `
        SELECT 
          c.id, 
          c.client_name, 
          c.email, 
          CAST(DBMS_LOB.SUBSTR(c.label, 4000, 1) AS VARCHAR2(4000)) AS label, 
          CAST(DBMS_LOB.SUBSTR(c.customer, 4000, 1) AS VARCHAR2(4000)) AS customer, 
          CAST(DBMS_LOB.SUBSTR(c.competitor, 4000, 1) AS VARCHAR2(4000)) AS competitor, 
          COALESCE(
            (SELECT LISTAGG(ci.industry_id, ',') WITHIN GROUP (ORDER BY ci.industry_id) 
             FROM client_industry ci WHERE ci.client_id = c.id), 
            ' ') AS industries
        FROM clients c
      `;

      const results = await connection.execute(sql, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      return results.rows.map((client) => ({
        id: client.ID,
        client_name: client.CLIENT_NAME,
        email: client.EMAIL,
        label: client.LABEL ? client.LABEL.split(",") : [],
        customer: client.CUSTOMER ? client.CUSTOMER.split(",") : [],
        competitor: client.COMPETITOR ? client.COMPETITOR.split(",") : [],
        industry_id: client.INDUSTRIES.trim()
          ? client.INDUSTRIES.split(",").map(Number)
          : [],
      }));
    } catch (error) {
      console.error("Error in getAll:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  static async getById(id) {
    let connection;
    try {
      connection = await getConnection();
      const sql = `
        SELECT 
          c.id, 
          c.client_name, 
          c.email, 
          CAST(DBMS_LOB.SUBSTR(c.label, 4000, 1) AS VARCHAR2(4000)) AS label, 
          CAST(DBMS_LOB.SUBSTR(c.customer, 4000, 1) AS VARCHAR2(4000)) AS customer, 
          CAST(DBMS_LOB.SUBSTR(c.competitor, 4000, 1) AS VARCHAR2(4000)) AS competitor, 
          COALESCE(
            (SELECT LISTAGG(ci.industry_id, ',') WITHIN GROUP (ORDER BY ci.industry_id) 
             FROM client_industry ci WHERE ci.client_id = c.id), 
            ' ') AS industries
        FROM clients c
        WHERE c.id = :id
      `;

      const result = await connection.execute(
        sql,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if (result.rows.length === 0) return null;

      let client = result.rows[0];

      return {
        id: client.ID,
        client_name: client.CLIENT_NAME,
        email: client.EMAIL,
        label: client.LABEL ? client.LABEL.split(",") : [],
        customer: client.CUSTOMER ? client.CUSTOMER.split(",") : [],
        competitor: client.COMPETITOR ? client.COMPETITOR.split(",") : [],
        industry_id: client.INDUSTRIES.trim()
          ? client.INDUSTRIES.split(",").map(Number)
          : [],
      };
    } catch (error) {
      console.error("Error in getById:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  static async update(id, client) {
    let connection;
    try {
      connection = await getConnection();

      // Step 1: Update client
      const sql = `UPDATE clients 
                   SET client_name = :client_name, email = :email, label = :label,
                       customer = :customer, competitor = :competitor
                   WHERE id = :id`;

      const binds = {
        id,
        client_name: client.client_name,
        email: client.email,
        label: client.label ? client.label.join(",") : "",
        customer: client.customer ? client.customer.join(",") : "",
        competitor: client.competitor ? client.competitor.join(",") : "",
      };

      const result = await connection.execute(sql, binds, { autoCommit: true });

      if (result.rowsAffected === 0) return { error: "Client not found" };

      // Step 2: Update industries
      if (Array.isArray(client.industry_id)) {
        // Remove old industries
        await connection.execute(
          `DELETE FROM client_industry WHERE client_id = :id`,
          { id },
          { autoCommit: true }
        );

        // Insert new industries
        if (client.industry_id.length > 0) {
          const industrySql = `INSERT INTO client_industry (client_id, industry_id) VALUES (:client_id, :industry_id)`;
          const industryBinds = client.industry_id.map((industryId) => ({
            client_id: id,
            industry_id: industryId,
          }));

          await connection.executeMany(industrySql, industryBinds, {
            autoCommit: true,
          });
        }
      }

      return { message: "Client updated successfully" };
    } catch (error) {
      console.error("Error in Client.update:", error);
      throw error;
    } finally {
      if (connection) await connection.close();
    }
  }

  static async delete(id) {
    let connection;
    try {
      connection = await getConnection();

      await connection.execute(
        `DELETE FROM client_widgets WHERE client_id = :id`,
        { id },
        { autoCommit: true }
      );

      await connection.execute(
        `DELETE FROM client_industry WHERE client_id = :id`,
        { id },
        { autoCommit: true }
      );

      const sql = `DELETE FROM clients WHERE id = :id`;
      const result = await connection.execute(
        sql,
        { id },
        { autoCommit: true }
      );

      if (result.rowsAffected === 0) return { error: "Client not found" };

      return { message: "Client deleted successfully" };
    } finally {
      if (connection) await connection.close();
    }
  }
}

module.exports = Client;
