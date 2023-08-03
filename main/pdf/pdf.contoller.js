const fs = require('fs');
const express = require('express');
const multer = require('multer')
const pdfSevices = require('./pdf.service')
const { PDFDocument } = require('pdf-lib');
const path = require('path');
const router = express.Router();

// Saving file in local server
const storage = multer.memoryStorage();
// const upload = multer({ storage });
const upload = multer({ dest: 'uploads/' });

// ROUTES
router.post('/mergeing', upload.array('pdfFiles') , Pdfmeging);
router.post('/spliting', upload.single('pdfFile'), Pdfspliting);
router.post('/watermarking', upload.fields([{ name: 'pdfFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }]) , Pdfwatermarking);
router.post('/html-to-pdf', htmlToPDF);
router.post('/jpg-to-pdf', upload.array('images'), jpgToPdfController);
router.post('/pdf-to-jpg', upload.single('pdf'), pdfToJpgController);
// router.post('/pdfprotection', upload.single('pdfFile'), protectPDF);
// router.post('/convertToWord', upload.single('pdfFile'), convertToWord);
// router.post('/scan-to-pdf', scanToPDF);
router.post('/add-page-numbers', upload.single('pdfFile'), addPageNumbers);
router.post('/rotate-pdf', upload.single('pdfFile'), rotatePdf);
router.post('/pdftoxlsx', upload.single('pdfFile'), pdftoxlsx);

module.exports = router;


// Merging PDF
async function Pdfmeging(req, res) {
    try {
        const mergedPdf = await pdfSevices.mergePDFs(req.files);
        const outputPath = 'uploads/merged.pdf';
        
        await fs.promises.writeFile(outputPath, await mergedPdf.save());
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.sendFile(outputPath, { root: __dirname });


        res.status(200).json({ msg: "PDF merge successfullt" });
    } catch (error) {
        console.error('Failed to merge PDFs:', error);
        res.status(500).send('Failed to merge PDFs');
    }
}
// Spliting PDF
async function Pdfspliting (req, res) {
    try {
      const pdfBuffer = req.file.buffer;
      const pageNumbers = req.body.pageNumbers;
  
      const outputFilePaths = await pdfSevices.splitPDF(pdfBuffer, pageNumbers);
        
      res.json({ files: outputFilePaths });
    } catch (error) {
      console.error('Failed to split PDF:', error);
      res.status(500).json({ error: 'Failed to split PDF' });
    }
};
// Watermark PDF
async function Pdfwatermarking(req, res) {
    try {
        const pdfFile = req.files['pdfFile'][0];
        const imageFile = req.files['imageFile'][0];
        console.log(pdfFile)
        // Read the PDF file and image
        const pdfBuffer = pdfFile.buffer;
        const imageBuffer = imageFile.buffer;
    
        // Load the PDF document
        const pdfDoc = await PDFDocument.load(pdfBuffer);
    
        // Embed the image
        const image = await pdfDoc.embedPng(imageBuffer);
    
        // Add watermark to each page of the document
        const pages = pdfDoc.getPages();
        for (const page of pages) {
          const { width, height } = page.getSize();
          const imageWidth = width * 0.5; // Set the image width to half the page width
          const imageHeight = (imageWidth * image.height) / image.width;
          const x = (width - imageWidth) / 2;
          const y = (height - imageHeight) / 2;
    
          // Draw the image on the page
          page.drawImage(image, {
            x,
            y,
            width: imageWidth,
            height: imageHeight,
          });
        }
    
        // Save the watermarked PDF to a new buffer
        const modifiedPdfBuffer = await pdfDoc.save();
    
        // Delete the temporary uploaded files
        URL.revokeObjectURL(pdfFile.buffer);
        URL.revokeObjectURL(imageFile.buffer);
    
        // Create a folder named 'uploads' if it doesn't exist
        if (!fs.existsSync('uploads')) {
          fs.mkdirSync('uploads');
        }
    
        // Generate a unique filename for the watermarked PDF
        const timestamp = Date.now();
        const outputFilePath = path.join(__dirname, 'uploads', `watermarked_${timestamp}.pdf`);
    
        // Write the watermarked PDF to the uploads folder
        fs.writeFileSync(outputFilePath, modifiedPdfBuffer);
    
        // Set the headers for file download using res.attachment()
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `watermarked_${timestamp}.pdf`);
        // res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"');
        res.sendFile(outputFilePath, { root: __dirname })
    
        // Stream the file for download
        // const fileStream = fs.createReadStream(outputFilePath);
        // fileStream.pipe(res);
    
        // Remove the file after it has been sent
        fileStream.on('end', () => {
          fs.unlinkSync(outputFilePath);
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add watermark to PDF' });
      }
}


// ============== Converting PDF API'S ================ \\

// PDF to HTML
async function htmlToPDF(req, res) {
    try {
      // Assuming you have some HTML content in req.body.html
      const htmlContent = req.body.html;
  
      // Set the desired output folder path
      const outputFolderPath = path.join('uploads');
      // Convert HTML to PDF and get the output file path
      const outputFilePath = await pdfSevices.convertHTMLToPDF(htmlContent, outputFolderPath);
  
      // Now you can send the outputFilePath back to the client or use it as needed
      res.status(200).json({ filePath: outputFilePath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
}



const { pdfToJpg } = require('pdf-poppler');


async function pdfToJpgController (req, res) {
  try {
    const pdfFilePath = req.file.path;
    const outputFolder = path.join(__dirname, 'uploads');
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder);
    }

    const opts = {
      format: 'jpeg',
      out_dir: outputFolder,
      out_prefix: 'page',
      page: null, // Convert all pages. To convert specific pages, use e.g., "1,3,5"
    };

    const jpgFiles = await pdfToJpg(pdfFilePath, opts);

    res.json({
      message: 'PDF converted to JPG images successfully',
      jpgFiles,
    });
  } catch (error) {
    console.error('Failed to convert PDF to JPG:', error);
    res.status(500).json({ error: 'Failed to convert PDF to JPG' });
  }
};












// JPG to PDF
async function jpgToPdfController (req, res){
    try {
      const pdfBytes = await pdfSevices.convertToPDF(req.files);
  
      const outputFilePath = path.join('uploads', 'output.pdf');
      fs.writeFileSync(outputFilePath, pdfBytes);
  
      res.download(outputFilePath, 'output.pdf', (err) => {
        if (err) {
          console.error('Error while sending the PDF:', err);
        }
        fs.unlinkSync(outputFilePath); // Remove the temporary PDF file after sending
      });
    } catch (error) {
      console.error('Failed to convert JPG to PDF:', error);
      res.status(500).send('Failed to convert JPG to PDF.');
    }
};



async function protectPDF(req, res) {
    try {
        const pdfFile = req.file;
        const password = req.body.password;
    
        if (!pdfFile || !password) {
          return res.status(400).json({ error: 'PDF file and password are required' });
        }
    
        const protectedPdfBuffer = await pdfSevices.protectPDFWithPassword(pdfFile.buffer, password);
    
        // Create a folder named 'uploads' if it doesn't exist
        if (!fs.existsSync('uploads')) {
          fs.mkdirSync('uploads');
        }
    
        // Generate a unique filename for the protected PDF
        const timestamp = Date.now();
        const outputFilePath = path.join(__dirname, '..', 'uploads', `protected_${timestamp}.pdf`);
    
        // Write the protected PDF to the uploads folder
        fs.writeFileSync(outputFilePath, protectedPdfBuffer);
    
        // Set the headers for file download using res.attachment()
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="protected_${timestamp}.pdf"`);
    
        // Stream the protected PDF for download
        const fileStream = fs.createReadStream(outputFilePath);
        fileStream.pipe(res);
    
        // Remove the file after it has been sent
        fileStream.on('end', () => {
          fs.unlinkSync(outputFilePath);
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to protect PDF' });
      }
}
async function convertToWord (req, res) {
  try {
    const pdfFile = req.file;
    console.log(pdfFile)
    // Call the service function to convert PDF to Word
    const wordBuffer = await pdfSevices.convertToWord(pdfFile);

    // Send the Word document as a response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="converted_word.docx"`);
    res.send(wordBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to convert PDF to Word' });
  }
};
async function scanToPDF (req, res) {
    try {
      const outputPath = await pdfSevices.generatePDF();
      // Provide the generated PDF file for download
      res.download(outputPath, 'scanned.pdf', (err) => {
        if (err) {
          console.error(">>>>" , err);
          res.status(500).json({ error: 'Failed to download the scanned PDF file' });
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create scanned PDF' });
    }
};
  


async function addPageNumbers(req, res) {
  try {
    const { file } = req;

    // Read the PDF file
    const pdfBuffer = file.buffer;

    // Add page numbers to the PDF
    const modifiedPdfBuffer = await pdfSevices.addPageNumbersToPDF(pdfBuffer);

    // Create a folder named 'output' if it doesn't exist
    if (!fs.existsSync('output')) {
      fs.mkdirSync('output');
    }

    // Generate a unique filename for the modified PDF
    const timestamp = Date.now();
    const outputFilePath = path.join('uploads', `numbered_${timestamp}.pdf`);

    // Write the modified PDF to the output folder
    fs.writeFileSync(outputFilePath, modifiedPdfBuffer);

    // Send the file download response
    res.download(outputFilePath, `numbered_${timestamp}.pdf`, () => {
      // Remove the file after it has been sent
      // pdfSevices.deleteFile(outputFilePath);
      console.log('PDF No Added Succesfully')
      return 'PDF No Added Succesfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add page numbers to PDF' });
  }
}


async function rotatePdf(req, res) {
  try {
    const { file } = req;
    const { degrees } = req.body;
    // console.log(parseInt(degrees))
    const degress = parseInt(degrees)
    const rotatedPdfBuffer = await pdfSevices.rotatePdf(file, degress);

    // Generate a unique filename for the rotated PDF
    const timestamp = Date.now();
    const outputFilePath = path.join('uploads', `rotated_${timestamp}.pdf`);

    // Write the rotated PDF to the uploads folder
    fs.writeFileSync(outputFilePath, rotatedPdfBuffer);

    // Send the file download response
    res.download(outputFilePath, `rotated_${timestamp}.pdf`, () => {
      // Remove the file after it has been sent
      // fs.unlinkSync(outputFilePath);
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to rotate PDF file' });
  }
}



async function  pdftoxlsx (req, res) {
  const filePath = req.file.path;

  try {
    const excelFilePath = await pdfSevices.convertPdfToExcel(filePath);
    const destinationFilePath = `uploads/${excelFilePath}`;
    fs.renameSync(excelFilePath, destinationFilePath);

    res.download(destinationFilePath, (err) => {
      if (err) {
        console.error('Error sending Excel file:', err);
      }
      // fs.unlinkSync(filePath);
      // fs.unlinkSync(destinationFilePath); // Remove the file after sending the response
    });
  } catch (err) {
    console.error('Error converting PDF to Excel:', err);
    res.status(500).json({ error: 'Error converting PDF to Excel' });
  }
};