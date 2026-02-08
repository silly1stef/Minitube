const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Ensure uploads folder exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// Path to videos.json
const VIDEOS_FILE = "./videos.json";

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
app.use(fileUpload());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // serve uploaded videos
app.use(express.static("public")); // serve HTML/JS/CSS

// Get all videos
app.get("/videos", (req, res) => {
    try {
        const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE));
        res.json(videos);
    } catch (err) {
        res.json([]);
    }
});

// Upload video
app.post("/upload", (req, res) => {
    if (!req.files || !req.files.video) return res.status(400).send("No video uploaded.");
    const video = req.files.video;
    const filename = `${Date.now()}_${video.name}`;
    const filepath = path.join(__dirname, "uploads", filename);

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
