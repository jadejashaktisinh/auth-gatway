import "dotenv/config";
import express from "express";
import clientRoutes from "./routes/clients.routes.js";
import tokenRoutes from "./routes/token.routes.js";
import dynamicProxy from "./routes/dynamic.routes.js";
import vhost from "vhost";
import redisClient from "./config/redis.js";
const app = express();

const proxyApp = express();
proxyApp.use("/*route", dynamicProxy);

app.use(vhost("*" + process.env.DOMAIN, proxyApp));

const port = 3000;

app.use(express.json());
app.use("/", clientRoutes);
app.use("/", tokenRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
