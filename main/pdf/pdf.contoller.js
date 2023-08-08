const fs = require('fs');
const express = require('express');
const multer = require('multer')
const pdfSevices = require('./pdf.service')
const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');
const PDFDocumentkit = require('pdfkit');
const puppeteer = require('puppeteer-core');
const path = require('path');
const router = express.Router();
const { pdfToJpg } = require('pdf-poppler');

// Saving file in local server
const storage = multer.memoryStorage();
// const upload = multer({ storage });
const upload = multer({ dest: 'uploads/' });

// ROUTES
router.post('/mergeing', upload.array('pdfFiles'), Pdfmeging);
router.post('/spliting', upload.single('pdfFile'), Pdfspliting);
router.post('/watermarking', upload.fields([{ name: 'pdfFile', maxCount: 1 }, { name: 'imageFile', maxCount: 1 }]), Pdfwatermarking);
router.post('/html-to-pdf', htmlToPDF);
router.post('/jpg-to-pdf', upload.array('images'), jpgToPdfController);
router.post('/pdf-to-jpg', upload.single('pdf'), pdfToJpgController);
// router.post('/pdfprotection', upload.single('pdfFile'), protectPDF);
// router.post('/convertToWord', upload.single('pdfFile'), convertToWord);
// router.post('/scan-to-pdf', scanToPDF);
router.post('/add-page-numbers', upload.single('pdfFile'), addPageNumbers);
router.post('/rotate-pdf', upload.single('pdfFile'), rotatePdf);
router.post('/pdftoxlsx', upload.single('pdfFile'), pdftoxlsx);
router.post('/Xlsxtopdf', upload.single('xlsx'), Xlsxtopdf);
router.post('/PdfToText', upload.single('pdfFile'), convertPdfToText);
router.post('/delete-pages', upload.single('pdfFile'), deletePages);
router.post('/convertPdfToCsv', upload.single('pdfFile'), convertPdfToCsv);
router.post('/genratePDF',generatePdf);
router.get('/urltoPDF', urltoPDF);

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
async function Pdfspliting(req, res) {
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

async function pdfToJpgController(req, res) {
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

async function jpgToPdfController(req, res) {
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

async function convertToWord(req, res) {
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

async function scanToPDF(req, res) {
  try {
    const outputPath = await pdfSevices.generatePDF();
    // Provide the generated PDF file for download
    res.download(outputPath, 'scanned.pdf', (err) => {
      if (err) {
        console.error(">>>>", err);
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
};

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
};

async function pdftoxlsx(req, res) {
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

async function Xlsxtopdf(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  console.log(filePath)
  try {
    // Read the Excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // Create PDF from Excel data
    const pdfFilePath = `uploads/outputXLSpdf.pdf`;
    const pdfDoc = new PDFDocumentkit();
    const stream = fs.createWriteStream(pdfFilePath);

    stream.on('finish', () => {
      res.download(pdfFilePath, (err) => {
        if (err) {
          console.error('Error sending PDF:', err);
        }
        // fs.unlinkSync(filePath);
        // fs.unlinkSync(pdfFilePath);
      });
    });

    // Loop through each sheet in the workbook
    workbook.eachSheet((worksheet, sheetId) => {
      // Add a new page for each sheet in the PDF
      if (sheetId !== 1) {
        pdfDoc.addPage();
      }
      // Set font and font size for the PDF content
      pdfDoc.font('Helvetica').fontSize(12);

      // Loop through each row in the sheet
      worksheet.eachRow((row, rowNumber) => {
        // Loop through each cell in the row
        row.eachCell((cell, colNumber) => {
          // Get the cell value and add it to the PDF
          const cellValue = cell.value ? cell.value.toString() : '';
          pdfDoc.text(cellValue, colNumber * 100, rowNumber * 20, { width: 100 });
        });
      });
    });

    // Pipe the PDF document to the output stream
    pdfDoc.pipe(stream);

    // End the PDF generation
    pdfDoc.end();
  } catch (err) {
    console.error('Error converting XLSX to PDF:', err);
    res.status(500).json({ error: 'Error converting XLSX to PDF' });
  }
};

async function urltoPDF(req, res) {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is missing' });
  }

  try {
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });

    const pdfFilePath = path.resolve(__dirname, 'uploads', 'output.pdf');

    await page.pdf({ path: pdfFilePath, format: 'A4', printBackground: true });

    await browser.close();

    res.download(pdfFilePath, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
      }
      // fs.unlinkSync(pdfFilePath);
    });
  } catch (err) {
    console.error('Error converting URL to PDF:', err);
    res.status(500).json({ error: 'Error converting URL to PDF' });
  }
};

async function convertPdfToText(req, res) {
  try {
    // Check if the file was uploaded correctly
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const text = await pdfSevices.convertPdfToText(filePath);

    res.status(200).json({ text });
  } catch (err) {
    console.error('Error converting PDF to text:', err);
    res.status(500).json({ error: 'Error converting PDF to text' });
  } finally {
    fs.unlinkSync(filePath);
  }
}

async function deletePages(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const pagesToDeletes = req.body.pages;
    const pagesToDelete = JSON.parse(pagesToDeletes)

    if (!pagesToDelete || !Array.isArray(pagesToDelete) || pagesToDelete.length === 0) {
      return res.status(400).json({ error: 'Pages parameter is missing or invalid' });
    }

    const modifiedPdfBytes = await pdfSevices.deletePages(filePath, pagesToDelete);

    const pdfFilePath = path.resolve('uploads', 'modified.pdf');
    await fs.promises.writeFile(pdfFilePath, modifiedPdfBytes);

    res.download(pdfFilePath, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
      }
      // fs.unlinkSync(filePath);
      // fs.unlinkSync(pdfFilePath);
    });
  } catch (err) {
    console.error('Error deleting pages from PDF:', err);
    res.status(500).json({ error: 'Error deleting pages from PDF' });
  }
}


async function convertPdfToCsv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfBuffer = await fs.promises.readFile(req.file.path);
    const text = await pdfSevices.extractTextFromPdf(pdfBuffer);

    const csvContent = text
      .split('\n')
      .map(line => line.trim().split(/\s+/).join(','))
      .join('\n');

    const csvFilePath = path.join('uploads', 'converted.csv');;
    console.log(csvFilePath)
    await fs.promises.writeFile(csvFilePath, csvContent);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=converted.csv`);
    res.sendFile(csvFilePath, (err) => {
      if (err) {
        console.error('Error sending CSV file:', err);
      }
      fs.unlinkSync(req.file.path);
      // fs.unlinkSync(csvFilePath);
    });
  } catch (err) {
    console.error('Error converting PDF to CSV:', err);
    res.status(500).json({ error: 'Error converting PDF to CSV' });
  }
}



async function generatePdf(req, res) {
  try {
    const userText = req.body.text || 'Default Text'; // Get text from request body or use default

    const pdfBytes = await pdfSevices.generatePdfWithText(userText);

    // Save the generated PDF in the uploads folder
    const pdfFilePath = path.join('uploads', 'generated.pdf');
    await fs.promises.writeFile(pdfFilePath, pdfBytes);

    // Send the generated PDF as a downloadable response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf');
    res.send(pdfBytes);
  } catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({ error: 'Error generating PDF' });
  }
}


