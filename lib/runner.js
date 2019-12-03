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
    regex: {
        css: /\.s?css$/,
        html: /\.html?$/,
        any: /(:?)/
    }
}

module.exports = {

    setOptions: function( opt ) {
        Object.assign(options, opt);
        options.dist.fullPathToSource = path.resolve(options.cwd, options.dist.src);
        options.dist.fullPathToDest = path.resolve(options.cwd, options.dist.dest, options.dist.baseurl);
    },

    /**
     * Recursively and asynchronously moves through a directory and 
     * returns the list of files in that directory.
     * @param {string} dir The current file directory
     */
    fetchFiles: async function(dir, type = "any"){
        
        let fileArray = []
        let reg;
        if (type === "css") reg = options.regex.css;
        else if (type === "html") reg = options.regex.html;
        else if (type === "assets") reg = null;
        else reg = options.regex.any;

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
                    const res = await this.fetchFiles(file, type);
                    fileArray = fileArray.concat(res);
                } else {
                    fileArray.push(file);              
                }
            }

            if (type === "assets"){
                return fileArray.filter(file => {
                    return ! (options.regex.css.test(file) || options.regex.html.test(file));
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
     * Currently throws error if directories already exist
     * 
     * @param {string} source The source directory.
     * @param {string} destination The final destination folder. cwd/destination/baseurl/
     * @param {string[]} fileList The list of files contained in the source.
     */
    copyFiles: async function(fileList){
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
                if (options.regex.css.test(newpath)) {
                    filetypes.css.push(newpath);
                } else if (options.regex.html.test(newpath)) {
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
        
        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource);

        console.log("copying...");
        let files = await this.copyFiles(sourceFiles);

        console.log("rewriting files...")

        for (let file of files.css){
            cssRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
        for (let file of files.html) {
            htmlRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
    },

    clean: function() {
        console.log(options.dist.dest)
        return del(options.dist.dest);
    },

    clone_assets: async function () {
        console.log("fetching...")

        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource, "assets");
        let files = await this.copyFiles(sourceFiles);     
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

    rewrite_css: async function(){
        console.log("fetching...")

        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource, "css");
        let files = await this.copyFiles(sourceFiles); 
        for (let file of files.css){
            cssRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
        
    },
    rewrite_html: async function(){
        console.log("fetching...")

        let sourceFiles = await this.fetchFiles(options.dist.fullPathToSource, "html");
        let files = await this.copyFiles(sourceFiles); 
        for (let file of files.html){
            htmlRewrite(file, options.dist.fullPathToDest, { "baseurl": options.dist.baseurl });
        }
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