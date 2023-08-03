const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const puppeteer = require('puppeteer');
const path = require('path');
const pdfImgConvert = require('pdf-img-convert');

async function mergePDFs(pdfFiles) {
    const mergedPdf = await PDFDocument.create();
  
    for (const file of pdfFiles) {
      const pdfBytes = await fs.promises.readFile(file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);
  
      const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }
    return mergedPdf;
};
async function splitPDF(pdfBuffer, pageNumbers) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const outputFolder = path.join('uploads');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  const outputFilePaths = [];

  for (const pageNumber of pageNumbers) {
    if (pageNumber >= 1 && pageNumber <= pdfDoc.getPageCount()) {
      const newPDF = await PDFDocument.create();
      const [copiedPage] = await newPDF.copyPages(pdfDoc, [pageNumber - 1]);
      newPDF.addPage(copiedPage);

      const outputFileName = `page_${pageNumber}.pdf`;
      const outputFilePath = path.join(outputFolder, outputFileName);
      const pdfBytes = await newPDF.save();

      fs.writeFileSync(outputFilePath, pdfBytes);
      outputFilePaths.push(outputFilePath);
    } else {
      console.log(`Invalid page number: ${pageNumber}`);
    }
  }

  return outputFilePaths;
};
async function convertHTMLToPDF(html, outputFolderPath) {
  try {
    if (!html) {
      throw new Error('HTML content is required');
    }

    // Launch Puppeteer headless browser
    const browser = await puppeteer.launch();

    // Create a new page
    const page = await browser.newPage();

    // Set the page content to the provided HTML
    await page.setContent(html);

    // Generate PDF from the HTML
    const pdfBuffer = await page.pdf({ format: 'A4' });

    // Close the browser
    await browser.close();

    // Create the output folder if it doesn't exist
    if (!fs.existsSync(outputFolderPath)) {
      fs.mkdirSync(outputFolderPath);
    }

    // Generate a unique filename for the PDF
    const timestamp = Date.now();
    const outputFilePath = path.join(outputFolderPath, `output_${timestamp}.pdf`);

    // Write the PDF to the output folder
    fs.writeFileSync(outputFilePath, pdfBuffer);

    return outputFilePath;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to convert HTML to PDF');
  }
};


async function convertPDFToJPG(pdfBuffer) {
  try {
    // Convert the PDF buffer to JPG
    const jpgBuffer = await pdfImgConvert.convert(pdfBuffer, 'jpeg', 300);

    // Optionally, save the JPG to the 'uploads' folder
    const timestamp = Date.now();
    const outputFilePath = `uploads/converted_${timestamp}.jpg`;
    fs.writeFileSync(outputFilePath, jpgBuffer);

    return jpgBuffer;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to convert PDF to JPG');
  }
};
async function convertToPDF(imageFiles) {
  try {
    const pdfDoc = await PDFDocument.create();

    for (const imageFile of imageFiles) {
      const image = await pdfDoc.embedJpg(fs.readFileSync(imageFile.path));
      const page = pdfDoc.addPage([image.width, image.height]);
      const pageDrawWidth = page.getWidth();
      const pageDrawHeight = image.height * (pageDrawWidth / image.width);

      page.drawImage(image, {
        x: 0,
        y: page.getHeight() - pageDrawHeight,
        width: pageDrawWidth,
        height: pageDrawHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.log(error.message)
    throw new Error('Failed to convert JPG to PDF');
  }
};




// const fs = require('fs');
const { StandardFonts } = require('pdf-lib');

// class PDFService {
  async function  addPageNumbersToPDF(pdfBuffer) {
    try {
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Get the number of pages in the PDF document
      const pageCount = pdfDoc.getPageCount();

      // Set the font for the page numbers
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Add page numbers to each page of the document
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);

        const { width, height } = page.getSize();
        const fontSize = 12;
        const text = `Page ${i + 1} of ${pageCount}`;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const x = (width - textWidth) / 2;
        const y = 50;

        page.drawText(text, { x, y, size: fontSize, font });
      }

      // Save the modified PDF to a new buffer
      const modifiedPdfBuffer = await pdfDoc.save();

      return modifiedPdfBuffer;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to add page numbers to PDF');
    }
  }

 function  deleteFile(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(error);
    }
  }
// }

// module.exports = PDFService;




const PdfParse = require('pdf-parse');
async function convertToWord (pdfFile)  {
  try {
    const pdfData = await fs.promises.readFile(pdfFile.path);

    // Extract text from PDF using pdf-parse
    const PdfParser = new PdfParse(pdfData);
    PdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
    PdfParser.parseBuffer(pdfData);

    return PdfParser.getRawTextContent();
  } catch (error) {
    console.error(error.message);
    throw new Error('Failed to convert PDF to Word');
  }
};
const NodeWebcam = require('node-webcam');
async function generatePDF () {
  try {
    // Set up the webcam
    const Webcam = NodeWebcam.create();
    const captureOptions = {
      output: 'png',
      callbackReturn: 'buffer',
    };

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();

    // Capture images and add them to the PDF
    for (let i = 0; i < 5; i++) {
      const imageBuffer = await captureImage(Webcam, captureOptions);
      const image = await pdfDoc.embedPng(imageBuffer);
      page.drawImage(image, { x: 0, y: 0, width: 612, height: 792 });
      page.addNewLine();
    }

    // Save the PDF document to a buffer
    const pdfBytes = await pdfDoc.save();

    return pdfBytes;
  } catch (error) {
    // console.error(error);
    console.log(">>" ,  error)
    throw new Error('Failed to generate PDF');
  }
};
function captureImage(Webcam, options) {
  return new Promise((resolve, reject) => {
    Webcam.capture('', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    }, options);
  });
};

const {degrees} = require('pdf-lib');
async function rotatePdf(file, degres) {
  try {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(file.path);
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    // Rotate the pages in the PDF document
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      // page.setRotation(degrees);
      page.setRotation(degrees(degres));
      // page.setRotation((degrees) || 90));
    }

    // Save the rotated PDF to a new buffer
    const rotatedPdfBuffer = await pdfDoc.save();

    return rotatedPdfBuffer;
  } catch (error) {
    console.log(error.message)
    throw new Error('Failed to rotate PDF file');
  }
}


// const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');
const PDFParser = require('pdf-parse');
const fspromise = require('fs/promises');

const convertPdfToExcel = async (filePath) => {
  const pdfData = await fspromise.readFile(filePath);
  const pdfText = await PDFParser(pdfData);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('PDF Content');

  const content = pdfText.text;
  const pages = content.trim().split('\n\n');
  pages.forEach((pageContent, index) => {
    const sheetName = `Page ${index + 1}`;
    const sheet = workbook.addWorksheet(sheetName);
    // sheet.addDataValidation({
    //   type: 'list',
    //   showDropDown: true,
    //   formula1: `'${sheetName}'!$A$1:$Z$1`,
    // });

    const rows = pageContent.trim().split('\n');
    rows.forEach((row, rowIndex) => {
      const columns = row.split('\t');
      columns.forEach((cellValue, colIndex) => {
        const cell = sheet.getCell(rowIndex + 1, colIndex + 1);
        cell.value = cellValue;
      });
    });
  });

  const excelFilePath = 'output.xlsx';
  await workbook.xlsx.writeFile(excelFilePath);

  return excelFilePath;
};



module.exports = { 
  mergePDFs,
  splitPDF,
  // watermarkPDF,
  convertHTMLToPDF,
  // protectPDFWithPassword,
  // convertPDFToJPG,
  // convertToWord,
  generatePDF,
  convertToPDF,
  addPageNumbersToPDF,
  rotatePdf,
  convertPdfToExcel
};