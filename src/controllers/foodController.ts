const Food = require('../models/Food');

/**
 * Get all food items with optional filtering
 * @route GET /api/food
 * @description Retrieves all food items with optional category and search filters
 * @param {Request} req - Express request object with optional query params (category, search)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns array of food items
 * @access Public
 */
exports.getAllFood = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const foods = await Food.find(query).sort({ createdAt: -1 });
    res.status(200).json({ foods });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single food item by ID
 * @route GET /api/food/:id
 * @description Retrieves detailed information about a specific food item
 * @param {Request} req - Express request object with food ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns food object
 * @throws {404} If food item not found
 * @access Public
 */
exports.getFoodById = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.status(200).json({ food });
  } catch (error) {
    next(error);
  }
};

/**
 * Add new food item
 * @route POST /api/food
 * @description Creates a new food item with image (Admin only)
 * @param {Request} req - Express request object with food data and image file
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns created food object
 * @throws {400} If food image is missing
 * @access Private (Admin only)
 */
exports.addFood = async (req, res, next) => {
  try {
    const { name, description, category, price, preparationTime, isVegetarian, spiceLevel } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Food image is required' });
    }

    const food = new Food({
      name,
      description,
      category,
      price,
      image: req.file.filename,
      preparationTime: preparationTime || 30,
      isVegetarian: isVegetarian || false,
      spiceLevel: spiceLevel || 'medium'
    });

    await food.save();

    res.status(201).json({
      message: 'Food added successfully',
      food
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing food item
 * @route PUT /api/food/:id
 * @description Updates food item details and/or image (Admin only)
 * @param {Request} req - Express request object with food ID and update data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns updated food object
 * @throws {404} If food item not found
 * @access Private (Admin only)
 */
exports.updateFood = async (req, res, next) => {
  try {
    const { name, description, category, price, preparationTime, isAvailable, isVegetarian, spiceLevel } = req.body;

    let food = await Food.findById(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    if (name) food.name = name;
    if (description) food.description = description;
    if (category) food.category = category;
    if (price) food.price = price;
    if (preparationTime) food.preparationTime = preparationTime;
    if (isAvailable !== undefined) food.isAvailable = isAvailable;
    if (isVegetarian !== undefined) food.isVegetarian = isVegetarian;
    if (spiceLevel) food.spiceLevel = spiceLevel;

    if (req.file) {
      food.image = req.file.filename;
    }

    await food.save();

    res.status(200).json({
      message: 'Food updated successfully',
      food
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete food item
 * @route DELETE /api/food/:id
 * @description Removes a food item from the database (Admin only)
 * @param {Request} req - Express request object with food ID in params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Returns success message
 * @throws {404} If food item not found
 * @access Private (Admin only)
 */
exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }
    res.status(200).json({ message: 'Food deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export {};
