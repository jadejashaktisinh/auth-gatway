import express from "express";


const app = express();

const port = 3002;

app.use(express.json());
app.post("/inventory/:id", (req, res) => {
  const data = req.body;
  const {id} = req.params;
  console.log("Received data:", data , "for order id:", id);
  res.status(200).json({ message: "Data received successfully", receivedData: data });
});

app.get("/", (req, res) => {
  
  console.log("Received data:", "dummy backend");
  res.status(200).json({ message: "Data received successfully", receivedData: "dummy backend" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
