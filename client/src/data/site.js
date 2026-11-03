// Editable brand content for RK FASHIONS.
// Everything a non-developer may want to change (copy, banners, menus,
// collections) lives here so it can move to the admin dashboard in Phase 3.
// Images are Unsplash-licensed placeholders — replace with campaign photography.

const u = (id) => `https://images.unsplash.com/photo-${id}`;

export const brand = {
  name: 'RK FASHIONS',
  designer: 'Rohit Kumar',
  tagline: 'Elegance, Designed Around You.',
  philosophy: 'Your Vision. Our Design. Your Style.',
  announcement: 'Discover the New RK FASHIONS Collection',
  // TODO(owner): fill in real contact details — empty values are hidden on the site.
  contact: {
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    hours: 'Tuesday – Sunday · 11:00 – 19:30 IST',
  },
  // TODO(owner): add social profile URLs — icons only render when a URL is set.
  social: {
    instagram: '',
    facebook: '',
    youtube: '',
    pinterest: '',
  },
  instagramHandle: '@rkfashions',
};

// ───────── Categories ─────────
// `occasion` categories (Bridal / Festive / Casual / Wedding Wear) list products
// by occasion tag instead of garment type.
export const categories = {
  women: [
    { slug: 'lehengas', label: 'Lehengas' },
    { slug: 'sarees', label: 'Sarees' },
    { slug: 'anarkali-suits', label: 'Anarkali Suits' },
    { slug: 'salwar-suits', label: 'Salwar Suits' },
    { slug: 'kurtis', label: 'Kurtis' },
    { slug: 'gowns', label: 'Gowns' },
    { slug: 'dresses', label: 'Dresses' },
    { slug: 'co-ord-sets', label: 'Co-ord Sets' },
    { slug: 'blouses', label: 'Blouses' },
    { slug: 'skirt-sets', label: 'Skirt Sets' },
    { slug: 'indo-western', label: 'Indo-Western Wear' },
    { slug: 'jackets', label: 'Jackets' },
    { slug: 'bridal-wear', label: 'Bridal Wear', occasion: 'bridal' },
    { slug: 'festive-wear', label: 'Festive Wear', occasion: 'festive' },
    { slug: 'casual-wear', label: 'Casual Wear', occasion: 'casual' },
  ],
  men: [
    { slug: 'kurta-sets', label: 'Kurta Sets' },
    { slug: 'sherwanis', label: 'Sherwanis' },
    { slug: 'bandhgalas', label: 'Bandhgalas' },
    { slug: 'nehru-jackets', label: 'Nehru Jackets' },
    { slug: 'shirts', label: 'Shirts' },
    { slug: 'trousers', label: 'Trousers' },
    { slug: 'blazers', label: 'Blazers' },
    { slug: 'indo-western', label: 'Indo-Western Wear' },
    { slug: 'wedding-wear', label: 'Wedding Wear', occasion: 'wedding' },
    { slug: 'festive-wear', label: 'Festive Wear', occasion: 'festive' },
    { slug: 'casual-wear', label: 'Casual Wear', occasion: 'casual' },
  ],
};

export const genderPages = {
  women: {
    title: 'Women',
    intro: 'Lehengas, sarees and occasion wear — crafted in our atelier for every celebration of your life.',
    banner: u('1746372283841-dbb3838f9935'),
    bannerPosition: '50% 25%',
  },
  men: {
    title: 'Men',
    intro: 'Sherwanis, bandhgalas and modern tailoring — heritage silhouettes cut for today.',
    banner: u('1759906766080-82b785c61f51'),
    bannerPosition: '50% 20%',
  },
};

// ───────── Collections ─────────
// `match` decides which products belong: a collection tag, or a product flag.
export const collections = [
  {
    slug: 'new-arrivals',
    title: 'New Arrivals',
    subtitle: 'The newest pieces from the RK FASHIONS atelier.',
    image: u('1733937140732-2cc70a1d7017'),
    match: { newArrival: true },
  },
  {
    slug: 'signature',
    title: 'Signature Collection',
    subtitle: 'The pieces that define the house — heirloom craft, unmistakable silhouettes.',
    image: u('1740674570259-a47d713a2976'),
    match: { collection: 'signature' },
  },
  {
    slug: 'wedding',
    title: 'Wedding Collection',
    subtitle: 'For every ceremony, from the haldi to the reception.',
    image: u('1722952934708-749c22eb2e58'),
    match: { collection: 'wedding' },
  },
  {
    slug: 'bridal',
    title: 'Bridal Collection',
    subtitle: 'Couture lehengas and sarees for the bride, crafted by hand over hundreds of hours.',
    image: u('1654764746225-e63f5e90facd'),
    match: { collection: 'bridal' },
  },
  {
    slug: 'groom',
    title: 'Groom Collection',
    subtitle: 'Sherwanis and bandhgalas tailored for the most important day.',
    image: u('1760080838961-4208536db385'),
    match: { collection: 'groom' },
  },
  {
    slug: 'festive',
    title: 'Festive Collection',
    subtitle: 'Colour, light and celebration — dressing for Diwali, Eid, Navratri and every festival.',
    image: u('1617627143750-d86bc21e42bb'),
    match: { collection: 'festive' },
  },
  {
    slug: 'contemporary',
    title: 'Contemporary Collection',
    subtitle: 'Indian craft, modern lines — pieces for the city and the soirée.',
    image: u('1574847872646-abff244bbd87'),
    match: { collection: 'contemporary' },
  },
  {
    slug: 'occasion-wear',
    title: 'Occasion Wear',
    subtitle: 'Receptions, cocktails and sangeets — statement pieces for the evening.',
    image: u('1619715613791-89d35b51ff81'),
    match: { collection: 'occasion-wear' },
  },
  {
    slug: 'ready-to-ship',
    title: 'Ready-to-Ship',
    subtitle: 'Finished pieces dispatched within 3–5 working days.',
    image: u('1770359993283-a2c2f386584e'),
    match: { readyToShip: true },
  },
  {
    slug: 'bespoke',
    title: 'Bespoke Collection',
    subtitle: 'Every design here can be personalised — or begin entirely from your imagination.',
    image: u('1724856605003-6a8fe56ee789'),
    match: { customisable: true },
    bespoke: true,
  },
];

export const collectionBySlug = (slug) => collections.find((c) => c.slug === slug);

// ───────── Navigation ─────────
// Mega menus are derived from the (editable) categories and collections, so
// they are rebuilt whenever content is loaded from the database.
export const megaMenus = {};

const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

export function buildMegaMenus() {
  for (const gender of ['women', 'men']) {
    const garments = categories[gender].filter((c) => !c.occasion);
    const occasions = categories[gender].filter((c) => c.occasion);
    const link = (c) => ({ label: c.label, to: `/${gender}/${c.slug}` });
    const garmentCols = chunk(garments, 8).slice(0, 2);
    megaMenus[gender] = {
      feature: megaFeatures[gender],
      columns: [
        ...garmentCols.map((links, i) => ({ title: i === 0 ? 'Clothing' : '', links: links.map(link) })),
        {
          title: 'Shop by Occasion',
          links: [
            ...occasions.map(link),
            { label: 'New Arrivals', to: `/new-arrivals?gender=${gender}` },
            { label: 'Ready-to-Ship', to: `/collections/ready-to-ship?gender=${gender}` },
            { label: `View All ${gender === 'women' ? 'Women' : 'Men'}`, to: `/${gender}` },
          ],
        },
      ],
    };
  }
  const colLink = (c) => ({ label: c.title, to: `/collections/${c.slug}` });
  megaMenus.collections = {
    feature: megaFeatures.collections,
    columns: [
      { title: 'Collections', links: collections.slice(0, 6).map(colLink) },
      { title: '', links: collections.slice(6, 12).map(colLink) },
      {
        title: 'Discover',
        links: [
          { label: 'All Collections', to: '/collections' },
          { label: 'Book an Appointment', to: '/appointment' },
          { label: 'About the Designer', to: '/about' },
        ],
      },
    ],
  };
}

export const megaFeatures = {
  women: { image: u('1601432093209-8af1fd74b054'), title: 'The Bridal Edit', to: '/collections/bridal' },
  men: { image: u('1744804298516-991bf12847c8'), title: 'The Groom Edit', to: '/collections/groom' },
  collections: { image: u('1724856605003-6a8fe56ee789'), title: 'The Bespoke Studio', to: '/bespoke' },
};

buildMegaMenus();

export const mainNav = [
  { label: 'Home', to: '/' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Women', to: '/women', mega: 'women' },
  { label: 'Men', to: '/men', mega: 'men' },
  { label: 'Collections', to: '/collections', mega: 'collections' },
  { label: 'Ready-to-Wear', to: '/ready-to-wear' },
  { label: 'Bespoke', to: '/bespoke' },
  { label: 'Book an Appointment', to: '/appointment' },
  { label: 'About the Designer', to: '/about' },
];

// ───────── Homepage ─────────
export const home = {
  hero: {
    eyebrow: 'RK FASHIONS · New Season',
    title: 'The Art of Elegance',
    subtitle: 'Designed with passion. Tailored to perfection.',
    panels: [
      { image: u('1735052713120-2323c8ac72e9'), position: '50% 30%', alt: 'Bride twirling in a red embroidered lehenga outdoors' },
      { image: u('1746372283841-dbb3838f9935'), position: '50% 22%', alt: 'Woman in a blush embroidered lehenga beneath a sandstone arch' },
      { image: u('1744804298516-991bf12847c8'), position: '50% 30%', alt: 'Groom in an ivory sherwani in a garden' },
    ],
  },
  gender: [
    { label: 'Women', to: '/women', image: u('1677691257363-eebd2abeafec'), position: '50% 25%' },
    { label: 'Men', to: '/men', image: u('1729347917808-e3e35a462fec'), position: '50% 20%' },
  ],
  signature: ['bridal', 'festive', 'wedding', 'contemporary'],
  bespoke: {
    eyebrow: 'The Bespoke Studio',
    title: 'Not Just Worn. Personally Created.',
    text: 'Bring your imagination to life with personalised designs crafted around your style.',
    image: u('1724856605003-6a8fe56ee789'),
    detail: u('1671535108620-d169ce916f09'),
  },
  story: {
    image: u('1781194519715-a1d72e169b35'),
    detail: u('1779375378000-9d233e9e57aa'),
  },
  appointment: {
    title: 'Your Design Journey Starts Here.',
    text: 'Meet the RK FASHIONS design team in our studio or online — for bridal, groom, bespoke and measurement consultations.',
    image: u('1722952934708-749c22eb2e58'),
  },
};

// Sample testimonials are shown only in development. Replace with real,
// consented customer reviews and set `sample: false` before launch.
export const testimonials = [
  {
    quote: 'Every detail of my lehenga was discussed with me, from the embroidery to the fall of the dupatta. It felt designed only for me.',
    name: 'Sample Customer',
    detail: 'Bridal lehenga · Bespoke',
    sample: true,
  },
  {
    quote: 'The sherwani fitted perfectly at the first trial. The team understood exactly the understated look I wanted.',
    name: 'Sample Customer',
    detail: 'Groom sherwani',
    sample: true,
  },
  {
    quote: 'An online consultation, a few measurements, and a saree blouse that finally fits the way it should.',
    name: 'Sample Customer',
    detail: 'Online consultation',
    sample: true,
  },
];

export const instagramGallery = [
  u('1654764746225-e63f5e90facd'),
  u('1785651524267-211a77e7d0c1'),
  u('1617627143750-d86bc21e42bb'),
  u('1671535108620-d169ce916f09'),
  u('1677770101470-b1995c36b6b7'),
  u('1601432093209-8af1fd74b054'),
];

// ───────── About the designer ─────────
// Bracketed text is a placeholder for information not yet supplied by the
// brand — it is displayed as an editable placeholder on the page.
export const about = {
  portrait: null, // TODO(owner): add a portrait of Rohit Kumar (e.g. Cloudinary URL)
  hero: u('1724856605003-6a8fe56ee789'),
  intro:
    'Rohit Kumar founded RK FASHIONS on a simple belief: the most beautiful clothes are the ones made around the person who wears them. Every piece begins with a conversation — about the occasion, the memories you want to make, and the way you want to feel.',
  philosophy: [
    { title: 'Your Vision', text: 'We listen first. Your ideas, references and stories shape every design brief.' },
    { title: 'Our Design', text: 'The atelier translates that vision into silhouette, fabric and embroidery — refined through sketches and trials.' },
    { title: 'Your Style', text: 'The finished piece is unmistakably yours: fitted to you, and made to be treasured.' },
  ],
  inspiration:
    'The house draws on India\'s living textile traditions — zardozi, chikankari, gota patti, handwoven silks — and reinterprets them through clean, modern lines.',
  process: [
    { title: 'Consultation', text: 'A personal meeting, in-store or online, to understand the brief.' },
    { title: 'Sketch & Swatch', text: 'Design sketches, fabric swatches and embroidery samples for your approval.' },
    { title: 'Atelier Craft', text: 'Pattern-making, hand embroidery and construction by skilled karigars.' },
    { title: 'Trial & Finish', text: 'Fittings and final finishing until every line sits perfectly.' },
  ],
  journey: [
    { year: '[Year]', text: '[Founding story — to be supplied by Rohit Kumar]' },
    { year: '[Year]', text: '[First studio / atelier milestone — to be supplied]' },
    { year: '[Year]', text: '[Key collection or brand milestone — to be supplied]' },
  ],
  gallery: [u('1680034976848-d9fe95466aba'), u('1787220272461-2c53528c9349'), u('1566152467605-fd2f144798e5')],
};

// ───────── Policies & info pages ─────────
export const infoPages = {
  contact: {
    title: 'Contact Us',
    body: [
      'We would love to hear from you — whether you have a question about an order, a bespoke design or a consultation.',
      'For design consultations, please book an appointment so a member of the design team can give you their full attention.',
    ],
  },
  support: {
    title: 'Customer Support',
    body: [
      'Our client care team can help with sizing, order status, alterations and care advice.',
      'Signed-in customers can see their order history and live order status in My Account. You can also track any order with your order number and email on the Track Your Order page.',
    ],
  },
  shipping: {
    title: 'Shipping Policy',
    body: [
      'Ready-to-ship pieces are dispatched within 3–5 working days. Made-to-order pieces are dispatched in 4–6 weeks, and couture pieces in 8–10 weeks after the final fitting.',
      'All orders are shipped fully insured with tracking. [Delivery regions, international shipping and charges — to be confirmed by RK FASHIONS.]',
    ],
  },
  returns: {
    title: 'Returns & Exchanges',
    body: [
      'Ready-to-ship pieces may be returned or exchanged in original condition. [Return window and process — to be confirmed by RK FASHIONS.]',
      'Bespoke, customised and made-to-measure pieces are created specifically for you and cannot be returned; alterations are offered as described in your quotation.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      'We collect only the information needed to fulfil your orders, enquiries and appointments — such as your name, contact details, measurements and uploaded reference images.',
      'We never sell your personal data. [Full privacy policy — to be reviewed by RK FASHIONS\' legal advisor before launch.]',
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    body: [
      'Prices are listed in Indian Rupees (₹) and include applicable taxes unless stated otherwise. Bespoke prices are quoted individually after a design review.',
      '[Full terms and conditions — to be reviewed by RK FASHIONS\' legal advisor before launch.]',
    ],
  },
};

export const footerLinks = [
  {
    title: 'RK FASHIONS',
    links: [
      { label: 'About RK Fashions', to: '/about' },
      { label: 'The Bespoke Studio', to: '/bespoke' },
      { label: 'Book an Appointment', to: '/appointment' },
      { label: 'Collections', to: '/collections' },
    ],
  },
  {
    title: 'Client Care',
    links: [
      { label: 'Contact Us', to: '/pages/contact' },
      { label: 'Customer Support', to: '/pages/support' },
      { label: 'Track Your Order', to: '/track' },
      { label: 'Shipping Policy', to: '/pages/shipping' },
      { label: 'Returns & Exchanges', to: '/pages/returns' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/pages/privacy' },
      { label: 'Terms & Conditions', to: '/pages/terms' },
      { label: 'My Account', to: '/account' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
];

// ───────── Bespoke studio options ─────────
export const bespokeOptions = {
  categories: {
    women: {
      'Bridal & Wedding': ['Bridal Lehenga', 'Wedding Saree', 'Reception Gown', 'Sangeet Lehenga', 'Mehendi Outfit'],
      'Festive & Occasion': ['Anarkali Suit', 'Saree with Blouse', 'Sharara Set', 'Indo-Western Set', 'Gown'],
      'Everyday Couture': ['Kurta Set', 'Co-ord Set', 'Dress', 'Jacket', 'Designer Blouse'],
    },
    men: {
      'Groom & Wedding': ['Groom Sherwani', 'Achkan', 'Bandhgala Suit', 'Reception Tuxedo'],
      'Festive & Occasion': ['Kurta Set', 'Nehru Jacket Set', 'Indo-Western Set', 'Jodhpuri Suit'],
      'Tailoring': ['Blazer', 'Two-Piece Suit', 'Shirt', 'Trousers'],
    },
  },
  fabrics: ['Raw Silk', 'Banarasi Silk', 'Velvet', 'Organza', 'Georgette', 'Chanderi', 'Tissue', 'Brocade', 'Linen', 'Not sure — advise me'],
  colours: [
    { name: 'Bridal Red', hex: '#9B1B1E' },
    { name: 'Maroon', hex: '#5E1219' },
    { name: 'Rani Pink', hex: '#C2185B' },
    { name: 'Blush', hex: '#E8C4BC' },
    { name: 'Ivory', hex: '#F4EEE1' },
    { name: 'Champagne Gold', hex: '#C6A770' },
    { name: 'Saffron', hex: '#D9902B' },
    { name: 'Emerald', hex: '#145A45' },
    { name: 'Teal', hex: '#11635E' },
    { name: 'Navy', hex: '#1C2541' },
    { name: 'Lilac', hex: '#B9A6CF' },
    { name: 'Black', hex: '#141210' },
  ],
  embellishments: ['Zardozi', 'Chikankari', 'Gota Patti', 'Mirror Work', 'Sequins', 'Pearl & Cut-dana', 'Resham Thread', 'Minimal / None'],
  measurements: {
    women: ['height', 'bust', 'waist', 'hips', 'shoulder', 'sleeveLength', 'armhole', 'topLength', 'bottomLength'],
    men: ['height', 'chest', 'waist', 'hips', 'shoulder', 'sleeveLength', 'neck', 'topLength', 'inseam'],
  },
  measurementLabels: {
    height: 'Height',
    bust: 'Bust',
    chest: 'Chest',
    waist: 'Waist',
    hips: 'Hips',
    shoulder: 'Shoulder',
    sleeveLength: 'Sleeve length',
    armhole: 'Armhole',
    topLength: 'Top / kurta length',
    bottomLength: 'Skirt / bottom length',
    neck: 'Neck',
    inseam: 'Inseam',
  },
};

export const appointmentTypes = [
  { value: 'in-store', label: 'In-store Consultation', text: 'Visit the studio to explore fabrics and finished pieces in person.', duration: '60 min' },
  { value: 'online', label: 'Online Consultation', text: 'A video call with the design team, wherever you are.', duration: '45 min' },
  { value: 'custom-outfit', label: 'Custom Outfit Consultation', text: 'Develop a bespoke design from your ideas and references.', duration: '75 min' },
  { value: 'bridal', label: 'Bridal Consultation', text: 'A dedicated session for the bride\'s wedding wardrobe.', duration: '90 min' },
  { value: 'groom', label: 'Groom Consultation', text: 'Sherwanis, bandhgalas and the complete groom\'s look.', duration: '75 min' },
  { value: 'measurement', label: 'Measurement Consultation', text: 'Precise measurements by our master tailor.', duration: '30 min' },
];
