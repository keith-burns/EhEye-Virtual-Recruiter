// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var spellService = require('./spell-service');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var employeeID = null;
var isEmpIDNull = true;

var bot = new builder.UniversalBot(connector);

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', dialog);

/*
    The below was hardcoded for demo purposes.

bot.dialog('/askQuestions', [
    function (session) {
        builder.Prompts.text(session, 'Hi Jake, how are you doing today?');       
    },
    function (session, results) {
        if (results.response) {
            builder.Prompts.text(session, 'Great! Before we get started, do you have any questions?');
        }
    },
    function (session, results) {
        if (results.response) {
            builder.Prompts.text(session, 'Awesome. Let\'s get started then. Have you ever built a virtual agent?');
        }
    },
    function (session, results) {
        if (results.response) {
            builder.Prompts.text(session, 'Oh, so cool! What technology was used to create Lucy Goosy?');
        }
    },
    function (session, results) {
        if (results.response) {
            builder.Prompts.text(session, 'That\'s AMAZING! Did you know that is the same framework that was used to build me?');
        }
    },
    function (session, results) {
        if (results.response) {
            builder.Prompts.text(session,'Anyways, I digress. Next question. Backpropogation vs genetic algorithms - when would you use these two?');
        }
    },
    function (session, results) {
        if (results.response) {
            builder.Prompts.text(session, 'Sure. Thank you - we will get back to you shortly. Have a good day, bye');
        }
    },
]);
*/

/* commenting out all log output code
//write to file requirement
// from http://stackoverflow.com/questions/8393636/node-log-in-a-file-instead-of-the-console
var fs = require('fs');
var util = require('util');

var resultHandler = function(err) { 
    if(err) {
       console.log("unlink failed", err);
    } else {
       console.log("file deleted");
    }
}

fs.unlink(__dirname + '/log.txt', resultHandler);
var log_file = fs.createWriteStream(__dirname + '/log.txt', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { 
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

const logUserConversation = (event) => { console.log('message: ' + event.text + ', user: ' + event.address.user.name);
};
// Middleware for logging
bot.use({
    receive: function (event, next) {
        logUserConversation(event);
        next();
    },
    send: function (event, next) {
        logUserConversation(event);
        next();
    }
});
*/

dialog.matches('welcome', [
    function (session, args, next) {
        if (isEmpIDNull) {
            builder.Prompts.number(session, 'Hi! What is your employee ID #?');
            //logger.write();
            isEmpIDNull = false;
            
        }
        else {
            builder.Prompts.text(session, 'Tell me a little bit more about yourself.');
        }
    },
    function (session, results) {
        builder.Prompts.text(session, 'Thank you. Tell me a little bit more about yourself.');
    }
])

dialog.matches('askQuestions', [
    function (session, args, next) {

        // test intent functionality
        session.send('Perfect. Now I\'m going to grill you.');
        //Resolve and store any entities passed from LUIS
        var skill = builder.EntityRecognizer.findEntity(args.entities, 'aiSkills');
        var experience = builder.EntityRecognizer.findEntity(args.entities, 'experience');

        if (skill) {
            builder.Prompts.text(session, 'Tell me a little bit more about your experience with ' + skill + '.');
        }
        else if (experience) {
            builder.Prompts.text(session, 'Tell me more about your ' + experience + ' at that company.');
        }        
    },
    function (session) {
        if (skill == 'robotics') {
            builder.Prompts.text(session, "That sounds like some very good robotics experience. Have you ever used Accenture Robotics Platform?");
        }
        else {
            session.send("You're not good enough.");
        }
    }
])

dialog.matches('leave', [
    function (session, args, next) {
        session.send("Okay, goodbye!");
    }
])

dialog.onDefault(builder.DialogAction.send("You should type something meaningful."));

bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking me things like \'what technologies will I work with\', \'what types of projects will I work on\' or \'is the pay any good\'');
}).triggerAction({
    matches: 'Help'
});

// Spell Check - not enabled
if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService
                .getCorrectedText(session.message.text)
                .then(function (text) {
                    session.message.text = text;
                    next();
                })
                .catch(function (error) {
                    console.error(error);
                    next();
                });
        }
    });
}