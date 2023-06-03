/* eslint key-spacing:0 spaced-comment:0 */
const path = require("path");
const debug = require("debug")("app:config:project");
const argv = require("yargs").argv;
const ip = require("ip");

debug("Creating default configuration.");
// ========================================================
// Default Configuration
// ========================================================
const config = {
  env: process.env.NODE_ENV || "development",

  // ----------------------------------
  // Project Structure
  // ----------------------------------
  path_base: path.resolve(__dirname, ".."),
  dir_client: "src",
  dir_dist: "dist",
  dir_public: "public",
  dir_server: "server",
  dir_test: "tests",

  // ----------------------------------
  // Server Configuration
  // ----------------------------------
  server_host: "localhost", // ip.address(), // use string 'localhost' to prevent exposure on local network
  server_port: process.env.PORT || 8000,

  // ----------------------------------
  // API Server Configuration
  // ----------------------------------
  api_server_host: `http://localhost:3000/`, // use string 'localhost' to prevent exposure on local network
  s3_server_host: "http://staging.es6console.com/",

  // ----------------------------------
  // AWS Configuration
  // ----------------------------------
  bucket_name: "staging.es6console.com",
  snippet_bucket_url:
    "https://s3-eu-west-1.amazonaws.com/es6console-prod-snippets/",

  // ----------------------------------
  // Compiler Configuration
  // ----------------------------------
  compiler_babel: {
    cacheDirectory: true,
    plugins: ["transform-runtime"],
    presets: ["es2015", "react", "stage-0"],
  },
  compiler_devtool: "source-map",
  compiler_hash_type: "hash",
  compiler_fail_on_warning: false,
  compiler_quiet: false,
  compiler_public_path: "/",
  compiler_stats: {
    chunks: false,
    chunkModules: false,
    colors: true,
  },
  compiler_vendors: ["react", "react-redux", "react-router", "redux"],

  // ----------------------------------
  // Test Configuration
  // ----------------------------------
  coverage_reporters: [
    { type: "text-summary" },
    { type: "lcov", dir: "coverage" },
  ],
};

/************************************************
-------------------------------------------------

All Internal Configuration Below
Edit at Your Own Risk

-------------------------------------------------
************************************************/

// ------------------------------------
// Validate Vendor Dependencies
// ------------------------------------
const pkg = require("../package.json");

config.compiler_vendors = config.compiler_vendors.filter((dep) => {
  if (pkg.dependencies[dep]) return true;

  debug(
    `Package "${dep}" was not found as an npm dependency in package.json; ` +
      `it won't be included in the webpack vendor bundle.
       Consider removing it from \`compiler_vendors\` in ~/config/index.js`
  );
});

// ------------------------------------
// Utilities
// ------------------------------------
function base() {
  const args = [config.path_base].concat([].slice.call(arguments));
  return path.resolve.apply(path, args);
}

config.paths = {
  base: base,
  client: base.bind(null, config.dir_client),
  public: base.bind(null, config.dir_public),
  dist: base.bind(null, config.dir_dist),
};

// ========================================================
// Environment Configuration
// ========================================================
debug(`Looking for environment overrides for NODE_ENV "${config.env}".`);
const environments = require("./environments.config");
let overrides = environments[config.env];

if (config.env === "dev") {
  debug("Found serverless environment dev which translates to staging AWS env");
  overrides = environments["staging"];
}

if (overrides) {
  debug("Found overrides, applying to default configuration.");
  Object.assign(config, overrides(config));
} else {
  debug("No environment overrides found, defaults will be used.");
}

// ------------------------------------
// Environment
// ------------------------------------
// N.B.: globals added here must _also_ be added to .eslintrc
config.globals = {
  "process.env": {
    NODE_ENV: JSON.stringify(config.env),
  },
  NODE_ENV: config.env,
  __DEV__: config.env === "development",
  __PROD__: config.env === "production",
  __TEST__: config.env === "test",
  __COVERAGE__: !argv.watch && config.env === "test",
  __BASENAME__: JSON.stringify(process.env.BASENAME || ""),
  API_SERVER_HOST: JSON.stringify(config.api_server_host),
  S3_SERVER_HOST: JSON.stringify(config.s3_server_host),
  SNIPPET_BUCKET_URL: JSON.stringify(config.snippet_bucket_url),
};

module.exports = config;
