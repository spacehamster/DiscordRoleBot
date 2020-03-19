import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class HelpCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(help)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/help", description: "Print help." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        answer.setTitle("List of Supported Commands:");
        for (const cmd of this._bot.commands) {
            const help = cmd.getHelp();
            if (help.caption) {
                answer.addField(help.caption, help.description);
            }
        }
    }
}