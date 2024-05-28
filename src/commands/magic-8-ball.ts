import { ChatInputCommandInteraction } from "discord.js";
import { AppCommand } from "../types.js";
import { SlashCommandBuilder } from 'discord.js';

type QuestionType = 'What' | 'Where' | 'Will' | 'How' | 'When' | 'Why' | 'Should' | 'Do' | 'Is' | 'How much' | 'Who' | 'Which' | 'Are' | 'What if';
const whatResponses = [
	"I'm not quite sure.",
	"It's hard to say.",
	"You may never know.",
	"Time will reveal the answer.",
	"That's a secret.",
	"Ask again later.",
	"Focus and ask again.",
	"The answer is just around the corner.",
	"The future is not clear.",
	"It's better not to tell you now.",
	"The answer is a mystery.",
	"Patience is your ally.",
	"That will be revealed in due time.",
	"Concentrate and ask again.",
	"I cannot reveal that right now."
];
const whereResponses = [
	"Far, far away.",
	"Closer than you think.",
	"In a place you least expect.",
	"Where you last left it.",
	"In the heart of the unknown.",
	"Somewhere special.",
	"Not here, that's for sure.",
	"At the end of the journey.",
	"In a land far beyond.",
	"Hidden in plain sight.",
	"Where dreams come true.",
	"In a secret location.",
	"Lost to the ages.",
	"Right behind you.",
	"In a place only you can find."
];
const willResponses = [
	"It is certain.",
	"It is decidedly so.",
	"Without a doubt.",
	"Yes, definitely.",
	"You may rely on it.",
	"As I see it, yes.",
	"Most likely.",
	"Outlook good.",
	"Yes.",
	"Signs point to yes.",
	"Reply hazy, try again.",
	"Ask again later.",
	"Better not tell you now.",
	"Cannot predict now.",
	"Don't count on it.",
	"My reply is no.",
	"My sources say no.",
	"Outlook not so good.",
	"Very doubtful."
];
const howResponses = [
	"In ways you cannot imagine.",
	"Through a series of unexpected events.",
	"Slowly but surely.",
	"With great effort.",
	"More easily than expected.",
	"By taking one step at a time.",
	"With a little help from your friends.",
	"Mysteriously and magically.",
	"By letting things take their natural course.",
	"Through persistence and dedication.",
	"It will require some creativity.",
	"With patience and perseverance.",
	"By making the right choices.",
	"Unexpectedly fast.",
	"It's not clear yet how."
];
const whenResponses = [
	"Sooner than you expect.",
	"Later than you hope.",
	"At the perfect time.",
	"In the near future.",
	"It's not the right time yet.",
	"Patience will be rewarded.",
	"In a moment of serendipity.",
	"When the stars align.",
	"In the next few days.",
	"In due time.",
	"When you least expect it.",
	"It is destined to happen soon.",
	"Perhaps sooner than you think.",
	"Not in the foreseeable future.",
	"The timing is uncertain."
];
const whyResponses = [
	"It's a mystery.",
	"Only time will tell.",
	"That's just the way it is.",
	"For reasons unknown.",
	"To test your resolve.",
	"It's part of a bigger plan.",
	"To challenge your assumptions.",
	"The reasons are not clear yet.",
	"To lead you to new experiences.",
	"Because it was meant to be.",
	"To teach an important lesson.",
	"Fate has its reasons.",
	"That is still to be revealed.",
	"Because you needed to ask.",
	"It's beyond understanding for now."
];
const modalResponses = [
	"Yes, definitely.",
	"It would be wise.",
	"Absolutely.",
	"Consider it carefully.",
	"Yes, but wait for the right moment.",
	"Not right now.",
	"It's better not to.",
	"Probably not.",
	"You might reconsider.",
	"No, think of other options.",
	"It's not worth the risk.",
	"Yes, take the leap.",
	"Only if you feel strongly about it.",
	"Seek more advice first.",
	"No, hold off for now."
];
const isResponses = [
	"Yes, definitely.",
	"It is certain.",
	"Undoubtedly so.",
	"Yes, in every way.",
	"Absolutely.",
	"The signs say yes.",
	"Most likely.",
	"The prospects are good.",
	"Yes.",
	"All indications point to yes.",
	"The answer is unclear, ask again.",
	"It's better not to tell you now.",
	"Cannot predict now.",
	"Don't count on it.",
	"No, certainly not.",
	"Very doubtful.",
	"Unlikely.",
	"The odds aren't good.",
	"No."
];
const doResponses = [
	"Yes, you should.",
	"Go for it.",
	"Definitely.",
	"Now is a good time.",
	"It seems promising.",
	"The outcome will be positive.",
	"Yes, take action.",
	"Do it with confidence.",
	"Sure, why not?",
	"Yes, but be cautious.",
	"Think it over first.",
	"Maybe not today.",
	"It's not the best idea.",
	"Reconsider your approach.",
	"No, it might not be the best move."
];

const howMuchResponses = [
	"More than you expect.",
	"Less than you hope.",
	"Just the right amount.",
	"A significant amount.",
	"Not much at all.",
	"Enough to make a difference.",
	"A small but significant sum.",
	"Considerably more than now.",
	"Barely noticeable.",
	"More than last time.",
	"Less than usual.",
	"Enough to be noticeable.",
	"A lot, think twice.",
	"Hardly anything.",
	"It's immeasurable."
];
const whoResponses = [
	"Someone close to you.",
	"A person you haven't met yet.",
	"An old friend.",
	"A new acquaintance.",
	"Someone unexpected.",
	"A person who means well.",
	"Someone with good intentions.",
	"A person from your past.",
	"Someone who will surprise you.",
	"A stranger who will become important.",
	"Someone you see every day.",
	"A person you rarely think about.",
	"Someone who has been thinking of you.",
	"An ally in your endeavors.",
	"A hidden adversary."
];
const whichResponses = [
	"The first option.",
	"The last option you considered.",
	"The least obvious choice.",
	"The one that feels right.",
	"The most challenging one.",
	"The safest choice.",
	"The one that will test you.",
	"The most rewarding in the long run.",
	"The choice closest to your heart.",
	"The one that others advise against.",
	"The option that scares you the most.",
	"The most practical choice.",
	"The one that will bring you peace.",
	"The choice that seems hardest.",
	"The one you're already leaning towards."
];
const areResponses = [
	"Yes, definitely.",
	"Certainly.",
	"Indeed, they are.",
	"Yes, they all are.",
	"Most likely, yes.",
	"It seems so.",
	"The signs point to yes.",
	"Perhaps, but not certainly.",
	"The answer is not clear.",
	"Maybe not.",
	"Probably not.",
	"It doesn't look like it.",
	"No, they aren't.",
	"Definitely not.",
	"Absolutely not."
];
const whatIfResponses = [
	"Then you'll see a new perspective.",
	"It could open up new possibilities.",
	"Then unexpected doors will open.",
	"It might change everything.",
	"You may be surprised by the outcome.",
	"Then you'll find what you're looking for.",
	"It could lead to great adventures.",
	"You might face some challenges.",
	"Then it could be a turning point.",
	"You might need to be prepared for anything.",
	"It could be the best thing for you.",
	"Then you'll need to make a tough decision.",
	"You might regret it, or you might rejoice.",
	"Then you will grow in ways you never imagined.",
	"It could complicate things, or simplify them."
];
const genericResponses = [
	"It's hard to say.",
	"I'm not sure about that.",
	"That's a good question.",
	"I don't have enough information to answer that.",
	"Let's think about that a bit more.",
	"Can you provide more details?",
	"That's something to consider.",
	"Interesting question!",
	"I need more context to give a proper answer.",
	"It's uncertain.",
	"Let's explore that together.",
	"That's a complex issue.",
	"More research is needed on that.",
	"It's difficult to predict.",
	"That depends on many factors."
];

function answerQuestion(question: string) {
	question = question.toLowerCase();
	const words = question.split(' ');
	const firstWord = words[0];

	let responsePool: string[];

	if (firstWord === 'how' && question.includes('how much')) {
		responsePool = howMuchResponses;
	} else if (firstWord === 'what' && question.startsWith('what if')) {
		responsePool = whatIfResponses;
	} else if (firstWord === 'should' || firstWord === 'can' || firstWord === 'could') {
		responsePool = modalResponses;
	} else {
		switch (firstWord) {
			case 'what':
				responsePool = whatResponses;
				break;
			case 'where':
				responsePool = whereResponses;
				break;
			case 'will':
				responsePool = willResponses;
				break;
			case 'how':
				responsePool = howResponses;
				break;
			case 'when':
				responsePool = whenResponses;
				break;
			case 'why':
				responsePool = whyResponses;
				break;
			case 'do':
				responsePool = doResponses;
				break;
			case 'is':
				responsePool = isResponses;
				break;
			case 'who':
				responsePool = whoResponses;
				break;
			case 'which':
				responsePool = whichResponses;
				break;
			case 'are':
				responsePool = areResponses;
				break;
			default:
					responsePool = genericResponses;
				break;
		}
	}
	return responsePool[Math.floor(Math.random() * responsePool.length)];
}

export const CommandCrystalBall: AppCommand = {
	async execute(interaction: ChatInputCommandInteraction) {
		let question = interaction.options.getString("question", true);
		let answer = answerQuestion(question);
		let response = `<@${interaction.user.id}> asked: ${question}\n${answer}`;
		await interaction.reply(response);
	},
};