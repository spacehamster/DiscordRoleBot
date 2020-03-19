import * as Discord from "discord.js";
export interface ILoggerMethod {
    (msg: string, ...args: any[]): void;
    (obj: object, msg?: string, ...args: any[]): void;
}

export interface ILogger {
    debug: ILoggerMethod;
    info: ILoggerMethod;
    warn: ILoggerMethod;
    error: ILoggerMethod;
}

export interface IBotConfig {
    token: string;
    commands: string[];
    game?: string;
    username?: string;
    idiots?: string[];
    idiotAnswer?: string;
}

export interface IBotCommandHelp {
    caption: string;
    description: string;
}

export interface IBot {
    client: Discord.Client;
    guild: Discord.Guild | null;
    role: Discord.Role | null;
    userTags: Set<string>;
    loadUserTagsError: string;
    lastJobDate: string | null;
    cronPatten: string | null;
    readonly commands: IBotCommand[];
    readonly logger: ILogger  | null;
    saveSettings(): void;
    start(): void;
    setJobInterval(cronPatten: string): void;
    giveRole(): void;
}

export interface IBotCommand {
    getHelp(): IBotCommandHelp;
    isValid(msg: string): boolean;
    process(msg: string, answer: IBotMessage): Promise<void>;
}

export interface IUser {
    id: string;
    username: string;
    discriminator: string;
    tag: string;
}

export interface ISettings {
    guild: string;
    role: string;
    cronPatten: string | null;
}

type MessageColor =
    [number, number, number]
    | number
    | string;

export interface IBotMessage {
    readonly user: Discord.User;
    readonly message: Discord.Message | Discord.PartialMessage;
    setTextOnly(text: string): IBotMessage;
    addField(name: string, value: string): IBotMessage;
    addBlankField(): IBotMessage;
    setColor(color: MessageColor): IBotMessage;
    setDescription(description: string): IBotMessage;
    setFooter(text: string, icon?: string): IBotMessage;
    setImage(url: string): IBotMessage;
    setThumbnail(url: string): IBotMessage;
    setTitle(title: string): IBotMessage;
    setURL(url: string): IBotMessage;
}
