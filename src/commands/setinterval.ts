import * as cron from "node-cron";
import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class SetInterval implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(setinterval)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/setinterval [CronPatten]", description: "Sets the inteveral at which the bot will assign the roles as a cron patten, leave blank to disable, use 0 * * * * to run hourly." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        const result = msg.replace(this.CMD_REGEXP, "");
        if (cron.validate(result)) {
            answer.setTextOnly(`Setting job schedule to ${result}`);
        } else {
            answer.setTextOnly(`Disabling scheduled jobs`);
        }
        this._bot.logger.debug(`Setting interval to ${result}`);
        this._bot.setJobInterval(result);
        this._bot.saveSettings();
    }
}