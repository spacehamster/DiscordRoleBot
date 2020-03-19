import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class CheckUserCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(checkuser)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/checkuser UserTag", description: "Check if the usertag should receive the role." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        answer.setTitle("Checking User Status");
        const tag = msg.replace(this.CMD_REGEXP, "");
        if (this._bot.userTags.has(tag)) {
            answer.addField("Result", `${tag} should receive role`);
        } else {
            answer.addField("Result", `${tag} should not receive role`);
        }
    }
}