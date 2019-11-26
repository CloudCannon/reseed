const fs = require("fs-extra");
const ncp = require("ncp").ncp;
const path = require("path");
//const cssRewrite = require("./processors/css").plugin;

module.exports = {
    /**
     * Recursively and asynchronously moves through a directory and 
     * returns the list of files in that directory.
     * @param {string} dir The current file directory
     */
    recursiveWalk: function(dir, done){
        
        let fileArray = []

        fs.readdir(dir, (err, files) => { //read the current directory
            if (err) return done(err);

            let pending = files.length;  
            if (!pending) {
                return done(); // if there are no files in this directory, return.
            }

            files.forEach(file => {
                file = path.resolve(dir, file);
                fs.stat(file, (err, stat) => { 
                    if (stat && stat.isDirectory()){ // if the file is a directory
                        this.recursiveWalk(file, (err, res) => {
                            if (err) throw err;
                            if (res === undefined){
                                fileArray = fileArray.concat(file);
                            }
                            fileArray = fileArray.concat(res);
                            pending--;
                            if (!pending) {
                                done(null, fileArray);
                            }
                        });
                        
                    } else {
                        fileArray.push(file);
                        
                        pending--;
                        if (!pending) {
                            done(null, fileArray);
                        }
                    }
                }); 
            })            
        });
    },

    /**
     * Asynchronously copy the files in fileList from source to destination.
     * 
     * @param {string} source The source directory.
     * @param {string} destination The final destination folder. cwd/destination/baseurl/
     * @param {string[]} fileList The list of files contained in the source.
     */
    copyFiles: function(source, destination, fileList, done){
        
        const cwd = process.cwd();
        let pending = fileList.length;
        fs.mkdir(path.resolve(destination, source), { recursive: true }, err => { //create the directory cwd/destination
            if (err) return done(err);
            
            fileList.forEach(file => {
                pending--;
                if (!file) return null;
                let stub = file.replace(cwd, ""); // the path of the file, starting from the source.
                // the new path of the file. Using .format should prevent windows issues (\\ vs /)
                let newpath = path.format({
                    dir: destination,
                    base: stub
                })
                var dirname = path.dirname(newpath);

                fs.mkdir(dirname, { recursive: true }, (err) => {
                    if (err) return done(err);
                    fs.copy(file, newpath, {overwrite:true}, err => {
                        if (err) done(err);
                        
                    });
                });
                if (!pending) return done(null);
            });
        });
    },

    /**
     * 
     * @param {*} sourceDir 
     * @param {*} destinationDir 
     * @param {*} baseurl 
     * @param {*} options 
     */
    build: function (sourceDir, destinationDir, baseurl, options) {
        this.recursiveWalk(path.resolve(options.cwd, sourceDir), (err, sourceFiles) => {
            console.log("Files Retreived");
            if (err) throw err;
            this.copyFiles(sourceDir, path.resolve(options.cwd, destinationDir, baseurl), sourceFiles, (err) =>{
                console.log(err);
            });                
                /*sourceFiles.forEach(file => {
                    console.log("bep");
                    const cssext = /\.s?css/i;
                    if (file && file.includes("css")) {
                        console.log(file);
                        cssRewrite(file, (err, results)=>{
                            console.log(results);
                        });
                    }
                });*/
        });

        // TODO write process files which runs cheerio to update links and create new file positions
        //this.copyFiles(sourceDir, path.resolve(options.cwd, destinationDir, baseurl), sourceFiles);
    }
}