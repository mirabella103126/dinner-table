'use client';
import {useEffect,useRef,useState} from 'react';
import {isEmoji} from '../lib/reactions';

const choices:[string,string][]=[
  ['🍽️','Plate'],['🛒','Groceries'],['🥛','Milk'],['🥜','Peanuts'],['🥣','Cereal'],['🫘','Soybeans'],['🍦','Popsicle or ice cream'],['🍔','Burger'],['🍕','Pizza'],['🌮','Taco'],['🌯','Burrito'],['🥪','Sandwich'],['🌭','Hot dog'],['🍟','Fries'],
  ['🥗','Salad'],['🍲','Soup'],['🍜','Noodles'],['🍝','Pasta'],['🍛','Curry'],['🍚','Rice'],['🍣','Sushi'],['🥟','Dumpling'],
  ['🍗','Chicken'],['🥩','Steak'],['🐟','Fish'],['🍤','Shrimp'],['🥦','Broccoli'],['🧀','Cheese'],['🍳','Egg'],['🥞','Pancakes'],
  ['🧇','Waffle'],['🥯','Bagel'],['🍞','Bread'],['🍪','Cookie'],['🧁','Cupcake'],['🍨','Ice cream'],['🥡','Takeout'],['🍴','Fork and knife'],
];

export function MealEmojiPicker({value,automaticEmoji,onChange,itemType='meal'}:{value:string;automaticEmoji:string;onChange:(emoji:string)=>void;itemType?:string}){
  const [open,setOpen]=useState(false),[query,setQuery]=useState('');
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open)return;
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.stopPropagation();setOpen(false)}};
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape,true);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape,true)};
  },[open]);
  const trimmed=query.trim(),filtered=choices.filter(([emoji,label])=>emoji===trimmed||label.toLowerCase().includes(trimmed.toLowerCase()));
  const custom=isEmoji(trimmed)&&!choices.some(([emoji])=>emoji===trimmed);
  function choose(emoji:string){onChange(emoji);setOpen(false);setQuery('')}
  return <div className="meal-emoji-picker" ref={root}>
    <button className="meal-emoji-trigger" type="button" aria-label={'Choose '+itemType+' emoji'} title={value?'Custom emoji: '+value:'Automatic emoji'} aria-expanded={open} onClick={()=>setOpen(current=>!current)}>{value||automaticEmoji}</button>
    {open&&<div className="meal-emoji-popover" role="group" aria-label="Meal emoji picker">
      <input autoFocus aria-label="Search or paste an emoji" placeholder="Search or paste an emoji…" value={query} onChange={event=>setQuery(event.target.value)}/>
      <div className="meal-emoji-options">{filtered.map(([emoji,label])=><button type="button" key={emoji} title={label} aria-label={label} aria-pressed={value===emoji} onClick={()=>choose(emoji)}>{emoji}</button>)}{custom&&<button type="button" aria-label={'Use '+trimmed} onClick={()=>choose(trimmed)}>{trimmed}</button>}</div>
      {!filtered.length&&!custom&&<p>No matching emoji. You can paste one above.</p>}
      <button className="meal-emoji-auto" type="button" onClick={()=>choose('')}>Use automatic emoji ({automaticEmoji})</button>
    </div>}
  </div>;
}
