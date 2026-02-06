/**
 * Board Game Store - Core Logic
 */

// State Management
const State = {
    cart: JSON.parse(localStorage.getItem('boardGameCart')) || [],
    currencyCode: localStorage.getItem('boardGameCurrencyCode') || 'USD'
};

// --- Currency Logic ---
function setCurrency(code) {
    State.currencyCode = code;
    localStorage.setItem('boardGameCurrencyCode', code);
    location.reload();
}

function formatPrice(basePrice) {
    const currencies = ProductService.getCurrencies();
    let currency = currencies.find(c => c.code === State.currencyCode);

    // Fallback to USD
    if (!currency) {
        currency = currencies.find(c => c.code === 'USD') || { code: 'USD', rate: 1, symbol: '$' };
        State.currencyCode = 'USD';
        localStorage.setItem('boardGameCurrencyCode', 'USD');
    }

    const converted = basePrice * currency.rate;
    const formattedNum = converted.toFixed(2);

    // For RTL Layouts: Force LTR direction for the price block to keep symbol logic correct ($100 not 100$)
    // Or handle it based on symbol type.
    // We will return plain text now to avoid [object Object] or HTML tags showing up in innerText.
    if (currency.symbol === '$' || currency.code === 'USD' || currency.code === 'EUR') {
        return `${currency.symbol}${formattedNum}`;
    } else {
        return `${formattedNum} ${currency.symbol}`;
    }
}

// --- Cart Logic ---
function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        const totalItems = State.cart.reduce((sum, item) => sum + item.quantity, 0);
        countElement.innerText = totalItems;

        if (totalItems > 0) {
            countElement.classList.remove('hidden');
            // Animation reset
            countElement.classList.remove('cart-bounce');
            void countElement.offsetWidth;
            countElement.classList.add('cart-bounce');
        } else {
            countElement.classList.add('hidden');
        }
    }
}

function saveCart() {
    localStorage.setItem('boardGameCart', JSON.stringify(State.cart));
    updateCartCount();
}

function addToCart(productId) {
    const product = ProductService.getById(productId);
    if (!product) return;

    const existingItem = State.cart.find(item => item.id === productId);

    // Determine the price to use (Discount or Regular)
    const finalPrice = (product.discountPrice && product.discountPrice < product.price)
        ? parseFloat(product.discountPrice)
        : parseFloat(product.price);

    if (existingItem) {
        existingItem.quantity += 1;
        // Update price in case it changed
        existingItem.price = finalPrice;
    } else {
        State.cart.push({
            ...product,
            price: finalPrice, // Store the effective price
            originalPriceToCheck: product.price, // Keep ref to original if needed
            quantity: 1
        });
    }

    saveCart();
    showToast(`تمت إضافة "${product.name}" إلى السلة!`, 'success');
}

function removeFromCart(productId) {
    State.cart = State.cart.filter(item => item.id !== productId);
    saveCart();
    // Re-render cart if on cart page
    if (typeof renderCart === 'function') renderCart();
}

function updateQuantity(productId, change) {
    const item = State.cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            if (typeof renderCart === 'function') renderCart();
        }
    }
}

// --- Rendering Logic ---
function renderFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;

    const featured = ProductService.getAll().filter(p => p.isFeatured).slice(0, 4);

    container.innerHTML = featured.map(product => createProductCard(product)).join('');
}

function renderProducts(productsToRender) {
    const container = document.getElementById('products-grid');
    if (!container) return;

    const list = productsToRender || ProductService.getAll();

    if (list.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-20 text-gray-500">لا توجد منتجات.</div>`;
        return;
    }

    console.log(`Rendering ${list.length} products...`);

    try {
        container.innerHTML = list.map(product => {
            try {
                return createProductCard(product);
            } catch (err) {
                console.error("Error creating card for product:", product, err);
                return '';
            }
        }).join('');
    } catch (e) {
        console.error("Critical error in renderProducts:", e);
        container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">حدث خطأ أثناء عرض المنتجات.</div>`;
    }
}

function createProductCard(product) {
    // Check for discount (Discount Price exists AND is lower than Regular Price)
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

    return `
    <div class="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full group relative" data-aos="fade-up">
        <div class="product-image-container relative h-64 bg-gray-50 overflow-hidden">
            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-contain p-8">
            
            <div class="absolute top-4 right-4 flex flex-col gap-2 z-10 w-full px-4 items-end">
                ${product.isFeatured ? '<span class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-indigo-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg self-end">مميز ★</span>' : ''}
                ${hasDiscount ? `
                    <span class="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse self-end mb-1">عرض خاص 🔥</span>
                    <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg self-end" dir="ltr">-${discountPercent}%</span>
                ` : ''}
            </div>
            
            <a href="product-details.html?id=${product.id}" class="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                 <span class="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 bg-white text-indigo-700 px-6 py-2.5 rounded-full font-bold shadow-2xl flex items-center gap-2">
                    <i class="fas fa-eye"></i> التفاصيل
                 </span>
            </a>
        </div>
        
        <div class="p-6 flex-grow flex flex-col relative z-20 bg-white">
            <div class="flex justify-between items-center mb-3">
                <span class="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">${getCategoryName(product.category)}</span>
                <div class="flex flex-col items-end">
                    ${hasDiscount ? `
                        <span class="text-xs line-through text-gray-400 decoration-red-500 decoration-1 mb-0.5">${formatPrice(product.price)}</span>
                        <span class="text-lg font-black text-red-600">${formatPrice(product.discountPrice)}</span>
                    ` : `
                        <span class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">${formatPrice(product.price)}</span>
                    `}
                </div>
            </div>
            
            <h3 class="font-bold text-xl text-gray-800 mb-2 leading-tight">
                <a href="product-details.html?id=${product.id}" class="hover:text-indigo-600 transition">${product.name}</a>
            </h3>
            
            <p class="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">${product.description}</p>
            
            <button onclick="addToCart(${product.id})" class="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-700">
                <span>أضف للسلة</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:translate-x-[-2px] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </button>
        </div>
    </div>
    `;
}

function getCategoryName(categoryId) {
    const categories = ProductService.getCategories();
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : categoryId;
}

// --- Toast Notification ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 left-5 flex flex-col gap-3 z-50 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = type === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = `${colors} text-white px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-y-20 opacity-0 flex items-center gap-3 pointer-events-auto min-w-[300px]`;
    toast.innerHTML = `
        <div class="bg-white/20 p-1 rounded-full">
            ${type === 'success'
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'}
        </div>
        <span class="font-bold text-sm">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    const btn = document.getElementById('mobile-menu-toggle') || document.getElementById('mobile-menu-btn'); // Handle both IDs used in project
    const menu = document.querySelector('aside') || document.getElementById('mobile-menu'); // Handle admin vs public layout

    if (btn && menu) {
        btn.addEventListener('click', () => {
            if (menu.tagName === 'ASIDE') menu.classList.toggle('hidden');
            else menu.classList.toggle('hidden');
        });
    }
});

// --- Support System ---
function submitTicket(event) {
    event.preventDefault();

    const typeSelect = document.getElementById('ticket-type');
    const contactInput = document.getElementById('ticket-contact');
    const messageInput = document.getElementById('ticket-message');

    const type = typeSelect.value;
    const contact = contactInput.value.trim();
    const message = messageInput.value.trim();

    if (!type || !contact || !message) {
        showToast('الرجاء تعبئة جميع الحقول', 'error');
        return;
    }

    const ticket = {
        id: Date.now(),
        date: new Date().toISOString(),
        type: type,
        contact: contact,
        message: message,
        status: 'new'
    };

    const tickets = JSON.parse(localStorage.getItem('customer_tickets')) || [];
    tickets.push(ticket);
    localStorage.setItem('customer_tickets', JSON.stringify(tickets));

    // Reset Form
    typeSelect.value = '';
    contactInput.value = '';
    messageInput.value = '';

    showToast('تم إرسال بلاغك بنجاح، شكراً لتواصلك!', 'success');
}
