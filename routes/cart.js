const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /cart - Create a new cart for the authenticated user
router.post('/', isAuthenticated, async (req, res) => {
    try {
        // Create a new cart for the authenticated user (assuming user is already authenticated)
        const createCartQuery = 'INSERT INTO carts (user_id) VALUES ($1) RETURNING id';
        const newCart = await db.query(createCartQuery, [req.user.id]);

        res.status(201).json({ cartId: newCart.rows[0].id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /cart/{cartId} - Add a product to the user's cart
router.post('/:cartId', isAuthenticated, async (req, res) => {
    const cartId = req.params.cartId;
    const { productId, quantity } = req.body;

    try {
        // Check if the cart belongs to the authenticated user
        const cartOwnershipCheckQuery = 'SELECT * FROM carts WHERE id = $1 AND user_id = $2';
        const cartOwnershipCheck = await db.query(cartOwnershipCheckQuery, [cartId, req.user.id]);

        if (cartOwnershipCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Add the product to the cart (assuming you have a 'cart_items' table)
        const addToCartQuery = 'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)';
        await db.query(addToCartQuery, [cartId, productId, quantity]);

        res.status(201).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /cart/{cartId} - Retrieve the user's cart information
router.get('/:cartId', isAuthenticated, async (req, res) => {
    const cartId = req.params.cartId;

    try {
        // Check if the cart belongs to the authenticated user
        const cartOwnershipCheckQuery = 'SELECT * FROM carts WHERE id = $1 AND user_id = $2';
        const cartOwnershipCheck = await db.query(cartOwnershipCheckQuery, [cartId, req.user.id]);

        if (cartOwnershipCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Retrieve cart items
        const getCartItemsQuery = 'SELECT product_id, quantity FROM cart_items WHERE cart_id = $1';
        const cartItems = await db.query(getCartItemsQuery, [cartId]);

        res.status(200).json({ cartId, items: cartItems.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /cart/{cartId}/checkout - Checkout and create an order
router.post('/:cartId/checkout', isAuthenticated, async (req, res) => {
    const cartId = req.params.cartId;

    try {
        // Check if the cart belongs to the authenticated user
        const cartOwnershipCheckQuery = 'SELECT * FROM carts WHERE id = $1 AND user_id = $2';
        const cartOwnershipCheck = await db.query(cartOwnershipCheckQuery, [cartId, req.user.id]);

        if (cartOwnershipCheck.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Simulate payment processing (replace with actual payment logic)
        const paymentStatus = 'success';

        if (paymentStatus !== 'success') {
            return res.status(400).json({ error: 'Payment failed' });
        }

        // Create an order to reflect the successful payment
        const createOrderQuery = 'INSERT INTO orders (user_id, cart_id) VALUES ($1, $2) RETURNING id';
        const newOrder = await db.query(createOrderQuery, [req.user.id, cartId]);

        // Clear the cart (assuming you have a 'cart_items' table)
        const clearCartQuery = 'DELETE FROM cart_items WHERE cart_id = $1';
        await db.query(clearCartQuery, [cartId]);

        res.status(201).json({ orderId: newOrder.rows[0].id, message: 'Checkout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
}

module.exports = router;