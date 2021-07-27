# Ririchiyo
### A really cool discord.js music bot written in TypeScript.

<br>

## Installation and testing
**NPM** :

```
npm run install:dev
npm test
```
## Configuration
**`.env`**
```txt
DISCORD_TOKEN=YourAweSomeTokenHere
MONGODB_URI=mongodb://user:pass@mongodb.host.com:27017/myDB
```
**`config/colors.ts`** - To change the appearance of the embeds and general colors.

**`config/customEmojis.ts`** - To change the used custom emotes for messages.

**`config/options.ts`** - To change the options passed to constructors.

**`structures/Data/classes`** - [default values for fetched data]

## Commands:

> ---
> ### `ping`
> Displays bot connection stats.
> #### Aliases: `none`
> #### Example:
> ```
> r!ping
> ```
> ---

> ---
> ### `info`
> Displays information about the bot.
> #### Aliases: `i, inf`
> #### Example:
> ```
> r!info
> ```
> ---

> ---
> ### `summon`
> Make the bot join your voice channel.
> #### Aliases: `j, join`
> #### Example:
> ```
> r!summon
> ```
> ---

> ---
> ### `play`
> Play a song using link or query.
> #### Aliases: `p`
> #### Example:
> ```
> r!play Tu hi yaar mera
> ```
> ---

> ---
> ### `pause`
> Pause the player.
> #### Aliases: `none`
> #### Example:
> ```
> r!pause
> ```
> ---

> ---
> ### `resume`
> Resume the player.
> #### Aliases: `none`
> #### Example:
> ```
> r!resume
> ```
> ---

> ---
> ### `shuffle`
> Shuffle the player queue.
> #### Aliases: `shuff`
> #### Example:
> ```
> r!shuffle
> ```
> ---

> ---
> ### `loop`
> Change the player loop state.
> #### Aliases: `l`
> #### Example:
> ```
> r!loop track
> ```
> ---

> ---
> ### `eval`
> Evaluate code.
> #### Aliases: `e, ev`
> #### Example:
> ```
> r!eval ctx.client.user.username;
> ```
> ---

## Selfhosting

You may selfhost (AKA run your own instance of) this bot under the following circumstances:
- Your instance (referred to as a "clone") must be **private**.
- As such, your clone must not be listed on any sort of public bot listing.
- You cannot accept any form of payment for the premium features that you provide while slef hosting this bot.
- You understand that no support will be provided to aid you in self-hosting.

## Contributing

Before **creating an issue**, please ensure that it hasn't already been reported/suggested, and double-check the [F.A.Q](https://discord.styxo.codes/).   
And if you have a question, please ask it in the [Discord server](https://discord.styxo.codes/) instead of opening an issue.
If you wish to contribute to the Ririchiyo codebase or documentation, feel free to fork the repository and submit a pull request!

## License 

Ririchiyo is licensed under the GPL 3.0 license. See the file `LICENSE` for more information. If you plan to use any part of this source code in your own bot, I would be grateful if you would include some form of credit somewhere.

## Contributors

👤 [**TheStyxo**](https://styxo.codes)

- Author
- Website - https://styxo.codes/
- Github: [@TheStyxo](https://github.com/TheStyxo)
