const express = require('express');
const cors = require('cors');

const {v4: uuidv4} = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

const hasUserAccount = (request, response, next) => {
  const {username} = request.headers;
  const user = users.find(user => user.username === username);

  if (!user) {
    response.status(404).json({error: "User not found."});
  }

  request.user = user;
  next();
}

const hasTodo = (request) => {
  const {id} = request.params;
  const {user} = request;

  let todo = user.todos.find(todo => todo.id === id);

  if (!todo) {
    throw new Error("Todo not found")
  }

  return todo;
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  const isUserAlreadyRegistered = users.some(user => user.username === username)

  if (isUserAlreadyRegistered) {
    response.status(400).json({error: "User already registered."})
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.use(hasUserAccount);

app.get('/todos', (request, response) => {
  const {user} = request;
  response.status(200).json(user.todos)
});

app.post('/todos', (request, response) => {
  const {user} = request;
  const {title, deadline} = request.body;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  }

  user.todos.push(newTodo);
  response.status(201).json(newTodo);
});


app.put('/todos/:id', (request, response) => {
  const {title, deadline} = request.body;

  try {
    let todo = hasTodo(request);

    todo = {
      ...todo,
      title,
      deadline
    }

    response.json(todo)
  } catch (e) {
    response.status(404).json({error: e.message})
  }
});

app.patch('/todos/:id/done', (request, response) => {
  try {
    let todo = hasTodo(request);

    todo.done = true;

    response.json(todo)
  } catch (e) {
    response.status(404).json({error: e.message})
  }
});

app.delete('/todos/:id', (request, response) => {
  const {user} = request;

  try {
    let todo = hasTodo(request);

    user.todos.splice(todo, 1);

    response.status(204).send()
  } catch (e) {
    response.status(404).json({error: e.message})
  }
});

module.exports = app;