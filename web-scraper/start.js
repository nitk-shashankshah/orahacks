// start.js
const { spawn } = require("child_process");

// Adjust the header size value as needed. In this example, it's set to 65536 (64 KB).
const args = ["--max-http-header-size=65536", "index.js"];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code);
});
