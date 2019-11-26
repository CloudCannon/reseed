const fs = require("fs-extra");
const ncp = require("ncp").ncp;
const path = require("path");
//const cssRewrite = require("./processors/css").plugin;

module.exports = {
    /**
     * Recursively and asynchronously moves through a directory and 
     * returns the list of files in that directory.
     *
     * @param {string} dir The current file directory
     *
     * @returns {string[]} All of the files in the directory
     */
    getAllFiles: async function(dir) {
        
      let fileArray = []

      const files = await fs.promises.readdir(dir); //read the current directory

      for( let file of files ) {
          file = path.resolve(dir, file);

          const stat = await fs.promises.lstat(file);

          // If the file is a symbolic link, ignoreit
          if( stat.isSymbolicLink() ) {
            return;
          }

          // if the file is a directory, run function again
          if (stat && stat.isDirectory()) { 
              const res = await this.getAllFiles(file);

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
    },

    /**
     * Asynchronously copy the files in fileList from source to destination.
     * 
     * @param {string} source The source directory.
     * @param {string} destination The final destination folder. cwd/destination/baseurl/
     * @param {string[]} fileList The list of files contained in the source.
     */
    copyFiles: async function(source, destination, fileList){

      console.log('Copying files...');
        
      const cwd = process.cwd();

      await fs.promises.mkdir(path.resolve(destination, source), { recursive: true })//create the directory cwd/destination
          
      for( let file of fileList ) {
        if (!file) return null;
        let stub = file.replace(cwd, ""); // the path of the file, starting from the source.
        // the new path of the file. Using .format should prevent windows issues (\\ vs /)
        let newpath = path.format({
            dir: destination,
            base: stub
        })
        var dirname = path.dirname(newpath);

        await fs.promises.mkdir(dirname, { recursive: true });
        await fs.promises.copyFile(file, newpath, { overwrite:true });

      }
      console.log('Copied all');
    },

    /**
     * 
     * @param {*} sourceDir 
     * @param {*} destinationDir 
     * @param {*} baseurl 
     * @param {*} options 
     */
    build: async function (sourceDir, destinationDir, baseurl, options) {
        const myPath = path.resolve(options.cwd, sourceDir)
        const sourceFiles = await this.getAllFiles(myPath);

        console.log(sourceFiles.length, "files retrieved");

        // List files if there aren't too many
        if( sourceFiles.length < 20 ) {
          sourceFiles.forEach((string) => console.log(string))
        }

        this.copyFiles(sourceDir, path.resolve(options.cwd, destinationDir, baseurl), sourceFiles);


        
        
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

        // TODO write process files which runs cheerio to update links and create new file positions
        //this.copyFiles(sourceDir, path.resolve(options.cwd, destinationDir, baseurl), sourceFiles);
    }
}