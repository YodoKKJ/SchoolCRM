// Icons minimal set
const Icon = ({ name, size = 16 }) => {
  const paths = {
    home: <path d="M3 10l7-7 7 7v9a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1z"/>,
    users: <><circle cx="9" cy="7" r="3.5"/><path d="M2 18c0-3.5 3-6 7-6s7 2.5 7 6"/></>,
    book: <><path d="M4 3h10a2 2 0 0 1 2 2v12H6a2 2 0 0 0-2 2z"/><path d="M4 3v16"/></>,
    clipboard: <><rect x="5" y="4" width="10" height="14" rx="1"/><path d="M8 3h4v3H8z"/><path d="M8 9h4M8 12h4M8 15h2"/></>,
    calendar: <><rect x="3" y="5" width="14" height="12" rx="1"/><path d="M3 9h14M7 3v4M13 3v4"/></>,
    chart: <><path d="M3 17V5M3 17h14"/><rect x="6" y="11" width="2" height="6"/><rect x="10" y="8" width="2" height="9"/><rect x="14" y="13" width="2" height="4"/></>,
    dollar: <><path d="M10 3v14M13.5 6.5c0-1.5-1.5-2.5-3.5-2.5s-3.5 1-3.5 2.5S8 9 10 9s3.5.5 3.5 2.5-1.5 2.5-3.5 2.5-3.5-1-3.5-2.5"/></>,
    mail: <><rect x="3" y="5" width="14" height="11" rx="1"/><path d="M3 6l7 5 7-5"/></>,
    settings: <><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"/></>,
    bell: <><path d="M6 8a4 4 0 0 1 8 0v4l2 2H4l2-2z"/><path d="M8 16a2 2 0 0 0 4 0"/></>,
    search: <><circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/></>,
    plus: <path d="M10 4v12M4 10h12"/>,
    chev: <path d="M7 5l5 5-5 5"/>,
    chevDown: <path d="M5 7l5 5 5-5"/>,
    dots: <><circle cx="5" cy="10" r="1.3"/><circle cx="10" cy="10" r="1.3"/><circle cx="15" cy="10" r="1.3"/></>,
    filter: <path d="M3 5h14M6 10h8M9 15h2"/>,
    download: <><path d="M10 3v10M6 9l4 4 4-4M3 17h14"/></>,
    upload: <><path d="M10 14V4M6 8l4-4 4 4M3 17h14"/></>,
    check: <path d="M4 10l4 4 8-8"/>,
    x: <path d="M5 5l10 10M15 5L5 15"/>,
    edit: <path d="M12 3l5 5L8 17H3v-5z"/>,
    trash: <path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>,
    grid: <><rect x="3" y="3" width="6" height="6"/><rect x="11" y="3" width="6" height="6"/><rect x="3" y="11" width="6" height="6"/><rect x="11" y="11" width="6" height="6"/></>,
    list: <><path d="M6 5h12M6 10h12M6 15h12"/><circle cx="3" cy="5" r="1"/><circle cx="3" cy="10" r="1"/><circle cx="3" cy="15" r="1"/></>,
    clock: <><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></>,
    school: <><path d="M2 8l8-4 8 4-8 4z"/><path d="M5 10v4a5 5 0 0 0 10 0v-4"/></>,
    moon: <path d="M15 11a5 5 0 0 1-6-6 5 5 0 1 0 6 6z"/>,
    sun: <><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></>,
    shield: <path d="M10 2l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V5z"/>,
    alert: <><path d="M10 3l8 14H2z"/><path d="M10 9v3M10 15v.1"/></>,
    print: <><rect x="5" y="3" width="10" height="5"/><rect x="3" y="8" width="14" height="7" rx="1"/><rect x="5" y="12" width="10" height="5"/></>,
    whatsapp: <path d="M10 3a7 7 0 0 0-6 10.5L3 17l3.5-1A7 7 0 1 0 10 3zm-2 4c0-.3.2-.5.5-.5h1c.2 0 .4.1.5.3l.5 1.3c.1.2 0 .4-.1.5l-.5.5c.4 1 1.2 1.8 2.2 2.2l.5-.5c.1-.1.3-.2.5-.1l1.3.5c.2.1.3.3.3.5v1c0 .3-.2.5-.5.5C9.9 13 7 10.1 7 8z"/>,
    eye: <><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/></>,
    save: <><path d="M4 4h10l3 3v10H4z"/><rect x="7" y="4" width="6" height="4"/></>,
    info: <><circle cx="10" cy="10" r="7"/><path d="M10 9v5M10 6v.1"/></>,
    user: <><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3 3-5 6-5s6 2 6 5"/></>,
    phone: <path d="M4 4l3-1 2 4-2 1a8 8 0 0 0 5 5l1-2 4 2-1 3a2 2 0 0 1-2 1C8 17 3 12 3 6a2 2 0 0 1 1-2z"/>,
    briefcase: <><rect x="3" y="6" width="14" height="10" rx="1"/><path d="M7 6V4h6v2M3 11h14"/></>,
    link: <><path d="M8 12l4-4M6 10l-1 1a3 3 0 0 0 4 4l1-1M14 10l1-1a3 3 0 0 0-4-4l-1 1"/></>,
  };
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] || null}
    </svg>
  );
};

Object.assign(window, { Icon });
