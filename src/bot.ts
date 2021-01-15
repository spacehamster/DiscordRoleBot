import * as Discord from "discord.js";
import * as fs from "fs";
import * as cron from "node-cron";
import * as path from "path";
import { IBot, IBotCommand, IBotConfig, ILogger, ISettings } from "./api";
import { BotMessage } from "./message";

export class Bot implements IBot {
    public get commands(): IBotCommand[] { return this._commands; }

    public get logger() { return this._logger; }

    public role: Discord.Role | null = null;
    public guild: Discord.Guild | null = null;
    public userTags: Set<string> = new Set<string>();
    public loadUserTagsError: string = "";
    public lastJobDate: string | null = null;
    public cronPatten: string | null = null;
    public client: Discord.Client;
    public job: cron.ScheduledTask | null = null;
    private readonly _commands: IBotCommand[] = [];

    private _config: IBotConfig;
    private _logger: ILogger;
    private _botId: string = "";

    constructor(logger: ILogger, config: IBotConfig, commandsPath: string, dataPath: string) {
        this._logger = logger;
        this._config = config;

        this.loadCommands(commandsPath, dataPath);

        if (!this._config.token) { throw new Error("invalid discord token"); }

        this.client = new Discord.Client();

        this.client.on("ready", (() => {
            this._botId = this.client.user.id;
            if (this._config.game) {
                this.client.user.setActivity(this._config.game);
            }
            if (this._config.username && this.client.user.username !== this._config.username) {
                this.client.user.setUsername(this._config.username);
            }
            this.loadSettings();

            this.client.user.setStatus("online");
            this._logger.info("started...");

        }).bind(this));
        this.client.on("guildMemberAdd", (member) => {
            if (this.role !== null &&
                    member.guild === this.guild &&
                    this.userTags.has(member.user.tag)) {
                member.roles.add(this.role)
                    .catch((err) => {
                        this.logger.error(`Error assigning role to ${member.user.tag} on join guild - ${err}`);
                    });
            }
        });
        this.client.on("message", async (message) => {
            if (message.author.id === this._botId) {
                return;
            }
            // Only allow server managers to user the bot
            if (message.member === null || !message.member.hasPermission("MANAGE_GUILD")) {
                return;
            }
            const text = message.cleanContent;
            this._logger.debug(`[${message.author.tag}] ${text}`);
            for (const cmd of this._commands) {
                try {
                    if (cmd.isValid(text)) {
                        const answer = new BotMessage(message);
                        this._logger.debug(`executing command ${cmd.constructor.name}`);
                        await cmd.process(text, answer);
                        if (answer.isValid()) {
                            const msg = answer.text || answer.richText?.title || "Invalid";
                            this._logger.debug(`sending answer ${ msg }`);
                            message.channel.send( answer.text || { embed: answer.richText })
                            .catch((err) => {
                                logger.error(`Error reponding to command ${err}`);
                                message.author.createDM()
                                    .then((channel) => {
                                        const discordError = err as Discord.DiscordAPIError;
                                        let errorMessage = `Error reponding to command ${err}`;
                                        if (discordError && discordError.message === "Missing Permissions") {
                                            errorMessage = "Error reponding to command: Missing permissions";
                                        }
                                        channel.send(errorMessage)
                                        .catch((replyErr) => {
                                            this.logger.error(`Error sending error dm to ${message.author} ${replyErr}`);
                                        });
                                    }).catch((replyErr) => {
                                        this.logger.error(`Error sending error dm to ${message.author} ${replyErr}`);
                                    });
                            });
                        } else {
                            this._logger.debug(`invalid answer`);
                        }
                        break;
                    }
                } catch (ex) {
                    this._logger.error(ex);
                    return;
                }
            }

        });
        this.client.login(this._config.token);
    }
    // tslint:disable-next-line: no-empty
    public start() {

    }

    public giveRole(members: Discord.GuildMember[] | null = null) {
        this.lastJobDate = new Date().toLocaleString("en-AU", { timeZone: "Australia/Sydney" });
        if (members == null) {
            members = this.guild.members.cache
                .filter((m) => this.userTags.has(m.user.tag))
                .filter((m) => !m.roles.cache.has(this.role.id))
                .array();
        }
        this.logger.debug(`Assigning role to ${members.length} members`);
        const addRole = (member) => {
            this.logger.debug(`Assigning role to ${member.user.tag} members`);
            return member.roles.add(this.role);
        };
        members.reduce((previousPromise, nextMember) => {
            return previousPromise.then(() => {
                return addRole(nextMember);
              });
        }, Promise.resolve())
        .catch((err) => {
            this.logger.error(`Error assigning roles ${err}`);
        });
    }

    public setJobInterval(cronPatten: string) {
        if (!cron.validate(cronPatten)) {
            this.cronPatten = null;
        } else {
            this.cronPatten = cronPatten;
        }
        const callback = (() => {
            this.logger.debug(`Hello job ${this.job} status ${this.lastJobDate}`);
            this.giveRole();
          }).bind(this);
        if (this.cronPatten !== null) {
            if (this.job !== null) {
                this.job.stop();
            }
            // Cron format: second (optional) minute hour day month weekday
            //              *                 *      *    *   *     *
            this.job = cron.schedule(cronPatten, callback, {
                scheduled: true,
                timezone: "Australia/Sydney",
            });
            this.job.start();
            this.logger.debug(`Started job ${cronPatten}`);
        } else if (this.job !== null) {
            this.job.stop();
            this.job = null;
        }
    }
    public saveSettings() {
        const settings = {
            cronPatten: this.cronPatten,
            guild: this.guild.id,
            role: this.role.id,
        };
        fs.writeFile("settings.json",  JSON.stringify(settings, null, 2), (err) => {
            if (err) {
                this.logger.error(`Error saving settings: ${err}`);
            }
        });
    }
    private loadSettings() {
        fs.readFile("settings.json", {encoding : "utf-8"}, (err, data) => {
            if (err) {
                this.logger.error(`Error reading settings ${err}`);
            } else {
                const settings = JSON.parse(data) as ISettings;
                this.logger.debug(`Guilds ${this.client.guilds.cache.array()}`);
                this.guild = this.client.guilds.resolve(settings.guild);
                if (this.guild) {
                    this.role = this.guild.roles.resolve(settings.role);
                }
                this.cronPatten = cron.validate(settings.cronPatten) ? settings.cronPatten : null;
                this.logger.debug(`Loaded settings ${settings.guild}, ${settings.role}, ${settings.cronPatten}`);
                this.logger.debug(`Deserialized Settings as ${this.guild}, ${this.role}, ${this.cronPatten}`);
                this.setJobInterval(this.cronPatten);
            }
        });
        fs.readFile("user_tags.txt", {encoding : "utf-8"}, (err, data) => {
            if (err) {
                this.logger.error(`Error reading settings ${err}`);
                this.loadUserTagsError = `${err}`;
            } else {
                this.userTags = new Set<string>(data.split("\n").map((l) => l.trim()));
            }
        });
    }
    private loadCommands(commandsPath: string, dataPath: string) {
        if (!this._config.commands || !Array.isArray(this._config.commands) || this._config.commands.length === 0) {
            throw new Error("Invalid / empty commands list");
        }
        for (const cmdName of this._config.commands) {
            const cmdClass = require(`${commandsPath}/${cmdName}`).default;
            const command = new cmdClass(this, path.resolve(`${dataPath}/${cmdName}`)) as IBotCommand;
            this._commands.push(command);
            this._logger.info(`command "${cmdName}" loaded...`);
        }
    }
}