const express = require('express')
const path = require('path')
const fs = reqire('fs')
const { execFile } = require('child_process')
const { getJson } =  require("serpapi")
const { error } = require('console')

const app = express()
const PORT = 3000
const API_KEY = dbd00d4ee085bcca3b9450351ba6cf84e7981715ac2b5ed133f9c1b6a597dc72

const DOWNLOAD_DIRS = path.join(__dirname, "downloads")

if(!fs.existsSync(DOWNLOAD_DIRS)) {
    fs.mkdirSync(DOWNLOAD_DIRS)
}

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))
app.use("/downloads", express.static(DOWNLOAD_DIRS))

app.get("/api/search", (req, res) => {
    const { q, count = 5} = req.query

    if (!q) {
        return res.status(400).json({ error: "Query parameter 'q' is required"})
    }

    getJson({
        engine: "google_short_videos",
        q,
        api_key: API_KEY
    }, (json) => {
        const videos = (json.short_video_results || []).slice(0, parseInt(count))
        res.json({ videos })
    })

})

    
app.listen(PORT, () => {
    console.log(`server is running on http://localhost:${PORT}`)
})