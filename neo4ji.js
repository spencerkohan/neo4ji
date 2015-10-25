

var instances = {}

var exec = require('sync-exec')
var fs = require('fs')
var args = require('minimist')(process.argv.slice(2));

//console.dir(args);

var currentPort;
var cwd = process.cwd();

var neo4jiDir = cwd + '/neo4ji/';
var instancesDir = neo4jiDir + 'instances/';
var templatesDir = __dirname + '/templates/';
configFilePath = __dirname + '/config.json'

var instanceFilePath = neo4jiDir + 'instances.json';

var neo4j = require('neo4j');
var config;

function setup(){

    if(!fs.existsSync(neo4jiDir)){
        exec('mkdir ' + neo4jiDir)
    }
    if(!fs.existsSync(instancesDir)){
        exec('mkdir ' + instancesDir)
    }
    if(!fs.existsSync(templatesDir)){
        exec('mkdir ' + templatesDir)

    }

    config = JSON.parse(fs.readFileSync(configFilePath));

    //console.dir(config)

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

function templatePath(version){
    return templatesDir + version + '.tar.gz';
}

function fetchTemplate(version){

    console.log('fetching neo4ji tarball...')

    var res = exec('which wget');

    if(res.status == 0){

        console.log('using wget...')

        exec('curl http://dist.neo4j.org/neo4j-community-' + version + '-unix.tar.gz > ' + templatePath(version));

    }else if(exec('which curl').status == 0){

        console.log('using curl...')

        exec('curl http://dist.neo4j.org/neo4j-community-' + version + '-unix.tar.gz > ' + templatePath(version));

    }else{

        throw new Error('unable to find [ curl ] or [ wget ] in PATH');

    }



}

function nextPort(){
    return currentPort += 2;
}

function saveInstances(){

    var instancesFile = {
        currentPort:currentPort,
        instances:instances
    }

    //console.log('new instances: ' + JSON.stringify(instancesFile, null, 4));

    exec('rm -rf ' + instanceFilePath)
    fs.writeFileSync(instanceFilePath, JSON.stringify(instancesFile, null, 4));

}

function exec(string){

    //console.log('exec: ' + string);
    var res = exec(string);
    if(res.code != 0){
        console.error('exec:$ ' + string);
        console.error('\t->returned status code: ' + res.code);
    }
    return res;

}

function createInstance(name, version){

    var port = nextPort();

    if(!version){
        version  = config.neo4jVersion;
    }


    if(!fs.existsSync(templatePath(version))){
        fetchTemplate(version);
    }

    exec('rm -rf ' + instancesDir + name);
    exec('tar -xjf ' + templatePath(version) + ' -C ' + instancesDir);


    if(!fs.existsSync(instancesDir + 'neo4j-community-' + version)){
        exec('rm -rf ' + templatePath(version));
        console.error('failed to fetch http://dist.neo4j.org/neo4j-community-' + version + '-unix.tar.gz');
        console.error("It's possible there is no internet connection, or that this version doesn't exist");
        console.error("Check http://www.neo4j.org/download/other_versions for all available versions");
        process.exit(1);
    }

    exec('mv ' + instancesDir + 'neo4j-community-' + version + ' ' + instancesDir + name);

    var props = fs.readFileSync(__dirname + '/propertiesTemplate.properties', 'utf8');
    props = props.replace('{HTTP_PORT}', '' + port);
    props = props.replace('{HTTPS_PORT}', '' + port+1);

    var propertiesPath = instancesDir + name + '/conf/neo4j-server.properties';

    exec('rm -rf ' + propertiesPath);
    fs.writeFileSync(propertiesPath, props);

    instances[name] = {
        port:port
    };
    saveInstances();

}

function destroyInstance(name){

    exec('rm -rf ' + instancesDir + name);
    delete instances[name];
    saveInstances();

}

function startInstance(name, version){

    if(!fs.existsSync(instancesDir + name)){
        createInstance(name, version);
    }

    exec( instancesDir + name + '/bin/neo4j start');
    console.log('started [' + name + '] on http://localhost:' + instances[name].port);

}

function stopInstance(name){

    exec( instancesDir + name + '/bin/neo4j stop');
    console.log('stopped [' + name + ']');

}

function configure(options){

    for(var key in options){
        config[key] = options[key];
    }

    exec('rm -rf ' + configFilePath)
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
    return config;

}

exports.createInstance = createInstance;
exports.destroyInstance = destroyInstance;
exports.startInstance = startInstance;
exports.stopInstance = stopInstance;
exports.config = configure;

exports.instances = function(){
    return instances;
}

exports.instance = function(name, version){
    startInstance(name, version);
    return new neo4j.GraphDatabase('http://localhost:' + instances[name].port);
}

exports.clearInstance = function(name, callback){
    var instance = exports.instance(name);
    instance.query('MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r', {}, callback);
}
