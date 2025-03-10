const WidgetModel = require("../models/widgetModel");

exports.getWidgets = async (req, res) => {
  try {
    const widgetList = await WidgetModel.getAllWidgets();
    
    if (!widgetList.length) {
      return res.status(404).json({ message: "No widgets found" });
    }

    res.status(200).json(widgetList);
  } catch (error) {
    console.error("Error in widgets API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.assignWidgetsToClient = async (req, res) => {
  try {
    const { clientId, widgetIds } = req.body;
    
    if (!clientId || !Array.isArray(widgetIds)) {
      return res.status(400).json({ error: "clientId and widgetIds (as an array) are required" });
    }
    
    const result = await WidgetModel.assignWidgets(clientId, widgetIds);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in assignWidgetsToClient API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};


exports.getWidgetsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }
    const widgets = await WidgetModel.getWidgetsByClient(clientId);
    // Return 200 with an empty array if no widgets are found
    return res.status(200).json(widgets);
  } catch (error) {
    console.error("Error in getWidgetsByClient API:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
