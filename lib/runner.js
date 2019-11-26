const fs = require("fs-extra");
const path = require("path");
const util = require("util");
const cssRewrite = require("./processors/css").plugin;

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const mkdir = util.promisify(fs.mkdir);
const copy = util.promisify(fs.copy);

module.exports = {
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
    copyFiles: async function(source, destination, fileList, done){
        
        const cwd = process.cwd();
        try{
            await mkdir(path.resolve(destination, source), { recursive: true }); //create the directory cwd/destination
        
            for ( let file of fileList ) {
                if (!file) return null;
                let stub = file.replace(cwd, ""); // the path of the file, relative to the source.

                // the new path of the file. Using .format should prevent windows issues (\\ vs /)
                let newpath = path.format({
                    dir: destination,
                    base: stub
                })

                var dirname = path.dirname(newpath);

                await mkdir(dirname, { recursive: true });
                copy(file, newpath, {overwrite: true});

                /*
                let stats = await stat(newpath);
                if (!stats.isDirectory() && newpath.includes("css")){
                    console.log("css file");
                    await cssRewrite(newpath);
                }
                */
                
            }
        } catch (err) {
            //throw (err);
        }

    },

    /**
     * 
     * @param {*} sourceDir 
     * @param {*} destinationDir 
     * @param {*} baseurl 
     * @param {*} options 
     */
    build: async function (sourceDir, destinationDir, baseurl, options) {
        let sourceFiles = await this.fetchFiles(path.resolve(options.cwd, sourceDir));
        await this.copyFiles(sourceDir, path.resolve(options.cwd, destinationDir, baseurl), sourceFiles);    

        // TODO write process files which runs cheerio to update links and create new file positions
        //this.copyFiles(sourceDir, path.resolve(options.cwd, destinationDir, baseurl), sourceFiles);
    }
}