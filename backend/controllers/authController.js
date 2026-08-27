const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user (admin only)
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, isTeamMember } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Determine role - only an authenticated admin can set roles, otherwise it defaults to employee
    let assignedRole = 'employee';
    if (req.user && req.user.role === 'admin' && role) {
      assignedRole = role;
    }

    // Determine department - only admin can assign
    let assignedDepartment = [];
    const validDepartments = ['faculty', 'tech', 'promotional', 'owners_club'];
    if (req.user && req.user.role === 'admin' && department) {
      if (Array.isArray(department)) {
        assignedDepartment = department.filter(d => validDepartments.includes(d));
      } else if (validDepartments.includes(department)) {
        assignedDepartment = [department];
      }
    }

    let assignedIsTeamMember = assignedRole === 'employee';
    if (isTeamMember !== undefined) {
      assignedIsTeamMember = isTeamMember === true || isTeamMember === 'true';
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      department: assignedDepartment,
      isTeamMember: assignedIsTeamMember
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to create user.' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed.' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user data.' });
  }
};

// Get all employees (admin only)
const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ isTeamMember: true })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Failed to get employees.' });
  }
};

// Get all users (for assigning tasks)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isTeamMember: true })
      .select('-password')
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to get users.' });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user.' });
  }
};

// Update current user profile
const updateProfile = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    // Only update allowed fields
    if (profilePicture !== undefined) {
      req.user.profilePicture = profilePicture;
    }
    
    await req.user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: req.user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

// Delete user (admin only)
const deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete an admin.' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Failed to delete employee.' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  getEmployees,
  getAllUsers,
  getUserById,
  deleteEmployee
};