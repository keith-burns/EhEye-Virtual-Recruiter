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

dialog.matches('welcome', [
    function (session, args, next) {
        if (isEmpIDNull) {
            builder.Prompts.number("Hi! What is your employee ID #?");
            isEmpIDNull = false;
        }
        else {
            builder.Prompts.text("Tell me a little bit more about yourself.");
        }
    },
    function (session, results) {
        session.send("Thank you.");
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
            builder.Prompts.text("Tell me a little bit more about your experience with %d.", skill);
        }
        else if (experience) {
            builder.Prompts.text("Tell me more about your %d at that company.", experience);
        }        
    },
    function (session, results) {
        if (skill == 'robotics') {
            builder.Prompts.text("That sounds like some very good robotics experience. Have you ever used Accenture Robotics Platform?");
        }
        else {
            builder.Prompts.text("You're not good enough.");
        }
    }
])

dialog.matches('leave', [
    function (session, args, next) {
        session.send("Okay, goodbye!");
        //log chat here
    }
])

dialog.onDefault(builder.DialogAction.send("You should type something meaningful."));

/*
bot.dialog('Help', function (session) {
    session.endDialog('Hi! Try asking me things like \'what technologies will I work with\', \'what types of projects will I work on\' or \'is the pay any good\'');
}).triggerAction({
    matches: 'Help'
});
*/

// Spell Check
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