const User = require("../models/User");
const { ROADMAPS, buildRoadmapItems } = require("../config/roadmaps");
const Connection = require("../models/connection");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

const calculateProgress = (completedItems, totalItems) => {
  if (!totalItems) return 0;
  return Math.round((completedItems / totalItems) * 100);
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.selectDomain = async (req, res) => {
  try {
    const { selectedDomain, skillLevel } = req.body;

    if (!selectedDomain || !ROADMAPS[selectedDomain]) {
      return res.status(400).json({
        success: false,
        message: "Invalid domain selection"
      });
    }

    const update = { selectedDomain };
    if (skillLevel) update.skillLevel = skillLevel;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.selectedDomain !== selectedDomain) {
      update.completedRoadmapItems = [];
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, update, {
      new: true
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Domain updated successfully",
      data: updatedUser
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRoadmapProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.selectedDomain) {
      return res.status(200).json({
        success: true,
        data: {
          selectedDomain: null,
          progressPercentage: 0,
          roadmap: null,
          items: []
        }
      });
    }

    const roadmap = ROADMAPS[user.selectedDomain];
    const items = buildRoadmapItems(roadmap);
    const completedSet = new Set(user.completedRoadmapItems);
    const completedItems = items.filter((item) => completedSet.has(item.id));
    const progressPercentage = calculateProgress(completedItems.length, items.length);

    res.status(200).json({
      success: true,
      data: {
        selectedDomain: user.selectedDomain,
        skillLevel: user.skillLevel,
        progressPercentage,
        totalItems: items.length,
        completedCount: completedItems.length,
        roadmap,
        completedRoadmapItems: user.completedRoadmapItems
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleRoadmapItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, message: "itemId is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.selectedDomain) {
      return res.status(400).json({
        success: false,
        message: "Select a domain first"
      });
    }

    const items = buildRoadmapItems(ROADMAPS[user.selectedDomain]);
    const validItemIds = new Set(items.map((item) => item.id));

    if (!validItemIds.has(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid roadmap item for selected domain"
      });
    }

    const completedSet = new Set(user.completedRoadmapItems);
    if (completedSet.has(itemId)) {
      completedSet.delete(itemId);
    } else {
      completedSet.add(itemId);
    }

    user.completedRoadmapItems = Array.from(completedSet);
    await user.save();

    const progressPercentage = calculateProgress(
      user.completedRoadmapItems.length,
      items.length
    );

    res.status(200).json({
      success: true,
      message: "Progress updated",
      data: {
        completedRoadmapItems: user.completedRoadmapItems,
        progressPercentage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCommunityGuiders = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!student.selectedDomain) {
      return res.status(400).json({
        success: false,
        message: "Select a domain to join a community"
      });
    }

    const guiders = await User.find({
      role: "guider",
      selectedDomain: student.selectedDomain
    }).select("-password");

    res.status(200).json({
      success: true,
      data: {
        domain: student.selectedDomain,
        guiders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestGuiderConnection = async (req, res) => {
  try {
    const { guiderId } = req.params;
    const { message } = req.body;

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!student.selectedDomain) {
      return res.status(400).json({
        success: false,
        message: "Select a domain first"
      });
    }

    const guider = await User.findOne({
      _id: guiderId,
      role: "guider",
      selectedDomain: student.selectedDomain
    });

    if (!guider) {
      return res.status(404).json({
        success: false,
        message: "Guider not found in your selected community"
      });
    }

    const existingRequest = await Connection.findOne({
      student: student._id,
      guider: guider._id,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request already pending"
      });
    }

    const connection = await Connection.create({
      student: student._id,
      guider: guider._id,
      domain: student.selectedDomain,
      message: message || ""
    });

    res.status(201).json({
      success: true,
      message: "Connection request sent",
      data: connection
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyConnections = async (req, res) => {
  try {
    const connections = await Connection.find({ student: req.user.id })
      .populate("guider", "name email selectedDomain role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: connections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCommunityPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "title and content are required"
      });
    }

    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!student.selectedDomain) {
      return res.status(400).json({
        success: false,
        message: "Select a domain first"
      });
    }

    const post = await Post.create({
      author: student._id,
      domain: student.selectedDomain,
      title,
      content
    });

    res.status(201).json({
      success: true,
      message: "Post created",
      data: post
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCommunityPosts = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!student.selectedDomain) {
      return res.status(400).json({
        success: false,
        message: "Select a domain to view community posts"
      });
    }

    const posts = await Post.find({ domain: student.selectedDomain })
      .populate("author", "name role selectedDomain")
      .sort({ createdAt: -1 });

    const postIds = posts.map((post) => post._id);
    const comments = await Comment.find({ post: { $in: postIds } })
      .populate("author", "name role")
      .sort({ createdAt: 1 });

    const commentsByPost = comments.reduce((acc, comment) => {
      const postId = String(comment.post);
      if (!acc[postId]) acc[postId] = [];
      acc[postId].push(comment);
      return acc;
    }, {});

    const result = posts.map((post) => ({
      ...post.toObject(),
      comments: commentsByPost[String(post._id)] || []
    }));

    res.status(200).json({
      success: true,
      data: {
        domain: student.selectedDomain,
        posts: result
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCommunityComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "content is required"
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (!user.selectedDomain || user.selectedDomain !== post.domain) {
      return res.status(403).json({
        success: false,
        message: "You can comment only in your selected community"
      });
    }

    const comment = await Comment.create({
      post: post._id,
      author: user._id,
      content
    });

    res.status(201).json({
      success: true,
      message: "Comment added",
      data: comment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
