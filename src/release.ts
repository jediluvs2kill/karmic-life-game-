/** Update alongside package.json/package-lock.json and RELEASES.md for each release. */
export const release={version:'0.2.0',name:'Island Walker',date:'2026-09-23',truthState:'COMPLETED_BUILD'} as const;
export const releaseTitle=`Karmic Life Game OS v${release.version} — ${release.name}`;
export const roadmap=[
 {version:'0.3.0',name:'Island Visits',state:'USER_IDEA',status:'Planned',description:'Visit another user’s island by invitation, initially as a read-only guest. Requires accounts, world ownership, permissions and a hosted world service.'},
 {version:'0.4.0',name:'Shared Worlds',state:'USER_IDEA',status:'Planned',description:'Collaborate around a host island with explicit builder permissions, attributed contributions, host review and conflict handling. Live multiplayer is future work.'}
] as const;
