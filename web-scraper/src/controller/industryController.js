const Industry = require("../models/Industry");

exports.getIndustries = async (req, res) => {
  try {
    const industries = await Industry.getAllIndustries();
    
    if (industries.length === 0) {
      return res.status(404).json({ message: "No industries found" });
    }

    res.status(200).json(industries);
  } catch (error) {
    console.error("Error in getIndustries API:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
