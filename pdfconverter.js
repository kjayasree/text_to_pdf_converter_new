var pdf = require('pdfkit');
var config = require('./config.json')
const testFolder = config.carePlan.folders.pdfpath;
const fs = require('fs');
const path = require('path');
// used for formatting date used by logger
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
    label({ label: 'careplan-report' }),
    timestamp(),
    customFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ dirname: '../', filename: 'carepan-report.' + (new Date()).YYYYMMDDHHMMSS() + '.log' })
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
//Use the text files and generating pdf files.
fs.readdirSync(testFolder).forEach((file, i) => {
  try {
    var data1 = fs.readFileSync(testFolder + file, 'utf8');
    var fileName = path.parse(testFolder + file);
    var destination = "./pdffiles/" + fileName.name + '.pdf';
    logger.info("successfully converted to pdf:" + fileName.name);
    var doc = new pdf({ size: 'LEGAL', layout: 'landscape' });
    doc.pipe(fs.createWriteStream(destination));
    doc.font('Times-Roman').text(data1, { width: 2000 });
    doc.end();
  }
  catch (err) {
    logger.info('MakePDF ERROR: ' + err.message + fileName);
  }
});


