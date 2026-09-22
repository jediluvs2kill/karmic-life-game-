export type NpcAction='train'|'deliver'|'build'|'garden'|'play'|'inspect'|'explore'|'greet'|'rest';
export type NpcMood='focused'|'curious'|'cheerful'|'calm'|'social';
export type NpcDecision={id:string;action:NpcAction;mood:NpcMood;line:string;confidence:number};
export type NpcMindState={provider:string;mode:'jev'|'simulation';live:boolean;updatedAt:string;decisions:NpcDecision[];lastError:string};

export function validNpcDecision(value:unknown):value is NpcDecision{
 if(!value||typeof value!=='object')return false;const item=value as Record<string,unknown>;
 return typeof item.id==='string'&&['train','deliver','build','garden','play','inspect','explore','greet','rest'].includes(String(item.action))&&['focused','curious','cheerful','calm','social'].includes(String(item.mood))&&typeof item.line==='string'&&typeof item.confidence==='number'&&Number.isFinite(item.confidence);
}

export function watchNpcMinds(update:(state:NpcMindState)=>void,offline:()=>void){
 let busy=false;
 async function poll(){if(busy||document.hidden)return;busy=true;try{const response=await fetch('/api/npc-minds');if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw new Error('offline');const state=await response.json() as NpcMindState;if(!Array.isArray(state.decisions)||!state.decisions.every(validNpcDecision))throw new Error('invalid');update(state);}catch{offline();}finally{busy=false;}}
 void poll();return setInterval(poll,3000);
}
