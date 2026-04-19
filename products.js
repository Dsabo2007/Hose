// Data Service with Firebase Firestore
const ProductService = {
    products: [],
    categories: [],
    orders: [],

    initialized: false,

    // Initialize: Fetch data from Firebase
    init: async function () {
        if (this.initialized) return;
        console.log('Initializing ProductService...');
        try {
            // Fetch Categories
            const catSnapshot = await db.collection('categories').get();
            this.categories = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Fetch Products
            const prodSnapshot = await db.collection('products').get();
            this.products = prodSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log('ProductService initialized with', this.products.length, 'products');
            this.initialized = true;
        } catch (err) {
            console.error('Error initializing ProductService:', err);
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
