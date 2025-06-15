const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer'); // optional, for sending emails
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static HTML/CSS/JS from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// GET route to serve the contact page (if placed under public/contact.html)
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// POST route to handle form submissions
app.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'Please fill out all required fields.' });
  }

  try {
    // Example: send an email notification (optional)
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.example.com',
    //   port: 587,
    //   auth: { user: 'you@example.com', pass: 'password' }
    // });
    // await transporter.sendMail({
    //   from: 'no-reply@fourpaws.com',
    //   to: 'info@fourpaws.com',
    //   subject: `New contact form submission: ${subject}`,
    //   text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage:\n${message}`
    // });

    // TODO: save to database or send email
    console.log('Contact form submitted:', { name, email, phone, subject, message });

    res.json({ message: 'Your message has been received. Thank you!' });
  } catch (err) {
    console.error('Error handling contact form:', err);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
