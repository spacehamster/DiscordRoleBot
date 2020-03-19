import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class SetRolesCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(setrole)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/setrole Role", description: "Set the role you wish to assign members." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        const roleName = msg.replace(this.CMD_REGEXP, "");
        const role = answer.message.guild.roles.cache.filter((r) => r.name === roleName).first();
        if (role){
            answer.setTextOnly(`Setting role to ${role} ${role.id}`);
            this._bot.logger.debug(`Setting role to ${role.name} - ${role}`);
            this._bot.guild = role.guild;
            this._bot.role = role;
            this._bot.saveSettings();
        } else {
            answer.setTextOnly(`Could not find role '${roleName}'`);
        }
    }
}