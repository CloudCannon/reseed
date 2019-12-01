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
    },

    watch: function(dest, baseurl, port){
        console.log("watching files on " + dest);
        fs.watch(dest, { recursive: true }, (eventType, filename) => {
            console.log(filename + " has been modified (" + eventType + "). Reloading...");
            
            setTimeout(browserSync.reload, 1000);
        })
    }
}