/* ==========================================================================
   CAROLINA — language (EN/AR) + theme (light/dark)
   ========================================================================== */

(() => {
  const LANG_KEY = 'carolina-lang';
  const THEME_KEY = 'carolina-theme';

  const STRINGS = {
    en: {
      'title.home': 'Carolina — Change Your Style. Walk in Comfort.',
      'title.collections': 'Collections — Carolina',
      'title.cart': 'Cart — Carolina',
      'title.checkout': 'Checkout — Carolina',
      'title.payment': 'Payment — Carolina',
      'title.product': 'Product — Carolina',
      'title.contact': 'Contact Us — Carolina',
      'title.account': 'Sign In — Carolina',
      'title.orders': 'My Orders — Carolina',

      'nav.home': 'Home',
      'nav.collections': 'Collections',
      'nav.cart': 'Cart',
      'nav.contact': 'Contact',
      'nav.openMenu': 'Open menu',
      'nav.closeMenu': 'Close menu',
      'nav.cartAria': 'Cart',
      'nav.contactAria': 'Contact Carolina',
      'nav.signIn': 'Sign In',
      'nav.myOrders': 'My Orders',
      'nav.whatsapp': 'Chat on WhatsApp',

      'prefs.lang': 'Language',
      'prefs.theme': 'Theme',
      'prefs.light': 'Light',
      'prefs.dark': 'Dark',
      'prefs.en': 'EN',
      'prefs.ar': 'ع',

      'home.statsProducts': 'HIGH-QUALITY PRODUCTS',
      'home.statsCustomers': 'HAPPY CUSTOMERS',
      'home.statsDesigns': 'PREMIUM DESIGNS',
      'home.shop': 'GO TO SHOP',
      'home.heroSlides': 'Hero slides',
      'home.prev': 'Previous slide',
      'home.next': 'Next slide',
      'home.slide': 'Slide {n}',

      'collections.title': 'Collections',
      'collections.aria': 'Product collection',

      'cart.title': 'Cart',
      'cart.back': 'Back',
      'cart.empty': 'Your cart is empty.',
      'cart.remove': 'Remove',
      'cart.subtotal': 'Subtotal',
      'cart.discount': 'Discount',
      'cart.shipping': 'Shipping',
      'cart.total': 'Total',
      'cart.checkout': 'Check Out',
      'cart.couponPlaceholder': 'Coupon code',
      'cart.apply': 'Apply',
      'cart.update': 'Update',
      'cart.checking': 'Checking…',
      'cart.decQty': 'Decrease quantity',
      'cart.incQty': 'Increase quantity',

      'checkout.title': 'Checkout',
      'checkout.empty': 'Your cart is empty.',
      'checkout.contact': 'Contact Info',
      'checkout.shipping': 'Shipping Address',
      'checkout.email': 'Email',
      'checkout.phone': 'Phone',
      'checkout.firstName': 'First Name',
      'checkout.lastName': 'Last Name',
      'checkout.country': 'Country',
      'checkout.region': 'State / Region',
      'checkout.address': 'Address',
      'checkout.city': 'City',
      'checkout.postal': 'Postal Code',
      'checkout.continue': 'Continue to payment',
      'checkout.yourOrder': 'YOUR ORDER',
      'checkout.remove': 'Remove',

      'payment.title': 'Payment',
      'payment.lead': 'Choose how you’d like to pay. Your order is reserved once you confirm below.',
      'payment.methods': 'Payment method',
      'payment.cod': 'Cash on delivery',
      'payment.codDesc': 'Pay when your Carolina order arrives.',
      'payment.card': 'Card',
      'payment.cardDesc': 'Visa / Mastercard — secure checkout.',
      'payment.popular': 'Popular',
      'payment.cardName': 'Name on card',
      'payment.cardNumber': 'Card number',
      'payment.expiry': 'Expiry',
      'payment.cvc': 'CVC',
      'payment.fullName': 'Full name',
      'payment.placeOrder': 'Place order · {amount}',
      'payment.placing': 'Placing order…',
      'payment.secure': 'Encrypted session · Carolina never stores full card numbers',
      'payment.summary': 'ORDER SUMMARY',
      'payment.shippingTo': 'Shipping to',
      'payment.emptyCart': 'Your cart is empty.',
      'payment.needShipping': 'Please complete shipping details first.',
      'payment.backCheckout': 'Back to checkout',
      'payment.thanks': 'Thank you',
      'payment.received': "We've received your order and will be in touch shortly. A receipt has been emailed to {email}.",
      'payment.continueShop': 'Continue shopping',
      'payment.cardInvalid': 'Please check your card details',
      'payment.failed': 'Could not place order',
      'payment.sale': 'Sale',
      'payment.orderId': 'Order {id}',
      'payment.cardRedirectNote': "You'll enter your card details on Kashier's secure payment page after placing your order.",
      'payment.redirecting': 'Redirecting to secure payment…',
      'payment.gatewayUnavailable': 'Online payment is temporarily unavailable — please choose Cash on Delivery.',

      'receipt.title': 'Order confirmed',
      'receipt.aria': 'Order receipt',
      'receipt.subtotal': 'Subtotal',
      'receipt.discount': 'Discount',
      'receipt.shipping': 'Shipping',
      'receipt.total': 'Total',
      'receipt.note': 'A copy of this receipt — including your order code — has been emailed to {email}.',
      'receipt.continue': 'Continue shopping',
      'receipt.close': 'Close',

      'product.color': 'COLOR',
      'product.size': 'SIZE',
      'product.freeSize': 'FREE SIZE',
      'product.add': 'Add To Cart',
      'product.out': 'Out of stock',
      'product.related': 'You may also like',
      'product.viewImage': 'View image {n}',
      'product.back': 'Back',

      'stock.out': 'Out of stock',
      'stock.low': 'Only {n} left',
      'stock.in': 'In stock',

      'toast.added': 'Added to cart',
      'coupon.enter': 'Enter a coupon code',
      'coupon.invalid': 'Invalid coupon code',
      'coupon.checkFail': 'Could not check coupon — try again',

      'account.lead': "We'll email you a 6-digit code — no password needed.",
      'account.emailLabel': 'Email',
      'account.sendCode': 'Send verification code',
      'account.codeLabel': 'Enter your code',
      'account.codePlaceholder': '6-digit code',
      'account.verify': 'Verify & sign in',
      'account.backEmail': 'Use a different email',
      'account.sending': 'Sending…',
      'account.verifying': 'Verifying…',
      'account.codeSent': 'Code sent — check your inbox',
      'account.signedInAs': 'Signed in as',
      'account.welcomeAdmin': 'Welcome Admin',
      'account.openAdmin': 'Open admin panel',
      'account.signOut': 'Sign out',
      'account.noOrders': 'No orders yet.',
      'account.total': 'Total',

      'contact.eyebrow': "Let's Build Quality Together",
      'contact.title': 'Contact Us',
      'contact.hero': "Interested in our high-quality socks or looking for a reliable manufacturing partner? We're here to help. Let's create something great together.",
      'contact.address': 'Our Address',
      'contact.addressText': 'Carolina Socks Factory<br />Al-Alf Industrial Zone, Third Settlement<br />Cairo, Egypt',
      'contact.phone': 'Phone',
      'contact.email': 'Email',
      'contact.formEyebrow': 'Send Us A Message',
      'contact.formTitle': "We're Here To Help",
      'contact.namePh': 'Your Name',
      'contact.messagePh': 'Write Your Message...',
      'contact.emailPh': 'Your Email',
      'contact.send': 'Send Message',
      'contact.sending': 'Sending…',
      'contact.fillAll': 'Please fill in all fields',
      'contact.sent': 'Message sent — we will reply soon',
      'contact.fail': 'Could not send message. Try WhatsApp instead.',
      'contact.infoAria': 'Contact information',

      'account.title': 'Sign in with your email',
      'account.codeSendFail': 'Could not send code',
      'account.devCode': 'Dev mode — your code is {code}',
      'account.incorrectCode': 'Incorrect code',
      'account.codeSentTo': 'Sent to {email}. It expires in 10 minutes.',
      'orders.loading': 'Loading your orders…',
      'orders.signInPrompt': 'Sign in to see your order history.'
    },

    ar: {
      'title.home': 'كارولينا — غيّر أسلوبك. وامشِ براحة.',
      'title.collections': 'المجموعات — كارولينا',
      'title.cart': 'السلة — كارولينا',
      'title.checkout': 'إتمام الطلب — كارولينا',
      'title.payment': 'الدفع — كارولينا',
      'title.product': 'المنتج — كارولينا',
      'title.contact': 'تواصل معنا — كارولينا',
      'title.account': 'تسجيل الدخول — كارولينا',
      'title.orders': 'طلباتي — كارولينا',

      'nav.home': 'الرئيسية',
      'nav.collections': 'المجموعات',
      'nav.cart': 'السلة',
      'nav.contact': 'تواصل',
      'nav.openMenu': 'فتح القائمة',
      'nav.closeMenu': 'إغلاق القائمة',
      'nav.cartAria': 'السلة',
      'nav.contactAria': 'تواصل مع كارولينا',
      'nav.signIn': 'تسجيل الدخول',
      'nav.myOrders': 'طلباتي',
      'nav.whatsapp': 'محادثة واتساب',

      'prefs.lang': 'اللغة',
      'prefs.theme': 'المظهر',
      'prefs.light': 'فاتح',
      'prefs.dark': 'داكن',
      'prefs.en': 'EN',
      'prefs.ar': 'ع',

      'home.statsProducts': 'منتجات عالية الجودة',
      'home.statsCustomers': 'عملاء سعداء',
      'home.statsDesigns': 'تصاميم مميزة',
      'home.shop': 'تسوق الآن',
      'home.heroSlides': 'شرائح العرض',
      'home.prev': 'الشريحة السابقة',
      'home.next': 'الشريحة التالية',
      'home.slide': 'شريحة {n}',

      'collections.title': 'المجموعات',
      'collections.aria': 'مجموعة المنتجات',

      'cart.title': 'السلة',
      'cart.back': 'رجوع',
      'cart.empty': 'سلتك فارغة.',
      'cart.remove': 'إزالة',
      'cart.subtotal': 'المجموع الفرعي',
      'cart.discount': 'الخصم',
      'cart.shipping': 'الشحن',
      'cart.total': 'الإجمالي',
      'cart.checkout': 'إتمام الشراء',
      'cart.couponPlaceholder': 'رمز الخصم',
      'cart.apply': 'تطبيق',
      'cart.update': 'تحديث',
      'cart.checking': 'جارٍ التحقق…',
      'cart.decQty': 'تقليل الكمية',
      'cart.incQty': 'زيادة الكمية',

      'checkout.title': 'إتمام الطلب',
      'checkout.empty': 'سلتك فارغة.',
      'checkout.contact': 'معلومات التواصل',
      'checkout.shipping': 'عنوان الشحن',
      'checkout.email': 'البريد الإلكتروني',
      'checkout.phone': 'الهاتف',
      'checkout.firstName': 'الاسم الأول',
      'checkout.lastName': 'اسم العائلة',
      'checkout.country': 'الدولة',
      'checkout.region': 'المحافظة / المنطقة',
      'checkout.address': 'العنوان',
      'checkout.city': 'المدينة',
      'checkout.postal': 'الرمز البريدي',
      'checkout.continue': 'المتابعة للدفع',
      'checkout.yourOrder': 'طلبك',
      'checkout.remove': 'إزالة',

      'payment.title': 'الدفع',
      'payment.lead': 'اختر طريقة الدفع. يُحجز طلبك فور التأكيد أدناه.',
      'payment.methods': 'طريقة الدفع',
      'payment.cod': 'الدفع عند الاستلام',
      'payment.codDesc': 'ادفع عند وصول طلب كارولينا.',
      'payment.card': 'بطاقة',
      'payment.cardDesc': 'فيزا / ماستركارد — دفع آمن.',
      'payment.popular': 'الأكثر شيوعاً',
      'payment.cardName': 'الاسم على البطاقة',
      'payment.cardNumber': 'رقم البطاقة',
      'payment.expiry': 'الانتهاء',
      'payment.cvc': 'CVC',
      'payment.fullName': 'الاسم الكامل',
      'payment.placeOrder': 'تأكيد الطلب · {amount}',
      'payment.placing': 'جارٍ تأكيد الطلب…',
      'payment.secure': 'جلسة مشفّرة · كارولينا لا تخزّن أرقام البطاقات كاملة',
      'payment.summary': 'ملخص الطلب',
      'payment.shippingTo': 'الشحن إلى',
      'payment.emptyCart': 'سلتك فارغة.',
      'payment.needShipping': 'يرجى إكمال بيانات الشحن أولاً.',
      'payment.backCheckout': 'العودة لإتمام الطلب',
      'payment.thanks': 'شكراً لك',
      'payment.received': 'استلمنا طلبك وسنتواصل معك قريباً. أُرسل إيصال إلى {email}.',
      'payment.continueShop': 'متابعة التسوق',
      'payment.cardInvalid': 'يرجى التحقق من بيانات البطاقة',
      'payment.failed': 'تعذّر تأكيد الطلب',
      'payment.sale': 'تخفيض',
      'payment.orderId': 'الطلب {id}',
      'payment.cardRedirectNote': 'ستدخل بيانات بطاقتك على صفحة الدفع الآمنة من Kashier بعد تأكيد الطلب.',
      'payment.redirecting': 'جارٍ التحويل إلى صفحة الدفع الآمنة…',
      'payment.gatewayUnavailable': 'الدفع الإلكتروني غير متاح مؤقتاً — يرجى اختيار الدفع عند الاستلام.',

      'receipt.title': 'تم تأكيد الطلب',
      'receipt.aria': 'إيصال الطلب',
      'receipt.subtotal': 'المجموع الفرعي',
      'receipt.discount': 'الخصم',
      'receipt.shipping': 'الشحن',
      'receipt.total': 'الإجمالي',
      'receipt.note': 'أُرسلت نسخة من هذا الإيصال — بما فيها رمز الطلب — إلى {email}.',
      'receipt.continue': 'متابعة التسوق',
      'receipt.close': 'إغلاق',

      'product.color': 'اللون',
      'product.size': 'المقاس',
      'product.freeSize': 'مقاس واحد',
      'product.add': 'أضف إلى السلة',
      'product.out': 'نفد المخزون',
      'product.related': 'قد يعجبك أيضاً',
      'product.viewImage': 'عرض الصورة {n}',
      'product.back': 'رجوع',

      'stock.out': 'نفد المخزون',
      'stock.low': 'متبقي {n} فقط',
      'stock.in': 'متوفر',

      'toast.added': 'تمت الإضافة إلى السلة',
      'coupon.enter': 'أدخل رمز الخصم',
      'coupon.invalid': 'رمز خصم غير صالح',
      'coupon.checkFail': 'تعذّر التحقق من الرمز — حاول مجدداً',

      'account.lead': 'سنرسل رمزاً من 6 أرقام إلى بريدك — بدون كلمة مرور.',
      'account.emailLabel': 'البريد الإلكتروني',
      'account.sendCode': 'إرسال رمز التحقق',
      'account.codeLabel': 'أدخل الرمز',
      'account.codePlaceholder': 'رمز من 6 أرقام',
      'account.verify': 'تحقق وسجّل الدخول',
      'account.backEmail': 'استخدم بريداً آخر',
      'account.sending': 'جارٍ الإرسال…',
      'account.verifying': 'جارٍ التحقق…',
      'account.codeSent': 'تم إرسال الرمز — تحقق من بريدك',
      'account.signedInAs': 'مسجّل الدخول باسم',
      'account.welcomeAdmin': 'أهلاً أيها المسؤول',
      'account.openAdmin': 'فتح لوحة التحكم',
      'account.signOut': 'تسجيل الخروج',
      'account.noOrders': 'لا توجد طلبات بعد.',
      'account.total': 'الإجمالي',

      'account.title': 'سجّل الدخول عبر بريدك الإلكتروني',
      'account.codeSendFail': 'تعذّر إرسال الرمز',
      'account.devCode': 'وضع المطوّر — رمزك هو {code}',
      'account.incorrectCode': 'رمز غير صحيح',
      'account.codeSentTo': 'أُرسل إلى {email}. تنتهي صلاحيته خلال 10 دقائق.',
      'orders.loading': 'جارٍ تحميل طلباتك…',
      'orders.signInPrompt': 'سجّل الدخول لعرض سجل طلباتك.',

      'contact.eyebrow': 'لنصنع الجودة معاً',
      'contact.title': 'تواصل معنا',
      'contact.hero': 'هل تهتم بجواربنا عالية الجودة أو تبحث عن شريك تصنيع موثوق؟ نحن هنا للمساعدة. لنصنع شيئاً رائعاً معاً.',
      'contact.address': 'عنواننا',
      'contact.addressText': 'مصنع كارولينا للجوارب<br />منطقة الألف، التجمع الثالث<br />القاهرة، مصر',
      'contact.phone': 'الهاتف',
      'contact.email': 'البريد',
      'contact.formEyebrow': 'أرسل لنا رسالة',
      'contact.formTitle': 'نحن هنا للمساعدة',
      'contact.namePh': 'اسمك',
      'contact.messagePh': 'اكتب رسالتك...',
      'contact.emailPh': 'بريدك الإلكتروني',
      'contact.send': 'إرسال الرسالة',
      'contact.sending': 'جارٍ الإرسال…',
      'contact.fillAll': 'يرجى تعبئة جميع الحقول',
      'contact.sent': 'تم إرسال الرسالة — سنرد قريباً',
      'contact.fail': 'تعذّر إرسال الرسالة. جرّب واتساب.',
      'contact.infoAria': 'معلومات التواصل'
    }
  };

  function getLang() {
    try {
      return localStorage.getItem(LANG_KEY) === 'ar' ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  }

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  function t(key, vars) {
    const lang = getLang();
    let str = STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
    if (vars && typeof vars === 'object') {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      });
    }
    return str;
  }

  function applyDocumentPrefs() {
    const lang = getLang();
    const theme = getTheme();
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    root.dataset.theme = theme;
  }

  function applyDomI18n(root = document) {
    const readVars = (el) => {
      const raw = el.getAttribute('data-i18n-vars');
      if (!raw) return undefined;
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    };

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = t(key, readVars(el));
    });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (!key) return;
      el.innerHTML = t(key, readVars(el));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      el.setAttribute('placeholder', t(key, readVars(el)));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (!key) return;
      el.setAttribute('aria-label', t(key, readVars(el)));
    });
    root.querySelectorAll('[data-src-en]').forEach((el) => {
      const lang = getLang();
      const src = lang === 'ar' ? el.getAttribute('data-src-ar') : el.getAttribute('data-src-en');
      if (src) el.setAttribute('src', src);
    });
    const titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) document.title = t(titleKey);
  }

  function setLang(lang) {
    const next = lang === 'ar' ? 'ar' : 'en';
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
    applyDocumentPrefs();
    window.location.reload();
  }

  function setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    applyDocumentPrefs();
    syncPrefsControls();
  }

  function syncPrefsControls() {
    const lang = getLang();
    const theme = getTheme();
    document.querySelectorAll('[data-set-lang]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-set-lang') === lang);
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-lang') === lang));
    });
    document.querySelectorAll('[data-set-theme]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-set-theme') === theme);
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-set-theme') === theme));
    });
  }

  function prefsControlsHtml() {
    return `
      <div class="prefs-controls" role="group" aria-label="${t('prefs.lang')} / ${t('prefs.theme')}">
        <div class="prefs-group" role="group" aria-label="${t('prefs.lang')}">
          <button type="button" class="prefs-btn" data-set-lang="en" aria-label="English">${t('prefs.en')}</button>
          <button type="button" class="prefs-btn" data-set-lang="ar" aria-label="العربية">${t('prefs.ar')}</button>
        </div>
        <div class="prefs-group" role="group" aria-label="${t('prefs.theme')}">
          <button type="button" class="prefs-btn" data-set-theme="light" aria-label="${t('prefs.light')}" title="${t('prefs.light')}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
          </button>
          <button type="button" class="prefs-btn" data-set-theme="dark" aria-label="${t('prefs.dark')}" title="${t('prefs.dark')}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/></svg>
          </button>
        </div>
      </div>`;
  }

  function injectPrefsControls() {
    document.querySelectorAll('.header-right').forEach((el) => {
      if (el.querySelector('.prefs-controls')) return;
      el.insertAdjacentHTML('afterbegin', prefsControlsHtml());
    });
    document.querySelectorAll('.mobile-nav ul').forEach((ul) => {
      if (ul.querySelector('[data-prefs-mobile]')) return;
      const li = document.createElement('li');
      li.dataset.prefsMobile = '';
      li.innerHTML = prefsControlsHtml();
      ul.appendChild(li);
    });

    document.addEventListener('click', (e) => {
      const langBtn = e.target.closest('[data-set-lang]');
      if (langBtn) {
        setLang(langBtn.getAttribute('data-set-lang'));
        return;
      }
      const themeBtn = e.target.closest('[data-set-theme]');
      if (themeBtn) {
        setTheme(themeBtn.getAttribute('data-set-theme'));
      }
    });

    syncPrefsControls();
  }

  applyDocumentPrefs();

  window.CarolinaI18n = { t, getLang, getTheme, setLang, setTheme, applyDomI18n, applyDocumentPrefs };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectPrefsControls();
      applyDomI18n();
    });
  } else {
    injectPrefsControls();
    applyDomI18n();
  }
})();
