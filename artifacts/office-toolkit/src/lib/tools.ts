export type ToolCategory = "esignature" | "invoice";

export type ToolTheme = {
  primary: string;
  bg: string;
};

export type ToolUseCase = {
  slug: string;
  title: string;
  category: ToolCategory;
  theme: ToolTheme;
  intro: string;
  steps: string[];
  stepsHeading?: string;
  faq: { q: string; a: string }[];
  relatedTool: { label: string; href: string };
  metaTitle: string;
  metaDescription: string;
};

export const toolUseCases: ToolUseCase[] = [
  {
    slug: "esignature-for-word",
    title: "E-signature for Word Document",
    category: "esignature",
    theme: { primary: "#1B4F9C", bg: "#EEF3FB" },
    intro:
      "Need an e-signature for word document files without printing, signing and scanning? Most formal office documents start life as .docx files — appointment confirmations, dealer agreements, no-objection letters and renewal notes all arrive in Word format. Signing one used to mean printing it out, signing by hand, scanning the pages and mailing everything back. A signature can now be placed on a Word document directly in the browser, and the signed copy is exported as a clean PDF. Office staff and small business owners use this to sign and return files the same morning. The document stays on your device until you export it, so nothing gets uploaded anywhere.",
    steps: [
      "Open your .docx in the browser tool and jump to the page that needs signing.",
      "Create your signature once — draw it, type it, or upload a saved image.",
      "Place the signature on the closing line, next to the company name or your name.",
      "Export the signed copy as a PDF and mail it to the other side.",
    ],
    stepsHeading: "How to add a digital signature online free",
    faq: [
      { q: "Kya Word file ki formatting signing ke baad kharab ho sakti hai?", a: "Nahi. Signed copy ek PDF ke roop me banti hai, isliye fonts, spacing aur tables bilkul waisa hi dikhte hain jaisa aapne rakha tha." },
      { q: "Kya ek hi Word file par do alag signatures lag sakte hain — officer aur manager ke?", a: "Haan, jitne log sign karein, sab apna-apna signature file par laga sakte hain." },
      { q: "Kya signature ke saath date ya company ka naam add ho sakta hai?", a: "Haan, typing se date, naam aur koi note signature ke paas likha ja sakta hai." },
      { q: "Kya client ko raw Word file bhejna theek hai?", a: "Signed copy PDF me export karke bhejo, kyunki koi bhi Word file kholkar badal sakta hai — signed PDF hi final hoti hai." },
      { q: "Kya koi app install karna ya account banana zaroori hai?", a: "Nahi. Tool browser me hi chalta hai aur koi software download nahi hota." },
    ],
    relatedTool: { label: "Use the free e-signature tool to sign documents", href: "/e-signature-maker" },
    metaTitle: "E-signature for Word Document – Digital Signature Online Free",
    metaDescription:
      "Add an e-signature for word document in the browser — draw, type or upload your mark, place it anywhere, and export a clean signed PDF. A digital signature online free, private and account-free.",
  },
  {
    slug: "esignature-for-excel",
    title: "Sign Excel File Online",
    category: "esignature",
    theme: { primary: "#1E7145", bg: "#EDF7F0" },
    intro:
      "Spreadsheets carry the numbers an office actually runs on — payment trackers, stock counts, attendance sheets and monthly budgets all sit inside .xlsx files. Approving those sheets used to mean printing them out, signing the corner by hand and scanning everything back. You can now sign excel file online directly in the browser without touching the data inside it. Accountants, store supervisors and office assistants use this when a senior or partner approves a monthly file. The signed copy exports as a PDF, so the values, formulas and layout stay readable for whoever keeps the approved version.",
    steps: [
      "Take your .xlsx file and open the e-signature tool in the browser.",
      "Create your signature once — typed, drawn, or uploaded from a saved sign.",
      "Place it near the approval row, the manager box, or the final totals column.",
      "Export the sheet as a PDF with the exact same layout and share it.",
    ],
    stepsHeading: "Add an electronic signature online, without touching the data",
    faq: [
      { q: "Kya signing se sheet ke formulas ya totals kharab ho sakte hain?", a: "Nahi. Aap sheet ko PDF me export karte ho; asal workbook bilkul unchanged rehti hai." },
      { q: "Kya ek hi sheet par ek se zyada approval signatures lag sakte hain?", a: "Haan — boss, cashier, partner, jitne chahiye utne laga sakte ho." },
      { q: "Kya approved copy auditor ya partner ko dene ke liye safe hai?", a: "PDF copy safe hai, kyunki raw .xlsx koi kholkar badal sakta hai. Signed PDF hi final record hai." },
      { q: "Kya bina print kiye aur bina pen ke pura process ho sakta hai?", a: "Haan, pura kaam browser me hota hai — sign lagao, export karo, mail bhejo." },
    ],
    relatedTool: { label: "Use the free e-signature tool to sign Excel files", href: "/e-signature-maker" },
    metaTitle: "Sign Excel File Online – Electronic Signature Online",
    metaDescription:
      "Sign Excel file online for free — add an electronic signature online to your .xlsx without touching the data, then export a clean signed PDF. No account or install needed.",
  },
  {
    slug: "esignature-for-pdf",
    title: "Sign PDF Online Free",
    category: "esignature",
    theme: { primary: "#B3261E", bg: "#FDEDEC" },
    intro:
      "PDF is the format nearly every signed document arrives in — government forms, vendor contracts, bank letters and rental papers all come as PDFs because pages look the same on every screen. Signing one used to require a paid reader, a printer or a portal account. You can now sign pdf online free directly in the browser, including multi-page files where every page needs a mark. Dealers, consultants and office staff use this to clear pending documents promptly. Nothing is uploaded anywhere, and the signed PDF stays exactly as received, only with your signature added where you place it.",
    steps: [
      "Open the received PDF in the tool directly from your browser.",
      "Make your signature by drawing, typing, or uploading an image.",
      "Place it on each page where a sign, initial, or date is needed.",
      "Download the signed PDF and reply to the sender with the attachment.",
    ],
    stepsHeading: "How to sign a PDF online free, in four steps",
    faq: [
      { q: "Kya multi-page PDF par har page alag sign lag sakta hai?", a: "Haan, jitne pages par zaroorat ho, har page par sign laga sakte ho." },
      { q: "Kya fillable form wale PDF bhi sign ho sakte hain?", a: "Haan, form fields wala document khol ke sign lagana theek kaam karta hai, signed copy PDF me hi export hoti hai." },
      { q: "Kya original quality final copy me bhi bani rehti hai?", a: "Haan, text, charts aur images sab sahi rehte hain, sirf aapka signature add hota hai." },
      { q: "Kya bina account ke bhi sign kiya ja sakta hai?", a: "Haan, koi signup ya login nahi — browser kholo, sign karo, download karo." },
    ],
    relatedTool: { label: "Use the free e-signature tool to sign PDFs", href: "/e-signature-maker" },
    metaTitle: "Sign PDF Online Free – No Account Needed",
    metaDescription:
      "Sign pdf online free — upload the document, draw or type your mark, place it and download a clean signed copy. Fast, private, and no account needed.",
  },
  {
    slug: "esignature-for-contracts",
    title: "Sign Contract Online Free",
    category: "esignature",
    theme: { primary: "#263447", bg: "#EEF1F5" },
    intro:
      "Contracts decide when work begins and when payment moves — vendor agreements, dealer terms, rent papers and service contracts all move only after both sides sign. Ink and paper turns a two-day yes into a two-week wait when the other party sits in another city. Digital signing lets each side sign in the browser, with the party name and date typed next to the signature for a clean record. With this approach you can sign contract online free and close agreements the same day. Property dealers, consultants and business owners use this instead of chasing couriers. The finished contract can be filed digitally or shared with a lawyer for a second reading.",
    steps: [
      "Upload the agreement PDF, or the final Word version both sides agreed on.",
      "Draw your signature and type the party name and date beside it.",
      "Place the signature and date on every clause page that needs a mark.",
      "Export the signed contract and send a copy to each party.",
    ],
    stepsHeading: "Digital signature for agreements, in four steps",
    faq: [
      { q: "Kya contract ke har page par sign aur date lagana zaroori hai?", a: "Jitne page cover karne ho sab par laga sakte ho; sabse important wo hain jahan signature lines hain." },
      { q: "Kya dono parties apne-alag devices se sign kar sakti hain?", a: "Haan, ek file pehli party sign kare, phir us signed copy par doosri party apna sign jod de." },
      { q: "Kya witness ka naam aur date bhi add ho sakta hai?", a: "Haan, typing se witness line ke paas naam aur date likh sakte ho." },
      { q: "Kya digitally signed contract legally recognised hai?", a: "Commercial agreements me e-signature ka use aam hai. Kisi bade legal matter me apne lawyer se confirm kar lena." },
    ],
    relatedTool: { label: "Use the free e-signature tool to sign contracts", href: "/e-signature-maker" },
    metaTitle: "Sign Contract Online Free – Digital Signature for Agreements",
    metaDescription:
      "Sign contract online free — place signatures, party names and dates on every page, then export a clean signed PDF. A digital signature for agreements that needs no printing or account.",
  },
  {
    slug: "esignature-for-offer-letter",
    title: "Sign Offer Letter Online",
    category: "esignature",
    theme: { primary: "#B7791F", bg: "#FFF8E8" },
    intro:
      "An offer letter carries the terms a new hire will start with — role, joining date, salary and the conditions both sides agreed to. Waiting for a printed copy to travel leaves candidates hanging and pushes joining dates by days. With digital signing, both sides sign offer letter online today: the company signs first, the candidate signs on any device, and a clean copy stays in the HR file. Recruiters, small business owners and consultants use this to close hiring without chasing paper. Because the signed letter records the role and date, it also prevents later confusion about what was promised.",
    steps: [
      "Open the offer letter PDF, or convert the final Word copy to PDF first.",
      "Sign on the company side and type the signing date next to it.",
      "Share the file so the candidate opens it and signs their side.",
      "Save the fully signed copy — that becomes the official record for both sides.",
    ],
    stepsHeading: "An electronic signature for HR documents, in four steps",
    faq: [
      { q: "Pehle kiska sign aana chahiye — company ya candidate?", a: "Koi bhi pehle kar sakta hai; dono ke sign ke baad hi letter final maana jaata hai." },
      { q: "Kya candidate apne mobile se bhi sign kar sakta hai?", a: "Haan, mobile ya laptop — jis device par file khule, wahan sign lag jaata hai." },
      { q: "Kya offer letter me joining date aur role add ho sakta hai?", a: "Haan, typing se role, joining date aur salary details signed copy me daal sakte ho." },
      { q: "Kya signed copy ke bina joining valid hai?", a: "Company policy par depend karta hai, lekin signed letter aap dono ke liye clear record hota hai." },
    ],
    relatedTool: { label: "Use the free e-signature tool to sign offer letters", href: "/e-signature-maker" },
    metaTitle: "Sign Offer Letter Online – Electronic Signature for HR Documents",
    metaDescription:
      "Sign offer letter online — company and candidate signatures, role details and date, exported as one clean PDF. An electronic signature for HR documents that keeps hiring fast and paper-free.",
  },
  {
    slug: "invoice-format-excel",
    title: "Invoice Format in Excel",
    category: "invoice",
    theme: { primary: "#14532D", bg: "#EAF7EE" },
    intro:
      "Businesses that already keep accounts in Excel expect invoices to behave the same way — and a reliable invoice format in excel delivers that: editable, reusable and accurate line by line. A spreadsheet invoice earns its place: totals are calculated from the rows, so when a quantity or rate changes the amount corrects itself. Shopkeepers, workshop owners and small units use a standard Excel format to keep billing consistent across months. The same file serves as a template again and again, and clients recognise the layout instantly. GST amount sits in its own column, so the tax breakup stays visible without hunting through rows.",
    steps: [
      "Fill the template once — business name, address and your details at the top.",
      "Add each item with its quantity, rate and per-line amount in its row.",
      "Let the total and GST columns recalculate as you edit the rows.",
      "Export a clean PDF copy for the client and keep the Excel master for records.",
    ],
    stepsHeading: "A free invoice format in excel, download and reuse",
    faq: [
      { q: "Kya total har baar khud nikalta hai jab main rows badalta hoon?", a: "Haan, formulas se total aur GST apne aap update ho jaate hain, taaki maths ki galti nahi bachti." },
      { q: "Kya apna logo aur letterhead add kar sakta hoon?", a: "Haan, format me logo aur business details apne hisaab se laga sakte ho." },
      { q: "Kya ek hi template se alag clients ke liye alag invoice bana sakta hoon?", a: "Haan, har client ke liye file copy karke bas details badal do — template wahi rahega." },
      { q: "Kya Excel file hi client ko bhejna sahi hai?", a: "Behtar hai PDF export karke bhejna — Excel raw file koi kholkar badal sakta hai." },
    ],
    relatedTool: { label: "Open the free invoice generator", href: "/invoice-generator" },
    metaTitle: "Invoice Format in Excel – Free Download Template",
    metaDescription:
      "Download a free invoice format in excel — item rows, GST column and auto-calculating totals. Create consistent bills, reuse the template, and export PDF copies for clients.",
  },
  {
    slug: "invoice-format-word",
    title: "Invoice Format in Word",
    category: "invoice",
    theme: { primary: "#14396B", bg: "#E9F0FB" },
    intro:
      "Not every business runs its accounts on a spreadsheet; many still prepare bills in Word, where the letterhead, logo and style already live. A simple invoice format in word keeps things familiar — business name on top, client details, a neat item table and a clear total at the bottom. Service providers, consultants and small shops use it when they want a professional bill without paying for billing software. Because the layout is reusable, the same file opens, gets updated and exports for every customer. A consistent look also speeds up payment, since clients always see exactly what the bill covers.",
    steps: [
      "Open your Word invoice layout and fill the business name, logo and contact details.",
      "Add the client name, date and invoice number in the header section.",
      "Complete the item table with quantity, rate and a total row.",
      "Put GST and payment terms, then export the PDF for your client.",
    ],
    stepsHeading: "A free invoice format in word, download and reuse",
    faq: [
      { q: "Kya Word invoice me apna logo aur letterhead laga sakta hoon?", a: "Haan, format usi hisaab se hai — logo, naam aur details header me aa jaate hain." },
      { q: "Kya har invoice ke liye nayi file banani padegi?", a: "Nahi, ek hi file ko update karke naye invoice ki tarah save karo — template wahi rehta hai." },
      { q: "Kya total table me khud nikalta hai?", a: "Yahan total aap likhte ho; pehle amounts dobara mila lo taaki galti na ho." },
      { q: "Kya client ko raw Word file bhejni chahiye?", a: "PDF export karke bhejo — Word file kahin bhi badal sakti hai, PDF final hoti hai." },
    ],
    relatedTool: { label: "Open the free invoice generator", href: "/invoice-generator" },
    metaTitle: "Invoice Format in Word – Free Download Template",
    metaDescription:
      "Download a free invoice format in word — logo, item table, GST and total in a reusable layout. Make clean bills for small business and export PDF copies for clients.",
  },
  {
    slug: "gst-invoice-generator",
    title: "GST Invoice Generator",
    category: "invoice",
    theme: { primary: "#0B7285", bg: "#E3FAFC" },
    intro:
      "Registered businesses need a proper bill with every sale — taxable value, GST breakup and total shown separately. Errors here resurface at return filing time, when a missing HSN or a wrong rate costs hours of correction. A free GST bill generator puts the structure in place: buyer details, item rows, the right rate and a total that keeps tax apart from value. Traders, wholesalers and small manufacturers use it to raise bills that look proper, and to keep records that line up with their purchases. Everything runs in the browser, so there is no software licence and nothing to install.",
    steps: [
      "Open the GST invoice generator and enter the buyer plus your business details.",
      "Add each item with quantity, rate, and HSN code if you use one.",
      "Pick the GST rate so the taxable value and tax show on separate lines.",
      "Export the finished invoice as a PDF for the client and your own record.",
    ],
    stepsHeading: "GST invoice format, in four steps",
    faq: [
      { q: "Kya 5%, 12% aur 18% jaise alag-alag GST rates use ho sakte hain?", a: "Haan, apne item ke hisaab ka rate chuno — taxable value aur GST total alag-alag dikhta hai." },
      { q: "Kya invoice par HSN code likh sakta hoon?", a: "Haan, item ke saath HSN note kiya ja sakta hai, taaki return filing me pahchaan aasan ho." },
      { q: "Kya GST registered hone ki zaroorat hai invoice banane ke liye?", a: "Nahi, yeh invoice tool kisi bhi business ke liye hai — registered ho ya nahi, proper invoice banti hai." },
      { q: "Kya yeh billing software hai?", a: "Nahi, yeh browser tool hai jo invoice ka structure de deta hai; isme koi software install nahi hota aur na koi account chahiye." },
    ],
    relatedTool: { label: "Open the free GST invoice generator", href: "/invoice-generator" },
    metaTitle: "GST Invoice Generator – Free Online",
    metaDescription:
      "Free GST invoice generator — item rows, HSN codes, taxable value and tax on separate lines. Use the same clean GST invoice format every time and export a PDF. Private, runs in your browser.",
  },
  {
    slug: "invoice-for-freelancers",
    title: "Invoice Generator for Freelancers",
    category: "invoice",
    theme: { primary: "#D9480F", bg: "#FFF1EA" },
    intro:
      "Freelancers sell time and skill, and the invoice is what turns delivered work into money. A clear invoice generator for freelancers — client, project, amount and due date — gets paid faster, while a vague bill invites delays. Designers, writers, developers, tutors and consultants send an invoice after every milestone instead of hammering one out in a hurry. This page walks through a freelancer invoice in the generator: the client and project at the top, line items for the work done, one total, and the payment terms at the bottom. Same structure every time, so billing takes minutes and records stay tidy for tax season.",
    steps: [
      "Open the generator and add the client name and the project title.",
      "List the delivered work as line items — hours, pages, or fixed milestones.",
      "Set the due date and payment terms so both sides know the schedule.",
      "Export a clean PDF and mail it right after you deliver.",
    ],
    stepsHeading: "An invoice generator with no signup, in four steps",
    faq: [
      { q: "Kya invoice me apna naam aur logo add kar sakta hoon?", a: "Haan, apna naam, logo aur contact details sab add ho sakti hain." },
      { q: "Kya main currency choose kar sakta hoon?", a: "Haan, currency aapki choice hoti hai — koi bhi domestic ya international client chalega." },
      { q: "Kya ek invoice me alag-alag projects ka kaam daal sakta hoon?", a: "Haan, naye line items add karke ek invoice me kai projects ka hisaab de sakte ho." },
      { q: "Kya payment ka tracking bhi milta hai?", a: "Nahi, yeh invoice banane ka tool hai; payment ka record aap apne taraf rakhte ho." },
    ],
    relatedTool: { label: "Open the free invoice generator", href: "/invoice-generator" },
    metaTitle: "Invoice Generator for Freelancers – No Signup, Free",
    metaDescription:
      "An invoice generator for freelancers that needs no signup — client, project, line items, due date and payment terms exported as a clean PDF. Free to use and ready in minutes.",
  },
  {
    slug: "quotation-format",
    title: "Quotation Format – Free Download",
    category: "invoice",
    theme: { primary: "#5F3DC4", bg: "#F1EEFC" },
    intro:
      "A quotation is a client's first look at your price and your way of working. A messy quote gets ignored; a clear one wins the order. This page offers a quotation format free download you can reuse: client name, every item or service, quantity, rate, one total and a validity date. Before any work begins, the estimate sets out what will be done, at what rate, and for what total — so there is no guessing later. Workshop owners, electricians, interior designers and freelancers send a quotation after every enquiry. Once approved, the same details become the final invoice without typing everything twice.",
    steps: [
      "Open the invoice generator to build a clean quotation structure.",
      "Add the client name and list every item or service with description.",
      "Put quantities, rates and the total, then add a validity date.",
      "Export the quotation as a PDF and send it for approval.",
    ],
    stepsHeading: "Proforma invoice format, in four steps",
    faq: [
      { q: "Kya quotation par date aur validity likhna zaroori hai?", a: "Haan, validity date se client ko pata rehta hai ki price kitne din tak same rahega." },
      { q: "Kya ek quote me kaafi saare items ho sakte hain?", a: "Haan, items ya services line by line add karte ho, jitne chahiye." },
      { q: "Kya approval ke baad wahi quotation invoice ban sakta hai?", a: "Haan, wahi details invoice generator me use karke final bill bana sakte ho." },
      { q: "Kya quotation banane ka koi charge hai?", a: "Nahi, tool free hai aur browser me hi chalta hai." },
    ],
    relatedTool: { label: "Open the free invoice generator", href: "/invoice-generator" },
    metaTitle: "Quotation Format Free Download – Proforma Invoice Template",
    metaDescription:
      "Get a quotation format free download — client name, items, rates, total and validity in a clean template. Also workable as a proforma invoice format, exported as a PDF with no account.",
  },
];

export const toolFooterColumns: ToolUseCase[][] = [
  toolUseCases.slice(0, 5),
  toolUseCases.slice(5, 10),
];

export const findToolUseCase = (slug: string): ToolUseCase | undefined =>
  toolUseCases.find((tool) => tool.slug === slug);