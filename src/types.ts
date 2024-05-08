export type UserAccount = {
  id: string;
  bank_amount: number;
  casino_winnings: number;
  casino_losses: number;
  username: string;
  salary: number;
  meme_earnings: number;
  [key: string]: any;
}