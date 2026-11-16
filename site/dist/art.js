const shapes={
 book:'<path d="M12 6C9 4 5.5 4 2.5 4.5v14C6 18 9 18 12 20c3-2 6-2 9.5-1.5v-14C18.5 4 15 4 12 6Zm0 0v14"/>',
 star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/>',
 moon:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.6 8.6 0 1 0 20.5 14Z"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5.5 5.5"/>',
 route:'<circle cx="5" cy="17" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 17h4a3 3 0 0 0 0-6H9a2.5 2.5 0 0 1 0-5h8"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12M3 6h1M3 12h1M3 18h1"/>',
 resize:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5M9 20H4v-5"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
};
export const icon=(key,size=18)=>'<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shapes[key]+'</svg>';

