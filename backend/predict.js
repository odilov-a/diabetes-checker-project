const tf = require("@tensorflow/tfjs");
const path = require("path");
const fs = require("fs").promises;
const Diabetes = require("./models/Diabetes.js");

let trainedModel = null;
let minValues = null;
let maxValues = null;

const MODEL_JSON_PATH = path.join(__dirname, "../model/diabetes_model.json");

function normalize(data, min, max) {
  return data.map((x, i) => (x - min[i]) / (max[i] - min[i]));
}

async function saveMinMax(min, max) {
  await fs.writeFile(
    path.join(__dirname, "../model/min_max.json"),
    JSON.stringify({ min, max })
  );
}

async function loadMinMax() {
  try {
    const data = await fs.readFile(
      path.join(__dirname, "../model/min_max.json")
    );
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

async function saveModel(model) {
  const modelTopology = model.toJSON(null, false);
  const weights = model.getWeights();
  const weightData = await Promise.all(weights.map((w) => w.data()));
  const weightsManifest = weights.map((w, i) => ({
    paths: [`weights_${i}.bin`],
    weights: [{ name: w.name, shape: w.shape, dtype: w.dtype }],
  }));
  const weightDataArray = await Promise.all(
    weightData.map((data) => Array.from(data))
  );
  for (let i = 0; i < weightDataArray.length; i++) {
    const buffer = Buffer.from(new Float32Array(weightDataArray[i]).buffer);
    await fs.writeFile(
      path.join(__dirname, `../model/weights_${i}.bin`),
      buffer
    );
  }
  const modelData = {
    modelTopology: modelTopology,
    weightsManifest: weightsManifest,
  };
  await fs.writeFile(MODEL_JSON_PATH, JSON.stringify(modelData));
}

async function loadModel() {
  try {
    const modelData = JSON.parse(await fs.readFile(MODEL_JSON_PATH));
    const model = await tf.models.modelFromJSON(modelData.modelTopology);
    const weights = [];
    for (const group of modelData.weightsManifest) {
      for (const pathInfo of group.paths) {
        const weightFile = path.join(__dirname, `../model/${pathInfo}`);
        const buffer = await fs.readFile(weightFile);
        const weightData = new Float32Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.length / 4
        );
        weights.push(tf.tensor(weightData, group.weights[0].shape));
      }
    }
    model.setWeights(weights);
    return model;
  } catch (error) {
    console.error("Error loading model:", error);
    return null;
  }
}

async function trainModel() {
  const data = await Diabetes.find();
  const xs = data.map((item) => [
    item.Pregnancies,
    item.Glucose,
    item.BloodPressure,
    item.SkinThickness,
    item.Insulin,
    item.BMI,
    item.DiabetesPedigreeFunction,
    item.Age,
  ]);
  const ys = data.map((item) => item.Outcome);
  const min = xs[0].map((_, i) => Math.min(...xs.map((row) => row[i])));
  const max = xs[0].map((_, i) => Math.max(...xs.map((row) => row[i])));
  const normalizedXs = xs.map((row) => normalize(row, min, max));
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 64, activation: "relu", inputShape: [8] })
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: 32, activation: "relu" }));
  model.add(tf.layers.dense({ units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });
  const xsTensor = tf.tensor2d(normalizedXs);
  const ysTensor = tf.tensor2d(ys, [ys.length, 1]);
  await model.fit(xsTensor, ysTensor, {
    epochs: 200,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
      },
    },
  });
  await saveMinMax(min, max);
  await saveModel(model);
  trainedModel = model;
  minValues = min;
  maxValues = max;
  return { model, min, max };
}

async function loadOrTrainModel() {
  if (trainedModel && minValues && maxValues) {
    console.log("Using in-memory model");
    return { model: trainedModel, min: minValues, max: maxValues };
  }
  const minMax = await loadMinMax();
  const savedModel = await loadModel();
  if (minMax && savedModel) {
    console.log("Loaded saved model");
    trainedModel = savedModel;
    minValues = minMax.min;
    maxValues = minMax.max;
    return { model: trainedModel, min: minValues, max: maxValues };
  }
  console.log("No saved model or min/max values found, training new model...");
  return await trainModel();
}

async function predict(input) {
  const { model, min, max } = await loadOrTrainModel();
  const normalizedInput = normalize(input, min, max);
  const inputTensor = tf.tensor2d([normalizedInput]);
  const prediction = model.predict(inputTensor);
  const result = prediction.dataSync()[0] > 0.5 ? 1 : 0;
  inputTensor.dispose();
  prediction.dispose();
  return result;
}

module.exports = { predict };
