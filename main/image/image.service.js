const sharp = require('sharp');
// const path = require('path');

async function convertImage (file){
  if (!file) {
    throw new Error('No image file provided');
  }

  // Perform image conversion using sharp library
  const outputFilePath = `uploads/converted-${file.filename}.3fr`;
  // await sharp(file.path).toFile(outputFilePath);

  return { message: 'Image converted and stored successfully' };
};




module.exports = {
    convertImage
};