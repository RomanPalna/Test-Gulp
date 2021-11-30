let preprocessor = "sass";

const { src, dest, parallel, series, watch } = require("gulp");
const browserSync = require("browser-sync").create();
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const sass = require("gulp-sass")(require("sass"));
const less = require("gulp-less");
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const imagecomp = require("compress-images");
const del = require("del");

function browsersync() {
  browserSync.init({
    server: { baseDir: "src/" },
    notify: false,
    online: true,
  });
}

function scripts() {
  return src(["src/js/*.js"])
    .pipe(concat("scripts.min.js"))
    .pipe(uglify())
    .pipe(dest("src/js/"))
    .pipe(browserSync.stream());
}

function styles() {
  return src("src/" + preprocessor + "/main." + preprocessor + "")
    .pipe(eval(preprocessor)())
    .pipe(concat("styles.min.css"))
    .pipe(
      autoprefixer({ overrideBrowserslist: ["last 2 versions"], grid: true })
    )
    .pipe(
      cleancss({
        level: { 1: { specialComments: 0 } } /* , format: 'beautify' */,
      })
    )
    .pipe(dest("src/css/"))
    .pipe(browserSync.stream());
}

async function images() {
  imagecomp(
    "src/images/src/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}",
    "dist/images/src/",
    { compress_force: false, statistic: true, autoupdate: true },
    false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
    { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    {
      gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
    },
    function (err, completed) {
      if (completed === true) {
        browserSync.reload();
      }
    }
  );
}

function startWatch() {
  watch(["src/**/*.js", "!src/**/*.min.js"], scripts);
  watch("src/**/" + preprocessor + "/**/*", styles);
  watch("src/*.html").on("change", browserSync.reload);
  watch("src/images/src/**/*", images);
}

function buildcopy() {
  return src(
    [
      "src/css/**/*.min.css",
      "src/js/**/*.min.js",
      "src/images/dest/**/*",
      "src/**/*.html",
    ],
    { base: "src" }
  ).pipe(dest("dist"));
}

function cleandist() {
  return del("dist/**/*", { force: true });
}

exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.cleandist = cleandist;

exports.default = parallel(styles, scripts, browsersync, startWatch);
exports.build = series(cleandist, styles, scripts, images, buildcopy);
