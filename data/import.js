const fs = require("fs");
const csv = require("csv-parse");
const mongoose = require("mongoose");
const Diabetes = require("../backend/models/Diabetes.js");

mongoose.connect("mongodb://localhost:27017/diabetesDB");

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected for import");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
  process.exit(1);
});

const parser = csv.parse({ columns: true, trim: true });
const entries = [];

fs.createReadStream("./data/diabetes.csv")
  .pipe(parser)
  .on("data", (row) => {
    const data = new Diabetes({
      Pregnancies: parseFloat(row.Pregnancies),
      Glucose: parseFloat(row.Glucose),
      BloodPressure: parseFloat(row.BloodPressure),
      SkinThickness: parseFloat(row.SkinThickness),
      Insulin: parseFloat(row.Insulin),
      BMI: parseFloat(row.BMI),
      DiabetesPedigreeFunction: parseFloat(row.DiabetesPedigreeFunction),
      Age: parseFloat(row.Age),
      Outcome: parseFloat(row.Outcome),
    });
    entries.push(data);
  })
  .on("end", async () => {
    try {
      await Diabetes.insertMany(entries);
      console.log("CSV imported successfully");
    } catch (error) {
      console.error("Error importing data:", error);
    } finally {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    }
  })
  .on("error", (error) => {
    console.error("Error reading CSV file:", error);
    mongoose.connection.close();
    process.exit(1);
  });
