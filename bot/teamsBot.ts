import {
  TeamsActivityHandler,
  CardFactory,
  MessageFactory,
  Activity,
  TurnContext,
} from "botbuilder";
import * as ACData from 'adaptivecards-templating';
import AdaptiveCard from './adaptiveCards/adaptiveCard.json';
import templateJson from './adaptiveCards/QuestionTemplate.json';
import axios from "axios";
const{contentBubbleTitles}=require('./contentbubbleTitle');


export class TeamsBot extends TeamsActivityHandler {
  baseUrl: string;
  appId: string;

  constructor() {
    super();
    this.appId = process.env.BOT_ID;

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");

      
      if(context.activity.value==null){
        await context.sendActivity({ attachments: [this.createAdaptiveCard()] });
      }
      else{
          var json = JSON.stringify(context.activity.value);
          var out=JSON.parse(json);
          if(out.action=='inputselector'){
            contentBubbleTitles.contentQuestion=out.myReview;
            await this.contentBubble(context, out.myReview);
            await context.sendActivity({ attachments: [this.createQuestionAdaptiveCard(out.myReview)] });
          }else {
            await context.sendActivity(context.activity.from.name + " : " +"**"+out.myReview+"**"+" for " + "'" + out.action + "'");
          }
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

  }

  async handleTeamsTaskModuleSubmit(context,taskModuleRequest) {
    var review = JSON.stringify(taskModuleRequest.data);
    var reply=JSON.parse(review);
    await context.sendActivity(context.activity.from.name + " : " +"**"+reply.myValue+"**"+" for " + "'" + reply.title + "'")
    return {};
  }

  async contentBubble(context: TurnContext, txt) {
    const replyActivity = MessageFactory.text("**Please provide your valuable feedback**");
    const { data: {tunnels} } = await axios.get('http://localhost:4040/api/tunnels')
    const { public_url: baseUrl } = tunnels.find(t => t.proto === 'https')
    replyActivity.channelData = {
      notification: {
        alertInMeeting: true,
        externalResourceUrl: 'https://teams.microsoft.com/l/bubble/'+this.appId+'?url='+encodeURIComponent(baseUrl)+'&height=270&width=300&title=ContentBubbleinTeams&completionBotId='+this.appId
      }
    };
    console.log(replyActivity);
    const status = await context.sendActivity(replyActivity);
    console.log('--------- status', status)
  }

  createAdaptiveCard(){
    return CardFactory.adaptiveCard(AdaptiveCard);
  }

  createQuestionAdaptiveCard(myText){
    var templatePayload = templateJson;
        var template = new ACData.Template(templatePayload);
        var cardPayload = template.expand({
          $root: {
            name: myText
          }
        });
        return CardFactory.adaptiveCard(cardPayload);
  }
}
