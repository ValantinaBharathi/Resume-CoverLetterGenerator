const express = require('express');
const multer = require('multer');
const path = require('path');
const pdfkit = require('pdfkit');
const fs = require('fs');
const resumake = require('resumake');
const app = express();
const port = 3000;

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Serve the index.html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to upload resume and generate cover letter
app.post('/generate-cover-letter', upload.single('resume'), (req, res) => {
  const resumePath = req.file.path;

  // Extract information from the resume using resumake
  const resumeData = resumake.parse(resumePath);

  // Generate the cover letter text
  const coverLetterText = `
  Dear ${resumeData.name},

  I am writing to express my interest in the position you are hiring for. As a ${resumeData.job_title}, I am confident that my skills in ${resumeData.skills} will allow me to contribute positively to your team.

  Please find my resume attached for your review.

  Sincerely,
  ${resumeData.name}
  `;

  // Return the generated cover letter
  res.json({ coverLetter: coverLetterText });
});

// API to download the cover letter as a PDF
app.get('/download-pdf', (req, res) => {
  const doc = new pdfkit();
  const fileName = 'cover-letter.pdf';
  const writeStream = fs.createWriteStream(fileName);

  doc.pipe(writeStream);
  doc.text('Your Cover Letter Here...');
  doc.end();

  writeStream.on('finish', () => {
    res.download(fileName, 'cover-letter.pdf', (err) => {
      if (err) {
        console.log(err);
      }
      fs.unlinkSync(fileName); // Delete the PDF after download
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
