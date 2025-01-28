const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const Task = require("./models/Tasks"); 

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const authMiddleware = require("./authMiddleware");

require("dotenv").config();

const app = express();
const PORT = 5000;

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connexion à MongoDB réussie !");
  })
  .catch((err) => {
    console.error("Erreur de connexion à MongoDB", err);
  });

app.get("/", (req, res)=>{
    res.send("le serveur fonctionne!");
})

app.post("/api/users", async(req,res)=>{
    const {username, email, password} = req.body;

    const user = new User({username, email, password});

    try{   
        await user.save();
        res.status(201).json({message: "Utilisateur créé avec succés", user})

    }catch(err){
        res.status(400).json({error: "Erreur lors de la création de l'utilisateur ", details: error});
    }
})

app.post("/api/tasks", authMiddleware , async(req,res)=>{
    const {title, description} = req.body;
    const userId = req.userId;

    const task = new Task({title, description, user: userId});

    try{   
        await task.save();
        res.status(201).json({message: "Tache créé avec succés", task})

    }catch(err){
        res.status(400).json({error: "Erreur lors de la création de la tache ", details: error});
    }
})

app.get("/api/tasks", authMiddleware , async(req,res)=>{
  const userId = req.userId;

  try{
      const tasks = await Task.find({ user: userId });
      if (tasks){
        res.status(201).json({message: "Taches: ", tasks});
      }
      

  }catch(err){
      res.status(400).json({error: "Erreur lors de la récupération des la tache ", details: err.message});
  }
})

app.put("/api/tasks/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {title, description, status} = req.body;
  try {
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: req.userId }, // Vérifie que la tâche appartient à l'utilisateur
      {title, description, status},
      { new: true } // Retourne la tâche mise à jour
    );

    if (!updatedTask) {
      return res.status(404).json({ error: "Tâche introuvable ou non autorisée" });
    }

    res.status(200).json({ message: "Tâche mise à jour avec succès", updatedTask });
  } catch (err) {
    res.status(400).json({ error: "Erreur lors de la mise à jour de la tâche", details: err.message });
  }
});

app.delete("/api/tasks/:id", authMiddleware , async(req,res)=>{
  const userId = req.userId;
  const taskId = req.params.id;


  try{
      const deletedTask  = await Task.findOneAndDelete({_id: taskId ,user:userId });
      if (!deletedTask ){
        return res.status(404).json({ error: "Tâche introuvable ou non autorisée" });      
      }
      
      res.status(200).json({ message: "Tâche supprimée avec succès", deletedTask });

  }catch(err){
      res.status(400).json({error: "Erreur lors de la suppression des la tache ", details: error.message});
  }
})

// Route d'inscription
app.post("/api/auth/signup", async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Vérifie si l'email ou le nom d'utilisateur existent déjà
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ error: "Utilisateur déjà existant" });
      }
  
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Créer l'utilisateur
      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });
  
      await newUser.save();
  
      // Créer un token JWT
      const token = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
  
      res.status(201).json({ message: "Utilisateur créé", token });
  
    } catch (error) {
      // Afficher l'erreur dans la console
      console.error("Erreur lors de l'inscription:", error);
      
      res.status(500).json({
        error: "Erreur lors de l'inscription",
        details: error.message  // Affiche l'erreur détaillée dans la réponse
      });
    }
  });


app.post("/api/auth/login", async(req, res)=>{
    const {email, password} = req.body;

    try{
        const user = await User.findOne ({email});
        if (!user){
            return res.status(400).json({error: "Utilisateur non trouvé"})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch){
            return res.status(400).json({error: "Mot de passe incorrect"})
        }

        const token = jwt.sign(
            {userId: user._id},
            process.env.JWT_SECRET,
            { expiresIn: "1h"}
        );
        res.status(200).json({message: "Connexion réussie", token})
    
    } catch (error){
        res.status(500).json({error: "Erreur lors de la connexion", details:error})
    } 
})

app.listen(PORT, ()=>{
    console.log(`Serveur lancé sur le port ${PORT}`);
})