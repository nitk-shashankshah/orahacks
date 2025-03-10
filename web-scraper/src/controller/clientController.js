const Client = require("../models/Client");

exports.createClient = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // ✅ Debugging Step

    // Validate required fields
    const { client_name, email, label, customer, competitor, industry_id } = req.body;
    if (!client_name || !email) {
      return res.status(400).json({ error: "client_name and email are required" });
    }

    // Ensure industry_id is an array
    if (!Array.isArray(industry_id)) {
      return res.status(400).json({ error: "industry_id must be an array" });
    }

    const result = await Client.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in createClient:", error); // ✅ Debugging Step
    res.status(500).json({ error: error.message });
  }
};

exports.getClients = async (req, res) => {
  try {
    const clients = await Client.getAll();
    res.status(200).json(clients); // ✅ Returns JSON data safely
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { industry_id } = req.body;
    
    // Ensure industry_id is an array if provided
    if (industry_id && !Array.isArray(industry_id)) {
      return res.status(400).json({ error: "industry_id must be an array" });
    }

    const result = await Client.update(req.params.id, req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const result = await Client.delete(req.params.id);
    if (result.error) {
      return res.status(404).json(result);
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
