const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg'); // for MP4 to GIF conversion
const gifify = require('gifify'); // for creating GIF from frames
const { timeStamp } = require('console');

const app = express();
const port = 3004;
app.use(express.urlencoded({ extended: true }));

// Use Multer middleware for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads'); // Save uploaded files to the "uploads" directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Serve static files from the "uploads" directory
app.use('/uploads', express.static('uploads'));

// Serve the Pug interface
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
    const files = fs.readdirSync('uploads');
    const mp4Files = files.filter((file) => file.endsWith('.mp4'));
    const gifFiles = files.filter((file) => file.endsWith('.gif'));
    res.render('upload-download', { files, mp4Files, gifFiles });
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    res.redirect('/');
});

// Handle file download
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    res.download(path.join('uploads', filename));
});

// Convert MP4 to GIF
app.post('/convert', (req, res) => {
    const files = fs.readdirSync('uploads');
    const mp4Files = files.filter((file) => file.endsWith('.mp4'));
    const gifFiles = files.filter((file) => file.endsWith('.gif'));

    const mp4FileName = req.body.mp4FileName; // Name of the selected MP4 file

    // yyyy-mm-dd-hh-mm-ss.mp4
    var timeStampName = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    timeStampName = timeStampName.replace('T', '-');
    timeStampName = timeStampName.replace('Z', '');
    timeStampName = timeStampName + '.mp4';
    if (mp4Files.includes(mp4FileName)) {
        const gifFileName = timeStampName.replace('.mp4', '.gif'); // Create a GIF file name
        const quality = 'high'; // low, medium, or high

        // Path to the uploaded MP4 file and the target GIF file
        const mp4Path = path.join('uploads', mp4FileName);
        const gifPath = path.join('uploads', gifFileName);

        // Perform MP4 to GIF conversion here (as shown in the previous response)
        // Create a new FFmpeg command
        const command = ffmpeg(mp4Path);

        // Set video codec options and output format
        command.videoCodec('gif')
            .size('1920x1080') // Assuming 16:9 ratio for GIF 1920×1080
            .videoBitrate(quality === 'low' ? '500k' : quality === 'medium' ? '1000k' : '2000k')
            .inputFPS(20)
            .toFormat('gif')
            .on('start', (commandLine) => {
                console.log('Started:', commandLine);
            })
            .on('end', () => {
                console.log('Conversion finished');
            })
            .on('error', (err) => {
                console.error('Error:', err);
            })
            .save(gifPath);

        // After the conversion is complete, update the gifFiles array
        // timeout is used to wait for the conversion to finish
        setTimeout(() => {
            res.redirect('/');
        }, 5000);
    } else {
        // Handle the case where the selected MP4 file doesn't exist in mp4Files
        res.redirect('/');
    }
});

// Define a route to remove a file
app.post('/remove/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'uploads', fileName); // Adjust the path as needed

    // Check if the file exists
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file

        res.redirect('/');
    } else {
        res.redirect('/');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
