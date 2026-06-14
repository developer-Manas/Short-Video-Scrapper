let currentVideos = [];

// ===================== DOM Elements =====================

const queryInput = document.getElementById("query");
const countSelect = document.getElementById("count");
const searchBtn = document.getElementById("searchBtn");
const downloadAllBtn = document.getElementById("download");
const resultsGrid = document.getElementById("results");
const statusEl = document.getElementById("status");

// ===================== Status Helper =====================

function setStatus(message) {
    statusEl.textContent = message;
}

// ===================== Search =====================

async function search() {
    const q = queryInput.value.trim();
    const count = countSelect.value;

    if (!q) {
        setStatus("Please enter a search term.");
        return;
    }

    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";

    resultsGrid.innerHTML = "";
    downloadAllBtn.style.display = "none";

    setStatus("Searching videos...");

    try {
        const response = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&count=${count}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch videos");
        }

        const data = await response.json();

        currentVideos = data.videos || [];

        if (currentVideos.length === 0) {
            setStatus("No videos found.");
            return;
        }

        renderVideos();

        downloadAllBtn.style.display = "block";

        setStatus(
            `Found ${currentVideos.length} video(s)`
        );

    } catch (err) {
        console.error(err);
        setStatus(`Error: ${err.message}`);
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

// ===================== Render Videos =====================

function renderVideos() {
    resultsGrid.innerHTML = currentVideos
        .map(
            (video, index) => `
        <div class="card" id="card-${index}">
            <img
                src="${video.thumbnail || ""}"
                alt="${video.title || "Video"}"
                loading="lazy"
                onerror="this.style.background='#333'; this.removeAttribute('src');"
            />

            <div class="card-body">
                <h3>${escapeHTML(video.title || "Untitled")}</h3>

                <p class="source">
                    ${video.source || "Unknown Source"}
                    ${video.duration ? ` • ${video.duration}` : ""}
                </p>

                <button
                    id="btn-${index}"
                    onclick="downloadOne(${index})"
                >
                    Download
                </button>
            </div>
        </div>
    `
        )
        .join("");
}

// ===================== Download Single Video =====================

async function downloadOne(index) {
    const video = currentVideos[index];

    if (!video?.link) {
        console.error("Invalid video URL");
        return;
    }

    const btn = document.getElementById(`btn-${index}`);

    if (btn.classList.contains("done")) return;

    btn.disabled = true;
    btn.textContent = "Downloading...";

    try {
        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: video.link,
                title: video.title
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Download failed");
        }

        btn.textContent = "✓ Downloaded";
        btn.classList.remove("error");
        btn.classList.add("done");

    } catch (err) {
        console.error(err);

        btn.textContent = "✗ Failed";
        btn.classList.remove("done");
        btn.classList.add("error");
    }
}

// ===================== Download All =====================

async function downloadAll() {
    if (!currentVideos.length) return;

    setStatus("Downloading all videos...");

    const chunkSize = 3;

    for (let i = 0; i < currentVideos.length; i += chunkSize) {
        const chunk = [];

        for (
            let j = i;
            j < Math.min(i + chunkSize, currentVideos.length);
            j++
        ) {
            chunk.push(downloadOne(j));
        }

        await Promise.allSettled(chunk);

        setStatus(
            `Downloaded ${Math.min(
                i + chunkSize,
                currentVideos.length
            )} of ${currentVideos.length}`
        );
    }

    setStatus("All downloads completed!");
}

// ===================== XSS Protection =====================

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ===================== Event Listeners =====================

searchBtn.addEventListener("click", search);

downloadAllBtn.addEventListener("click", downloadAll);

queryInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        search();
    }
});

// ===================== Initial State =====================

setStatus("Ready. Search for videos.");