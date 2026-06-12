// Data Service with Firebase Firestore
const ProductService = {
    products: [],
    categories: [],
    orders: [],

    initialized: false,
    _initPromise: null,

    init: async function () {
        if (this.initialized) return;
        if (this._initPromise) return this._initPromise;

        this._initPromise = this._doInit();
        return this._initPromise;
    },

    refresh: async function () {
        this.initialized = false;
        this._initPromise = null;
        try { localStorage.removeItem('bg_cache'); } catch (e) { /* ignore */ }
        return this.init();
    },

    _doInit: async function () {
        console.log('Initializing ProductService...');
        try {
            // Try localStorage cache first for instant response
            if (this._cacheLoad()) {
                this.initialized = true;
                // Background Firestore refresh without blocking the caller
                this._fetchFresh().catch(e => console.error('Background refresh:', e));
                return;
            }

            // No cache available: fetch from Firestore (parallelized)
            await this._fetchFresh();
        } catch (err) {
            this._initPromise = null;
            if (this.products.length === 0) {
                console.error('Error initializing ProductService:', err);
            }
        }
    },

    _fetchFresh: async function () {
        const [catSnapshot, prodSnapshot] = await Promise.all([
            db.collection('categories').get(),
            db.collection('products').get()
        ]);

        this.categories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.products = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        this._cacheSave();
        this.initialized = true;
        console.log('ProductService loaded', this.products.length, 'products');
    },

    _cacheSave: function () {
        try {
            const data = {
                products: this.products,
                categories: this.categories,
                timestamp: Date.now()
            };
            localStorage.setItem('bg_cache', JSON.stringify(data));
        } catch (e) {
            // localStorage full or unavailable
        }
    },

    _cacheLoad: function () {
        try {
            const raw = localStorage.getItem('bg_cache');
            if (!raw) return false;
            const cache = JSON.parse(raw);
            const TTL = 5 * 60 * 1000;
            if (Date.now() - cache.timestamp > TTL) return false;
            if (!Array.isArray(cache.products) || !Array.isArray(cache.categories)) return false;

            this.products = cache.products;
            this.categories = cache.categories;
            return true;
        } catch (e) {
            return false;
        }
    },

    // Products - Read (Sync from local state)
    getAll: function () {
        return this.products;
    },

    getById: function (id) {
        return this.products.find(p => String(p.id) === String(id));
    },

    // Products - Write (Async to Firebase + Local Update)
    add: async function (product) {
        const { id, ...prodData } = product;
        const docRef = await db.collection('products').add(prodData);
        
        const newProduct = { id: docRef.id, ...prodData };
        this.products.push(newProduct);
        return newProduct;
    },

    update: async function (id, updates) {
        await db.collection('products').doc(String(id)).update(updates);

        const index = this.products.findIndex(p => String(p.id) === String(id));
        let updated = {};
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...updates };
            updated = this.products[index];
        }
        return updated;
    },

    delete: async function (id) {
        await db.collection('products').doc(String(id)).delete();
        this.products = this.products.filter(p => String(p.id) !== String(id));
    },

    toggleFeatured: async function (id) {
        const product = this.getById(id);
        if (product) {
            return await this.update(id, { isFeatured: !product.isFeatured });
        }
    },

    // Categories
    getCategories: function () {
        return this.categories;
    },

    getCategoryName: function (id) {
        const cat = this.categories.find(c => String(c.id) === String(id));
        return cat ? cat.name : 'غير محدد';
    },

    addCategory: async function (name) {
        const docRef = await db.collection('categories').add({ name });
        const newCat = { id: docRef.id, name };
        this.categories.push(newCat);
        return newCat;
    },

    updateCategory: async function (id, newName) {
        await db.collection('categories').doc(String(id)).update({ name: newName });
        const index = this.categories.findIndex(c => String(c.id) === String(id));
        if (index !== -1) this.categories[index].name = newName;
        return this.categories[index];
    },

    deleteCategory: async function (id) {
        // Check dependency - compare as string
        const hasProducts = this.products.some(p => String(p.category) === String(id));
        if (hasProducts) {
            return { success: false, message: 'لا يمكن حذف فئة تحتوي على منتجات' };
        }

        await db.collection('categories').doc(String(id)).delete();
        this.categories = this.categories.filter(c => String(c.id) !== String(id));
        return { success: true };
    },

    // Currency
    getCurrencies: function () {
        return [{ code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 }];
    }
};

// Global shorthand (Proxies to service)
function getProductById(id) { return ProductService.getById(id); }
function getFeaturedProducts() { return ProductService.getAll().filter(p => p.isFeatured); }
