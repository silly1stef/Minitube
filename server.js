const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000; // dynamic port for hosting

// Folders and files
const UPLOADS_DIR = path.join(__dirname, "uploads");
const VIDEOS_FILE = path.join(__dirname, "videos.json");

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Ensure videos.json exists and is valid
try {
    if (!fs.existsSync(VIDEOS_FILE)) fs.writeFileSync(VIDEOS_FILE, "[]");
    else {
        const data = fs.readFileSync(VIDEOS_FILE, "utf8");
        if (!data || data.trim() === "") fs.writeFileSync(VIDEOS_FILE, "[]");
        else JSON.parse(data); // throws if invalid
    }
} catch (err) {
    console.log("videos.json corrupted. Resetting to []");
    fs.writeFileSync(VIDEOS_FILE, "[]");
}

// Middleware
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
    abortOnLimit: true,
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static("public"));

// Get videos
app.get("/videos", (req, res) => {
    try {
        const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE));
        // Only return videos whose files still exist
        const validVideos = videos.filter(v => fs.existsSync(path.join(UPLOADS_DIR, v.filename)));
        res.json(validVideos);
    } catch (err) {
        res.json([]);
    }
});

// Upload video
app.post("/upload", (req, res) => {
    if (!req.files || !req.files.video) return res.status(400).send("No video uploaded.");
    const video = req.files.video;
    const filename = `${Date.now()}_${video.name}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    video.mv(filepath, (err) => {
        if (err) return res.status(500).send("Error saving video: " + err);
        try {
            const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE));
            videos.push({ name: video.name, filename, likes: 0 });
            fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos));
            res.send(`Video "${video.name}" uploaded successfully!`);
        } catch (err) {
            res.status(500).send("Error updating videos.json: " + err);
        }
    });
});

// Like a video
app.post("/like/:filename", (req, res) => {
    try {
        const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE));
        const video = videos.find(v => v.filename === req.params.filename);
        if (!video) return res.status(404).send("Video not found");
        video.likes++;
        fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos));
        res.json({ likes: video.likes });
    } catch (err) {
        res.status(500).send("Error updating likes: " + err);
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
