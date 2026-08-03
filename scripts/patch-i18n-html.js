'use strict';

const fs = require('fs');

const BOOT =
  "<script>(function(){try{var t=localStorage.getItem('carolina-theme')||'light';var l=localStorage.getItem('carolina-lang')||'en';var r=document.documentElement;r.setAttribute('data-theme',t==='dark'?'dark':'light');r.lang=l==='ar'?'ar':'en';r.dir=l==='ar'?'rtl':'ltr';}catch(e){}})();</script>\n";

const titles = {
  'index.html': 'title.home',
  'collections.html': 'title.collections',
  'cart.html': 'title.cart',
  'checkout.html': 'title.checkout',
  'payment.html': 'title.payment',
  'product.html': 'title.product',
  'contact.html': 'title.contact',
  'account.html': 'title.account',
  'orders.html': 'title.orders'
};

for (const [file, titleKey] of Object.entries(titles)) {
  let html = fs.readFileSync(file, 'utf8');

  if (!html.includes('data-i18n-title')) {
    html = html.replace('<html lang="en">', `<html lang="en" data-i18n-title="${titleKey}">`);
  }

  if (!html.includes('carolina-theme')) {
    html = html.replace(/(<link rel="stylesheet")/, `${BOOT}  $1`);
  }

  if (!html.includes('js/i18n.js')) {
    html = html.replace(
      '<script src="script.js"></script>',
      '<script src="js/i18n.js"></script>\n  <script src="script.js"></script>'
    );
  }

  // Avoid double-applying data-i18n
  if (!html.includes('data-i18n="nav.home"')) {
    html = html.replace(/>(Home)<\/a>/g, ' data-i18n="nav.home">$1</a>');
    html = html.replace(/>(Collections)<\/a>/g, ' data-i18n="nav.collections">$1</a>');
    html = html.replace(/>(Cart)<\/a>/g, ' data-i18n="nav.cart">$1</a>');
    html = html.replace(/>(Contact)<\/a>/g, ' data-i18n="nav.contact">$1</a>');
  }

  if (!html.includes('data-i18n-aria="nav.openMenu"')) {
    html = html.replace(/aria-label="Open menu"/g, 'aria-label="Open menu" data-i18n-aria="nav.openMenu"');
    html = html.replace(/aria-label="Cart"/g, 'aria-label="Cart" data-i18n-aria="nav.cartAria"');
    html = html.replace(
      /aria-label="Contact Carolina"/g,
      'aria-label="Contact Carolina" data-i18n-aria="nav.contactAria"'
    );
    html = html.replace(
      /aria-label="Chat on WhatsApp"/g,
      'aria-label="Chat on WhatsApp" data-i18n-aria="nav.whatsapp"'
    );
  }

  if (!html.includes('data-i18n="cart.back"') && html.includes('>Back</a>')) {
    html = html.replace(/(<\/svg>\s*)Back(\s*<\/a>)/g, '$1<span data-i18n="cart.back">Back</span>$2');
  }

  fs.writeFileSync(file, html);
  console.log('patched', file);
}
