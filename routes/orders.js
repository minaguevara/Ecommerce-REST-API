const express = require('express');
const router = express.Router();

// Import your PostgreSQL connection here
const db = require('../db');

// GET /orders - Get a list of all orders for the authenticated user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        // Retrieve all orders for the authenticated user
        const getOrdersQuery = 'SELECT id, created_at FROM orders WHERE user_id = $1';
        const orders = await db.query(getOrdersQuery, [req.user.id]);

        res.status(200).json(orders.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /orders/{orderId} - Get details of a specific order
router.get('/:orderId', isAuthenticated, async (req, res) => {
    const orderId = req.params.orderId;

    try {
        // Retrieve details of the specified order
        const getOrderQuery = 'SELECT id, created_at FROM orders WHERE id = $1 AND user_id = $2';
        const order = await db.query(getOrderQuery, [orderId, req.user.id]);

        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Retrieve order items (assuming you have an 'order_items' table)
        const getOrderItemsQuery = 'SELECT product_id, quantity FROM order_items WHERE order_id = $1';
        const orderItems = await db.query(getOrderItemsQuery, [orderId]);

        res.status(200).json({ order: order.rows[0], items: orderItems.rows });
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
