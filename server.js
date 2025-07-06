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
const { Schema } = mongoose; 

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

//Post for signup
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

//post for login
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

//get
app.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Update
app.put("/user/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { email, password } = req.body;

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

////////CONTACT FORM HANDLER////////

const messages = []; 
app.use(express.urlencoded({ extended: true }));


const contactSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true },
  phone:      String,
  subject:    String,
  message:    { type: String, required: true },
  receivedAt: { type: Date,   default: Date.now },
});

const Contact = mongoose.model('Contact', contactSchema);

//POST
app.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, message: 'Name, email and message are required.' });
  }

  try {
    const newMsg = await Contact.create({ name, email, phone, subject, message });
    res.status(201).json({
      success: true,
      message: 'Your message has been received!',
      data: newMsg,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

//GET
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

//mesazhet
app.get('/messages', (req, res) => {
  res.json({ success: true, data: messages });
});

/// DOGS SCHEMA ////

const DogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subheading: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  photoUrl: {
    type: String,
    required: true,
    validate: {
      validator: v => /^https?:\/\//.test(v),
      message: props => `${props.value} is not a valid URL!`
    }
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  breed: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },

  // Story section
  storySection: {
    story: {
      title:      { type: String, trim: true },
      header:     { type: String, trim: true },
      paragraphs: { type: [String], default: [] },
      badges:     { type: [String], default: [] }
    },
    perfectCompanion: {
      title:        { type: String, trim: true },
      description:  { type: String, trim: true },
      features:     { type: [String], default: [] },
      restrictions: { type: String, trim: true }
    }
  },

  // Photo gallery section
  photoGallery: {
    title:    { type: String, trim: true },
    subtitle: { type: String, trim: true },
    images:   {
      type: [String],
      default: [],
      validate: {
        validator: arr => arr.every(url => /^https?:\/\//.test(url)),
        message: 'Each gallery image must be a valid URL'
      }
    }
  },

  // Adoption process section
  adoptionProcess: {
    title:    { type: String, trim: true },
    subtitle: { type: String, trim: true },
    steps: [{
      number:      { type: Number, required: true, min: 1 },
      title:       { type: String, required: true, trim: true },
      description: { type: String, required: true, trim: true }
    }]
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('Dog', DogSchema);


module.exports = mongoose.model('Dog', DogSchema);


const Dog = mongoose.model('Dog', DogSchema);

//post for dogs
app.post('/api/dogs', async (req, res) => {
  const {
    name,
    age,
    gender,
    breed,
    photoUrl,
    description,    // optional
    subheading,     // optional
    size,           // optional
    story,          // should be an object { title, parts: [ ... ] }
    restrictions,   // optional
    features,       // optional array
    gallery         // optional array
  } = req.body;

  // minimal required validation
  if (!name || age == null || !gender || !breed || !photoUrl) {
    return res.status(400).json({ error: 'Missing required fields: name, age, gender, breed, photoUrl' });
  }

  try {
    const dog = new Dog({
      name,
      age,
      gender,
      breed,
      photoUrl,
      description,
      subheading,
      size,
      story,
      restrictions,
      features,
      gallery
    });

    await dog.save();
    return res
      .status(201)
      .location(`/api/dogs/${dog._id}`)
      .json(dog);
  } catch (err) {
    console.error('Error creating dog:', err);
    // send back mongoose validation message if there is one
    return res.status(400).json({ error: err.message });
  }
});


//get for dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const dogs = await Dog.find().lean();
    res.json(dogs);
  } catch (err) {
    console.error('Error in GET /api/dogs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//me id
app.get('/api/dogs/:id', async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).lean();
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }
    res.json(dog);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid dog ID' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});



////ADOPTION FORM SCHEMA////

const AdoptionSchema = new mongoose.Schema({
  dogId:         { type: Schema.Types.ObjectId, ref: 'Dog', required: true },
  name: { type: String, required: true },
  email:         { type: String, required: true },
  phone:         { type: String, required: true },
  address:       { type: String, required: true },
  homeOwnership: { type: String, enum: ['own','rent'] },
  fencedYard:    { type: String, enum: ['yes','no'] },
  otherPets:     { type: String },
  environment:   { type: String },
  whyAdopt:      { type: String }
}, { timestamps: true });


const Adoption = mongoose.model('Adoption', AdoptionSchema);

//post for adoptions
app.post('/api/adoptions', async (req, res) => {
  try {
    const application = new Adoption(req.body);
    await application.save();
    res.status(201).json({ message: 'Application received', application });
  } catch (err) {
    console.error('Adoption save error:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

//get for adoptions
app.get('/api/dogs/:id', async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).lean();
    if (!dog) return res.status(404).json({ error: 'Dog not found' });
    res.json(dog);
  } catch (err) {
    console.error('Error fetching dog:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Start Server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
