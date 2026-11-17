
const fs = require("node:fs");
const path = require("node:path");

// Read the SVG as text. require() would execute it as JavaScript.
// const notFoundImage = require("../../public/404.svg");
const notFoundImage = fs.readFileSync(
  path.join(__dirname, "..", "..", "public", "404.svg"),
  "utf8"
);

const notFound = (_req, res) => {
  return res.status(404).json({ message: "Route not found.", image: notFoundImage });
};

module.exports = { notFound };


