const fs = require("fs-extra");
const path = require("path");
const util = require("util");
const del = require("del");
const browserSync = require("browser-sync").create();
const chokidar = require("chokidar");
const log = require("fancy-log");

const cssRewrite = require("./processors/css").plugin;
const htmlRewrite = require("./processors/html").plugin;


const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdirs);
const copy = util.promisify(fs.copy);

/*
    TODO
    Refactor for testability
*/

const regex = {
    css: /\.s?css$/,
    html: /\.html?$/,
    any: /(:?)/
}

module.exports = {


    /**
     * Recursively and asynchronously moves through a directory and 
     * returns the list of files in that directory.
     * @param {string} dir The current file directory.
     * @param {string} type The type of files to look for.
     * Options: "any":      returns all files in dir.
     * 
     *          "css":      returns only .css and .scss files.
     * 
     *          "html":     returns only .html and .htm files.
     * 
     *          "assets":   returns all files that "css" and "html" does not return.
     * 
     * @return {string[]} The list of files from dir.
     */
    fetchFiles: async function(dir, type = "any"){
        
        let fileArray = []
        let reg;
        if (type === "css") reg = regex.css;
        else if (type === "html") reg = regex.html;
        else if (type === "assets") reg = null;
        else reg = regex.any;

        try{
            let files = await readdir(dir);

            for (let file of files){
                file = path.resolve(dir, file);
                let stats = await stat(file);

                if( stats.isSymbolicLink() ) {
                    return;
                }
                if (stats && stats.isDirectory()){
                    const res = await this.fetchFiles(file, type);
                    fileArray = fileArray.concat(res);
                } else {
                    fileArray.push(file);              
                }
            }

            if (type === "assets"){
                return fileArray.filter(file => {
                    return ! (regex.css.test(file) || regex.html.test(file));
                })
            }

            return fileArray.filter(file => {
                return reg.test(file);
            });

        } catch (err){
            throw (err);
        }
    },


    /**
     * Asynchronously copy the files in fileList from source to destination.
     * 
     * @param {string[]} fileList The list of files contained in the source.
     * @return {Object} The files that were copied.
     * 
     * {
     *  css: An array of the CSS files in dest.
     * 
     *  html: An array of the HTML files in dest.
     * 
     *  other: An array of all other files in dest.
     * }
     */
    copyFiles: async function(fileList, options){
        source = options.dist.fullPathToSource;
        destination = options.dist.fullPathToDest

        let filetypes = {
            css: [],
            html: [],
            other: []
        }
        
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
                if (regex.css.test(newpath)) {
                    filetypes.css.push(newpath);
                } else if (regex.html.test(newpath)) {
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
     * Running this function chains the following:
     * 
     * clean() -> fetchFiles() -> copyFiles() -> rewriteCSS() -> rewriteHTML()
     * 
     */
    build: async function ( options ) {
        
        await this.clean( options );

        log("fetching...")
        
        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource);

        log("copying...");
        let files = await this.copyFiles(sourceFiles, options);

        log("rewriting files...")

        for (let file of files.css){
            cssRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
        for (let file of files.html) {
            htmlRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
    },

    /**
     * Deletes dest and all files contained in dest.
     */
    clean: function( options ) {
        log("Cleaning " + options.dist.dest)
        return del(options.dist.dest);
    },

    /**
     * Copies all non html and css files from src to dest.
     */
    clone_assets: async function ( options ) {
        log("fetching...")

        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource, "assets");
        let files = await this.copyFiles(sourceFiles, options);     
    },

    /**
     * Default.
     * Builds, serves, and watches.
     */
    dist: async function ( options ) {
        await this.build( options );
        this.serve( options );
        this.watch( options );
    },

    /**
     * Rewrites the urls and hrefs in CSS files to include baseurl.
     */
    rewrite_css: async function( options ){
        log("fetching...")

        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource, "css");
        let files = await this.copyFiles(sourceFiles, options); 
        for (let file of files.css){
            cssRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
    },

    /**
     * Rewrites urls and hrefs in HTML files to include baseurl.
     */
    rewrite_html: async function( options ){
        log("fetching...")

        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource, "html");
        let files = await this.copyFiles(sourceFiles); 
        for (let file of files.html){
            htmlRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
    },

    /**
     * Runs a local webserver on the chosen port.
     */
    serve: function( options ) {
        browserSync.init({
            startPath: options.dist.baseurl,
            server: {
                baseDir: path.join(options.cwd, options.dist.dest)
            },
            port: options.serve.port
        });
    },

    /**
     * Watches the files in dest for any changes, and triggers a new build on change.
     */
    watch: function( options ) {
        log("watching files on " + options.dist.dest);

        chokidar.watch(options.dist.dest).on("all", (event, path) => {
            log(path + " has been modified (" + event + "). Reloading...");
            setTimeout(browserSync.reload, 1000);
        })
    } 
}