const Order = require('../models/Order');

/**
 * Real-Time Order Tracking Controller
 * Provides live order status updates, estimated delivery time, and driver information
 */

// Get detailed tracking information for an order
exports.getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('customerId', 'name email phone')
      .populate('items.foodId', 'name price image');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user has access to this order
    const userId = req.user.userId;
    const isOwner = order.customerId && order.customerId._id && order.customerId._id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate estimated delivery time based on order status
    const estimatedDelivery = calculateEstimatedDelivery(order);

    // Get order timeline
    const timeline = getOrderTimeline(order);

    // Mock driver information (in production, this would come from a driver management system)
    const driverInfo = order.status === 'Out for Delivery' ? {
      name: 'John Driver',
      phone: '+1 234 567 8900',
      vehicle: 'Bike',
      rating: 4.8,
      currentLocation: {
        lat: 40.7128,
        lng: -74.0060
      }
    } : null;

    res.json({
      order: {
        _id: order._id,
        orderNumber: `#${order._id.toString().slice(-8).toUpperCase()}`,
        orderStatus: order.orderStatus,
        status: order.status,
        items: order.items,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        customer: order.customerId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        statusHistory: order.statusHistory
      },
      tracking: {
        currentStatus: order.status,
        estimatedDelivery,
        timeline,
        driver: driverInfo,
        statusPercentage: getStatusPercentage(order.status)
      }
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    res.status(500).json({ message: 'Unable to load order tracking information. Please try again.' });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    let { status, notes } = req.body;

    // Normalize status using a mapping
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready',
      'out_for_delivery': 'Out for Delivery',
      'out for delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };

    status = statusMap[status.toLowerCase()];

    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Ready'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order status
    order.orderStatus = status.toLowerCase().replace(/\s+/g, '_');
    order.status = status;
    
    // Add status change to history (store lowercase)
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    const userId = req.user.userId;
    const lowercaseStatus = status.toLowerCase().replace(/\s+/g, '_');
    order.statusHistory.push({
      status: lowercaseStatus,
      timestamp: new Date(),
      updatedBy: userId,
      notes: notes || ''
    });

    await order.save();

    // In production, trigger real-time notification to customer via WebSocket/Push Notification
    // notifyCustomer(order.customerId, { orderId, status });

    res.json({
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        status: order.status,
        statusHistory: order.statusHistory,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Unable to update order status. Please try again.' });
  }
};

// Get all active deliveries (Admin only)
exports.getActiveDeliveries = async (req, res) => {
  try {
    const activeStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery'];
    
    const orders = await Order.find({ orderStatus: { $in: activeStatuses } })
      .populate('customerId', 'name phone address')
      .sort({ createdAt: -1 });

    const deliveries = orders.map(order => ({
      _id: order._id,
      orderNumber: `#${order._id.toString().slice(-8).toUpperCase()}`,
      customer: order.customerId,
      orderStatus: order.orderStatus,
      status: order.status,
      totalAmount: order.totalAmount,
      estimatedDelivery: calculateEstimatedDelivery(order),
      createdAt: order.createdAt
    }));

    res.json({
      count: deliveries.length,
      deliveries
    });
  } catch (error) {
    console.error('Error fetching active deliveries:', error);
    res.status(500).json({ message: 'Unable to load active deliveries. Please refresh the page.' });
  }
};

// Calculate estimated delivery time based on order status
function calculateEstimatedDelivery(order) {
  const now = new Date();
  const orderTime = new Date(order.createdAt);
  
  let estimatedMinutes;
  
  switch (order.status) {
    case 'Pending':
      estimatedMinutes = 45;
      break;
    case 'Confirmed':
      estimatedMinutes = 40;
      break;
    case 'Preparing':
      estimatedMinutes = 30;
      break;
    case 'Out for Delivery':
      estimatedMinutes = 15;
      break;
    case 'Delivered':
      return 'Delivered';
    case 'Cancelled':
      return 'Cancelled';
    default:
      estimatedMinutes = 45;
  }

  const estimatedTime = new Date(now.getTime() + estimatedMinutes * 60000);
  
  return {
    minutes: estimatedMinutes,
    time: estimatedTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };
}

// Get order timeline with timestamps
function getOrderTimeline(order) {
  const timeline = [];
  
  const statusFlow = [
    { status: 'Pending', icon: '📝', label: 'Order Placed' },
    { status: 'Confirmed', icon: '✅', label: 'Order Confirmed' },
    { status: 'Preparing', icon: '👨‍🍳', label: 'Being Prepared' },
    { status: 'Out for Delivery', icon: '🚴', label: 'Out for Delivery' },
    { status: 'Delivered', icon: '🎉', label: 'Delivered' }
  ];

  statusFlow.forEach(stage => {
    const statusEntry = order.statusHistory?.find(h => h.status === stage.status);
    
    timeline.push({
      status: stage.status,
      icon: stage.icon,
      label: stage.label,
      completed: statusEntry ? true : false,
      timestamp: statusEntry?.timestamp || null,
      notes: statusEntry?.notes || null
    });
  });

  return timeline;
}

// Calculate status percentage for progress bar
function getStatusPercentage(status) {
  const percentages = {
    'Pending': 20,
    'Confirmed': 40,
    'Preparing': 60,
    'Out for Delivery': 80,
    'Delivered': 100,
    'Cancelled': 0
  };
  
  return percentages[status] || 0;
}

export {};
