import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class UserInfoCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(userinfo)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/checkuser Mention or ID", description: "Display info about user." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        answer.setTitle("User Info");
        const arg = msg.replace(this.CMD_REGEXP, "");
        let users = answer.message.mentions.users.array();
        if (users.length === 0) {
            const user = this._bot.client.users.resolve(arg);
            if (user !== null) {
                users = [user];
            }
        }
        if (users.length === 0) {
            answer.addField("Result", `Could not find user ${arg}`);
        } else {
            for (const user of users) {
                const roleMessage = this._bot.userTags.has(user.tag) ?
                    "Should receive role" : "Should not receive role";
                answer.addField("Result", `${user}. Tag ${user.tag}. ${roleMessage}.`);
            }
        }
    }
}