// import { BaseCommand } from '../../structures/Commands/BaseCommand';
// import { GuildMessageCTX, DMMessageCTX } from '../../structures/Commands/CTX';
// import { owners } from '../../config';
// import { Utils, EmbedUtils, ThemeUtils } from '../../structures/Utils';
// import { parser as parse } from 'discord-markdown';
// import { inspect } from 'util';
// import { PasteGG } from 'paste.gg';
// import { Post } from 'paste.gg/typings/interfaces';
// const pasteApi = new PasteGG("fb4b8bf76340458db58f02b5fd702566", {
//     baseUrl: "https://api.paste.gg",
//     mainUrl: "https://paste.gg",
//     version: 1
// });

// const embedTemplate = "**Input{3}**```js\n{0}\n```\n\n**Executed{3} in {1}**\n\n**Result{3}**```js\n{2}\n```";
// const binTemplate = "/**\n * Input{3}\n */\n{0}\n\n//Executed{3} in {1}\n\n/**\n * Result{3}\n */\n{2}";
// const embedTemplateError = "**Input{3}**```js\n{0}\n```\n\n**Error{3}**```diff\n{2}\n```";
// const binTemplateError = "/**\n * Input{3}\n */\n{0}\n\n/**\n * Error{3}\n */\n{2}";
// const embedTemplateLength = embedTemplate.substring(0).replace(/(?<!{){\d+}(?!})/g, "").length;
// const binTemplateLength = binTemplate.substring(0).replace(/(?<!{){\d+}(?!})/g, "").length;
// const embedTemplateErrorLength = embedTemplateError.substring(0).replace(/(?<!{){\d+}(?!})/g, "").length;
// const binTemplateErrorLength = binTemplateError.substring(0).replace(/(?<!{){\d+}(?!})/g, "").length;

// export default class EvalCommand extends BaseCommand {
//     constructor() {
//         super({
//             name: "eval",
//             aliases: ["e", "ev"],
//             category: "dev",
//             description: "Evaluate code",
//             allowSlashCommand: false,
//             allowMessageCommand: true,
//             allowGuildCommand: true,
//             allowDMCommand: true,
//             ownerOnly: true,
//             hidden: true,
//             editable: true
//         });
//     }

//     async run(ctx: GuildMessageCTX | DMMessageCTX) {
//         //Remove invalid edits
//         if (ctx.isEdit && (!ctx.message.previousCommandResponse ||
//             !ctx.message.previousCommandResponse.responseMessage ||
//             ctx.message.previousCommandResponse.responseMessage.deleted)) return;

//         //Make absolutely sure that this is not some random user that's typing this command
//         if (!owners.find(o => o.id === ctx.author.id)) return await ctx.reply({
//             embeds: [EmbedUtils.embedifyString(ctx.guild, "Only the bot owners can use that command!", { isError: true })]
//         });

//         //
//         if (!ctx.args) return await ctx.reply({
//             embeds: [EmbedUtils.embedifyString(ctx.guild, "Provide something to evaluate!", { isError: true })]
//         });

//         //Get multiple blocks of code from the message
//         const codeBlocks = getCodeFromMessage(ctx.message.content.slice(ctx.message.content.indexOf(ctx.args[0])));
//         const results: ExecutionResult[] = [];

//         //Evaluate and generate result for all of the code blocks
//         for (const code of codeBlocks) results.push(await executeCode(code, ctx));

//         const resultStrings: { string: string, isError: boolean }[] = [];

//         //Check if any result string is larger than embed limit
//         const isBin = results.length > 10 || results.some(r => r.length + (r.isError ? embedTemplateErrorLength : embedTemplateLength) + 2 > 4096)

//         for (const [index, { code, result, formattedExecTime, isError }] of results.entries()) resultStrings.push({
//             string: Utils.formatString(isBin ?
//                 (isError ? binTemplateError : binTemplate) :
//                 (isError ? embedTemplateError : embedTemplate),
//                 code,
//                 formattedExecTime ?? "0ms",
//                 result ?? null,
//                 index ? "-" + index + 1 : ""
//             ), isError
//         })

//         let options;
//         if (isBin) {
//             const res = await pasteApi.post(
//                 this.getBinOptions(resultStrings.map(s => s.string).join("\n\n" + Utils.multiplyString(169, "=") + "\n\n"))
//             ).catch(this.client.logger.error);
//             options = {
//                 embeds: [EmbedUtils.embedifyString(null, res?.result?.url ?
//                     `The output was too enormous to send in a text channel, I've added it to **[Paste.GG](${res?.result?.url})**` :
//                     `There was an API error while posting the output to a bin, However the code was executed ${resultStrings.some(r => r.isError) ? "with a few errors" : "and there were no errors :pogU:"}...`,
//                     {
//                         embedColour: (!res?.result?.url || resultStrings.every(r => r.isError) ?
//                             ThemeUtils.colors.get('error') :
//                             (
//                                 resultStrings.some(r => r.isError) ?
//                                     ThemeUtils.colors.get('loading') :
//                                     ThemeUtils.colors.get('success')
//                             ))!.rgbNumber()
//                     }
//                 )]
//             };
//         }
//         else {
//             options = {
//                 embeds: resultStrings.map(({ string, isError }) => EmbedUtils.embedifyString(null, string, {
//                     embedColour: isError ? ThemeUtils.colors.get("error")!.rgbNumber() : ThemeUtils.colors.get("success")!.rgbNumber()
//                 }))
//             }
//         }

//         await ctx.reply(options);
//     }

//     private getBinOptions(value: string): Post {
//         return {
//             name: this.client.user.username + "Eval Result",
//             description: "Just an eval result bruh..",
//             visibility: "unlisted",
//             files: [{ name: "Eval.js", content: { format: "text", highlight_language: "typescript", value } }]
//         };
//     }
// }

// function getCodeFromMessage(content: string) {
//     const parsedContent = parse(content).filter(e => e.type === "codeBlock" || e.type === "inlineCode").map(b => b.content as string);
//     return parsedContent.length ? parsedContent : [content];
// }

// async function executeCode(code: string, ctx: GuildMessageCTX | DMMessageCTX): Promise<ExecutionResult> {
//     try {
//         const start = process.hrtime();
//         let result: string = await eval(code);
//         if (typeof result !== "string") result = inspect(result);
//         const execTime = process.hrtime(start);
//         const formattedExecTime = `${execTime[0] > 0 ? `${execTime[0]}s ` : ""}${execTime[1] / 1e6}ms`;
//         return {
//             code,
//             result,
//             execTime: process.hrtime(start),
//             formattedExecTime,
//             isError: false,
//             length: code.length + result.length + formattedExecTime.toString().length
//         };
//     } catch (error) {
//         return {
//             code,
//             result: error.message,
//             isError: true,
//             length: code.length + (error.message?.length ?? 0)
//         };
//     }
// }

// export interface ExecutionResult {
//     code: string,
//     result?: string,
//     execTime?: [number, number],
//     formattedExecTime?: string,
//     isError: boolean,
//     length: number
// }
