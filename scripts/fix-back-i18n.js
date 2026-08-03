'use strict';
const fs = require('fs');
const files = ['cart.html', 'product.html', 'checkout.html', 'payment.html', 'account.html', 'orders.html'];
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const next = h.replace(
    /(<\/svg>\r?\n\s*)Back(\r?\n\s*<\/a>)/g,
    '$1<span data-i18n="cart.back">Back</span>$2'
  );
  if (next !== h) {
    fs.writeFileSync(f, next);
    console.log('back fixed', f);
  } else {
    console.log('no back match', f);
  }
}
