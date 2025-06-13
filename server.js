const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path"); 

require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Four-Paws-main', 'index.html'));
});

app.use('/pics', express.static('pics'));

mongoose
  .connect("mongodb://localhost:27017/FourPaws")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB error:", err));

// User Model
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// Login Route
//Post
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Get
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email or password is incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password is incorrect" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Delete
app.delete("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


//Update
app.put("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password } = req.body;

        // Prepare update object
        const updates = {};
        if (email) updates.email = email;
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Sign-Up Route
//Post
app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, email, password} = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ firstName, lastName, email, password:hashedPassword});

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

//Update
app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, password } = req.body;

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (email) updates.email = email;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user: updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Delete
app.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start Server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
