const initialProducts = [
    {
        id: 1,
        name: "Catan",
        price: 40,
        category: "strategy",
        image: "image/1.png",
        description: "The Classic Strategy Game. Gather resources, build settlements, and control the island.",
        isFeatured: true
    },
    {
        id: 2,
        name: "Ticket to Ride",
        price: 48,
        category: "family",
        image: "image/2.png",
        description: "Cross-country train adventure. Collect cards and connect cities.",
        isFeatured: true
    },
    {
        id: 3,
        name: "Codenames",
        price: 24,
        category: "party",
        image: "image/3.png",
        description: "Social word game. Can you guess your team's words before the others?",
        isFeatured: false
    },
    {
        id: 4,
        name: "Pandemic",
        price: 43,
        category: "strategy",
        image: "image/4.png",
        description: "Co-op game. Work together to save the world from disease outbreaks.",
        isFeatured: false
    },
    {
        id: 5,
        name: "Splendor",
        price: 38,
        category: "strategy",
        image: "image/5.png",
        description: "Gem collecting chip game. Build your merchant empire.",
        isFeatured: true
    },
    {
        id: 6,
        name: "Dixit",
        price: 35,
        category: "party",
        image: "image/6.png",
        description: "Imaginative guessing game with beautiful artwork.",
        isFeatured: false
    },
    {
        id: 7,
        name: "Exploding Kittens",
        price: 22,
        category: "party",
        image: "image/7.png",
        description: "Fast-paced card game... beware of the exploding cats!",
        isFeatured: true
    },
    {
        id: 8,
        name: "Azul",
        price: 41,
        category: "family",
        image: "image/8.png",
        description: "Beautiful tile-laying game. Decorate the royal palace.",
        isFeatured: false
    }
];

const initialCategories = [
    { id: 'strategy', name: 'Strategy' },
    { id: 'family', name: 'Family' },
    { id: 'party', name: 'Party' }
];

const initialCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 } // Base currency
];

// Data Service
const ProductService = {
    // Products
    getAll: function () {
        const stored = localStorage.getItem('boardGameProducts');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error("Error parsing products from localStorage", e);
            }
        }
        localStorage.setItem('boardGameProducts', JSON.stringify(initialProducts));
        return initialProducts;
    },

    saveAll: function (products) {
        localStorage.setItem('boardGameProducts', JSON.stringify(products));
    },

    getById: function (id) {
        const products = this.getAll();
        return products.find(p => p.id === parseInt(id));
    },

    add: function (product) {
        const products = this.getAll();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        const newProduct = { ...product, id: newId };
        products.push(newProduct);
        this.saveAll(products);
        return newProduct;
    },

    update: function (id, data) {
        const products = this.getAll();
        const index = products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = { ...products[index], ...data };
            this.saveAll(products);
            return products[index];
        }
        return null;
    },

    delete: function (id) {
        let products = this.getAll();
        products = products.filter(p => p.id !== parseInt(id));
        this.saveAll(products);
    },

    toggleFeatured: function (id) {
        const products = this.getAll();
        const product = products.find(p => p.id === parseInt(id));
        if (product) {
            product.isFeatured = !product.isFeatured;
            this.saveAll(products);
            return product.isFeatured;
        }
    },

    // Categories
    getCategories: function () {
        const stored = localStorage.getItem('boardGameCategories');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                console.error("Error parsing categories from localStorage", e);
            }
        }

        localStorage.setItem('boardGameCategories', JSON.stringify(initialCategories));
        return initialCategories;
    },

    addCategory: function (name) {
        const categories = this.getCategories();
        const id = 'cat_' + Date.now();
        categories.push({ id, name });
        localStorage.setItem('boardGameCategories', JSON.stringify(categories));
        return { id, name };
    },

    updateCategory: function (id, newName) {
        const categories = this.getCategories();
        const category = categories.find(c => c.id === id);
        if (category) {
            category.name = newName;
            localStorage.setItem('boardGameCategories', JSON.stringify(categories));
            return category;
        }
        return null;
    },

    deleteCategory: function (id) {
        let categories = this.getCategories();
        // Check if any products use this category
        const products = this.getAll();
        const hasProducts = products.some(p => p.category === id);

        if (hasProducts) {
            return { success: false, message: 'لا يمكن حذف فئة تحتوي على منتجات' };
        }

        categories = categories.filter(c => c.id !== id);
        localStorage.setItem('boardGameCategories', JSON.stringify(categories));
        return { success: true };
    },

    // Currency
    getCurrencies: function () {
        const stored = localStorage.getItem('boardGameCurrencies');
        if (stored) return JSON.parse(stored);

        localStorage.setItem('boardGameCurrencies', JSON.stringify(initialCurrencies));
        return initialCurrencies;
    },

    addCurrency: function (code, name, symbol, rate) {
        const currencies = this.getCurrencies();
        // Prevent dupes
        if (currencies.find(c => c.code === code)) return null;

        const newCurrency = { code, name, symbol, rate: parseFloat(rate) };
        currencies.push(newCurrency);
        localStorage.setItem('boardGameCurrencies', JSON.stringify(currencies));
        return newCurrency;
    },

    removeCurrency: function (code) {
        if (code === 'USD') return; // Cannot remove base
        let currencies = this.getCurrencies();
        currencies = currencies.filter(c => c.code !== code);
        localStorage.setItem('boardGameCurrencies', JSON.stringify(currencies));
    }
};

// Global shorthand
let products = ProductService.getAll();
function getProductById(id) { return ProductService.getById(id); }
function getFeaturedProducts() { return ProductService.getAll().filter(p => p.isFeatured); }
