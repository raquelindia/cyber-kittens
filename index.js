const express = require('express');
const app = express();
const { User, Kitten } = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(express.urlencoded({extended:true}));
const SALT_COUNT = 10;
const JWT_SECRET = process.env.JWT_SECRET;

app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware

const userData = async (req, res, next) => {
  const auth = req.header('Authorization');
  const [, token] = auth.split(' ');
  const decrypted =  jwt.verify(token, JWT_SECRET);
  req.user = user;
  next();
}

// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password


app.post('/register', async (req, res, next) => {
try {
const {username, password} = req.body;
const hashedPw = await bcrypt.hash(password, SALT_COUNT);
const {id, user} = User.create({
  username,
  password: hashedPw
});
const token = jwt.sign({id, username}, JWT_SECRET);
res.send({message: "success", token});
} catch(error){
  console.log(error);
  next(error);
};
});


// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB

app.post('/login', async (req, res, next) => {

  try {
    const {username, password} = req.body;
    const [user] = await User.findOne({where: {username}});
    if(user){
      const isAMatch = await bcrypt.compare(password, user.password);
      if(isAMatch){
      const token = jwt.sign(username, JWT_SECRET);
      res.send({message: 'success', token});
      };
    } else {
      res.sendStatus(401);
    }
  } 
  
  catch(error){
    console.log(error);
   next(error);
  }


});




// GET /kittens/:id
// TODO - takes an id and returns the cat with that id

app.get('/:id', async (req, res, next) => {
  const id = req.params.id;
  try {
    if(token){
    const getKitten = await Kitten.findByPk(id);
    res.send(getKitten);
    } else {
      res.sendStatus(401);
    }
  } catch(error){
    console.log(error);
    next(error);
  }
})

// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color

app.post('/kittens', async (req, res, setUser, next) => {
const name = req.body.name;
const age = req.body.age;
const color = req.body.color;

  
  try {
    if (!user){
      res.sendStatus(401);
    } else {
      const ownerId = req.user.id;
      const createKitten = await Kitten.create({
      name: name,
      age: age,
      color: color});
      res.status(201);
      res.send(createKitten);
}
} 
catch(error){
    console.log(error);
  }

});

// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
/*
app.delete('/:id', async (req, res, next) => {
const id = req.params.id;
const userId = req.user.id;

try {
    if(!user) {
      res.sendStatus(401);
    } else {
 const findKitten = await Kitten.findByPk({
  where: {ownerId}
 });
}


if(ownerId != userId){
  res.sendStatus(401);
} else {
  const deleteThis = await Kitten.delete({
    where: {id}
});
res.sendStatus(204);
}
} 
catch(error){
    console.log(error);
    next(error);
}
}
*/
// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
