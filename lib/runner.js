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
        
        //let fileArray = [];
        let filesByType = {
        };

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
                    if (res.css){
                        if (!filesByType.css) filesByType.css = [];
                        filesByType.css = filesByType.css.concat(res.css);
                    } 
                    if (res.html) {
                        if (!filesByType.html) filesByType.html = [];
                        filesByType.html = filesByType.html.concat(res.html);
                    }
                    if (res.other) {
                        if (!filesByType.other) filesByType.other = [];
                        filesByType.other = filesByType.other.concat(res.other);
                    } 
                } else {
                    let ext = path.extname(file);

                    if(regex.css.test(ext)){
                        if (!filesByType.css) filesByType.css = [];
                        filesByType.css.push(file);
                    } else if (regex.html.test(ext)) {
                        if (!filesByType.html) filesByType.html = [];
                        filesByType.html.push(file);
                    } else {
                        if (!filesByType.other) filesByType.other = [];
                        filesByType.other.push(file);
                    }
                    //fileArray.push(file);              
                }
            }
            return filesByType;

            /*
            if (type === "assets"){
                return fileArray.filter(file => {
                    return ! (regex.css.test(file) || regex.html.test(file));
                })
            }
            

            return fileArray.filter(file => {
                return reg.test(file);
            });
            */

        } catch (err){
            return undefined;
        }
    },

    /**
     * Asynchronously copy the files in fileList from source to destination.
     * 
     * @param {string[]} fileList The list of files contained in the source.
    */
   copyFiles: async function(fileList, options){

    if (!fileList){
        log("no files to copy");
        return;
    }

    source = options.dist.fullPathToSource;
    destination = options.dist.fullPathToDest

    let copiedFiles = [];
    
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
            await mkdir(dirname, { recursive: true });
            await copy(file, newpath, { overwrite: true }); 
            copiedFiles.push(newpath);  
                        
        }
        return copiedFiles;

    } catch (err) {
        log("error");
        return undefined;
    }
},


    

    /**
     * Cleans the files in dest, fetches the files in src.
     * Rewrite-css is called on the css files, rewrite-html is called on html files, and
     * clone-assets is called on all other files.
     * 
     * @param {Object} options The options object.
     */
    build: async function ( options ) {
        
        await this.clean( options );

        log("fetching...")     
        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource);

        let otherFiles = await this.clone_assets(options, sourceFiles.other);
        let cssFiles = await this.rewrite_css(options, sourceFiles.css)
        let htmlFiles = await this.rewrite_html(options, sourceFiles.html)
    },

    /**
     * Deletes dest and all files contained in dest.
     * TODO Ask user for confirmation before deleting.
     * @param {Object} options The options object.
     */
    clean: function( options ) {
        log("Cleaning " + options.dist.dest)
        return del(options.dist.dest);
    },

    

    /**
     * Copies all non css and html files from src to dest.
     * If files is truthy (i.e has more than one file listed), then will run copyFiles on the
     * list of files specified. Will copy the files from source to destination/baseurl without
     * altering the data in any way.
     * If files = null, then fetchfiles will be run to retrieve the files specified in src.
     * This allows the function to be run from the command line, without passing in a list of files.
     * @param {Object} options The options object.
     * @param {[String]} files The list of files to copy (default = null).
     * 
     * @returns {[String]} The copied files.
     */
    clone_assets: async function ( options, files = null ) {

        if(!files){
            log("fetching " + options.dist.fullPathToSource + "...");
            let fetchedFiles = await this.fetchFiles(options.dist.fullPathToSource, "assets");
            files = fetchedFiles.other;
        }
        log("copying...")

        let otherFiles = await this.copyFiles( files, options);

        return otherFiles;
    },

    /**
     * Default command (runs when no command is specified).
     * Builds, serves, and watches.
     * 
     * @param {Object} options The options object.
     * @returns {number} The exit code.
     */
    dist: async function ( options ) {
        await this.build( options );
        this.serve( options );
        this.watch( options );
        return 0;
    },

    /**
     * Rewrites the urls and hrefs in CSS files to include baseurl.
     * If files is truthy, then takes the files in files, copies them into dest/baseurl
     * using copyFiles, and rewrites the contents so that urls and hrefs referencing local
     * content have baseurl prepended to them.
     * If files is null, then fetch-files is called first to obtain only the css files in src.
     * 
     * @param {Object} options the options object.
     * @param {[String]} files the list of files to rewrite (default = null).
     * @returns {[String]} The copied files (TODO)
     */
    rewrite_css: async function( options, files = null ){

        if (!files){
            log("fetching...");
            let fetchedFiles = await this.fetchFiles(options.dist.fullPathToSource, "css");
            files = fetchedFiles.css;
        }
        let copiedFiles = await this.copyFiles(files, options);

        log("rewriting css...")
        for (let file of copiedFiles){
            cssRewrite(file, options.dist.fullPathToDest, options.dist.baseurl);
        }
        return [];

    },

    /**
     * Rewrites urls and hrefs in HTML files to include baseurl.
     * If files is truthy, then takes the files in files, copies them into dest/baseurl
     * using copyFiles, and rewrites the contents so that urls and hrefs referencing local
     * content have baseurl prepended to them.
     * If files is null, then fetch-files is called first to obtain only the html files in src.
     * 
     * @param {Object} options The options object.
     * @param {[String]} files The list of files to rewrite (default = null).
     * @returns {[String]} The copied files (TODO).
     */
    rewrite_html: async function( options, files = null ){

        if (!files){
            log("fetching...");
            let fetchedFiles = await this.fetchFiles(options.dist.fullPathToSource, "html");
            files = fetchedFiles.html;
        }
        let copiedFiles = await this.copyFiles(files, options);

        console.log("files");
        log("rewriting html...")
        for (let file of copiedFiles){
            htmlRewrite(file, options.dist.fullPathToDest, options.dist.baseurl );
        }
        return [];
    },

    /**
     * Serves the files on a local webserver, so that they may be viewed on a browser.
     * 
     * @param {Object} options The options object.
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
     * Continuously watches the dest/baseurl directory to check for changes. If a change
     * occurs, then the browswer that is viewing the local webserver will be reloaded, so
     * that the new content can be viewed. Because this process runs continously, it does
     * not return an exit code and must be cancelled by the user in-terminal.
     * 
     * @param {Object} options The options object.
     */
    watch: function( options ) {
        log("watching files on " + options.dist.dest);

        chokidar.watch(options.dist.dest).on("all", (event, path) => {
            //log(path + " has been modified (" + event + "). Reloading...");
            setTimeout(browserSync.reload, 1000);
        })
    } 
}