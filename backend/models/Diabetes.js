const { Schema, model } = require("mongoose");
const diabetesSchema = new Schema(
  {
    Pregnancies: {
      type: Number,
    },
    Glucose: {
      type: Number,
    },
    BloodPressure: {
      type: Number,
    },
    SkinThickness: {
      type: Number,
    },
    Insulin: {
      type: Number,
    },
    BMI: {
      type: Number,
    },
    DiabetesPedigreeFunction: {
      type: Number,
    },
    Age: {
      type: Number,
      min: 0,
    },
    Outcome: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = model("Diabete", diabetesSchema);
