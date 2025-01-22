const express = require("express");
const app = express();

app.get("/", (req, res)=>{
    res.send("le serveur fonctionne!");
})

const PORT = 5000;
app.listen(PORT, ()=>{
    console.log(`Serveur lancé sur le port ${PORT}`);
})