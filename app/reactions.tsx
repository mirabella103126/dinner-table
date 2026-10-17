'use client';
import {useEffect,useRef,useState} from 'react';
import {emojiChoices,isEmoji,matchesEmojiSearch,reactionOf} from '../lib/reactions';
import {SmilePlus} from 'lucide-react';

type Vote={id:string;target?:string;person?:string;type:string;reaction?:string;value?:number};
export function Reactions({target,label,rows,person,onReact}:{target:string;label:string;rows:Vote[];person:string;onReact:(emoji:string)=>void}){
  const [open,setOpen]=useState(false),[finding,setFinding]=useState(false),[query,setQuery]=useState('');
  const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;function dismiss(event:PointerEvent){if(!container.current?.contains(event.target as Node)){setOpen(false);setFinding(false)}}function escape(event:KeyboardEvent){if(event.key==='Escape'){setOpen(false);setFinding(false)}}document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape)}},[open]);
  const votes=rows.filter(r=>r.type==='vote'&&r.target===target);
  const own=votes.find(r=>r.person===person || person==='Devalina'&&r.person==='Wife');
  const groups=new Map<string,number>();
  for(const vote of votes){const emoji=reactionOf(vote);if(emoji)groups.set(emoji,(groups.get(emoji)||0)+1)}
  function choose(emoji:string){onReact(emoji);setOpen(false);setFinding(false);setQuery('')}
  return <div className="reactions" ref={container} aria-label={'Reactions for '+label}>
    <div className="reaction-row">
      {[...groups].map(([emoji,count])=>{const voters=votes.filter(v=>reactionOf(v)===emoji).map(v=>v.person==='Wife'?'Devalina':v.person||'Family member');const names=voters.join(', ');return <span key={emoji} className="reaction-tooltip" data-tooltip={names}><button className={'reaction-pill '+(reactionOf(own||{})===emoji?'mine':'')} aria-label={`${emoji}: ${count} ${count===1?'vote':'votes'} by ${names}. ${reactionOf(own||{})===emoji?'Remove your reaction':'Add your reaction'}`} aria-pressed={reactionOf(own||{})===emoji} onClick={()=>choose(emoji)}><span>{emoji}</span> {count}</button></span>})}
      <button className="reaction-add" aria-label={'Add reaction to '+label} aria-expanded={open} onClick={()=>{setOpen(value=>!value);setFinding(false)}}><SmilePlus aria-hidden="true" size={23}/></button>
    </div>
    {open&&<div className="reaction-popover" role="group" aria-label="Choose a reaction">
      {!finding?<div className="reaction-quick"><button aria-label="Thumbs up" onClick={()=>choose('👍')}>👍</button><button aria-label="Thumbs down" onClick={()=>choose('👎')}>👎</button><button aria-label="Find another reaction" title="Find another reaction" onClick={()=>setFinding(true)}><SmilePlus aria-hidden="true" size={28}/></button></div>:
      <><input autoFocus aria-label="Find an emoji" placeholder="Search or paste any emoji…" value={query} onChange={e=>setQuery(e.target.value)} /><div className="reaction-emoji-grid">{emojiChoices.filter(([,name,aliases])=>matchesEmojiSearch(name,aliases,query)).map(([emoji,name])=><button key={emoji} aria-label={name} title={name} onClick={()=>choose(emoji)}>{emoji}</button>)}{isEmoji(query)&&<button aria-label={'Use '+query} onClick={()=>choose(query.trim())}>{query.trim()}</button>}</div><button className="reaction-find" onClick={()=>setFinding(false)}>Back to thumbs</button></>}
    </div>}
  </div>
}
