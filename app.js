const readline = require('readline');
const config= require('./config');
var report = config.carePlan.report;
Date.prototype.YYYYMMDDHHMMSS = function () {
  var yyyy = this.getFullYear().toString();
  var MM = pad(this.getMonth() + 1, 2);
  var dd = pad(this.getDate(), 2);
  var hh = pad(this.getHours(), 2);
  var mm = pad(this.getMinutes(), 2)
  var ss = pad(this.getSeconds(), 2)

  return yyyy + MM + dd + hh + mm + ss;
};
const { createLogger, format, transports, winston } = require('winston');
const { combine, timestamp, label, printf } = format;
const customFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
const logger = createLogger({
  exitOnError: false,
  format: combine(
      label({ label: 'SDAT-CareplanReport-split-textfile' }),
      timestamp(),
      customFormat
  ),
  transports: [
      new transports.Console(),
      new transports.File({ dirname: '../', filename: 'SDAT-CareplanReport-split-textfile.' + (new Date()).YYYYMMDDHHMMSS() + '.log' })
  ]
});

function getDate() {
  d = new Date();
  alert(d.YYYYMMDDHHMMSS());
}

function pad(number, length) {

  var str = '' + number;
  while (str.length < length) {
      str = '0' + str;
  }

  return str;

}
const fs = require('fs'), es = require('event-stream');
let memberCount = 0;
let priorityMembers=0;
let nonPriorityMembers=0;
let buffer = [];
//error file name
//config file
// Write buffer array to file and close the file stream
const writeBufferToFile = (buffer) => {
    if(buffer.length > 1) {
        let filename = buffer[2].split(' ')[0];
        if(filename.startsWith('\'')) {
            filename = filename.split("'")[1];
        }
        let hasPriorityGoals = false, folderPath = config.carePlan.folders.withoutGoals;
        for(let i=0; i<buffer.length; i++){
            if(buffer[i].indexOf('PRIORITY') > -1) {
                hasPriorityGoals = true;
                priorityMembers++;
                break;
            }
        }
        if(hasPriorityGoals) {
            folderPath = config.carePlan.folders.withGoals;
        }
        
        // Check if member has priority goals
        var stream = fs.createWriteStream(folderPath + filename + ".txt");
        if(!hasPriorityGoals){
            nonPriorityMembers++;
        }
        stream.once('open', function(fd) {
            for (var i=0; i<buffer.length; i++) {
                stream.write(buffer[i] + '\n');
            }
            stream.end();
        
        });
    } else {
        logger.info('Invalid buffer received. File is not created.');
    } 
};
const stream = fs.createReadStream(report).pipe(es.split())
    .pipe(es.mapSync(function(line){
        if(line && line.trim().length > 0) {
            // pause the readstream
            stream.pause();
            if(line.startsWith('MEMBER')) {
                if(buffer.length > 0) {
                    // create a file with this buffer array.
                    writeBufferToFile(buffer);
                }
                buffer = [];
                buffer.push(line);
                memberCount++;
            } else {
                buffer.push(line);
            }
        } else {
            buffer.push(' ');
        }
        stream.resume();
    })
    .on('error', function(err){
        logger.error('Error while reading file.', err);
    })
    .on('end', function(){
        if(buffer && buffer.length > 1) {
            writeBufferToFile(buffer);
        }
        logger.info('Total members: ' + memberCount);
        logger.info("Members with priority goals: "+priorityMembers);
        logger.info("Members with no priority goals: "+nonPriorityMembers);
    })
)