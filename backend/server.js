const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const diabetesRoutes = require("./routes/diabetes.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/diabetes", diabetesRoutes);

mongoose
  .connect("mongodb://localhost:27017/diabetesDB")
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
