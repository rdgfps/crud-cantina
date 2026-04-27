import express from "express";
import cors from "cors";

const app = express();
const port = 3001;

import routesAlunos from "./routes/alunos";
import routesProdutos from "./routes/produtos";
import routesDepositos from "./routes/depositos";
import routesVendas from "./routes/vendas";

app.use(cors());
app.use(express.json());

app.get("/teste", (req, res) => {
  res.send("FUNCIONANDO");
});

app.use("/alunos", routesAlunos);
app.use("/produtos", routesProdutos);
app.use("/depositos", routesDepositos);
app.use("/vendas", routesVendas);

app.get("/", (req, res) => {
  res.send("API: Cantina Escolar — Controle de Contas de Alunos");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});