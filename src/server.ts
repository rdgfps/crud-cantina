import express from "express";
const app = express();
const port = 3000;

import routesAlunos from "./routes/alunos";
import routesProdutos from "./routes/produtos";
import routesDepositos from "./routes/depositos";
import routesVendas from "./routes/vendas";

app.use(express.json());

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
