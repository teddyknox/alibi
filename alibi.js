#!/usr/bin/env node

var fs = require('fs');
var MapboxClient = require('mapbox');
var moment = require('moment');
var argv = require('minimist')(process.argv.slice(2));

var usage = "\n  usage: alibi.js [-f location_json_file] YYYY-MM-DD ...\n  Accepts ISO 8601 date strings.\n";
var mapboxKey = 'pk.eyJ1IjoidGtub3giLCJhIjoiY2lsanE5N3V6NTUwMnR2a3B4OGc3Yng0eiJ9.03t93-FvEgXJKzCo2a_2CA';
var scaleFactor = Math.pow(10, 7);

function alibi(dataFile, dateString) {
  var day = moment(dateString);
  var data = JSON.parse(fs.readFileSync(dataFile));
  var closest = search(data.locations, day.valueOf());
  var lat = closest[0].latitudeE7 / scaleFactor;
  var lon = closest[0].longitudeE7 / scaleFactor;
  var mapbox = new MapboxClient(mapboxKey);
  mapbox.geocodeReverse({ latitude: lat, longitude: lon }, function(err, res) {
    console.log("\nOn " + day.format("dddd, MMMM Do YYYY") + " at " +
        day.format("h:mma") + " you were near:\n" + res.features[0].place_name + "\n");
  });
} 

function search(locations, timestamp) {
  var timestampAtIndex = function(i) { return parseInt(locations[i].timestampMs); }
  var searching = true;
  var low = 0;
  var high = locations.length - 1;

  if (timestamp > timestampAtIndex(low)
      || timestamp < timestampAtIndex(high)) {
    throw "Specified timestamp out of range.";
  }

  while (low + 1 < high) {
    var idx = Math.floor((low + high) / 2);
    if (timestampAtIndex(idx) > timestamp) {
      low = idx;
    } else {
      high = idx;
    }
  }
  return locations.slice(low, high);
}

if (require.main === module) {
  if (argv._.length >= 1) {
    alibi(argv.f || "LocationHistory.json" , argv._);
  } else {
    console.error(usage);
    process.exit(1);
  }
}
