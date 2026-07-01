"use strict";

const fs = require("fs");
const http = require("http");
const https = require("https");

const rapidapi_key = process.env.RAPIDAPI_KEY;
const rapidapi_host = process.env.RAPIDAPI_HOST;
const port = process.env.PORT || 3000;

// API 2 (Highlightly) abbreviation -> API 1 (NBA Stats) abbreviation
// Only for some codes due to mismatched abbreviations
const team_map = {
    "NY": "NYK",     // Knicks
    "GS": "GSW",     // Warriors
    "NO": "NOP",     // Pelicans
    "SA": "SAS",     // Spurs
    "WSH": "WAS",    // Wizards
    "UTAH": "UTA"    // Jazz
};

const server = http.createServer();
server.on("listening", listen_handler);
server.listen(port);
function listen_handler() {
    console.log(`Now Listening on Port ${port}`);
}
server.on("request", request_handler);
function request_handler(req, res) {
    console.log(`New Request from ${req.socket.remoteAddress} for ${req.url}`);

    // Home page -> serve HTML
    if (req.url === "/") {
        const form = fs.createReadStream("index.html");
        res.writeHead(200, {"Content-Type": "text/html"});
        form.pipe(res);
    }
    // Serve background image
    else if (req.url === "/2k26logo.jpg") {
        const img = fs.createReadStream("2k26logo.jpg");
        res.writeHead(200, {"Content-Type": "image/jpeg"});
        img.pipe(res);
    }
    // Search route
    else if (req.url.startsWith("/search")) {
        const queryIndex = req.url.indexOf("?");
        const queryString =
            queryIndex !== -1
            ? req.url.slice(queryIndex + 1)
            : "";
        const user_input = new URLSearchParams(queryString);
        // missing team -> 404
        if (!user_input.has("team")) {
            return not_found(res);
        }
        const city = user_input.get("team").toLowerCase();
        // start API chain
        get_team_info(city, res);
    }
    else {
        not_found(res);
    }
}

// API 2 first: find team info
function get_team_info(city, res) {
    console.log(`Searching Highlightly for team: ${city}`);
    const options = {
        method: "GET",
        hostname: rapidapi_host,
        path: `/teams?name=${encodeURIComponent(city)}`,
        headers: {
            "x-rapidapi-key": rapidapi_key,
            "x-rapidapi-host": rapidapi_host
        }
    };
    https.request(options, function(team_stream) {
        process_stream(team_stream, receive_team_info, city, res);
    }).on("error", function(err) {
        console.log(err);
        res.writeHead(500, {"Content-Type": "text/html"});
        res.end("<h1>API 2 Error</h1>");
    }).end();
}

// receive API 2 response
function receive_team_info(body, city, res) {
    console.log("Got team info from Highlightly!");
    const teams = JSON.parse(body);
    if (!Array.isArray(teams) || teams.length === 0) {
        res.writeHead(404, {"Content-Type": "text/html"});
        res.end("<h1>No team found. Try Knicks, Lakers, Celtics, Heat.</h1>");
        return;
    }
    let team_info = teams.find(t => t.league === "NBA") || teams[0];
    const highlightly_abbr = team_info.abbreviation;
    const nba_abbr = team_map[highlightly_abbr] || highlightly_abbr;
    console.log(`Mapped ${highlightly_abbr} -> ${nba_abbr}`);
    get_stats(nba_abbr, team_info, city, res);
}

// API 1: get stats
function get_stats(team, team_info, city, res) {
    console.log(`Calling NBA Stats API for ${team}`);
    const stats_endpoint = `https://api.server.nbaapi.com/api/playertotals?season=2026&team=${team}`;
    https.get(stats_endpoint, function(stats_stream) {
        process_stream(stats_stream, receive_stats, team_info, city, res);
    }).on("error", function(err) {
        console.log(err);
        res.writeHead(500, {"Content-Type": "text/html"});
        res.end("<h1>API 1 Error</h1>");
    });
}

// receive API 1 response
function receive_stats(body, team_info, city, res) {
    console.log("Got stats back!");
    const stats = JSON.parse(body);
    get_highlights(team_info, stats, city, res);
}

// API 2 third call: highlights
function get_highlights(team_info, stats, city, res) {
    const team_name = team_info.name;
    console.log(`Calling Highlightly Video API for: ${team_name}`);
    const options = {
        method: "GET",
        hostname: rapidapi_host,
        path: `/highlights?homeTeamName=${encodeURIComponent(team_name)}`,
        headers: {
            "x-rapidapi-key": rapidapi_key,
            "x-rapidapi-host": rapidapi_host
        }
    };
    https.request(options, function(highlights_stream) {
        process_stream(highlights_stream, receive_highlights, team_info, stats, city, res);
    }).on("error", function(err) {
        console.log(err);
        res.writeHead(500, {"Content-Type": "text/html"});
        res.end("<h1>Highlights API Error</h1>");
    }).end();
}

// final response
function receive_highlights(body, team_info, stats, city, res) {
    console.log("Building final response...");
    const highlights_payload = JSON.parse(body);
    const combined = {
        team: team_info,
        stats: stats,
        highlights: highlights_payload.data || highlights_payload
    };
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(combined));
}

// stream helper
function process_stream(stream, callback, ...args) {
    let body = "";
    stream.on("data", function(chunk) { body += chunk; });
    stream.on("end", function() { callback(body, ...args); });
}

// 404 handler
function not_found(res) {
    res.writeHead(404, {"Content-Type": "text/html"});
    res.end("<h1>404 Not Found</h1>");
}