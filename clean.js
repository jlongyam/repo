import fs from 'node:fs';
import path from 'node:path';

function cleanEmptyFoldersRecursively(folder) {
  
    // var fs = require('fs');
    // var path = require('path');

    var isDir = fs.statSync(folder).isDirectory();
    if (!isDir) {
      return;
    }
    var files = fs.readdirSync(folder);
    if (files.length > 0) {
      files.forEach(function(file) {
        var fullPath = path.join(folder, file);
        cleanEmptyFoldersRecursively(fullPath);
      });
      files = fs.readdirSync(folder);
    }

    if (files.length == 0) {
      console.log("removing: ", folder);
      fs.rmdirSync(folder);
      return;
    }
  }

  const cwd = process.cwd()

  cleanEmptyFoldersRecursively(`${cwd}/node_modules`);
  