import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class SetRolesCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(listroles)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/listroles", description: "List roles." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        const message = answer.message;
        const roles = message.guild.roles.cache.array();
        const channel = message.channel;
        message.reply("Roles are:");
        for (const role of roles) {
            channel.send(`${role.name.replace("@", "(at)")} ${role.id}`);
        }
    }
}