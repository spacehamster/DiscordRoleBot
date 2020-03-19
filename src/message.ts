import * as Discord from "discord.js";

export class BotMessage {
    public readonly user: Discord.User;
    public readonly message: Discord.Message | Discord.PartialMessage;
    public richText?: Discord.MessageEmbed;
    public text?: string;

    constructor(message: Discord.Message | Discord.PartialMessage) {
        this.message = message;
        this.user = message.author;
    }

    public isValid(): boolean {
        return (this.text !== null && this.text !== undefined) ||
                (this.richText !== null && this.richText !== undefined);
    }

    public setTextOnly(text: string): BotMessage {
        if (this.richText) { throw new Error("one of rich text methods was used"); }
        this.text = text;
        return this;
    }

    public addField(name: string, value: string): BotMessage {
        this.validateRichText().addField(name, value);
        return this;
    }

    public addBlankField(): BotMessage {
        throw new Error("Not Implemented");
        // this.validateRichText().addBlankField();
        return this;
    }

    public setColor(color: string | number | [number, number, number]): BotMessage {
        this.validateRichText().setColor(color);
        return this;
    }

    public setDescription(description: string): BotMessage {
        this.validateRichText().setDescription(description);
        return this;
    }

    public setFooter(text: string, icon?: string | undefined): BotMessage {
        this.validateRichText().setFooter(text, icon);
        return this;
    }

    public setImage(url: string): BotMessage {
        this.validateRichText().setImage(url);
        return this;
    }

    public setThumbnail(url: string): BotMessage {
        this.validateRichText().setThumbnail(url);
        return this;
    }

    public setTitle(title: string): BotMessage {
        this.validateRichText().setTitle(title);
        return this;
    }

    public setURL(url: string): BotMessage {
        this.validateRichText().setURL(url);
        return this;
    }

    private validateRichText(): Discord.MessageEmbed {
        if (this.text) { throw new Error("setTextOnly method was used"); }
        if (!this.richText) { this.richText = new Discord.MessageEmbed(); }
        return this.richText;
    }
}
