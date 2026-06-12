/**
 * Board Game Store - Core Logic
 */

// State Management
const State = {
    cart: JSON.parse(localStorage.getItem('boardGameCart')) || [],
    currencyCode: 'IQD'
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function formatPrice(basePrice) {
    const num = Number(basePrice);
    if (isNaN(num)) return '0 د.ع';
    return num.toLocaleString('en-US') + ' د.ع';
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

    // Check stock limit
    if (existingItem) {
        if (existingItem.quantity + 1 > (product.quantity != null ? product.quantity : 100)) { // Fallback if quantity not set
            showToast('عذراً، لا تتوفر كمية إضافية من هذا المنتج', 'error');
            return;
        }
        existingItem.quantity += 1;
        // Update price in case it changed
        existingItem.price = finalPrice;
    } else {
        if (1 > (product.quantity != null ? product.quantity : 100)) {
            showToast('عذراً، هذا المنتج غير متوفر حالياً', 'error');
            return;
        }
        State.cart.push({
            id: product.id,
            name: product.name,
            price: finalPrice,
            originalPrice: product.price,
            image: product.image,
            category: product.category,
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
        // Validation for increasing quantity
        if (change > 0) {
            const product = ProductService.getById(productId);
            // We use the product data from service to get latest stock info
            // If product not found in service (deleted?), rely on item data or default
            const maxStock = product ? (product.quantity != null ? product.quantity : 100) : 100;

            if (item.quantity + change > maxStock) {
                showToast('عذراً، هذه هي الكمية المتوفرة فقط', 'error');
                return;
            }
        }

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

function createProductCard(product) {
    const isOutOfStock = (product.quantity || 0) <= 0;
    // Check for discount (Discount Price exists AND is lower than Regular Price)
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

    const safeName = escapeHtml(product.name);
    const safeDesc = escapeHtml(product.description || '');
    const safeCategory = escapeHtml(getCategoryName(product.category));
    return `
    <div class="product-card bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full group relative" data-aos="fade-up" role="article" aria-label="${safeName}">
        <div class="product-image-container relative h-64 bg-gray-50 overflow-hidden">
            <img src="${product.image}" alt="${safeName}" class="w-full h-full object-contain p-8" loading="lazy">
            
            <div class="absolute top-4 right-4 flex flex-col gap-2 z-10 w-full px-4 items-end">
                ${product.isFeatured ? '<span class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-indigo-900 text-xs font-black px-3 py-1.5 rounded-full shadow-lg self-end">الجديد ★</span>' : ''}
                ${hasDiscount ? `
                    <span class="bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse self-end mb-1">عرض خاص 🔥</span>
                    <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg self-end" dir="ltr">-${discountPercent}%</span>
                ` : ''}
                ${isOutOfStock ? '<span class="bg-gray-800 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg self-end">نفذت الكمية</span>' : ''}
            </div>
            
            <a href="product-details.html?id=${product.id}" class="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]" aria-label="عرض تفاصيل ${safeName}">
                 <span class="transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 bg-white text-indigo-700 px-6 py-2.5 rounded-full font-bold shadow-2xl flex items-center gap-2">
                    <i class="fas fa-eye"></i> التفاصيل
                 </span>
            </a>
        </div>
        
        <div class="p-6 flex-grow flex flex-col relative z-20 bg-white">
            <div class="flex justify-between items-center mb-3">
                <span class="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">${safeCategory}</span>
                <div class="flex flex-col items-end">
                    ${hasDiscount ? `
                        <span class="text-xs line-through text-gray-400 decoration-red-500 decoration-1 mb-0.5">${formatPrice(product.price)}</span>
                        <span class="text-lg font-black text-red-600">${formatPrice(product.discountPrice)}</span>
                    ` : `
                        <span class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] to-[#60a5fa]">${formatPrice(product.price)}</span>
                    `}
                </div>
            </div>
            
            <h3 class="font-bold text-xl text-gray-800 mb-2 leading-tight">
                <a href="product-details.html?id=${product.id}" class="hover:text-indigo-600 transition">${safeName}</a>
            </h3>
            
            <p class="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow leading-relaxed">${safeDesc}</p>
            
            ${isOutOfStock ? `
             <button disabled class="w-full bg-gray-300 text-gray-500 font-bold py-3 rounded-xl shadow-none cursor-not-allowed flex items-center justify-center gap-2">
                <span>نفذت الكمية</span>
                <i class="fas fa-ban"></i>
            </button>
            ` : `
            <button onclick="addToCart(${product.id})" class="w-full btn-gradient active:scale-95 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2">
                <span>أضف للسلة</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform group-hover:translate-x-[-2px] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </button>
            `}
        </div>
    </div>
    `;
}

// --- Render Functions ---
function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-400"><i class="fas fa-box-open text-6xl mb-4 opacity-50"></i><p class="text-xl font-bold">لا توجد منتجات</p></div>';
        return;
    }

    try {
        grid.innerHTML = products.map(p => {
            try {
                return createProductCard(p);
            } catch (err) {
                console.error("Error creating card for product:", p, err);
                return '';
            }
        }).join('');
    } catch (e) {
        console.error("Critical error in renderProducts:", e);
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-red-500">حدث خطأ أثناء عرض المنتجات</div>';
    }
}

function renderFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;

    const featured = ProductService.getAll().filter(p => p.isFeatured);

    if (!featured || featured.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400"><p>لا توجد منتجات مميزة حالياً</p></div>';
        return;
    }

    container.innerHTML = featured.slice(0, 6).map(p => createProductCard(p)).join('');
}

function getCategoryName(categoryId) {
    return ProductService.getCategoryName(categoryId);
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
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt init in background or await if needed
    // Since pages might handle init, we can just ensure it starts
    ProductService.init().catch(e => console.error(e));

    updateCartCount();

    const btn = document.getElementById('mobile-menu-toggle') || document.getElementById('mobile-menu-btn'); // Handle both IDs used in project
    const menu = document.querySelector('aside') || document.getElementById('mobile-menu'); // Handle admin vs public layout

    if (btn && menu) {
        btn.addEventListener('click', () => {
            const isHidden = menu.classList.contains('hidden');
            menu.classList.toggle('hidden');
            if (btn.getAttribute('aria-expanded') !== null) {
                btn.setAttribute('aria-expanded', isHidden);
            }
        });
    }

    // Scroll To Top Logic
    const scrollBtn = document.getElementById('scroll-to-top-btn');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// --- Support System ---
async function submitTicket(event) {
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

    // Iraqi Phone Validation
    const phoneRegex = /^07[3-9]\d{8}$/;
    if (!phoneRegex.test(contact)) {
        showToast('رقم الهاتف غير صحيح. يجب أن يبدأ بـ 07 وتكون 11 رقماً.', 'error');
        contactInput.classList.add('border-red-500', 'animate-pulse');
        setTimeout(() => contactInput.classList.remove('border-red-500', 'animate-pulse'), 1500);
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإرسال...';

    const ticket = {
        type: type,
        contact: contact,
        message: message
    };

    try {
        console.log('Sending ticket:', ticket);
        
        // Add a server timestamp for better ordering
        ticket.date = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('messages').add(ticket);

        // Reset Form
        typeSelect.value = '';
        contactInput.value = '';
        messageInput.value = '';

        showToast('تم إرسال بلاغك بنجاح، شكراً لتواصلك!', 'success');
    } catch (err) {
        console.error("Full ticket error:", err);
        showToast('فشل الإرسال: ' + (err.message || 'حاول مرة أخرى'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
