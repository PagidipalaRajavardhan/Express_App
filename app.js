const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const { response } = require("express");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("This is secret message"));
app.use(csrf("this_str_should_be_32_characters", ["POST", "PUT", "DELETE"]));

const path = require("path");

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const getCompleted = (x) => x.completed == true;
  const getInComplete = (x) => x.completed == false;

  const overdue = await Todo.getOverdueTodos();
  const dueToday = await Todo.getDueTodayTodos();
  const dueLater = await Todo.getDueLaterTodos();
  const inCompleteOverdue = overdue.filter(getInComplete);
  const inCompleteDueToday = dueToday.filter(getInComplete);
  const inCompleteDueLater = dueLater.filter(getInComplete);

  const completeTodos = overdue
    .filter(getCompleted)
    .concat(
      await dueToday.filter(getCompleted),
      await dueLater.filter(getCompleted)
    );

  if (request.accepts("html")) {
    response.render("index", {
      overdue,
      dueToday,
      dueLater,
      inCompleteOverdue,
      inCompleteDueToday,
      inCompleteDueLater,
      completeTodos,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      overdue,
      dueToday,
      dueLater,
      inCompleteOverdue,
      inCompleteDueToday,
      inCompleteDueLater,
      completeTodos,
    });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.findAll();
    return response.send(todos);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
    });
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.setCompletionStatus(todo.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true });
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
  // const todo = await Todo.findByPk(request.params.id);
  // try {
  //   if (todo === null) return response.send(false);
  //   else {
  //     const deletedTodosCount = await todo.destroy({
  //       where: { id: request.params.id },
  //     });
  //     return response.json(true);
  //   }
  // }
});

module.exports = app;
