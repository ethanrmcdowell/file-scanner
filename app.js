const inquirer = require('inquirer');
const crypto = require('crypto');
const fs = require('fs');

const FileInfo = require('./lib/FileInfo');

// ----------------------------------------------
//           TO DO & NOTES:
// ----------------------------------------------
// Take fileList objects and write into csv file
// ----------------------------------------------
// Separate input into path, file type, and md5
// ----------------------------------------------

const directoryList = [];
const fileList = [];
// subdirFlag should be set false by defult, set true for testing
let subdirFlag = true;
let targetPath = '/Users/ethanmcdowell/Projects/file-scanner/Target' + '/';
let originalTarget = '';

const initPrompt = {
  type: 'input',
  name: 'target',
  message: 'Enter required information:',
};

const init = async () => {
  try {
    await userInput();
  } catch (err) {
    console.log(err);
  } finally {
    console.log(fileList);
  }
};

const userInput = async () => {
  // await inquirer.prompt(initPrompt).then(async initRes => {
  //   const userRes = initRes.target;
  //   const inputLength = userRes.split(/[ ,]+/).length;
  //   const targetDir = userRes.split(/[ ,]+/)[0];
  //   const outputPath = userRes.split(/[ ,]+/)[1];
  //   if (inputLength === 3) {
  //     subdirFlag = true;
  //   }
  // });
  await scanFiles();
};

const scanFiles = async () => {
  try {
    await fs.readdirSync(targetPath).forEach((file, error) => {
      const boolDir = fs.lstatSync(targetPath + file).isDirectory();
      const boolFile = fs.lstatSync(targetPath + file).isFile();
      if (boolDir) {
        console.log('Directory: ' + file + '/');
        handleDir(file);
      } else if (boolFile) {
        const fileHex = fs
          .readFileSync(targetPath + file)
          .toString('hex')
          .slice(0, 9);
        if (fileHex === '255044462') handlePdf(file);
        else if (fileHex.slice(0, 4) === 'ffd8') handleJpg(file);
      }
    });
  } catch (err) {
    console.log(err);
  } finally {
    if (subdirFlag) {
      try {
        console.log('SCANNING SUBDIRECTORIES:');
        await handleSubdir();
      } catch (err) {
        console.log(err);
      } finally {
        console.log('CREATING YOUR FILE, PLEASE BE PATIENT :)');
        await createCsv();
      }
    } else if (!subdirFlag) {
      console.log('CREATING YOUR FILE, PLEASE BE PATIENT :)');
      await createCsv();
    }
  }
};

const handlePdf = async file => {
  const thisFile = await fs.readFileSync(targetPath + file);
  const hash = crypto.createHash('md5').update(thisFile).digest('hex');
  const newFileInfo = new FileInfo(targetPath + file, '.pdf', hash);
  fileList.push(newFileInfo);
  // console.log(fileList);
};

const handleJpg = async file => {
  const thisFile = await fs.readFileSync(targetPath + file);
  const hash = await crypto.createHash('md5').update(thisFile).digest('hex');
  const newFileInfo = new FileInfo(targetPath + file, '.jpg', hash);
  fileList.push(newFileInfo);
  // console.log(fileList);
};

const createCsv = () => {
  console.log('INSIDE CREATE CSV FUNCTION');
  // for (let i = 0; i < fileList.length; i++) {
  //   console.log(
  //     fileList[i].path + ',' + fileList[i].type + ',' + fileList[i].md5
  //   );
  // }
};

const handleDir = file => {
  directoryList.push(file);
};

const handleSubdir = async () => {
  if (directoryList.length === 0) {
    console.log('THERE ARE NO SUBDIRECTORIES!');
  } else {
    try {
      originalTarget = targetPath;
      console.log(originalTarget);
      directoryList.forEach(async directory => {
        targetPath = originalTarget + directory + '/';
        await subdirScan();
      });
    } catch (err) {
      console.log(err);
    }
  }
};

const subdirScan = async () => {
  await fs.readdirSync(targetPath).forEach(async (file, error) => {
    const boolDir = fs.lstatSync(targetPath + file).isDirectory();
    const boolFile = fs.lstatSync(targetPath + file).isFile();
    if (boolDir) {
      handleDir(file);
    } else if (boolFile) {
      const fileHex = fs
        .readFileSync(targetPath + '/' + file)
        .toString('hex')
        .slice(0, 9);
      if (fileHex === '255044462') {
        await handlePdf(file);
      } else if (fileHex.slice(0, 4) === 'ffd8') {
        await handleJpg(file);
      }
    }
  });
};

init();
