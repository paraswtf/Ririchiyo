const directory = require('fs').readdirSync(".", { withFileTypes: true }) //This may be a file or a folder
const folderNames = []
for (const file of directory) if (file.isDirectory() && /ririchiyo-\w+-build-\d+/.test(file.name)) folderNames.push(file.name);
const folder = folderNames.filter(n => n && !Number.isNaN(n.split("-")[3])).sort((a, b) => parseInt(b.split("-")[3]) - parseInt(a.split("-")[3]))[0];
const splitName = folder.split("-");

const app = {
    name: `Ririchiyo #${splitName[3]}`,
    script: `${folder}/src/main/index.js`,
    watch: false,
    error_file: `${folder}/logs/err.log`,
    out_file: `${folder}/logs/out.log`,
    log_file: `${folder}/logs/logs.log`,
    interpreter: "node",
    log_date_format: "DD-MM-YYYY hh:mma Z",
    exec_interpreter: "node",
    exec_mode: "fork",
    env: {
        NODE_ENV: "development",
        DISCORD_TOKEN: "",
        MONGODB_URI: "",
        YOUTUBE_API_KEY: "",
        SPOTIFY_CLIENT_ID: "",
        SPOTIFY_CLIENT_SECRET: "",
        KSOFT_API_TOKEN: "",
        IPC_SOCKET: "",
        LAVALINK_NODES: []
    }
}

module.exports = { apps: [app] };
