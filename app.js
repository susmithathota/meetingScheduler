var restify = require('restify');
var builder = require('botbuilder');

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

var connector = new builder.ChatConnector({
    appId: "b9b1f1da-f3d9-48ce-8d8b-d36567aed313",
    appPassword: "eByKy2JWR130zTKeDyYRaL5"
});

var bot = new builder.UniversalBot(connector);

server.get("/", restify.serveStatic({
  directory: '.',
  default: 'index.html'
}));


server.post('/api/messages', connector.listen());

var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/ddb4594c-4b1c-47de-ac64-2b6746cd75b1?subscription-key=01f892ed3b644423b79f983ee2252093&staging=true&verbose=true&timezoneOffset=0.0&spellCheck=true&q=');
var intents = new builder.IntentDialog({ recognizers: [recognizer] , intentThreshold: 0.9});
bot.dialog('/', [
    function (session) {
        builder.Prompts.text(session, 'Hi! May I know your Name?');
    },
    function (session, results) {
        session.userData.name=results.response;
        builder.Prompts.text(session, 'Hello '+results.response +'!, how can I help you?');
    },
    function (session, results) {
        session.message.text=results.response;
        session.replaceDialog('/appointment');
    }
]);

intents.onDefault(builder.DialogAction.send("I'm sorry. only scheduling an appointment service is available."));

bot.dialog('/appointment', intents);

intents.matches('appointment', [	
    
    function(session, args, next) {
      console.log(args);
      var doctor = builder.EntityRecognizer.findEntity(args.entities, 'doctor');
      if (!doctor) {
          builder.Prompts.choice(session, "with whom do u want to schedule the appointment?", "Dr.Max|Dr.Wins|Dr.Dell");
      } else {
         session.dialogData.doctor=doctor.entity;
          next();
      }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.doctor = results.response.entity;
        }
        if (!session.dialogData.time) {
            builder.Prompts.time(session, 'At what time?');
        } else {
            next();
        }
    },
    function (session, results) {
      
        if (results.response) {
        	session.dialogData.time =  builder.EntityRecognizer.resolveTime([results.response]);
          session.dialogData.time =session.dialogData.time.toLocaleString()
        }
        if(session.dialogData.doctor && session.dialogData.time){
            session.send("Hey %s,your appointment is scheduled with %s on %s.Thanks for taking your time,Enjoy your day!", session.userData.name,session.dialogData.doctor,session.dialogData.time);
            session.endConversation();
        } else {
            session.send("its okay.. bye!!");
        }
    }
]);





