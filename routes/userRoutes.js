const express = require("express");
const router = express.Router();
const User = require("../models/user");


router.post('/', async (req, res) => {
  try {
      const user = new User(req.body);
      await user.save();
      res.status(201).send({ message: 'User created successfully', user });
  } catch (err) {
      res.status(500).send({ message: err.message });
  }
});
router.get('/all',async(req,res)=> {
  try {
    const users = await User.find()
    res.send(users)
  } catch (error) {
    
  }}
)

router.get('/:name',async(req,res)=> {
  try {
    const name = req.params.name
    const user = await User.findOne({name})
    if (user) {
      res.status(200).send(user)
    }else {
      res.status(404).send({message:"user not found"})
    }
  } catch (error) {
    
  }
})

module.exports = router;
