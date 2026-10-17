export const emojiChoices = [
  ['❤️','Red heart','love'], ['😂','Face with tears of joy','laughing funny'], ['😋','Face savoring food','yum'], ['😍','Smiling face with heart-eyes','love it'], ['🤔','Thinking face'],
  ['😮','Face with open mouth','surprised'], ['😢','Crying face','sad'], ['😡','Enraged face','angry'], ['🔥','Fire','great'], ['🎉','Party popper','celebrate'],
  ['👏','Clapping hands','applause'], ['🙌','Raising hands','raised hands hooray'], ['🤤','Drooling face','craving'], ['🥰','Smiling face with hearts','adore'], ['😎','Smiling face with sunglasses','cool'],
  ['✅','Check mark button','green check tick yes correct'], ['❌','Cross mark','red x red cross x mark cancel wrong no'], ['🍽️','Fork and knife with plate','dinner utensils'], ['🍕','Pizza'], ['🥗','Green salad'],
  ['🌮','Taco'], ['🐟','Fish'], ['🍜','Steaming bowl','noodles'], ['🍔','Hamburger','burger'], ['🍣','Sushi'],
  ['💯','Hundred points','red 100 one hundred perfect'], ['🙏','Folded hands','please thanks prayer'], ['🙂','Slightly smiling face','smile happy'], ['😐','Neutral face'], ['😬','Grimacing face','unsure awkward'],
] as const;

export function matchesEmojiSearch(name:string,aliases:string|undefined,query:string):boolean {
  const terms=query.toLocaleLowerCase().trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const searchable=(name+' '+(aliases||'')).toLocaleLowerCase();
  return terms.every(term=>searchable.includes(term));
}

export function reactionOf(value:unknown):string {
  if(!value || typeof value!=='object') return '';
  const v=value as {reaction?:unknown;value?:unknown};
  if(typeof v.reaction==='string') return v.reaction;
  return v.value===1?'👍':v.value===-1?'👎':'';
}

export function isEmoji(value:string):boolean {
  const chars=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(value.trim())];
  return chars.length===1 && value.length<=24 && /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(value);
}
