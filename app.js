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

var bot = new builder.UniversalBot(connector);

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

bot.dialog('/', dialog);

// prompt for ID
//var employeeID = null;
//var isEmpIDNull = true;

dialog.onDefault( 
        builder.DialogAction.send("I'm sorry I didn't understand. Try again!")
    );

dialog.matches('askQuestions', [
    function (session, args, next) {

        //Resolve and store any entities passed from LUIS
        var skill = builder.EntityRecognizer.findEntity(args.entities, 'aiSkills');
        var experience = builder.EntityRecognizer.findEntity(args.entities, 'experience');

        if (skills) {
            session.send("Tell me a little bit more about your experience with ", skill, ".");
        }
        if (experience) {
            session.send("Tell me more about your ", experience, "at that company.");
        }        
    }
])

dialog.matches('leave', [
    function (session, args, next) {
        session.send("Okay, goodbye!");
    }
])

/*
bot.dialog('Candidate Pre-Screen', [
    function (session, args, next) {
        session.send('Welcome to the Eye Eh Recruiting Pre-Screen! Let\'s begin our interview! What is your ID number?: \'%s\'', session.message.text);
        session.send('Thank you. First question: Tell us about your experience with AI. \'%s\'', session.message.text);
        // try extracting entities
        var aiSkillsEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'aiSkills');

        if (aiSkillsEntity) {
            // ai skills entity detected, continue to next step
            session.send('Thank you. You have a required skill! \'%s\'', session.message.text);
            //next({ response: aiSkillsEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            session.send('You have no skills. Goodbye. \'%s\'', session.message.text);
        }
}]);

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