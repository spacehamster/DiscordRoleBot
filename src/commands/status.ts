import { IBot, IBotCommand, IBotCommandHelp, IBotMessage } from "../api";

export default class StatusCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\/(status)(?: |$)/im;
    private _bot: IBot;

    constructor(bot: IBot, dataPath: string) {
        this._bot = bot;
    }

    public getHelp(): IBotCommandHelp {
        return { caption: "/status", description: "Display bot status." };
    }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg);
    }

    public async process(msg: string, answer: IBotMessage): Promise<void> {
        this._bot.logger.debug("Processing Status Command");
        try {
            answer.setTitle("Status");
            answer.addField("Guild", `${this._bot.guild}`);
            answer.addField("Role", `${this._bot.role}`);
            answer.addField("Users", `There are ${this._bot.userTags.size} users in the user list`);
            if (this._bot.guild) {
                const members = await this._bot.guild.members.fetch();
                const assigned = members.filter((m) => m.roles.cache.has(this._bot.role.id));
                answer.addField("Users Assigned", `Role assigned to ${assigned.size} of ${members.size} guild members`);
            }
            answer.addField("Job Schedule", `${this._bot.cronPatten ?? "Not Set"}`);
            answer.addField("Last Ran", `${this._bot.lastJobDate ?? "Never"}`);
            if (this._bot.loadUserTagsError) {
                answer.addField("Error", this._bot.loadUserTagsError);
            }
            if (this._bot.guild) {
                const botMember = this._bot.guild.members.resolve(this._bot.client.user.id);
                if (!botMember.permissions.has("MANAGE_ROLES")) {
                    answer.addField("Warning", `Bot does not have manage roles permission`);
                }
                if (botMember.roles.highest.rawPosition <= this._bot.role.rawPosition) {
                    answer.addField("Warning", `Role ${botMember.roles.highest} must be higher then ${this._bot.role} to assign roles`);
                }
            }
        } catch (e) {
            this._bot.logger.error(e);
            answer.addField("Error", `${e}`);
        }
    }
}