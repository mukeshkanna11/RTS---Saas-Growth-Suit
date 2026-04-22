const {
  createAutomationService,
  getAutomationsService,
  getAutomationByIdService,
  updateAutomationService,
  deleteAutomationService,
  toggleAutomationService,
  testAutomationService,
} = require("./automation.service");

// CREATE
exports.createAutomation = async (req, res) => {
  try {
    const data = await createAutomationService(req.body, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL
exports.getAutomations = async (req, res) => {
  try {
    const data = await getAutomationsService(req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ONE ✅ FIXED
exports.getAutomationById = async (req, res) => {
  try {
    const data = await getAutomationByIdService(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

// UPDATE
exports.updateAutomation = async (req, res) => {
  try {
    const data = await updateAutomationService(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteAutomation = async (req, res) => {
  try {
    const data = await deleteAutomationService(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TOGGLE ACTIVE 🔁
exports.toggleAutomation = async (req, res) => {
  try {
    const data = await toggleAutomationService(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// TEST AUTOMATION 🧪
exports.testAutomation = async (req, res) => {
  try {
    const data = await testAutomationService(req.body, req.user);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};