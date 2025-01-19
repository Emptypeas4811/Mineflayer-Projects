const fs = require('fs');
const mineflayer = require("mineflayer");
const readline = require('readline');
const Vec3 = require('vec3');
const bot = mineflayer.createBot({
    host: "localhost", // Adjust server IP accordingly
    port: 64308,
    username: "plug", // Adjust username accordingly
    version: "1.20", // Adjust version accordingly
    // password: 'enter pass here',
    // auth: 'microsoft'
});

// Function to save the array to a file
function saveArrayToFile(array, filename) {
  const jsonString = JSON.stringify(array);
  fs.writeFileSync(filename, jsonString, (err) => {
    if (err) {
      console.error('Error saving array to file', err);
    } else {
      console.log('Array saved to file successfully');
    }
  });
}

// Function to load the array from a file
function loadArrayFromFile(filename) {
  if (fs.existsSync(filename)) {
    const jsonString = fs.readFileSync(filename, 'utf8');
    return JSON.parse(jsonString);
  } else {
    return [];
  }
}

// Change or create .csv file name when necessary
const csvFilename = 'botData';
// Initialize loggedChests array
const loggedChests = loadArrayFromFile('loggedChests.json');

// Function to convert array to CSV format
function convertToCSV(data) {
  const csvRows = data.map(pos => `${pos[0]},${pos[1]},${pos[2]}`).join('\n');
  return csvRows;
}

// Function to append data to CSV file
function appendToCSVFile(data) {
  const csvContent = convertToCSV(data);
  fs.appendFile(`${csvFilename}.csv`, csvContent + '\n', (err) => {
    if (err) {
      console.error('Error writing to CSV file', err);
    } else {
      console.log('CSV file appended successfully');
    }
  });
}

// Function to write the CSV header
function writeCSVHeader() {
  const csvHeader = 'x,y,z\n';
  fs.writeFile(`${csvFilename}.csv`, csvHeader, (err) => {
    if (err) {
      console.error('Error writing CSV header', err);
    } else {
      console.log('CSV header written successfully');
    }
  });
}

// Function to update the CSV file with the current loggedChests array
function updateCSVFile() {
  const csvContent = convertToCSV(loggedChests);
  fs.writeFile(`${csvFilename}.csv`, 'x,y,z\n' + csvContent + '\n', (err) => {
    if (err) {
      console.error('Error updating CSV file', err);
    } else {
      console.log('CSV file updated successfully');
    }
  });
}

// Function to update .csv file upon checking for invalid chest locations in [loggedChests] array
function chestLocChecker() {
  for (let i = 0; i < loggedChests.length; i++) {
    let chestChecker = loggedChests[i];
    if (Math.abs(bot.entity.position.x - chestChecker[0]) <= 128 && Math.abs(bot.entity.position.z - chestChecker[2]) <= 128) {
      let blockToBeChecked = new Vec3(chestChecker[0], chestChecker[1], chestChecker[2]);
      const blockLocToBeChecked = bot.blockAt(blockToBeChecked);
      if (blockLocToBeChecked && blockLocToBeChecked.name !== 'chest') {
        loggedChests.splice(i, 1);
        i--; // Adjust the index after removal to maintain proper flow
      }
    }
  }
  updateCSVFile(); // Update the CSV file after checking all chest locations
  saveArrayToFile(loggedChests, 'loggedChests.json'); // Save the updated array to the JSON file
}

// Chest detection function
function detectChests() {
  console.log("Scanning For Chests...");
  let positions = bot.findBlocks({
    point: bot.entity.position,
    matching: bot.registry.blocksByName["chest"].id,
    maxDistance: 128,
    count: 100,
  });

  positions.forEach((position) => {
    const chestKey = [position.x, position.y, position.z];

    if (!loggedChests.some(chest => chest[0] === chestKey[0] && chest[1] === chestKey[1] && chest[2] === chestKey[2])) {
      // Verify the block type at the detected position
      const block = bot.blockAt(position);
      if (block && block.name === 'chest') {
        loggedChests.push(chestKey);
        console.log(`New chest found at: X:${position.x} Y:${position.y} Z:${position.z}`);
        appendToCSVFile([chestKey]);
        saveArrayToFile(loggedChests, 'loggedChests.json'); // Save the updated array to the JSON file
      }
    }
  });
}

bot.on('login', () => {
  console.log('Bot has logged in');
  writeCSVHeader(); // Write the CSV header when the bot logs in
  setInterval(chestLocChecker, 5000); // Automatically check chest locations and append .csv file accordingly
});

let chestDetectionInterval;

bot.on('whisper', (username, message) => {
    if (username === bot.username) return;
    if (username === "Beasthunter3185") {
        if (message.includes('startChestFind')) {
             let args = message.split(' ');
            chestDetectionInterval = setInterval(detectChests, args[1]);
            bot.chat(`/msg ${username} chest detection interval started.`);
        }
        if (message.includes('stopChestFind')) {
            clearInterval(chestDetectionInterval);
            bot.chat(`/msg ${username} chest detection interval stopped`);
        }
        if (message.includes('help')) {
            bot.chat(`/msg ${username} usable commands include startChestFind [interval in milliseconds], stopChestFind`);
        }
    }
});



