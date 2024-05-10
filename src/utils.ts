import fs from 'node:fs';
import path from 'node:path';
import { Routes, Collection, Embed, ActionRowBuilder, SelectMenuBuilder, TextInputBuilder, Client, SlashCommandBuilder, ChatInputCommandInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandOptionsOnlyBuilder } from 'discord.js';

export class Utils {
  static createSelectOptions(options: string[]) {
    let builders = [];
    for (let option of options) {
      let builder = new StringSelectMenuOptionBuilder();
      builder.setLabel(option);
      builder.setValue(option.toLowerCase());
      builders.push(builder);
    }
    return builders;
  }

  static createSelectMenu(customId: string, options: string[], placeholder: string) {
    let selectMenu = new StringSelectMenuBuilder();
    selectMenu.setCustomId(customId);
    selectMenu.addOptions(Utils.createSelectOptions(options));
    if (placeholder) selectMenu.setPlaceholder(placeholder);
    return new ActionRowBuilder().addComponents(selectMenu);
  }
  
  static createUpdatedSelectMenu(customId: string, options: string[], selectedValue: string) {
    // let newOptions = structuredClone(options);
    // let selectedOption = newOptions.find(option => option.value === selectedValue);
    // selectedOption.default = true;
  
    // // reconstruct the select menu, this time updating the selected value
    // return Utils.createSelectMenu(customId, newOptions);
  }

  static createInputField(customId: string, placeholder: string, min: number, max: number) {
    let inputField = new TextInputBuilder();
    inputField.setCustomId(customId);
    inputField.setPlaceholder(placeholder);
    if (min !== undefined) inputField.setMinLength(min);
    if (max !== undefined) inputField.setMaxLength(max);
    return new ActionRowBuilder().addComponents(inputField);
  }

  static formatCurrency(val: number) {
    return (val / 100).toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  static Time = {
    MINUTE5: 1000 * 60 * 5,
    MINUTE15: 1000 * 60 * 15,
    MINUTE30: 1000 * 60 * 30,
    HOUR1: 1000 * 60 * 60,
    HOUR2: 1000 * 60 * 60 * 2,
    HOUR4: 1000 * 60 * 60 * 4,
    HOUR8: 1000 * 60 * 60 * 8,
    DAY1: 1000 * 60 * 60 * 24,
    DAY3: 1000 * 60 * 60 * 24 * 3,
    WEEK1: 1000 * 60 * 60 * 24 * 7,
  }

  static Units = {
    bank: "Emporeum",
    bankPrefix: "**𝔼**"
  }
}