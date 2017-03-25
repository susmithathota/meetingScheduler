var restify = require('restify');
var builder = require('botbuilder');

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);

server.get("/", restify.serveStatic({
  directory: '.',
  default: 'index.html'
}));


server.post('/api/messages', connector.listen());

var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/107b69f0-1e05-4967-8734-7f20ee9ba5ae?subscription-key=01f892ed3b644423b79f983ee2252093&staging=true&verbose=true&timezoneOffset=0.0&spellCheck=true&q=');
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

intents.matches('schedule meeting', [
	function (session, args, next) {
		console.log(args);
        var location = builder.EntityRecognizer.findEntity(args.entities, 'location');
        var time = builder.EntityRecognizer.findEntity(args.entities, 'builtin.datetime.time');
        if (!location) {
            builder.Prompts.text(session, "where do u want to schedule the meeting");
        } 
        if (!time) {
            builder.Prompts.time(session, 'What time would you like to set the alarm for?');
        } 
        if(location && time) {
            
            // session.dialogData.timestamp = time.getTime();
            next({ location: location.entity, time:time.entity });
         }
    },
    function (session, results) {
        if (results) {
        	console.log(results);
            session.send("meeting scheduled at %s in %s.", results.time,results.location);
        } else {
            session.send("Ok");
        }
    }
]);




