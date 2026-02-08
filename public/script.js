const homeDiv = document.getElementById("home");
const uploadDiv = document.getElementById("upload");
const watchDiv = document.getElementById("watch");
const loadingDiv = document.getElementById("loading");
const videosDiv = document.getElementById("videos");
const uploadForm = document.getElementById("uploadForm");
const videoInput = document.getElementById("videoInput");
const searchInput = document.getElementById("searchInput");
const watchVideo = document.getElementById("watchVideo");
const watchTitle = document.getElementById("watchTitle");
const likeBtn = document.getElementById("likeBtn");
const backBtn = document.getElementById("backBtn");
const notification = document.getElementById("notification");

let videos = [];
let currentVideo = null;

async function fetchVideos() {
    const res = await fetch("/videos");
    videos = await res.json();
    loadVideos(searchInput.value);
}

function showPage(page){
    homeDiv.style.display='none';
    uploadDiv.style.display='none';
    watchDiv.style.display='none';
    loadingDiv.style.display='none';
    if(page==='home'){ homeDiv.style.display='block'; loadVideos(searchInput.value);}
    if(page==='upload'){ uploadDiv.style.display='block'; }
    if(page==='watch'){ watchDiv.style.display='block'; }
}

function loadVideos(filter=""){
    videosDiv.innerHTML="";
    const filtered = videos.filter(v => v.name.toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(video=>{
        const div = document.createElement("div");
        div.className="video-card";
        div.innerHTML = `
            <video src="/uploads/${video.filename}" muted></video>
            <p>${video.name}</p>
            <button onclick="likeVideoHome('${video.filename}', this)">👍 Like (${video.likes})</button>
        `;
        div.querySelector("video").addEventListener("click",()=>showWatch(video));
        div.querySelector("p").addEventListener("click",()=>showWatch(video));
        videosDiv.appendChild(div);
    });
}

function showWatch(video){
    currentVideo = video;
    watchVideo.src = `/uploads/${video.filename}`;
    watchTitle.textContent = video.name;
    likeBtn.textContent = `👍 Like (${video.likes})`;
    showPage('watch');
}

likeBtn.addEventListener("click", async ()=>{
    if(!currentVideo) return;
    const res = await fetch(`/like/${currentVideo.filename}`,{method:'POST'});
    const data = await res.json();
    currentVideo.likes = data.likes;
    likeBtn.textContent = `👍 Like (${data.likes})`;
    fetchVideos();
});

function likeVideoHome(filename, btn){
    fetch(`/like/${filename}`,{method:'POST'})
        .then(res=>res.json())
        .then(data=>{
            btn.textContent = `👍 Like (${data.likes})`;
            fetchVideos();
        });
}

uploadForm.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!videoInput.files[0]) return;
    loadingDiv.style.display='flex';
    const formData = new FormData();
    formData.append("video", videoInput.files[0]);
    const res = await fetch("/upload",{method:'POST', body: formData});
    const text = await res.text();
    showNotification(text);
    videoInput.value="";
    loadingDiv.style.display='none';
    fetchVideos();
    showPage('home');
});

searchInput.addEventListener("input",()=>loadVideos(searchInput.value));
backBtn.addEventListener("click",()=>showPage('home'));

function showNotification(msg){
    notification.textContent=msg;
    notification.style.display='block';
    setTimeout(()=>notification.style.display='none',3000);
}

fetchVideos();
showPage('home');
