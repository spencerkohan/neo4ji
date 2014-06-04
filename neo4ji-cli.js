#!/usr/bin/env node

var neo4ji = require(__dirname + '/neo4ji.js');

var args = require('minimist')(process.argv.slice(2));
var command = args._[0];
var instanceName = args._[1];

switch(command){

case "create":
    console.log('creating: ' + instanceName + '...');
    neo4ji.createInstance(instanceName)
    break;

case "destroy":
    console.log('destroying: ' + instanceName + '...');
    neo4ji.destroyInstance(instanceName)
    break;

case "start":
    console.log('starting: ' + instanceName + '...');
    neo4ji.startInstance(instanceName)
    break;

case "stop":
    console.log('stopping: ' + instanceName + '...');
    neo4ji.stopInstance(instanceName)
    break;

case "instances":
    console.log(JSON.stringify(neo4ji.instances(), null, 4));
    break;
    
default:
    console.log('usage: ');
    console.log('\tcreate <instance name>\t\t: create a new instance with the given name');
    console.log('\tdestroy <instance name>\t\t: destroy instance with the given name');
    console.log('\tstart <instance name>\t\t: start instance with the given name');
    console.log('\tstop <instance name>\t\t: stop instance with the given name');
    console.log('\tinstances\t\t\t: list all instances');

    break;

}

console.log('finished.');
process.exit(0);
