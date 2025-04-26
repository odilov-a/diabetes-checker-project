const express = require("express");
const router = express.Router();
const Diabetes = require("../models/Diabetes.js");
const { predict } = require("../predict.js");
const { loadOrTrainModel } = require("../predict.js");

router.get("/", async (req, res) => {
  try {
    const data = await Diabetes.find();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await Diabetes.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Record not found" });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  const data = new Diabetes({
    Pregnancies: req.body.Pregnancies,
    Glucose: req.body.Glucose,
    BloodPressure: req.body.BloodPressure,
    SkinThickness: req.body.SkinThickness,
    Insulin: req.body.Insulin,
    BMI: req.body.BMI,
    DiabetesPedigreeFunction: req.body.DiabetesPedigreeFunction,
    Age: req.body.Age,
    Outcome: req.body.Outcome,
  });
  try {
    const newData = await data.save();
    return res.status(201).json(newData);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const data = await Diabetes.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Record not found" });
    data.Pregnancies = req.body.Pregnancies;
    data.Glucose = req.body.Glucose;
    data.BloodPressure = req.body.BloodPressure;
    data.SkinThickness = req.body.SkinThickness;
    data.Insulin = req.body.Insulin;
    data.BMI = req.body.BMI;
    data.DiabetesPedigreeFunction = req.body.DiabetesPedigreeFunction;
    data.Age = req.body.Age;
    data.Outcome = req.body.Outcome;
    const updatedData = await data.save();
    return res.json(updatedData);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const data = await Diabetes.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ message: "Record not found" });
    return res.json({ message: "Record deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/predict", async (req, res) => {
  try {
    const body = req.body;
    const input = body.input || [
      body.Pregnancies,
      body.Glucose,
      body.BloodPressure,
      body.SkinThickness,
      body.Insulin,
      body.BMI,
      body.DiabetesPedigreeFunction,
      body.Age,
    ];
    const prediction = await predict(input);
    return res.json({ prediction });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
