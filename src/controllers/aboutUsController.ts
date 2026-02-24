const AboutUs = require('../models/AboutUs');

/**
 * Get About Us information (Public)
 * @route GET /api/about
 */
exports.getAboutUs = async (req, res) => {
  try {
    let aboutUs = await AboutUs.findOne({ isActive: true });

    // If no About Us exists, create default
    if (!aboutUs) {
      aboutUs = await AboutUs.create({
        title: 'About Jhasha Restaurant',
        description: 'Welcome to Jhasha Restaurant, Nepal\'s premier destination for authentic Nepali cuisine and delightful dining experiences.',
        story: 'Established in 2020 in the vibrant streets of Kathmandu, Jhasha Restaurant was born from a passion to share the rich culinary traditions of Nepal with food lovers across the nation. Our journey began with a simple mission: to serve authentic, home-style Nepali food that reminds you of your grandmother\'s kitchen, now available at your doorstep.',
        mission: 'To preserve and promote authentic Nepali cuisine while delivering exceptional food quality and memorable dining experiences to every customer.',
        vision: 'To become Nepal\'s most beloved food delivery service, recognized for quality, authenticity, and customer satisfaction.',
        address: 'Thamel, Kathmandu 44600, Nepal',
        phone: '+977-9812345678',
        email: 'contact@jhasharestaurant.com.np',
        openingHours: 'Sunday - Saturday: 10:00 AM - 10:00 PM',
        specialties: [
          'Traditional Dal Bhat',
          'Authentic Momo (Steamed & Fried)',
          'Newari Khaja Set',
          'Thakali Thali',
          'Sel Roti & Traditional Desserts'
        ],
        achievements: [
          {
            title: 'Best Restaurant Award 2023',
            description: 'Recognized as Best Traditional Restaurant in Kathmandu',
            year: '2023'
          },
          {
            title: 'Customer Choice Award',
            description: 'Most loved food delivery service on major platforms',
            year: '2022'
          },
          {
            title: 'Excellence in Service',
            description: 'Certificate of Excellence for outstanding customer service',
            year: '2021'
          }
        ],
        teamSize: 35,
        yearsOfService: 4,
        customersServed: 15000,
        socialMedia: {
          facebook: 'https://facebook.com/jhasharestaurant',
          instagram: 'https://instagram.com/jhasharestaurant',
          twitter: 'https://twitter.com/jhasharestaurant'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: aboutUs
    });
  } catch (error) {
    console.error('Get About Us error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching About Us information'
    });
  }
};

/**
 * Update About Us information (Admin only)
 * @route PUT /api/about
 */
exports.updateAboutUs = async (req, res) => {
  try {
    const {
      title,
      description,
      story,
      mission,
      vision,
      address,
      phone,
      email,
      openingHours,
      specialties,
      achievements,
      teamSize,
      yearsOfService,
      customersServed,
      socialMedia
    } = req.body;

    // Validate Nepal phone number format
    if (phone) {
      const phoneRegex = /^\+977-?[9][6-9]\d{8}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Nepal phone number. Must start with +977 followed by 10 digits (starting with 9)'
        });
      }
    }

    let aboutUs = await AboutUs.findOne({ isActive: true });

    if (!aboutUs) {
      // Create new About Us document
      aboutUs = await AboutUs.create({
        title,
        description,
        story,
        mission,
        vision,
        address,
        phone,
        email,
        openingHours,
        specialties,
        achievements,
        teamSize,
        yearsOfService,
        customersServed,
        socialMedia,
        lastUpdatedBy: req.user._id
      });
    } else {
      // Update existing document
      if (title) aboutUs.title = title;
      if (description) aboutUs.description = description;
      if (story) aboutUs.story = story;
      if (mission) aboutUs.mission = mission;
      if (vision) aboutUs.vision = vision;
      if (address) aboutUs.address = address;
      if (phone) aboutUs.phone = phone;
      if (email) aboutUs.email = email;
      if (openingHours) aboutUs.openingHours = openingHours;
      if (specialties) aboutUs.specialties = specialties;
      if (achievements) aboutUs.achievements = achievements;
      if (teamSize) aboutUs.teamSize = teamSize;
      if (yearsOfService) aboutUs.yearsOfService = yearsOfService;
      if (customersServed) aboutUs.customersServed = customersServed;
      if (socialMedia) aboutUs.socialMedia = { ...aboutUs.socialMedia, ...socialMedia };
      
      aboutUs.lastUpdatedBy = req.user._id;
      await aboutUs.save();
    }

    res.status(200).json({
      success: true,
      message: 'About Us updated successfully',
      data: aboutUs
    });
  } catch (error) {
    console.error('Update About Us error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating About Us information'
    });
  }
};

/**
 * Add achievement (Admin only)
 * @route POST /api/about/achievement
 */
exports.addAchievement = async (req, res) => {
  try {
    const { title, description, year } = req.body;

    if (!title || !description || !year) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and year are required'
      });
    }

    let aboutUs = await AboutUs.findOne({ isActive: true });

    if (!aboutUs) {
      return res.status(404).json({
        success: false,
        message: 'About Us not found. Please create it first.'
      });
    }

    aboutUs.achievements.push({ title, description, year });
    aboutUs.lastUpdatedBy = req.user._id;
    await aboutUs.save();

    res.status(200).json({
      success: true,
      message: 'Achievement added successfully',
      data: aboutUs
    });
  } catch (error) {
    console.error('Add achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding achievement'
    });
  }
};

/**
 * Remove achievement (Admin only)
 * @route DELETE /api/about/achievement/:id
 */
exports.removeAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    let aboutUs = await AboutUs.findOne({ isActive: true });

    if (!aboutUs) {
      return res.status(404).json({
        success: false,
        message: 'About Us not found'
      });
    }

    aboutUs.achievements = aboutUs.achievements.filter(
      achievement => achievement._id.toString() !== id
    );
    
    aboutUs.lastUpdatedBy = req.user._id;
    await aboutUs.save();

    res.status(200).json({
      success: true,
      message: 'Achievement removed successfully',
      data: aboutUs
    });
  } catch (error) {
    console.error('Remove achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing achievement'
    });
  }
};

/**
 * Upload About Us image (Admin only)
 * @route POST /api/about/image
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    let aboutUs = await AboutUs.findOne({ isActive: true });

    if (!aboutUs) {
      return res.status(404).json({
        success: false,
        message: 'About Us not found'
      });
    }

    aboutUs.images.push(req.file.path);
    aboutUs.lastUpdatedBy = req.user._id;
    await aboutUs.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: aboutUs
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
};
