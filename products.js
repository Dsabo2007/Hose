
// Data Service with Supabase
const ProductService = {
    products: [],
    categories: [],
    orders: [],

    initialized: false,

    // Initialize: Fetch data from Supabase
    init: async function () {
        if (this.initialized) return;
        console.log('Initializing ProductService...');
        try {
            // Fetch Categories
            const { data: cats, error: catError } = await supabase.from('categories').select('*');
            if (catError) throw catError;
            this.categories = cats || [];

            // Fetch Products
            const { data: prods, error: prodError } = await supabase.from('products').select('*');
            if (prodError) throw prodError;
            this.products = prods || [];

            // Fetch Orders (for admin) is separate usually, but we can init if needed.
            // For now, products and categories are critical for global usage.

            console.log('ProductService initialized with', this.products.length, 'products');
            this.initialized = true;
        } catch (err) {
            console.error('Error initializing ProductService:', err);
            // Fallback to localStorage or empty if offline/error? 
            // For now, let's just log it.
        }
    },

    // Products - Read (Sync from local state)
    getAll: function () {
        return this.products;
    },

    getById: function (id) {
        return this.products.find(p => p.id === parseInt(id));
    },

    // Products - Write (Async to Supabase + Local Update)
    add: async function (product) {
        // Remove ID if present to let Supabase verify auto-increment, or generate ID if not auto-increment.
        // Assuming Supabase 'products' table has 'id' as serial/identity.
        const { id, ...prodData } = product;

        const { data, error } = await supabase.from('products').insert([prodData]).select();
        if (error) {
            console.error('Error adding product:', error);
            throw error;
        }
        const newProduct = data[0];
        this.products.push(newProduct);
        return newProduct;
    },

    update: async function (id, updates) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', parseInt(id))
            .select();

        if (error) {
            console.error('Error updating product:', error);
            throw error;
        }

        const updated = data[0];
        const index = this.products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            this.products[index] = updated;
        }
        return updated;
    },

    delete: async function (id) {
        const { error } = await supabase.from('products').delete().eq('id', parseInt(id));
        if (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
        this.products = this.products.filter(p => p.id !== parseInt(id));
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
        const cat = this.categories.find(c => c.id === parseInt(id));
        return cat ? cat.name : 'غير محدد';
    },

    addCategory: async function (name) {
        // Let Supabase auto-generate the ID
        const { data, error } = await supabase.from('categories').insert([{ name }]).select();

        if (error) throw error;

        this.categories.push(data[0]);
        return data[0];
    },

    updateCategory: async function (id, newName) {
        const { data, error } = await supabase
            .from('categories')
            .update({ name: newName })
            .eq('id', id)
            .select();

        if (error) throw error;

        const index = this.categories.findIndex(c => c.id === id);
        if (index !== -1) this.categories[index] = data[0];
        return data[0];
    },

    deleteCategory: async function (id) {
        // Check dependency - compare as integers
        const hasProducts = this.products.some(p => p.category === parseInt(id));
        if (hasProducts) {
            return { success: false, message: 'لا يمكن حذف فئة تحتوي على منتجات' };
        }

        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;

        this.categories = this.categories.filter(c => c.id !== parseInt(id));
        return { success: true };
    },

    // Currency (Keep Local or Hardcode USD/IQD logic as it was simplified)
    getCurrencies: function () {
        // Enforce IQD as requested previously
        return [{ code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 }];
    }
};

// Global shorthand (Proxies to service)
// NOTE: These might be empty until init() completes!
// We will need to ensure init() is called.
function getProductById(id) { return ProductService.getById(id); }
function getFeaturedProducts() { return ProductService.getAll().filter(p => p.isFeatured); }
