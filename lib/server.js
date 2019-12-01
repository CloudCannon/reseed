const browserSync = require("browser-sync").create();
const path = require("path");
const fs = require("fs-extra");

module.exports = {
    serve: function(dest, baseurl, port){
        browserSync.init({
            startPath: baseurl,
            server: {
                baseDir: path.join(process.cwd(), dest)
            },
            port: port
        });
    }
}