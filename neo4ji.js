

var instances = {}

var sh = require('execSync')
var fs = require('fs')
var args = require('minimist')(process.argv.slice(2));

var currentPort;
var cwd = process.cwd();

var neo4jiDir = cwd + '/neo4ji-instances/';
var instancesDir = neo4jiDir + 'instances/';

var instanceFilePath = neo4jiDir + 'instances.json';

var neo4j = require('neo4j');

function setup(){

    if(!fs.existsSync(neo4jiDir)){
        exec('mkdir ' + neo4jiDir)
    }
    if(!fs.existsSync(instancesDir)){
        exec('mkdir ' + instancesDir)
    }
    if(!fs.existsSync(__dirname + '/template.tar.gz')){
        exec('curl http://dist.neo4j.org/neo4j-community-2.1.1-unix.tar.gz > ' + __dirname + '/template.tar.gz');
    }

    var instancesFile = null;
    try{
        instancesFile = fs.readFileSync(instanceFilePath)
    }catch(e){}

    if(instancesFile){
        var data = JSON.parse(instancesFile);
        instances = data.instances;
        currentPort = data.currentPort;
    }else{
        instances = {};
        currentPort = 7500;
    }

}

setup();

function nextPort(){
    return currentPort += 2;
}

function saveInstances(){

    var instancesFile = {
        currentPort:currentPort,
        instances:instances
    }

    exec('rm -rf ' + instanceFilePath)
    fs.writeFileSync(instanceFilePath, JSON.stringify(instancesFile, null, 4));

}

function exec(string){

    console.log('exec: ' + string);
    sh.exec(string);

}

function createInstance(name){

    var port = nextPort();

    exec('rm -rf ' + instancesDir + name);
    exec('tar -xjf ' + __dirname + '/template.tar.gz -C ' + instancesDir);
    exec('mv ' + instancesDir + '/neo4j-community-2.1.1/ ' + instancesDir + name);

    var props = fs.readFileSync(__dirname + '/propertiesTemplate.properties', 'utf8');
    props = props.replace('{HTTP_PORT}', '' + port);
    props = props.replace('{HTTPS_PORT}', '' + port+1);

    var propertiesPath = instancesDir + name + '/conf/neo4j-server.properties';

    sh.exec('rm -rf ' + propertiesPath);
    fs.writeFileSync(propertiesPath, props);

    instances[name] = {
        port:port
    };
    saveInstances();

}

function destroyInstance(name){

    sh.exec('rm -rf ' + instancesDir + name);
    delete instances[name];
    saveInstances();

}

function startInstance(name){

    if(!fs.existsSync(instancesDir + name)){
        createInstance(name);
    }

    exec( instancesDir + name + '/bin/neo4j start');
    console.log('started [' + name + '] on http://localhost:' + instances[name].port);

}

function stopInstance(name){

    exec( instancesDir + name + '/bin/neo4j stop');
    console.log('stopped [' + name + ']');

}

exports.createInstance = createInstance;
exports.destroyInstance = destroyInstance;
exports.startInstance = startInstance;
exports.stopInstance = stopInstance;

exports.instances = function(){
    return instances;
}

exports.instance = function(name){
    startInstance(name);
    return new neo4j.GraphDatabase('http://localhost:' + instances[name]);
}
