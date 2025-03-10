const ClientParams = require("../models/clientParamsModel");

exports.getClientParams = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }
    const params = await ClientParams.getClientParams(clientId);
    res.status(200).json(params);
  } catch (error) {
    console.error("Error in getClientParams API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
