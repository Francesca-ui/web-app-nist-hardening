const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  due_date: {
    type: Date,
    required: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  owner: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("Todo", TodoSchema);