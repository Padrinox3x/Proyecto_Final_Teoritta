const cloudinary = require('cloudinary').v2;

// Aquí es donde la magia ocurre: 
// Node toma los valores que pusiste en la pantalla de Render
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

module.exports = cloudinary;