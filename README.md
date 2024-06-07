# Discord Enhancement Suite

Welcome to the **Regal Steward** repository! This app aims to be easily extended by anyone who wants to configure their own version.

## Features

- **Hourly Wages**
- **Tip your friends**
- **Casino games and gambling**
- **Lottery**
- **Meme Economy (WIP)**

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/alan00zhang/discord-bot.git
   ```

2. Install dependencies:
   ```bash
   cd regal-steward
   npm install
   ```

3. Configure your bot with your Discord token in a `.env` file:
   ```env
   DISCORD_TOKEN=your_token_here
   ```

4. Run the build script and create the database:
   ```bash
   npm run build
   cp regal-steward-template.db regal-steward.db
   ```

5. Start the bot:
   ```bash
   pm2 start ./dist/app.js
   ```

## Contributing

Feel free to open issues or submit pull requests. Contributions are welcome!

---

Regal Steward is at your service! 🎉