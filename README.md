**About**

Neo4ji offers tools for creating and managing multiple local neo4j instances.

It is built for ease of use in a development setting, and probably should not be considered ready for production.

**Installation**

    $ npm install neo4ji

**Usage**

Neo4ji consists of a command line tool and a node module.  The command line tool has the following options:

create a server with the given name.  Optionally set a specific version of neo4j to be instantiated (2.1.1 is the default)

    $ neo4ji create <server name> [-V <version>]

destroy the server with the given name

    $ neo4ji destroy <server name>

start the server with the given name (a new server will be created if none exists). Optionally set a specific version of neo4j to be instantiated (2.1.1 is the default)

    $ neo4ji start <server name> [-V <version>]

stop the server with the given name

    $ neo4ji stop <server name>

Set the default version for neo4ji to instantiate

    $ neo4ji config -V <version>

show a list of instances managed by noe4ji

    $ neo4ji instances


The module has the following functions:

    var neo4ji = require('neo4ji')

    //Set the default version of neo4j to 2.0.3
    neo4ji.config({neo4jVersion:"2.0.3"});

    //create a server instance called testServer
    neo4ji.create('testServer');

    //start the testServer instance
    neo4ji.start('testServer');

    //get the instances object
    var instances = neo4ji.instances();

    //get a graph server instance for testServer
    var graph = neo4ji.instance('testServer');

    //stop the testServer instance
    neo4ji.stop('testServer');

    //destroy the testServer instance
    neo4ji.destroy('testServer');

**Notes on behavior**

- calling <code>create</code> will always create a new instance, overwriting any existing instance
- calling <code>start</code> will create an instance if none exists
- everything is done synchronously
- the initial usage of the command line tool or the module to create a datavase with a given version will fetch the neo4j tarball from neo4j.org, so it may take a while
- calling <code>neo4ji.instance()</code> calls <code>start</code>, so it is garonteed to return an initialized instance
- <code>neo4ji.instance()</code> creates an instance of a [node-neo4j](https://github.com/thingdom/node-neo4j) database object
- instances are placed in the folder <code>neo4ji/instances</code> relative to the directory from which neo4ji is called
