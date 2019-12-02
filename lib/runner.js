const fs = require("fs-extra");
const path = require("path");
const util = require("util");
const del = require("del");
const browserSync = require("browser-sync").create();

const cssRewrite = require("./processors/css").plugin;
const htmlRewrite = require("./processors/html").plugin;


const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdirs);
const copy = util.promisify(fs.copy);

options = {

}

module.exports = {

    setOptions: function( opt ) {
        options = opt;
    },

    /**
     * Recursively and asynchronously moves through a directory and 
     * returns the list of files in that directory.
     * @param {string} dir The current file directory
     */
    fetchFiles: async function(dir){
        
        let fileArray = []

        try{
            let files = await readdir(dir);

            for (let file of files){
                file = path.resolve(dir, file);
                let stats = await stat(file);

                // If the file is a symbolic link, ignoreit
                if( stats.isSymbolicLink() ) {
                    return;
                }
                if (stats && stats.isDirectory()){
                    const res = await this.fetchFiles(file);
                        if (res === undefined){
                            fileArray = fileArray.concat(file);
                        } else {
                            fileArray = fileArray.concat(res);
                        }
                } else {
                    fileArray.push(file);              
                }
            }
            return fileArray;
        } catch (err){
            throw (err);
        }
    },

    /**
     * Asynchronously copy the files in fileList from source to destination.
     * Currently throws error if directories already exist
     * 
     * @param {string} source The source directory.
     * @param {string} destination The final destination folder. cwd/destination/baseurl/
     * @param {string[]} fileList The list of files contained in the source.
     */
    copyFiles: async function(source, destination, fileList){

        let filetypes = {
            css: [],
            html: [],
            other: []
        }
        const htmlReg = /\.html?$/
        const cssReg = /\.s?css$/
        
        const cwd = process.cwd();
        try{
            await mkdir(destination, { recursive: true }); //create the directory cwd/destination
        
            for ( let file of fileList ) {
                if (!file) return null;
                let stub = file.replace(source, ""); // the path of the file, relative to the source.

                // the new path of the file. Using .format should prevent windows issues (\\ vs /)
                let newpath = path.format({
                    dir: destination,
                    base: stub
                })

                var dirname = path.dirname(newpath);
                if (cssReg.test(newpath)) {
                    filetypes.css.push(newpath);
                } else if (htmlReg.test(newpath)) {
                    filetypes.html.push(newpath);
                } else {
                    filetypes.other.push(newpath)
                }

                await mkdir(dirname, { recursive: true });
                await copy(file, newpath, { overwrite: true });               
            }
            return filetypes;
        } catch (err) {
            throw (err);
        }
    },

    /**
     * Builds all the files.
     * 
     */
    build: async function () {
        console.log("fetching...")
        let pathToSource = path.resolve(options.cwd, options.dist.src);
        let pathToDest = path.resolve(options.cwd, options.dist.dest, options.dist.baseurl);

        let sourceFiles = await this.fetchFiles(pathToSource);

        console.log("copying...");
        let files = await this.copyFiles(pathToSource, pathToDest, sourceFiles);
        console.log(files)

        console.log("rewriting files...")

        for (let file of files.css){
            cssRewrite(file, pathToDest, { "baseurl": options.dist.baseurl });
        }
        for (let file of files.html) {
            htmlRewrite(file, pathToDest, { "baseurl": options.dist.baseurl });
        }
    },

    clean: function( ) {
        return del(options.dist.dest);
    },

    /**
     * Default.
     * Builds, serves, and watches.
     */
    dist: async function ( ) {
        await this.build();
        this.serve();
        this.watch();
    },

    serve: function() {
        browserSync.init({
            startPath: options.dist.baseurl,
            server: {
                baseDir: path.join(options.cwd, options.dist.dest)
            },
            port: options.serve.port
        });
    },

    watch: function() {
        console.log("watching files on " + options.dist.dest);
        fs.watch(options.dist.dest, { recursive: true }, (eventType, filename) => {
            console.log(filename + " has been modified (" + eventType + "). Reloading...");
            
            setTimeout(browserSync.reload, 1000);
        })
    } 
}