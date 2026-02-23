const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Jhasha Restaurant API',
      version: '1.0.0',
      description: 'RESTful API for Jhasha Restaurant Management System',
      contact: {
        name: 'API Support',
        email: 'support@jhasharestaurant.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.jhasharestaurant.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            phone: { type: 'string', example: '+1234567890' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            profileImage: { type: 'string', example: '/uploads/profile.jpg' },
            address: { type: 'string', example: '123 Main St' },
            city: { type: 'string', example: 'New York' },
            zipCode: { type: 'string', example: '10001' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Food: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Chicken Momo' },
            description: { type: 'string', example: 'Delicious steamed dumplings' },
            category: {
              type: 'string',
              enum: ['starter', 'main_course', 'dessert', 'beverage', 'side_dish'],
              example: 'starter',
            },
            price: { type: 'number', format: 'float', example: 12.99 },
            image: { type: 'string', example: '/uploads/momo.jpg' },
            preparationTime: { type: 'number', example: 30 },
            isAvailable: { type: 'boolean', example: true },
            isVegetarian: { type: 'boolean', example: false },
            spiceLevel: { type: 'string', enum: ['mild', 'medium', 'hot'], example: 'medium' },
            rating: { type: 'number', format: 'float', minimum: 0, maximum: 5, example: 4.5 },
            totalOrders: { type: 'number', example: 150 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  foodId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  quantity: { type: 'number', example: 2 },
                  price: { type: 'number', example: 12.99 },
                },
              },
            },
            totalAmount: { type: 'number', example: 25.98 },
            deliveryAddress: { type: 'string', example: '123 Main St' },
            deliveryCity: { type: 'string', example: 'New York' },
            deliveryZipCode: { type: 'string', example: '10001' },
            phoneNumber: { type: 'string', example: '+1234567890' },
            paymentMethod: { type: 'string', enum: ['online', 'cash_on_delivery'], example: 'online' },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              example: 'completed',
            },
            orderStatus: {
              type: 'string',
              enum: ['pending', 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
              example: 'confirmed',
            },
            transactionId: { type: 'string', example: 'ch_3MG3dC2eZvKYlo2C0p9hQ9Oi' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
