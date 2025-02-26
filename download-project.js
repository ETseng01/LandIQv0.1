// Script to create a downloadable ZIP of the project
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'landiq-project.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log('Archive created successfully!');
  console.log('Total bytes: ' + archive.pointer());
  console.log('Download your project by right-clicking on landiq-project.zip in the file explorer and selecting "Download"');
});

// Handle warnings and errors
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files and directories to the archive
const filesToExclude = [
  'node_modules',
  '.git',
  'dist',
  'landiq-project.zip',
  'download-project.js'
];

// Add all files from the root directory
fs.readdirSync(__dirname).forEach(file => {
  if (!filesToExclude.includes(file)) {
    const filePath = path.join(__dirname, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      archive.directory(filePath, file);
    } else {
      archive.file(filePath, { name: file });
    }
  }
});

// Finalize the archive
archive.finalize();