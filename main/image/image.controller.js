const express = require('express');
const router = express.Router();
const imageService = require('./image.service')
const multer = require('multer');


// multer 
const storage = multer.memoryStorage();
// const upload = multer({ storage });
const upload = multer({ dest: 'uploads/' });

router.post('/3FRConverter', upload.single('image'), FRConverter);
  
module.exports = router;

async function FRConverter(req, res) {
  try {
    const result = await imageService.convertImage(req.file);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'An error occurred during conversion' });
  }
};
